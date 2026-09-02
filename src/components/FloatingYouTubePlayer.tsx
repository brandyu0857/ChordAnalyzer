import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n/context';

interface FloatingYouTubePlayerProps {
  videoId: string;
  onClose: () => void;
}

const HEADER_HEIGHT = 32;
const MIN_WIDTH = 240;
const MAX_WIDTH = 900;
const ASPECT_RATIO = 9 / 16;

export default function FloatingYouTubePlayer({ videoId, onClose }: FloatingYouTubePlayerProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [pos, setPos] = useState(() => ({
    x: Math.max(16, window.innerWidth / 2 - 200),
    y: 96,
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
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title="YouTube player"
          className="absolute inset-0 w-full h-full"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
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
