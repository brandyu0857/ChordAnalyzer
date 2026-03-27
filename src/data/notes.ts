export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
  'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
};

export const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
};

export const INTERVAL_NAMES: Record<number, string> = {
  0: '根音 (R)', 1: '小二度 (b2)', 2: '大二度 (2)',
  3: '小三度 (b3)', 4: '大三度 (3)', 5: '纯四度 (4)',
  6: '三全音 (b5)', 7: '纯五度 (5)', 8: '小六度 (b6)',
  9: '大六度 (6)', 10: '小七度 (b7)', 11: '大七度 (7)',
};

export const SCALE_DEGREES = ['I', 'bII', 'II', 'bIII', 'III', 'IV', 'bV', 'V', 'bVI', 'VI', 'bVII', 'VII'] as const;

// Major scale intervals: W W H W W W H
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Natural minor scale intervals
export const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export function normalizeNote(note: string): string {
  if (FLAT_TO_SHARP[note]) return FLAT_TO_SHARP[note];
  return note;
}

export function getNoteIndex(note: string): number {
  const normalized = normalizeNote(note);
  return NOTES.indexOf(normalized as typeof NOTES[number]);
}

export function getNoteAtInterval(root: string, semitones: number): string {
  const rootIdx = getNoteIndex(root);
  return NOTES[(rootIdx + semitones + 12) % 12];
}

export function getDisplayName(note: string, preferFlat = false): string {
  if (preferFlat && SHARP_TO_FLAT[note]) return SHARP_TO_FLAT[note];
  return note;
}

export function getSemitoneDifference(from: string, to: string): number {
  const fromIdx = getNoteIndex(from);
  const toIdx = getNoteIndex(to);
  return (toIdx - fromIdx + 12) % 12;
}
