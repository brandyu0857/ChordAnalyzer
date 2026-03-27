import { describe, it, expect } from 'vitest';
import {
  NOTES,
  MAJOR_SCALE_INTERVALS,
  MINOR_SCALE_INTERVALS,
  normalizeNote,
  getNoteIndex,
  getNoteAtInterval,
  getDisplayName,
  getSemitoneDifference,
} from '../notes';

describe('NOTES constant', () => {
  it('has 12 chromatic notes', () => {
    expect(NOTES).toHaveLength(12);
  });

  it('starts with C and ends with B', () => {
    expect(NOTES[0]).toBe('C');
    expect(NOTES[11]).toBe('B');
  });
});

describe('MAJOR_SCALE_INTERVALS', () => {
  it('follows W W H W W W H pattern', () => {
    expect(MAJOR_SCALE_INTERVALS).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });
});

describe('MINOR_SCALE_INTERVALS', () => {
  it('follows W H W W H W W pattern', () => {
    expect(MINOR_SCALE_INTERVALS).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });
});

describe('normalizeNote', () => {
  it('converts flats to sharps', () => {
    expect(normalizeNote('Db')).toBe('C#');
    expect(normalizeNote('Eb')).toBe('D#');
    expect(normalizeNote('Gb')).toBe('F#');
    expect(normalizeNote('Ab')).toBe('G#');
    expect(normalizeNote('Bb')).toBe('A#');
  });

  it('handles enharmonic edge cases', () => {
    expect(normalizeNote('Fb')).toBe('E');
    expect(normalizeNote('Cb')).toBe('B');
  });

  it('returns natural and sharp notes unchanged', () => {
    expect(normalizeNote('C')).toBe('C');
    expect(normalizeNote('F#')).toBe('F#');
    expect(normalizeNote('A')).toBe('A');
  });
});

describe('getNoteIndex', () => {
  it('returns correct index for natural notes', () => {
    expect(getNoteIndex('C')).toBe(0);
    expect(getNoteIndex('E')).toBe(4);
    expect(getNoteIndex('A')).toBe(9);
  });

  it('returns correct index for sharp notes', () => {
    expect(getNoteIndex('C#')).toBe(1);
    expect(getNoteIndex('F#')).toBe(6);
  });

  it('returns correct index for flat notes (normalized)', () => {
    expect(getNoteIndex('Bb')).toBe(10);
    expect(getNoteIndex('Eb')).toBe(3);
  });

  it('returns -1 for invalid notes', () => {
    expect(getNoteIndex('X')).toBe(-1);
    expect(getNoteIndex('H')).toBe(-1);
  });
});

describe('getNoteAtInterval', () => {
  it('returns correct note for simple intervals', () => {
    expect(getNoteAtInterval('C', 0)).toBe('C');
    expect(getNoteAtInterval('C', 4)).toBe('E');
    expect(getNoteAtInterval('C', 7)).toBe('G');
  });

  it('wraps around octave', () => {
    expect(getNoteAtInterval('A', 3)).toBe('C');
    expect(getNoteAtInterval('G', 5)).toBe('C');
  });

  it('handles negative intervals', () => {
    expect(getNoteAtInterval('C', -1)).toBe('B');
    expect(getNoteAtInterval('E', -4)).toBe('C');
  });
});

describe('getDisplayName', () => {
  it('returns the note as-is by default', () => {
    expect(getDisplayName('C#')).toBe('C#');
    expect(getDisplayName('A')).toBe('A');
  });

  it('converts sharps to flats when preferFlat is true', () => {
    expect(getDisplayName('C#', true)).toBe('Db');
    expect(getDisplayName('A#', true)).toBe('Bb');
  });

  it('returns natural notes unchanged even with preferFlat', () => {
    expect(getDisplayName('C', true)).toBe('C');
    expect(getDisplayName('E', true)).toBe('E');
  });
});

describe('getSemitoneDifference', () => {
  it('returns 0 for same note', () => {
    expect(getSemitoneDifference('C', 'C')).toBe(0);
  });

  it('calculates ascending distance', () => {
    expect(getSemitoneDifference('C', 'E')).toBe(4);
    expect(getSemitoneDifference('C', 'G')).toBe(7);
  });

  it('wraps around for descending intervals', () => {
    expect(getSemitoneDifference('G', 'C')).toBe(5);
    expect(getSemitoneDifference('E', 'C')).toBe(8);
  });

  it('works with flat notes', () => {
    expect(getSemitoneDifference('Bb', 'C')).toBe(2);
  });
});
