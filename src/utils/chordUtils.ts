import { NOTES, getNoteIndex, getNoteAtInterval, normalizeNote, MAJOR_SCALE_INTERVALS } from '../data/notes';
import { CHORD_TYPES } from '../data/chords';
import type { ChordType } from '../data/chords';
import { DEGREE_TO_CHORD_TYPE } from '../data/progressions';

export interface ParsedChord {
  root: string;
  type: string;
  chordType: ChordType;
  display: string;
  bassNote?: string;  // For slash chords like C/E, G/B
}

export function parseChordName(name: string): ParsedChord | null {
  let trimmed = name.trim();
  if (!trimmed) return null;

  // Normalize prefix-style accidentals: #X → X#, bX → Xb (where X is a note letter A-G)
  // e.g. #F7 → F#7, bEm → Ebm, bA → Ab
  function normalizePrefixAccidental(s: string): string {
    if (s.startsWith('#') && s.length >= 2) {
      return s[1].toUpperCase() + '#' + s.substring(2);
    }
    if (s.startsWith('b') && s.length >= 2 && /[A-Ga-g]/.test(s[1])) {
      return s[1].toUpperCase() + 'b' + s.substring(2);
    }
    return s;
  }

  // Extract bass note from slash chords like C/E, Am/G, D/F#, bE/bB
  let bassNote: string | undefined;
  if (trimmed.includes('/')) {
    const slashIdx = trimmed.indexOf('/');
    const bassStr = normalizePrefixAccidental(trimmed.substring(slashIdx + 1).trim());
    trimmed = trimmed.substring(0, slashIdx).trim();

    // Parse the bass note (1 or 2 chars)
    let rawBass = '';
    if (bassStr.length >= 2 && (bassStr[1] === '#' || bassStr[1] === 'b')) {
      rawBass = bassStr[0].toUpperCase() + bassStr[1];
    } else if (bassStr.length >= 1) {
      rawBass = bassStr[0].toUpperCase();
    }
    const normalizedBass = normalizeNote(rawBass);
    if (rawBass && getNoteIndex(normalizedBass) !== -1) {
      bassNote = normalizedBass;
    }
  }

  trimmed = normalizePrefixAccidental(trimmed);

  // Try to extract root note (1 or 2 chars)
  let root = '';
  let suffix = '';

  if (trimmed.length >= 2 && (trimmed[1] === '#' || trimmed[1] === 'b')) {
    root = trimmed.substring(0, 2);
    suffix = trimmed.substring(2);
  } else if (trimmed.length >= 1) {
    root = trimmed[0].toUpperCase();
    suffix = trimmed.substring(1);
  }

  root = normalizeNote(root);
  if (getNoteIndex(root) === -1) return null;

  // Map suffix to chord type
  const suffixLower = suffix.toLowerCase();
  let type = 'major';

  if (suffix === '' || suffixLower === 'maj' || suffixLower === 'major') {
    type = 'major';
  } else if (suffixLower === 'm' || suffixLower === 'min' || suffixLower === 'minor' || suffix === '-') {
    type = 'minor';
  } else if (suffixLower === '7' || suffixLower === 'dom7') {
    type = '7';
  } else if (suffixLower === 'maj7' || suffixLower === 'M7' || suffix === 'Δ7') {
    type = 'maj7';
  } else if (suffixLower === 'm7' || suffixLower === 'min7' || suffix === '-7') {
    type = 'm7';
  } else if (suffixLower === 'dim' || suffix === '°') {
    type = 'dim';
  } else if (suffixLower === 'dim7' || suffix === '°7') {
    type = 'dim7';
  } else if (suffixLower === 'aug' || suffix === '+') {
    type = 'aug';
  } else if (suffixLower === 'sus2') {
    type = 'sus2';
  } else if (suffixLower === 'sus4' || suffixLower === 'sus') {
    type = 'sus4';
  } else if (suffixLower === 'add9') {
    type = 'add9';
  } else if (suffixLower === 'm7b5' || suffix === 'ø' || suffix === 'ø7') {
    type = 'm7b5';
  } else if (suffixLower === '9') {
    type = '9';
  } else if (suffixLower === '6') {
    type = '6';
  } else if (suffixLower === 'm6' || suffixLower === 'min6') {
    type = 'm6';
  } else if (suffixLower === 'maj13') {
    type = 'maj13';
  } else if (suffixLower === 'maj9') {
    type = 'maj9';
  } else if (suffixLower === 'm9' || suffixLower === 'min9') {
    type = 'm9';
  } else if (suffixLower === '13') {
    type = '13';
  } else if (suffixLower === 'm11' || suffixLower === 'min11') {
    type = 'm11';
  } else if (suffixLower === '7b9') {
    type = '7b9';
  } else if (suffixLower === '7#9' || suffixLower === '7+9' || suffix === '7♯9') {
    type = '7#9';
  } else {
    return null;
  }

  const chordType = CHORD_TYPES[type];
  if (!chordType) return null;

  return {
    root,
    type,
    chordType,
    display: bassNote ? `${root}${chordType.symbol}/${bassNote}` : root + chordType.symbol,
    bassNote,
  };
}

export function getChordNotes(root: string, type: string): string[] {
  const chordType = CHORD_TYPES[type];
  if (!chordType) return [];
  return chordType.intervals.map(interval => getNoteAtInterval(root, interval % 12));
}

export function transposeChord(chord: ParsedChord, semitones: number): ParsedChord {
  const newRoot = getNoteAtInterval(chord.root, semitones);
  return {
    ...chord,
    root: newRoot,
    display: newRoot + chord.chordType.symbol,
  };
}

export function transposeProgression(chords: ParsedChord[], semitones: number): ParsedChord[] {
  return chords.map(c => transposeChord(c, semitones));
}

export function degreeToChord(degree: string, key: string): ParsedChord | null {
  const mapping = DEGREE_TO_CHORD_TYPE[degree];
  if (!mapping) return null;

  const keyIndex = getNoteIndex(key);
  if (keyIndex === -1) return null;

  const scaleNote = NOTES[(keyIndex + MAJOR_SCALE_INTERVALS[mapping.scaleIndex]) % 12];
  const chordType = CHORD_TYPES[mapping.type];

  return {
    root: scaleNote,
    type: mapping.type,
    chordType,
    display: scaleNote + chordType.symbol,
  };
}

export function progressionDegreesToChords(degrees: string[], key: string): (ParsedChord | null)[] {
  return degrees.map(d => degreeToChord(d, key));
}

export function findChordDegree(chordRoot: string, key: string): { degree: string; isNatural: boolean } | null {
  const keyIndex = getNoteIndex(key);
  const chordIndex = getNoteIndex(chordRoot);
  if (keyIndex === -1 || chordIndex === -1) return null;

  const interval = (chordIndex - keyIndex + 12) % 12;
  const degreeIndex = MAJOR_SCALE_INTERVALS.indexOf(interval);

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  if (degreeIndex !== -1) {
    return { degree: ROMAN[degreeIndex], isNatural: true };
  }

  // Check if it's a flat degree
  const FLAT_DEGREES: Record<number, string> = {
    1: 'bII', 3: 'bIII', 6: 'bV', 8: 'bVI', 10: 'bVII',
  };
  if (FLAT_DEGREES[interval]) {
    return { degree: FLAT_DEGREES[interval], isNatural: false };
  }

  return null;
}

// ─── Nashville Number System ────────────────────────────────────────────────

// Default chord symbol suffix for each scale degree (1–7) in a major key
const NASHVILLE_DEFAULT_SYMBOLS = ['', 'm', 'm', '', '', 'm', 'dim'];

/**
 * Returns true if every token looks like a Nashville number (1–7 with optional suffix).
 * Numbers only — won't match standard note-name tokens like "C", "Am7".
 */
export function isNashvilleNotation(tokens: string[]): boolean {
  if (!tokens.length) return false;
  return tokens.every(t => /^[b#]?[1-7][a-z0-9#b]*$/i.test(t) && !/^[A-Ga-g]/.test(t));
}

/**
 * Parse a single Nashville number token (e.g. "5", "57", "b3m", "4maj7")
 * against the given key (e.g. "C").
 */
export function parseNashvilleToken(token: string, key: string): ParsedChord | null {
  const match = token.match(/^([b#]?)([1-7])(.*)$/i);
  if (!match) return null;

  const [, accidental, degreeStr, suffix] = match;
  const degree = parseInt(degreeStr) - 1; // 0-indexed

  const keyIndex = getNoteIndex(key);
  if (keyIndex === -1) return null;

  let interval = MAJOR_SCALE_INTERVALS[degree];
  if (accidental === 'b') interval = (interval - 1 + 12) % 12;
  if (accidental === '#') interval = (interval + 1) % 12;

  const root = NOTES[(keyIndex + interval) % 12];

  // Suffix overrides the default quality; no suffix → use scale-degree default
  const chordName = root + (suffix || NASHVILLE_DEFAULT_SYMBOLS[degree]);
  return parseChordName(chordName);
}
