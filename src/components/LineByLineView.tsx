import type { ReactNode, Ref } from 'react';
import LyricLine, { type LineChord } from './LyricLine';

// Line controls shown when a video is open (play/pause and ±5s sit under
// the video itself)
export interface TransportProps {
  hasTimes: boolean;          // lyrics carry per-line timestamps
  canPlayLine: boolean;       // the focused line has a timestamp
  follow: boolean;            // focus follows playback
  syncing: boolean;           // marking line starts while listening
  onPlayLine: () => void;
  onFollowChange: (follow: boolean) => void;
  onStartSync: () => void;
  onMarkLine: () => void;
  onStopSync: () => void;
}

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
  transport: TransportProps | null;
  isEn: boolean;
  children?: ReactNode;       // the chord popover, positioned inside the card
}

const FOCUS_FONT_PX = 26;
const CONTEXT_FONT_PX = 16;
const LINES_AHEAD = 2;

// Buttons keep focus off themselves so Space stays play/pause
const noFocus = (e: React.MouseEvent) => e.preventDefault();

/**
 * Transcribe one line at a time: the line being worked on is large and
 * clickable, the line before it stays visible (dark gray, already sung) and
 * the next lines are previewed in light gray.
 */
export default function LineByLineView({
  lines, navLines, focusLine, focusProgress, chordsForLine, onFocusLine, onCharClick, onChordClick,
  containerRef, transport, isEn, children,
}: LineByLineViewProps) {
  const pos = Math.max(0, navLines.indexOf(focusLine));
  const prev = pos > 0 ? navLines[pos - 1] : null;
  const ahead = navLines.slice(pos + 1, pos + 1 + LINES_AHEAD);
  const progress = navLines.length ? (pos + 1) / navLines.length : 0;

  const btn = 'h-8 px-2.5 flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  if (!navLines.length) {
    return <p className="text-sm text-gray-400 py-6 text-center">{isEn ? 'No lyrics yet' : '还没有歌词'}</p>;
  }

  return (
    <div className="space-y-3">
      {/* Line navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 tabular-nums">
          {isEn ? `Line ${pos + 1} / ${navLines.length}` : `第 ${pos + 1} / ${navLines.length} 句`}
        </span>
        <div className="flex-1 min-w-16 h-1 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-gray-500 transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <button className={btn} onMouseDown={noFocus} disabled={prev === null}
          onClick={() => prev !== null && onFocusLine(prev)}
          title={isEn ? 'Previous line (↑)' : '上一句（↑）'}>
          ↑ {isEn ? 'Prev' : '上一句'}
        </button>
        <button className={btn} onMouseDown={noFocus} disabled={!ahead.length}
          onClick={() => ahead.length && onFocusLine(ahead[0])}
          title={isEn ? 'Next line (↓)' : '下一句（↓）'}>
          ↓ {isEn ? 'Next' : '下一句'}
        </button>
      </div>

      {/* Line playback, when a video is open */}
      {transport && !transport.syncing && (
        <div className="flex items-center gap-2 flex-wrap">
          <button className={btn} onMouseDown={noFocus} onClick={transport.onPlayLine} disabled={!transport.canPlayLine}
            title={isEn ? 'Play this line from its start (R)' : '从这句开头播放到下一句（R）'}>
            ↻ {isEn ? 'Play line' : '播放本句'}
          </button>
          <button className={btn} onMouseDown={noFocus} onClick={transport.onStartSync}
            title={isEn ? 'Sync the lyrics to the video by marking where each line starts' : '边听歌，边在每句开始时按 ↓，让歌词和视频同步'}>
            ⏱ {transport.hasTimes ? (isEn ? 'Re-sync lyrics' : '重新打点同步') : (isEn ? 'Sync lyrics to video' : '边听边打点同步')}
          </button>
          {transport.hasTimes && (
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={transport.follow}
                onChange={e => transport.onFollowChange(e.target.checked)} className="cursor-pointer" />
              {isEn ? 'Follow the song' : '跟随歌曲进度'}
            </label>
          )}
        </div>
      )}

      {/* Sync session: mark each line as it starts */}
      {transport?.syncing && (
        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <span className="text-sm text-amber-800 flex-1 min-w-48">
            {isEn
              ? 'Syncing: when the highlighted line starts being sung, press ↓ (or Enter). ↑ goes back a line.'
              : '打点中：唱到下面高亮的这句时，按 ↓（或回车）。标错了按 ↑ 退回。'}
          </span>
          <button onMouseDown={noFocus} onClick={transport.onMarkLine}
            className="h-8 px-3 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer">
            {isEn ? 'This line starts now ↓' : '这句开始了 ↓'}
          </button>
          <button className={btn} onMouseDown={noFocus} onClick={transport.onStopSync}>
            {isEn ? 'Done' : '结束打点'}
          </button>
        </div>
      )}

      {/* The lines */}
      <div ref={containerRef} className="relative bg-white rounded-xl px-5 py-4 select-none space-y-2">
        {prev !== null ? (
          <button className="block w-full text-left cursor-pointer" onClick={() => onFocusLine(prev)}>
            <LyricLine line={lines[prev]} chords={chordsForLine(prev)} fontPx={CONTEXT_FONT_PX} tone="sung" />
          </button>
        ) : (
          <div className="text-sm text-gray-300" style={{ height: Math.round(CONTEXT_FONT_PX * 2.9) }}>
            {isEn ? '— start of song —' : '— 歌曲开始 —'}
          </div>
        )}

        <div className={`rounded-lg -mx-3 px-3 py-2 overflow-x-auto ${
          transport?.syncing ? 'bg-amber-50 ring-2 ring-amber-300' : 'bg-gray-50'
        }`}>
          <LyricLine
            line={lines[focusLine]}
            chords={chordsForLine(focusLine)}
            fontPx={FOCUS_FONT_PX}
            tone="current"
            progress={focusProgress}
            onCharClick={(e, ci) => onCharClick(e, focusLine, ci)}
            onChordClick={ci => onChordClick(focusLine, ci)}
            chordTitle={isEn ? 'Click to remove' : '点击删除'}
          />
        </div>

        {ahead.map(li => (
          <button key={li} className="block w-full text-left cursor-pointer" onClick={() => onFocusLine(li)}>
            <LyricLine line={lines[li]} chords={chordsForLine(li)} fontPx={CONTEXT_FONT_PX} tone="upcoming" />
          </button>
        ))}

        {children}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        {isEn
          ? 'Click a character to add a chord above it. Keys: ← → jump 5s · Space play/pause · ↑ ↓ change line · R replay line'
          : '点击某个字，在它上方插入和弦。快捷键：← → 后退/快进 5 秒 · 空格 播放/暂停 · ↑ ↓ 切换句子 · R 重播本句'}
        {transport && !transport.hasTimes && !transport.syncing && (
          <>
            <br />
            {isEn
              ? 'These lyrics aren’t synced to the video yet. Use “Sync lyrics to video”: press ↓ as each line starts, and the lyrics will follow the song.'
              : '这份歌词还没和视频同步。点「边听边打点同步」，边听边在每句开始时按 ↓，之后歌词就会跟着歌走。'}
          </>
        )}
      </p>
    </div>
  );
}
