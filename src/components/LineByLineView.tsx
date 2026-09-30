import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { lineWidth } from '../utils/chordLabels';
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
  /** Lyric size to use when the lines fit; a line too long to fit shrinks */
  fontPx: number;
  /** Height the three lines have to fit in, when it's limited */
  maxHeight?: number;
  /** Scrolling / swiping over the lyrics: one line back (-1) or on (1) per step */
  onStep?: (dir: 1 | -1) => void;
  syncing: boolean;           // marking line starts while listening
  isEn: boolean;
  children?: ReactNode;       // the chord popover, positioned inside
}

const MIN_FONT_PX = 20;
// Chords at about half the lyric size keep the lines close together
const CHORD_RATIO = 0.55;
// Height of one line per pixel of font: its chord row (chord size × 1.3),
// the text (leading 1.35), plus a 4px gap; and the view's own padding
const LINE_HEIGHT_PER_PX = CHORD_RATIO * 1.3 + 1.35;
const LINE_GAP_PX = 4;
const VIEW_PADDING_PX = 16 + 4;   // py-2, and a little slack for rounding

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
 * Transcribe one line at a time: three lines, the one being sung in the
 * middle, large and clickable, between the previous and next lines in light
 * gray. Scrolling moves a line at a time.
 */
export default function LineByLineView({
  lines, navLines, focusLine, focusProgress, chordsForLine, onFocusLine, onCharClick,
  containerRef, fontPx: wantedFontPx, maxHeight, onStep, syncing, isEn, children,
}: LineByLineViewProps) {
  const pos = Math.max(0, navLines.indexOf(focusLine));
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useLineScroll(box, onStep);
  // Small enough for all three lines to fit the height available
  const maxFontPx = maxHeight
    ? Math.max(MIN_FONT_PX, Math.min(wantedFontPx, Math.floor((maxHeight - VIEW_PADDING_PX - 3 * LINE_GAP_PX) / (3 * LINE_HEIGHT_PER_PX))))
    : wantedFontPx;
  const chordPxFor = (fontPx: number) => Math.max(14, Math.round(fontPx * CHORD_RATIO));
  // Each line at the full size unless it — text or chords — is too long to
  // fit across; then just that line shrinks (widths scale with the font
  // size), so one long line, like a credits line, doesn't shrink the song
  const boxWidth = useWidth(box);
  const sizeFor = (li: number) => {
    const room = boxWidth - (syncing && li === focusLine ? 24 : 0);
    const width = lineWidth(lines[li], chordsForLine(li), maxFontPx, chordPxFor(maxFontPx), true);
    const fontPx = !boxWidth || width <= room
      ? maxFontPx
      : Math.max(MIN_FONT_PX, Math.floor(maxFontPx * room / width));
    return { fontPx, chordPx: chordPxFor(fontPx) };
  };

  if (!navLines.length) {
    return <p className="text-base text-gray-400">{isEn ? 'No lyrics yet' : '还没有歌词'}</p>;
  }

  // The line just sung and the next one, in light gray; at either end of the
  // song an empty slot keeps the active line in the middle
  const neighbour = (li: number | undefined, key: string) => li === undefined ? (
    <div key={key} aria-hidden className="invisible">
      <LyricLine line="　" chords={[]} fontPx={maxFontPx} chordPx={chordPxFor(maxFontPx)} bold tone="upcoming" />
    </div>
  ) : (
    <button
      key={key}
      className="block text-left cursor-pointer"
      onClick={() => onFocusLine(li)}
      title={isEn ? 'Go to this line' : '跳到这句'}
    >
      <LyricLine line={lines[li]} chords={chordsForLine(li)} {...sizeFor(li)} bold tone="upcoming" />
    </button>
  );

  return (
    // touch-action: vertical swipes step lines instead of scrolling the page
    <div ref={setBox} className="w-full flex justify-center py-2 touch-pan-x">
      <div ref={containerRef} className="relative max-w-full select-none">
        {neighbour(navLines[pos - 1], 'prev')}
        <div className={`rounded-lg ${syncing ? 'ring-2 ring-amber-300 px-3 -mx-3' : ''}`}>
          <LyricLine
            line={lines[focusLine]}
            chords={chordsForLine(focusLine)}
            {...sizeFor(focusLine)}
            bold
            tone="current"
            progress={focusProgress}
            onCharClick={(e, ci) => onCharClick(e, focusLine, ci)}
            chordTitle={isEn ? 'Click to change or delete' : '点击修改或删除'}
          />
        </div>
        {neighbour(navLines[pos + 1], 'next')}
        {children}
      </div>
    </div>
  );
}
