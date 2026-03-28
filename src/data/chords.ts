export interface ChordType {
  name: string;
  symbol: string;
  intervals: number[];
  description: string;
}

export const CHORD_TYPES: Record<string, ChordType> = {
  major: { name: '大三和弦', symbol: '', intervals: [0, 4, 7], description: '明亮、稳定' },
  minor: { name: '小三和弦', symbol: 'm', intervals: [0, 3, 7], description: '柔和、忧郁' },
  '7': { name: '属七和弦', symbol: '7', intervals: [0, 4, 7, 10], description: '有张力、需要解决' },
  maj7: { name: '大七和弦', symbol: 'maj7', intervals: [0, 4, 7, 11], description: '梦幻、优雅' },
  m7: { name: '小七和弦', symbol: 'm7', intervals: [0, 3, 7, 10], description: '温暖、爵士感' },
  dim: { name: '减三和弦', symbol: 'dim', intervals: [0, 3, 6], description: '紧张、不稳定' },
  dim7: { name: '减七和弦', symbol: 'dim7', intervals: [0, 3, 6, 9], description: '极度紧张' },
  aug: { name: '增三和弦', symbol: 'aug', intervals: [0, 4, 8], description: '飘忽、神秘' },
  sus2: { name: '挂二和弦', symbol: 'sus2', intervals: [0, 2, 7], description: '开放、现代' },
  sus4: { name: '挂四和弦', symbol: 'sus4', intervals: [0, 5, 7], description: '悬浮、待解决' },
  add9: { name: '加九和弦', symbol: 'add9', intervals: [0, 4, 7, 14], description: '丰富、明亮' },
  m7b5: { name: '半减七和弦', symbol: 'm7b5', intervals: [0, 3, 6, 10], description: '半减、过渡性' },
  '9': { name: '属九和弦', symbol: '9', intervals: [0, 4, 7, 10, 14], description: '丰满、蓝调' },
  '6': { name: '大六和弦', symbol: '6', intervals: [0, 4, 7, 9], description: '温暖、复古' },
  m6: { name: '小六和弦', symbol: 'm6', intervals: [0, 3, 7, 9], description: '忧郁中带温暖' },
  maj9:  { name: '大九和弦',       symbol: 'maj9', intervals: [0, 4, 7, 11, 14], description: '梦幻、层次丰富' },
  m9:    { name: '小九和弦',       symbol: 'm9',   intervals: [0, 3, 7, 10, 14], description: '柔美、爵士感' },
  '13':  { name: '属十三和弦',     symbol: '13',   intervals: [0, 4, 7, 10, 14, 17, 21], description: '丰满、蓝调爵士' },
  m11:   { name: '小十一和弦',     symbol: 'm11',  intervals: [0, 3, 7, 10, 14, 17], description: '温暖、神秘' },
  '7b9': { name: '属七降九和弦',   symbol: '7b9',  intervals: [0, 4, 7, 10, 13], description: '紧张、蓝调' },
  '7#9': { name: '属七升九和弦',   symbol: '7#9',  intervals: [0, 4, 7, 10, 15], description: '强烈、布鲁斯摇滚' },
};

// Guitar string tuning: E2 A2 D3 G3 B3 E4 (low to high)
export const GUITAR_TUNING = [4, 9, 2, 7, 11, 4]; // E A D G B E as note indices

// Fingering: [6th, 5th, 4th, 3rd, 2nd, 1st] string
// -1 = muted, 0 = open, 1-12 = fret number
export interface GuitarFingering {
  frets: number[];
  fingers?: number[];
  barreAt?: number;
  startFret?: number;
}

export const GUITAR_CHORD_SHAPES: Record<string, GuitarFingering> = {
  // ============================================================
  // MAJOR CHORDS (all 12 roots)
  // ============================================================
  'C':     { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'C#':    { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], startFret: 1 },
  'D':     { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'D#':    { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3], startFret: 1 },
  'E':     { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'F':     { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barreAt: 1 },
  'F#':    { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barreAt: 2, startFret: 2 },
  'G':     { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'G#':    { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barreAt: 4, startFret: 4 },
  'A':     { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'A#':    { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barreAt: 1, startFret: 1 },
  'B':     { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // MINOR CHORDS (all 12 roots)
  // ============================================================
  'Cm':    { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barreAt: 3, startFret: 3 },
  'C#m':   { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barreAt: 4, startFret: 4 },
  'Dm':    { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D#m':   { frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2], startFret: 1 },
  'Em':    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Fm':    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barreAt: 1 },
  'F#m':   { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barreAt: 2, startFret: 2 },
  'Gm':    { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barreAt: 3, startFret: 3 },
  'G#m':   { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barreAt: 4, startFret: 4 },
  'Am':    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A#m':   { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barreAt: 1, startFret: 1 },
  'Bm':    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // DOMINANT 7TH CHORDS (all 12 roots)
  // ============================================================
  'C7':    { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'C#7':   { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], barreAt: 4, startFret: 4 },
  'D7':    { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'D#7':   { frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], barreAt: 6, startFret: 6 },
  'E7':    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'F7':    { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barreAt: 1 },
  'F#7':   { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], barreAt: 2, startFret: 2 },
  'G7':    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'G#7':   { frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], barreAt: 4, startFret: 4 },
  'A7':    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'A#7':   { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], barreAt: 1, startFret: 1 },
  'B7':    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

  // ============================================================
  // MAJOR 7TH CHORDS (all 12 roots)
  // ============================================================
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'C#maj7': { frets: [-1, 4, 6, 5, 6, 4], fingers: [0, 1, 3, 2, 4, 1], barreAt: 4, startFret: 4 },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  'D#maj7': { frets: [-1, 6, 8, 7, 8, 6], fingers: [0, 1, 3, 2, 4, 1], barreAt: 6, startFret: 6 },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  'Fmaj7': { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  'F#maj7': { frets: [2, 4, 3, 3, 2, 2], fingers: [1, 4, 2, 3, 1, 1], barreAt: 2, startFret: 2 },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  'G#maj7': { frets: [4, 6, 5, 5, 4, 4], fingers: [1, 4, 2, 3, 1, 1], barreAt: 4, startFret: 4 },
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'A#maj7': { frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], barreAt: 1, startFret: 1 },
  'Bmaj7': { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // MINOR 7TH CHORDS (all 12 roots)
  // ============================================================
  'Cm7':   { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], barreAt: 3, startFret: 3 },
  'C#m7':  { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], barreAt: 4, startFret: 4 },
  'Dm7':   { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'D#m7':  { frets: [-1, 6, 8, 6, 7, 6], fingers: [0, 1, 3, 1, 2, 1], barreAt: 6, startFret: 6 },
  'Em7':   { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  'Fm7':   { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barreAt: 1 },
  'F#m7':  { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], barreAt: 2, startFret: 2 },
  'Gm7':   { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barreAt: 3, startFret: 3 },
  'G#m7':  { frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], barreAt: 4, startFret: 4 },
  'Am7':   { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'A#m7':  { frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], barreAt: 1, startFret: 1 },
  'Bm7':   { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // HALF-DIMINISHED / m7b5 CHORDS (all 12 roots)
  // Pattern A-string: x-n-(n+1)-n-(n+1)-x (root, b5, b7, b3)
  // Pattern E-string: n-x-n-n-(n-1)-n (for F and above)
  // ============================================================
  'Cm7b5':  { frets: [-1, 3, 4, 3, 4, -1], fingers: [0, 1, 2, 1, 3, 0], barreAt: 3, startFret: 3 },
  'C#m7b5': { frets: [-1, 4, 5, 4, 5, -1], fingers: [0, 1, 2, 1, 3, 0], barreAt: 4, startFret: 4 },
  'Dm7b5':  { frets: [-1, -1, 0, 1, 1, 1], fingers: [0, 0, 0, 1, 2, 3] },
  'D#m7b5': { frets: [-1, 6, 7, 6, 7, -1], fingers: [0, 1, 2, 1, 3, 0], barreAt: 6, startFret: 6 },
  'Em7b5':  { frets: [0, 1, 0, 0, 3, 0], fingers: [0, 1, 0, 0, 3, 0] },
  'Fm7b5':  { frets: [1, -1, 1, 1, 0, 1], fingers: [1, 0, 2, 3, 0, 4] },
  'F#m7b5': { frets: [2, -1, 2, 2, 1, 2], fingers: [1, 0, 2, 3, 0, 4], startFret: 1 },
  'Gm7b5':  { frets: [3, -1, 3, 3, 2, 3], fingers: [1, 0, 2, 3, 0, 4], startFret: 2 },
  'G#m7b5': { frets: [4, -1, 4, 4, 3, 4], fingers: [1, 0, 2, 3, 0, 4], startFret: 3 },
  'Am7b5':  { frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 0, 2, 0, 3, 0] },
  'A#m7b5': { frets: [-1, 1, 2, 1, 2, -1], fingers: [0, 1, 2, 1, 3, 0], barreAt: 1, startFret: 1 },
  'Bm7b5':  { frets: [-1, 2, 3, 2, 3, -1], fingers: [0, 1, 2, 1, 3, 0], barreAt: 2, startFret: 2 },

  // ============================================================
  // DIMINISHED 7TH CHORDS (all 12 roots)
  // Pattern A-string: x-n-(n+1)-(n+2)-(n+1)-(n+2)
  // Pattern E-string: n-(n+1)-(n+2)-n-(n+2)-n
  // ============================================================
  'Cdim7':  { frets: [-1, 3, 4, 5, 4, 5], fingers: [0, 1, 2, 4, 3, 4], startFret: 3 },
  'C#dim7': { frets: [-1, 4, 5, 6, 5, 6], fingers: [0, 1, 2, 4, 3, 4], startFret: 4 },
  'Ddim7':  { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 2, 0, 3] },
  'D#dim7': { frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4], startFret: 1 },
  'Edim7':  { frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },
  'Fdim7':  { frets: [1, 2, 3, 1, 3, 1], fingers: [1, 2, 3, 1, 4, 1], barreAt: 1 },
  'F#dim7': { frets: [2, 3, 4, 2, 4, 2], fingers: [1, 2, 3, 1, 4, 1], barreAt: 2, startFret: 2 },
  'Gdim7':  { frets: [3, 4, 5, 3, 5, 3], fingers: [1, 2, 3, 1, 4, 1], barreAt: 3, startFret: 3 },
  'G#dim7': { frets: [4, 5, 6, 4, 6, 4], fingers: [1, 2, 3, 1, 4, 1], barreAt: 4, startFret: 4 },
  'Adim7':  { frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  'A#dim7': { frets: [-1, 1, 2, 3, 2, 3], fingers: [0, 1, 2, 4, 3, 4], startFret: 1 },
  'Bdim7':  { frets: [-1, 2, 3, 4, 3, 4], fingers: [0, 1, 2, 4, 3, 4], startFret: 2 },

  // ============================================================
  // SUSPENDED 2ND CHORDS (all 12 roots)
  // ============================================================
  'Csus2': { frets: [-1, 3, 0, 0, 1, 3], fingers: [0, 2, 0, 0, 1, 3] },
  'C#sus2': { frets: [-1, 4, 6, 6, 4, 4], fingers: [0, 1, 3, 4, 1, 1], barreAt: 4, startFret: 4 },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'D#sus2': { frets: [-1, 6, 8, 8, 6, 6], fingers: [0, 1, 3, 4, 1, 1], barreAt: 6, startFret: 6 },
  'Esus2': { frets: [0, 2, 4, 4, 0, 0], fingers: [0, 1, 3, 4, 0, 0] },
  'Fsus2': { frets: [-1, -1, 3, 0, 1, 1], fingers: [0, 0, 3, 0, 1, 2] },
  'F#sus2': { frets: [2, 4, 4, 1, 2, 2], fingers: [2, 3, 4, 1, 1, 1], startFret: 1 },
  'Gsus2': { frets: [3, 0, 0, 0, 3, 3], fingers: [1, 0, 0, 0, 2, 3] },
  'G#sus2': { frets: [4, 6, 6, 3, 4, 4], fingers: [1, 3, 4, 1, 1, 1], startFret: 3 },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  'A#sus2': { frets: [-1, 1, 3, 3, 1, 1], fingers: [0, 1, 3, 4, 1, 1], barreAt: 1, startFret: 1 },
  'Bsus2': { frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // SUSPENDED 4TH CHORDS (all 12 roots)
  // ============================================================
  'Csus4': { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },
  'C#sus4': { frets: [-1, 4, 6, 6, 7, 4], fingers: [0, 1, 2, 3, 4, 1], barreAt: 4, startFret: 4 },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'D#sus4': { frets: [-1, 6, 8, 8, 9, 6], fingers: [0, 1, 2, 3, 4, 1], barreAt: 6, startFret: 6 },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  'Fsus4': { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], barreAt: 1 },
  'F#sus4': { frets: [2, 4, 4, 4, 2, 2], fingers: [1, 2, 3, 4, 1, 1], barreAt: 2, startFret: 2 },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
  'G#sus4': { frets: [4, 6, 6, 6, 4, 4], fingers: [1, 2, 3, 4, 1, 1], barreAt: 4, startFret: 4 },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'A#sus4': { frets: [-1, 1, 3, 3, 4, 1], fingers: [0, 1, 2, 3, 4, 1], barreAt: 1, startFret: 1 },
  'Bsus4': { frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // DIMINISHED CHORDS (all 12 roots)
  // ============================================================
  'Cdim':  { frets: [-1, 3, 4, 5, 4, -1], fingers: [0, 1, 2, 4, 3, 0], startFret: 3 },
  'C#dim': { frets: [-1, 4, 5, 6, 5, -1], fingers: [0, 1, 2, 4, 3, 0], startFret: 4 },
  'Ddim':  { frets: [-1, -1, 0, 1, 3, 1], fingers: [0, 0, 0, 1, 3, 2] },
  'D#dim': { frets: [-1, -1, 1, 2, 4, 2], fingers: [0, 0, 1, 2, 4, 3], startFret: 1 },
  'Edim':  { frets: [0, 1, 2, 0, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  'Fdim':  { frets: [-1, -1, 3, 1, 0, 1], fingers: [0, 0, 3, 1, 0, 2] },
  'F#dim': { frets: [-1, -1, 4, 2, 1, 2], fingers: [0, 0, 4, 2, 1, 3], startFret: 1 },
  'Gdim':  { frets: [3, 4, 5, 3, -1, -1], fingers: [1, 2, 3, 1, 0, 0], startFret: 3 },
  'G#dim': { frets: [-1, -1, 6, 4, 3, 4], fingers: [0, 0, 4, 2, 1, 3], startFret: 3 },
  'Adim':  { frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  'A#dim': { frets: [-1, 1, 2, 3, 2, -1], fingers: [0, 1, 2, 4, 3, 0], startFret: 1 },
  'Bdim':  { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0], startFret: 2 },

  // ============================================================
  // AUGMENTED CHORDS (all 12 roots)
  // ============================================================
  'Caug':  { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'C#aug': { frets: [-1, 4, 3, 2, 2, 1], fingers: [0, 4, 3, 1, 2, 0], startFret: 1 },
  'Daug':  { frets: [-1, -1, 0, 3, 3, 2], fingers: [0, 0, 0, 2, 3, 1] },
  'D#aug': { frets: [-1, -1, 1, 0, 0, 3], fingers: [0, 0, 1, 0, 0, 4] },
  'Eaug':  { frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'Faug':  { frets: [1, 0, 3, 2, 2, 1], fingers: [1, 0, 4, 2, 3, 1], startFret: 1 },
  'F#aug': { frets: [2, -1, -1, 3, 3, 2], fingers: [1, 0, 0, 3, 4, 2], startFret: 2 },
  'Gaug':  { frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] },
  'G#aug': { frets: [4, 3, 2, 1, 1, 0], fingers: [4, 3, 2, 1, 1, 0], startFret: 1 },
  'Aaug':  { frets: [-1, 0, 3, 2, 2, 1], fingers: [0, 0, 4, 2, 3, 1] },
  'A#aug': { frets: [-1, 1, 0, 3, 3, 2], fingers: [0, 1, 0, 3, 4, 2] },
  'Baug':  { frets: [-1, 2, 1, 0, 0, 3], fingers: [0, 2, 1, 0, 0, 4] },

  // ============================================================
  // ADD9 CHORDS (common voicings)
  // ============================================================
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  'C#add9': { frets: [-1, 4, 3, 1, 4, 1], fingers: [0, 3, 2, 1, 4, 1], startFret: 1 },
  'Dadd9': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'D#add9': { frets: [-1, 6, 5, 3, 6, 3], fingers: [0, 3, 2, 1, 4, 1], startFret: 3 },
  'Eadd9': { frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
  'Fadd9': { frets: [-1, -1, 3, 2, 1, 3], fingers: [0, 0, 2, 1, 1, 3], startFret: 1 },
  'F#add9': { frets: [-1, -1, 4, 3, 2, 4], fingers: [0, 0, 2, 1, 1, 3], startFret: 2 },
  'Gadd9': { frets: [3, 2, 0, 2, 0, 3], fingers: [3, 1, 0, 2, 0, 4] },
  'G#add9': { frets: [-1, -1, 6, 5, 4, 6], fingers: [0, 0, 2, 1, 1, 3], startFret: 4 },
  'Aadd9': { frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0] },
  'A#add9': { frets: [-1, 1, 0, 3, 1, 1], fingers: [0, 1, 0, 4, 2, 3], startFret: 1 },
  'Badd9': { frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // DOMINANT 9TH CHORDS (all 12 roots)
  // Pattern A-string: x-n-(n-1)-n-n-n
  // Pattern E-string: n-(n+2)-n-(n+1)-n-(n+2)
  // ============================================================
  'C9':    { frets: [-1, 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 3], startFret: 2 },
  'C#9':   { frets: [-1, 4, 3, 4, 4, 4], fingers: [0, 2, 1, 3, 3, 3], startFret: 3 },
  'D9':    { frets: [-1, 5, 4, 5, 5, 5], fingers: [0, 2, 1, 3, 3, 3], startFret: 4 },
  'D#9':   { frets: [-1, 6, 5, 6, 6, 6], fingers: [0, 2, 1, 3, 3, 3], startFret: 5 },
  'E9':    { frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
  'F9':    { frets: [1, 3, 1, 2, 1, 3], fingers: [1, 3, 1, 2, 1, 4], barreAt: 1 },
  'F#9':   { frets: [2, 4, 2, 3, 2, 4], fingers: [1, 3, 1, 2, 1, 4], barreAt: 2, startFret: 2 },
  'G9':    { frets: [3, 2, 0, 2, 0, 1], fingers: [4, 2, 0, 3, 0, 1] },
  'G#9':   { frets: [4, 6, 4, 5, 4, 6], fingers: [1, 3, 1, 2, 1, 4], barreAt: 4, startFret: 4 },
  'A9':    { frets: [-1, 0, 2, 4, 2, 3], fingers: [0, 0, 1, 3, 1, 2] },
  'A#9':   { frets: [-1, 1, 0, 1, 1, 1], fingers: [0, 1, 0, 2, 3, 4] },
  'B9':    { frets: [-1, 2, 1, 2, 2, 2], fingers: [0, 2, 1, 3, 3, 3], startFret: 1 },

  // ============================================================
  // MAJOR 6TH CHORDS (all 12 roots)
  // ============================================================
  'C6':    { frets: [-1, 3, 2, 2, 1, 0], fingers: [0, 4, 2, 3, 1, 0] },
  'C#6':   { frets: [-1, 4, 3, 3, 2, 1], fingers: [0, 4, 2, 3, 1, 0], startFret: 1 },
  'D6':    { frets: [-1, -1, 0, 2, 0, 2], fingers: [0, 0, 0, 2, 0, 3] },
  'D#6':   { frets: [-1, -1, 1, 3, 1, 3], fingers: [0, 0, 1, 3, 2, 4], startFret: 1 },
  'E6':    { frets: [0, 2, 2, 1, 2, 0], fingers: [0, 2, 3, 1, 4, 0] },
  'F6':    { frets: [1, 0, 0, 2, 1, 1], fingers: [1, 0, 0, 3, 2, 1] },
  'F#6':   { frets: [2, 4, 4, 3, 4, 2], fingers: [1, 2, 3, 1, 4, 1], barreAt: 2, startFret: 2 },
  'G6':    { frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, 0, 0, 0, 0] },
  'G#6':   { frets: [4, 3, 1, 1, 1, 1], fingers: [4, 3, 1, 1, 1, 1], barreAt: 1 },
  'A6':    { frets: [-1, 0, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1], barreAt: 2 },
  'A#6':   { frets: [-1, 1, 3, 3, 3, 3], fingers: [0, 1, 2, 2, 2, 2], barreAt: 3, startFret: 1 },
  'B6':    { frets: [-1, 2, 4, 4, 4, 4], fingers: [0, 1, 2, 2, 2, 2], barreAt: 4, startFret: 2 },

  // ============================================================
  // MINOR 6TH CHORDS (all 12 roots)
  // ============================================================
  'Cm6':   { frets: [-1, 3, 1, 2, 1, 3], fingers: [0, 3, 1, 2, 1, 4], startFret: 1 },
  'C#m6':  { frets: [-1, 4, 2, 3, 2, 4], fingers: [0, 3, 1, 2, 1, 4], startFret: 2 },
  'Dm6':   { frets: [-1, -1, 0, 2, 0, 1], fingers: [0, 0, 0, 2, 0, 1] },
  'D#m6':  { frets: [-1, -1, 1, 3, 1, 2], fingers: [0, 0, 1, 3, 1, 2], startFret: 1 },
  'Em6':   { frets: [0, 2, 2, 0, 2, 0], fingers: [0, 2, 3, 0, 4, 0] },
  'Fm6':   { frets: [1, -1, 0, 1, 1, 1], fingers: [1, 0, 0, 2, 3, 4] },
  'F#m6':  { frets: [2, -1, 1, 2, 2, 2], fingers: [2, 0, 1, 3, 3, 3], startFret: 1 },
  'Gm6':   { frets: [3, -1, 0, 3, 3, 0], fingers: [2, 0, 0, 3, 4, 0] },
  'G#m6':  { frets: [4, -1, 1, 4, 4, 1], fingers: [3, 0, 1, 4, 4, 1], startFret: 1 },
  'Am6':   { frets: [-1, 0, 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
  'A#m6':  { frets: [-1, 1, 3, 3, 2, 3], fingers: [0, 1, 3, 3, 2, 4], startFret: 1 },
  'Bm6':   { frets: [-1, 2, 4, 4, 3, 4], fingers: [0, 1, 3, 3, 2, 4], startFret: 2 },

  // ============================================================
  // MAJOR 9TH CHORDS (maj9 = R M3 P5 M7 M9)
  // A-string root pattern: [-1, n, n-1, n+1, n, n-3]
  // ============================================================
  'Cmaj9':  { frets: [-1, 3, 2, 4, 3, 0] },
  'C#maj9': { frets: [-1, 4, 3, 5, 4, 1], startFret: 1 },
  'Dmaj9':  { frets: [-1, 5, 4, 6, 5, 2], startFret: 2 },
  'D#maj9': { frets: [-1, 6, 5, 7, 6, 3], startFret: 3 },
  'Emaj9':  { frets: [-1, 7, 6, 8, 7, 4], startFret: 4 },
  'Fmaj9':  { frets: [-1, 8, 7, 9, 8, 5], startFret: 5 },
  'F#maj9': { frets: [-1, 9, 8, 10, 9, 6], startFret: 6 },
  'Gmaj9':  { frets: [-1, 10, 9, 11, 10, 7], startFret: 7 },
  'G#maj9': { frets: [-1, 11, 10, 12, 11, 8], startFret: 8 },
  'Amaj9':  { frets: [5, 7, 6, 4, 5, 5], startFret: 4 },

  // ============================================================
  // MINOR 9TH CHORDS (m9 = R m3 P5 m7 M9)
  // A-string root pattern: [-1, n, n-2, n, n, n]
  // ============================================================
  'Cm9':  { frets: [-1, 3, 1, 3, 3, 3], startFret: 1 },
  'C#m9': { frets: [-1, 4, 2, 4, 4, 4], startFret: 2 },
  'Dm9':  { frets: [-1, 5, 3, 5, 5, 5], startFret: 3 },
  'D#m9': { frets: [-1, 6, 4, 6, 6, 6], startFret: 4 },
  'Em9':  { frets: [-1, 7, 5, 7, 7, 7], startFret: 5 },
  'Fm9':  { frets: [-1, 8, 6, 8, 8, 8], startFret: 6 },
  'F#m9': { frets: [-1, 9, 7, 9, 9, 9], startFret: 7 },
  'Gm9':  { frets: [-1, 10, 8, 10, 10, 10], startFret: 8 },
  'G#m9': { frets: [-1, 11, 9, 11, 11, 11], startFret: 9 },
  'Am9':  { frets: [-1, 0, 2, 0, 0, 0] },
  'A#m9': { frets: [-1, 1, 3, 1, 2, 1], barreAt: 1, startFret: 1 },
  'Bm9':  { frets: [-1, 2, 0, 2, 2, 2] },

  // ============================================================
  // DOMINANT 13TH CHORDS (13 = R M3 m7 M9 M13, omit 11)
  // E-string root pattern: [n, -1, n, n+1, n+2, n+2]
  // ============================================================
  'C13':  { frets: [8, -1, 8, 9, 10, 10], startFret: 8, barreAt: 10 },
  'C#13': { frets: [9, -1, 9, 10, 11, 11], startFret: 9, barreAt: 11 },
  'D13':  { frets: [10, -1, 10, 11, 12, 12], startFret: 10, barreAt: 12 },
  'D#13': { frets: [11, -1, 11, 12, 13, 13], startFret: 11, barreAt: 13 },
  'E13':  { frets: [0, -1, 0, 1, 2, 2], barreAt: 2 },
  'F13':  { frets: [1, -1, 1, 2, 3, 3], barreAt: 3 },
  'F#13': { frets: [2, -1, 2, 3, 4, 4], startFret: 2, barreAt: 4 },
  'G13':  { frets: [3, -1, 3, 4, 5, 5], startFret: 3, barreAt: 5 },
  'G#13': { frets: [4, -1, 4, 5, 6, 6], startFret: 4, barreAt: 6 },
  'A13':  { frets: [5, -1, 5, 6, 7, 7], startFret: 5, barreAt: 7 },
  'A#13': { frets: [6, -1, 6, 7, 8, 8], startFret: 6, barreAt: 8 },
  'B13':  { frets: [7, -1, 7, 8, 9, 9], startFret: 7, barreAt: 9 },

  // ============================================================
  // MINOR 11TH CHORDS (m11 = R m3 P5 m7 M9 P11)
  // A-string root pattern: [-1, n, n-2, n, n, n-2]
  // ============================================================
  'Cm11':  { frets: [-1, 3, 1, 3, 3, 1], startFret: 1 },
  'C#m11': { frets: [-1, 4, 2, 4, 4, 2], startFret: 2 },
  'Dm11':  { frets: [-1, 5, 3, 5, 5, 3], startFret: 3 },
  'D#m11': { frets: [-1, 6, 4, 6, 6, 4], startFret: 4 },
  'Em11':  { frets: [-1, 7, 5, 7, 7, 5], startFret: 5 },
  'Fm11':  { frets: [-1, 8, 6, 8, 8, 6], startFret: 6 },
  'F#m11': { frets: [-1, 9, 7, 9, 9, 7], startFret: 7 },
  'Gm11':  { frets: [-1, 10, 8, 10, 10, 8], startFret: 8 },
  'G#m11': { frets: [-1, 11, 9, 11, 11, 9], startFret: 9 },
  'Am11':  { frets: [-1, 0, 2, 0, 1, 3] },
  'A#m11': { frets: [-1, 1, 3, 1, 1, 3], barreAt: 1, startFret: 1 },
  'Bm11':  { frets: [-1, 2, 0, 2, 2, 0] },

  // ============================================================
  // DOMINANT 7b9 CHORDS (7b9 = R M3 P5 m7 b9)
  // A-string root pattern: [-1, n, n-1, n, n-1, n-3]
  // ============================================================
  'C7b9':  { frets: [-1, 3, 2, 3, 2, 0] },
  'C#7b9': { frets: [-1, 4, 3, 4, 3, 1], startFret: 1 },
  'D7b9':  { frets: [-1, 5, 4, 5, 4, 2], startFret: 2 },
  'D#7b9': { frets: [-1, 6, 5, 6, 5, 3], startFret: 3 },
  'E7b9':  { frets: [-1, 7, 6, 7, 6, 4], startFret: 4 },
  'F7b9':  { frets: [-1, 8, 7, 8, 7, 5], startFret: 5 },
  'F#7b9': { frets: [-1, 9, 8, 9, 8, 6], startFret: 6 },
  'G7b9':  { frets: [-1, 10, 9, 10, 9, 7], startFret: 7 },
  'G#7b9': { frets: [-1, 11, 10, 11, 10, 8], startFret: 8 },
  'A7b9':  { frets: [-1, 12, 11, 12, 11, 9], startFret: 9 },

  // ============================================================
  // DOMINANT 7#9 CHORDS (7#9 = R M3 P5 m7 #9, "Hendrix chord")
  // A-string root pattern: [-1, n, n-1, n, n+1, n]
  // ============================================================
  'C7#9':  { frets: [-1, 3, 2, 3, 4, 3], startFret: 2 },
  'C#7#9': { frets: [-1, 4, 3, 4, 5, 4], startFret: 3 },
  'D7#9':  { frets: [-1, 5, 4, 5, 6, 5], startFret: 4 },
  'D#7#9': { frets: [-1, 6, 5, 6, 7, 6], startFret: 5 },
  'E7#9':  { frets: [-1, 7, 6, 7, 8, 7], startFret: 6 },
  'F7#9':  { frets: [-1, 8, 7, 8, 9, 8], startFret: 7 },
  'F#7#9': { frets: [-1, 9, 8, 9, 10, 9], startFret: 8 },
  'G7#9':  { frets: [-1, 10, 9, 10, 11, 10], startFret: 9 },
  'G#7#9': { frets: [-1, 11, 10, 11, 12, 11], startFret: 10 },
  'A7#9':  { frets: [-1, 12, 11, 12, 13, 12], startFret: 11 },
  'A#7#9': { frets: [-1, 1, 0, 1, 2, 1] },
  'B7#9':  { frets: [-1, 2, 1, 2, 3, 2], startFret: 1 },
};

// ============================================================
// SLASH CHORD FINGERINGS (inversions & pedal bass)
// Fret array: [6th(E), 5th(A), 4th(D), 3rd(G), 2nd(B), 1st(E)]
// ============================================================
export const SLASH_CHORD_SHAPES: Record<string, GuitarFingering> = {
  // C inversions
  'C/E':    { frets: [0, 3, 2, 0, 1, 0],    fingers: [0, 3, 2, 0, 1, 0] },          // E-C-E-G-C-E
  'C/G':    { frets: [3, 3, 2, 0, 1, 0],    fingers: [3, 3, 2, 0, 1, 0] },          // G-C-E-G-C-E

  // G inversions & passing bass
  'G/B':    { frets: [-1, 2, 0, 0, 0, 3],   fingers: [0, 1, 0, 0, 0, 3] },          // x-B-D-G-B-G
  'G/F#':   { frets: [2, 2, 0, 0, 0, 3],    fingers: [2, 1, 0, 0, 0, 4] },          // F#-B-D-G-B-G

  // Am inversions
  'Am/C':   { frets: [-1, 3, 2, 2, 1, 0],   fingers: [0, 3, 2, 3, 1, 0] },          // x-C-E-A-C-E
  'Am/E':   { frets: [0, 0, 2, 2, 1, 0],    fingers: [0, 0, 2, 3, 1, 0] },          // E-A-E-A-C-E
  'Am/G':   { frets: [3, 0, 2, 2, 1, 0],    fingers: [3, 0, 2, 3, 1, 0] },          // G-A-E-A-C-E (Am7 voicing)

  // D inversions
  'D/F#':   { frets: [2, 0, 0, 2, 3, 2],    fingers: [2, 0, 0, 1, 3, 2] },          // F#-A-D-A-D-F#

  // F inversions
  'F/A':    { frets: [-1, 0, 3, 2, 1, 1],   fingers: [0, 0, 4, 3, 2, 1] },          // x-A-F-A-C-F
  'F/C':    { frets: [-1, 3, 3, 2, 1, 1],   fingers: [0, 3, 4, 2, 1, 1] },          // x-C-F-A-C-F

  // Em inversions
  'Em/B':   { frets: [-1, 2, 2, 0, 0, 0],   fingers: [0, 1, 2, 0, 0, 0] },          // x-B-E-G-B-E

  // Dm inversions
  'Dm/F':   { frets: [1, 0, 0, 2, 3, 1],    fingers: [1, 0, 0, 2, 3, 1] },          // F-A-D-A-D-F
  'Dm/A':   { frets: [-1, 0, 0, 2, 3, 1],   fingers: [0, 0, 0, 2, 3, 1] },          // x-A-D-A-D-F

  // E inversions
  'E/G#':   { frets: [4, -1, 2, 1, 0, 0],   fingers: [4, 0, 2, 1, 0, 0], startFret: 1 }, // G#-x-E-G#-B-E

  // Other common passing/pedal bass chords
  'D/A':    { frets: [-1, 0, 0, 2, 3, 2],   fingers: [0, 0, 0, 1, 3, 2] },          // x-A-D-A-D-F# (D over open A)
  'A/C#':   { frets: [-1, 4, 2, 2, 2, 0],   fingers: [0, 4, 1, 1, 1, 0], startFret: 2 }, // x-C#-A-E-A-E
  'A/E':    { frets: [0, 0, 2, 2, 2, 0],    fingers: [0, 0, 1, 2, 3, 0] },          // E-A-E-A-C#-E
  'E/B':    { frets: [-1, 2, 2, 1, 0, 0],   fingers: [0, 2, 3, 1, 0, 0] },          // x-B-E-G#-B-E
  'Bm/D':   { frets: [-1, -1, 0, 4, 3, 2],  fingers: [0, 0, 0, 4, 3, 2], startFret: 2 }, // x-x-D-F#-A-F#
  'G/D':    { frets: [-1, -1, 0, 0, 0, 3],  fingers: [0, 0, 0, 0, 0, 3] },          // x-x-D-G-B-G
  'C/B':    { frets: [-1, 2, 2, 0, 1, 0],   fingers: [0, 2, 3, 0, 1, 0] },          // x-B-E-G-C-E (Cmaj7-ish)
};

// ============================================================
// ALTERNATIVE VOICINGS (barre positions, inversions)
// ============================================================
const ALTERNATIVE_VOICINGS: Record<string, GuitarFingering[]> = {
  // --- Major alternatives ---
  'C':  [
    { frets: [-1, 3, 5, 5, 5, 3], barreAt: 3, startFret: 3 },   // A-shape barre
    { frets: [8, 10, 10, 9, 8, 8], barreAt: 8, startFret: 8 },   // E-shape barre
  ],
  'D':  [
    { frets: [-1, 5, 7, 7, 7, 5], barreAt: 5, startFret: 5 },   // A-shape barre
  ],
  'E':  [
    { frets: [-1, 7, 9, 9, 9, 7], barreAt: 7, startFret: 7 },   // A-shape barre
  ],
  'F':  [
    { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] }, // simplified (no barre)
    { frets: [-1, 8, 10, 10, 10, 8], barreAt: 8, startFret: 8 },  // A-shape barre
  ],
  'G':  [
    { frets: [3, 5, 5, 4, 3, 3], barreAt: 3, startFret: 3 },    // E-shape barre
  ],
  'A':  [
    { frets: [5, 7, 7, 6, 5, 5], barreAt: 5, startFret: 5 },    // E-shape barre
  ],
  'B':  [
    { frets: [7, 9, 9, 8, 7, 7], barreAt: 7, startFret: 7 },    // E-shape barre
  ],

  // --- Minor alternatives ---
  'Cm':  [
    { frets: [8, 10, 10, 8, 8, 8], barreAt: 8, startFret: 8 },  // Em-shape barre
  ],
  'Dm':  [
    { frets: [-1, 5, 7, 7, 6, 5], barreAt: 5, startFret: 5 },   // Am-shape barre
  ],
  'Em':  [
    { frets: [-1, 7, 9, 9, 8, 7], barreAt: 7, startFret: 7 },   // Am-shape barre
  ],
  'Fm':  [
    { frets: [-1, 8, 10, 10, 9, 8], barreAt: 8, startFret: 8 }, // Am-shape barre
  ],
  'Gm':  [
    { frets: [-1, 10, 12, 12, 11, 10], barreAt: 10, startFret: 10 }, // Am-shape barre
  ],
  'Am':  [
    { frets: [5, 7, 7, 5, 5, 5], barreAt: 5, startFret: 5 },    // Em-shape barre
  ],
  'Bm':  [
    { frets: [7, 9, 9, 7, 7, 7], barreAt: 7, startFret: 7 },    // Em-shape barre
  ],

  // --- 7th alternatives ---
  'C7':  [
    { frets: [-1, 3, 5, 3, 5, 3], barreAt: 3, startFret: 3 },   // A7-shape barre
  ],
  'D7':  [
    { frets: [-1, 5, 7, 5, 7, 5], barreAt: 5, startFret: 5 },   // A7-shape barre
  ],
  'E7':  [
    { frets: [0, 2, 2, 1, 3, 0], fingers: [0, 1, 2, 1, 3, 0] }, // open variant
  ],
  'G7':  [
    { frets: [3, 5, 3, 4, 3, 3], barreAt: 3, startFret: 3 },    // E7-shape barre
  ],
  'A7':  [
    { frets: [5, 7, 5, 6, 5, 5], barreAt: 5, startFret: 5 },    // E7-shape barre
  ],

  // --- maj7 alternatives ---
  'Cmaj7': [
    { frets: [-1, 3, 5, 4, 5, 3], barreAt: 3, startFret: 3 },
  ],
  'Gmaj7': [
    { frets: [3, 5, 4, 4, 3, 3], barreAt: 3, startFret: 3 },
  ],
  'Amaj7': [
    { frets: [5, 7, 6, 6, 5, 5], barreAt: 5, startFret: 5 },
  ],

  // --- m7 alternatives ---
  'Am7':  [
    { frets: [5, 7, 5, 5, 5, 5], barreAt: 5, startFret: 5 },    // Em7-shape barre
  ],
  'Dm7':  [
    { frets: [-1, 5, 7, 5, 6, 5], barreAt: 5, startFret: 5 },   // Am7-shape barre
  ],
  'Em7':  [
    { frets: [-1, 7, 9, 7, 8, 7], barreAt: 7, startFret: 7 },
  ],
};

export function getChordShapeKey(root: string, type: string): string {
  const suffix = type === 'major' ? '' : CHORD_TYPES[type]?.symbol || type;
  return root + suffix;
}

export function getGuitarFingering(root: string, type: string): GuitarFingering | null {
  const key = getChordShapeKey(root, type);
  return GUITAR_CHORD_SHAPES[key] || null;
}

/** Returns all available voicings for a chord (primary + alternatives).
 *  If bassNote is provided, the matching slash voicing is prepended. */
export function getGuitarFingerings(root: string, type: string, bassNote?: string): GuitarFingering[] {
  const key = getChordShapeKey(root, type);
  const primary = GUITAR_CHORD_SHAPES[key];
  const alts = ALTERNATIVE_VOICINGS[key] || [];
  const all: GuitarFingering[] = primary ? [primary, ...alts] : [];

  if (bassNote) {
    const slashKey = `${key}/${bassNote}`;
    const slashFingering = SLASH_CHORD_SHAPES[slashKey];
    if (slashFingering) {
      // Slash voicing first, then standard voicings
      return [slashFingering, ...all];
    }
  }

  return all;
}
