import { useState, useMemo, useCallback, useId, useEffect, useRef } from 'react';
import { identifyChords, approximateChords, describeInterval, getDegreeLabel, getNoteAtFret } from '../utils/chordIdentifier';
import type { IdentifiedChord } from '../utils/chordIdentifier';
import type { ParsedChord } from '../utils/chordUtils';
import { parseChordName } from '../utils/chordUtils';
import type { GuitarFingering } from '../data/chords';
import { useLocale } from '../i18n/context';

interface FretboardIdentifierProps {
  onChordSelect?: (chord: ParsedChord, fingering?: GuitarFingering) => void;
}

const NUM_FRETS = 15;
// Visual order top-to-bottom: high e → low E
const VISUAL_STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
// Fret inlay positions (standard guitar dots)
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
const DOUBLE_INLAY_FRETS = [12];

// Move the whole shape `delta` frets along the neck. Open strings move with it
// (as if the nut were a barre) so the chord keeps its quality; muted strings
// stay muted. Returns null when a note would land behind the nut or past the
// last fret, rather than distorting the shape.
function shiftShape(frets: number[], delta: number): number[] | null {
  const sounding = frets.filter(f => f >= 0);
  if (sounding.length === 0) return null;
  if (sounding.some(f => f + delta < 0 || f + delta > NUM_FRETS)) return null;
  return frets.map(f => (f < 0 ? f : f + delta));
}

export default function FretboardIdentifier({ onChordSelect }: FretboardIdentifierProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  // -1 = muted, 0 = open (default), 1+ = fret number
  const [frets, setFrets] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const handleFretClick = useCallback((stringIdx: number, fret: number) => {
    setFrets(prev => {
      const next = [...prev];
      // Clicking same fret → back to open; clicking new fret → select it
      next[stringIdx] = next[stringIdx] === fret ? 0 : fret;
      return next;
    });
  }, []);

  const handleStringMute = useCallback((stringIdx: number) => {
    setFrets(prev => {
      const next = [...prev];
      // Toggle mute: if muted → open; otherwise → muted
      next[stringIdx] = next[stringIdx] === -1 ? 0 : -1;
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setFrets([0, 0, 0, 0, 0, 0]);
  }, []);

  const handleShift = useCallback((delta: number) => {
    setFrets(prev => shiftShape(prev, delta) ?? prev);
  }, []);
  const canShiftDown = shiftShape(frets, -1) !== null;
  const canShiftUp = shiftShape(frets, 1) !== null;

  // Lowest sounding fret, shown between the shift buttons
  const soundingFrets = frets.filter(f => f >= 0);
  const lowestFret = soundingFrets.length ? Math.min(...soundingFrets) : null;
  const positionLabel = lowestFret === null
    ? '—'
    : lowestFret === 0
      ? (isEn ? 'Open' : '开放把位')
      : (isEn ? `Fret ${lowestFret}` : `第 ${lowestFret} 品`);

  // + / − shift the shape from the keyboard. This page stays mounted while
  // other tabs are showing, so only react while it's actually visible, and
  // never while the user is typing or zooming the browser (Ctrl/⌘ +/−).
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (!rootRef.current || rootRef.current.offsetParent === null) return;

      let delta = 0;
      if (e.key === '+' || e.key === '=') delta = 1;        // '=' is + without Shift
      else if (e.key === '-' || e.key === '_') delta = -1;
      if (!delta) return;
      e.preventDefault();
      handleShift(delta);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleShift]);

  const exactResults = useMemo(() => identifyChords(frets), [frets]);
  // Nothing matched exactly (an omitted tone, or a colour note outside the
  // chord table) — fall back to the closest chords so the shape always gets
  // a name.
  const approxResults = useMemo(
    () => (exactResults.length > 0 ? [] : approximateChords(frets)),
    [exactResults, frets],
  );
  const results = exactResults.length > 0 ? exactResults : approxResults;
  const primary = results[0] ?? null;
  const alternatives = results.slice(1);

  const intervalLabel = useMemo(
    () => describeInterval(frets, isEn ? 'en' : 'zh'),
    [frets, isEn],
  );

  // Show reset only when something is non-default (a fret pressed or a string muted)
  const hasNonDefault = frets.some(f => f !== 0);

  // Selected note names for display
  const selectedNotes = useMemo(() => {
    return frets.map((f, i) => {
      if (f < 0) return null;
      return getNoteAtFret(i, f);
    });
  }, [frets]);

  const soundingNotes = useMemo(() => {
    return selectedNotes.filter((n): n is string => n !== null);
  }, [selectedNotes]);

  // Hand the shape to the chord page. `frets` is already low-E-first, the
  // same order GuitarFingering uses.
  const handleChordSelect = useCallback((parsed: ParsedChord) => {
    if (!onChordSelect) return;
    const pressed = frets.filter(f => f > 0);
    const maxFret = pressed.length ? Math.max(...pressed) : 0;
    const minFret = pressed.length ? Math.min(...pressed) : 0;
    const startFret = maxFret <= 5 ? 0 : Math.max(1, minFret - 1);
    onChordSelect(parsed, { frets: [...frets], startFret: startFret || undefined });
  }, [frets, onChordSelect]);

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Instructions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEn ? 'Fretboard Chord Identifier' : '指板和弦识别'}
          </h2>
          <p className="text-base text-gray-500 mt-1">
            {isEn ? 'Click positions on the fretboard to mark frets, chords are identified automatically' : '点击指板上的位置标记按弦，系统自动识别和弦'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Shift the whole shape along the neck */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500 mr-0.5">{isEn ? 'Position' : '移动把位'}</span>
            <button
              onClick={() => handleShift(-1)}
              disabled={!canShiftDown}
              aria-label={isEn ? 'Move shape down one fret (−)' : '整体下移一品（−）'}
              title={isEn ? 'Move down one fret  ( − )' : '下移一品  ( − )'}
              className="w-8 h-8 flex items-center justify-center text-base text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >−</button>
            <span className="min-w-[4.5rem] text-center text-sm font-medium text-gray-700 tabular-nums">
              {positionLabel}
            </span>
            <button
              onClick={() => handleShift(1)}
              disabled={!canShiftUp}
              aria-label={isEn ? 'Move shape up one fret (+)' : '整体上移一品（+）'}
              title={isEn ? 'Move up one fret  ( + )' : '上移一品  ( + )'}
              className="w-8 h-8 flex items-center justify-center text-base text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >+</button>
            <span className="hidden sm:inline text-sm text-gray-400 ml-1">
              {isEn ? 'keys' : '快捷键'}{' '}
              <kbd className="px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-gray-50 font-sans">+</kbd>{' '}
              <kbd className="px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-gray-50 font-sans">−</kbd>
            </span>
          </div>
          {hasNonDefault && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shrink-0"
            >
              {isEn ? 'Reset' : '重置'}
            </button>
          )}
        </div>
      </div>

      {/* Fretboard */}
      <div className="bg-gray-50 rounded-xl overflow-x-auto">
        <div className="min-w-[640px] p-4">
          <Fretboard
            frets={frets}
            onFretClick={handleFretClick}
            onStringMute={handleStringMute}
          />
        </div>
      </div>

      {/* Live result — directly under the fretboard, so the chord name is
          visible the instant a note is placed */}
      <LiveResult
        chord={primary}
        soundingNotes={soundingNotes}
        intervalLabel={intervalLabel}
        onSelect={onChordSelect ? handleChordSelect : undefined}
      />

      {/* Other readings of the same shape */}
      {alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-gray-700">
            {isEn ? 'Other readings' : '其他可能'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alternatives.map((chord, idx) => (
              <ChordResultCard
                key={chord.symbol}
                chord={chord}
                rank={idx + 2}
                onSelect={handleChordSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Live result banner ─── */

interface LiveResultProps {
  chord: IdentifiedChord | null;
  soundingNotes: string[];
  intervalLabel: string | null;
  onSelect?: (chord: ParsedChord) => void;
}

function LiveResult({ chord, soundingNotes, intervalLabel, onSelect }: LiveResultProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  // "omits 3, 5" / "added D#" — why the match isn't exact
  const hints: string[] = [];
  if (chord?.omitted?.length) {
    hints.push(isEn ? `omits ${chord.omitted.join(', ')}` : `省略 ${chord.omitted.join('、')}`);
  }
  if (chord?.added?.length) {
    hints.push(isEn ? `added ${chord.added.join(', ')}` : `额外音 ${chord.added.join('、')}`);
  }

  const canSelect = Boolean(chord && onSelect);
  const handleClick = () => {
    if (!chord || !onSelect) return;
    const parsed = parseChordName(chord.root + (chord.type === 'major' ? '' : chord.type));
    if (parsed) onSelect(parsed);
  };

  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3.5 space-y-2.5">
      {chord ? (
        <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
          {canSelect ? (
            <button
              onClick={handleClick}
              title={isEn ? 'Open this chord' : '查看该和弦'}
              className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {chord.symbol}
            </button>
          ) : (
            <span className="text-3xl font-bold text-gray-900">{chord.symbol}</span>
          )}
          <span className="text-base text-gray-500">{isEn ? chord.nameEn : chord.name}</span>
          {chord.approximate && (
            <span className="px-1.5 py-0.5 text-sm rounded bg-gray-100 text-gray-500">
              {isEn ? 'closest match' : '近似'}
            </span>
          )}
          {hints.length > 0 && (
            <span className="text-sm text-gray-400">{hints.join(' · ')}</span>
          )}
        </div>
      ) : (
        <div className="text-base text-gray-400">
          {soundingNotes.length < 2
            ? (isEn ? 'Press at least two strings to identify a chord' : '按下至少两根弦即可识别和弦')
            : (isEn ? 'No matching chord' : '未匹配到标准和弦')}
        </div>
      )}

      {/* Sounding notes, labelled by their degree in the chord above */}
      {soundingNotes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">{isEn ? 'Notes' : '发音音符'}</span>
          {soundingNotes.map((note, i) => (
            <span key={i} className="px-2 py-0.5 text-base font-medium bg-gray-100 text-gray-700 rounded">
              {note}
              {chord && (
                <span className="ml-1 text-sm text-gray-400">{getDegreeLabel(chord, note)}</span>
              )}
            </span>
          ))}
          {intervalLabel && <span className="text-sm text-gray-400">{intervalLabel}</span>}
        </div>
      )}
    </div>
  );
}

/* ─── Fretboard SVG ─── */

// Drawn to look like a real acoustic neck: rosewood board, bone nut, nickel
// frets, pearl inlays and strings of real gauges. Fret spacing follows the
// 12th-root-of-2 rule, softened a little so the high frets stay clickable.
const FRET_TAPER = 0.75; // 0 = evenly spaced, 1 = true guitar proportions

// Visual order (high e → low E): string thickness in px, and whether it's a
// wound (phosphor-bronze) string or plain steel
const STRING_GAUGES = [1.1, 1.4, 1.9, 2.4, 2.9, 3.4];
const WOUND_STRINGS = [false, false, true, true, true, true];

interface FretboardProps {
  frets: number[];
  onFretClick: (stringIdx: number, fret: number) => void;
  onStringMute: (stringIdx: number) => void;
}

function Fretboard({ frets, onFretClick, onStringMute }: FretboardProps) {
  const { isDark } = useLocale();
  // Several fretboards can be on screen, so gradient/filter ids must be unique
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  // The neck looks the same in both themes; only the labels around it change
  const fc = isDark
    ? { label: '#a3a3a3', labelMuted: '#555', fretNum: '#666', muted: '#ef4444', muteOff: '#444' }
    : { label: '#555', labelMuted: '#bbb', fretNum: '#aaa', muted: '#ef4444', muteOff: '#d1d5db' };

  const controlW = 52;    // × mute button + string label + open-string ring
  const nutW = 9;
  const boardLen = 840;   // nut → last fret
  const overhang = 30;    // the neck carries on past the last fret, fading out
  const topPad = 6;
  const edgePad = 13;     // board edge → outer string
  const stringSpacing = 30;
  const bottomPad = 26;   // room for fret numbers
  const dotRadius = 11;

  const boardX = controlW;                  // left edge of the nut
  const fret0X = boardX + nutW;             // playing surface starts after the nut
  const boardEndX = fret0X + boardLen + overhang;
  const boardTop = topPad;
  const boardH = edgePad * 2 + 5 * stringSpacing;
  const totalWidth = boardEndX + 4;
  const totalHeight = topPad + boardH + bottomPad;

  // Visual row 0 (top) = 1st string (high e) = frets[5]
  // Visual row 5 (bottom) = 6th string (low E) = frets[0]
  const dataIdx = (visualIdx: number) => 5 - visualIdx;
  const stringY = (visualIdx: number) => boardTop + edgePad + visualIdx * stringSpacing;

  // x of the nth fret wire, 0 being the nut
  const fretX = (n: number) => {
    const even = n / NUM_FRETS;
    const real = (1 - 2 ** (-n / 12)) / (1 - 2 ** (-NUM_FRETS / 12));
    return fret0X + boardLen * ((1 - FRET_TAPER) * even + FRET_TAPER * real);
  };
  const fretCenterX = (n: number) => (fretX(n - 1) + fretX(n)) / 2;
  const fadeStartX = fretX(NUM_FRETS) + 6;

  const muteBtnX = 13;
  const labelX = 29;
  const openIndicatorX = boardX - 8;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="select-none"
      style={{ maxHeight: 300 }}
    >
      <defs>
        {/* Rosewood: dark base, grain streaks, and shading where the board
            curves away at its edges */}
        <linearGradient id={id('wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1a10" />
          <stop offset="0.5" stopColor="#40281a" />
          <stop offset="1" stopColor="#26170e" />
        </linearGradient>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.32" numOctaves="3" seed="7" result="darkNoise" />
          <feColorMatrix in="darkNoise" type="matrix" result="darkGrain"
            values="0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0 0.02  1.4 0 0 0 -0.62" />
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.9" numOctaves="2" seed="3" result="lightNoise" />
          <feColorMatrix in="lightNoise" type="matrix" result="lightGrain"
            values="0 0 0 0 0.55  0 0 0 0 0.36  0 0 0 0 0.22  1.2 0 0 0 -0.72" />
          <feMerge>
            <feMergeNode in="darkGrain" />
            <feMergeNode in="lightGrain" />
          </feMerge>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id={id('edge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.12" stopColor="#000" stopOpacity="0" />
          <stop offset="0.88" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        <filter id={id('neckShadow')} x="-5%" y="-20%" width="110%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.28" />
        </filter>

        {/* Bone nut and nickel frets, lit from the left */}
        <linearGradient id={id('nut')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bfb291" />
          <stop offset="0.4" stopColor="#f8f3e6" />
          <stop offset="1" stopColor="#d9cdb0" />
        </linearGradient>
        <linearGradient id={id('fret')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#707478" />
          <stop offset="0.45" stopColor="#f1f3f4" />
          <stop offset="1" stopColor="#8d9195" />
        </linearGradient>

        {/* Mother-of-pearl inlay with a faint pink/teal shimmer */}
        <radialGradient id={id('pearl')} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#eef1ee" />
          <stop offset="0.7" stopColor="#e3dbe6" />
          <stop offset="0.85" stopColor="#d3e1e4" />
          <stop offset="1" stopColor="#aebbbf" />
        </radialGradient>

        {/* Strings: round highlight across the width; wound strings get a
            diagonal winding texture on top */}
        <linearGradient id={id('steel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a9094" />
          <stop offset="0.4" stopColor="#f7f9fa" />
          <stop offset="1" stopColor="#6d7377" />
        </linearGradient>
        <linearGradient id={id('bronze')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e5129" />
          <stop offset="0.4" stopColor="#f0d49d" />
          <stop offset="1" stopColor="#5e4421" />
        </linearGradient>
        <pattern id={id('winding')} width="2.4" height="8" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
          <rect width="0.9" height="8" fill="#000" fillOpacity="0.35" />
        </pattern>
        <filter id={id('stringShadow')} x="-1%" y="-400%" width="102%" height="900%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>

        {/* Pressed-note marker */}
        <radialGradient id={id('marker')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#7cb4ff" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </radialGradient>
        <filter id={id('markerShadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
        </filter>

        {/* Fade the neck out past the last fret */}
        <linearGradient id={id('fadeGrad')} gradientUnits="userSpaceOnUse" x1={fadeStartX} y1="0" x2={boardEndX} y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('fade')} maskUnits="userSpaceOnUse" x="0" y="0" width={totalWidth} height={totalHeight}>
          <rect x="0" y="0" width={totalWidth} height={totalHeight} fill={url('fadeGrad')} />
        </mask>
      </defs>

      {/* Neck */}
      <g filter={url('neckShadow')}>
        <g mask={url('fade')}>
          <rect x={fret0X} y={boardTop} width={boardEndX - fret0X} height={boardH} fill={url('wood')} />
          <rect x={fret0X} y={boardTop} width={boardEndX - fret0X} height={boardH} fill="#000" filter={url('grain')} />
          <rect x={fret0X} y={boardTop} width={boardEndX - fret0X} height={boardH} fill={url('edge')} />
          {/* Cream binding along both edges */}
          <rect x={fret0X} y={boardTop} width={boardEndX - fret0X} height={1.6} fill="#eadfc6" />
          <rect x={fret0X} y={boardTop + boardH - 1.6} width={boardEndX - fret0X} height={1.6} fill="#eadfc6" />

          {/* Inlays — centred on the board, doubled at the 12th fret */}
          {INLAY_FRETS.map(f => {
            const cx = fretCenterX(f);
            const ys = DOUBLE_INLAY_FRETS.includes(f)
              ? [stringY(1) + stringSpacing / 2, stringY(3) + stringSpacing / 2]
              : [stringY(2) + stringSpacing / 2];
            return ys.map((cy, i) => (
              <circle key={`inlay-${f}-${i}`} cx={cx} cy={cy} r={6.5}
                fill={url('pearl')} stroke="#000" strokeOpacity={0.35} strokeWidth={0.6} />
            ));
          })}

          {/* Fret wires, each casting a shadow toward the body */}
          {Array.from({ length: NUM_FRETS }, (_, i) => {
            const x = fretX(i + 1);
            return (
              <g key={`fw-${i}`}>
                <rect x={x + 1.5} y={boardTop} width={3} height={boardH} fill="#000" opacity={0.3} />
                <rect x={x - 2} y={boardTop} width={4} height={boardH} fill={url('fret')} />
              </g>
            );
          })}

          <rect x={boardX} y={boardTop - 2} width={nutW} height={boardH + 4} rx={1.5} fill={url('nut')} />

          {/* Strings — thinnest at top (high e), thickest at bottom (low E);
              a muted string is dimmed */}
          {STRING_GAUGES.map((gauge, visualIdx) => {
            const y = stringY(visualIdx);
            const muted = frets[dataIdx(visualIdx)] === -1;
            const w = boardEndX - boardX;
            return (
              <g key={`str-${visualIdx}`} opacity={muted ? 0.35 : 1}>
                <rect x={boardX} y={y - gauge / 2 + 2.2} width={w} height={gauge}
                  fill="#000" opacity={0.55} filter={url('stringShadow')} />
                <rect x={boardX} y={y - gauge / 2} width={w} height={gauge}
                  fill={url(WOUND_STRINGS[visualIdx] ? 'bronze' : 'steel')} />
                {WOUND_STRINGS[visualIdx] && (
                  <rect x={boardX} y={y - gauge / 2} width={w} height={gauge} fill={url('winding')} />
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* Fret numbers */}
      {[1, 3, 5, 7, 9, 12, 15].map(f => f <= NUM_FRETS && (
        <text key={`fn-${f}`} x={fretCenterX(f)} y={boardTop + boardH + 18}
          textAnchor="middle" fill={fc.fretNum} fontSize={10} fontFamily="Inter, sans-serif">{f}</text>
      ))}

      {/* Per-string: × mute button + label + open indicator */}
      {VISUAL_STRING_LABELS.map((label, visualIdx) => {
        const di = dataIdx(visualIdx);
        const fretVal = frets[di];
        const y = stringY(visualIdx);
        const isMuted = fretVal === -1;
        const isOpen = fretVal === 0;

        return (
          <g key={`ctrl-${visualIdx}`}>
            {/* × mute toggle */}
            <g className="cursor-pointer" onClick={() => onStringMute(di)}>
              <rect x={muteBtnX - 12} y={y - 12} width={24} height={24} fill="transparent" />
              <text x={muteBtnX} y={y + 5} textAnchor="middle"
                fill={isMuted ? fc.muted : fc.muteOff}
                fontSize={17} fontWeight="bold" fontFamily="Inter, sans-serif">×</text>
            </g>

            {/* String label */}
            <text x={labelX} y={y + 4} textAnchor="middle"
              fill={isMuted ? fc.labelMuted : fc.label}
              fontSize={11} fontWeight="500" fontFamily="Inter, sans-serif">{label}</text>

            {/* Open-string indicator (○) — click to mute */}
            <g className="cursor-pointer" onClick={() => onStringMute(di)}>
              <rect x={openIndicatorX - 8} y={y - 10} width={16} height={20} fill="transparent" />
              {isOpen && (
                <circle cx={openIndicatorX} cy={y} r={5}
                  fill="none" stroke="#2563eb" strokeWidth={1.6} />
              )}
              {!isOpen && !isMuted && (
                <circle cx={openIndicatorX} cy={y} r={5}
                  fill="none" stroke="transparent" strokeWidth={1.6}
                  className="hover:stroke-gray-300 transition-colors" />
              )}
            </g>
          </g>
        );
      })}

      {/* Clickable fret zones — the whole cell is the target, the ring
          lights up on hover */}
      {Array.from({ length: 6 }, (_, visualIdx) => {
        const di = dataIdx(visualIdx);
        return Array.from({ length: NUM_FRETS }, (_, fretIdx) => {
          const fret = fretIdx + 1;
          const x0 = fretX(fret - 1);
          const x1 = fretX(fret);
          const cx = (x0 + x1) / 2;
          const cy = stringY(visualIdx);
          const isSelected = frets[di] === fret;

          return (
            <g key={`zone-${visualIdx}-${fret}`} className="group cursor-pointer" onClick={() => onFretClick(di, fret)}>
              <rect x={x0} y={cy - stringSpacing / 2} width={x1 - x0} height={stringSpacing} fill="transparent" />
              {!isSelected && (
                <circle cx={cx} cy={cy} r={dotRadius} fill="transparent"
                  className="group-hover:fill-[rgba(255,255,255,0.22)] transition-colors" />
              )}
              {isSelected && (
                <g filter={url('markerShadow')}>
                  <circle cx={cx} cy={cy} r={dotRadius} fill={url('marker')}
                    stroke="#fff" strokeOpacity={0.85} strokeWidth={1.4} />
                  <text x={cx} y={cy + 3.5} textAnchor="middle" fill="white"
                    fontSize={9} fontWeight="bold" fontFamily="Inter, sans-serif">
                    {getNoteAtFret(di, fret)}
                  </text>
                </g>
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}

/* ─── Chord Result Card ─── */

interface ChordResultCardProps {
  chord: IdentifiedChord;
  rank: number;
  onSelect?: (chord: ParsedChord) => void;
}

function ChordResultCard({ chord, rank, onSelect }: ChordResultCardProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const handleClick = () => {
    if (!onSelect) return;
    const baseSymbol = chord.root + (chord.type === 'major' ? '' : chord.type);
    const parsed = parseChordName(baseSymbol);
    if (parsed) onSelect(parsed);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
    >
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-sm text-gray-400 shrink-0">
        {rank}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{chord.symbol}</span>
          <span className="text-sm text-gray-500">{isEn ? chord.nameEn : chord.name}</span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{isEn ? chord.descriptionEn : chord.description}</p>
      </div>
    </button>
  );
}
