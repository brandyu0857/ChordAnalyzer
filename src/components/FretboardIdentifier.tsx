import { useState, useMemo, useCallback } from 'react';
import { identifyChords, getNoteAtFret } from '../utils/chordIdentifier';
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

  const results = useMemo(() => identifyChords(frets), [frets]);
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

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEn ? 'Fretboard Chord Identifier' : '指板和弦识别'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEn ? 'Click positions on the fretboard to mark frets, chords are identified automatically' : '点击指板上的位置标记按弦，系统自动识别和弦'}
          </p>
        </div>
        {hasNonDefault && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shrink-0"
          >
            {isEn ? 'Reset' : '重置'}
          </button>
        )}
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

      {/* Selected notes */}
      {hasNonDefault && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">{isEn ? 'Sounding notes:' : '发音音符：'}</span>
          {soundingNotes.map((note, i) => (
            <span key={i} className="px-2 py-0.5 text-sm font-medium bg-gray-100 text-gray-700 rounded">
              {note}
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {isEn ? 'Results' : '识别结果'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((chord, idx) => (
              <ChordResultCard
                key={chord.symbol}
                chord={chord}
                rank={idx + 1}
                onSelect={(parsed) => {
                  if (!onChordSelect) return;
                  // Convert visual order (high e first) to GuitarFingering order (low E first)
                  const fingeringFrets = [...frets].reverse();
                  const pressed = fingeringFrets.filter(f => f > 0);
                  const maxFret = pressed.length ? Math.max(...pressed) : 0;
                  const minFret = pressed.length ? Math.min(...pressed) : 0;
                  const startFret = maxFret <= 5 ? 0 : Math.max(1, minFret - 1);
                  onChordSelect(parsed, { frets: fingeringFrets, startFret: startFret || undefined });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Fretboard SVG ─── */

interface FretboardProps {
  frets: number[];
  onFretClick: (stringIdx: number, fret: number) => void;
  onStringMute: (stringIdx: number) => void;
}

function Fretboard({ frets, onFretClick, onStringMute }: FretboardProps) {
  const { isDark } = useLocale();
  const fc = isDark
    ? { nut: '#e5e5e5', fretWire: '#3a3a3a', string: '#525252', inlay: '#333', fretNum: '#555', muted: '#ef4444', muteOff: '#444' }
    : { nut: '#1a1a1a', fretWire: '#c4c4c4', string: '#a3a3a3', inlay: '#e0e0e0', fretNum: '#bbb', muted: '#ef4444', muteOff: '#d1d5db' };
  const stringSpacing = 28;
  const fretWidth = 56;
  const controlW = 46;  // space for × button + string label
  const nutX = controlW;
  const leftPad = nutX;
  const topPad = 8;
  const bottomPad = 24;
  const dotRadius = 10;

  const fretboardWidth = NUM_FRETS * fretWidth;
  const fretboardHeight = 5 * stringSpacing;
  const totalWidth = leftPad + fretboardWidth + 10;
  const totalHeight = topPad + fretboardHeight + bottomPad;

  // Visual row 0 (top) = 1st string (high e) = frets[5]
  // Visual row 5 (bottom) = 6th string (low E) = frets[0]
  const dataIdx = (visualIdx: number) => 5 - visualIdx;

  const fretX = (fret: number) => leftPad + fret * fretWidth;
  const fretCenterX = (fret: number) => leftPad + (fret - 0.5) * fretWidth;
  const stringY = (visualIdx: number) => topPad + visualIdx * stringSpacing;

  const muteBtnX = 14;
  const labelX = 30;
  const openIndicatorX = 42;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="select-none"
      style={{ maxHeight: 280 }}
    >
      {/* Nut */}
      <rect x={nutX - 3} y={topPad - 4} width={5} height={fretboardHeight + 8} fill={fc.nut} rx={1} />

      {/* Fret wires */}
      {Array.from({ length: NUM_FRETS }, (_, i) => (
        <line key={`fw-${i}`}
          x1={fretX(i + 1)} y1={topPad - 2}
          x2={fretX(i + 1)} y2={topPad + fretboardHeight + 2}
          stroke={fc.fretWire} strokeWidth={1.5}
        />
      ))}

      {/* Strings — thinnest at top (high e), thickest at bottom (low E) */}
      {Array.from({ length: 6 }, (_, visualIdx) => (
        <line key={`str-${visualIdx}`}
          x1={nutX} y1={stringY(visualIdx)}
          x2={leftPad + fretboardWidth} y2={stringY(visualIdx)}
          stroke={fc.string} strokeWidth={0.85 + visualIdx * 0.15}
        />
      ))}

      {/* Fret inlays */}
      {INLAY_FRETS.map(f => {
        if (f > NUM_FRETS) return null;
        const cx = fretCenterX(f);
        return DOUBLE_INLAY_FRETS.includes(f) ? (
          <g key={`inlay-${f}`}>
            <circle cx={cx} cy={topPad + 1.5 * stringSpacing} r={3.5} fill={fc.inlay} />
            <circle cx={cx} cy={topPad + 3.5 * stringSpacing} r={3.5} fill={fc.inlay} />
          </g>
        ) : (
          <circle key={`inlay-${f}`} cx={cx} cy={topPad + 2.5 * stringSpacing} r={3.5} fill={fc.inlay} />
        );
      })}

      {/* Fret numbers */}
      {[1, 3, 5, 7, 9, 12, 15].map(f => f <= NUM_FRETS && (
        <text key={`fn-${f}`} x={fretCenterX(f)} y={topPad + fretboardHeight + 18}
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
              fill={isMuted ? '#bbb' : '#555'}
              fontSize={11} fontWeight="500" fontFamily="Inter, sans-serif">{label}</text>

            {/* Open-string indicator (○) — click to mute */}
            <g className="cursor-pointer" onClick={() => onStringMute(di)}>
              <rect x={openIndicatorX - 10} y={y - 10} width={20} height={20} fill="transparent" />
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

      {/* Clickable fret zones */}
      {Array.from({ length: 6 }, (_, visualIdx) => {
        const di = dataIdx(visualIdx);
        return Array.from({ length: NUM_FRETS }, (_, fretIdx) => {
          const fret = fretIdx + 1;
          const cx = fretCenterX(fret);
          const cy = stringY(visualIdx);
          const isSelected = frets[di] === fret;

          return (
            <g key={`zone-${visualIdx}-${fret}`} className="cursor-pointer" onClick={() => onFretClick(di, fret)}>
              <rect x={cx - fretWidth / 2} y={cy - stringSpacing / 2}
                width={fretWidth} height={stringSpacing} fill="transparent" />
              {!isSelected && (
                <circle cx={cx} cy={cy} r={dotRadius}
                  fill="transparent" className="hover:fill-gray-200 transition-colors" />
              )}
              {isSelected && (
                <>
                  <circle cx={cx} cy={cy} r={dotRadius} fill="#2563eb" />
                  <text x={cx} y={cy + 3.5} textAnchor="middle" fill="white"
                    fontSize={8} fontWeight="bold" fontFamily="Inter, sans-serif">
                    {getNoteAtFret(di, fret)}
                  </text>
                </>
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
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 shrink-0">
        {rank}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{chord.symbol}</span>
          <span className="text-xs text-gray-500">{isEn ? chord.nameEn : chord.name}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{isEn ? chord.descriptionEn : chord.description}</p>
      </div>
    </button>
  );
}
