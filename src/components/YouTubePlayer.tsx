import { useEffect, useRef, useState } from 'react';
import { loadYouTubeApi, createController, formatTime, SEEK_STEP_SECONDS, type YouTubeController } from '../utils/youtubeApi';

interface YouTubeVideoProps {
  videoId: string;
  /** Where to start the video, e.g. to continue from the other mode */
  startAt?: number;
  /** Size and placement of the video box */
  className?: string;
  /** Called with a controller once the player is ready, and with null when it goes away */
  onController?: (controller: YouTubeController | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** Called when the player API can't load and the plain embed is used */
  onApiUnavailable?: () => void;
  /** Tells the owner whether the page can control the video yet */
  onReadyChange?: (ready: boolean) => void;
}

/**
 * Just the video, via the IFrame Player API so the page can read the time and
 * seek. If the API can't load, falls back to the plain embed (the video still
 * plays, only the page-side controls are unavailable).
 *
 * YouTube's terms require the player to stay visible (at least 200×200 px)
 * and don't allow audio-only playback, so callers shrink it, never hide it.
 */
export function YouTubeVideo({
  videoId, startAt = 0, className = '', onController, onPlayingChange, onApiUnavailable, onReadyChange,
}: YouTubeVideoProps) {
  const startRef = useRef(startAt);   // only the first value matters
  const boxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const callbacks = useRef({ onController, onPlayingChange, onApiUnavailable, onReadyChange });
  useEffect(() => { callbacks.current = { onController, onPlayingChange, onApiUnavailable, onReadyChange }; });

  useEffect(() => {
    let destroyed = false;
    let player: { destroy(): void } | null = null;
    loadYouTubeApi().then(YT => {
      if (destroyed || !mountRef.current) return;
      // The API replaces the element it's given, so hand it a node React doesn't own
      const target = document.createElement('div');
      mountRef.current.replaceChildren(target);
      player = new YT.Player(target, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, playsinline: 1, ...(startRef.current >= 1 ? { start: Math.floor(startRef.current) } : {}) },
        events: {
          onReady: e => {
            if (destroyed) return;
            // `start` only takes whole seconds; land on the exact position
            if (startRef.current > 0) e.target.seekTo(startRef.current, true);
            callbacks.current.onReadyChange?.(true);
            callbacks.current.onController?.(createController(e.target, YT.PlayerState.PLAYING));
          },
          onStateChange: e => callbacks.current.onPlayingChange?.(e.data === YT.PlayerState.PLAYING),
        },
      });
    }).catch(() => {
      if (destroyed) return;
      setApiFailed(true);
      callbacks.current.onApiUnavailable?.();
    });

    return () => {
      destroyed = true;
      player?.destroy();
      callbacks.current.onReadyChange?.(false);
      callbacks.current.onController?.(null);
      callbacks.current.onPlayingChange?.(false);
    };
  }, [videoId]);

  // Clicking the video moves keyboard focus into YouTube's iframe, where it
  // would swallow the page's shortcuts (← → Space ↑ ↓ R). Hand focus back to
  // the page once the click has landed — except in fullscreen.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onWindowBlur = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const active = document.activeElement;
        if (document.fullscreenElement) return;
        if (active instanceof HTMLIFrameElement && boxRef.current?.contains(active)) {
          active.blur();
          window.focus();
        }
      }, 150);
    };
    window.addEventListener('blur', onWindowBlur);
    return () => { clearTimeout(timer); window.removeEventListener('blur', onWindowBlur); };
  }, []);

  return (
    <div ref={boxRef} className={`relative bg-black overflow-hidden ${className}`}>
      {apiFailed ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title="YouTube player"
          className="absolute inset-0 w-full h-full"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div ref={mountRef} className="absolute inset-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      )}
    </div>
  );
}

interface YouTubePlayerProps {
  videoId: string;
  isEn: boolean;
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onSkip: (delta: number) => void;
  onSeek: (seconds: number) => void;
  startAt?: number;
  onController?: (controller: YouTubeController | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  onApiUnavailable?: () => void;
}

const SIZE_KEY = 'chord_analyzer_player_large';

function loadLarge(): boolean {
  try { return localStorage.getItem(SIZE_KEY) === '1'; } catch { return false; }
}

// Buttons keep focus off themselves so Space stays play/pause
const noFocus = (e: React.MouseEvent) => e.preventDefault();

/** The video with a transport bar underneath (used by the play view). */
export default function YouTubePlayer({
  videoId, isEn, playing, time, duration, onToggle, onSkip, onSeek, startAt = 0,
  onController, onPlayingChange, onApiUnavailable,
}: YouTubePlayerProps) {
  const [ready, setReady] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [large, setLarge] = useState(loadLarge);

  const toggleSize = () => {
    setLarge(v => {
      try { localStorage.setItem(SIZE_KEY, v ? '0' : '1'); } catch { /* preference only */ }
      return !v;
    });
  };

  const btn = 'h-8 px-2.5 flex items-center justify-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const controls = ready && !apiFailed;

  return (
    <div className="space-y-2">
      <YouTubeVideo
        videoId={videoId}
        startAt={startAt}
        className={`w-full aspect-video rounded-lg ${large ? '' : 'max-w-md'}`}
        onController={onController}
        onPlayingChange={onPlayingChange}
        onReadyChange={setReady}
        onApiUnavailable={() => { setApiFailed(true); onApiUnavailable?.(); }}
      />

      {/* Transport */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className={btn} onMouseDown={noFocus} disabled={!controls} onClick={() => onSkip(-SEEK_STEP_SECONDS)}
          title={isEn ? `Back ${SEEK_STEP_SECONDS}s (←)` : `后退 ${SEEK_STEP_SECONDS} 秒（←）`}>
          ⟲ {SEEK_STEP_SECONDS}s
        </button>
        <button className={`${btn} w-10`} onMouseDown={noFocus} disabled={!controls} onClick={onToggle}
          title={isEn ? 'Play / pause (Space)' : '播放 / 暂停（空格）'}
          aria-label={playing ? (isEn ? 'Pause' : '暂停') : (isEn ? 'Play' : '播放')}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
          )}
        </button>
        <button className={btn} onMouseDown={noFocus} disabled={!controls} onClick={() => onSkip(SEEK_STEP_SECONDS)}
          title={isEn ? `Forward ${SEEK_STEP_SECONDS}s (→)` : `快进 ${SEEK_STEP_SECONDS} 秒（→）`}>
          {SEEK_STEP_SECONDS}s ⟳
        </button>

        {/* Scrubber: drag to any point in the song */}
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          value={Math.min(time, Math.max(duration, 1))}
          disabled={!controls}
          onChange={e => onSeek(Number(e.target.value))}
          // Let go of focus so ← → go back to 5-second jumps
          onPointerUp={e => e.currentTarget.blur()}
          aria-label={isEn ? 'Song position' : '播放进度'}
          className="flex-1 min-w-24 accent-gray-700 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-500 tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>

        <button className={btn} onMouseDown={noFocus} onClick={toggleSize}
          title={large ? (isEn ? 'Smaller video' : '缩小视频') : (isEn ? 'Larger video' : '放大视频')}>
          {large ? (isEn ? 'Smaller' : '缩小') : (isEn ? 'Larger' : '放大')}
        </button>
      </div>
      {controls ? (
        <p className="text-xs text-gray-400">
          {isEn
            ? 'Keys: ← back 5s · → forward 5s · Space play/pause — they keep working after you click the video'
            : '快捷键：← 后退 5 秒 · → 快进 5 秒 · 空格 播放/暂停（点过视频后也能用）'}
        </p>
      ) : apiFailed ? (
        <p className="text-xs text-gray-400">
          {isEn
            ? "YouTube's player controls couldn't load, so the page can't control this video. Use the video's own controls."
            : 'YouTube 播放控制接口没能加载，页面无法控制这个视频，请直接用视频自带的控制。'}
        </p>
      ) : null}
    </div>
  );
}
