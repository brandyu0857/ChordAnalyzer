import { getNoteIndex } from '../data/notes';
import { GUITAR_TUNING } from '../data/chords';
import type { GuitarFingering } from '../data/chords';

// ---------------------------------------------------------------------------
// Lazy-load Tone.js -- only imported when audio is first needed
// ---------------------------------------------------------------------------

let Tone: typeof import('tone') | null = null;
let toneLoadPromise: Promise<typeof import('tone')> | null = null;

async function getTone() {
  if (Tone) return Tone;
  if (!toneLoadPromise) {
    toneLoadPromise = import('tone');
  }
  Tone = await toneLoadPromise;
  return Tone;
}

// ---------------------------------------------------------------------------
// Real acoustic guitar samples via Tone.Sampler
// Samples from tonejs-instruments (guitar-acoustic)
// ---------------------------------------------------------------------------

const SAMPLE_BASE_URL =
  'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-acoustic/';

const SAMPLE_MAP: Record<string, string> = {
  'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3',
  'B2': 'B2.mp3', 'B3': 'B3.mp3',
  'C3': 'C3.mp3', 'C4': 'C4.mp3',
  'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3',
  'E2': 'E2.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3',
  'F2': 'F2.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3',
  'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sampler: any = null;
let samplerReady = false;
let loadPromise: Promise<void> | null = null;

async function loadSampler(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const T = await getTone();
    const reverb = new T.Reverb({ decay: 1.4, wet: 0.18 }).toDestination();

    await new Promise<void>((resolve) => {
      sampler = new T.Sampler({
        urls: SAMPLE_MAP,
        baseUrl: SAMPLE_BASE_URL,
        release: 1.5,
        volume: -2,
        onload: () => {
          samplerReady = true;
          resolve();
        },
        onerror: (err: unknown) => {
          console.warn('Guitar sampler failed to load, falling back to synth', err);
          resolve();
        },
      }).connect(reverb);
    });
  })();

  return loadPromise;
}

// Fallback PluckSynth in case samples haven't loaded yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pluckSynths: any[] | null = null;

async function getPluckFallback() {
  const T = await getTone();
  if (!pluckSynths) {
    const reverb = new T.Reverb({ decay: 1.2, wet: 0.2 }).toDestination();
    pluckSynths = Array.from({ length: 6 }, () =>
      new T.PluckSynth({
        attackNoise: 2,
        dampening: 3200,
        resonance: 0.98,
        release: 1,
      }).connect(reverb)
    );
  }
  return pluckSynths;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function ensureAudioReady(): Promise<void> {
  const T = await getTone();
  if (T.getContext().state !== 'running') {
    await T.start();
  }
  if (!samplerReady) {
    await loadSampler();
  }
}

function noteToFrequencyName(note: string, octave: number): string {
  return `${note}${octave}`;
}

export function getChordFrequencies(notes: string[], baseOctave = 3): string[] {
  return notes.map((note, i) => {
    let octave = baseOctave;
    if (i > 0) {
      const prevIdx = getNoteIndex(notes[i - 1]);
      const curIdx = getNoteIndex(note);
      if (curIdx <= prevIdx) octave = baseOctave + 1;
    }
    return noteToFrequencyName(note, octave);
  });
}

export function getGuitarChordFrequencies(fingering: GuitarFingering): string[] {
  const frequencies: string[] = [];
  const baseOctaves = [2, 2, 3, 3, 3, 4]; // E2 A2 D3 G3 B3 E4

  for (let i = 0; i < 6; i++) {
    const fret = fingering.frets[i];
    if (fret === -1) continue;
    const noteIndex = (GUITAR_TUNING[i] + fret) % 12;
    const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteIndex];
    let octave = baseOctaves[i];
    if (GUITAR_TUNING[i] + fret >= 12) octave += 1;
    frequencies.push(`${noteName}${octave}`);
  }

  return frequencies;
}

// ---------------------------------------------------------------------------
// Abort controller for progression playback
// ---------------------------------------------------------------------------

let currentAbort: AbortController | null = null;

export function stopProgression(): void {
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export async function playChordStrum(fingering: GuitarFingering): Promise<void> {
  await ensureAudioReady();
  const T = await getTone();
  const freqs = getGuitarChordFrequencies(fingering);
  const now = T.now();

  if (samplerReady && sampler) {
    freqs.forEach((freq, i) => {
      sampler.triggerAttackRelease(freq, '2n', now + i * 0.04);
    });
  } else {
    const pool = await getPluckFallback();
    freqs.forEach((freq, i) => {
      pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.04);
    });
  }
}

export async function playChordBlock(notes: string[]): Promise<void> {
  await ensureAudioReady();
  const T = await getTone();
  const freqs = getChordFrequencies(notes);
  const now = T.now();

  if (samplerReady && sampler) {
    freqs.forEach((freq, i) => {
      sampler.triggerAttackRelease(freq, '2n', now + i * 0.008);
    });
  } else {
    const pool = await getPluckFallback();
    freqs.forEach((freq, i) => {
      pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.008);
    });
  }
}

/**
 * Play a chord progression with strum-style playback.
 * Returns a promise that resolves when done or when aborted via stopProgression().
 */
export async function playProgression(
  chordNotesList: string[][],
  bpm = 100,
  onChordPlay?: (index: number) => void
): Promise<void> {
  await ensureAudioReady();
  const T = await getTone();

  // Abort any previous progression
  stopProgression();
  const abort = new AbortController();
  currentAbort = abort;

  const beatDuration = 60 / bpm;

  for (let ci = 0; ci < chordNotesList.length; ci++) {
    if (abort.signal.aborted) return;

    const freqs = getChordFrequencies(chordNotesList[ci]);
    const now = T.now();
    onChordPlay?.(ci);

    if (samplerReady && sampler) {
      freqs.forEach((freq, i) => {
        sampler.triggerAttackRelease(freq, '2n', now + i * 0.035);
      });
    } else {
      const pool = await getPluckFallback();
      freqs.forEach((freq, i) => {
        pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.035);
      });
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, beatDuration * 2 * 1000);
      abort.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }).catch(e => {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      throw e;
    });
  }

  if (currentAbort === abort) currentAbort = null;
}

export async function dispose(): Promise<void> {
  stopProgression();
  if (sampler) {
    sampler.dispose();
    sampler = null;
    samplerReady = false;
    loadPromise = null;
  }
  if (pluckSynths) {
    pluckSynths.forEach((p: { dispose: () => void }) => p.dispose());
    pluckSynths = null;
  }
}
