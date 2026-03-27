import * as Tone from 'tone';
import { getNoteIndex } from '../data/notes';
import { GUITAR_TUNING } from '../data/chords';
import type { GuitarFingering } from '../data/chords';

// ---------------------------------------------------------------------------
// Real acoustic guitar samples via Tone.Sampler
// Samples from tonejs-instruments (guitar-acoustic)
// ---------------------------------------------------------------------------

const SAMPLE_BASE_URL =
  'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-acoustic/';

// Map notes to .mp3 sample files
const SAMPLE_MAP: Record<string, string> = {
  'A2': 'A2.mp3',
  'A3': 'A3.mp3',
  'A4': 'A4.mp3',
  'B2': 'B2.mp3',
  'B3': 'B3.mp3',
  'C3': 'C3.mp3',
  'C4': 'C4.mp3',
  'D2': 'D2.mp3',
  'D3': 'D3.mp3',
  'D4': 'D4.mp3',
  'E2': 'E2.mp3',
  'E3': 'E3.mp3',
  'E4': 'E4.mp3',
  'F2': 'F2.mp3',
  'F3': 'F3.mp3',
  'F4': 'F4.mp3',
  'G2': 'G2.mp3',
  'G3': 'G3.mp3',
  'G4': 'G4.mp3',
};

let sampler: Tone.Sampler | null = null;
let samplerReady = false;
let loadPromise: Promise<void> | null = null;

function loadSampler(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve) => {
    // loading started

    const reverb = new Tone.Reverb({ decay: 1.4, wet: 0.18 }).toDestination();

    sampler = new Tone.Sampler({
      urls: SAMPLE_MAP,
      baseUrl: SAMPLE_BASE_URL,
      release: 1.5,
      volume: -2,
      onload: () => {
        samplerReady = true;
        // loading done
        resolve();
      },
      onerror: (err) => {
        console.warn('Guitar sampler failed to load, falling back to synth', err);
        // loading done
        resolve(); // resolve anyway so playback can fall back
      },
    }).connect(reverb);
  });

  return loadPromise;
}

// Fallback PluckSynth in case samples haven't loaded yet
let pluckSynths: Tone.PluckSynth[] | null = null;

function getPluckFallback(): Tone.PluckSynth[] {
  if (!pluckSynths) {
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.2 }).toDestination();
    pluckSynths = Array.from({ length: 6 }, () =>
      new Tone.PluckSynth({
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
  if (Tone.getContext().state !== 'running') {
    await Tone.start();
  }
  // Load and WAIT for sampler to be ready
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
// Playback
// ---------------------------------------------------------------------------

/**
 * Strum: play each string with a slight delay, like a real guitar strum.
 * Uses real samples when loaded, PluckSynth as fallback.
 */
export async function playChordStrum(fingering: GuitarFingering): Promise<void> {
  await ensureAudioReady();
  const freqs = getGuitarChordFrequencies(fingering);
  const now = Tone.now();

  if (samplerReady && sampler) {
    freqs.forEach((freq, i) => {
      sampler!.triggerAttackRelease(freq, '2n', now + i * 0.04);
    });
  } else {
    // Fallback while samples load
    const pool = getPluckFallback();
    freqs.forEach((freq, i) => {
      pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.04);
    });
  }
}

/**
 * Block chord: all notes at once.
 */
export async function playChordBlock(notes: string[]): Promise<void> {
  await ensureAudioReady();
  const freqs = getChordFrequencies(notes);
  const now = Tone.now();

  if (samplerReady && sampler) {
    freqs.forEach((freq, i) => {
      sampler!.triggerAttackRelease(freq, '2n', now + i * 0.008);
    });
  } else {
    const pool = getPluckFallback();
    freqs.forEach((freq, i) => {
      pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.008);
    });
  }
}

/**
 * Play a chord progression with strum-style playback.
 */
export async function playProgression(
  chordNotesList: string[][],
  bpm = 100,
  onChordPlay?: (index: number) => void
): Promise<void> {
  await ensureAudioReady();

  const beatDuration = 60 / bpm;

  for (let ci = 0; ci < chordNotesList.length; ci++) {
    const freqs = getChordFrequencies(chordNotesList[ci]);
    const now = Tone.now();
    onChordPlay?.(ci);

    if (samplerReady && sampler) {
      freqs.forEach((freq, i) => {
        sampler!.triggerAttackRelease(freq, '2n', now + i * 0.035);
      });
    } else {
      const pool = getPluckFallback();
      freqs.forEach((freq, i) => {
        pool[i % pool.length].triggerAttackRelease(freq, '2n', now + i * 0.035);
      });
    }

    await new Promise(resolve => setTimeout(resolve, beatDuration * 2 * 1000));
  }
}

export function dispose(): void {
  if (sampler) {
    sampler.dispose();
    sampler = null;
    samplerReady = false;
    loadPromise = null;
  }
  if (pluckSynths) {
    pluckSynths.forEach(p => p.dispose());
    pluckSynths = null;
  }
}
