import { getNoteIndex, MAJOR_SCALE_INTERVALS } from '../data/notes';
import { parseChordName } from './chordUtils';
import type { ParsedChord } from './chordUtils';

export type ChordStyle = 'default' | 'jazz' | 'soul' | 'hiphop' | 'funk';

export interface ChordStyleInfo {
  id: ChordStyle;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
}

export const CHORD_STYLES: ChordStyleInfo[] = [
  {
    id: 'default',
    name: '原始',
    nameEn: 'Original',
    description: '保持原始三和弦',
    descriptionEn: 'Keep original triads',
  },
  {
    id: 'jazz',
    name: '爵士',
    nameEn: 'Jazz',
    description: '七和弦为主，maj7 / m7 / dom7',
    descriptionEn: '7th chords: maj7 / m7 / dom7',
  },
  {
    id: 'soul',
    name: '灵魂乐',
    nameEn: 'Soul',
    description: '九和弦为主，丰满温暖',
    descriptionEn: '9th chords, lush & warm',
  },
  {
    id: 'hiphop',
    name: '嘻哈',
    nameEn: 'Hip-hop',
    description: '七和弦 + 九和弦混搭',
    descriptionEn: 'Mix of 7th & 9th chords',
  },
  {
    id: 'funk',
    name: '放克',
    nameEn: 'Funk',
    description: '属九和弦为主，节奏感强',
    descriptionEn: 'Dominant 9ths, rhythmic & groovy',
  },
];

// Chord suffix for each scale degree [I, ii, iii, IV, V, vi, vii°]
const STYLE_DEGREE_SUFFIXES: Record<ChordStyle, string[]> = {
  default: ['', 'm', 'm', '', '', 'm', 'dim'],
  jazz:    ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
  soul:    ['maj9', 'm9', 'm7', 'maj9', '9', 'm9', 'm7b5'],
  hiphop:  ['maj7', 'm9', 'm7', 'maj7', '9', 'm7', 'm7b5'],
  funk:    ['9', 'm7', 'm7', '9', '9', 'm7', 'm7b5'],
};

/**
 * Find the major-scale degree index (0–6) of a root note relative to a key.
 * Returns null if the root is not diatonic to the key.
 */
function getScaleDegreeIndex(root: string, key: string): number | null {
  const keyIdx = getNoteIndex(key);
  const rootIdx = getNoteIndex(root);
  if (keyIdx === -1 || rootIdx === -1) return null;
  const interval = (rootIdx - keyIdx + 12) % 12;
  return MAJOR_SCALE_INTERVALS.indexOf(interval) >= 0
    ? MAJOR_SCALE_INTERVALS.indexOf(interval)
    : null;
}

/**
 * Apply a chord style to a progression by re-voicing each chord
 * based on its scale degree in the given key.
 *
 * Non-diatonic chords (e.g. borrowed chords) are kept unchanged.
 * Bass notes from slash chords are preserved.
 */
export function applyStyleToProgression(
  chords: ParsedChord[],
  key: string,
  style: ChordStyle,
): ParsedChord[] {
  if (style === 'default') return chords;

  const suffixes = STYLE_DEGREE_SUFFIXES[style];

  return chords.map(chord => {
    const degree = getScaleDegreeIndex(chord.root, key);
    if (degree === null) return chord; // non-diatonic, keep as-is

    const suffix = suffixes[degree];
    const baseName = chord.root + suffix;
    const fullName = chord.bassNote ? `${baseName}/${chord.bassNote}` : baseName;
    return parseChordName(fullName) || chord;
  });
}
