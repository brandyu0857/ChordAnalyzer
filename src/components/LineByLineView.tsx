import type { ReactNode, Ref } from 'react';
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
  fontPx: number;
  syncing: boolean;           // marking line starts while listening
  isEn: boolean;
  children?: ReactNode;       // the chord popover, positioned inside
}

const LINES_AHEAD = 2;

/**
 * Transcribe one line at a time: the line being sung, large and clickable,
 * with the next lines previewed in light gray.
 */
export default function LineByLineView({
  lines, navLines, focusLine, focusProgress, chordsForLine, onFocusLine, onCharClick, onChordClick,
  containerRef, fontPx, syncing, isEn, children,
}: LineByLineViewProps) {
  const pos = Math.max(0, navLines.indexOf(focusLine));
  // Chords at half the lyric size keep the lines close together
  const chordPx = Math.max(14, Math.round(fontPx * 0.5));
  const ahead = navLines.slice(pos + 1, pos + 1 + LINES_AHEAD);

  if (!navLines.length) {
    return <p className="text-base text-gray-400">{isEn ? 'No lyrics yet' : '还没有歌词'}</p>;
  }

  return (
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
  );
}
