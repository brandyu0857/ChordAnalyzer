/**
 * ChordPro parser — supports two formats:
 *
 * 1. ChordPro format:  [C]歌词 [Am]歌词
 * 2. Plain chord lines: Cadd9 - Bm7b5 - E7 - Am7
 *
 * Auto-detects format based on whether brackets are present.
 */

import { parseChordName } from './chordUtils';

export interface ChordSegment {
  chord?: string;   // chord name, e.g. "Am", "G7"
  lyrics: string;   // lyrics text after this chord
}

export interface ChordLine {
  segments: ChordSegment[];
  isBlank: boolean;
}

export interface ChordSheet {
  title?: string;
  lines: ChordLine[];
  allChords: string[];  // unique chord names in order of appearance
}

/**
 * Check if a token looks like a valid chord name.
 */
function isChordToken(token: string): boolean {
  return parseChordName(token) !== null;
}

/**
 * Try to parse a line as plain chord progression: "Cadd9 - Bm7b5 - E7"
 * Returns chord names if the line is a chord-only line, or null if it contains non-chord text.
 */
function parsePlainChordLine(line: string): string[] | null {
  // Split by common separators: - | , and whitespace
  const tokens = line
    .split(/\s*[-|,]\s*|\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (tokens.length === 0) return null;

  // All tokens must be valid chords (allow at least 1)
  const chords = tokens.filter(t => isChordToken(t));

  // If most tokens are chords (>= 60%), treat as chord line
  if (chords.length >= tokens.length * 0.6 && chords.length >= 1) {
    return chords;
  }
  return null;
}

/**
 * Parse chord sheet text into structured data.
 * Auto-detects ChordPro format ([C]lyrics) vs plain chord lines (C - Am - F).
 */
export function parseChordPro(text: string): ChordSheet {
  const lines = text.split('\n');
  const parsedLines: ChordLine[] = [];
  const chordSet = new Set<string>();
  const chordOrder: string[] = [];
  let title: string | undefined;

  // Detect format: does the text use ChordPro brackets?
  const hasChordProBrackets = /\[[A-Ga-g]/.test(text);

  for (const line of lines) {
    // Check for title directive: {title: Name} or just first line as title
    const titleMatch = line.match(/^\{title:\s*(.+?)\s*\}$/i);
    if (titleMatch) {
      title = titleMatch[1];
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      parsedLines.push({ segments: [], isBlank: true });
      continue;
    }

    // --- ChordPro format: [C]lyrics [Am]lyrics ---
    if (hasChordProBrackets) {
      const segments: ChordSegment[] = [];
      const regex = /\[([^\]]+)\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let hasChords = false;

      while ((match = regex.exec(line)) !== null) {
        hasChords = true;
        const chordName = match[1].trim();

        const textBefore = line.slice(lastIndex, match.index);
        if (textBefore && segments.length > 0) {
          segments[segments.length - 1].lyrics += textBefore;
        } else if (textBefore) {
          segments.push({ lyrics: textBefore });
        }

        if (!chordSet.has(chordName)) {
          chordSet.add(chordName);
          chordOrder.push(chordName);
        }

        segments.push({ chord: chordName, lyrics: '' });
        lastIndex = match.index + match[0].length;
      }

      const remaining = line.slice(lastIndex);
      if (remaining) {
        if (segments.length > 0) {
          segments[segments.length - 1].lyrics += remaining;
        } else {
          segments.push({ lyrics: remaining });
        }
      }

      if (!hasChords) {
        segments.push({ lyrics: line });
      }

      parsedLines.push({ segments, isBlank: false });
      continue;
    }

    // --- Plain text format: detect chord lines vs lyrics ---
    const plainChords = parsePlainChordLine(line);
    if (plainChords) {
      // It's a chord progression line
      const segments: ChordSegment[] = plainChords.map(chord => {
        if (!chordSet.has(chord)) {
          chordSet.add(chord);
          chordOrder.push(chord);
        }
        return { chord, lyrics: '  ' }; // spacing between chords
      });
      parsedLines.push({ segments, isBlank: false });
    } else {
      // It's a lyrics line or annotation
      parsedLines.push({
        segments: [{ lyrics: line }],
        isBlank: false,
      });
    }
  }

  return {
    title,
    lines: parsedLines,
    allChords: chordOrder,
  };
}

/**
 * Example: ChordPro format (lyrics + chords)
 */
export const EXAMPLE_CHORD_PRO = `{title: Let It Be}

[C]When I find myself in [G]times of trouble
[Am]Mother Mary [F]comes to me
[C]Speaking words of [G]wisdom
Let it [F]be [C]

[Am]Let it [G]be, let it [F]be
Let it [C]be, let it [G]be
[C]Whisper words of [G]wisdom
Let it [F]be [C]`;

/**
 * Example: Plain chord progression (chords only)
 */
export const EXAMPLE_PLAIN_CHORDS = `{title: 爱你但说不出口}

Cadd9 - Bm7b5 - E7 - Am7 - Gm7

F7 - F - C/E - Am7 - Dm7 - Fm7b5 - G7`;
