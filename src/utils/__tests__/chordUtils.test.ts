import { describe, it, expect } from 'vitest';
import {
  parseChordName,
  getChordNotes,
  transposeChord,
  transposeProgression,
  degreeToChord,
  progressionDegreesToChords,
  findChordDegree,
} from '../chordUtils';

describe('parseChordName', () => {
  it('parses major chords', () => {
    const result = parseChordName('C');
    expect(result).not.toBeNull();
    expect(result!.root).toBe('C');
    expect(result!.type).toBe('major');
    expect(result!.display).toBe('C');
  });

  it('parses with explicit major suffix', () => {
    expect(parseChordName('Cmaj')!.type).toBe('major');
    expect(parseChordName('Cmajor')!.type).toBe('major');
  });

  it('parses minor chords', () => {
    const result = parseChordName('Am');
    expect(result!.root).toBe('A');
    expect(result!.type).toBe('minor');
    expect(result!.display).toBe('Am');
  });

  it('parses minor chord variants', () => {
    expect(parseChordName('Amin')!.type).toBe('minor');
    expect(parseChordName('Aminor')!.type).toBe('minor');
    expect(parseChordName('A-')!.type).toBe('minor');
  });

  it('parses 7th chords', () => {
    expect(parseChordName('G7')!.type).toBe('7');
    expect(parseChordName('Gdom7')!.type).toBe('7');
  });

  it('parses maj7 chords', () => {
    expect(parseChordName('Cmaj7')!.type).toBe('maj7');
  });

  it('parses m7 chords', () => {
    expect(parseChordName('Dm7')!.type).toBe('m7');
    expect(parseChordName('Dmin7')!.type).toBe('m7');
  });

  it('parses diminished chords', () => {
    expect(parseChordName('Bdim')!.type).toBe('dim');
    expect(parseChordName('Bdim7')!.type).toBe('dim7');
  });

  it('parses augmented chords', () => {
    expect(parseChordName('Caug')!.type).toBe('aug');
    expect(parseChordName('C+')!.type).toBe('aug');
  });

  it('parses sus chords', () => {
    expect(parseChordName('Csus2')!.type).toBe('sus2');
    expect(parseChordName('Csus4')!.type).toBe('sus4');
    expect(parseChordName('Csus')!.type).toBe('sus4');
  });

  it('parses add9 chords', () => {
    expect(parseChordName('Cadd9')!.type).toBe('add9');
  });

  it('parses m7b5 chords', () => {
    expect(parseChordName('Bm7b5')!.type).toBe('m7b5');
  });

  it('parses 9th and 6th chords', () => {
    expect(parseChordName('C9')!.type).toBe('9');
    expect(parseChordName('C6')!.type).toBe('6');
    expect(parseChordName('Cm6')!.type).toBe('m6');
  });

  it('parses sharp root notes', () => {
    const result = parseChordName('F#m');
    expect(result!.root).toBe('F#');
    expect(result!.type).toBe('minor');
  });

  it('normalizes flat root notes to sharps', () => {
    const result = parseChordName('Bbm');
    expect(result!.root).toBe('A#');
    expect(result!.type).toBe('minor');
  });

  it('returns null for empty string', () => {
    expect(parseChordName('')).toBeNull();
    expect(parseChordName('  ')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(parseChordName('X')).toBeNull();
    expect(parseChordName('Cxyz')).toBeNull();
  });
});

describe('getChordNotes', () => {
  it('returns notes for C major', () => {
    expect(getChordNotes('C', 'major')).toEqual(['C', 'E', 'G']);
  });

  it('returns notes for A minor', () => {
    expect(getChordNotes('A', 'minor')).toEqual(['A', 'C', 'E']);
  });

  it('returns notes for G7', () => {
    expect(getChordNotes('G', '7')).toEqual(['G', 'B', 'D', 'F']);
  });

  it('returns notes for Cmaj7', () => {
    expect(getChordNotes('C', 'maj7')).toEqual(['C', 'E', 'G', 'B']);
  });

  it('returns empty array for unknown type', () => {
    expect(getChordNotes('C', 'nonexistent')).toEqual([]);
  });

  it('handles sharps correctly', () => {
    expect(getChordNotes('F#', 'minor')).toEqual(['F#', 'A', 'C#']);
  });
});

describe('transposeChord', () => {
  it('transposes up by semitones', () => {
    const chord = parseChordName('C')!;
    const result = transposeChord(chord, 2);
    expect(result.root).toBe('D');
    expect(result.type).toBe('major');
    expect(result.display).toBe('D');
  });

  it('transposes down (wraps around)', () => {
    const chord = parseChordName('C')!;
    const result = transposeChord(chord, -1);
    expect(result.root).toBe('B');
  });

  it('preserves chord type', () => {
    const chord = parseChordName('Am7')!;
    const result = transposeChord(chord, 5);
    expect(result.root).toBe('D');
    expect(result.type).toBe('m7');
    expect(result.display).toBe('Dm7');
  });
});

describe('transposeProgression', () => {
  it('transposes all chords in a progression', () => {
    const chords = ['C', 'Am', 'F', 'G'].map(n => parseChordName(n)!);
    const result = transposeProgression(chords, 2);
    expect(result.map(c => c.root)).toEqual(['D', 'B', 'G', 'A']);
  });
});

describe('degreeToChord', () => {
  it('maps I in C to C major', () => {
    const result = degreeToChord('I', 'C');
    expect(result!.root).toBe('C');
    expect(result!.type).toBe('major');
  });

  it('maps V in C to G major', () => {
    const result = degreeToChord('V', 'C');
    expect(result!.root).toBe('G');
    expect(result!.type).toBe('major');
  });

  it('maps ii in C to D minor', () => {
    const result = degreeToChord('ii', 'C');
    expect(result!.root).toBe('D');
    expect(result!.type).toBe('minor');
  });

  it('maps vi in G to E minor', () => {
    const result = degreeToChord('vi', 'G');
    expect(result!.root).toBe('E');
    expect(result!.type).toBe('minor');
  });

  it('returns null for invalid degree', () => {
    expect(degreeToChord('xyz', 'C')).toBeNull();
  });

  it('returns null for invalid key', () => {
    expect(degreeToChord('I', 'X')).toBeNull();
  });
});

describe('progressionDegreesToChords', () => {
  it('converts I-V-vi-IV in C', () => {
    const result = progressionDegreesToChords(['I', 'V', 'vi', 'IV'], 'C');
    expect(result.map(c => c!.root)).toEqual(['C', 'G', 'A', 'F']);
    expect(result.map(c => c!.type)).toEqual(['major', 'major', 'minor', 'major']);
  });
});

describe('findChordDegree', () => {
  it('finds I for root matching key', () => {
    const result = findChordDegree('C', 'C');
    expect(result!.degree).toBe('I');
    expect(result!.isNatural).toBe(true);
  });

  it('finds V for G in key of C', () => {
    const result = findChordDegree('G', 'C');
    expect(result!.degree).toBe('V');
    expect(result!.isNatural).toBe(true);
  });

  it('finds IV for F in key of C', () => {
    const result = findChordDegree('F', 'C');
    expect(result!.degree).toBe('IV');
    expect(result!.isNatural).toBe(true);
  });

  it('identifies flat degrees', () => {
    const result = findChordDegree('A#', 'C');
    expect(result!.degree).toBe('bVII');
    expect(result!.isNatural).toBe(false);
  });

  it('identifies bIII', () => {
    const result = findChordDegree('D#', 'C');
    expect(result!.degree).toBe('bIII');
    expect(result!.isNatural).toBe(false);
  });

  it('returns null for invalid notes', () => {
    expect(findChordDegree('X', 'C')).toBeNull();
    expect(findChordDegree('C', 'X')).toBeNull();
  });
});
