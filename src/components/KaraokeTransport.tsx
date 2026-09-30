import { formatTime, SEEK_STEP_SECONDS } from '../utils/youtubeApi';

interface KaraokeTransportProps {
  isEn: boolean;
  ready: boolean;
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onSkip: (delta: number) => void;
  onSeek: (seconds: number) => void;
}

// Buttons keep focus off themselves so Space stays play/pause
const noFocus = (e: React.MouseEvent) => e.preventDefault();

/** A progress bar over −5s / play / +5s. */
export default function KaraokeTransport({ isEn, ready, playing, time, duration, onToggle, onSkip, onSeek }: KaraokeTransportProps) {
  const skip = 'w-16 h-12 text-lg font-bold text-gray-900 rounded-full hover:bg-gray-100 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 text-xs text-gray-400 tabular-nums">
        <span className="w-10 text-right">{formatTime(time)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          value={Math.min(time, Math.max(duration, 1))}
          disabled={!ready}
          onChange={e => onSeek(Number(e.target.value))}
          // Let go of focus so ← → go back to 5-second jumps
          onPointerUp={e => e.currentTarget.blur()}
          aria-label={isEn ? 'Song position' : '播放进度'}
          className="flex-1 accent-gray-500 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="w-10">{formatTime(duration)}</span>
      </div>
      <div className="flex items-center justify-center gap-10 sm:gap-16">
        <button className={skip} onMouseDown={noFocus} disabled={!ready} onClick={() => onSkip(-SEEK_STEP_SECONDS)}
          title={isEn ? `Back ${SEEK_STEP_SECONDS}s (←)` : `后退 ${SEEK_STEP_SECONDS} 秒（←）`}>
          -{SEEK_STEP_SECONDS}s
        </button>
        <button
          onMouseDown={noFocus}
          disabled={!ready}
          onClick={onToggle}
          title={isEn ? 'Play / pause (Space)' : '播放 / 暂停（空格）'}
          aria-label={playing ? (isEn ? 'Pause' : '暂停') : (isEn ? 'Play' : '播放')}
          className="w-20 h-20 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {playing ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 4 }}><path d="M6 3.5l15 8.5-15 8.5z" /></svg>
          )}
        </button>
        <button className={skip} onMouseDown={noFocus} disabled={!ready} onClick={() => onSkip(SEEK_STEP_SECONDS)}
          title={isEn ? `Forward ${SEEK_STEP_SECONDS}s (→)` : `快进 ${SEEK_STEP_SECONDS} 秒（→）`}>
          +{SEEK_STEP_SECONDS}s
        </button>
      </div>
    </div>
  );
}
