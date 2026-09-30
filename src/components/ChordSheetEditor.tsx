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
import { YouTubeVideo } from './YouTubePlayer';
import KaraokeTransport from './KaraokeTransport';
import MenuButton from './MenuButton';
import LyricLine, { type LineTone } from './LyricLine';
import LineByLineView from './LineByLineView';
import LyricsImportBanner, { type LyricsLookupState } from './LyricsImportBanner';
import ChordSuggestions from './ChordSuggestions';
import { suggestNextChords } from '../utils/chordSuggestions';
import {
  findLyricsForVideo, searchLyricsByName, isConfidentMatch, toImportedLyrics, remapLineTimes, remapLinePlacements,
  type RankedResult,
} from '../utils/lyrics';
import { usePlayback, usePlaybackKeys, lineAtTime, lineProgress } from '../hooks/usePlayback';

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
  existing?: string;   // the chord already on this character, if any
}

const POPOVER_WIDTH = 320;
// How long after the last change the sheet saves itself
const AUTOSAVE_DELAY_MS = 800;

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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function useElementHeight(el: HTMLElement | null): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return height;
}

// Line view lyric size, before fitting to the space
const LYRICS_PX = { wide: 68, narrow: 50 };
// Vertical padding around the lyrics inside the scrolling area
const CONTENT_PADDING_PX = 32;

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
 * The chord sheet editor, full screen and kept plain: the line being sung in
 * large type (filling in as it's sung) with the next lines below, and a
 * progress bar over −5s / play / +5s. Everything else — changing the video,
 * finding or editing lyrics, the full-sheet view, syncing, export — is in the
 * ⋯ menu. The video itself is kept small in a corner: YouTube's terms don't
 * allow hiding it (audio-only) and require at least 200×200 px.
 */
export default function ChordSheetEditor({ sheet, startAt = 0, onSaved, onClose }: ChordSheetEditorProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [sheetId, setSheetId] = useState<string | null>(sheet?.id ?? null);
  const [lyrics, setLyrics] = useState(sheet?.lyrics ?? '');
  const [placements, setPlacements] = useState<ChordPlacement[]>(sheet?.placements ?? []);
  // Editing the lyrics as text (a textarea) instead of placing chords
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const wide = useMediaQuery('(min-width: 768px)');
  // With the video tucked in a corner (lg), the lyrics have the scrolling
  // area to themselves and are sized to fit it
  const videoInCorner = useMediaQuery('(min-width: 1024px)');
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);
  const mainHeight = useElementHeight(mainEl);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverInput, setPopoverInput] = useState('');
  const [sheetName, setSheetName] = useState(sheet?.name ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(sheet?.youtubeUrl ?? '');
  const [isExporting, setIsExporting] = useState(false);

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
  // Timing that's mostly gone (lines edited before timing followed its lines)
  const timingBroken = hasTimes && navLines.filter(li => lineTimes?.[li] != null).length < navLines.length * 0.5;
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

  // Follow the song: move the focus when the song reaches another line, unless
  // a chord is being entered or lines are being marked. Only on a change, so
  // a line picked by hand stays until the song moves on
  const followedLine = useRef<number | null>(null);
  useEffect(() => {
    pb.onTickRef.current = (t: number) => {
      if (!follow || popover || isEditing || view !== 'line' || syncing) return;
      const li = lineAtTime(t, lineTimes);
      if (li === followedLine.current) return;
      followedLine.current = li;
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

  // Focus input when popover opens, with an existing chord selected so typing
  // replaces it
  useEffect(() => {
    if (popover) {
      setTimeout(() => popoverInputRef.current?.select(), 10);
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

  // Opens the chord popover on a character. With a chord already there it
  // starts from that chord, to change it or (with the bin) delete it
  const handleCharClick = useCallback((e: React.MouseEvent, line: number, charIndex: number) => {
    const existing = placements.find(p => p.line === line && p.charIndex === charIndex);
    const charRect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    // Keep the popover inside the card when clicking near its right edge
    const maxX = containerRect ? Math.max(0, containerRect.width - POPOVER_WIDTH - 8) : 0;
    const x = containerRect ? Math.min(charRect.left - containerRect.left, maxX) : 0;
    const y = containerRect ? charRect.top - containerRect.top : 0;
    setPopover({ line, charIndex, x, y, charHeight: charRect.height, existing: existing?.chord });
    setPopoverInput(existing?.chord ?? '');
  }, [placements]);

  const deletePopoverChord = useCallback(() => {
    if (!popover) return;
    removeChord(popover.line, popover.charIndex);
    setPopover(null);
    setPopoverInput('');
  }, [popover, removeChord]);

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
          // Lines removed from these lyrics before chords followed their lines
          // left the chords on the wrong lines; the original lyrics say where
          // they belong
          const restored = remapLinePlacements(imported.lines, placementsRef.current, currentLines);
          const linesRemoved = imported.lines.length > currentLines.length;
          const moves = restored.length > 0 && JSON.stringify(restored) !== JSON.stringify(placementsRef.current);
          const ask = isEn
            ? 'Were lines deleted from these lyrics earlier? Chords placed before that may now be on the wrong lines. Move them back to their lines using the original lyrics?'
            : '之前删过歌词里的行吗？那之前放的和弦可能错位了。要按原始歌词把和弦移回对应的句子吗？';
          if (linesRemoved && moves && window.confirm(ask)) setPlacements(restored);
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

  // Look up lyrics from the video title, or from a name the user typed. To
  // repair timing, take the synced version that matches the current lyrics
  // best, keeping the text and chords
  const runLookup = useCallback(async (query?: string, repairTiming = false) => {
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
      if (repairTiming) {
        const current = lyricsRef.current.split('\n');
        const needed = current.filter(l => l.trim()).length * 0.5;
        const best = ranked
          .map(r => {
            const imported = toImportedLyrics(r.result);
            const times = imported?.times ? remapLineTimes(imported.lines, imported.times, current) : null;
            return { r, matched: times?.filter(t => t !== null).length ?? 0 };
          })
          .reduce((a, b) => (b.matched > a.matched ? b : a));
        if (best.matched >= needed) importLyrics(best.r);
        else setLookup(s => ({ ...s, note: isEn ? 'No synced lyrics match these lines. Use "Sync while listening" instead.' : '没找到能对上这份歌词的时间轴，可以用「边听边打点同步」。' }));
        return;
      }
      // Import straight away only when it's clearly the right song and the
      // editor is still empty; otherwise the user picks from the list
      if (!query && isConfidentMatch(ranked[0]) && !lyricsRef.current.trim()) importLyrics(ranked[0]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setLookup(s => ({ ...s, status: 'error' }));
    }
  }, [controller, importLyrics, isEn]);

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

  // Timing and chords follow their lines through a round of text editing.
  // Each keystroke maps from the text as it was before the round started, so
  // a line that passes through an in-between state (merged with the line
  // above while that one is being deleted, say) gets them back after
  const editBase = useRef<{ lines: string[]; times: (number | null)[] | null; placements: ChordPlacement[] } | null>(null);
  useEffect(() => { if (!isEditing) editBase.current = null; }, [isEditing]);

  const handleLyricsChange = useCallback((value: string) => {
    const base = editBase.current ??= { lines, times: lineTimes, placements };
    const newLines = value.split('\n');
    setLineTimes(remapLineTimes(base.lines, base.times, newLines));
    setPlacements(remapLinePlacements(base.lines, base.placements, newLines));
    setLyrics(value);
  }, [lines, lineTimes, placements]);

  // ---------- Save / close / export ----------

  const canSave = !!(lyrics.trim() || youtubeUrl.trim());

  // Saves on its own shortly after each change; returns the sheet's id
  const save = useCallback((): string | null => {
    if (!canSave) return sheetId;
    // The list needs a name; the field itself stays empty so a name found
    // later (e.g. the imported song's title) can still fill it
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
    setSavedKey(contentKey({ lyrics, placements, youtubeUrl, lineTimes, name: sheetName }));
    const saved = loadChordSheets().find(s => s.id === id);
    if (saved) onSaved(saved);
    return id;
  }, [canSave, sheetName, lyrics, placements, youtubeUrl, lineTimes, sheetId, isEn, onSaved]);

  // Each change restarts the wait, so typing saves once it pauses
  useEffect(() => {
    if (!dirty || !canSave) return;
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dirty, canSave, save]);

  // Don't lose the last change if the tab is closed before the wait is up
  const flushRef = useRef<() => void>(() => {});
  useEffect(() => { flushRef.current = () => { if (dirty && canSave) save(); }; });
  useEffect(() => {
    const onHide = () => flushRef.current();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  // Esc and ✕: first leave whatever is in progress, then save anything
  // pending and close
  const requestClose = useCallback(() => {
    if (popover) { setPopover(null); setPopoverInput(''); return; }
    if (syncing) { setSyncing(false); return; }
    const id = dirty ? save() : sheetId;
    onClose(pb.time, id);
  }, [popover, syncing, dirty, save, onClose, pb.time, sheetId]);

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
        {popover.existing && (
          <button
            onClick={deletePopoverChord}
            title={isEn ? `Delete ${popover.existing}` : `删除 ${popover.existing}`}
            aria-label={isEn ? 'Delete chord' : '删除和弦'}
            className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
            </svg>
          </button>
        )}
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

  const quiet = 'px-2 py-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const noFocus = (e: React.MouseEvent) => e.preventDefault();
  const lyricsPx = wide ? LYRICS_PX.wide : LYRICS_PX.narrow;
  const hasLyrics = !!lyrics.trim();
  const showStart = !videoId && !hasLyrics && !isEditing;

  const linkInput = (big: boolean) => (
    <input
      value={youtubeUrl}
      onChange={e => { handleYoutubeUrlChange(e.target.value, e.target); if (extractYouTubeId(e.target.value)) setShowLinkInput(false); }}
      autoFocus={big}
      placeholder={isEn ? 'Paste a YouTube link…' : '粘贴 YouTube 链接…'}
      aria-label={isEn ? 'YouTube link' : 'YouTube 链接'}
      className={`w-full bg-white border rounded-xl placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
        big ? 'px-5 py-4 text-lg' : 'px-3 py-2 text-sm'
      } ${youtubeUrl.trim() && !videoId ? 'border-red-300 text-red-700' : 'border-gray-200 text-gray-900'}`}
    />
  );

  const menuItems = [
    { label: isEn ? 'Change video link' : '更换视频链接', onSelect: () => setShowLinkInput(v => !v) },
    videoId ? { label: isEn ? 'Find lyrics for this video' : '查找这首歌的歌词', onSelect: requestLookup } : null,
    { label: isEn ? 'Edit lyrics text' : '编辑歌词文本', onSelect: () => { setIsEditing(true); setSyncing(false); setPopover(null); } },
    hasLyrics ? {
      label: isEn ? 'Show the whole sheet' : '显示整首歌',
      checked: view === 'full',
      onSelect: () => { setView(view === 'full' ? 'line' : 'full'); setPopover(null); setSyncing(false); setIsEditing(false); },
    } : null,
    controller && hasLyrics ? {
      label: hasTimes ? (isEn ? 'Re-sync lyrics to the video' : '重新打点同步歌词') : (isEn ? 'Sync lyrics to the video' : '边听边打点同步歌词'),
      onSelect: () => { setView('line'); setIsEditing(false); startSync(); },
    } : null,
    hasTimes ? { label: isEn ? 'Follow the song' : '跟随歌曲进度', checked: follow, onSelect: () => setFollow(f => !f) } : null,
    placements.length > 0 ? { label: isEn ? 'Export as image' : '导出图片', onSelect: () => void handleExportPng(), disabled: isExporting } : null,
    placements.length > 0 ? {
      label: isEn ? 'Clear all chords' : '清除所有和弦',
      danger: true,
      onSelect: () => { if (window.confirm(isEn ? 'Remove all chords from this sheet?' : '清除这首歌的所有和弦？')) setPlacements([]); },
    } : null,
  ];

  return (
    <Modal label={sheet ? (isEn ? 'Edit chord sheet' : '编辑和弦谱') : (isEn ? 'New chord sheet' : '新建和弦谱')} onRequestClose={requestClose}>
      {/* Header: name, save status, menu, close */}
      <header className="h-14 shrink-0 flex items-center gap-2 px-4 md:px-6">
        <input
          value={sheetName}
          onChange={e => setSheetName(e.target.value)}
          placeholder={isEn ? 'Song name' : '歌曲名称'}
          aria-label={isEn ? 'Song name' : '歌曲名称'}
          className="flex-1 min-w-0 bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
        />
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {dirty && canSave ? (isEn ? 'Saving…' : '保存中…') : sheetId ? (isEn ? 'Saved' : '已自动保存') : ''}
        </span>
        <MenuButton items={menuItems} label={isEn ? 'More' : '更多'} />
        <button
          onClick={requestClose}
          aria-label={isEn ? 'Close editor' : '关闭编辑'}
          title={isEn ? 'Close editor' : '关闭编辑'}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {(showLinkInput && !showStart) && (
        <div className="px-4 md:px-6"><div className="max-w-2xl mx-auto">{linkInput(false)}</div></div>
      )}
      {lookup.status !== 'idle' && (
        <div className="px-4 md:px-6 pt-2">
          <div className="max-w-2xl mx-auto">
            <LyricsImportBanner
              state={lookup}
              isEn={isEn}
              onImport={importLyrics}
              onSearch={q => void runLookup(q)}
              onUndo={undoImport ? handleUndoImport : undefined}
              onDismiss={() => { lookupAbort.current?.abort(); setLookup(IDLE_LOOKUP); }}
            />
          </div>
        </div>
      )}

      <main ref={setMainEl} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 flex flex-col">
        {/* The video, as small as YouTube allows: at the top on narrow
            screens, in the bottom-left corner on wide ones */}
        {videoId && (
          <YouTubeVideo
            key={videoId}
            videoId={videoId}
            startAt={videoId === initialVideoId.current ? startAt : 0}
            className="shrink-0 mx-auto mt-2 w-[356px] max-w-full h-[200px] rounded-xl lg:fixed lg:left-6 lg:bottom-6 lg:m-0 lg:w-[200px] lg:h-[200px] lg:z-10"
            onController={pb.playerProps.onController}
            onPlayingChange={pb.playerProps.onPlayingChange}
            onApiUnavailable={pb.playerProps.onApiUnavailable}
          />
        )}

        <div className="flex-1 flex items-center justify-center py-4">
          {showStart ? (
            // New sheet: start from a video
            <div className="w-full max-w-xl text-center space-y-5">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isEn ? 'Paste a YouTube link to start' : '贴上 YouTube 链接，开始扒歌'}
              </h2>
              {linkInput(true)}
              <button onClick={() => setIsEditing(true)} className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-4 cursor-pointer">
                {isEn ? 'No video? Paste lyrics instead' : '没有视频？直接粘贴歌词'}
              </button>
            </div>
          ) : isEditing ? (
            // Lyrics as text
            <div className="w-full max-w-2xl space-y-3">
              <textarea
                ref={lyricsTextareaRef}
                value={lyrics}
                autoFocus
                onChange={e => handleLyricsChange(e.target.value)}
                placeholder={isEn ? 'Paste or type the lyrics, one line per line…' : '粘贴或输入歌词，一句一行…'}
                className="w-full px-1 py-2 bg-transparent text-xl leading-relaxed text-gray-900 placeholder-gray-300 focus:outline-none min-h-48 resize-none overflow-hidden"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={!hasLyrics}
                  className="h-10 px-5 text-sm font-medium rounded-full bg-gray-900 text-white hover:bg-gray-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isEn ? 'Done — place chords' : '完成，开始放和弦'} →
                </button>
              </div>
            </div>
          ) : !hasLyrics ? (
            // A video but no lyrics yet
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-400">
                {lookup.status === 'searching'
                  ? (isEn ? 'Looking for the lyrics…' : '正在找歌词…')
                  : (isEn ? 'No lyrics yet' : '还没有歌词')}
              </p>
              {lookup.status !== 'searching' && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setIsEditing(true)} className="h-10 px-5 text-sm rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer">
                    {isEn ? 'Paste lyrics' : '粘贴歌词'}
                  </button>
                  {lookup.status === 'idle' && (
                    <button onClick={requestLookup} className="h-10 px-5 text-sm rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer">
                      {isEn ? 'Find lyrics' : '查找歌词'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : view === 'line' ? (
            <LineByLineView
              lines={lines}
              navLines={navLines}
              focusLine={activeLine}
              focusProgress={activeLine === playbackLine ? lineProgress(pb.time, activeLine, lineTimes, lines[activeLine]) : undefined}
              chordsForLine={getChordsForLine}
              onFocusLine={goToLine}
              onCharClick={handleCharClick}
              containerRef={containerRef}
              fontPx={lyricsPx}
              maxHeight={videoInCorner && mainHeight ? mainHeight - CONTENT_PADDING_PX : undefined}
              onStep={popover || syncing ? undefined : stepLine}
              syncing={syncing}
              isEn={isEn}
            >
              {popoverNode}
            </LineByLineView>
          ) : (
            // The whole sheet
            <div ref={exportRef} className="w-full max-w-3xl self-start bg-white">
              <div ref={containerRef} className="relative select-none py-2">
                {lines.map((line, li) => {
                  const lineChords = getChordsForLine(li);
                  if (!line.trim() && !lineChords.length) return <div key={li} className="h-5" />;
                  // While a synced video plays: sung lines dark, the rest light
                  const tone: LineTone = playbackLine === null
                    ? 'normal'
                    : li === playbackLine ? 'current' : li < playbackLine ? 'sung' : 'upcoming';
                  return (
                    <LyricLine
                      key={li}
                      line={line}
                      chords={lineChords}
                      fontPx={wide ? 20 : 17}
                      tone={tone}
                      progress={li === playbackLine ? lineProgress(pb.time, li, lineTimes, line) : undefined}
                      onCharClick={(e, ci) => handleCharClick(e, li, ci)}
                      chordTitle={isEn ? 'Click to change or delete' : '点击修改或删除'}
                    />
                  );
                })}
                {popoverNode}
              </div>
              <div className="pt-6 pb-2">
                <ChordLegend chords={placements.map(p => p.chord)} isEn={isEn} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer: playback, then quiet line controls */}
      {!showStart && !isEditing && (videoId || hasLyrics) && (
        <footer className="shrink-0 px-4 md:px-6 pt-2 pb-6 space-y-4">
          {syncing && (
            <div className="max-w-lg mx-auto flex items-center justify-center gap-3 flex-wrap text-sm">
              <span className="text-amber-700">
                {isEn ? 'When the highlighted line starts, press ↓' : '唱到高亮的这句时，按 ↓'}
              </span>
              <button onMouseDown={noFocus} onClick={markLine}
                className="h-8 px-3 font-medium rounded-full bg-amber-500 text-white hover:bg-amber-600 cursor-pointer">
                {isEn ? 'It starts now ↓' : '这句开始了 ↓'}
              </button>
              <button onMouseDown={noFocus} onClick={() => setSyncing(false)} className={quiet}>
                {isEn ? 'Done' : '结束打点'}
              </button>
            </div>
          )}
          {videoId && (
            <KaraokeTransport
              isEn={isEn}
              ready={!!controller}
              playing={pb.playing}
              time={pb.time}
              duration={pb.duration}
              onToggle={pb.togglePlay}
              onSkip={pb.skipBy}
              onSeek={pb.seekTo}
            />
          )}
          {/* Without timestamps (or with most of them missing) the lyrics
              can't follow the song — say so, with ways to fix it */}
          {controller && hasLyrics && (!hasTimes || timingBroken) && !syncing && (
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
              <span className="text-gray-400">
                {timingBroken
                  ? (isEn ? "Most lines have lost their timing, so the lyrics can't follow the song." : '大部分句子没有时间轴了，歌词跟不上歌。')
                  : (isEn ? "These lyrics aren't synced to the video, so they won't follow the song." : '这份歌词没有时间轴，还不能跟着歌走。')}
              </span>
              <button onMouseDown={noFocus} onClick={() => void runLookup(undefined, true)} disabled={lookup.status === 'searching'}
                className="h-8 px-3 font-medium rounded-full bg-gray-900 text-white hover:bg-gray-700 cursor-pointer disabled:opacity-40">
                {timingBroken ? (isEn ? 'Repair timing' : '修复时间轴') : (isEn ? 'Find timing' : '自动找时间轴')}
              </button>
              <button onMouseDown={noFocus} onClick={() => { setView('line'); startSync(); }}
                className="h-8 px-3 font-medium rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">
                ⏱ {isEn ? 'Sync while listening' : '边听边打点同步'}
              </button>
            </div>
          )}
          {view === 'line' && hasLyrics && (
            <div className="flex items-center justify-center gap-1 text-xs">
              <button onMouseDown={noFocus} onClick={() => stepLine(-1)} className={quiet} title={isEn ? 'Previous line (↑)' : '上一句（↑）'}>
                ↑ {isEn ? 'Previous' : '上一句'}
              </button>
              <button onMouseDown={noFocus} onClick={() => stepLine(1)} className={quiet} title={isEn ? 'Next line (↓)' : '下一句（↓）'}>
                ↓ {isEn ? 'Next' : '下一句'}
              </button>
              {controller && (
                <button onMouseDown={noFocus} onClick={playLine} disabled={lineTimes?.[activeLine] == null} className={quiet}
                  title={isEn ? 'Play this line from its start (R)' : '从这句开头播放到下一句（R）'}>
                  ↻ {isEn ? 'Replay line' : '重播本句'}
                </button>
              )}
            </div>
          )}
        </footer>
      )}
    </Modal>
  );
}
