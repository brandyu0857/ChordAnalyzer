// Monospace column width of a single character: 2 for East Asian "wide"
// characters (CJK, Hangul, fullwidth forms, ...), 1 for everything else.
// Needed because most monospace fonts render CJK glyphs at 2x the width of
// a Latin character/space, so aligning text with repeated space characters
// only works if wide characters are counted as two columns.
export function charWidth(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  if (
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    code === 0x2329 || code === 0x232a ||
    (code >= 0x2e80 && code <= 0x303e) || // CJK radicals, Kangxi, CJK symbols/punctuation
    (code >= 0x3041 && code <= 0x33ff) || // Hiragana .. CJK compat
    (code >= 0x3400 && code <= 0x4dbf) || // CJK unified ideographs ext A
    (code >= 0x4e00 && code <= 0x9fff) || // CJK unified ideographs
    (code >= 0xa000 && code <= 0xa4cf) || // Yi
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK compatibility ideographs
    (code >= 0xfe30 && code <= 0xfe4f) || // CJK compatibility forms
    (code >= 0xff00 && code <= 0xff60) || // Fullwidth forms
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x3fffd) // CJK ext B+ and supplementary ideographic plane
  ) {
    return 2;
  }
  return 1;
}

// Monospace column width of a string, summing each character's width.
export function displayWidth(str: string): number {
  let width = 0;
  for (const ch of str) width += charWidth(ch);
  return width;
}
