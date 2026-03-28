import { useState, useMemo, useCallback } from 'react';
import { identifyChords, getNoteAtFret } from '../utils/chordIdentifier';
import type { IdentifiedChord } from '../utils/chordIdentifier';
import type { ParsedChord } from '../utils/chordUtils';
import { parseChordName } from '../utils/chordUtils';

interface FretboardIdentifierProps {
  onChordSelect?: (chord: ParsedChord) => void;
}

const NUM_FRETS = 15;
// Visual order top-to-bottom: high e → low E
const VISUAL_STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
// Fret inlay positions (standard guitar dots)
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
const DOUBLE_INLAY_FRETS = [12];

export default function FretboardIdentifier({ onChordSelect }: FretboardIdentifierProps) {
  // -1 = muted, 0 = open, 1+ = fret number
  const [frets, setFrets] = useState<number[]>([-1, -1, -1, -1, -1, -1]);

  const handleFretClick = useCallback((stringIdx: number, fret: number) => {
    setFrets(prev => {
      const next = [...prev];
      // If clicking the same fret that's already selected, deselect (mute)
      if (next[stringIdx] === fret) {
        next[stringIdx] = -1;
      } else {
        next[stringIdx] = fret;
      }
      return next;
    });
  }, []);

  const handleStringOpen = useCallback((stringIdx: number) => {
    setFrets(prev => {
      const next = [...prev];
      next[stringIdx] = next[stringIdx] === 0 ? -1 : 0;
      return next;
    });
  }, []);

  const handleStringMute = useCallback((stringIdx: number) => {
    setFrets(prev => {
      const next = [...prev];
      next[stringIdx] = -1;
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setFrets([-1, -1, -1, -1, -1, -1]);
  }, []);

  const results = useMemo(() => identifyChords(frets), [frets]);
  const hasSelection = frets.some(f => f >= 0);

  // Selected note names for display
  const selectedNotes = useMemo(() => {
    return frets.map((f, i) => {
      if (f < 0) return null;
      return getNoteAtFret(i, f);
    });
  }, [frets]);

  const uniqueNoteNames = useMemo(() => {
    const names = selectedNotes.filter(Boolean) as string[];
    return [...new Set(names)];
  }, [selectedNotes]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">指板和弦识别</h2>
          <p className="text-sm text-gray-500 mt-1">点击指板上的位置标记按弦，系统自动识别和弦</p>
        </div>
        {hasSelection && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shrink-0"
          >
            清除
          </button>
        )}
      </div>

      {/* Fretboard */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-x-auto">
        <div className="min-w-[640px] p-4">
          <Fretboard
            frets={frets}
            onFretClick={handleFretClick}
            onStringOpen={handleStringOpen}
            onStringMute={handleStringMute}
          />
        </div>
      </div>

      {/* Selected notes */}
      {hasSelection && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">选中音符：</span>
          {uniqueNoteNames.map(note => (
            <span key={note} className="px-2 py-0.5 text-sm font-medium bg-gray-100 text-gray-700 rounded">
              {note}
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {hasSelection && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {results.length > 0 ? '识别结果' : '无法识别'}
          </h3>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {results.map((chord, idx) => (
                <ChordResultCard
                  key={chord.symbol}
                  chord={chord}
                  rank={idx + 1}
                  onSelect={onChordSelect}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              当前选择的音符组合无法匹配已知和弦，请尝试调整按弦位置
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Fretboard SVG ─── */

interface FretboardProps {
  frets: number[];
  onFretClick: (stringIdx: number, fret: number) => void;
  onStringOpen: (stringIdx: number) => void;
  onStringMute: (stringIdx: number) => void;
}

function Fretboard({ frets, onFretClick, onStringOpen, onStringMute }: FretboardProps) {
  const stringSpacing = 28;
  const fretWidth = 56;
  const nutWidth = 10;  // narrow nut visual
  const controlW = 60;  // space for O / X buttons left of nut
  const leftPad = controlW + nutWidth;
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

  // X of fret wire i (0-based, so i=0 is the nut line)
  const fretX = (fret: number) => leftPad + fret * fretWidth;
  // X center of fret cell
  const fretCenterX = (fret: number) => leftPad + (fret - 0.5) * fretWidth;
  const stringY = (visualIdx: number) => topPad + visualIdx * stringSpacing;

  // Control button positions
  const openBtnX = 14;   // ○ button center X
  const muteBtnX = 38;   // × button center X
  const labelX = 56;     // string letter

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="select-none"
      style={{ maxHeight: 280 }}
    >
      {/* Nut */}
      <rect
        x={leftPad - 4}
        y={topPad - 4}
        width={5}
        height={fretboardHeight + 8}
        fill="#1a1a1a"
        rx={1}
      />

      {/* Fret wires */}
      {Array.from({ length: NUM_FRETS }, (_, i) => (
        <line
          key={`fw-${i}`}
          x1={fretX(i + 1)} y1={topPad - 2}
          x2={fretX(i + 1)} y2={topPad + fretboardHeight + 2}
          stroke="#c4c4c4" strokeWidth={1.5}
        />
      ))}

      {/* Strings — thinnest at top (high e), thickest at bottom (low E) */}
      {Array.from({ length: 6 }, (_, visualIdx) => (
        <line
          key={`str-${visualIdx}`}
          x1={leftPad} y1={stringY(visualIdx)}
          x2={leftPad + fretboardWidth} y2={stringY(visualIdx)}
          stroke="#a3a3a3"
          strokeWidth={0.85 + visualIdx * 0.15}
        />
      ))}

      {/* Fret inlays */}
      {INLAY_FRETS.map(f => {
        if (f > NUM_FRETS) return null;
        const cx = fretCenterX(f);
        const isDouble = DOUBLE_INLAY_FRETS.includes(f);
        if (isDouble) {
          return (
            <g key={`inlay-${f}`}>
              <circle cx={cx} cy={topPad + 1.5 * stringSpacing} r={3.5} fill="#e0e0e0" />
              <circle cx={cx} cy={topPad + 3.5 * stringSpacing} r={3.5} fill="#e0e0e0" />
            </g>
          );
        }
        return (
          <circle key={`inlay-${f}`} cx={cx} cy={topPad + 2.5 * stringSpacing} r={3.5} fill="#e0e0e0" />
        );
      })}

      {/* Fret numbers */}
      {[1, 3, 5, 7, 9, 12, 15].map(f => {
        if (f > NUM_FRETS) return null;
        return (
          <text key={`fn-${f}`} x={fretCenterX(f)} y={topPad + fretboardHeight + 18}
            textAnchor="middle" fill="#bbb" fontSize={10} fontFamily="Inter, sans-serif">
            {f}
          </text>
        );
      })}

      {/* Per-string controls: ○ open / × mute / label */}
      {VISUAL_STRING_LABELS.map((label, visualIdx) => {
        const di = dataIdx(visualIdx);
        const fretVal = frets[di];
        const y = stringY(visualIdx);
        const isOpen = fretVal === 0;
        const isMuted = fretVal === -1;

        return (
          <g key={`ctrl-${visualIdx}`}>
            {/* ○ Open button */}
            <g className="cursor-pointer" onClick={() => onStringOpen(di)}>
              <rect x={openBtnX - 11} y={y - 11} width={22} height={22} fill="transparent" />
              <circle
                cx={openBtnX} cy={y} r={8}
                fill={isOpen ? '#2563eb' : 'none'}
                stroke={isOpen ? '#2563eb' : '#d1d5db'}
                strokeWidth={1.5}
              />
              {isOpen && (
                <text x={openBtnX} y={y + 3.5} textAnchor="middle" fill="white"
                  fontSize={7} fontWeight="bold" fontFamily="Inter, sans-serif">
                  {getNoteAtFret(di, 0)}
                </text>
              )}
            </g>

            {/* × Mute button */}
            <g className="cursor-pointer" onClick={() => onStringMute(di)}>
              <rect x={muteBtnX - 10} y={y - 11} width={20} height={22} fill="transparent" />
              <text x={muteBtnX} y={y + 5} textAnchor="middle"
                fill={isMuted ? '#ef4444' : '#d1d5db'}
                fontSize={16} fontWeight="bold" fontFamily="Inter, sans-serif"
              >×</text>
            </g>

            {/* String label */}
            <text x={labelX} y={y + 4} textAnchor="middle"
              fill={isMuted ? '#bbb' : '#555'}
              fontSize={11} fontWeight="500" fontFamily="Inter, sans-serif">
              {label}
            </text>
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
              <rect
                x={cx - fretWidth / 2} y={cy - stringSpacing / 2}
                width={fretWidth} height={stringSpacing}
                fill="transparent"
              />
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
  const handleClick = () => {
    if (!onSelect) return;
    // Parse the chord to get a full ParsedChord object
    const baseSymbol = chord.root + (chord.type === 'major' ? '' : chord.type);
    const parsed = parseChordName(baseSymbol);
    if (parsed) onSelect(parsed);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left cursor-pointer"
    >
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 shrink-0">
        {rank}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{chord.symbol}</span>
          <span className="text-xs text-gray-500">{chord.name}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{chord.description}</p>
      </div>
    </button>
  );
}
