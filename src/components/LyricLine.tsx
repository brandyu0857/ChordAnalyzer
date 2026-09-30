import { measureTextWidth } from '../utils/textWidth';

export interface LineChord {
  charIndex: number;
  chord: string;
}

// How a line is shown relative to playback: sung lines stay dark gray, lines
// not reached yet are light gray, the line being worked on is darkest
export type LineTone = 'normal' | 'current' | 'sung' | 'upcoming';

const TONE_CLASSES: Record<LineTone, { text: string; chord: string }> = {
  normal: { text: 'text-gray-800', chord: 'text-blue-600' },
  current: { text: 'text-gray-900', chord: 'text-blue-600' },
  sung: { text: 'text-gray-600', chord: 'text-blue-500' },
  upcoming: { text: 'text-gray-300', chord: 'text-blue-300' },
};

const CHORD_GAP_PX = 6;

interface LyricLineProps {
  line: string;
  chords: LineChord[];
  fontPx: number;
  tone: LineTone;
  /** Makes each character clickable to place a chord */
  onCharClick?: (e: React.MouseEvent, charIndex: number) => void;
  /** Makes each chord label clickable (to remove it) */
  onChordClick?: (charIndex: number) => void;
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
  line, chords, fontPx, tone, onCharClick, onChordClick, chordTitle, progress, chordPx = fontPx, bold = false,
}: LyricLineProps) {
  // Measured with the same weight they're drawn in, so chords stay aligned
  const lyricsFont = `${bold ? '600 ' : ''}${fontPx}px monospace`;
  const chordFont = `bold ${chordPx}px monospace`;
  const colors = TONE_CLASSES[tone];
  const chars = [...line];
  const karaoke = progress !== undefined;
  // Light up a character as soon as its turn starts
  const sungCount = karaoke ? Math.ceil(progress * chars.length) : 0;
  const sorted = [...chords].sort((a, b) => a.charIndex - b.charIndex);

  // Chord labels are pixel-positioned via measured text width, so each lands
  // exactly above its target character regardless of font metrics (CJK glyphs
  // render wider than Latin ones, by an amount that varies by font/OS) —
  // pushed right only if it would otherwise overlap the previous label.
  const labels = sorted.reduce<(LineChord & { left: number; right: number })[]>((acc, c) => {
    const naturalLeft = measureTextWidth(line.slice(0, c.charIndex), lyricsFont);
    const left = Math.max(naturalLeft, acc.length ? acc[acc.length - 1].right : 0);
    const right = left + measureTextWidth(c.chord, chordFont) + CHORD_GAP_PX;
    return [...acc, { ...c, left, right }];
  }, []);

  return (
    <div>
      <div className="relative" style={{ fontFamily: 'monospace', fontSize: chordPx, height: Math.round(chordPx * 1.3) }}>
        {labels.map(c => (
          <span
            key={c.charIndex}
            className={`absolute top-0 font-bold whitespace-nowrap ${colors.chord} ${
              onChordClick ? 'cursor-pointer hover:text-red-500 transition-colors' : ''
            }`}
            style={{ left: c.left }}
            onClick={onChordClick ? () => onChordClick(c.charIndex) : undefined}
            title={onChordClick ? chordTitle : undefined}
          >
            {c.chord}
          </span>
        ))}
      </div>
      <div
        className={`whitespace-pre leading-relaxed mb-1 transition-colors ${colors.text}`}
        style={{ fontFamily: 'monospace', fontSize: fontPx, fontWeight: bold ? 600 : undefined }}
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
