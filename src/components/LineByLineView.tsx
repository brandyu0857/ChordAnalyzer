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
  containerRef: Ref<HTMLDivElement>;
  /** Lyric size to use when the lines fit; shrinks when the longest doesn't */
  fontPx: number;
  /** Scrolling / swiping over the lyrics: one line back (-1) or on (1) per step */
  onStep?: (dir: 1 | -1) => void;
  syncing: boolean;           // marking line starts while listening
  isEn: boolean;
  children?: ReactNode;       // the chord popover, positioned inside
}

const LINES_AHEAD = 2;
const MIN_FONT_PX = 20;

// Scrolling: pixels of wheel travel for one line, and the shortest time
// between two lines for a mouse wheel (a trackpad swipe moves one line)
const WHEEL_STEP_PX = 50;
const WHEEL_REPEAT_MS = 150;
const GESTURE_GAP_MS = 150;
const SWIPE_PX = 40;

/** Width of the box the lines sit in, kept up to date on resize. */
function useWidth(el: HTMLElement | null) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return width;
}

/**
 * Move one line per wheel notch or swipe, never a page's worth. A trackpad
 * sends a stream of small deltas (with momentum) for one swipe, so after a
 * step it waits for that stream to stop; a mouse wheel's big notches each
 * count, a little apart.
 */
function useLineScroll(el: HTMLElement | null, onStep: ((dir: 1 | -1) => void) | undefined) {
  const stepRef = useRef(onStep);
  useLayoutEffect(() => { stepRef.current = onStep; });

  useLayoutEffect(() => {
    if (!el) return;
    let acc = 0, locked = false, lastEvent = 0, lastStep = 0;
    const onWheel = (e: WheelEvent) => {
      if (!stepRef.current || e.ctrlKey) return;   // ctrl+wheel is pinch zoom
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;
      if (locked) {
        const newNotch = Math.abs(dy) >= WHEEL_STEP_PX && now - lastStep > WHEEL_REPEAT_MS;
        if (gap < GESTURE_GAP_MS && !newNotch) return;
        locked = false;
        acc = 0;
      }
      acc += dy;
      if (Math.abs(acc) >= WHEEL_STEP_PX) {
        stepRef.current(acc > 0 ? 1 : -1);
        locked = true;
        lastStep = now;
        acc = 0;
      }
    };
    let startY: number | null = null;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches.length === 1 ? e.touches[0].clientY : null; };
    const onTouchEnd = (e: TouchEvent) => {
      if (startY === null || !stepRef.current) return;
      const dy = startY - e.changedTouches[0].clientY;
      startY = null;
      if (Math.abs(dy) >= SWIPE_PX) stepRef.current(dy > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [el]);
}

/**
 * Transcribe one line at a time: the line being sung, large and clickable,
 * with the next lines previewed in light gray. Scrolling moves a line at a time.
 */
export default function LineByLineView({
  lines, navLines, focusLine, focusProgress, chordsForLine, onFocusLine, onCharClick,
  containerRef, fontPx: maxFontPx, onStep, syncing, isEn, children,
}: LineByLineViewProps) {
  const pos = Math.max(0, navLines.indexOf(focusLine));
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useLineScroll(box, onStep);
  // One size for the whole song, as large as allowed while its longest line
  // still fits across (text width scales with the font size)
  const boxWidth = useWidth(box);
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
    // touch-action: vertical swipes step lines instead of scrolling the page
    <div ref={setBox} className="w-full flex justify-center py-6 touch-pan-x">
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
            chordTitle={isEn ? 'Click to change or delete' : '点击修改或删除'}
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
