import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SEEK_STEP_SECONDS, type YouTubeController } from '../utils/youtubeApi';

/* ─── Playback state for a YouTubePlayer ───────────────────────────────────
 * Shared by the read-only sheet view and the editor: the player's controller
 * once ready, a clock polled while playing, seek / ±5s / play-pause, and an
 * optional point to pause at ("play this line").
 * ------------------------------------------------------------------------ */

export interface Playback {
  controller: YouTubeController | null;
  playing: boolean;
  time: number;
  duration: number;
  apiFailed: boolean;
  seekTo: (seconds: number) => void;
  skipBy: (delta: number) => void;
  togglePlay: () => void;
  /** Play from `start` and pause at `stopAt` (if given) */
  playRange: (start: number, stopAt?: number) => void;
  /** Called on every clock tick while playing, with the current time */
  onTickRef: React.MutableRefObject<((t: number) => void) | null>;
  /** Props to spread onto <YouTubePlayer> */
  playerProps: {
    playing: boolean;
    time: number;
    duration: number;
    onToggle: () => void;
    onSkip: (delta: number) => void;
    onSeek: (seconds: number) => void;
    onController: (c: YouTubeController | null) => void;
    onPlayingChange: (playing: boolean) => void;
    onApiUnavailable: () => void;
  };
}

export function usePlayback({ onApiUnavailable }: { onApiUnavailable?: () => void } = {}): Playback {
  const [controller, setController] = useState<YouTubeController | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [apiFailed, setApiFailed] = useState(false);
  const stopAtRef = useRef<number | null>(null);
  const onTickRef = useRef<((t: number) => void) | null>(null);
  const apiUnavailableRef = useRef(onApiUnavailable);
  useEffect(() => { apiUnavailableRef.current = onApiUnavailable; });

  // Clock: once when the player is ready or pauses, every 200ms while playing
  useEffect(() => {
    if (!controller) return;
    const tick = () => {
      const t = controller.getTime();
      setTime(t);
      setDuration(controller.getDuration());
      if (stopAtRef.current !== null && t >= stopAtRef.current) {
        stopAtRef.current = null;
        controller.pause();
      }
      if (controller.isPlaying()) onTickRef.current?.(t);
    };
    const first = setTimeout(tick, 0);
    const timer = playing ? setInterval(tick, 200) : undefined;
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [controller, playing]);

  const seekTo = useCallback((seconds: number) => {
    if (!controller) return;
    stopAtRef.current = null;
    const t = Math.max(0, seconds);
    controller.seek(t);
    setTime(t);
  }, [controller]);

  const skipBy = useCallback((delta: number) => {
    if (controller) seekTo(controller.getTime() + delta);
  }, [controller, seekTo]);

  const togglePlay = useCallback(() => {
    if (!controller) return;
    if (controller.isPlaying()) controller.pause();
    else controller.play();
  }, [controller]);

  const playRange = useCallback((start: number, stopAt?: number) => {
    if (!controller) return;
    controller.seek(start);
    setTime(start);
    stopAtRef.current = stopAt ?? null;
    controller.play();
    // Stop right at `stopAt`; the 200ms clock alone would overshoot a little
    if (stopAt !== undefined) {
      setTimeout(() => {
        if (stopAtRef.current === stopAt && controller.getTime() >= stopAt - 0.25) {
          stopAtRef.current = null;
          controller.pause();
        }
      }, (stopAt - start) * 1000);
    }
  }, [controller]);

  const handleApiUnavailable = useCallback(() => {
    setApiFailed(true);
    apiUnavailableRef.current?.();
  }, []);

  return {
    controller, playing, time, duration, apiFailed,
    seekTo, skipBy, togglePlay, playRange, onTickRef,
    playerProps: {
      playing, time, duration,
      onToggle: togglePlay,
      onSkip: skipBy,
      onSeek: seekTo,
      onController: setController,
      onPlayingChange: setPlaying,
      onApiUnavailable: handleApiUnavailable,
    },
  };
}

// Whether the last focus change came from the mouse. A button someone just
// clicked keeps focus, and Space would click it again instead of reaching
// play/pause; for keyboard (Tab) users Space keeps activating the button.
let focusedByPointer = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { focusedByPointer = true; }, true);
  window.addEventListener('keydown', e => { if (e.key === 'Tab') focusedByPointer = false; }, true);
}

/** Whether a key press is someone typing into a field (a slider or checkbox isn't). */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
    || (el instanceof HTMLInputElement && !['range', 'checkbox', 'radio', 'button'].includes(el.type));
}

/**
 * Keyboard control of a playback: ← back 5s, → forward 5s, Space play/pause.
 * `extra` can handle more keys (return true when it did). Ignored while
 * typing, with modifier keys, and for Space on a button reached with Tab.
 */
export function usePlaybackKeys(pb: Playback, extra?: (e: KeyboardEvent) => boolean) {
  const { controller, skipBy, togglePlay } = pb;
  const extraRef = useRef(extra);
  useEffect(() => { extraRef.current = extra; });

  // Layout effect: swap in the new controller in the same commit that enables
  // the player's buttons, so there's no moment where a key sees the old one
  useLayoutEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      const onButton = !!(e.target as HTMLElement | null)?.closest('button, a, [role="button"]');
      if (e.key === ' ' && onButton && !focusedByPointer) return;
      let handled = true;
      if (e.key === 'ArrowLeft' && controller) skipBy(-SEEK_STEP_SECONDS);
      else if (e.key === 'ArrowRight' && controller) skipBy(SEEK_STEP_SECONDS);
      else if (e.key === ' ' && controller) togglePlay();
      else handled = extraRef.current?.(e) ?? false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, skipBy, togglePlay]);
}

/** Index of the line being sung: the one with the latest start time ≤ t. */
export function lineAtTime(t: number, times: (number | null)[] | null | undefined): number | null {
  if (!times) return null;
  let best: number | null = null;
  times.forEach((lt, i) => {
    if (lt !== null && lt <= t + 0.15 && (best === null || lt >= (times[best] ?? -1))) best = i;
  });
  return best;
}

// Typical sung length per character, for estimating progress through a line
const SECONDS_PER_CHAR = 0.7;

/**
 * How far through line `li` the singer is, 0–1, for the karaoke fill.
 * Lyrics only carry a start time per line, so this is an estimate: the line
 * is spread over roughly SECONDS_PER_CHAR per character, and never over more
 * than 90% of the gap before the next line (which often includes a pause).
 */
export function lineProgress(t: number, li: number, times: (number | null)[] | null | undefined, text: string): number {
  const start = times?.[li];
  if (start === null || start === undefined || t < start) return 0;
  const chars = [...text.trim()].length;
  if (!chars) return 1;
  const next = times!.slice(li + 1).find((x): x is number => x !== null && x > start);
  const estimate = Math.max(1, chars * SECONDS_PER_CHAR);
  const length = next !== undefined ? Math.min((next - start) * 0.9, estimate) : estimate;
  return Math.min(1, (t - start) / length);
}
