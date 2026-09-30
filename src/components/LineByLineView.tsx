import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { measureTextWidth } from '../utils/textWidth';
import LyricLine, { type LineChord } from './LyricLine';

interface LineByLineViewProps {
  lines: string[];
  navLines: number[];         // indices of non-empty lines, in order
  focusLine: number;
  /** Karaoke fill of the focused line while it's being sung, 0–1 */
  focusProgress?: number;
  chordsForLine: (li: number) => LineChord[];
  onFocusLine: (li: number) => void;
  onCharClick: (e: React.MouseEvent, li: number, ci: number) => void;
  onChordClick: (li: number, ci: number) => void;
  containerRef: Ref<HTMLDivElement>;
  /** Lyric size to use when the lines fit; shrinks when the longest doesn't */
  fontPx: number;
  syncing: boolean;           // marking line starts while listening
  isEn: boolean;
  children?: ReactNode;       // the chord popover, positioned inside
}

const LINES_AHEAD = 2;
const MIN_FONT_PX = 20;

/** Width of the box the lines sit in, kept up to date on resize. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Transcribe one line at a time: the line being sung, large and clickable,
 * with the next lines previewed in light gray.
 */
export default function LineByLineView({
  lines, navLines, focusLine, focusProgress, chordsForLine, onFocusLine, onCharClick, onChordClick,
  containerRef, fontPx: maxFontPx, syncing, isEn, children,
}: LineByLineViewProps) {
  const pos = Math.max(0, navLines.indexOf(focusLine));
  // One size for the whole song, as large as allowed while its longest line
  // still fits across (text width scales with the font size)
  const [boxRef, boxWidth] = useWidth();
  const longest = useMemo(
    () => Math.max(1, ...navLines.map(li => measureTextWidth(lines[li], `600 ${maxFontPx}px monospace`))),
    [lines, navLines, maxFontPx],
  );
  const fontPx = boxWidth
    ? Math.max(MIN_FONT_PX, Math.min(maxFontPx, Math.floor(maxFontPx * (boxWidth - (syncing ? 24 : 0)) / longest)))
    : maxFontPx;
  // Chords at about half the lyric size keep the lines close together
  const chordPx = Math.max(14, Math.round(fontPx * 0.55));
  const ahead = navLines.slice(pos + 1, pos + 1 + LINES_AHEAD);

  if (!navLines.length) {
    return <p className="text-base text-gray-400">{isEn ? 'No lyrics yet' : '还没有歌词'}</p>;
  }

  return (
    <div ref={boxRef} className="w-full flex justify-center">
      <div ref={containerRef} className="relative max-w-full select-none">
        <div className={`overflow-x-auto rounded-lg ${syncing ? 'ring-2 ring-amber-300 px-3 -mx-3' : ''}`}>
          <LyricLine
            line={lines[focusLine]}
            chords={chordsForLine(focusLine)}
            fontPx={fontPx}
            chordPx={chordPx}
            bold
            tone="current"
            progress={focusProgress}
            onCharClick={(e, ci) => onCharClick(e, focusLine, ci)}
            onChordClick={ci => onChordClick(focusLine, ci)}
            chordTitle={isEn ? 'Click to remove' : '点击删除'}
          />
        </div>
        {ahead.map(li => (
          <button
            key={li}
            className="block max-w-full overflow-x-auto text-left cursor-pointer"
            onClick={() => onFocusLine(li)}
            title={isEn ? 'Go to this line' : '跳到这句'}
          >
            <LyricLine line={lines[li]} chords={chordsForLine(li)} fontPx={fontPx} chordPx={chordPx} bold tone="upcoming" />
          </button>
        ))}
        {children}
      </div>
    </div>
  );
}
