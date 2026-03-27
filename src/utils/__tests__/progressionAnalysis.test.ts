import { describe, it, expect } from 'vitest';
import {
  analyzeChordInKey,
  analyzeConnection,
  analyzeProgression,
} from '../progressionAnalysis';
import { parseChordName } from '../chordUtils';

describe('analyzeChordInKey', () => {
  it('identifies I chord as tonic', () => {
    const chord = parseChordName('C')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.degree).toBe('I');
    expect(result.function).toBe('tonic');
    expect(result.isNatural).toBe(true);
  });

  it('identifies V chord as dominant', () => {
    const chord = parseChordName('G')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.degree).toBe('V');
    expect(result.function).toBe('dominant');
  });

  it('identifies IV chord as subdominant', () => {
    const chord = parseChordName('F')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.degree).toBe('IV');
    expect(result.function).toBe('subdominant');
  });

  it('identifies vi chord as tonic substitute', () => {
    const chord = parseChordName('Am')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.degree).toBe('vi');
    expect(result.function).toBe('tonic');
  });

  it('identifies ii chord as subdominant', () => {
    const chord = parseChordName('Dm')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.degree).toBe('ii');
    expect(result.function).toBe('subdominant');
  });

  it('identifies borrowed bVII chord', () => {
    const chord = parseChordName('A#')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.function).toBe('borrowed');
  });

  it('identifies bV as borrowed chord', () => {
    const chord = parseChordName('F#')!;
    const result = analyzeChordInKey(chord, 'C');
    expect(result.function).toBe('borrowed');
    expect(result.isNatural).toBe(false);
  });

  it('works in different keys', () => {
    const chord = parseChordName('D')!;
    const result = analyzeChordInKey(chord, 'G');
    expect(result.degree).toBe('V');
    expect(result.function).toBe('dominant');
  });
});

describe('analyzeConnection', () => {
  it('detects V→I authentic cadence', () => {
    const from = parseChordName('G')!;
    const to = parseChordName('C')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.connectionType).toContain('V→I');
    expect(result.tension).toBe('strong');
  });

  it('detects IV→I plagal cadence', () => {
    const from = parseChordName('F')!;
    const to = parseChordName('C')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.connectionType).toContain('IV→I');
    expect(result.tension).toBe('moderate');
  });

  it('detects I→V motion', () => {
    const from = parseChordName('C')!;
    const to = parseChordName('G')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.connectionType).toBe('主到属');
    expect(result.tension).toBe('moderate');
  });

  it('finds common notes between chords', () => {
    const from = parseChordName('C')!;   // C E G
    const to = parseChordName('Am')!;    // A C E
    const result = analyzeConnection(from, to, 'C');
    expect(result.commonNotes).toContain('C');
    expect(result.commonNotes).toContain('E');
    expect(result.commonNotes).toHaveLength(2);
  });

  it('calculates root motion', () => {
    const from = parseChordName('C')!;
    const to = parseChordName('G')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.rootMotion).toBe(7); // C to G = 7 semitones
  });

  it('detects fifth-related motion', () => {
    const from = parseChordName('Am')!;
    const to = parseChordName('Dm')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.connectionType).toBe('五度进行');
    expect(result.tension).toBe('smooth');
  });

  it('detects tritone motion', () => {
    const from = parseChordName('C')!;
    const to = parseChordName('F#')!;
    const result = analyzeConnection(from, to, 'C');
    expect(result.connectionType).toBe('三全音进行');
    expect(result.tension).toBe('strong');
  });
});

describe('analyzeProgression', () => {
  it('analyzes a full I-V-vi-IV progression', () => {
    const chords = ['C', 'G', 'Am', 'F'].map(n => parseChordName(n)!);
    const result = analyzeProgression(chords, 'C');

    expect(result.chordAnalyses).toHaveLength(4);
    expect(result.chordAnalyses[0].degree).toBe('I');
    expect(result.chordAnalyses[1].degree).toBe('V');
    expect(result.chordAnalyses[2].degree).toBe('vi');
    expect(result.chordAnalyses[3].degree).toBe('IV');

    expect(result.connections).toHaveLength(3);
  });

  it('returns empty connections for single chord', () => {
    const chords = [parseChordName('C')!];
    const result = analyzeProgression(chords, 'C');
    expect(result.chordAnalyses).toHaveLength(1);
    expect(result.connections).toHaveLength(0);
  });

  it('works in key of G', () => {
    const chords = ['G', 'D', 'Em', 'C'].map(n => parseChordName(n)!);
    const result = analyzeProgression(chords, 'G');
    expect(result.chordAnalyses[0].degree).toBe('I');
    expect(result.chordAnalyses[1].degree).toBe('V');
    expect(result.chordAnalyses[2].degree).toBe('vi');
    expect(result.chordAnalyses[3].degree).toBe('IV');
  });
});
