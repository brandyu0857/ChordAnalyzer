import { getNoteIndex, MAJOR_SCALE_INTERVALS } from '../data/notes';
import { PROGRESSION_SONGS } from '../data/songExamples';
import type { SongExample } from '../data/songExamples';
import type { ParsedChord } from './chordUtils';

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const FLAT_INTERVAL_TO_UPPER: Record<number, string> = {
  1: 'bII', 3: 'bIII', 6: 'bV', 8: 'bVI', 10: 'bVII',
};

// Chord type → degree suffix and whether it implies lowercase (minor quality)
const TYPE_TO_DEGREE: Record<string, { suffix: string; minor: boolean }> = {
  major:  { suffix: '',      minor: false },
  minor:  { suffix: '',      minor: true  },
  '7':    { suffix: '7',     minor: false },
  maj7:   { suffix: 'maj7',  minor: false },
  m7:     { suffix: '7',     minor: true  },
  dim:    { suffix: 'dim',   minor: true  },
  dim7:   { suffix: 'dim7',  minor: true  },
  aug:    { suffix: '+',     minor: false },
  sus4:   { suffix: 'sus4',  minor: false },
  sus2:   { suffix: 'sus2',  minor: false },
  add9:   { suffix: 'add9',  minor: false },
  m7b5:   { suffix: 'm7b5',  minor: true  },
  '9':    { suffix: '9',     minor: false },
  '6':    { suffix: '6',     minor: false },
  m6:     { suffix: 'm6',    minor: true  },
  maj9:   { suffix: 'maj9',  minor: false },
  maj13:  { suffix: 'maj13', minor: false },
  m9:     { suffix: '9',     minor: true  },
  '13':   { suffix: '13',    minor: false },
  m11:    { suffix: '11',    minor: true  },
  '7b9':  { suffix: '7b9',   minor: false },
  '7#9':  { suffix: '7#9',   minor: false },
};

/**
 * Convert a ParsedChord to a Roman numeral degree string in the given key.
 * Returns null if the root cannot be mapped to a scale degree.
 */
function chordToDegree(chord: ParsedChord, key: string): string | null {
  const keyIndex = getNoteIndex(key);
  const chordIndex = getNoteIndex(chord.root);
  if (keyIndex === -1 || chordIndex === -1) return null;

  const interval = (chordIndex - keyIndex + 12) % 12;

  // Find natural degree
  const naturalIdx = MAJOR_SCALE_INTERVALS.indexOf(interval);
  const typeInfo = TYPE_TO_DEGREE[chord.type] ?? { suffix: '', minor: chord.type.startsWith('m') };
  const suffix = typeInfo.suffix;
  const isMinor = typeInfo.minor;

  if (naturalIdx !== -1) {
    const roman = isMinor ? ROMAN_UPPER[naturalIdx].toLowerCase() : ROMAN_UPPER[naturalIdx];
    return roman + suffix;
  }

  // Flat degree
  const flatRoman = FLAT_INTERVAL_TO_UPPER[interval];
  if (flatRoman) {
    const roman = isMinor ? flatRoman.toLowerCase() : flatRoman;
    return roman + suffix;
  }

  return null;
}

/**
 * Convert an array of chords to a dash-separated degree string.
 * Returns null if any chord cannot be mapped.
 */
export function chordsToProgressionKey(chords: ParsedChord[], key: string): string | null {
  const degrees = chords.map(c => chordToDegree(c, key));
  if (degrees.some(d => d === null)) return null;
  return (degrees as string[]).join('-');
}

/**
 * Find songs that use the given chord progression in any key.
 * Tries all 12 transpositions and returns matched songs with the matched key.
 */
export function findSongExamples(chords: ParsedChord[]): { songs: SongExample[]; progressionKey: string } | null {
  if (chords.length === 0) return null;

  const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  for (const key of KEYS) {
    const progKey = chordsToProgressionKey(chords, key);
    if (!progKey) continue;
    const songs = PROGRESSION_SONGS[progKey];
    if (songs && songs.length > 0) {
      return { songs, progressionKey: progKey };
    }
  }

  return null;
}
