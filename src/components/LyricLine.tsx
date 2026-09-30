import { useRef } from 'react';
import { placeChordLabels, type LineChord } from '../utils/chordLabels';

export type { LineChord };

// How a line is shown relative to playback: sung lines stay dark gray, lines
// not reached yet are light gray, the line being worked on is darkest
export type LineTone = 'normal' | 'current' | 'sung' | 'upcoming';

const TONE_CLASSES: Record<LineTone, { text: string; chord: string }> = {
  normal: { text: 'text-gray-800', chord: 'text-blue-600' },
  current: { text: 'text-gray-900', chord: 'text-blue-600' },
  sung: { text: 'text-gray-600', chord: 'text-blue-500' },
  upcoming: { text: 'text-gray-300', chord: 'text-blue-300' },
};

interface LyricLineProps {
  line: string;
  chords: LineChord[];
  fontPx: number;
  tone: LineTone;
  /** Makes each character clickable to place a chord; a chord label counts
   *  as a click on its character */
  onCharClick?: (e: React.MouseEvent, charIndex: number) => void;
  chordTitle?: string;
  /** Karaoke fill for the line being sung: share of it already sung, 0–1.
   *  Sung characters are dark gray, the rest light gray. */
  progress?: number;
  /** Chord label size; defaults to the lyrics size */
  chordPx?: number;
  /** Semibold lyrics (the large karaoke lines) */
  bold?: boolean;
}

/** One lyric line with its chords positioned exactly above their characters. */
export default function LyricLine({
  line, chords, fontPx, tone, onCharClick, chordTitle, progress, chordPx = fontPx, bold = false,
}: LyricLineProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const colors = TONE_CLASSES[tone];
  const chars = [...line];
  const karaoke = progress !== undefined;
  // Light up a character as soon as its turn starts
  const sungCount = karaoke ? Math.ceil(progress * chars.length) : 0;
  // Measured with the same weight the lyrics are drawn in, so chords stay aligned
  const labels = placeChordLabels(line, chords, fontPx, chordPx, bold);

  return (
    <div>
      {/* As wide as its labels, which can run past the text, so the line's
          box holds them instead of spilling over */}
      <div
        className="relative"
        style={{ fontFamily: 'monospace', fontSize: chordPx, height: Math.round(chordPx * 1.3), minWidth: labels.length ? labels[labels.length - 1].right : undefined }}
      >
        {labels.map(c => (
          <span
            key={c.charIndex}
            className={`absolute top-0 font-bold whitespace-nowrap ${colors.chord} ${
              onCharClick ? 'cursor-pointer hover:text-blue-800 transition-colors' : ''
            }`}
            style={{ left: c.left }}
            // Opens the chord's character, where it can be changed or deleted
            onClick={onCharClick ? () => (textRef.current?.children[c.charIndex] as HTMLElement | undefined)?.click() : undefined}
            title={onCharClick ? chordTitle : undefined}
          >
            {c.chord}
          </span>
        ))}
      </div>
      <div
        ref={textRef}
        className={`whitespace-pre leading-relaxed mb-1 transition-colors ${colors.text}`}
        // The large semibold lines get tighter leading so three fit on screen
        style={{ fontFamily: 'monospace', fontSize: fontPx, fontWeight: bold ? 600 : undefined, lineHeight: bold ? 1.35 : undefined }}
      >
        {onCharClick || karaoke
          ? chars.map((char, ci) => {
              const hasChord = chords.some(p => p.charIndex === ci);
              // Karaoke: sung characters dark, the rest light
              const fill = karaoke ? (ci < sungCount ? 'text-gray-700' : 'text-gray-300') : '';
              return (
                <span
                  key={ci}
                  className={`transition-colors duration-150 rounded-sm ${onCharClick ? 'cursor-pointer' : ''} ${
                    hasChord && onCharClick
                      ? `bg-blue-100 ${fill || 'text-blue-800'}`
                      : `${fill} ${onCharClick ? 'hover:bg-gray-100' : ''}`
                  }`}
                  onClick={onCharClick ? e => onCharClick(e, ci) : undefined}
                >
                  {char}
                </span>
              );
            })
          : line}
      </div>
    </div>
  );
}
