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

export const INTERVAL_NAMES_EN: Record<number, string> = {
  0: 'Root (R)', 1: 'Minor 2nd (b2)', 2: 'Major 2nd (2)',
  3: 'Minor 3rd (b3)', 4: 'Major 3rd (3)', 5: 'Perfect 4th (4)',
  6: 'Tritone (b5)', 7: 'Perfect 5th (5)', 8: 'Minor 6th (b6)',
  9: 'Major 6th (6)', 10: 'Minor 7th (b7)', 11: 'Major 7th (7)',
};

// Names for intervals past the octave, so a 9th doesn't read as a 2nd
export const EXTENDED_INTERVAL_NAMES: Record<number, string> = {
  13: '小九度 (b9)', 14: '大九度 (9)', 15: '增九度 (#9)',
  17: '纯十一度 (11)', 21: '大十三度 (13)',
};

export const EXTENDED_INTERVAL_NAMES_EN: Record<number, string> = {
  13: 'Minor 9th (b9)', 14: 'Major 9th (9)', 15: 'Augmented 9th (#9)',
  17: 'Perfect 11th (11)', 21: 'Major 13th (13)',
};

/**
 * Full name of a chord interval, e.g. 14 → '大九度 (9)'.
 * chordTypeKey only matters for the diminished 7th, whose 9-semitone tone is
 * a diminished 7th rather than a major 6th.
 */
export function getIntervalName(interval: number, isEn: boolean, chordTypeKey?: string): string {
  if (chordTypeKey === 'dim7' && interval % 12 === 9) {
    return isEn ? 'Diminished 7th (bb7)' : '减七度 (bb7)';
  }
  const extended = isEn ? EXTENDED_INTERVAL_NAMES_EN : EXTENDED_INTERVAL_NAMES;
  const base = isEn ? INTERVAL_NAMES_EN : INTERVAL_NAMES;
  return extended[interval] ?? base[interval % 12] ?? (isEn ? `${interval} st` : `${interval}半音`);
}

// Scale-degree labels for chord tones, keyed on the raw interval so that
// extensions read as 9/11/13 rather than 2/4/6.
export const DEGREE_LABELS: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
  6: 'b5', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7',
  13: 'b9', 14: '9', 15: '#9', 17: '11', 21: '13',
};

/**
 * Label a chord interval by its degree, e.g. 3 → 'b3', 14 → '9'.
 * chordTypeKey only matters for the diminished 7th, whose 9-semitone tone is
 * a bb7 rather than a 6.
 */
export function getIntervalDegree(interval: number, chordTypeKey?: string): string {
  if (chordTypeKey === 'dim7' && interval % 12 === 9) return 'bb7';
  return DEGREE_LABELS[interval] ?? DEGREE_LABELS[interval % 12] ?? `${interval}`;
}

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
