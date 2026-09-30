import { measureTextWidth } from './textWidth';

export interface LineChord {
  charIndex: number;
  chord: string;
}

export interface PlacedChordLabel extends LineChord {
  left: number;
  right: number;
}

const CHORD_GAP_PX = 6;

export function lyricsFont(fontPx: number, bold: boolean): string {
  return `${bold ? '600 ' : ''}${fontPx}px monospace`;
}

export function chordFont(chordPx: number): string {
  return `bold ${chordPx}px monospace`;
}

/**
 * Where each chord label sits above a lyric line. Labels are pixel-positioned
 * via measured text width, so each lands exactly above its target character
 * regardless of font metrics (CJK glyphs render wider than Latin ones, by an
 * amount that varies by font/OS) — pushed right only if it would otherwise
 * overlap the previous label.
 */
export function placeChordLabels(line: string, chords: LineChord[], fontPx: number, chordPx: number, bold: boolean): PlacedChordLabel[] {
  const textFont = lyricsFont(fontPx, bold);
  const labelFont = chordFont(chordPx);
  return [...chords]
    .sort((a, b) => a.charIndex - b.charIndex)
    .reduce<PlacedChordLabel[]>((acc, c) => {
      const naturalLeft = measureTextWidth(line.slice(0, c.charIndex), textFont);
      const left = Math.max(naturalLeft, acc.length ? acc[acc.length - 1].right : 0);
      const right = left + measureTextWidth(c.chord, labelFont) + CHORD_GAP_PX;
      return [...acc, { ...c, left, right }];
    }, []);
}

/** How wide a line is with its chords: labels pushed right can run past the text. */
export function lineWidth(line: string, chords: LineChord[], fontPx: number, chordPx: number, bold: boolean): number {
  const labels = placeChordLabels(line, chords, fontPx, chordPx, bold);
  return Math.max(measureTextWidth(line, lyricsFont(fontPx, bold)), labels.length ? labels[labels.length - 1].right : 0);
}
