import { NOTES } from './notes';

export interface ChordType {
  name: string;
  nameEn: string;
  symbol: string;
  intervals: number[];
  description: string;
  descriptionEn: string;
}

export const CHORD_TYPES: Record<string, ChordType> = {
  major: { name: '大三和弦', nameEn: 'Major Triad', symbol: '', intervals: [0, 4, 7], description: '明亮、稳定', descriptionEn: 'Bright, stable' },
  minor: { name: '小三和弦', nameEn: 'Minor Triad', symbol: 'm', intervals: [0, 3, 7], description: '柔和、忧郁', descriptionEn: 'Soft, melancholic' },
  '7': { name: '属七和弦', nameEn: 'Dominant 7th', symbol: '7', intervals: [0, 4, 7, 10], description: '有张力、需要解决', descriptionEn: 'Tension, needs resolution' },
  maj7: { name: '大七和弦', nameEn: 'Major 7th', symbol: 'maj7', intervals: [0, 4, 7, 11], description: '梦幻、优雅', descriptionEn: 'Dreamy, elegant' },
  m7: { name: '小七和弦', nameEn: 'Minor 7th', symbol: 'm7', intervals: [0, 3, 7, 10], description: '温暖、爵士感', descriptionEn: 'Warm, jazzy' },
  dim: { name: '减三和弦', nameEn: 'Diminished', symbol: 'dim', intervals: [0, 3, 6], description: '紧张、不稳定', descriptionEn: 'Tense, unstable' },
  dim7: { name: '减七和弦', nameEn: 'Diminished 7th', symbol: 'dim7', intervals: [0, 3, 6, 9], description: '极度紧张', descriptionEn: 'Extremely tense' },
  aug: { name: '增三和弦', nameEn: 'Augmented', symbol: 'aug', intervals: [0, 4, 8], description: '飘忽、神秘', descriptionEn: 'Ethereal, mysterious' },
  sus2: { name: '挂二和弦', nameEn: 'Suspended 2nd', symbol: 'sus2', intervals: [0, 2, 7], description: '开放、现代', descriptionEn: 'Open, modern' },
  sus4: { name: '挂四和弦', nameEn: 'Suspended 4th', symbol: 'sus4', intervals: [0, 5, 7], description: '悬浮、待解决', descriptionEn: 'Suspended, unresolved' },
  add9: { name: '加九和弦', nameEn: 'Add 9', symbol: 'add9', intervals: [0, 4, 7, 14], description: '丰富、明亮', descriptionEn: 'Rich, bright' },
  m7b5: { name: '半减七和弦', nameEn: 'Half-Diminished 7th', symbol: 'm7b5', intervals: [0, 3, 6, 10], description: '半减、过渡性', descriptionEn: 'Half-diminished, transitional' },
  '9': { name: '属九和弦', nameEn: 'Dominant 9th', symbol: '9', intervals: [0, 4, 7, 10, 14], description: '丰满、蓝调', descriptionEn: 'Full, bluesy' },
  '6': { name: '大六和弦', nameEn: 'Major 6th', symbol: '6', intervals: [0, 4, 7, 9], description: '温暖、复古', descriptionEn: 'Warm, vintage' },
  m6: { name: '小六和弦', nameEn: 'Minor 6th', symbol: 'm6', intervals: [0, 3, 7, 9], description: '忧郁中带温暖', descriptionEn: 'Melancholic yet warm' },
  maj9:  { name: '大九和弦', nameEn: 'Major 9th', symbol: 'maj9', intervals: [0, 4, 7, 11, 14], description: '梦幻、层次丰富', descriptionEn: 'Dreamy, layered' },
  m9:    { name: '小九和弦', nameEn: 'Minor 9th', symbol: 'm9', intervals: [0, 3, 7, 10, 14], description: '柔美、爵士感', descriptionEn: 'Gentle, jazzy' },
  '13':  { name: '属十三和弦', nameEn: 'Dominant 13th', symbol: '13', intervals: [0, 4, 7, 10, 14, 17, 21], description: '丰满、蓝调爵士', descriptionEn: 'Full, blues-jazz' },
  m11:   { name: '小十一和弦', nameEn: 'Minor 11th', symbol: 'm11', intervals: [0, 3, 7, 10, 14, 17], description: '温暖、神秘', descriptionEn: 'Warm, mysterious' },
  '7b9': { name: '属七降九和弦', nameEn: 'Dominant 7b9', symbol: '7b9', intervals: [0, 4, 7, 10, 13], description: '紧张、蓝调', descriptionEn: 'Tense, bluesy' },
  '7#9': { name: '属七升九和弦', nameEn: 'Dominant 7#9', symbol: '7#9', intervals: [0, 4, 7, 10, 15], description: '强烈、布鲁斯摇滚', descriptionEn: 'Intense, blues-rock' },
  maj13: { name: '大十三和弦', nameEn: 'Major 13th', symbol: 'maj13', intervals: [0, 4, 7, 11, 14, 21], description: '华丽、爵士流行', descriptionEn: 'Lush, jazz-pop' },
  // Suspended 7th chords
  '7sus4': { name: '属七挂四和弦', nameEn: 'Dominant 7sus4', symbol: '7sus4', intervals: [0, 5, 7, 10], description: '悬浮、蓝调', descriptionEn: 'Suspended, bluesy' },
  '7sus2': { name: '属七挂二和弦', nameEn: 'Dominant 7sus2', symbol: '7sus2', intervals: [0, 2, 7, 10], description: '开放、现代', descriptionEn: 'Open, modern' },
  '9sus4': { name: '属九挂四和弦', nameEn: 'Dominant 9sus4', symbol: '9sus4', intervals: [0, 5, 7, 10, 14], description: '丰满、悬浮', descriptionEn: 'Full, suspended' },
  // 11th chord
  '11':  { name: '属十一和弦', nameEn: 'Dominant 11th', symbol: '11', intervals: [0, 4, 7, 10, 14, 17], description: '丰满、放克', descriptionEn: 'Full, funky' },
  // Minor-major 7th
  mmaj7: { name: '小大七和弦', nameEn: 'Minor-Major 7th', symbol: 'm(maj7)', intervals: [0, 3, 7, 11], description: '紧张、神秘', descriptionEn: 'Tense, mysterious' },
  // Altered dominant chords
  '7b5': { name: '属七降五和弦', nameEn: 'Dominant 7b5', symbol: '7b5', intervals: [0, 4, 6, 10], description: '不稳定、爵士', descriptionEn: 'Unstable, jazzy' },
  '7#5': { name: '属七升五和弦', nameEn: 'Dominant 7#5', symbol: '7#5', intervals: [0, 4, 8, 10], description: '紧张、增色彩', descriptionEn: 'Tense, augmented color' },
  // Power chord
  '5':   { name: '强力和弦', nameEn: 'Power Chord', symbol: '5', intervals: [0, 7], description: '有力、摇滚', descriptionEn: 'Powerful, rock' },
  // Add chords
  madd9: { name: '小加九和弦', nameEn: 'Minor Add 9', symbol: 'madd9', intervals: [0, 3, 7, 14], description: '忧郁、层次感', descriptionEn: 'Melancholic, layered' },
  // 6/9 chords
  '6/9': { name: '六九和弦', nameEn: 'Major 6/9', symbol: '6/9', intervals: [0, 4, 7, 9, 14], description: '明亮、爵士', descriptionEn: 'Bright, jazzy' },
  // Augmented 7th
  aug7:  { name: '增七和弦', nameEn: 'Augmented 7th', symbol: 'aug7', intervals: [0, 4, 8, 10], description: '紧张、增色彩', descriptionEn: 'Tense, augmented color' },
  // Major 11th
  maj11: { name: '大十一和弦', nameEn: 'Major 11th', symbol: 'maj11', intervals: [0, 4, 7, 11, 14, 17], description: '梦幻、层次丰富', descriptionEn: 'Dreamy, layered' },
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
  // Primary: "box" voicing x-A(n)-D(n+1)-G(n-1)-B(n+1)-x
  // Mutes both E strings — the most widely used guitar voicing
  // Fingers: index on G, middle on A, ring on D, pinky on B
  // ============================================================
  'Cdim7':  { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 2 },
  'C#dim7': { frets: [-1, 4, 5, 3, 5, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 3 },
  'Ddim7':  { frets: [-1, 5, 6, 4, 6, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 4 },
  'D#dim7': { frets: [-1, 6, 7, 5, 7, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 5 },
  'Edim7':  { frets: [-1, 7, 8, 6, 8, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 6 },
  'Fdim7':  { frets: [-1, 8, 9, 7, 9, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 7 },
  'F#dim7': { frets: [-1, 9, 10, 8, 10, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 8 },
  // G, G#, A dim7: use lower-position inversion (dim7 is fully symmetric every 3 frets)
  'Gdim7':  { frets: [-1, 1, 2, 0, 2, -1], fingers: [0, 1, 2, 0, 3, 0] },             // Bb bass, open G
  'G#dim7': { frets: [-1, 2, 3, 1, 3, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 1 }, // B bass
  'Adim7':  { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 2 }, // C bass
  'A#dim7': { frets: [-1, 1, 2, 0, 2, -1], fingers: [0, 1, 2, 0, 3, 0] },             // open G string
  'Bdim7':  { frets: [-1, 2, 3, 1, 3, -1], fingers: [0, 2, 3, 1, 4, 0], startFret: 1 },

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
  'A#maj9': { frets: [-1, 1, 0, 2, 1, 1], startFret: 1 },
  'Bmaj9':  { frets: [-1, 2, 1, 3, 2, 2], barreAt: 2, startFret: 1 },

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
  'Am11':  { frets: [-1, 0, 0, 0, 1, 0] },
  'A#m11': { frets: [-1, 1, 3, 1, 1, 3], barreAt: 1, startFret: 1 },
  'Bm11':  { frets: [-1, 2, 2, 2, 3, 2], barreAt: 2, startFret: 2 },

  // ============================================================
  // MAJOR 13TH CHORDS (maj13 = R M3 P5 M7 M9 M13)
  // A-string root pattern: [-1, n, n-1, n+1, n+1, n+2]
  // ============================================================
  'Cmaj13':  { frets: [-1, 3, 2, 4, 4, 5], startFret: 2 },
  'C#maj13': { frets: [-1, 4, 3, 5, 5, 6], startFret: 3 },
  'Dmaj13':  { frets: [-1, 5, 4, 6, 6, 7], startFret: 4 },
  'D#maj13': { frets: [-1, 6, 5, 7, 7, 8], startFret: 5 },
  'Emaj13':  { frets: [-1, 7, 6, 8, 8, 9], startFret: 6 },
  'Fmaj13':  { frets: [-1, 8, 7, 9, 9, 10], startFret: 7 },
  'F#maj13': { frets: [-1, 9, 8, 10, 10, 11], startFret: 8 },
  'Gmaj13':  { frets: [-1, 10, 9, 11, 11, 12], startFret: 9 },
  'G#maj13': { frets: [-1, 11, 10, 12, 12, 13], startFret: 10 },
  'Amaj13':  { frets: [-1, 0, 2, 1, 2, 2] },
  'A#maj13': { frets: [-1, 1, 0, 2, 2, 3], startFret: 0 },
  'Bmaj13':  { frets: [-1, 2, 1, 3, 3, 4], startFret: 1 },

  // ============================================================
  // DOMINANT 7b9 CHORDS (7b9 = R M3 P5 m7 b9)
  // A-string root pattern: [-1, n, n-1, n, n-1, n-3]
  // ============================================================
  'C7b9':  { frets: [-1, 3, 2, 3, 2, 0] },
  'C#7b9': { frets: [-1, 4, 3, 4, 3, 1], startFret: 1 },
  'D7b9':  { frets: [-1, 5, 4, 5, 4, 2], startFret: 2 },
  'D#7b9': { frets: [-1, 6, 5, 6, 5, 3], startFret: 3 },
  'E7b9':  { frets: [0, 2, 0, 1, 0, 1], fingers: [0, 2, 0, 1, 0, 1] },
  'F7b9':  { frets: [-1, 8, 7, 8, 7, 5], startFret: 5 },
  'F#7b9': { frets: [-1, 9, 8, 9, 8, 6], startFret: 6 },
  'G7b9':  { frets: [-1, 10, 9, 10, 9, 7], startFret: 7 },
  'G#7b9': { frets: [-1, 11, 10, 11, 10, 8], startFret: 8 },
  'A7b9':  { frets: [-1, 0, 2, 3, 2, 3] },

  // ============================================================
  // DOMINANT 7#9 CHORDS (7#9 = R M3 P5 m7 #9, "Hendrix chord")
  // A-string root pattern: [-1, n, n-1, n, n+1, n]
  // ============================================================
  'C7#9':  { frets: [-1, 3, 2, 3, 4, 3], startFret: 2 },
  'C#7#9': { frets: [-1, 4, 3, 4, 5, 4], startFret: 3 },
  'D7#9':  { frets: [-1, 5, 4, 5, 6, 5], startFret: 4 },
  'D#7#9': { frets: [-1, 6, 5, 6, 7, 6], startFret: 5 },
  'E7#9':  { frets: [0, 7, 6, 7, 8, 0], startFret: 6 },
  'F7#9':  { frets: [-1, 8, 7, 8, 9, 8], startFret: 7 },
  'F#7#9': { frets: [-1, 9, 8, 9, 10, 9], startFret: 8 },
  'G7#9':  { frets: [-1, 10, 9, 10, 11, 10], startFret: 9 },
  'G#7#9': { frets: [-1, 11, 10, 11, 12, 11], startFret: 10 },
  'A7#9':  { frets: [5, 7, 5, 6, 8, 5], barreAt: 5, startFret: 5 },
  'A#7#9': { frets: [-1, 1, 0, 1, 2, 1] },
  'B7#9':  { frets: [-1, 2, 1, 2, 3, 2], startFret: 1 },

  // ============================================================
  // 7sus4 CHORDS (R P4 P5 m7)
  // ============================================================
  'C7sus4':  { frets: [-1, 3, 3, 3, 1, 1], fingers: [0, 2, 3, 4, 1, 1], startFret: 1 },
  'C#7sus4': { frets: [-1, 4, 4, 4, 2, 2], fingers: [0, 2, 3, 4, 1, 1], startFret: 2 },
  'D7sus4':  { frets: [-1, -1, 0, 2, 1, 3], fingers: [0, 0, 0, 2, 1, 3] },
  'D#7sus4': { frets: [-1, 6, 6, 6, 4, 4], fingers: [0, 2, 3, 4, 1, 1], startFret: 4 },
  'E7sus4':  { frets: [0, 2, 0, 2, 0, 0], fingers: [0, 2, 0, 3, 0, 0] },
  'F7sus4':  { frets: [1, 3, 1, 3, 1, 1], fingers: [1, 3, 1, 4, 1, 1], barreAt: 1 },
  'F#7sus4': { frets: [2, 4, 2, 4, 2, 2], fingers: [1, 3, 1, 4, 1, 1], barreAt: 2, startFret: 2 },
  'G7sus4':  { frets: [3, 3, 0, 0, 1, 1], fingers: [2, 3, 0, 0, 1, 1] },
  'G#7sus4': { frets: [4, 6, 4, 6, 4, 4], fingers: [1, 3, 1, 4, 1, 1], barreAt: 4, startFret: 4 },
  'A7sus4':  { frets: [-1, 0, 2, 0, 3, 0], fingers: [0, 0, 1, 0, 3, 0] },
  'A#7sus4': { frets: [-1, 1, 3, 1, 4, 1], fingers: [0, 1, 3, 1, 4, 1], barreAt: 1, startFret: 1 },
  'B7sus4':  { frets: [-1, 2, 4, 2, 5, 2], fingers: [0, 1, 3, 1, 4, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // 7sus2 CHORDS (R M2 P5 m7)
  // ============================================================
  'C7sus2':  { frets: [-1, 3, 3, 3, 3, 3], barreAt: 3, startFret: 3 },
  'C#7sus2': { frets: [-1, 4, 4, 4, 4, 4], barreAt: 4, startFret: 4 },
  'D7sus2':  { frets: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] },
  'D#7sus2': { frets: [-1, 6, 6, 6, 6, 6], barreAt: 6, startFret: 6 },
  'E7sus2':  { frets: [0, 2, 0, 4, 0, 0], fingers: [0, 1, 0, 4, 0, 0] },
  'F7sus2':  { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barreAt: 1 },
  'F#7sus2': { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], barreAt: 2, startFret: 2 },
  'G7sus2':  { frets: [3, 0, 0, 0, 0, 1], fingers: [3, 0, 0, 0, 0, 1] },
  'G#7sus2': { frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], barreAt: 4, startFret: 4 },
  'A7sus2':  { frets: [-1, 0, 2, 0, 0, 0], fingers: [0, 0, 2, 0, 0, 0] },
  'A#7sus2': { frets: [-1, 1, 3, 1, 1, 1], fingers: [0, 1, 3, 1, 1, 1], barreAt: 1, startFret: 1 },
  'B7sus2':  { frets: [-1, 2, 4, 2, 2, 2], fingers: [0, 1, 3, 1, 1, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // POWER CHORDS (5 = R P5)
  // ============================================================
  'C5':  { frets: [-1, 3, 5, -1, -1, -1], fingers: [0, 1, 3, 0, 0, 0], startFret: 3 },
  'C#5': { frets: [-1, 4, 6, -1, -1, -1], fingers: [0, 1, 3, 0, 0, 0], startFret: 4 },
  'D5':  { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 3, 0] },
  'D#5': { frets: [-1, 6, 8, -1, -1, -1], fingers: [0, 1, 3, 0, 0, 0], startFret: 6 },
  'E5':  { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  'F5':  { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  'F#5': { frets: [2, 4, 4, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], startFret: 2 },
  'G5':  { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], startFret: 3 },
  'G#5': { frets: [4, 6, 6, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], startFret: 4 },
  'A5':  { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  'A#5': { frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], startFret: 1 },
  'B5':  { frets: [-1, 2, 4, 4, -1, -1], fingers: [0, 1, 3, 4, 0, 0], startFret: 2 },

  // ============================================================
  // MINOR-MAJOR 7TH CHORDS (mmaj7 = R m3 P5 M7)
  // ============================================================
  'Cm(maj7)':  { frets: [-1, 3, 5, 4, 4, 3], fingers: [0, 1, 4, 2, 3, 1], barreAt: 3, startFret: 3 },
  'C#m(maj7)': { frets: [-1, 4, 6, 5, 5, 4], fingers: [0, 1, 4, 2, 3, 1], barreAt: 4, startFret: 4 },
  'Dm(maj7)':  { frets: [-1, -1, 0, 2, 2, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D#m(maj7)': { frets: [-1, 6, 8, 7, 7, 6], fingers: [0, 1, 4, 2, 3, 1], barreAt: 6, startFret: 6 },
  'Em(maj7)':  { frets: [0, 2, 1, 0, 0, 0], fingers: [0, 2, 1, 0, 0, 0] },
  'Fm(maj7)':  { frets: [1, 3, 2, 1, 1, 1], fingers: [1, 4, 2, 1, 1, 1], barreAt: 1 },
  'F#m(maj7)': { frets: [2, 4, 3, 2, 2, 2], fingers: [1, 4, 2, 1, 1, 1], barreAt: 2, startFret: 2 },
  'Gm(maj7)':  { frets: [3, 5, 4, 3, 3, 3], fingers: [1, 4, 2, 1, 1, 1], barreAt: 3, startFret: 3 },
  'G#m(maj7)': { frets: [4, 6, 5, 4, 4, 4], fingers: [1, 4, 2, 1, 1, 1], barreAt: 4, startFret: 4 },
  'Am(maj7)':  { frets: [-1, 0, 2, 1, 1, 0], fingers: [0, 0, 3, 1, 2, 0] },
  'A#m(maj7)': { frets: [-1, 1, 3, 2, 2, 1], fingers: [0, 1, 4, 2, 3, 1], barreAt: 1, startFret: 1 },
  'Bm(maj7)':  { frets: [-1, 2, 4, 3, 3, 2], fingers: [0, 1, 4, 2, 3, 1], barreAt: 2, startFret: 2 },

  // ============================================================
  // DOMINANT 7b5 CHORDS (R M3 b5 m7)
  // ============================================================
  'C7b5':  { frets: [-1, 3, 4, 3, 5, -1], startFret: 3 },
  'C#7b5': { frets: [-1, 4, 5, 4, 6, -1], startFret: 4 },
  'D7b5':  { frets: [-1, -1, 0, 1, 1, 2], fingers: [0, 0, 0, 1, 1, 2] },
  'D#7b5': { frets: [-1, 6, 7, 6, 8, -1], startFret: 6 },
  'E7b5':  { frets: [0, 1, 0, 1, 0, -1], fingers: [0, 1, 0, 2, 0, 0] },
  'F7b5':  { frets: [1, -1, 1, 2, 0, -1] },
  'F#7b5': { frets: [2, -1, 2, 3, 1, -1], startFret: 1 },
  'G7b5':  { frets: [3, -1, 3, 4, 2, -1], startFret: 2 },
  'G#7b5': { frets: [4, -1, 4, 5, 3, -1], startFret: 3 },
  'A7b5':  { frets: [-1, 0, 1, 0, 2, -1], fingers: [0, 0, 1, 0, 3, 0] },
  'A#7b5': { frets: [-1, 1, 2, 1, 3, -1], barreAt: 1, startFret: 1 },
  'B7b5':  { frets: [-1, 2, 1, 2, 0, -1] },

  // ============================================================
  // DOMINANT 7#5 CHORDS (R M3 #5 m7)
  // ============================================================
  'C7#5':  { frets: [-1, 3, 2, 3, 1, -1] },
  'C#7#5': { frets: [-1, 4, 3, 4, 2, -1], startFret: 2 },
  'D7#5':  { frets: [-1, -1, 0, 3, 1, 2] },
  'D#7#5': { frets: [-1, 6, 5, 6, 4, -1], startFret: 4 },
  'E7#5':  { frets: [0, 3, 0, 1, 1, 0] },
  'F7#5':  { frets: [1, 0, 1, 2, 2, 1], barreAt: 1 },
  'F#7#5': { frets: [2, 1, 2, 3, 3, 2], barreAt: 2, startFret: 1 },
  'G7#5':  { frets: [3, 2, 3, 4, 4, 3], barreAt: 3, startFret: 2 },
  'G#7#5': { frets: [4, 3, 4, 5, 5, 4], barreAt: 4, startFret: 3 },
  'A7#5':  { frets: [-1, 0, 3, 0, 2, 1] },
  'A#7#5': { frets: [-1, 1, 0, 1, 3, 2], startFret: 1 },
  'B7#5':  { frets: [-1, 2, 1, 2, 0, 3] },

  // ============================================================
  // 9sus4 CHORDS (R P4 P5 m7 M9)
  // ============================================================
  'C9sus4':  { frets: [-1, 3, 3, 3, 3, 3], barreAt: 3, startFret: 3 },
  'C#9sus4': { frets: [-1, 4, 4, 4, 4, 4], barreAt: 4, startFret: 4 },
  'D9sus4':  { frets: [-1, -1, 0, 2, 1, 0] },
  'D#9sus4': { frets: [-1, 6, 6, 6, 6, 6], barreAt: 6, startFret: 6 },
  'E9sus4':  { frets: [0, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  'F9sus4':  { frets: [1, 1, 1, 1, 1, 1], barreAt: 1 },
  'F#9sus4': { frets: [2, 2, 2, 2, 2, 2], barreAt: 2, startFret: 2 },
  'G9sus4':  { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
  'G#9sus4': { frets: [-1, 11, 11, 11, 11, 11], barreAt: 11, startFret: 11 },
  'A9sus4':  { frets: [-1, 0, 2, 0, 0, 0], fingers: [0, 0, 2, 0, 0, 0] },
  'A#9sus4': { frets: [-1, 1, 1, 1, 1, 1], barreAt: 1, startFret: 1 },
  'B9sus4':  { frets: [-1, 2, 2, 2, 2, 2], barreAt: 2, startFret: 2 },

  // ============================================================
  // DOMINANT 11TH CHORDS (11 = R M3 P5 m7 M9 P11)
  // ============================================================
  'C11':  { frets: [-1, 3, 3, 3, 3, 3], barreAt: 3, startFret: 3 },
  'C#11': { frets: [-1, 4, 4, 4, 4, 4], barreAt: 4, startFret: 4 },
  'D11':  { frets: [-1, -1, 0, 0, 1, 0], fingers: [0, 0, 0, 0, 1, 0] },
  'D#11': { frets: [-1, 6, 6, 6, 6, 6], barreAt: 6, startFret: 6 },
  'E11':  { frets: [0, 0, 0, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0] },
  'F11':  { frets: [1, 1, 1, 2, 1, 1], barreAt: 1 },
  'F#11': { frets: [2, 2, 2, 3, 2, 2], barreAt: 2, startFret: 2 },
  'G11':  { frets: [3, 3, 0, 0, 1, 1], fingers: [2, 3, 0, 0, 1, 1] },
  'G#11': { frets: [4, 4, 4, 5, 4, 4], barreAt: 4, startFret: 4 },
  'A11':  { frets: [-1, 0, 0, 0, 3, 0] },
  'A#11': { frets: [-1, 1, 1, 1, 1, 1], barreAt: 1, startFret: 1 },
  'B11':  { frets: [-1, 2, 2, 2, 2, 2], barreAt: 2, startFret: 2 },

  // ============================================================
  // MAJOR 11TH CHORDS (maj11 = R M3 P5 M7 M9 P11)
  // ============================================================
  'Cmaj11':  { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'C#maj11': { frets: [-1, 4, 3, 1, 1, 1], barreAt: 1, startFret: 1 },
  'Dmaj11':  { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  'D#maj11': { frets: [-1, 6, 5, 3, 3, 3], barreAt: 3, startFret: 3 },
  'Emaj11':  { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  'Fmaj11':  { frets: [-1, -1, 3, 2, 1, 0] },
  'F#maj11': { frets: [-1, -1, 4, 3, 2, 1], startFret: 1 },
  'Gmaj11':  { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  'G#maj11': { frets: [4, 3, 1, 1, 1, 1], barreAt: 1, startFret: 1 },
  'Amaj11':  { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'A#maj11': { frets: [-1, 1, 3, 2, 3, 1], barreAt: 1, startFret: 1 },
  'Bmaj11':  { frets: [-1, 2, 4, 3, 4, 2], barreAt: 2, startFret: 2 },

  // ============================================================
  // MINOR ADD9 CHORDS (madd9 = R m3 P5 M9)
  // ============================================================
  'Cmadd9':  { frets: [-1, 3, 1, 0, 3, 3], startFret: 1 },
  'C#madd9': { frets: [-1, 4, 2, 1, 4, 4], startFret: 1 },
  'Dmadd9':  { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'D#madd9': { frets: [-1, 6, 4, 3, 6, 6], startFret: 3 },
  'Emadd9':  { frets: [0, 2, 2, 0, 0, 2], fingers: [0, 2, 3, 0, 0, 4] },
  'Fmadd9':  { frets: [-1, -1, 3, 1, 1, 3], startFret: 1 },
  'F#madd9': { frets: [-1, -1, 4, 2, 2, 4], startFret: 2 },
  'Gmadd9':  { frets: [3, 1, 0, 0, 3, 3] },
  'G#madd9': { frets: [4, 2, 1, 1, 4, 4], startFret: 1 },
  'Amadd9':  { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A#madd9': { frets: [-1, 1, 3, 3, 2, 1], barreAt: 1, startFret: 1 },
  'Bmadd9':  { frets: [-1, 2, 4, 4, 3, 2], barreAt: 2, startFret: 2 },

  // ============================================================
  // 6/9 CHORDS (R M3 P5 M6 M9)
  // ============================================================
  'C6/9':  { frets: [-1, 3, 2, 2, 3, 0] },
  'C#6/9': { frets: [-1, 4, 3, 3, 4, 1], startFret: 1 },
  'D6/9':  { frets: [-1, -1, 0, 2, 0, 2], fingers: [0, 0, 0, 1, 0, 2] },
  'D#6/9': { frets: [-1, 6, 5, 5, 6, 3], startFret: 3 },
  'E6/9':  { frets: [0, 2, 2, 1, 2, 2], fingers: [0, 1, 2, 1, 3, 4] },
  'F6/9':  { frets: [-1, -1, 3, 2, 3, 3], startFret: 2 },
  'F#6/9': { frets: [-1, -1, 4, 3, 4, 4], startFret: 3 },
  'G6/9':  { frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, 0, 0, 0, 0] },
  'G#6/9': { frets: [-1, -1, 6, 5, 6, 6], startFret: 5 },
  'A6/9':  { frets: [-1, 0, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1], barreAt: 2 },
  'A#6/9': { frets: [-1, 1, 3, 3, 3, 3], barreAt: 3, startFret: 1 },
  'B6/9':  { frets: [-1, 2, 4, 4, 4, 4], barreAt: 4, startFret: 2 },

  // ============================================================
  // AUGMENTED 7TH CHORDS (aug7 = R M3 #5 m7, same as 7#5)
  // ============================================================
  'Caug7':  { frets: [-1, 3, 2, 3, 1, -1] },
  'C#aug7': { frets: [-1, 4, 3, 4, 2, -1], startFret: 2 },
  'Daug7':  { frets: [-1, -1, 0, 3, 1, 2] },
  'D#aug7': { frets: [-1, 6, 5, 6, 4, -1], startFret: 4 },
  'Eaug7':  { frets: [0, 3, 0, 1, 1, 0] },
  'Faug7':  { frets: [1, 0, 1, 2, 2, 1], barreAt: 1 },
  'F#aug7': { frets: [2, 1, 2, 3, 3, 2], barreAt: 2, startFret: 1 },
  'Gaug7':  { frets: [3, 2, 3, 4, 4, 3], barreAt: 3, startFret: 2 },
  'G#aug7': { frets: [4, 3, 4, 5, 5, 4], barreAt: 4, startFret: 3 },
  'Aaug7':  { frets: [-1, 0, 3, 0, 2, 1] },
  'A#aug7': { frets: [-1, 1, 0, 1, 3, 2], startFret: 1 },
  'Baug7':  { frets: [-1, 2, 1, 2, 0, 3] },
};

// ============================================================
// SLASH CHORD FINGERINGS (inversions & pedal bass)
// Fret array: [6th(E), 5th(A), 4th(D), 3rd(G), 2nd(B), 1st(E)]
// ============================================================
export const SLASH_CHORD_SHAPES: Record<string, GuitarFingering> = {
  // C inversions & pedal bass
  'C/E':    { frets: [0, 3, 2, 0, 1, 0],    fingers: [0, 3, 2, 0, 1, 0] },          // E-C-E-G-C-E
  'C/G':    { frets: [3, 3, 2, 0, 1, 0],    fingers: [3, 3, 2, 0, 1, 0] },          // G-C-E-G-C-E
  'C/B':    { frets: [-1, 2, 2, 0, 1, 0],   fingers: [0, 2, 3, 0, 1, 0] },          // x-B-E-G-C-E
  'C/Bb':   { frets: [-1, 1, 2, 0, 1, 0],   fingers: [0, 1, 3, 0, 2, 0] },          // x-Bb-E-G-C-E
  'C/D':    { frets: [-1, -1, 0, 0, 1, 0],  fingers: [0, 0, 0, 0, 1, 0] },          // x-x-D-G-C-E

  // D inversions & pedal bass
  'D/F#':   { frets: [2, 0, 0, 2, 3, 2],    fingers: [2, 0, 0, 1, 3, 2] },          // F#-A-D-A-D-F#
  'D/A':    { frets: [-1, 0, 0, 2, 3, 2],   fingers: [0, 0, 0, 1, 3, 2] },          // x-A-D-A-D-F#
  'D/C':    { frets: [-1, 3, 0, 2, 3, 2],   fingers: [0, 3, 0, 1, 4, 2] },          // x-C-D-A-D-F#
  'D/B':    { frets: [-1, 2, 0, 2, 3, 2],   fingers: [0, 2, 0, 1, 4, 3] },          // x-B-D-A-D-F#
  'D/E':    { frets: [0, 0, 0, 2, 3, 2],    fingers: [0, 0, 0, 1, 3, 2] },          // E-A-D-A-D-F#

  // E inversions & pedal bass
  'E/G#':   { frets: [4, -1, 2, 1, 0, 0],   fingers: [4, 0, 2, 1, 0, 0], startFret: 1 }, // G#-x-E-G#-B-E
  'E/B':    { frets: [-1, 2, 2, 1, 0, 0],   fingers: [0, 2, 3, 1, 0, 0] },          // x-B-E-G#-B-E
  'E/D':    { frets: [-1, -1, 0, 1, 0, 0],  fingers: [0, 0, 0, 1, 0, 0] },          // x-x-D-G#-B-E

  // F inversions & pedal bass
  'F/A':    { frets: [-1, 0, 3, 2, 1, 1],   fingers: [0, 0, 4, 3, 2, 1] },          // x-A-F-A-C-F
  'F/C':    { frets: [-1, 3, 3, 2, 1, 1],   fingers: [0, 3, 4, 2, 1, 1] },          // x-C-F-A-C-F
  'F/G':    { frets: [3, -1, 3, 2, 1, 1],   fingers: [3, 0, 4, 2, 1, 1] },          // G-x-F-A-C-F
  'F/E':    { frets: [0, -1, 3, 2, 1, 1],   fingers: [0, 0, 4, 3, 2, 1] },          // E-x-F-A-C-F
  'F/D':    { frets: [-1, -1, 0, 2, 1, 1],  fingers: [0, 0, 0, 3, 2, 1] },          // x-x-D-A-C-F

  // G inversions & pedal bass
  'G/B':    { frets: [-1, 2, 0, 0, 0, 3],   fingers: [0, 1, 0, 0, 0, 3] },          // x-B-D-G-B-G
  'G/D':    { frets: [-1, -1, 0, 0, 0, 3],  fingers: [0, 0, 0, 0, 0, 3] },          // x-x-D-G-B-G
  'G/F#':   { frets: [2, 2, 0, 0, 0, 3],    fingers: [2, 1, 0, 0, 0, 4] },          // F#-B-D-G-B-G
  'G/F':    { frets: [1, -1, 0, 0, 0, 3],   fingers: [1, 0, 0, 0, 0, 3] },          // F-x-D-G-B-G
  'G/A':    { frets: [-1, 0, 0, 0, 0, 3],   fingers: [0, 0, 0, 0, 0, 3] },          // x-A-D-G-B-G
  'G/E':    { frets: [0, 2, 0, 0, 0, 3],    fingers: [0, 1, 0, 0, 0, 3] },          // E-B-D-G-B-G

  // A inversions & pedal bass
  'A/C#':   { frets: [-1, 4, 2, 2, 2, 0],   fingers: [0, 4, 1, 1, 1, 0], startFret: 2 }, // x-C#-A-E-A-E
  'A/E':    { frets: [0, 0, 2, 2, 2, 0],    fingers: [0, 0, 1, 2, 3, 0] },          // E-A-E-A-C#-E
  'A/G':    { frets: [3, 0, 2, 2, 2, 0],    fingers: [4, 0, 1, 2, 3, 0] },          // G-A-E-A-C#-E
  'A/G#':   { frets: [4, 0, 2, 2, 2, 0],    fingers: [4, 0, 1, 2, 3, 0], startFret: 2 }, // G#-A-E-A-C#-E
  'A/B':    { frets: [-1, 2, 2, 2, 2, 0],   fingers: [0, 1, 1, 1, 1, 0], barreAt: 2, startFret: 2 }, // x-B-E-A-C#-E

  // B inversions
  'B/D#':   { frets: [-1, -1, 1, 4, 4, 4],  fingers: [0, 0, 1, 3, 3, 3], barreAt: 4, startFret: 1 }, // x-x-D#-B-D#-F#
  'B/F#':   { frets: [2, 2, 4, 4, 4, 2],    fingers: [1, 1, 2, 3, 4, 1], barreAt: 2, startFret: 2 }, // F#-B-F#-B-D#-F#

  // Am inversions & pedal bass
  'Am/C':   { frets: [-1, 3, 2, 2, 1, 0],   fingers: [0, 3, 2, 3, 1, 0] },          // x-C-E-A-C-E
  'Am/E':   { frets: [0, 0, 2, 2, 1, 0],    fingers: [0, 0, 2, 3, 1, 0] },          // E-A-E-A-C-E
  'Am/G':   { frets: [3, 0, 2, 2, 1, 0],    fingers: [3, 0, 2, 3, 1, 0] },          // G-A-E-A-C-E
  'Am/F':   { frets: [1, 0, 2, 2, 1, 0],    fingers: [1, 0, 3, 4, 2, 0] },          // F-A-E-A-C-E
  'Am/F#':  { frets: [2, 0, 2, 2, 1, 0],    fingers: [2, 0, 3, 4, 1, 0] },          // F#-A-E-A-C-E

  // Bm inversions
  'Bm/D':   { frets: [-1, -1, 0, 4, 3, 2],  fingers: [0, 0, 0, 4, 3, 2], startFret: 2 }, // x-x-D-F#-A-F#
  'Bm/F#':  { frets: [2, 2, 4, 4, 3, 2],    fingers: [1, 1, 3, 4, 2, 1], barreAt: 2, startFret: 2 }, // F#-B-F#-B-D-F#

  // Dm inversions & pedal bass
  'Dm/F':   { frets: [1, 0, 0, 2, 3, 1],    fingers: [1, 0, 0, 2, 3, 1] },          // F-A-D-A-D-F
  'Dm/A':   { frets: [-1, 0, 0, 2, 3, 1],   fingers: [0, 0, 0, 2, 3, 1] },          // x-A-D-A-D-F
  'Dm/C':   { frets: [-1, 3, 0, 2, 3, 1],   fingers: [0, 3, 0, 2, 4, 1] },          // x-C-D-A-D-F
  'Dm/B':   { frets: [-1, 2, 0, 2, 3, 1],   fingers: [0, 2, 0, 3, 4, 1] },          // x-B-D-A-D-F
  'Dm/Bb':  { frets: [-1, 1, 0, 2, 3, 1],   fingers: [0, 1, 0, 2, 4, 3] },          // x-Bb-D-A-D-F

  // Em inversions & pedal bass
  'Em/B':   { frets: [-1, 2, 2, 0, 0, 0],   fingers: [0, 1, 2, 0, 0, 0] },          // x-B-E-G-B-E
  'Em/D':   { frets: [-1, -1, 0, 0, 0, 0],  fingers: [0, 0, 0, 0, 0, 0] },          // x-x-D-G-B-E
  'Em/C':   { frets: [-1, 3, 2, 0, 0, 0],   fingers: [0, 3, 2, 0, 0, 0] },          // x-C-E-G-B-E
  'Em/D#':  { frets: [-1, -1, 1, 0, 0, 0],  fingers: [0, 0, 1, 0, 0, 0] },          // x-x-D#-G-B-E

  // Seventh chord slash voicings
  'G7/B':   { frets: [-1, 2, 0, 0, 0, 1],   fingers: [0, 2, 0, 0, 0, 1] },          // x-B-D-G-B-F
  'G7/D':   { frets: [-1, -1, 0, 0, 0, 1],  fingers: [0, 0, 0, 0, 0, 1] },          // x-x-D-G-B-F
  'G7/F':   { frets: [1, -1, 0, 0, 0, 1],   fingers: [1, 0, 0, 0, 0, 2] },          // F-x-D-G-B-F
  'C7/E':   { frets: [0, 3, 2, 3, 1, 0],    fingers: [0, 2, 1, 3, 1, 0] },          // E-C-E-Bb-C-E
  'C7/Bb':  { frets: [-1, 1, 2, 3, 1, 0],   fingers: [0, 1, 2, 4, 1, 0] },          // x-Bb-E-Bb-C-E
  'D7/F#':  { frets: [2, 0, 0, 2, 1, 2],    fingers: [2, 0, 0, 3, 1, 4] },          // F#-A-D-A-C-F#
  'D7/A':   { frets: [-1, 0, 0, 2, 1, 2],   fingers: [0, 0, 0, 2, 1, 3] },          // x-A-D-A-C-F#
  'E7/G#':  { frets: [0, 2, 0, 1, 0, 0],    fingers: [0, 2, 0, 1, 0, 0] },          // E-B-D-G#-B-E
  'A7/E':   { frets: [0, 0, 2, 0, 2, 0],    fingers: [0, 0, 2, 0, 3, 0] },          // E-A-E-G-C#-E
  'A7/C#':  { frets: [-1, 4, 2, 0, 2, 0],   fingers: [0, 4, 2, 0, 3, 0], startFret: 2 }, // x-C#-A-G-C#-E
  'B7/D#':  { frets: [-1, -1, 1, 2, 0, 2],  fingers: [0, 0, 1, 2, 0, 3] },          // x-x-D#-A-B-F#
  'B7/F#':  { frets: [2, 2, 1, 2, 0, 2],    fingers: [2, 3, 1, 4, 0, 0], startFret: 1 }, // F#-B-D#-A-B-F#

  // Major 7 slash voicings
  'Cmaj7/E': { frets: [0, 3, 2, 0, 0, 0],   fingers: [0, 3, 2, 0, 0, 0] },          // E-C-E-G-B-E
  'Fmaj7/A': { frets: [-1, 0, 3, 2, 1, 0],  fingers: [0, 0, 3, 2, 1, 0] },          // x-A-F-A-C-E
  'Gmaj7/B': { frets: [-1, 2, 0, 0, 0, 2],  fingers: [0, 1, 0, 0, 0, 2] },          // x-B-D-G-B-F#
};

// ============================================================
// ALTERNATIVE VOICINGS (barre positions, second positions)
// E-frets (root on 6th string): C=8,C#=9,D=10,D#=11,E=0,F=1,F#=2,G=3,G#=4,A=5,A#=6,B=7
// A-frets (root on 5th string): C=3,C#=4,D=5,D#=6,E=7,F=8,F#=9,G=10,G#=11,A=0,A#=1,B=2
// ============================================================
const ALTERNATIVE_VOICINGS: Record<string, GuitarFingering[]> = {
  // ---- MAJOR  (E-shape: [n,n+2,n+2,n+1,n,n]; A-shape: [-1,n,n+2,n+2,n+2,n]) ----
  'C':   [{ frets: [-1,3,5,5,5,3],    barreAt:3,  startFret:3  }, { frets:[8,10,10,9,8,8],    barreAt:8,  startFret:8  }],
  'C#':  [{ frets: [-1,4,6,6,6,4],    barreAt:4,  startFret:4  }],
  'D':   [{ frets: [-1,5,7,7,7,5],    barreAt:5,  startFret:5  }],
  'D#':  [{ frets: [-1,6,8,8,8,6],    barreAt:6,  startFret:6  }],
  'E':   [{ frets: [-1,7,9,9,9,7],    barreAt:7,  startFret:7  }],
  'F':   [{ frets: [-1,-1,3,2,1,1],   fingers:[0,0,3,2,1,1]    }, { frets:[-1,8,10,10,10,8],  barreAt:8,  startFret:8  }],
  'F#':  [{ frets: [-1,9,11,11,11,9], barreAt:9,  startFret:9  }],
  'G':   [{ frets: [3,5,5,4,3,3],     barreAt:3,  startFret:3  }],
  'G#':  [{ frets: [-1,11,13,13,13,11],barreAt:11,startFret:11 }],
  'A':   [{ frets: [5,7,7,6,5,5],     barreAt:5,  startFret:5  }],
  'A#':  [{ frets: [6,8,8,7,6,6],     barreAt:6,  startFret:6  }],
  'B':   [{ frets: [7,9,9,8,7,7],     barreAt:7,  startFret:7  }],

  // ---- MINOR  (Em-shape: [n,n+2,n+2,n,n,n]; Am-shape: [-1,n,n+2,n+2,n+1,n]) ----
  'Cm':  [{ frets: [8,10,10,8,8,8],    barreAt:8,  startFret:8  }],
  'C#m': [{ frets: [9,11,11,9,9,9],    barreAt:9,  startFret:9  }],
  'Dm':  [{ frets: [-1,5,7,7,6,5],     barreAt:5,  startFret:5  }],
  'D#m': [{ frets: [-1,6,8,8,7,6],     barreAt:6,  startFret:6  }],
  'Em':  [{ frets: [-1,7,9,9,8,7],     barreAt:7,  startFret:7  }],
  'Fm':  [{ frets: [-1,8,10,10,9,8],   barreAt:8,  startFret:8  }],
  'F#m': [{ frets: [-1,9,11,11,10,9],  barreAt:9,  startFret:9  }],
  'Gm':  [{ frets: [-1,10,12,12,11,10],barreAt:10, startFret:10 }],
  'G#m': [{ frets: [-1,11,13,13,12,11],barreAt:11, startFret:11 }],
  'Am':  [{ frets: [5,7,7,5,5,5],      barreAt:5,  startFret:5  }],
  'A#m': [{ frets: [6,8,8,6,6,6],      barreAt:6,  startFret:6  }],
  'Bm':  [{ frets: [7,9,9,7,7,7],      barreAt:7,  startFret:7  }],

  // ---- DOM 7  (E7-shape: [n,n+2,n,n+1,n,n]; A7-shape: [-1,n,n+2,n,n+2,n]) ----
  'C7':  [{ frets: [-1,3,5,3,5,3],     barreAt:3,  startFret:3  }],
  'C#7': [{ frets: [9,11,9,10,9,9],    barreAt:9,  startFret:9  }],
  'D7':  [{ frets: [-1,5,7,5,7,5],     barreAt:5,  startFret:5  }],
  'D#7': [{ frets: [11,13,11,12,11,11],barreAt:11, startFret:11 }],
  'E7':  [{ frets: [0,2,2,1,3,0],      fingers:[0,1,2,1,3,0]   }],
  'F7':  [{ frets: [-1,8,10,8,10,8],   barreAt:8,  startFret:8  }],
  'F#7': [{ frets: [-1,9,11,9,11,9],   barreAt:9,  startFret:9  }],
  'G7':  [{ frets: [3,5,3,4,3,3],      barreAt:3,  startFret:3  }],
  'G#7': [{ frets: [-1,11,13,11,13,11],barreAt:11, startFret:11 }],
  'A7':  [{ frets: [5,7,5,6,5,5],      barreAt:5,  startFret:5  }],
  'A#7': [{ frets: [6,8,6,7,6,6],      barreAt:6,  startFret:6  }],
  'B7':  [{ frets: [7,9,7,8,7,7],      barreAt:7,  startFret:7  }],

  // ---- MAJ7  (Emaj7/Amaj7 barre + partial shape: [-1,n,-1,n+2,n+1,n]) ----
  'Cmaj7':  [{ frets: [-1,3,5,4,5,3], barreAt:3, startFret:3 }, { frets: [-1,7,-1,9,8,7], startFret:7 }],
  'C#maj7': [{ frets: [9,11,10,10,9,9], barreAt:9, startFret:9 }, { frets: [-1,8,-1,10,9,8], startFret:8 }],
  'Dmaj7':  [{ frets: [-1,5,7,6,7,5], barreAt:5, startFret:5 }, { frets: [-1,9,-1,11,10,9], startFret:9 }],
  'D#maj7': [{ frets: [11,13,12,12,11,11], barreAt:11, startFret:11 }, { frets: [-1,10,-1,12,11,10], startFret:10 }],
  'Emaj7':  [{ frets: [-1,7,9,8,9,7], barreAt:7, startFret:7 }, { frets: [-1,11,-1,13,12,11], startFret:11 }],
  'Fmaj7':  [{ frets: [-1,8,10,9,10,8], barreAt:8, startFret:8 }, { frets: [-1,0,-1,2,1,0] }],
  'F#maj7': [{ frets: [-1,9,11,10,11,9], barreAt:9, startFret:9 }, { frets: [-1,1,-1,3,2,1], startFret:1 }],
  'Gmaj7':  [{ frets: [-1,2,-1,4,3,2], startFret:2 }, { frets: [3,-1,4,4,3,-1], startFret:3 }, { frets: [-1,-1,5,4,3,2], startFret:2 }],
  'G#maj7': [{ frets: [-1,11,13,12,13,11], barreAt:11, startFret:11 }, { frets: [-1,3,-1,5,4,3], startFret:3 }],
  'Amaj7':  [{ frets: [5,7,6,6,5,5], barreAt:5, startFret:5 }, { frets: [-1,4,-1,6,5,4], startFret:4 }],
  'A#maj7': [{ frets: [6,8,7,7,6,6], barreAt:6, startFret:6 }, { frets: [-1,5,-1,7,6,5], startFret:5 }],
  'Bmaj7':  [{ frets: [7,9,8,8,7,7], barreAt:7, startFret:7 }, { frets: [-1,6,-1,8,7,6], startFret:6 }],

  // ---- m7  (Em7-shape: [n,n+2,n,n,n,n]; Am7-shape: [-1,n,n+2,n,n+1,n]) ----
  'Cm7':  [{ frets: [8,10,8,8,8,8],     barreAt:8,  startFret:8  }],
  'C#m7': [{ frets: [9,11,9,9,9,9],     barreAt:9,  startFret:9  }],
  'Dm7':  [{ frets: [-1,5,7,5,6,5],     barreAt:5,  startFret:5  }],
  'D#m7': [{ frets: [11,13,11,11,11,11],barreAt:11, startFret:11 }],
  'Em7':  [{ frets: [-1,7,9,7,8,7],     barreAt:7,  startFret:7  }],
  'Fm7':  [{ frets: [-1,8,10,8,9,8],    barreAt:8,  startFret:8  }],
  'F#m7': [{ frets: [-1,9,11,9,10,9],   barreAt:9,  startFret:9  }],
  'Gm7':  [{ frets: [-1,10,12,10,11,10],barreAt:10, startFret:10 }],
  'G#m7': [{ frets: [-1,11,13,11,12,11],barreAt:11, startFret:11 }],
  'Am7':  [{ frets: [5,7,5,5,5,5],      barreAt:5,  startFret:5  }],
  'A#m7': [{ frets: [6,8,6,6,6,6],      barreAt:6,  startFret:6  }],
  'Bm7':  [{ frets: [7,9,7,7,7,7],      barreAt:7,  startFret:7  }],

  // ---- m7b5  (E-shape: [n,-1,n,n,n-1,n]; A-shape: [-1,n,n+1,n,n+1,-1]) ----
  'Cm7b5':  [{ frets: [8,-1,8,8,7,8],    startFret:7  }],
  'C#m7b5': [{ frets: [9,-1,9,9,8,9],    startFret:8  }],
  'Dm7b5':  [{ frets: [-1,5,6,5,6,-1],   startFret:5  }],
  'D#m7b5': [{ frets: [11,-1,11,11,10,11],startFret:10 }],
  'Em7b5':  [{ frets: [-1,7,8,7,8,-1],   startFret:7  }],
  'Fm7b5':  [{ frets: [-1,8,9,8,9,-1],   startFret:8  }],
  'F#m7b5': [{ frets: [-1,9,10,9,10,-1], startFret:9  }],
  'Gm7b5':  [{ frets: [-1,10,11,10,11,-1],startFret:10 }],
  'G#m7b5': [{ frets: [-1,11,12,11,12,-1],startFret:11 }],
  'Am7b5':  [{ frets: [5,-1,5,5,4,5],    startFret:4  }],
  'A#m7b5': [{ frets: [6,-1,6,6,5,6],    startFret:5  }],
  'Bm7b5':  [{ frets: [7,-1,7,7,6,7],    startFret:6  }],

  // ---- dim  (E-shape: [n,n+1,n+2,n,-1,-1]; A-shape: [-1,n,n+1,n+2,n+1,-1]) ----
  'Cdim':  [{ frets: [8,9,10,8,-1,-1],    startFret:8  }],
  'C#dim': [{ frets: [9,10,11,9,-1,-1],   startFret:9  }],
  'Ddim':  [{ frets: [-1,5,6,7,6,-1],     startFret:5  }],
  'D#dim': [{ frets: [-1,6,7,8,7,-1],     startFret:6  }],
  'Edim':  [{ frets: [-1,7,8,9,8,-1],     startFret:7  }],
  'Fdim':  [{ frets: [-1,8,9,10,9,-1],    startFret:8  }],
  'F#dim': [{ frets: [-1,9,10,11,10,-1],  startFret:9  }],
  'Gdim':  [{ frets: [-1,10,11,12,11,-1], startFret:10 }],
  'G#dim': [{ frets: [-1,11,12,13,12,-1], startFret:11 }],
  'Adim':  [{ frets: [5,6,7,5,-1,-1],     barreAt:5, startFret:5 }],
  'A#dim': [{ frets: [6,7,8,6,-1,-1],     barreAt:6, startFret:6 }],
  'Bdim':  [{ frets: [7,8,9,7,-1,-1],     barreAt:7, startFret:7 }],

  // ---- dim7: A-string 5-string voicing (includes high e); open-position shapes; barre shapes ----
  'Cdim7':  [
    { frets: [-1, 3, 4, 5, 4, 5], fingers: [0, 1, 2, 4, 3, 4], startFret: 3 },  // old primary
    { frets: [8, 9, 10, 8, 10, 8], barreAt: 8, startFret: 8 },
  ],
  'C#dim7': [
    { frets: [-1, 4, 5, 6, 5, 6], fingers: [0, 1, 2, 4, 3, 4], startFret: 4 },
    { frets: [9, 10, 11, 9, 11, 9], barreAt: 9, startFret: 9 },
  ],
  'Ddim7':  [
    { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 2, 0, 3] },               // open position
    { frets: [-1, 5, 6, 7, 6, 7], startFret: 5 },
  ],
  'D#dim7': [
    { frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4], startFret: 1 }, // low position
    { frets: [-1, 6, 7, 8, 7, 8], startFret: 6 },
  ],
  'Edim7':  [
    { frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },                 // open position
    { frets: [-1, 7, 8, 9, 8, 9], startFret: 7 },
  ],
  'Fdim7':  [
    { frets: [1, 2, 3, 1, 3, 1], fingers: [1, 2, 3, 1, 4, 1], barreAt: 1 },     // barre
    { frets: [-1, 8, 9, 10, 9, 10], startFret: 8 },
  ],
  'F#dim7': [
    { frets: [2, 3, 4, 2, 4, 2], fingers: [1, 2, 3, 1, 4, 1], barreAt: 2, startFret: 2 },
    { frets: [-1, 9, 10, 11, 10, 11], startFret: 9 },
  ],
  'Gdim7':  [
    { frets: [3, 4, 5, 3, 5, 3], fingers: [1, 2, 3, 1, 4, 1], barreAt: 3, startFret: 3 },
    { frets: [-1, 10, 11, 12, 11, 12], startFret: 10 },
  ],
  'G#dim7': [
    { frets: [4, 5, 6, 4, 6, 4], fingers: [1, 2, 3, 1, 4, 1], barreAt: 4, startFret: 4 },
    { frets: [-1, 11, 12, 13, 12, 13], startFret: 11 },
  ],
  'Adim7':  [
    { frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },                // open position
    { frets: [5, 6, 7, 5, 7, 5], barreAt: 5, startFret: 5 },
  ],
  'A#dim7': [
    { frets: [-1, 1, 2, 3, 2, 3], fingers: [0, 1, 2, 4, 3, 4], startFret: 1 },  // old primary
    { frets: [6, 7, 8, 6, 8, 6], barreAt: 6, startFret: 6 },
  ],
  'Bdim7':  [
    { frets: [-1, 2, 3, 4, 3, 4], fingers: [0, 1, 2, 4, 3, 4], startFret: 2 },  // old primary
    { frets: [7, 8, 9, 7, 9, 7], barreAt: 7, startFret: 7 },
  ],

  // ---- sus2  (A-shape: [-1,n,n+2,n+2,n,n]; E-shape: [n,n+2,n+4,n+4,n,n]) ----
  'Csus2':  [{ frets: [-1,3,5,5,3,3],      barreAt:3,  startFret:3  }],
  'C#sus2': [{ frets: [9,11,13,13,9,9],    barreAt:9,  startFret:9  }],
  'Dsus2':  [{ frets: [-1,5,7,7,5,5],      barreAt:5,  startFret:5  }],
  'D#sus2': [{ frets: [11,13,15,15,11,11], barreAt:11, startFret:11 }],
  'Esus2':  [{ frets: [-1,7,9,9,7,7],      barreAt:7,  startFret:7  }],
  'Fsus2':  [{ frets: [-1,8,10,10,8,8],    barreAt:8,  startFret:8  }],
  'F#sus2': [{ frets: [-1,9,11,11,9,9],    barreAt:9,  startFret:9  }],
  'Gsus2':  [{ frets: [-1,10,12,12,10,10], barreAt:10, startFret:10 }],
  'G#sus2': [{ frets: [4,6,8,8,4,4],       barreAt:4,  startFret:4  }],
  'Asus2':  [{ frets: [5,7,9,9,5,5],       barreAt:5,  startFret:5  }],
  'A#sus2': [{ frets: [6,8,10,10,6,6],     barreAt:6,  startFret:6  }],
  'Bsus2':  [{ frets: [7,9,11,11,7,7],     barreAt:7,  startFret:7  }],

  // ---- sus4  (E-shape: [n,n+2,n+2,n+2,n,n]; A-shape: [-1,n,n+2,n+2,n+3,n]) ----
  'Csus4':  [{ frets: [8,10,10,10,8,8],    barreAt:8,  startFret:8  }],
  'C#sus4': [{ frets: [9,11,11,11,9,9],    barreAt:9,  startFret:9  }],
  'Dsus4':  [{ frets: [-1,5,7,7,8,5],      barreAt:5,  startFret:5  }],
  'D#sus4': [{ frets: [11,13,13,13,11,11], barreAt:11, startFret:11 }],
  'Esus4':  [{ frets: [-1,7,9,9,10,7],     barreAt:7,  startFret:7  }],
  'Fsus4':  [{ frets: [-1,8,10,10,11,8],   barreAt:8,  startFret:8  }],
  'F#sus4': [{ frets: [-1,9,11,11,12,9],   barreAt:9,  startFret:9  }],
  'Gsus4':  [{ frets: [3,5,5,5,3,3],       barreAt:3,  startFret:3  }],
  'G#sus4': [{ frets: [4,6,6,6,4,4],       barreAt:4,  startFret:4  }],
  'Asus4':  [{ frets: [5,7,7,7,5,5],       barreAt:5,  startFret:5  }],
  'A#sus4': [{ frets: [6,8,8,8,6,6],       barreAt:6,  startFret:6  }],
  'Bsus4':  [{ frets: [7,9,9,9,7,7],       barreAt:7,  startFret:7  }],

  // ---- aug  (E-shape: [n,n+3,n+2,n+1,n+1,n]; A-shape: [-1,n,n+3,n+2,n+2,n+1]) ----
  'Caug':  [{ frets: [-1,3,6,5,5,4],   startFret:3 }],
  'C#aug': [{ frets: [-1,4,7,6,6,5],   startFret:4 }],
  'Daug':  [{ frets: [-1,5,8,7,7,6],   startFret:5 }],
  'D#aug': [{ frets: [-1,6,9,8,8,7],   startFret:6 }],
  'Eaug':  [{ frets: [-1,7,10,9,9,8],  startFret:7 }],
  'Faug':  [{ frets: [-1,8,11,10,10,9],startFret:8 }],
  'F#aug': [{ frets: [2,5,4,3,3,2],    startFret:2 }],
  'Gaug':  [{ frets: [3,6,5,4,4,3],    startFret:3 }],
  'G#aug': [{ frets: [4,7,6,5,5,4],    startFret:4 }],
  'Aaug':  [{ frets: [5,8,7,6,6,5],    barreAt:5, startFret:5 }],
  'A#aug': [{ frets: [6,9,8,7,7,6],    startFret:6 }],
  'Baug':  [{ frets: [-1,2,5,4,4,3],   startFret:2 }],

  // ---- add9  (major barre as second voicing) ----
  'Cadd9':  [{ frets: [-1,3,5,5,5,3],     barreAt:3,  startFret:3  }],
  'C#add9': [{ frets: [-1,4,6,6,6,4],     barreAt:4,  startFret:4  }],
  'Dadd9':  [{ frets: [-1,5,7,7,7,5],     barreAt:5,  startFret:5  }],
  'D#add9': [{ frets: [-1,6,8,8,8,6],     barreAt:6,  startFret:6  }],
  'Eadd9':  [{ frets: [-1,7,9,9,9,7],     barreAt:7,  startFret:7  }],
  'Fadd9':  [{ frets: [-1,8,10,10,10,8],  barreAt:8,  startFret:8  }],
  'F#add9': [{ frets: [-1,9,11,11,11,9],  barreAt:9,  startFret:9  }],
  'Gadd9':  [{ frets: [3,5,5,4,3,3],      barreAt:3,  startFret:3  }],
  'G#add9': [{ frets: [4,6,6,5,4,4],      barreAt:4,  startFret:4  }],
  'Aadd9':  [{ frets: [5,7,7,6,5,5],      barreAt:5,  startFret:5  }],
  'A#add9': [{ frets: [6,8,8,7,6,6],      barreAt:6,  startFret:6  }],
  'Badd9':  [{ frets: [7,9,9,8,7,7],      barreAt:7,  startFret:7  }],

  // ---- 7sus4  (A7sus4 barre shape: [-1,n,n+2,n,n+3,n]) ----
  'C7sus4':  [{ frets: [-1,3,5,3,6,3],     barreAt:3, startFret:3 }],
  'C#7sus4': [{ frets: [-1,4,6,4,7,4],     barreAt:4, startFret:4 }],
  'D7sus4':  [{ frets: [-1,5,7,5,8,5],     barreAt:5, startFret:5 }],
  'D#7sus4': [{ frets: [-1,6,8,6,9,6],     barreAt:6, startFret:6 }],
  'E7sus4':  [{ frets: [-1,7,9,7,10,7],    barreAt:7, startFret:7 }],
  'F7sus4':  [{ frets: [-1,8,10,8,11,8],   barreAt:8, startFret:8 }],
  'F#7sus4': [{ frets: [-1,9,11,9,12,9],   barreAt:9, startFret:9 }],
  'G7sus4':  [{ frets: [-1,10,12,10,13,10],barreAt:10,startFret:10 }],
  'G#7sus4': [{ frets: [-1,11,13,11,14,11],barreAt:11,startFret:11 }],

  // ---- dom9  (E-shape: [n,n+2,n,n+1,n,n+2]; A-shape: [-1,n,n-1,n,n,n]) ----
  'C9':  [{ frets: [8,10,8,9,8,10],     barreAt:8,  startFret:8  }],
  'C#9': [{ frets: [9,11,9,10,9,11],    barreAt:9,  startFret:9  }],
  'D9':  [{ frets: [10,12,10,11,10,12], barreAt:10, startFret:10 }],
  'D#9': [{ frets: [11,13,11,12,11,13], barreAt:11, startFret:11 }],
  'E9':  [{ frets: [-1,7,6,7,7,7],      startFret:6  }],
  'F9':  [{ frets: [-1,8,7,8,8,8],      startFret:7  }],
  'F#9': [{ frets: [-1,9,8,9,9,9],      startFret:8  }],
  'G9':  [{ frets: [-1,10,9,10,10,10],  startFret:9  }],
  'G#9': [{ frets: [-1,11,10,11,11,11], startFret:10 }],
  'A9':  [{ frets: [5,7,5,6,5,7],       barreAt:5,  startFret:5  }],
  'A#9': [{ frets: [6,8,6,7,6,8],       barreAt:6,  startFret:6  }],
  'B9':  [{ frets: [7,9,7,8,7,9],       barreAt:7,  startFret:7  }],

  // ---- 6  (E-shape: [n,n+2,n+2,n+1,n+2,n]; A-shape: [-1,n,n+2,n+2,n+2,n+2]) ----
  'C6':  [{ frets: [-1,3,5,5,5,5],      startFret:3  }],
  'C#6': [{ frets: [-1,4,6,6,6,6],      startFret:4  }],
  'D6':  [{ frets: [-1,5,7,7,7,7],      startFret:5  }],
  'D#6': [{ frets: [-1,6,8,8,8,8],      startFret:6  }],
  'E6':  [{ frets: [-1,7,9,9,9,9],      startFret:7  }],
  'F6':  [{ frets: [-1,8,10,10,10,10],  startFret:8  }],
  'F#6': [{ frets: [-1,9,11,11,11,11],  startFret:9  }],
  'G6':  [{ frets: [-1,10,12,12,12,12], startFret:10 }],
  'G#6': [{ frets: [-1,11,13,13,13,13], startFret:11 }],
  'A6':  [{ frets: [5,7,7,6,7,5],       barreAt:5, startFret:5 }],
  'A#6': [{ frets: [6,8,8,7,8,6],       barreAt:6, startFret:6 }],
  'B6':  [{ frets: [7,9,9,8,9,7],       barreAt:7, startFret:7 }],

  // ---- m6  (E-shape: [n,n+2,n+2,n,n+2,n]; A-shape: [-1,n,n+2,n+2,n+1,n+2]) ----
  'Cm6':  [{ frets: [-1,3,5,5,4,5],    startFret:3  }],
  'C#m6': [{ frets: [-1,4,6,6,5,6],    startFret:4  }],
  'Dm6':  [{ frets: [-1,5,7,7,6,7],    startFret:5  }],
  'D#m6': [{ frets: [-1,6,8,8,7,8],    startFret:6  }],
  'Em6':  [{ frets: [-1,7,9,9,8,9],    startFret:7  }],
  'Fm6':  [{ frets: [-1,8,10,10,9,10], startFret:8  }],
  'F#m6': [{ frets: [-1,9,11,11,10,11],startFret:9  }],
  'Gm6':  [{ frets: [-1,10,12,12,11,12],startFret:10 }],
  'G#m6': [{ frets: [-1,11,13,13,12,13],startFret:11 }],
  'Am6':  [{ frets: [5,7,7,5,7,5],     barreAt:5, startFret:5 }],
  'A#m6': [{ frets: [6,8,8,6,8,6],     barreAt:6, startFret:6 }],
  'Bm6':  [{ frets: [7,9,9,7,9,7],     barreAt:7, startFret:7 }],

  // ---- maj9  (second position) ----
  'Cmaj9':  [{ frets: [8,10,9,11,11,10],  startFret:8  }],
  'C#maj9': [{ frets: [9,11,10,12,12,11], startFret:9  }],
  'Dmaj9':  [{ frets: [10,12,11,13,13,12],startFret:10 }],
  'D#maj9': [{ frets: [-1,6,5,7,8,7],     startFret:5  }],
  'Emaj9':  [{ frets: [-1,7,6,8,9,8],     startFret:6  }],
  'Fmaj9':  [{ frets: [-1,8,7,9,10,9],    startFret:7  }],
  'F#maj9': [{ frets: [-1,9,8,10,11,10],  startFret:8  }],
  'Gmaj9':  [{ frets: [-1,10,9,11,12,11], startFret:9  }],
  'G#maj9': [{ frets: [-1,11,10,12,13,12],startFret:10 }],
  'Amaj9':  [{ frets: [-1,0,2,1,0,0]                   }],

  // ---- m9  (second position) ----
  'Cm9':  [{ frets: [-1,3,1,3,4,3],    startFret:1  }],
  'C#m9': [{ frets: [-1,4,2,4,5,4],    startFret:2  }],
  'Dm9':  [{ frets: [-1,5,3,5,6,5],    startFret:3  }],
  'D#m9': [{ frets: [-1,6,4,6,7,6],    startFret:4  }],
  'Em9':  [{ frets: [-1,7,5,7,8,7],    startFret:5  }],
  'Fm9':  [{ frets: [-1,8,6,8,9,8],    startFret:6  }],
  'F#m9': [{ frets: [-1,9,7,9,10,9],   startFret:7  }],
  'Gm9':  [{ frets: [-1,10,8,10,11,10],startFret:8  }],
  'G#m9': [{ frets: [-1,11,9,11,12,11],startFret:9  }],
  'Am9':  [{ frets: [-1,0,3,0,1,0]                   }],
  'A#m9': [{ frets: [-1,1,4,1,2,1],    barreAt:1, startFret:1 }],
  'Bm9':  [{ frets: [-1,2,5,2,3,2],    startFret:2  }],

  // ---- 13  (second position) ----
  'C13':  [{ frets: [-1,3,2,3,5,5],    startFret:2  }],
  'C#13': [{ frets: [-1,4,3,4,6,6],    startFret:3  }],
  'D13':  [{ frets: [-1,5,4,5,7,7],    startFret:4  }],
  'D#13': [{ frets: [-1,6,5,6,8,8],    startFret:5  }],
  'E13':  [{ frets: [-1,7,6,7,9,9],    startFret:6  }],
  'F13':  [{ frets: [-1,8,7,8,10,10],  startFret:7  }],
  'F#13': [{ frets: [-1,9,8,9,11,11],  startFret:8  }],
  'G13':  [{ frets: [-1,10,9,10,12,12],startFret:9  }],
  'G#13': [{ frets: [-1,11,10,11,13,13],startFret:10 }],
  'A13':  [{ frets: [-1,0,2,0,2,2]                   }],
  'A#13': [{ frets: [-1,1,3,1,3,3],    barreAt:1, startFret:1 }],
  'B13':  [{ frets: [-1,2,4,2,4,4],    barreAt:2, startFret:2 }],

  // ---- m11  (second position) ----
  'Cm11':  [{ frets: [-1,3,1,3,4,1],   startFret:1  }],
  'C#m11': [{ frets: [-1,4,2,4,5,2],   startFret:2  }],
  'Dm11':  [{ frets: [-1,5,3,5,6,3],   startFret:3  }],
  'D#m11': [{ frets: [-1,6,4,6,7,4],   startFret:4  }],
  'Em11':  [{ frets: [-1,7,5,7,8,5],   startFret:5  }],
  'Fm11':  [{ frets: [-1,8,6,8,9,6],   startFret:6  }],
  'F#m11': [{ frets: [-1,9,7,9,10,7],  startFret:7  }],
  'Gm11':  [{ frets: [-1,10,8,10,11,8],startFret:8  }],
  'G#m11': [{ frets: [-1,11,9,11,12,9],startFret:9  }],
  'Am11':  [{ frets: [-1,0,2,0,3,0]                  }],
  'A#m11': [{ frets: [-1,1,4,1,2,4],   barreAt:1, startFret:1 }],
  'Bm11':  [{ frets: [-1,2,0,2,3,0]                  }],

  // ---- 7b9  (second position) ----
  'C7b9':  [{ frets: [8,10,8,9,7,8],    startFret:7  }],
  'C#7b9': [{ frets: [9,11,9,10,8,9],   startFret:8  }],
  'D7b9':  [{ frets: [10,12,10,11,9,10],startFret:9  }],
  'D#7b9': [{ frets: [11,13,11,12,10,11],startFret:10 }],
  'E7b9':  [{ frets: [-1,7,6,7,5,7],    startFret:5  }],
  'F7b9':  [{ frets: [-1,8,7,8,6,8],    startFret:6  }],
  'F#7b9': [{ frets: [-1,9,8,9,7,9],    startFret:7  }],
  'G7b9':  [{ frets: [-1,10,9,10,8,10], startFret:8  }],
  'G#7b9': [{ frets: [-1,11,10,11,9,11],startFret:9  }],
  'A7b9':  [{ frets: [5,7,5,6,4,5],     startFret:4  }],

  // ---- 7#9  (second position) ----
  'C7#9':  [{ frets: [8,10,8,9,11,8],   barreAt:8, startFret:8  }],
  'C#7#9': [{ frets: [9,11,9,10,12,9],  barreAt:9, startFret:9  }],
  'D7#9':  [{ frets: [10,12,10,11,13,10],barreAt:10,startFret:10 }],
  'D#7#9': [{ frets: [-1,6,5,6,8,6],    startFret:5  }],
  'E7#9':  [{ frets: [-1,7,6,7,9,7],    startFret:6  }],
  'F7#9':  [{ frets: [-1,8,7,8,10,8],   startFret:7  }],
  'F#7#9': [{ frets: [-1,9,8,9,11,9],   startFret:8  }],
  'G7#9':  [{ frets: [-1,10,9,10,12,10],startFret:9  }],
  'G#7#9': [{ frets: [-1,11,10,11,13,11],startFret:10 }],
  'A7#9':  [{ frets: [5,7,5,6,8,5],     barreAt:5, startFret:5  }],
  'A#7#9': [{ frets: [6,8,6,7,9,6],     barreAt:6, startFret:6  }],
  'B7#9':  [{ frets: [7,9,7,8,10,7],    barreAt:7, startFret:7  }],

  // ---- maj13  (second position) ----
  'Cmaj13':  [{ frets: [-1,3,5,4,5,5],    startFret:3  }],
  'C#maj13': [{ frets: [-1,4,6,5,6,6],    startFret:4  }],
  'Dmaj13':  [{ frets: [-1,5,7,6,7,7],    startFret:5  }],
  'D#maj13': [{ frets: [-1,6,8,7,8,8],    startFret:6  }],
  'Emaj13':  [{ frets: [-1,7,9,8,9,9],    startFret:7  }],
  'Fmaj13':  [{ frets: [-1,8,10,9,10,10], startFret:8  }],
  'F#maj13': [{ frets: [-1,9,11,10,11,11],startFret:9  }],
  'Gmaj13':  [{ frets: [-1,10,12,11,12,12],startFret:10 }],
  'G#maj13': [{ frets: [-1,11,13,12,13,13],startFret:11 }],
  'Amaj13':  [{ frets: [-1,0,2,1,2,2]                   }],
  'A#maj13': [{ frets: [-1,1,3,2,3,3],    barreAt:1, startFret:1 }],
  'Bmaj13':  [{ frets: [-1,2,4,3,4,4],    barreAt:2, startFret:2 }],
};
export function getChordShapeKey(root: string, type: string): string {
  const suffix = type === 'major' ? '' : CHORD_TYPES[type]?.symbol || type;
  return root + suffix;
}

export function getGuitarFingering(root: string, type: string): GuitarFingering | null {
  const key = getChordShapeKey(root, type);
  return GUITAR_CHORD_SHAPES[key] || null;
}

// Open string notes for the 6 guitar strings (low E to high e)
const OPEN_STRINGS = [4, 11, 7, 2, 9, 4]; // E B G D A E as NOTES indices

function generateSlashVoicing(base: GuitarFingering, bassNote: string): GuitarFingering | null {
  const bassIdx = NOTES.indexOf(bassNote as typeof NOTES[number]);
  if (bassIdx === -1) return null;

  // Try low E string first (string 0), then A string (string 1)
  for (const stringIdx of [0, 1]) {
    const openNote = OPEN_STRINGS[stringIdx];
    const fret = (bassIdx - openNote + 12) % 12;
    // Use open string (0) or frets 1-5 on low E, 0-5 on A
    if (fret > 5) continue;

    const newFrets = [...base.frets];
    // If the base chord already uses this string with a different note, replace it
    // If the base chord mutes this string, add the bass note
    newFrets[stringIdx] = fret;

    // Mute strings between bass and the rest of the chord if needed
    if (stringIdx === 0 && base.frets[0] === -1) {
      // We're adding bass on low E; if A string was also muted, keep it muted
      // unless the chord uses it
    }

    // Compute startFret based on played frets
    const played = newFrets.filter(f => f > 0);
    const minFret = played.length ? Math.min(...played) : 0;
    const maxFret = played.length ? Math.max(...played) : 0;
    const startFret = maxFret <= 5 ? (base.startFret && base.startFret > 0 ? base.startFret : undefined) : Math.max(1, minFret - 1);

    const result: GuitarFingering = { frets: newFrets };
    if (startFret && startFret > 0) result.startFret = startFret;
    return result;
  }

  return null;
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
      return [slashFingering, ...all];
    }
    // Auto-generate: modify the primary voicing to include the bass note
    if (primary) {
      const generated = generateSlashVoicing(primary, bassNote);
      if (generated) {
        return [generated, ...all];
      }
    }
  }

  return all;
}
