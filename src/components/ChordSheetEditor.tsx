import { useState, useCallback, useRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { useLocale } from '../i18n/context';
import { loadChordSheets, saveChordSheet, updateChordSheet, deleteChordSheet, type SavedChordSheet } from '../utils/storage';
import { extractYouTubeId } from '../utils/youtube';
import FloatingYouTubePlayer from './FloatingYouTubePlayer';
import LyricLine, { type LineTone } from './LyricLine';
import LineByLineView from './LineByLineView';
import LyricsImportBanner, { type LyricsLookupState } from './LyricsImportBanner';
import ChordSuggestions from './ChordSuggestions';
import { suggestNextChords } from '../utils/chordSuggestions';
import {
  findLyricsForVideo, searchLyrics, rankResults, isConfidentMatch, toImportedLyrics, remapLineTimes,
  type RankedResult,
} from '../utils/lyrics';
import type { YouTubeController } from '../utils/youtubeApi';

interface ChordPlacement {
  line: number;
  charIndex: number;
  chord: string;
}

interface PopoverState {
  line: number;
  charIndex: number;
  x: number;
  y: number;
  charHeight: number;
}

const POPOVER_WIDTH = 320;

type SheetView = 'line' | 'full';
const VIEW_KEY = 'chord_analyzer_sheet_view';

const IDLE_LOOKUP: LyricsLookupState = { status: 'idle', videoTitle: '', ranked: [], importedId: null, note: null };

// What an import replaced, so it can be undone
interface Snapshot {
  lyrics: string;
  placements: ChordPlacement[];
  lineTimes: (number | null)[] | null;
  sheetName: string;
  isEditing: boolean;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function loadView(): SheetView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'full' ? 'full' : 'line';
  } catch {
    return 'line';
  }
}

export interface ChordSheetEditorHandle {
  newSheet: () => void;
}

interface ChordSheetEditorProps {
  ref?: React.Ref<ChordSheetEditorHandle>;
}

export default function ChordSheetEditor({ ref }: ChordSheetEditorProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<ChordPlacement[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverInput, setPopoverInput] = useState('');
  const [savedSheets, setSavedSheets] = useState<SavedChordSheet[]>(() => loadChordSheets());
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Line-by-line transcribing
  const [view, setViewState] = useState<SheetView>(loadView);
  const [focusLine, setFocusLine] = useState(0);
  const [lineTimes, setLineTimes] = useState<(number | null)[] | null>(null);

  // The YouTube player, once it's ready
  const [controller, setController] = useState<YouTubeController | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [follow, setFollow] = useState(true);
  const stopAtRef = useRef<number | null>(null);   // "play this line" pauses here

  // Lyrics lookup from the video
  const [lookup, setLookup] = useState<LyricsLookupState>(IDLE_LOOKUP);
  const [undoImport, setUndoImport] = useState<Snapshot | null>(null);
  const lookupAbort = useRef<AbortController | null>(null);
  const lookedUpVideo = useRef<string | null>(null);
  const pendingLookup = useRef(false);   // "Find lyrics" clicked before the player was ready
  const [playerApiFailed, setPlayerApiFailed] = useState(false);

  const popoverInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => lyrics.split('\n'), [lyrics]);
  const videoId = extractYouTubeId(youtubeUrl);
  const navLines = useMemo(() => lines.flatMap((l, i) => (l.trim() ? [i] : [])), [lines]);
  const activeLine = navLines.includes(focusLine) ? focusLine : (navLines[0] ?? 0);
  const hasTimes = !!lineTimes?.some(t => t !== null);

  const setView = useCallback((v: SheetView) => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* preference only */ }
  }, []);

  // Line being sung right now: the one with the latest start time ≤ now
  const lineAt = useCallback((t: number, times: (number | null)[] | null) => {
    if (!times) return null;
    let best: number | null = null;
    times.forEach((lt, i) => {
      if (lt !== null && lt <= t + 0.15 && (best === null || lt >= (times[best] ?? -1))) best = i;
    });
    return best;
  }, []);
  const playbackLine = controller && hasTimes ? lineAt(currentTime, lineTimes) : null;

  // Values the playback timer reads without restarting on every change
  const live = useRef({ follow, popover, view, isEditing, lineTimes, lines });
  useEffect(() => {
    live.current = { follow, popover, view, isEditing, lineTimes, lines };
  });

  // Follow playback: update the clock, stop at the end of a replayed line, and
  // move the focus to the line being sung (unless a chord is being entered)
  useEffect(() => {
    if (!controller) return;
    const tick = () => {
      const t = controller.getTime();
      setCurrentTime(t);
      setDuration(controller.getDuration());
      if (stopAtRef.current !== null && t >= stopAtRef.current) {
        stopAtRef.current = null;
        controller.pause();
      }
      const s = live.current;
      if (s.follow && !s.popover && !s.isEditing && s.view === 'line' && controller.isPlaying()) {
        const li = lineAt(t, s.lineTimes);
        if (li !== null && s.lines[li]?.trim()) setFocusLine(li);
      }
    };
    const first = setTimeout(tick, 0);
    const timer = playing ? setInterval(tick, 200) : undefined;
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [controller, playing, lineAt]);

  // Auto-grow the lyrics textarea to fit its content instead of scrolling internally
  useEffect(() => {
    const el = lyricsTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [lyrics, isEditing]);

  // Focus input when popover opens
  useEffect(() => {
    if (popover) {
      setTimeout(() => popoverInputRef.current?.focus(), 10);
    }
  }, [popover]);

  // Close popover on click outside
  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
        setPopoverInput('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  const placeChord = useCallback((chordText: string) => {
    if (!popover) return;
    const chord = chordText.trim();
    if (!chord || !parseChordName(chord)) return;
    setPlacements(prev => {
      const filtered = prev.filter(p => !(p.line === popover.line && p.charIndex === popover.charIndex));
      return [...filtered, { line: popover.line, charIndex: popover.charIndex, chord }]
        .sort((a, b) => a.line - b.line || a.charIndex - b.charIndex);
    });
    setPopover(null);
    setPopoverInput('');
  }, [popover]);

  const confirmChord = useCallback(() => placeChord(popoverInput), [placeChord, popoverInput]);

  // Clues for the chord being placed, from the chord just before it
  const suggestionContext = useMemo(() => {
    if (!popover) return null;
    const before = placements
      .filter(p => p.line < popover.line || (p.line === popover.line && p.charIndex < popover.charIndex))
      .sort((a, b) => a.line - b.line || a.charIndex - b.charIndex)
      .map(p => p.chord);
    return suggestNextChords(before[before.length - 1] ?? null, before, isEn);
  }, [popover, placements, isEn]);

  const removeChord = useCallback((line: number, charIndex: number) => {
    setPlacements(prev => prev.filter(p => !(p.line === line && p.charIndex === charIndex)));
  }, []);

  const getChordsForLine = useCallback((lineIdx: number) => {
    return placements.filter(p => p.line === lineIdx);
  }, [placements]);

  const handleCharClick = useCallback((e: React.MouseEvent, line: number, charIndex: number) => {
    // If there's already a chord here, remove it
    const existing = placements.find(p => p.line === line && p.charIndex === charIndex);
    if (existing) {
      removeChord(line, charIndex);
      return;
    }
    // Open popover positioned above the clicked character
    const charRect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    // Keep the popover inside the card when clicking near its right edge
    const maxX = containerRect ? Math.max(0, containerRect.width - POPOVER_WIDTH - 8) : 0;
    const x = containerRect ? Math.min(charRect.left - containerRect.left, maxX) : 0;
    const y = containerRect ? charRect.top - containerRect.top : 0;
    setPopover({ line, charIndex, x, y, charHeight: charRect.height });
    setPopoverInput('');
  }, [placements, removeChord]);

  const isValidChord = popoverInput.trim() ? parseChordName(popoverInput.trim()) !== null : false;

  // Move to a line. With a timestamp, the video jumps there too; without one,
  // stepping to the next line while the song plays marks where it starts.
  const goToLine = useCallback((li: number, { markStart = false } = {}) => {
    setFocusLine(li);
    setPopover(null);
    if (!controller) return;
    const t = lineTimes?.[li] ?? null;
    if (t !== null) {
      stopAtRef.current = null;
      controller.seek(t);
      setCurrentTime(t);
    } else if (markStart && controller.isPlaying()) {
      const now = controller.getTime();
      setLineTimes(prev => {
        const next = prev ? [...prev] : lines.map(() => null);
        next[li] = now;
        return next;
      });
    }
  }, [controller, lineTimes, lines]);

  const stepLine = useCallback((dir: 1 | -1) => {
    const pos = navLines.indexOf(activeLine);
    const target = navLines[pos + dir];
    if (target !== undefined) goToLine(target, { markStart: dir === 1 });
  }, [navLines, activeLine, goToLine]);

  const togglePlay = useCallback(() => {
    if (!controller) return;
    if (controller.isPlaying()) controller.pause();
    else controller.play();
  }, [controller]);

  const skipBy = useCallback((delta: number) => {
    if (!controller) return;
    stopAtRef.current = null;
    const t = Math.max(0, controller.getTime() + delta);
    controller.seek(t);
    setCurrentTime(t);
  }, [controller]);

  // Replay the focused line: from its start, pausing where the next line begins
  const playLine = useCallback(() => {
    const start = lineTimes?.[activeLine];
    if (!controller || start === null || start === undefined) return;
    const pos = navLines.indexOf(activeLine);
    const nextStart = navLines.slice(pos + 1).map(li => lineTimes?.[li] ?? null).find((t): t is number => t !== null && t > start);
    stopAtRef.current = nextStart ?? null;
    controller.seek(start);
    setCurrentTime(start);
    controller.play();
    // Stop right as the next line starts; the 200ms playback poll alone
    // would let its first syllable through
    if (nextStart !== undefined) {
      const stopAt = nextStart;
      setTimeout(() => {
        if (stopAtRef.current === stopAt && controller.getTime() >= stopAt - 0.25) {
          stopAtRef.current = null;
          controller.pause();
        }
      }, (stopAt - start) * 1000);
    }
  }, [controller, lineTimes, activeLine, navLines]);

  // Keyboard: ← → jump 5s, Space play/pause, ↑ ↓ change line, R replay line.
  // Ignored while typing, with modifier keys, and for Space on a focused button.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (e.key === ' ' && target?.closest('button, a, [role="button"]')) return;

      const lineMode = !isEditing && view === 'line';
      let handled = true;
      if (e.key === 'ArrowLeft' && controller) skipBy(-5);
      else if (e.key === 'ArrowRight' && controller) skipBy(5);
      else if (e.key === ' ' && controller) togglePlay();
      else if (e.key === 'ArrowUp' && lineMode) stepLine(-1);
      else if (e.key === 'ArrowDown' && lineMode) stepLine(1);
      else if ((e.key === 'r' || e.key === 'R') && lineMode && controller) playLine();
      else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, isEditing, view, skipBy, togglePlay, stepLine, playLine]);

  // ---------- Lyrics from the video ----------

  const lyricsRef = useRef(lyrics);
  const placementsRef = useRef(placements);
  useEffect(() => { lyricsRef.current = lyrics; placementsRef.current = placements; });

  const snapshot = useCallback((): Snapshot => ({
    lyrics: lyricsRef.current, placements: placementsRef.current, lineTimes, sheetName, isEditing,
  }), [lineTimes, sheetName, isEditing]);

  const importLyrics = useCallback((r: RankedResult) => {
    const imported = toImportedLyrics(r.result);
    if (!imported) return;
    const currentLines = lyricsRef.current.split('\n');
    const nonEmpty = currentLines.filter(l => l.trim()).length;

    if (nonEmpty > 0) {
      // Same song already in the editor: keep its text and chords, add timing
      if (imported.times) {
        const times = remapLineTimes(imported.lines, imported.times, currentLines);
        const matched = times?.filter(t => t !== null).length ?? 0;
        if (matched >= nonEmpty * 0.5) {
          setUndoImport(snapshot());
          setLineTimes(times);
          setLookup(s => ({
            ...s, importedId: r.result.id,
            note: isEn ? `Timing added to ${matched} of ${nonEmpty} lines; chords kept.` : `已为 ${matched}/${nonEmpty} 句加上时间轴，和弦保留。`,
          }));
          return;
        }
      }
      const msg = isEn
        ? 'Replace the current lyrics? Chords placed on them will be removed.'
        : '替换当前歌词？已经放置的和弦会被清除。';
      if (placementsRef.current.length && !window.confirm(msg)) return;
    }

    setUndoImport(snapshot());
    setLyrics(imported.lines.join('\n'));
    setLineTimes(imported.times);
    setPlacements([]);
    setSheetName(name => name.trim() ? name : r.result.trackName);
    setIsEditing(false);
    setView('line');
    setFocusLine(0);
    setPopover(null);
    setLookup(s => ({ ...s, importedId: r.result.id, note: null }));
  }, [snapshot, isEn, setView]);

  const handleUndoImport = useCallback(() => {
    if (!undoImport) return;
    setLyrics(undoImport.lyrics);
    setPlacements(undoImport.placements);
    setLineTimes(undoImport.lineTimes);
    setSheetName(undoImport.sheetName);
    setIsEditing(undoImport.isEditing);
    setUndoImport(null);
    setLookup(s => ({ ...s, importedId: null, note: null }));
  }, [undoImport]);

  // Look up lyrics from the video title, or from a name the user typed
  const runLookup = useCallback(async (query?: string) => {
    if (!controller && !query) return;
    lookupAbort.current?.abort();
    const abort = new AbortController();
    lookupAbort.current = abort;

    // Title and length can arrive a moment after the player is ready
    let info = controller?.getInfo() ?? { title: '', author: '' };
    let length = controller?.getDuration() ?? 0;
    for (let i = 0; controller && i < 15 && (!info.title || !length); i++) {
      await sleep(200);
      info = controller.getInfo();
      length = controller.getDuration();
    }
    if (abort.signal.aborted) return;

    setLookup({ ...IDLE_LOOKUP, status: 'searching', videoTitle: query ?? info.title });
    try {
      const ranked = query
        ? rankResults(await searchLyrics(query, abort.signal), query, '', length)
        : await findLyricsForVideo(info.title, info.author, length, abort.signal);
      if (abort.signal.aborted) return;
      if (!ranked.length) {
        setLookup(s => ({ ...s, status: 'none' }));
        return;
      }
      setLookup(s => ({ ...s, status: 'found', ranked }));
      // Import straight away only when it's clearly the right song and the
      // editor is still empty; otherwise the user picks from the list
      if (!query && isConfidentMatch(ranked[0]) && !lyricsRef.current.trim()) importLyrics(ranked[0]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setLookup(s => ({ ...s, status: 'error' }));
    }
  }, [controller, importLyrics]);

  // Once the player is ready: run a lookup the user asked for while it was
  // loading, or — for a new video and an empty editor — look up automatically
  useEffect(() => {
    if (!controller || !videoId) return;
    const requested = pendingLookup.current;
    if (!requested && (lookedUpVideo.current === videoId || lyricsRef.current.trim())) return;
    pendingLookup.current = false;
    lookedUpVideo.current = videoId;
    const t = setTimeout(() => void runLookup(), 0);
    return () => clearTimeout(t);
  }, [controller, videoId, runLookup]);

  const requestLookup = useCallback(() => {
    if (controller) void runLookup();
    // No player API means no video title to search with: ask for a name
    else if (playerApiFailed) setLookup({ ...IDLE_LOOKUP, status: 'manual' });
    else {
      pendingLookup.current = true;
      setShowPlayer(true);
      setLookup({ ...IDLE_LOOKUP, status: 'searching' });
    }
  }, [controller, playerApiFailed, runLookup]);

  const handlePlayerApiUnavailable = useCallback(() => {
    setPlayerApiFailed(true);
    if (pendingLookup.current) {
      pendingLookup.current = false;
      setLookup({ ...IDLE_LOOKUP, status: 'manual' });
    }
  }, []);

  useEffect(() => () => lookupAbort.current?.abort(), []);

  const handleYoutubeUrlChange = useCallback((value: string, input: HTMLInputElement) => {
    const id = extractYouTubeId(value);
    // Pasting a new video opens it, which also starts the lyrics lookup. The
    // link is complete, so leave the field: otherwise Space and the arrow keys
    // would keep typing into it instead of controlling playback.
    if (id && id !== extractYouTubeId(youtubeUrl)) {
      setShowPlayer(true);
      input.blur();
    }
    setYoutubeUrl(value);
  }, [youtubeUrl]);

  const handleLyricsChange = useCallback((value: string) => {
    setLineTimes(prev => remapLineTimes(lines, prev, value.split('\n')));
    setLyrics(value);
  }, [lines]);

  const handleSaveSheet = useCallback(() => {
    if (!lyrics.trim() || !placements.length) return;
    let name = sheetName.trim();
    if (!name) {
      const firstLine = lyrics.split('\n').find(l => l.trim()) || '';
      name = firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '');
    }
    const trimmedUrl = youtubeUrl.trim() || undefined;
    const times = lineTimes ?? undefined;
    if (currentSheetId) {
      updateChordSheet(currentSheetId, { name, lyrics, placements, youtubeUrl: trimmedUrl, lineTimes: times });
    } else {
      const entry = saveChordSheet({ name, lyrics, placements, youtubeUrl: trimmedUrl, lineTimes: times });
      setCurrentSheetId(entry.id);
    }
    setSheetName(name);
    setSavedSheets(loadChordSheets());
  }, [lyrics, placements, sheetName, currentSheetId, youtubeUrl, lineTimes]);

  const handleNewSheet = useCallback(() => {
    const hasUnsavedContent = !currentSheetId && (lyrics.trim().length > 0 || placements.length > 0);
    if (hasUnsavedContent) {
      const msg = isEn
        ? 'Start a new chord sheet? Unsaved changes will be lost.'
        : '开始新的和弦谱？未保存的更改将会丢失。';
      if (!window.confirm(msg)) return;
    }
    setLyrics('');
    setPlacements([]);
    setIsEditing(true);
    setPopover(null);
    setPopoverInput('');
    setCurrentSheetId(null);
    setSheetName('');
    setYoutubeUrl('');
    setShowYoutubeInput(false);
    setShowPlayer(false);
    setLineTimes(null);
    setFocusLine(0);
    setLookup(IDLE_LOOKUP);
    setUndoImport(null);
    lookupAbort.current?.abort();
    lookedUpVideo.current = null;
  }, [lyrics, placements, currentSheetId, isEn]);

  useImperativeHandle(ref, () => ({ newSheet: handleNewSheet }), [handleNewSheet]);

  const handleLoadSheet = useCallback((sheet: SavedChordSheet) => {
    setLyrics(sheet.lyrics);
    setPlacements(sheet.placements);
    setIsEditing(false);
    setCurrentSheetId(sheet.id);
    setSheetName(sheet.name);
    setYoutubeUrl(sheet.youtubeUrl || '');
    setShowYoutubeInput(!!sheet.youtubeUrl);
    setShowPlayer(false);
    setPopover(null);
    setLineTimes(sheet.lineTimes ?? null);
    setFocusLine(0);
    setLookup(IDLE_LOOKUP);
    setUndoImport(null);
    lookupAbort.current?.abort();
    lookedUpVideo.current = sheet.youtubeUrl ? extractYouTubeId(sheet.youtubeUrl) : null;
  }, []);

  const handleDeleteSheet = useCallback((id: string) => {
    deleteChordSheet(id);
    setSavedSheets(loadChordSheets());
    if (currentSheetId === id) {
      setCurrentSheetId(null);
      setSheetName('');
      setYoutubeUrl('');
      setShowYoutubeInput(false);
      setShowPlayer(false);
    }
  }, [currentSheetId]);

  const handleRenameSheet = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) { setEditingNameId(null); return; }
    updateChordSheet(id, { name: trimmed });
    setSavedSheets(loadChordSheets());
    if (currentSheetId === id) setSheetName(trimmed);
    setEditingNameId(null);
  }, [currentSheetId]);

  const handleExportPng = useCallback(async () => {
    if (isExporting) return;
    // The image is of the whole sheet, so render the full view for it
    const restoreView = view;
    if (view !== 'full') flushSync(() => setViewState('full'));
    if (!exportRef.current) return;
    setPopover(null);
    setIsExporting(true);
    const container = exportRef.current;
    const displayName = sheetName.trim() || (isEn ? 'Untitled' : '未命名');
    const titleEl = document.createElement('div');
    titleEl.textContent = displayName;
    titleEl.style.fontSize = '24px';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = '#111827';
    titleEl.style.marginBottom = '8px';
    container.insertBefore(titleEl, container.firstChild);
    try {
      const dataUrl = await toPng(container, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const safeName = (sheetName.trim() || (isEn ? 'chord-sheet' : '和弦谱')).replace(/[\\/:*?"<>|]/g, '_');
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export chord sheet as PNG', err);
    } finally {
      container.removeChild(titleEl);
      setIsExporting(false);
      if (restoreView !== 'full') setViewState(restoreView);
    }
  }, [sheetName, isEn, isExporting, view]);

  // Chord entry, shown above the clicked character in either view
  const popoverNode = popover && (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 space-y-2"
      // Line view opens it below the character, over the preview lines, so the
      // line above and the playback controls stay visible
      style={view === 'line'
        ? { left: popover.x, top: popover.y + popover.charHeight + 8, width: POPOVER_WIDTH }
        : { left: popover.x, top: popover.y - 8, transform: 'translateY(-100%)', width: POPOVER_WIDTH }}
    >
      <div className="flex items-center gap-2">
        <input
          ref={popoverInputRef}
          value={popoverInput}
          onChange={e => setPopoverInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') confirmChord();
            if (e.key === 'Escape') { setPopover(null); setPopoverInput(''); }
          }}
          placeholder={isEn ? 'Chord name...' : '和弦名...'}
          className={`w-32 px-3 py-1.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${
            popoverInput.trim()
              ? isValidChord
                ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700 bg-green-50'
                : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700 bg-red-50'
              : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
          }`}
        />
        <button
          onClick={confirmChord}
          disabled={!isValidChord}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          ✓
        </button>
      </div>
      {/* Mini chord preview */}
      {popoverInput.trim() && isValidChord && (() => {
        const parsed = parseChordName(popoverInput.trim())!;
        const f = getGuitarFingerings(parsed.root, parsed.type)[0];
        return f ? (
          <div className="flex justify-center">
            <div className="w-20">
              <ChordDiagram fingering={f} chordName={parsed.root + (parsed.chordType?.symbol || '')} size="small" interactive={false} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-center text-gray-500 font-medium">{popoverInput.trim()}</p>
        );
      })()}
      {/* Can't hear it? Likely chords after the previous one */}
      {!popoverInput.trim() && suggestionContext && (
        <ChordSuggestions context={suggestionContext} isEn={isEn} onPick={placeChord} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
      {/* Left: saved sheets sidebar */}
      <div className="order-2 md:order-1 w-full md:w-64 shrink-0 space-y-2">
        <span className="text-sm text-gray-400">{isEn ? 'Saved sheets' : '已保存的谱'} ({savedSheets.length})</span>
        {savedSheets.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {savedSheets.map(sheet => (
              <div
                key={sheet.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentSheetId === sheet.id
                    ? 'bg-white border border-gray-900'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleLoadSheet(sheet)}
              >
                <div className="flex-1 min-w-0">
                  {editingNameId === sheet.id ? (
                    <input
                      autoFocus
                      value={editingNameValue}
                      onChange={e => setEditingNameValue(e.target.value)}
                      onBlur={() => handleRenameSheet(sheet.id, editingNameValue)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSheet(sheet.id, editingNameValue);
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-500"
                    />
                  ) : (
                    <div
                      className="text-sm font-medium text-gray-700 truncate hover:underline decoration-gray-300 cursor-text"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingNameId(sheet.id);
                        setEditingNameValue(sheet.name);
                      }}
                      title={isEn ? 'Click to rename' : '点击重命名'}
                    >
                      {sheet.name}
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    {sheet.placements.length} {isEn ? 'chords' : '个和弦'}
                    {' · '}
                    {new Date(sheet.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-300 italic">{isEn ? 'No saved sheets yet' : '暂无已保存的谱'}</p>
        )}
      </div>

      {/* Right: workspace */}
      <div className="order-1 md:order-2 flex-1 min-w-0 space-y-3 bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between gap-x-3 gap-y-2 flex-wrap">
        <span className="text-base font-medium text-gray-900 shrink-0">
          {isEn ? 'Chord Sheet Editor' : '和弦谱编辑器'}
        </span>
        {placements.length > 0 && (
          <input
            value={sheetName}
            onChange={e => setSheetName(e.target.value)}
            placeholder={isEn ? 'Song name...' : '歌曲名称...'}
            className="flex-1 min-w-32 px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowYoutubeInput(v => !v)}
            className={`text-sm transition-colors cursor-pointer flex items-center gap-1 ${
              showYoutubeInput ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
            title={isEn ? 'Add YouTube link' : '添加YouTube链接'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
            </svg>
            YouTube
          </button>
          {placements.length > 0 && (
            <button
              onClick={handleSaveSheet}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {isEn ? 'Save' : '保存'}
            </button>
          )}
          {!isEditing && placements.length > 0 && (
            <button
              onClick={handleExportPng}
              disabled={isExporting}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
              </svg>
              {isExporting ? (isEn ? 'Exporting...' : '导出中...') : (isEn ? 'Export PNG' : '导出图片')}
            </button>
          )}
          {placements.length > 0 && (
            <button
              onClick={() => setPlacements([])}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {isEn ? 'Clear chords' : '清除和弦'}
            </button>
          )}
        </div>
      </div>

      {showYoutubeInput && (
        <div className="flex items-center gap-2">
          <input
            value={youtubeUrl}
            onChange={e => handleYoutubeUrlChange(e.target.value, e.target)}
            placeholder={isEn ? 'Paste a YouTube link...' : '粘贴YouTube链接...'}
            className={`flex-1 min-w-0 px-3 py-1.5 text-sm bg-white border rounded-lg placeholder-gray-300 focus:outline-none focus:ring-1 ${
              youtubeUrl.trim()
                ? videoId
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700'
                  : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700'
                : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
            }`}
          />
          <button
            onClick={() => setShowPlayer(v => !v)}
            disabled={!videoId}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            {showPlayer ? (isEn ? 'Hide player' : '隐藏播放器') : (isEn ? 'Open player' : '打开播放器')}
          </button>
          {videoId && lookup.status === 'idle' && (
            <button
              // Without the player API there's no video title to go on, so
              // open the search box instead
              onClick={requestLookup}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              {isEn ? 'Find lyrics' : '查找歌词'}
            </button>
          )}
        </div>
      )}

      {lookup.status !== 'idle' && (
        <LyricsImportBanner
          state={lookup}
          isEn={isEn}
          onImport={importLyrics}
          onSearch={q => void runLookup(q)}
          onUndo={undoImport ? handleUndoImport : undefined}
          onDismiss={() => { lookupAbort.current?.abort(); setLookup(IDLE_LOOKUP); }}
        />
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={lyricsTextareaRef}
            value={lyrics}
            onChange={e => handleLyricsChange(e.target.value)}
            placeholder={isEn
              ? 'Paste lyrics here...\n\nExample:\nYesterday, all my troubles seemed so far away\nNow it looks as though they\'re here to stay'
              : '粘贴歌词...\n\n例如：\n已经为了变的更好去掉锋芒\n一不小心成了你的倾诉对象'}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 min-h-32 resize-none overflow-hidden"
          />
          {lyrics.trim() && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-base font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors"
            >
              {isEn ? 'Place Chords' : '开始放置和弦'} →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
            >
              ← {isEn ? 'Edit lyrics' : '编辑歌词'}
            </button>
            {/* One line at a time, or the whole sheet */}
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
              {(['line', 'full'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setPopover(null); }}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                    view === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {v === 'line' ? (isEn ? 'Line by line' : '逐句') : (isEn ? 'Full sheet' : '全文')}
                </button>
              ))}
            </div>
            {view === 'full' && (
              <span className="text-sm text-gray-400">
                {isEn ? 'Click lyrics to place chord, click chord to remove' : '点击歌词放置和弦，点击和弦删除'}
              </span>
            )}
          </div>

          {view === 'line' && (
            <LineByLineView
              lines={lines}
              navLines={navLines}
              focusLine={activeLine}
              chordsForLine={getChordsForLine}
              onFocusLine={li => goToLine(li)}
              onCharClick={handleCharClick}
              onChordClick={removeChord}
              containerRef={containerRef}
              isEn={isEn}
              transport={controller ? {
                playing,
                time: currentTime,
                duration,
                hasTimes,
                canPlayLine: lineTimes?.[activeLine] != null,
                follow,
                onToggle: togglePlay,
                onSkip: skipBy,
                onPlayLine: playLine,
                onFollowChange: setFollow,
              } : null}
            >
              {popoverNode}
            </LineByLineView>
          )}

          {view === 'full' && (

          <div ref={exportRef} className="space-y-3 bg-white">
          {/* Lyrics with chord placement */}
          <div ref={containerRef} className="bg-white rounded-xl p-5 space-y-0 select-none relative">
            {lines.map((line, li) => {
              const lineChords = getChordsForLine(li);
              if (!line.trim() && !lineChords.length) return <div key={li} className="h-4" />;
              // While a synced video plays: sung lines dark, the rest light
              const tone: LineTone = playbackLine === null
                ? 'normal'
                : li === playbackLine ? 'current' : li < playbackLine ? 'sung' : 'upcoming';
              return (
                <LyricLine
                  key={li}
                  line={line}
                  chords={lineChords}
                  fontPx={16}
                  tone={tone}
                  onCharClick={(e, ci) => handleCharClick(e, li, ci)}
                  onChordClick={ci => removeChord(li, ci)}
                  chordTitle={isEn ? 'Click to remove' : '点击删除'}
                />
              );
            })}

            {popoverNode}
          </div>

          {/* Chord legend */}
          {placements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{isEn ? 'Chords used' : '使用的和弦'}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex gap-3 flex-wrap">
                {[...new Set(placements.map(p => p.chord))].map(chord => {
                  const parsed = parseChordName(chord);
                  if (!parsed) return null;
                  const f = getGuitarFingerings(parsed.root, parsed.type)[0];
                  return (
                    <div key={chord} className="flex flex-col items-center">
                      {f ? (
                        <ChordDiagram fingering={f} chordName="" size="small" interactive={false} />
                      ) : (
                        <div className="w-16 h-24 flex items-center justify-center text-base font-bold text-gray-900">{chord}</div>
                      )}
                      <span className="text-sm font-semibold text-gray-700 mt-1">{chord}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
          )}
        </div>
      )}
      </div>

      {showPlayer && videoId && (
        <FloatingYouTubePlayer
          videoId={videoId}
          onClose={() => setShowPlayer(false)}
          onController={setController}
          onPlayingChange={setPlaying}
          onApiUnavailable={handlePlayerApiUnavailable}
        />
      )}
    </div>
  );
}
