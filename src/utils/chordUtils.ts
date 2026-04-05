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
  let trimmed = name.trim()
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/𝄫/g, 'bb')
    .replace(/[()]/g, '')       // Strip parentheses
    .replace(/\^/g, 'maj')     // Caret = major (triangle shorthand)
    .replace(/Δ/g, 'maj')
    .replace(/°/g, 'dim')
    .replace(/ø/g, 'm7b5');
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
  // But not 6/9 chords
  let bassNote: string | undefined;
  let displayBass: string | undefined;
  if (trimmed.includes('/') && !trimmed.match(/6\/9$/i)) {
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
      displayBass = rawBass; // preserve original flat/sharp for display
    }
  }

  trimmed = normalizePrefixAccidental(trimmed);

  // Try to extract root note (1 or 2 chars)
  let root = '';
  let displayRoot = '';
  let suffix = '';

  if (trimmed.length >= 2 && (trimmed[1] === '#' || trimmed[1] === 'b')) {
    root = trimmed.substring(0, 2);
    suffix = trimmed.substring(2);
  } else if (trimmed.length >= 1) {
    root = trimmed[0].toUpperCase();
    suffix = trimmed.substring(1);
  }

  displayRoot = root; // preserve original (e.g. "Ab") before normalizing
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
  } else if (suffixLower === '7sus4' || suffixLower === '7sus') {
    type = '7sus4';
  } else if (suffixLower === '7sus2') {
    type = '7sus2';
  } else if (suffixLower === '9sus4' || suffixLower === '9sus') {
    type = '9sus4';
  } else if (suffixLower === '11') {
    type = '11';
  } else if (suffixLower === 'mmaj7' || suffixLower === 'm(maj7)' || suffixLower === 'mmaj7' || suffix === 'mΔ7' || suffixLower === 'min(maj7)' || suffixLower === 'minmaj7') {
    type = 'mmaj7';
  } else if (suffixLower === '7b5') {
    type = '7b5';
  } else if (suffixLower === '7#5' || suffixLower === '7+5') {
    type = '7#5';
  } else if (suffixLower === '5') {
    type = '5';
  } else if (suffixLower === 'madd9' || suffixLower === 'minadd9') {
    type = 'madd9';
  } else if (suffix === '6/9' || suffixLower === '69') {
    type = '6/9';
  } else if (suffixLower === 'aug7' || suffix === '+7') {
    type = 'aug7';
  } else if (suffixLower === 'maj11') {
    type = 'maj11';
  } else {
    // Not in known list — try dynamic formula parsing
    const dynamicType = buildChordTypeFromSuffix(suffix);
    if (dynamicType) {
      const dynKey = '_dyn_' + suffix;
      return {
        root,
        type: dynKey,
        chordType: dynamicType,
        display: displayBass ? `${displayRoot}${dynamicType.symbol}/${displayBass}` : displayRoot + dynamicType.symbol,
        bassNote,
      };
    }
    return null;
  }

  const chordType = CHORD_TYPES[type];
  if (!chordType) return null;

  return {
    root,
    type,
    chordType,
    display: displayBass ? `${displayRoot}${chordType.symbol}/${displayBass}` : displayRoot + chordType.symbol,
    bassNote,
  };
}

export function getChordNotes(root: string, type: string): string[] {
  const chordType = CHORD_TYPES[type] ?? (type.startsWith('_dyn_') ? buildChordTypeFromSuffix(type.slice(5)) : null);
  if (!chordType) return [];
  return chordType.intervals.map(interval => getNoteAtInterval(root, interval % 12));
}

export function transposeChord(chord: ParsedChord, semitones: number): ParsedChord {
  const newRoot = getNoteAtInterval(chord.root, semitones);
  const newBass = chord.bassNote ? getNoteAtInterval(chord.bassNote, semitones) : undefined;
  const display = newBass
    ? `${newRoot}${chord.chordType.symbol}/${newBass}`
    : newRoot + chord.chordType.symbol;
  return {
    ...chord,
    root: newRoot,
    bassNote: newBass,
    display,
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

// ─── Dynamic Chord Formula Parser ───────────────────────────────────────────

/**
 * Build a ChordType dynamically from any chord suffix string (e.g. "7#11", "m9b5", "maj13#11").
 * Uses music theory rules to compute intervals from the symbol.
 * Returns null only if the suffix is completely unparseable.
 */
function buildChordTypeFromSuffix(suffix: string): ChordType | null {
  if (!suffix) return null;

  let s = suffix;
  let third: number | null = 4;   // default major 3rd
  let fifth = 7;                  // default perfect 5th
  let seventh: number | null = null;
  let hasSixth = false;
  const extras: number[] = [];
  let isSus: 2 | 4 | null = null;
  let consumed = false;

  // --- Helper: consume a regex from the front of `s` ---
  function eat(re: RegExp): RegExpMatchArray | null {
    const m = s.match(re);
    if (m && s.indexOf(m[0]) === 0) {
      s = s.substring(m[0].length);
      consumed = true;
      return m;
    }
    return null;
  }

  // --- 1. Quality prefix ---
  if (eat(/^m(?!aj)/i)) {
    third = 3; // minor
    // mmaj7, m(maj7)
    if (eat(/^\(?maj\)?/i)) {
      seventh = 11; // major 7th
    }
  } else if (eat(/^dim/i) || eat(/^°/)) {
    third = 3; fifth = 6;
  } else if (eat(/^aug/i) || eat(/^\+(?![0-9])/)) {
    third = 4; fifth = 8;
  }
  // else: major (default), or prefix is part of extension (maj7, etc.)

  // --- 2. Extension / 7th ---
  if (eat(/^maj/i) || eat(/^M(?=[0-9])/)) {
    // maj7, maj9, maj11, maj13
    const numMatch = eat(/^[0-9]+/);
    if (numMatch) {
      const ext = parseInt(numMatch[0]);
      seventh = 11; // major 7th
      if (ext >= 9)  extras.push(14);
      if (ext >= 11) extras.push(17);
      if (ext >= 13) extras.push(21);
    } else {
      seventh = 11; // just "maj" after quality = major 7th
    }
  } else {
    const numMatch = eat(/^[0-9]+/);
    if (numMatch) {
      const ext = parseInt(numMatch[0]);
      if (ext === 5) {
        third = null; // power chord
      } else if (ext === 69) {
        hasSixth = true;
        extras.push(14); // 9
      } else if (ext === 6) {
        hasSixth = true;
      } else if (ext === 7) {
        seventh = seventh ?? 10;
      } else if (ext === 9) {
        seventh = seventh ?? 10;
        extras.push(14);
      } else if (ext === 11) {
        seventh = seventh ?? 10;
        extras.push(14);
        extras.push(17);
      } else if (ext === 13) {
        seventh = seventh ?? 10;
        extras.push(14);
        extras.push(17);
        extras.push(21);
      }
    }
  }

  // --- 3. Remaining modifiers (alterations, sus, add) ---
  let guard = 20; // prevent infinite loop on malformed input
  while (s.length > 0 && guard-- > 0) {
    // Skip parentheses, slashes used as separators
    if (eat(/^[()]/)) continue;

    // 6/9
    if (eat(/^6\/9/i)) {
      hasSixth = true;
      extras.push(14);
      continue;
    }

    // sus2, sus4
    {
      const susMatch = s.match(/^sus([24])?/i);
      if (susMatch) {
        s = s.substring(susMatch[0].length);
        consumed = true;
        isSus = susMatch[1] === '2' ? 2 : 4;
        continue;
      }
    }

    // add + optional accidental + number: add9, add#11, addb13, add2, add4
    const addMatch = eat(/^add([b#]?)([0-9]+)/i);
    if (addMatch) {
      const acc = addMatch[1];
      const n = parseInt(addMatch[2]);
      const semi = degreeToSemitone(n, acc);
      if (semi !== null) extras.push(semi);
      continue;
    }

    // Alteration: b5, #5, b9, #9, #11, b13, etc.
    const altMatch = eat(/^([b#♭♯])([0-9]+)/);
    if (altMatch) {
      const acc = altMatch[1];
      const n = parseInt(altMatch[2]);
      const isSharp = acc === '#' || acc === '♯';
      const semi = degreeToSemitone(n, isSharp ? '#' : 'b');
      if (semi !== null) {
        if (n === 5) { fifth = semi; }
        else if (n === 9) {
          // Remove natural 9 if present, add altered
          const idx = extras.indexOf(14);
          if (idx >= 0) extras[idx] = semi;
          else extras.push(semi);
        } else if (n === 11) {
          const idx = extras.indexOf(17);
          if (idx >= 0) extras[idx] = semi;
          else extras.push(semi);
        } else if (n === 13) {
          const idx = extras.indexOf(21);
          if (idx >= 0) extras[idx] = semi;
          else extras.push(semi);
        } else {
          extras.push(semi);
        }
      }
      continue;
    }

    // no9, no3, no5 — omit a degree
    const noMatch = eat(/^no([0-9]+)/i);
    if (noMatch) {
      const n = parseInt(noMatch[1]);
      if (n === 3) third = null;
      else if (n === 5) fifth = -1;
      continue;
    }

    // Unknown character — skip to avoid infinite loop
    s = s.substring(1);
  }

  // If nothing was consumed at all, suffix is garbage
  if (!consumed && suffix.length > 0) return null;

  // --- 4. Assemble intervals ---
  const intervals: number[] = [0];
  if (isSus === 2) intervals.push(2);
  else if (isSus === 4) intervals.push(5);
  else if (third !== null) intervals.push(third);

  if (fifth >= 0) intervals.push(fifth);
  if (hasSixth) intervals.push(9);
  if (seventh !== null) intervals.push(seventh);
  for (const e of extras) {
    if (!intervals.includes(e)) intervals.push(e);
  }

  intervals.sort((a, b) => a - b);

  return {
    name: suffix,
    nameEn: suffix,
    symbol: suffix,
    intervals,
    description: '动态识别',
    descriptionEn: 'Dynamically parsed',
  };
}

/** Map a scale degree number + accidental to semitones from root */
function degreeToSemitone(degree: number, accidental: string): number | null {
  // Natural degree → semitone mapping
  const natural: Record<number, number> = {
    1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11,
    9: 14, 10: 16, 11: 17, 12: 18, 13: 21,
  };
  const base = natural[degree];
  if (base === undefined) return null;
  if (accidental === 'b' || accidental === '♭') return base - 1;
  if (accidental === '#' || accidental === '♯') return base + 1;
  return base;
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
