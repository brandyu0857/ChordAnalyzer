import { NOTES } from '../data/notes';
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

      // Check: all essential chord tones should be present
      // For triads, need all notes; for 7ths+, allow missing 5th
      const essentialIntervals = chordIntervals.filter(i => {
        // The 5th (7 semitones) can be omitted in extended chords
        if (chordIntervals.length > 3 && i === 7) return false;
        return true;
      });
      const essentialNotes = essentialIntervals.map(i => (rootIdx + i) % 12);
      const essentialPresent = essentialNotes.filter(n => noteSet.has(n)).length;
      const essentialTotal = essentialNotes.length;

      // Need at least all essential tones for a good match
      // But also allow partial matches with lower confidence
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

      // Penalty: many expected notes missing
      const missing = expectedNotes.size - uniqueNotes.filter(n => expectedNotes.has(n)).length;
      confidence -= missing * 8;

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
