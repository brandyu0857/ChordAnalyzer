import { parseChordName, type ParsedChord } from './chordUtils';
import { NOTES, SHARP_TO_FLAT, getNoteIndex } from '../data/notes';
import { PROGRESSION_TEMPLATES } from '../data/progressions';

/* ─── "What chord comes next?" ─────────────────────────────────────────────
 * Clues for when a chord can't be heard clearly. Everything is worked out in
 * a major key (a minor song is its relative major, so Am–F–C–G is vi–IV–I–V):
 *   1. infer the key from the chords transcribed so far
 *   2. rank next chords by how often pop/rock harmony moves there from the
 *      previous chord's degree
 *   3. boost the chord that continues a well-known progression (canon, 1645…)
 *      when the last few chords match its start
 *   4. write suggestions the way the song does: sevenths if it uses them,
 *      flats in flat keys
 * ------------------------------------------------------------------------ */

type Quality = 'M' | 'm' | 'o' | '+';

interface Degree {
  label: string;     // Roman numeral
  number: string;    // numbered notation Chinese players use (1 4 5 6m …)
  semis: number;     // above the key's tonic
  quality: Quality;
  seventh: string;   // suffix when the song uses seventh chords
  diatonic: boolean;
}

const DEGREES: Degree[] = [
  { label: 'I', number: '1', semis: 0, quality: 'M', seventh: 'maj7', diatonic: true },
  { label: 'ii', number: '2m', semis: 2, quality: 'm', seventh: 'm7', diatonic: true },
  { label: 'iii', number: '3m', semis: 4, quality: 'm', seventh: 'm7', diatonic: true },
  { label: 'IV', number: '4', semis: 5, quality: 'M', seventh: 'maj7', diatonic: true },
  { label: 'V', number: '5', semis: 7, quality: 'M', seventh: '7', diatonic: true },
  { label: 'vi', number: '6m', semis: 9, quality: 'm', seventh: 'm7', diatonic: true },
  { label: 'vii°', number: '7dim', semis: 11, quality: 'o', seventh: 'm7b5', diatonic: true },
  // Common borrowed chords and secondary dominants
  { label: 'bVII', number: 'b7', semis: 10, quality: 'M', seventh: '7', diatonic: false },
  { label: 'iv', number: '4m', semis: 5, quality: 'm', seventh: 'm7', diatonic: false },
  { label: 'bVI', number: 'b6', semis: 8, quality: 'M', seventh: 'maj7', diatonic: false },
  { label: 'bIII', number: 'b3', semis: 3, quality: 'M', seventh: 'maj7', diatonic: false },
  { label: 'III', number: '3', semis: 4, quality: 'M', seventh: '7', diatonic: false },
  { label: 'II', number: '2', semis: 2, quality: 'M', seventh: '7', diatonic: false },
  { label: 'VI', number: '6', semis: 9, quality: 'M', seventh: '7', diatonic: false },
];
const byLabel = new Map(DEGREES.map(d => [d.label, d]));

// How likely each degree moves to the next, from common pop/rock practice
const TRANSITIONS: Record<string, Record<string, number>> = {
  'I': { IV: 0.26, V: 0.24, vi: 0.2, ii: 0.1, iii: 0.07, bVII: 0.04, III: 0.03, VI: 0.03 },
  'ii': { V: 0.55, IV: 0.1, I: 0.1, vi: 0.1, iii: 0.08, II: 0.03 },
  'iii': { vi: 0.35, IV: 0.35, ii: 0.12, I: 0.08, V: 0.05 },
  'IV': { V: 0.32, I: 0.3, vi: 0.12, iv: 0.08, ii: 0.08, iii: 0.06 },
  'V': { I: 0.5, vi: 0.25, IV: 0.15, iii: 0.05, ii: 0.03 },
  'vi': { IV: 0.38, V: 0.2, ii: 0.15, iii: 0.12, I: 0.1 },
  'vii°': { I: 0.6, iii: 0.2, vi: 0.2 },
  'bVII': { I: 0.5, IV: 0.3, V: 0.1, bVI: 0.1 },
  'iv': { I: 0.6, V: 0.25, bVII: 0.1 },
  'bVI': { bVII: 0.45, V: 0.25, I: 0.2, IV: 0.1 },
  'bIII': { IV: 0.4, bVII: 0.3, I: 0.2 },
  'III': { vi: 0.75, IV: 0.15 },
  'II': { V: 0.7, IV: 0.2 },
  'VI': { ii: 0.75, IV: 0.15 },
};

// Why a move is worth trying — shown under each suggestion
const MOVE_REASONS: Record<string, [string, string]> = {
  'V>I': ['属→主，最常见的解决', 'V→I, the strongest resolution'],
  'ii>V': ['2–5 进行，流行和爵士都常用', 'ii–V, a staple move'],
  'IV>V': ['下属→属，推向主和弦', 'IV→V builds toward the tonic'],
  'V>vi': ['阻碍终止（假解决）', 'Deceptive cadence'],
  'IV>I': ['变格终止', 'Plagal cadence'],
  'vi>IV': ['流行常见的 6→4', 'Common pop move'],
  'IV>iv': ['借用小调的 4m，常接回 1', 'Borrowed minor iv, usually back to I'],
  'iv>I': ['4m → 1，借用和弦的温柔解决', 'Borrowed iv resolving home'],
  'III>vi': ['副属和弦 III 解决到 6m', 'Secondary dominant resolving to vi'],
  'II>V': ['副属和弦 II 引向 5', 'Secondary dominant leading to V'],
  'VI>ii': ['副属和弦 VI 引向 2m', 'Secondary dominant leading to ii'],
  'bVII>I': ['借用 b7 回到主和弦，摇滚常见', 'Borrowed bVII back home'],
  'iii>vi': ['3m→6m，卡农式下行', 'Descending canon-style move'],
  'I>V': ['从主和弦出发的常见走向', 'Common first move from I'],
  'I>IV': ['从主和弦出发的常见走向', 'Common first move from I'],
  'I>vi': ['1→6m，50 年代进行的开头', 'I→vi, the 50s progression'],
};

function qualityOf(chord: ParsedChord): Quality {
  const pcs = new Set(chord.chordType.intervals.map(i => i % 12));
  if (pcs.has(3) && pcs.has(6) && !pcs.has(7)) return 'o';
  if (pcs.has(4) && pcs.has(8) && !pcs.has(7)) return '+';
  if (pcs.has(3) && !pcs.has(4)) return 'm';
  return 'M';
}

function degreeIn(chord: ParsedChord, keyPc: number): Degree | null {
  const semis = (getNoteIndex(chord.root) - keyPc + 12) % 12;
  const q = qualityOf(chord);
  return DEGREES.find(d => d.semis === semis && d.quality === q) ?? null;
}

/** Most likely major key (the relative major for minor songs), or null. */
export function inferKey(chords: ParsedChord[]): number | null {
  if (!chords.length) return null;
  let best: number | null = null;
  let bestScore = -1;
  for (let key = 0; key < 12; key++) {
    let score = 0;
    for (const c of chords) {
      const d = degreeIn(c, key);
      if (d) score += d.diatonic ? 1 : 0.4;
    }
    // Songs usually start on I or vi
    const first = degreeIn(chords[0], key);
    if (first?.label === 'I') score += 0.6;
    else if (first?.label === 'vi') score += 0.5;
    if (score > bestScore) { bestScore = score; best = key; }
  }
  return best;
}

// Progression templates as degree sequences (major-key ones only)
const TEMPLATES = PROGRESSION_TEMPLATES
  .map(t => ({ t, seq: t.degrees.map(d => (d === 'V/vi' ? 'III' : d === 'I/iii' ? 'I' : d === 'vii' ? 'vii°' : d)) }))
  .filter(({ seq }) => seq.every(d => byLabel.has(d)));

export interface ChordSuggestion {
  chord: string;
  degree: string;       // e.g. "V (5)"
  reason: string;
  score: number;
}

export interface SuggestionContext {
  keyName: string;      // e.g. "C" — the major key the suggestions are in
  previous: string;     // the chord the suggestions follow
  suggestions: ChordSuggestion[];
}

/**
 * Suggest what may follow `previous`, given the chords transcribed so far
 * (in song order). Returns null when there is no previous chord.
 */
export function suggestNextChords(
  previous: string | null, songChords: string[], isEn: boolean, limit = 5,
): SuggestionContext | null {
  const prev = previous ? parseChordName(previous) : null;
  if (!prev) return null;
  const parsed = songChords.map(c => parseChordName(c)).filter((c): c is ParsedChord => !!c);

  let keyPc = inferKey(parsed.length ? parsed : [prev]) ?? getNoteIndex(prev.root);
  let prevDegree = degreeIn(prev, keyPc);
  if (!prevDegree) {
    // Outside the song's key (a modulation or passing chord): read it as the
    // tonic of a local key instead — I if major, vi if minor
    keyPc = qualityOf(prev) === 'm' ? (getNoteIndex(prev.root) + 3) % 12 : getNoteIndex(prev.root);
    prevDegree = degreeIn(prev, keyPc);
  }
  if (!prevDegree) return null;

  // Recent history as degrees, oldest first, for template matching
  const history: string[] = [];
  for (let i = parsed.length - 1; i >= 0 && history.length < 3; i--) {
    const d = degreeIn(parsed[i], keyPc);
    if (!d) break;
    history.unshift(d.label);
  }
  if (history[history.length - 1] !== prevDegree.label) history.splice(0, history.length, prevDegree.label);

  const scores = new Map<string, { score: number; reason?: string }>();
  const add = (label: string, score: number, reason?: string) => {
    const cur = scores.get(label) ?? { score: 0 };
    cur.score += score;
    if (reason && !cur.reason) cur.reason = reason;
    scores.set(label, cur);
  };

  for (const [label, w] of Object.entries(TRANSITIONS[prevDegree.label] ?? {})) {
    const r = MOVE_REASONS[`${prevDegree.label}>${label}`];
    add(label, w, r ? r[isEn ? 1 : 0] : undefined);
  }

  // A well-known progression continuing from the last 2–3 chords
  for (const { t, seq } of TEMPLATES) {
    const n = seq.length;
    for (let p = 0; p < n; p++) {
      let len = 0;
      while (len < history.length && seq[(p - len + n * 3) % n] === history[history.length - 1 - len]) len++;
      if (len >= 2) {
        const next = seq[(p + 1) % n];
        add(next, 0.12 * len, isEn ? `Next in "${t.nameEn}"` : `「${t.name}」的下一个和弦`);
      }
    }
  }

  // Write the chords the way this song does
  const usesSevenths = parsed.length > 0 &&
    parsed.filter(c => c.chordType.intervals.some(i => i % 12 === 10 || i % 12 === 11)).length / parsed.length >= 0.4;
  const preferFlats = [5, 10, 3, 8, 1].includes(keyPc) || songChords.some(c => /^[A-G]b/.test(c));
  const spell = (pc: number) => {
    const name = NOTES[pc];
    return preferFlats && SHARP_TO_FLAT[name] ? SHARP_TO_FLAT[name] : name;
  };
  const suffix = (d: Degree) => {
    if (usesSevenths) return d.seventh;
    return d.quality === 'm' ? 'm' : d.quality === 'o' ? 'dim' : d.quality === '+' ? 'aug' : '';
  };

  const suggestions = [...scores.entries()]
    .filter(([label]) => label !== prevDegree!.label && byLabel.has(label))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([label, { score, reason }]) => {
      const d = byLabel.get(label)!;
      return {
        chord: spell((keyPc + d.semis) % 12) + suffix(d),
        degree: `${d.label} (${d.number})`,
        reason: reason ?? (isEn ? `${prevDegree!.label} → ${d.label}` : `${prevDegree!.number} → ${d.number}`),
        score,
      };
    });

  return { keyName: spell(keyPc), previous: previous!, suggestions };
}
