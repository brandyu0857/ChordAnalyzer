/* ─── YouTube IFrame Player API ────────────────────────────────────────────
 * The plain <iframe> embed can't report playback time or be seeked from the
 * page, which the transcribe tools need. This loads Google's IFrame Player
 * API once and wraps a player in a small controller.
 * ------------------------------------------------------------------------ */

// Only the parts of the API this app uses
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData?(): { title?: string; author?: string; video_id?: string };
  destroy(): void;
}

interface YTNamespace {
  Player: new (el: HTMLElement, options: {
    host?: string;
    videoId: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (e: { target: YTPlayer }) => void;
      onStateChange?: (e: { data: number; target: YTPlayer }) => void;
      onError?: (e: { data: number }) => void;
    };
  }) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api';
const LOAD_TIMEOUT_MS = 10000;
let apiPromise: Promise<YTNamespace> | null = null;

/** Load the IFrame API once. Rejects if it can't load (offline, blocked). */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const timer = setTimeout(() => fail(new Error('YouTube API timed out')), LOAD_TIMEOUT_MS);
    const fail = (err: Error) => {
      clearTimeout(timer);
      apiPromise = null; // allow a retry later
      reject(err);
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else fail(new Error('YouTube API missing Player'));
    };
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => fail(new Error('YouTube API failed to load'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

/** What the editor needs from a player, independent of the YouTube API. */
export interface YouTubeController {
  getTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  seek(seconds: number): void;
  play(): void;
  pause(): void;
  /** Video title and channel, when YouTube reports them */
  getInfo(): { title: string; author: string };
}

export function createController(player: YTPlayer, playingState: number): YouTubeController {
  return {
    getTime: () => player.getCurrentTime() || 0,
    getDuration: () => player.getDuration() || 0,
    isPlaying: () => player.getPlayerState() === playingState,
    seek: (seconds: number) => player.seekTo(Math.max(0, seconds), true),
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    getInfo: () => {
      const data = player.getVideoData?.() ?? {};
      return { title: data.title ?? '', author: data.author ?? '' };
    },
  };
}

/** How far the ⟲ / ⟳ buttons and ← / → keys jump. */
export const SEEK_STEP_SECONDS = 5;

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
