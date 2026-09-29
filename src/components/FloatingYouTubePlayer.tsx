import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n/context';
import { loadYouTubeApi, createController, SEEK_STEP_SECONDS, type YouTubeController } from '../utils/youtubeApi';

interface FloatingYouTubePlayerProps {
  videoId: string;
  onClose: () => void;
  /** Called with a controller once the player is ready, and with null when it goes away */
  onController?: (controller: YouTubeController | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** Called when the player API can't load and the plain embed is used */
  onApiUnavailable?: () => void;
}

const HEADER_HEIGHT = 32;
const MIN_WIDTH = 240;
const MAX_WIDTH = 900;
const ASPECT_RATIO = 9 / 16;

export default function FloatingYouTubePlayer({ videoId, onClose, onController, onPlayingChange, onApiUnavailable }: FloatingYouTubePlayerProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  // Player via the IFrame API so the page can read time and seek. If the API
  // can't load, fall back to the plain embed: the video still plays, only the
  // transport controls are unavailable.
  const mountRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<YouTubeController | null>(null);
  const [playing, setPlaying] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const callbacks = useRef({ onController, onPlayingChange, onApiUnavailable });
  useEffect(() => { callbacks.current = { onController, onPlayingChange, onApiUnavailable }; });

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
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onReady: e => {
            if (destroyed) return;
            const c = createController(e.target, YT.PlayerState.PLAYING);
            setController(c);
            callbacks.current.onController?.(c);
          },
          onStateChange: e => {
            const isPlaying = e.data === YT.PlayerState.PLAYING;
            setPlaying(isPlaying);
            callbacks.current.onPlayingChange?.(isPlaying);
          },
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
      setController(null);
      setPlaying(false);
      callbacks.current.onController?.(null);
      callbacks.current.onPlayingChange?.(false);
    };
  }, [videoId]);

  const skip = useCallback((delta: number) => {
    if (controller) controller.seek(controller.getTime() + delta);
  }, [controller]);

  // Open in the bottom-right corner, clear of the editor's controls
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, window.innerWidth - 400 - 16),
    y: Math.max(96, window.innerHeight - 400 * ASPECT_RATIO - HEADER_HEIGHT - 16),
  }));
  const [width, setWidth] = useState(400);
  const widthRef = useRef(width);
  useEffect(() => { widthRef.current = width; }, [width]);

  const clampPos = useCallback((x: number, y: number, w: number) => ({
    x: Math.min(Math.max(x, -w + 60), window.innerWidth - 60),
    y: Math.min(Math.max(y, 0), window.innerHeight - 40),
  }), []);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = pos.x;
    const origY = pos.y;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPos(clampPos(origX + dx, origY + dy, widthRef.current));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [pos, clampPos]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origWidth = widthRef.current;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, origWidth + dx)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const zoom = useCallback((factor: number) => {
    setWidth(w => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(w * factor))));
  }, []);

  const height = width * ASPECT_RATIO;

  return (
    <div
      className="fixed z-[100] bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-700 select-none"
      style={{ left: pos.x, top: pos.y, width }}
    >
      {/* Header / drag handle */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className="flex items-center justify-between px-2 bg-gray-800 cursor-move touch-none"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-sm text-gray-400 truncate">
          {isEn ? 'Drag to move' : '拖动移动'}
        </span>
        {/* Transport: jump back / play-pause / jump forward */}
        {controller && (
          <div className="flex items-center gap-0.5 mx-auto">
            <button
              onClick={() => skip(-SEEK_STEP_SECONDS)}
              onMouseDown={e => e.preventDefault()}
              title={isEn ? `Back ${SEEK_STEP_SECONDS}s  (←)` : `后退 ${SEEK_STEP_SECONDS} 秒（←）`}
              aria-label={isEn ? `Back ${SEEK_STEP_SECONDS} seconds` : `后退 ${SEEK_STEP_SECONDS} 秒`}
              className="h-6 px-1.5 flex items-center text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded cursor-pointer tabular-nums"
            >
              ⟲{SEEK_STEP_SECONDS}s
            </button>
            <button
              onClick={() => (playing ? controller.pause() : controller.play())}
              onMouseDown={e => e.preventDefault()}
              title={isEn ? 'Play / pause  (Space)' : '播放 / 暂停（空格）'}
              aria-label={playing ? (isEn ? 'Pause' : '暂停') : (isEn ? 'Play' : '播放')}
              className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-white hover:bg-gray-700 rounded cursor-pointer"
            >
              {playing ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
              )}
            </button>
            <button
              onClick={() => skip(SEEK_STEP_SECONDS)}
              onMouseDown={e => e.preventDefault()}
              title={isEn ? `Forward ${SEEK_STEP_SECONDS}s  (→)` : `快进 ${SEEK_STEP_SECONDS} 秒（→）`}
              aria-label={isEn ? `Forward ${SEEK_STEP_SECONDS} seconds` : `快进 ${SEEK_STEP_SECONDS} 秒`}
              className="h-6 px-1.5 flex items-center text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded cursor-pointer tabular-nums"
            >
              {SEEK_STEP_SECONDS}s⟳
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom(0.85)}
            title={isEn ? 'Zoom out' : '缩小'}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded cursor-pointer"
          >
            −
          </button>
          <button
            onClick={() => zoom(1.15)}
            title={isEn ? 'Zoom in' : '放大'}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded cursor-pointer"
          >
            +
          </button>
          <button
            onClick={onClose}
            title={isEn ? 'Close' : '关闭'}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-600 rounded cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Video */}
      <div style={{ width, height }} className="relative">
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
        {/* Resize handle */}
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none"
          style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.4) 50%)' }}
        />
      </div>
    </div>
  );
}
