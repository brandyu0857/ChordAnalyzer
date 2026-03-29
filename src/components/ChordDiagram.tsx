import { useState } from 'react';
import type { GuitarFingering } from '../data/chords';
import { GUITAR_TUNING } from '../data/chords';
import { NOTES } from '../data/notes';
import { useLocale } from '../i18n/context';

interface ChordDiagramProps {
  fingering: GuitarFingering;
  chordName: string;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export default function ChordDiagram({ fingering, chordName, size = 'medium', interactive = true }: ChordDiagramProps) {
  const { locale, isDark } = useLocale();
  const isEn = locale === 'en';
  const [showNotes, setShowNotes] = useState(false);

  // SVG colors adapt to dark mode
  const c = isDark
    ? { text: '#fafafa', solid: '#e5e5e5', fret: '#3a3a3a', string: '#525252', muted: '#666', note: '#888', hint: '#444', dotText: '#121212' }
    : { text: '#111', solid: '#1a1a1a', fret: '#d4d4d4', string: '#a3a3a3', muted: '#999', note: '#888', hint: '#ccc', dotText: 'white' };
  const scale = size === 'small' ? 0.65 : size === 'large' ? 1.2 : 1;
  const stringSpacing = 28 * scale;
  const fretSpacing = 32 * scale;
  const numFrets = 5;
  const numStrings = 6;
  const paddingTop = 50 * scale;
  const paddingLeft = 35 * scale;
  const paddingBottom = 30 * scale;
  const paddingRight = 35 * scale;
  const dotRadius = 9 * scale;

  const width = paddingLeft + (numStrings - 1) * stringSpacing + paddingRight;
  const height = paddingTop + numFrets * fretSpacing + paddingBottom;

  const startFret = fingering.startFret || 0;
  const isOpenPosition = startFret === 0 || startFret === 1;

  const noteNames = fingering.frets.map((fret, i) => {
    if (fret === -1) return 'X';
    const noteIndex = (GUITAR_TUNING[i] + fret) % 12;
    return NOTES[noteIndex];
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`select-none ${interactive ? 'cursor-pointer' : ''}`}
      onClick={interactive ? () => setShowNotes(prev => !prev) : undefined}
    >
      {/* Chord name */}
      <text
        x={paddingLeft + ((numStrings - 1) * stringSpacing) / 2}
        y={14 * scale}
        textAnchor="middle"
        fill={c.text}
        fontSize={16 * scale}
        fontWeight="bold"
        fontFamily="Inter, sans-serif"
      >
        {chordName}
      </text>

      {/* Nut */}
      {isOpenPosition && (
        <rect
          x={paddingLeft - 2}
          y={paddingTop - 3 * scale}
          width={(numStrings - 1) * stringSpacing + 4}
          height={5 * scale}
          fill={c.solid}
          rx={1}
        />
      )}

      {/* Starting fret indicator */}
      {!isOpenPosition && startFret > 1 && (
        <text
          x={paddingLeft - 14 * scale}
          y={paddingTop + fretSpacing / 2 + 4 * scale}
          textAnchor="middle"
          fill={c.muted}
          fontSize={11 * scale}
          fontFamily="Inter, sans-serif"
        >
          {startFret}fr
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: numFrets + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={paddingLeft}
          y1={paddingTop + i * fretSpacing}
          x2={paddingLeft + (numStrings - 1) * stringSpacing}
          y2={paddingTop + i * fretSpacing}
          stroke={c.fret}
          strokeWidth={1}
        />
      ))}

      {/* String lines */}
      {Array.from({ length: numStrings }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={paddingLeft + i * stringSpacing}
          y1={paddingTop}
          x2={paddingLeft + i * stringSpacing}
          y2={paddingTop + numFrets * fretSpacing}
          stroke={c.string}
          strokeWidth={1 + (5 - i) * 0.15}
        />
      ))}

      {/* Barre indicator */}
      {fingering.barreAt !== undefined && (() => {
        const barreStrings = fingering.frets
          .map((f, i) => ({ fret: f, index: i }))
          .filter(s => s.fret === fingering.barreAt);

        if (barreStrings.length >= 2) {
          const firstStr = barreStrings[0].index;
          const lastStr = barreStrings[barreStrings.length - 1].index;
          const barreDisplayFret = fingering.barreAt! - (startFret > 1 ? startFret - 1 : 0);

          return (
            <rect
              x={paddingLeft + firstStr * stringSpacing - dotRadius}
              y={paddingTop + (barreDisplayFret - 0.5) * fretSpacing - dotRadius * 0.7}
              width={(lastStr - firstStr) * stringSpacing + dotRadius * 2}
              height={dotRadius * 1.4}
              rx={dotRadius * 0.7}
              fill={c.solid}
              opacity={0.9}
            />
          );
        }
        return null;
      })()}

      {/* Finger dots */}
      {fingering.frets.map((fret, stringIdx) => {
        if (fret <= 0) return null;
        const displayFret = fret - (startFret > 1 ? startFret - 1 : 0);
        const x = paddingLeft + stringIdx * stringSpacing;
        const y = paddingTop + (displayFret - 0.5) * fretSpacing;
        const noteName = noteNames[stringIdx];

        return (
          <g key={`dot-${stringIdx}`}>
            <circle cx={x} cy={y} r={dotRadius} fill={c.solid} />
            {showNotes ? (
              <text
                x={x} y={y + 3.5 * scale}
                textAnchor="middle" fill={c.dotText}
                fontSize={noteName.length > 1 ? 7.5 * scale : 9 * scale}
                fontWeight="bold" fontFamily="Inter, sans-serif"
              >
                {noteName}
              </text>
            ) : (
              fingering.fingers && fingering.fingers[stringIdx] > 0 && (
                <text
                  x={x} y={y + 3.5 * scale}
                  textAnchor="middle" fill={c.dotText}
                  fontSize={9 * scale} fontWeight="bold" fontFamily="Inter, sans-serif"
                >
                  {fingering.fingers[stringIdx]}
                </text>
              )
            )}
          </g>
        );
      })}

      {/* Open and muted string indicators */}
      {fingering.frets.map((fret, stringIdx) => {
        const x = paddingLeft + stringIdx * stringSpacing;
        const y = paddingTop - 14 * scale;

        if (fret === 0) {
          if (showNotes) {
            const noteName = noteNames[stringIdx];
            return (
              <g key={`open-${stringIdx}`}>
                <circle cx={x} cy={y} r={dotRadius * 0.7} fill={c.solid} />
                <text x={x} y={y + 3 * scale} textAnchor="middle" fill={c.dotText}
                  fontSize={noteName.length > 1 ? 6.5 * scale : 8 * scale}
                  fontWeight="bold" fontFamily="Inter, sans-serif"
                >{noteName}</text>
              </g>
            );
          }
          return (
            <circle key={`open-${stringIdx}`} cx={x} cy={y} r={5 * scale}
              fill="none" stroke={c.muted} strokeWidth={1.5} />
          );
        }
        if (fret === -1) {
          return (
            <text key={`mute-${stringIdx}`} x={x} y={y + 4 * scale}
              textAnchor="middle" fill={c.muted} fontSize={12 * scale}
              fontWeight="bold" fontFamily="Inter, sans-serif"
            >X</text>
          );
        }
        return null;
      })}

      {/* Note names below */}
      {noteNames.map((note, i) => (
        <text key={`note-${i}`}
          x={paddingLeft + i * stringSpacing}
          y={paddingTop + numFrets * fretSpacing + 18 * scale}
          textAnchor="middle"
          fill={note === 'X' ? c.hint : c.note}
          fontSize={10 * scale} fontFamily="Inter, sans-serif"
        >{note}</text>
      ))}

      {/* Click hint */}
      {size === 'large' && (
        <text
          x={paddingLeft + ((numStrings - 1) * stringSpacing) / 2}
          y={height - 2}
          textAnchor="middle" fill={c.hint}
          fontSize={8 * scale} fontFamily="Inter, sans-serif"
        >
          {showNotes
            ? (isEn ? 'Click to show fingering' : '点击切换为指法')
            : (isEn ? 'Click to show note names' : '点击显示音名')}
        </text>
      )}
    </svg>
  );
}
