import { NOTES, INTERVAL_NAMES, INTERVAL_NAMES_EN, getNoteIndex, getIntervalDegree } from '../data/notes';
import { CHORD_TYPES, GUITAR_TUNING } from '../data/chords';

export interface IdentifiedChord {
  root: string;
  type: string;
  name: string;
  nameEn: string;
  symbol: string;      // e.g. "Cmaj7"
  description: string;
  descriptionEn: string;
  bassNote?: string;   // If lowest note != root → slash chord
  confidence: number;  // Higher = better match
  approximate?: boolean; // True when the shape doesn't match this chord exactly
  omitted?: string[];    // Chord tones not played, e.g. ['3', '5']
  added?: string[];      // Played notes that aren't chord tones, e.g. ['D#']
}

/**
 * Convert fret selections to note indices.
 * frets: [6th, 5th, 4th, 3rd, 2nd, 1st] — same as GuitarFingering
 * -1 = muted/not pressed
 */
export function fretsToNotes(frets: number[]): number[] {
  const notes: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (frets[i] >= 0) {
      notes.push((GUITAR_TUNING[i] + frets[i]) % 12);
    }
  }
  return notes;
}

/**
 * Get the lowest sounding note from fret selections.
 */
function getLowestNote(frets: number[]): number | null {
  for (let i = 0; i < 6; i++) {
    if (frets[i] >= 0) {
      return (GUITAR_TUNING[i] + frets[i]) % 12;
    }
  }
  return null;
}

/**
 * Identify chords from a set of fret positions.
 * Returns all possible chord interpretations, sorted by confidence.
 */
export function identifyChords(frets: number[]): IdentifiedChord[] {
  const noteValues = fretsToNotes(frets);
  if (noteValues.length < 2) return [];

  // Get unique pitch classes
  const uniqueNotes = [...new Set(noteValues)];
  const noteSet = new Set(uniqueNotes);
  const lowestNote = getLowestNote(frets);

  const results: IdentifiedChord[] = [];

  for (const [typeKey, chordType] of Object.entries(CHORD_TYPES)) {
    // Normalize intervals to pitch classes (mod 12), deduplicate
    const chordIntervals = [...new Set(chordType.intervals.map(i => i % 12))];

    // Try each of the 12 notes as root
    for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
      // Calculate the expected pitch classes for this root + chord type
      const expectedNotes = new Set(chordIntervals.map(i => (rootIdx + i) % 12));

      // Check: all played notes must be in the chord
      const allNotesInChord = uniqueNotes.every(n => expectedNotes.has(n));
      if (!allNotesInChord) continue;

      // For extended chords (9, 11, 13), the characteristic extension note MUST be present
      // Otherwise a simple 7th chord with 4 notes would match 9th, 11th, 13th simultaneously
      const highestInterval = Math.max(...chordIntervals);
      if (highestInterval > 7) {
        // The highest interval is the "character" of the chord (9=14, 11=17, 13=21)
        const charNote = (rootIdx + highestInterval) % 12;
        if (!noteSet.has(charNote)) continue;
      }

      // Check: all essential chord tones should be present
      // For triads, need all notes; for 7ths+, allow missing 5th
      const essentialIntervals = chordIntervals.filter(i => {
        if (chordIntervals.length > 3 && i === 7) return false; // 5th can be omitted
        return true;
      });
      const essentialNotes = essentialIntervals.map(i => (rootIdx + i) % 12);
      const essentialPresent = essentialNotes.filter(n => noteSet.has(n)).length;
      const essentialTotal = essentialNotes.length;

      // Need at least all essential tones for a good match
      if (essentialPresent < Math.min(essentialTotal, uniqueNotes.length)) continue;

      // Calculate confidence score
      let confidence = 0;

      // Bonus: how many chord tones are covered
      const coverage = uniqueNotes.filter(n => expectedNotes.has(n)).length / expectedNotes.size;
      confidence += coverage * 40;

      // Bonus: exact match (played notes = chord notes)
      if (uniqueNotes.length === expectedNotes.size && coverage === 1) {
        confidence += 30;
      }

      // Bonus: root is the lowest note
      if (lowestNote === rootIdx) {
        confidence += 20;
      }

      // Penalty: simpler chords preferred when notes are few
      if (uniqueNotes.length <= 3 && chordIntervals.length > 3) {
        confidence -= 15;
      }
      // Heavier penalty for extended chords when many notes are missing
      if (chordIntervals.length >= 5 && uniqueNotes.length < chordIntervals.length - 1) {
        confidence -= 20;
      }

      // Penalty: many expected notes missing
      const missing = expectedNotes.size - uniqueNotes.filter(n => expectedNotes.has(n)).length;
      confidence -= missing * 10;

      const root = NOTES[rootIdx];
      const symbol = root + chordType.symbol;

      // Determine if it's a slash chord
      let bassNote: string | undefined;
      if (lowestNote !== null && lowestNote !== rootIdx) {
        bassNote = NOTES[lowestNote];
      }

      results.push({
        root,
        type: typeKey,
        name: chordType.name,
        nameEn: chordType.nameEn,
        symbol: bassNote ? `${symbol}/${bassNote}` : symbol,
        description: chordType.description,
        descriptionEn: chordType.descriptionEn,
        bassNote,
        confidence,
      });
    }
  }

  // Sort by confidence (descending), then by simpler chord types first
  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    // Prefer simpler chords
    return CHORD_TYPES[a.type].intervals.length - CHORD_TYPES[b.type].intervals.length;
  });

  // Deduplicate: keep only the best match per symbol
  const seen = new Set<string>();
  const deduped: IdentifiedChord[] = [];
  for (const r of results) {
    if (!seen.has(r.symbol)) {
      seen.add(r.symbol);
      deduped.push(r);
    }
  }

  return deduped.slice(0, 8);
}

/**
 * Get the note name for a specific string and fret.
 */
export function getNoteAtFret(stringIdx: number, fret: number): string {
  const noteIdx = (GUITAR_TUNING[stringIdx] + fret) % 12;
  return NOTES[noteIdx];
}

/* ─── Approximate matching ─────────────────────────────────────────────────
 * identifyChords() only reports shapes whose notes all belong to one chord.
 * Real fingerings are often voicings with an omitted tone (rootless jazz
 * shapes, no-5th grips) or one colour note outside the table's chord types,
 * and those used to return nothing at all. The fallback below always names
 * the closest chords instead, flagged so the UI can label them as guesses.
 * ---------------------------------------------------------------------- */

// How much a missing chord tone hurts: the 5th is freely dropped, the 3rd
// defines the chord's quality, the root can be implied by the bass.
function missingWeight(interval: number): number {
  switch (interval) {
    case 7: return 0.5;            // 5th
    case 0: return 2.5;            // root
    case 3: case 4: return 2;      // 3rd
    case 10: case 11: return 1.2;  // 7th
    default: return 1;             // extensions
  }
}

/**
 * Find the chords a shape comes closest to when nothing matches exactly.
 * Allows at most one note outside the chord and reports which tones are
 * omitted or added, so the caller can render "Bm7 · omits 5" style hints.
 */
export function approximateChords(frets: number[]): IdentifiedChord[] {
  const noteValues = fretsToNotes(frets);
  if (noteValues.length < 2) return [];

  const uniqueNotes = [...new Set(noteValues)];
  const noteSet = new Set(uniqueNotes);
  const lowestNote = getLowestNote(frets);

  const scored: { chord: IdentifiedChord; score: number }[] = [];

  for (const [typeKey, chordType] of Object.entries(CHORD_TYPES)) {
    // Keep the raw intervals (14, 17, 21 …) so labels read as 9/11/13, but
    // only one entry per pitch class.
    const seenPitchClass = new Set<number>();
    const chordIntervals = chordType.intervals.filter(i => {
      if (seenPitchClass.has(i % 12)) return false;
      seenPitchClass.add(i % 12);
      return true;
    });

    for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
      const expectedNotes = new Set(chordIntervals.map(i => (rootIdx + i) % 12));

      const missingIntervals = chordIntervals.filter(i => !noteSet.has((rootIdx + i) % 12));
      const addedNotes = uniqueNotes.filter(n => !expectedNotes.has(n));
      const shared = uniqueNotes.length - addedNotes.length;

      // A guess needs real overlap: most of what's played has to be in the
      // chord, and most of the chord has to be played.
      if (addedNotes.length > 1) continue;
      if (shared < 2 || shared < uniqueNotes.length - 1) continue;
      if (missingIntervals.length > Math.floor(chordIntervals.length / 2)) continue;

      const missingPenalty = missingIntervals.reduce((sum, i) => sum + missingWeight(i % 12), 0);
      const coverage = shared / expectedNotes.size;

      let score = coverage * 100;
      score -= addedNotes.length * 25;
      score -= missingPenalty * 10;
      score -= chordIntervals.length * 2;          // prefer the simpler reading
      if (lowestNote === rootIdx) score += 12;     // root in the bass
      if (lowestNote !== null && !expectedNotes.has(lowestNote)) score -= 10; // bass isn't a chord tone

      const root = NOTES[rootIdx];
      const symbol = root + chordType.symbol;
      const bassNote = lowestNote !== null && lowestNote !== rootIdx ? NOTES[lowestNote] : undefined;

      // A slash symbol already spells out the bass, so don't also list it as
      // an added note.
      const added = addedNotes
        .map(n => NOTES[n])
        .filter(n => n !== bassNote);

      scored.push({
        score,
        chord: {
          root,
          type: typeKey,
          name: chordType.name,
          nameEn: chordType.nameEn,
          symbol: bassNote ? `${symbol}/${bassNote}` : symbol,
          description: chordType.description,
          descriptionEn: chordType.descriptionEn,
          bassNote,
          confidence: score,
          approximate: true,
          omitted: missingIntervals.map(i => getIntervalDegree(i, typeKey)),
          added,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const deduped: IdentifiedChord[] = [];
  for (const { chord } of scored) {
    if (seen.has(chord.symbol)) continue;
    seen.add(chord.symbol);
    deduped.push(chord);
  }

  return deduped.slice(0, 4);
}

/**
 * Name the interval between two sounding notes, e.g. "E → B · Perfect 5th".
 * Returns null unless exactly two distinct pitches are selected.
 */
export function describeInterval(frets: number[], locale: 'zh' | 'en' = 'zh'): string | null {
  const noteValues = fretsToNotes(frets);
  const uniqueNotes = [...new Set(noteValues)];
  if (uniqueNotes.length !== 2) return null;

  const low = getLowestNote(frets);
  if (low === null) return null;
  const other = uniqueNotes.find(n => n !== low);
  if (other === undefined) return null;

  const semitones = (other - low + 12) % 12;
  const names = locale === 'en' ? INTERVAL_NAMES_EN : INTERVAL_NAMES;
  return `${NOTES[low]} → ${NOTES[other]} · ${names[semitones]}`;
}

// Labels for notes that aren't chord tones: extensions read as 9/11/13
const PITCH_CLASS_LABELS: Record<number, string> = {
  0: '1', 1: 'b9', 2: '9', 3: 'b3', 4: '3', 5: '11',
  6: 'b5', 7: '5', 8: '#5', 9: '13', 10: 'b7', 11: '7',
};

/**
 * Label a sounding note by its degree within a chord, e.g. 'R', '3', 'b7'.
 * Chord tones keep the chord's own spelling (a 6 chord says '6', not '13').
 */
export function getDegreeLabel(chord: IdentifiedChord, note: string): string {
  const semitones = (getNoteIndex(note) - getNoteIndex(chord.root) + 12) % 12;
  const raw = CHORD_TYPES[chord.type]?.intervals.find(i => i % 12 === semitones);
  if (raw !== undefined) return getIntervalDegree(raw, chord.type);
  return PITCH_CLASS_LABELS[semitones];
}
