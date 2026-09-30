import { useEffect, useMemo, useRef, useState } from 'react';
import type { SavedChordSheet } from '../utils/storage';
import { extractYouTubeId } from '../utils/youtube';
import { usePlayback, usePlaybackKeys, lineAtTime } from '../hooks/usePlayback';
import YouTubePlayer from './YouTubePlayer';
import LyricLine, { type LineTone } from './LyricLine';
import ChordLegend from './ChordLegend';

interface ChordSheetViewerProps {
  sheet: SavedChordSheet;
  isEn: boolean;
  /** Where to start the video, e.g. continuing from the editor */
  startAt?: number;
  /** False while the editor is open, so only one video plays */
  showPlayer: boolean;
  onEdit: (currentTime: number) => void;
}

/**
 * Play mode: a saved chord sheet to play along with. The video sits above
 * the lyrics; when the lyrics are synced, sung lines turn dark, upcoming ones
 * stay light, the current line is kept in view, and clicking a line jumps
 * the video there. Nothing here edits the sheet.
 */
export default function ChordSheetViewer({ sheet, isEn, startAt = 0, showPlayer, onEdit }: ChordSheetViewerProps) {
  const pb = usePlayback();
  usePlaybackKeys(pb);

  const videoId = sheet.youtubeUrl ? extractYouTubeId(sheet.youtubeUrl) : null;
  const lines = useMemo(() => sheet.lyrics.split('\n'), [sheet.lyrics]);
  const times = sheet.lineTimes ?? null;
  const hasTimes = !!times?.some(t => t !== null);
  const playbackLine = pb.controller && hasTimes ? lineAtTime(pb.time, times) : null;
  const [autoScroll, setAutoScroll] = useState(true);

  // Keep the line being sung in the middle of the lyrics panel
  const panelRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<number, HTMLElement>());
  useEffect(() => {
    if (!autoScroll || !pb.playing || playbackLine === null) return;
    const panel = panelRef.current;
    const el = lineRefs.current.get(playbackLine);
    if (!panel || !el) return;
    const target = el.offsetTop - panel.clientHeight / 2 + el.clientHeight / 2;
    panel.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [playbackLine, autoScroll, pb.playing]);

  const chordCount = sheet.placements.length;

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">{sheet.name}</h2>
          <p className="text-sm text-gray-400">
            {chordCount} {isEn ? 'chords' : '个和弦'}
            {hasTimes && <span className="text-green-600">{isEn ? ' · synced to the video' : ' · 歌词已与视频同步'}</span>}
          </p>
        </div>
        <button
          onClick={() => onEdit(pb.time)}
          className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {isEn ? 'Edit' : '编辑'}
        </button>
      </div>

      {videoId && showPlayer && (
        <YouTubePlayer key={videoId} videoId={videoId} isEn={isEn} startAt={startAt} {...pb.playerProps} />
      )}

      {hasTimes && pb.controller && (
        <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none w-fit">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="cursor-pointer" />
          {isEn ? 'Keep the current line in view' : '自动滚动到正在唱的这句'}
        </label>
      )}

      {/* Lyrics with chords, read only */}
      {sheet.lyrics.trim() ? (
        <div ref={panelRef} className="relative bg-white rounded-xl p-5 max-h-[60vh] overflow-y-auto">
          {lines.map((line, li) => {
            const chords = sheet.placements.filter(p => p.line === li);
            if (!line.trim() && !chords.length) return <div key={li} className="h-4" />;
            const tone: LineTone = playbackLine === null
              ? 'normal'
              : li === playbackLine ? 'current' : li < playbackLine ? 'sung' : 'upcoming';
            const t = times?.[li] ?? null;
            const content = <LyricLine line={line} chords={chords} fontPx={16} tone={tone} />;
            const setRef = (el: HTMLElement | null) => {
              if (el) lineRefs.current.set(li, el);
              else lineRefs.current.delete(li);
            };
            // With timing, a line is a shortcut to that point in the video
            return t !== null && pb.controller ? (
              <button
                key={li}
                ref={setRef}
                onClick={() => pb.seekTo(t)}
                onMouseDown={e => e.preventDefault()}
                title={isEn ? 'Play from this line' : '从这句开始播放'}
                className={`block w-full text-left rounded-md -mx-2 px-2 cursor-pointer hover:bg-gray-50 ${
                  li === playbackLine ? 'bg-gray-50' : ''
                }`}
              >
                {content}
              </button>
            ) : (
              <div key={li} ref={setRef}>{content}</div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 bg-white rounded-xl p-5">
          {isEn ? 'No lyrics yet — use Edit to add them.' : '还没有歌词，点「编辑」添加。'}
        </p>
      )}

      <ChordLegend chords={sheet.placements.map(p => p.chord)} isEn={isEn} />
    </div>
  );
}
