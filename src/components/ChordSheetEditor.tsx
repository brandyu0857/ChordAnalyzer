import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import ChordLegend from './ChordLegend';
import Modal from './Modal';
import { useLocale } from '../i18n/context';
import { loadChordSheets, saveChordSheet, updateChordSheet, type SavedChordSheet } from '../utils/storage';
import { extractYouTubeId } from '../utils/youtube';
import YouTubePlayer from './YouTubePlayer';
import LyricLine, { type LineTone } from './LyricLine';
import LineByLineView from './LineByLineView';
import LyricsImportBanner, { type LyricsLookupState } from './LyricsImportBanner';
import ChordSuggestions from './ChordSuggestions';
import { suggestNextChords } from '../utils/chordSuggestions';
import {
  findLyricsForVideo, searchLyricsByName, isConfidentMatch, toImportedLyrics, remapLineTimes,
  type RankedResult,
} from '../utils/lyrics';
import { usePlayback, usePlaybackKeys, lineAtTime } from '../hooks/usePlayback';

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

// What gets saved, for telling whether there are unsaved changes
function contentKey(c: { lyrics: string; placements: ChordPlacement[]; youtubeUrl: string; lineTimes: (number | null)[] | null; name: string }) {
  return JSON.stringify([c.lyrics, c.placements, c.youtubeUrl.trim(), c.lineTimes, c.name.trim()]);
}

interface ChordSheetEditorProps {
  /** The sheet to edit, or null for a new one */
  sheet: SavedChordSheet | null;
  /** Where to start the video (continuing from the play view) */
  startAt?: number;
  onSaved: (sheet: SavedChordSheet) => void;
  /** Called with the video position and the sheet's id once saved, so the
   *  play view can continue the same song from there */
  onClose: (lastTime: number, sheetId: string | null) => void;
}

/**
 * The chord sheet editor, in a modal: YouTube link and player, lyrics (typed,
 * pasted or looked up from the video), chord placement line by line or on the
 * whole sheet, chord hints, syncing lyrics to the video, save and export.
 */
export default function ChordSheetEditor({ sheet, startAt = 0, onSaved, onClose }: ChordSheetEditorProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [sheetId, setSheetId] = useState<string | null>(sheet?.id ?? null);
  const [lyrics, setLyrics] = useState(sheet?.lyrics ?? '');
  const [placements, setPlacements] = useState<ChordPlacement[]>(sheet?.placements ?? []);
  const [isEditing, setIsEditing] = useState(!sheet?.lyrics.trim());
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverInput, setPopoverInput] = useState('');
  const [sheetName, setSheetName] = useState(sheet?.name ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(sheet?.youtubeUrl ?? '');
  const [isExporting, setIsExporting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Line-by-line transcribing
  const [view, setViewState] = useState<SheetView>(loadView);
  const [focusLine, setFocusLine] = useState(0);
  const [lineTimes, setLineTimes] = useState<(number | null)[] | null>(sheet?.lineTimes ?? null);
  const [follow, setFollow] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [savedKey, setSavedKey] = useState(() => contentKey({
    lyrics: sheet?.lyrics ?? '', placements: sheet?.placements ?? [], youtubeUrl: sheet?.youtubeUrl ?? '',
    lineTimes: sheet?.lineTimes ?? null, name: sheet?.name ?? '',
  }));

  // Lyrics lookup from the video
  const [lookup, setLookup] = useState<LyricsLookupState>(IDLE_LOOKUP);
  const [undoImport, setUndoImport] = useState<Snapshot | null>(null);
  const lookupAbort = useRef<AbortController | null>(null);
  // An existing sheet's video isn't looked up again automatically
  const lookedUpVideo = useRef<string | null>(sheet?.youtubeUrl ? extractYouTubeId(sheet.youtubeUrl) : null);
  const pendingLookup = useRef(false);   // "Find lyrics" clicked before the player was ready

  const popoverInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => lyrics.split('\n'), [lyrics]);
  const videoId = extractYouTubeId(youtubeUrl);
  const initialVideoId = useRef(sheet?.youtubeUrl ? extractYouTubeId(sheet.youtubeUrl) : null);
  const navLines = useMemo(() => lines.flatMap((l, i) => (l.trim() ? [i] : [])), [lines]);
  const activeLine = navLines.includes(focusLine) ? focusLine : (navLines[0] ?? 0);
  const hasTimes = !!lineTimes?.some(t => t !== null);
  const dirty = contentKey({ lyrics, placements, youtubeUrl, lineTimes, name: sheetName }) !== savedKey;

  const setView = useCallback((v: SheetView) => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* preference only */ }
  }, []);

  // ---------- Playback ----------

  const lookupRequestRef = useRef<() => void>(() => {});
  const pb = usePlayback({
    // No player API, no video title to search with: ask for a name instead
    onApiUnavailable: () => lookupRequestRef.current(),
  });
  const { controller } = pb;
  const playbackLine = controller && hasTimes ? lineAtTime(pb.time, lineTimes) : null;

  // Follow the song: move the focus to the line being sung, unless a chord
  // is being entered or lines are being marked
  useEffect(() => {
    pb.onTickRef.current = (t: number) => {
      if (!follow || popover || isEditing || view !== 'line' || syncing) return;
      const li = lineAtTime(t, lineTimes);
      if (li !== null && lines[li]?.trim()) setFocusLine(li);
    };
  });

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

  // ---------- Chords ----------

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

  // ---------- Lines ----------

  // Move to a line; with a timestamp the video jumps there too
  const goToLine = useCallback((li: number) => {
    setFocusLine(li);
    setPopover(null);
    const t = lineTimes?.[li] ?? null;
    if (t !== null && !syncing) pb.seekTo(t);
  }, [lineTimes, syncing, pb]);

  const stepLine = useCallback((dir: 1 | -1) => {
    const pos = navLines.indexOf(activeLine);
    const target = navLines[pos + dir];
    if (target !== undefined) goToLine(target);
  }, [navLines, activeLine, goToLine]);

  // Replay the focused line: from its start, pausing where the next line begins
  const playLine = useCallback(() => {
    const start = lineTimes?.[activeLine];
    if (start === null || start === undefined) return;
    const pos = navLines.indexOf(activeLine);
    const nextStart = navLines.slice(pos + 1).map(li => lineTimes?.[li] ?? null)
      .find((t): t is number => t !== null && t > start);
    pb.playRange(start, nextStart);
  }, [lineTimes, activeLine, navLines, pb]);

  // Sync session: the highlighted line gets the current video time when it
  // starts being sung, then the next line is highlighted
  const startSync = useCallback(() => {
    setSyncing(true);
    setPopover(null);
    setFocusLine(navLines[0] ?? 0);
    if (pb.controller && !pb.controller.isPlaying()) pb.controller.play();
  }, [navLines, pb.controller]);

  const markLine = useCallback(() => {
    if (!pb.controller) return;
    const now = pb.controller.getTime();
    setLineTimes(prev => {
      const next = prev && prev.length === lines.length ? [...prev] : lines.map((_, i) => prev?.[i] ?? null);
      next[activeLine] = now;
      // Later lines marked in an earlier pass would now be out of order
      for (let i = activeLine + 1; i < next.length; i++) {
        const t = next[i];
        if (t !== null && t < now) next[i] = null;
      }
      return next;
    });
    const pos = navLines.indexOf(activeLine);
    if (pos + 1 < navLines.length) setFocusLine(navLines[pos + 1]);
    else setSyncing(false);   // last line marked: done
  }, [pb.controller, lines, activeLine, navLines]);

  // Keyboard: ← → Space (usePlaybackKeys) plus, line by line: ↑ ↓ change line,
  // R replay line; while syncing ↓ / Enter mark the line
  const lineMode = !isEditing && view === 'line';
  usePlaybackKeys(pb, e => {
    if (!lineMode) return false;
    const onButton = !!(e.target as HTMLElement | null)?.closest('button');
    if (syncing && (e.key === 'ArrowDown' || (e.key === 'Enter' && !onButton))) { markLine(); return true; }
    if (e.key === 'ArrowUp') { stepLine(-1); return true; }
    if (e.key === 'ArrowDown') { stepLine(1); return true; }
    if ((e.key === 'r' || e.key === 'R') && pb.controller) { playLine(); return true; }
    return false;
  });

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
        ? await searchLyricsByName(query, length, abort.signal)
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
    else if (pb.apiFailed) setLookup({ ...IDLE_LOOKUP, status: 'manual' });
    else {
      pendingLookup.current = true;
      setLookup({ ...IDLE_LOOKUP, status: 'searching' });
    }
  }, [controller, pb.apiFailed, runLookup]);

  // The player API failed while a lookup was waiting for it
  useEffect(() => {
    lookupRequestRef.current = () => {
      if (!pendingLookup.current) return;
      pendingLookup.current = false;
      setLookup({ ...IDLE_LOOKUP, status: 'manual' });
    };
  });

  useEffect(() => () => lookupAbort.current?.abort(), []);

  const handleYoutubeUrlChange = useCallback((value: string, input: HTMLInputElement) => {
    // A complete link: leave the field, otherwise Space and the arrow keys
    // would keep typing into it instead of controlling playback
    const id = extractYouTubeId(value);
    if (id && id !== extractYouTubeId(youtubeUrl)) input.blur();
    setYoutubeUrl(value);
  }, [youtubeUrl]);

  const handleLyricsChange = useCallback((value: string) => {
    setLineTimes(prev => remapLineTimes(lines, prev, value.split('\n')));
    setLyrics(value);
  }, [lines]);

  // ---------- Save / close / export ----------

  const canSave = !!(lyrics.trim() || youtubeUrl.trim());

  const handleSave = useCallback(() => {
    if (!canSave) return;
    let name = sheetName.trim();
    if (!name) {
      const firstLine = lyrics.split('\n').find(l => l.trim()) || '';
      name = firstLine
        ? firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '')
        : (isEn ? 'Untitled' : '未命名');
    }
    const trimmedUrl = youtubeUrl.trim() || undefined;
    const times = lineTimes ?? undefined;
    let id = sheetId;
    if (id) {
      updateChordSheet(id, { name, lyrics, placements, youtubeUrl: trimmedUrl, lineTimes: times });
    } else {
      id = saveChordSheet({ name, lyrics, placements, youtubeUrl: trimmedUrl, lineTimes: times }).id;
      setSheetId(id);
    }
    setSheetName(name);
    setSavedKey(contentKey({ lyrics, placements, youtubeUrl, lineTimes, name }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    const saved = loadChordSheets().find(s => s.id === id);
    if (saved) onSaved(saved);
  }, [canSave, sheetName, lyrics, placements, youtubeUrl, lineTimes, sheetId, isEn, onSaved]);

  // Esc and ✕: first leave whatever is in progress, then close (asking about
  // unsaved changes)
  const requestClose = useCallback(() => {
    if (popover) { setPopover(null); setPopoverInput(''); return; }
    if (syncing) { setSyncing(false); return; }
    if (dirty) {
      const msg = isEn ? 'You have unsaved changes. Close without saving?' : '有未保存的修改，确定不保存就关闭吗？';
      if (!window.confirm(msg)) return;
    }
    onClose(pb.time, sheetId);
  }, [popover, syncing, dirty, isEn, onClose, pb.time, sheetId]);

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

  // ---------- Render ----------

  // Chord entry, shown next to the clicked character in either view
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
            // Close just the popover, not the whole editor
            if (e.key === 'Escape') { e.stopPropagation(); setPopover(null); setPopoverInput(''); }
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

  const headerBtn = 'h-8 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap';

  return (
    <Modal
      title={sheet ? (isEn ? 'Edit chord sheet' : '编辑和弦谱') : (isEn ? 'New chord sheet' : '新建和弦谱')}
      closeLabel={isEn ? 'Close editor' : '关闭编辑'}
      onRequestClose={requestClose}
      actions={
        <>
          <input
            value={sheetName}
            onChange={e => setSheetName(e.target.value)}
            placeholder={isEn ? 'Song name...' : '歌曲名称...'}
            aria-label={isEn ? 'Song name' : '歌曲名称'}
            className="flex-1 min-w-32 max-w-72 h-8 px-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
          {!isEditing && placements.length > 0 && (
            <button onClick={handleExportPng} disabled={isExporting} className={headerBtn}>
              {isExporting ? (isEn ? 'Exporting...' : '导出中...') : (isEn ? 'Export PNG' : '导出图片')}
            </button>
          )}
          {placements.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(isEn ? 'Remove all chords from this sheet?' : '清除这首歌的所有和弦？')) setPlacements([]);
              }}
              className={headerBtn}
            >
              {isEn ? 'Clear chords' : '清除和弦'}
            </button>
          )}
          <span className="text-sm text-gray-400 min-w-12 text-right">
            {savedFlash ? (isEn ? 'Saved ✓' : '已保存 ✓') : dirty ? (isEn ? 'Unsaved' : '未保存') : ''}
          </span>
          <button
            onClick={handleSave}
            disabled={!canSave || !dirty}
            className="h-8 px-4 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEn ? 'Save' : '保存'}
          </button>
        </>
      }
    >
      <div className="space-y-3 max-w-4xl mx-auto">
        {/* YouTube link */}
        <div className="flex items-center gap-2">
          <input
            value={youtubeUrl}
            onChange={e => handleYoutubeUrlChange(e.target.value, e.target)}
            placeholder={isEn ? 'Paste a YouTube link...' : '粘贴YouTube链接...'}
            aria-label={isEn ? 'YouTube link' : 'YouTube链接'}
            className={`flex-1 min-w-0 px-3 py-1.5 text-sm bg-white border rounded-lg placeholder-gray-300 focus:outline-none focus:ring-1 ${
              youtubeUrl.trim()
                ? videoId
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700'
                  : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700'
                : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
            }`}
          />
          {videoId && lookup.status === 'idle' && (
            <button onClick={requestLookup} className={headerBtn}>
              {isEn ? 'Find lyrics' : '查找歌词'}
            </button>
          )}
        </div>

        {/* The song's video, right above the lyrics */}
        {videoId && (
          <YouTubePlayer
            key={videoId}
            videoId={videoId}
            isEn={isEn}
            startAt={videoId === initialVideoId.current ? startAt : 0}
            {...pb.playerProps}
          />
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
                ? 'Paste lyrics here, or add a YouTube link above to look them up...\n\nExample:\nYesterday, all my troubles seemed so far away\nNow it looks as though they\'re here to stay'
                : '粘贴歌词，或在上方贴 YouTube 链接自动查找…\n\n例如：\n已经为了变的更好去掉锋芒\n一不小心成了你的倾诉对象'}
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
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setIsEditing(true); setSyncing(false); }}
                className="text-sm text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 bg-white cursor-pointer transition-colors"
              >
                ← {isEn ? 'Edit lyrics' : '编辑歌词'}
              </button>
              {/* One line at a time, or the whole sheet */}
              <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
                {(['line', 'full'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => { setView(v); setPopover(null); setSyncing(false); }}
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
                onFocusLine={goToLine}
                onCharClick={handleCharClick}
                onChordClick={removeChord}
                containerRef={containerRef}
                isEn={isEn}
                transport={controller ? {
                  hasTimes,
                  canPlayLine: lineTimes?.[activeLine] != null,
                  follow,
                  syncing,
                  onPlayLine: playLine,
                  onFollowChange: setFollow,
                  onStartSync: startSync,
                  onMarkLine: markLine,
                  onStopSync: () => setSyncing(false),
                } : null}
              >
                {popoverNode}
              </LineByLineView>
            )}

            {view === 'full' && (
              <div ref={exportRef} className="space-y-3 bg-white rounded-xl">
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

                <div className="px-5 pb-5">
                  <ChordLegend chords={placements.map(p => p.chord)} isEn={isEn} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
