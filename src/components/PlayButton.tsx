import { useState } from 'react';
import { useLocale } from '../i18n/context';

interface PlayButtonProps {
  onPlay: () => Promise<void>;
  label?: string;
  small?: boolean;
}

export default function PlayButton({ onPlay, label, small = false }: PlayButtonProps) {
  const { locale } = useLocale();
  const [playing, setPlaying] = useState(false);
  const defaultLabel = locale === 'en' ? 'Play' : '播放';
  const playingLabel = locale === 'en' ? 'Playing...' : '播放中...';

  const handleClick = async () => {
    if (playing) return;
    setPlaying(true);
    try { await onPlay(); } catch { /* ignore */ }
    setTimeout(() => setPlaying(false), 800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={playing}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all cursor-pointer border
        ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        ${playing
          ? 'bg-gray-50 text-gray-400 border-gray-200'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
        }`}
    >
      <svg width={small ? 12 : 16} height={small ? 12 : 16} viewBox="0 0 16 16" fill="currentColor">
        {playing ? (
          <>
            <rect x="3" y="3" width="4" height="10" rx="1" />
            <rect x="9" y="3" width="4" height="10" rx="1" />
          </>
        ) : (
          <path d="M4 2.5v11l10-5.5z" />
        )}
      </svg>
      {playing ? playingLabel : (label || defaultLabel)}
    </button>
  );
}
