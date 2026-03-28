import { useState, useMemo, useCallback } from 'react';
import { identifyChords, getNoteAtFret } from '../utils/chordIdentifier';
import type { IdentifiedChord } from '../utils/chordIdentifier';
import type { ParsedChord } from '../utils/chordUtils';
import { parseChordName } from '../utils/chordUtils';

interface FretboardIdentifierProps {
  onChordSelect?: (chord: ParsedChord) => void;
}

const NUM_FRETS = 15;
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
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

  const handleStringToggle = useCallback((stringIdx: number) => {
    setFrets(prev => {
      const next = [...prev];
      // Cycle: muted → open → muted
      if (next[stringIdx] === -1) {
        next[stringIdx] = 0;
      } else if (next[stringIdx] === 0) {
        next[stringIdx] = -1;
      } else {
        // If a fret is selected, clicking the header mutes it
        next[stringIdx] = -1;
      }
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
            onStringToggle={handleStringToggle}
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
  onStringToggle: (stringIdx: number) => void;
}

function Fretboard({ frets, onFretClick, onStringToggle }: FretboardProps) {
  const stringSpacing = 28;
  const fretWidth = 56;
  const nutWidth = 36;
  const leftPad = 30;
  const topPad = 8;
  const bottomPad = 24;
  const dotRadius = 10;

  const fretboardWidth = nutWidth + NUM_FRETS * fretWidth;
  const fretboardHeight = (5 * stringSpacing);
  const totalWidth = leftPad + fretboardWidth + 10;
  const totalHeight = topPad + fretboardHeight + bottomPad;

  // X position of fret wire (right edge of fret)
  const fretX = (fret: number) => leftPad + nutWidth + fret * fretWidth;
  // X center of a fret cell (where finger goes)
  const fretCenterX = (fret: number) => {
    if (fret === 0) return leftPad + nutWidth / 2;
    return leftPad + nutWidth + (fret - 0.5) * fretWidth;
  };
  const stringY = (s: number) => topPad + s * stringSpacing;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="select-none"
      style={{ maxHeight: 280 }}
    >
      {/* Nut */}
      <rect
        x={leftPad + nutWidth - 3}
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
          x1={fretX(i + 1)}
          y1={topPad - 2}
          x2={fretX(i + 1)}
          y2={topPad + fretboardHeight + 2}
          stroke="#c4c4c4"
          strokeWidth={1.5}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`str-${i}`}
          x1={leftPad}
          y1={stringY(i)}
          x2={leftPad + fretboardWidth}
          y2={stringY(i)}
          stroke="#a3a3a3"
          strokeWidth={1.6 - i * 0.15}
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
          <circle
            key={`inlay-${f}`}
            cx={cx}
            cy={topPad + 2.5 * stringSpacing}
            r={3.5}
            fill="#e0e0e0"
          />
        );
      })}

      {/* Fret numbers */}
      {[1, 3, 5, 7, 9, 12, 15].map(f => {
        if (f > NUM_FRETS) return null;
        return (
          <text
            key={`fn-${f}`}
            x={fretCenterX(f)}
            y={topPad + fretboardHeight + 18}
            textAnchor="middle"
            fill="#bbb"
            fontSize={10}
            fontFamily="Inter, sans-serif"
          >
            {f}
          </text>
        );
      })}

      {/* String labels (left side) */}
      {STRING_LABELS.map((label, i) => (
        <text
          key={`sl-${i}`}
          x={leftPad - 10}
          y={stringY(i) + 4}
          textAnchor="middle"
          fill="#999"
          fontSize={11}
          fontWeight="500"
          fontFamily="Inter, sans-serif"
          className="cursor-pointer"
          onClick={() => onStringToggle(i)}
        >
          {label}
        </text>
      ))}

      {/* Open / Muted indicators above nut */}
      {frets.map((f, i) => {
        const x = fretCenterX(0);
        const y = stringY(i);
        if (f === 0) {
          return (
            <g key={`open-${i}`} className="cursor-pointer" onClick={() => onStringToggle(i)}>
              <circle cx={x} cy={y} r={dotRadius} fill="#2563eb" opacity={0.9} />
              <text
                x={x} y={y + 3.5}
                textAnchor="middle" fill="white"
                fontSize={8} fontWeight="bold" fontFamily="Inter, sans-serif"
              >
                {getNoteAtFret(i, 0)}
              </text>
            </g>
          );
        }
        return null;
      })}

      {/* Clickable fret zones */}
      {Array.from({ length: 6 }, (_, stringIdx) =>
        Array.from({ length: NUM_FRETS }, (_, fretIdx) => {
          const fret = fretIdx + 1;
          const cx = fretCenterX(fret);
          const cy = stringY(stringIdx);
          const isSelected = frets[stringIdx] === fret;

          return (
            <g
              key={`zone-${stringIdx}-${fret}`}
              className="cursor-pointer"
              onClick={() => onFretClick(stringIdx, fret)}
            >
              {/* Hit area */}
              <rect
                x={cx - fretWidth / 2}
                y={cy - stringSpacing / 2}
                width={fretWidth}
                height={stringSpacing}
                fill="transparent"
              />
              {/* Hover indicator */}
              {!isSelected && (
                <circle
                  cx={cx} cy={cy} r={dotRadius}
                  fill="transparent"
                  className="hover:fill-gray-200 transition-colors"
                />
              )}
              {/* Selected dot */}
              {isSelected && (
                <>
                  <circle cx={cx} cy={cy} r={dotRadius} fill="#2563eb" />
                  <text
                    x={cx} y={cy + 3.5}
                    textAnchor="middle" fill="white"
                    fontSize={8} fontWeight="bold" fontFamily="Inter, sans-serif"
                  >
                    {getNoteAtFret(stringIdx, fret)}
                  </text>
                </>
              )}
            </g>
          );
        })
      )}

      {/* Muted string indicators */}
      {frets.map((f, i) => {
        if (f !== -1) return null;
        return (
          <text
            key={`mute-${i}`}
            x={leftPad - 10}
            y={stringY(i) + 4}
            textAnchor="middle"
            fill="#ccc"
            fontSize={11}
            fontWeight="500"
            fontFamily="Inter, sans-serif"
            className="cursor-pointer"
            onClick={() => onStringToggle(i)}
          >
            {STRING_LABELS[i]}
          </text>
        );
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
