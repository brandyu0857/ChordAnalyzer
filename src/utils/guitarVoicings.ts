import type { GuitarFingering } from '../data/chords';

/* ─── Guitar voicing checks & generation ───────────────────────────────────
 * Decides whether a hand can actually play a chord shape, and finds playable
 * shapes when the curated library doesn't have enough. Deliberately takes
 * tuning and chord intervals as arguments rather than importing them from
 * data/chords, which imports this module.
 *
 * A voicing counts as playable when:
 *   - fretted notes fit within a 4-fret window (span ≤ 3)
 *   - it needs at most 4 fingers, a barre counting as one. Two barres are
 *     allowed: the index across the lowest fret, and a flat ring/pinky
 *     across adjacent strings at the highest fret (the A-shape and 9-chord
 *     grips). A barre can't lie over an open or muted string.
 *   - neighbouring fingers don't over-stretch: fingers j < k can be at most
 *     (k − j) + 1 frets apart, so index→pinky reaches 4 frets but ring→pinky
 *     only 2 (x 4 1 x 1 1 fails: three fingers on fret 1, pinky on fret 4)
 *   - at most one muted string sits between sounding strings
 *   - at least 4 strings sound (2 for a power chord)
 * and it is a correct chart for the chord when:
 *   - every note is a chord tone (or the slash bass)
 *   - the lowest note is the root, or the slash bass (dim7 and aug are
 *     symmetric, so any chord tone may be the bass)
 *   - every defining tone is present; only the conventional omissions are
 *     allowed (the 5th, the 3rd or the 9th of an 11 chord, the 9th of a 13;
 *     a 13 never includes the 11th)
 * ------------------------------------------------------------------------ */

export interface ChordSpec {
  rootPc: number;       // pitch class of the root, 0 = C
  typeKey: string;      // key into CHORD_TYPES, e.g. 'm7'
  intervals: number[];  // raw intervals from CHORD_TYPES
  bassPc?: number;      // slash bass; defaults to the root
}

export interface VoicingAssessment {
  ok: boolean;
  reasons: string[];    // why it failed, for the audit
  fingers: number[];    // suggested fingering, 0 for open/muted strings
  barreAt?: number;
  startFret?: number;   // top fret row of a 5-row diagram; undefined = nut shown
  score: number;        // lower = easier / more idiomatic
}

const MAX_SPAN = 3;
// Fallback when a chord has no 3 shapes within 4 frets: a 5-fret stretch,
// only from the 5th fret up where the frets are narrow enough to reach
const STRETCH_SPAN = 4;
const STRETCH_MIN_FRET = 5;
const MAX_FINGERS = 4;
const MAX_INTERIOR_MUTES = 1;
const DIAGRAM_ROWS = 5;
const MAX_FRET = 15;

// Tones a chart may leave out, beyond the 5th of a 4+ note chord
const EXTRA_OPTIONAL: Record<string, number[]> = {
  '11': [4, 14],      // charted either without the 3rd (it clashes with the
                      // 11th) or without the 9th, as in the open E11
  '13': [14, 17],     // 13 chords are voiced without the 9th and 11th
  maj13: [14],
  m11: [14],
  maj11: [14],
};

// Tones left out of the chord entirely: the 11th clashes with the 3rd of a
// dominant 13, so a 13 chord is voiced without it
const EXCLUDED: Record<string, number[]> = {
  '13': [17],
};

// Of each group, at least one tone must sound: an 11 chord may drop the 3rd
// or the 9th, but not both (that would just be a 7sus4)
const ONE_OF: Record<string, number[]> = {
  '11': [4, 14],
};

// Chords made of equal intervals: every inversion is the same chord, so
// charts name them after any tone in the bass
const SYMMETRIC_TYPES = new Set(['dim7', 'aug']);

interface Tones {
  allowed: Set<number>;   // pitch classes that may sound
  required: Set<number>;  // pitch classes that must sound
  oneOf: Set<number>;     // at least one of these must sound (may be empty)
  bassPcs: Set<number>;   // pitch classes allowed as the lowest note
  isPowerChord: boolean;
}

function chordTones(spec: ChordSpec): Tones {
  const excluded = new Set(EXCLUDED[spec.typeKey] ?? []);
  const pcs = [...new Set(spec.intervals.filter(i => !excluded.has(i)).map(i => i % 12))];
  const optional = new Set<number>((EXTRA_OPTIONAL[spec.typeKey] ?? []).map(i => i % 12));
  if (pcs.length >= 4) optional.add(7);

  const allowed = new Set(pcs.map(i => (spec.rootPc + i) % 12));
  const required = new Set(pcs.filter(i => !optional.has(i)).map(i => (spec.rootPc + i) % 12));
  const bassPc = spec.bassPc ?? spec.rootPc;
  allowed.add(bassPc);
  required.add(bassPc);
  const bassPcs = spec.bassPc === undefined && SYMMETRIC_TYPES.has(spec.typeKey)
    ? new Set(allowed)
    : new Set([bassPc]);
  const oneOf = new Set((ONE_OF[spec.typeKey] ?? []).map(i => (spec.rootPc + i) % 12));
  return { allowed, required, oneOf, bassPcs, isPowerChord: pcs.length <= 2 };
}

interface FingerPlan {
  count: number;
  fingers: number[];
  barreAt?: number;
}

interface Note { s: number; f: number }

// Longest run of adjacent strings all fretted at the highest fret — the notes
// a flattened ring or pinky finger can hold down together.
function topFretRun(frets: number[], notes: Note[]): Note[] {
  if (notes.length < 2) return [];
  const top = Math.max(...notes.map(n => n.f));
  let best: Note[] = [];
  let run: Note[] = [];
  for (let s = 0; s < frets.length; s++) {
    if (frets[s] === top && notes.some(n => n.s === s)) run.push({ s, f: top });
    else run = [];
    if (run.length > best.length) best = [...run];
  }
  return best.length >= 2 ? best : [];
}

// Assign fingers to groups (a single note or a barre), lower frets first,
// following one-finger-per-fret: a group two frets above the first finger
// goes to the finger two along when it's free. Returns null when the shape
// needs more than 4 fingers or over-stretches between two fingers.
function numberFingers(frets: number[], groups: Note[][], first: number, baseFret: number): number[] | null {
  const sorted = [...groups].sort((a, b) => a[0].f - b[0].f || a[0].s - b[0].s);
  const assigned: { finger: number; fret: number }[] = [];
  let prev = first - 1;
  for (const g of sorted) {
    const ideal = first + (g[0].f - baseFret);
    const finger = Math.max(prev + 1, Math.min(MAX_FINGERS, ideal));
    if (finger > MAX_FINGERS) return null;
    assigned.push({ finger, fret: g[0].f });
    prev = finger;
  }
  // Include the barre (finger 1 at baseFret) in the stretch check
  const all = first > 1 ? [{ finger: 1, fret: baseFret }, ...assigned] : assigned;
  for (let j = 0; j < all.length; j++) {
    for (let k = j + 1; k < all.length; k++) {
      if (all[k].fret - all[j].fret > all[k].finger - all[j].finger + 1) return null;
    }
  }
  const fingers = frets.map(() => 0);
  sorted.forEach((g, i) => g.forEach(n => { fingers[n.s] = assigned[i].finger; }));
  return fingers;
}

// Fewest fingers that fret every pressed note, using an index barre across
// the lowest fret and/or a flat finger across the highest.
function planFingers(frets: number[]): FingerPlan {
  const pressed: Note[] = frets
    .map((f, s) => ({ s, f }))
    .filter(n => n.f > 0);
  if (pressed.length === 0) return { count: 0, fingers: frets.map(() => 0) };

  const withTopBarre = (notes: Note[]): Note[][] => {
    const run = topFretRun(frets, notes);
    const rest = notes.filter(n => !run.some(r => r.s === n.s));
    return [...rest.map(n => [n]), ...(run.length ? [run] : [])];
  };

  const low = Math.min(...pressed.map(n => n.f));
  const plain = withTopBarre(pressed);
  const plainFingers = numberFingers(frets, plain, 1, low);
  // count > MAX_FINGERS marks a shape no hand can make
  let best: FingerPlan = plainFingers
    ? { count: plain.length, fingers: plainFingers }
    : { count: Infinity, fingers: frets.map(() => 0) };

  const onLow = pressed.filter(n => n.f === low).map(n => n.s);
  if (onLow.length >= 2) {
    const from = Math.min(...onLow);
    const to = Math.max(...onLow);
    // Everything under the barre must be fretted at or above it
    const clean = frets.slice(from, to + 1).every(f => f >= low);
    if (clean) {
      const groups = withTopBarre(pressed.filter(n => n.f !== low));
      const fingers = numberFingers(frets, groups, 2, low);
      if (fingers && 1 + groups.length < best.count) {
        for (let s = from; s <= to; s++) if (frets[s] === low) fingers[s] = 1;
        best = { count: 1 + groups.length, fingers, barreAt: low };
      }
    }
  }
  return best;
}

export interface AssessOptions {
  allowStretch?: boolean; // accept a 5-fret stretch above the 5th fret
}

export function assessVoicing(
  frets: number[],
  spec: ChordSpec,
  tuning: number[],
  { allowStretch = false }: AssessOptions = {},
): VoicingAssessment {
  const reasons: string[] = [];
  const tones = chordTones(spec);

  const sounding = frets.map((f, s) => ({ s, f })).filter(n => n.f >= 0);
  const minStrings = tones.isPowerChord ? 2 : 4;
  if (sounding.length < minStrings) reasons.push(`only ${sounding.length} strings sound`);

  const pcs = sounding.map(n => (tuning[n.s] + n.f) % 12);
  const stray = pcs.filter(pc => !tones.allowed.has(pc));
  if (stray.length) reasons.push('contains notes outside the chord');
  const missing = [...tones.required].filter(pc => !pcs.includes(pc));
  if (missing.length) reasons.push('missing a defining chord tone');
  if (tones.oneOf.size && !pcs.some(pc => tones.oneOf.has(pc))) reasons.push('missing a defining chord tone');
  if (pcs.length && !tones.bassPcs.has(pcs[0])) reasons.push('wrong bass note');

  const first = sounding[0]?.s ?? 0;
  const last = sounding[sounding.length - 1]?.s ?? 0;
  const interiorMutes = frets.slice(first, last + 1).filter(f => f < 0).length;
  if (interiorMutes > MAX_INTERIOR_MUTES) reasons.push(`${interiorMutes} muted strings inside the chord`);

  const pressed = frets.filter(f => f > 0);
  const minFret = pressed.length ? Math.min(...pressed) : 0;
  const maxFret = pressed.length ? Math.max(...pressed) : 0;
  const span = maxFret - minFret;
  const stretchOk = allowStretch && span <= STRETCH_SPAN && minFret >= STRETCH_MIN_FRET;
  if (span > MAX_SPAN && !stretchOk) reasons.push(`stretches ${span + 1} frets`);
  if (maxFret > MAX_FRET) reasons.push('above the 15th fret');

  const plan = planFingers(frets);
  if (plan.count === Infinity) reasons.push('fingers over-stretch or needs more than 4');
  else if (plan.count > MAX_FINGERS) reasons.push(`needs ${plan.count} fingers`);

  const startFret = maxFret <= DIAGRAM_ROWS ? undefined : minFret;

  const openCount = sounding.filter(n => n.f === 0).length;
  const bassString = sounding[0]?.s ?? 0;
  const score =
    (Number.isFinite(plan.count) ? plan.count : 10) * 1.0 +
    span * 1.5 +
    minFret * 0.15 +
    interiorMutes * 3 +
    (6 - sounding.length) * 0.8 +
    Math.max(0, bassString - 1) * 1.5 +
    (plan.barreAt !== undefined ? 0.5 : 0) +
    (span > MAX_SPAN ? 3 : 0) -
    openCount * 0.3;

  return {
    ok: reasons.length === 0,
    reasons,
    fingers: plan.fingers,
    barreAt: plan.barreAt,
    startFret,
    score,
  };
}

/** Whether a stored fingering puts every dot inside a 5-row diagram. */
export function fitsDiagram(f: GuitarFingering): boolean {
  const offset = f.startFret && f.startFret > 1 ? f.startFret - 1 : 0;
  return f.frets.every(fr => fr <= 0 || (fr - offset >= 1 && fr - offset <= DIAGRAM_ROWS));
}

// Two separate fingers on one fret, 3+ strings apart, with two or more
// lower-fretted notes between them: the hand has to split around its own
// fingers (e.g. 7 5 4 7 7 7). One note between is a normal diagonal grip, as
// in the maj9 shape x 3 2 4 3 x. Only generated shapes are filtered, since
// some standard open shapes (the G chord) break this rule.
function isSplitGrip(frets: number[], fingers: number[]): boolean {
  const groups = new Map<number, number[]>(); // finger → strings
  fingers.forEach((f, s) => { if (f > 0) groups.set(f, [...(groups.get(f) ?? []), s]); });
  const list = [...groups.values()];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const fret = frets[list[i][0]];
      if (frets[list[j][0]] !== fret) continue;
      const lo = Math.min(...list[i], ...list[j]);
      const hi = Math.max(...list[i], ...list[j]);
      const spread = Math.min(...list[j]) > Math.max(...list[i])
        ? Math.min(...list[j]) - Math.max(...list[i])
        : Math.min(...list[i]) - Math.max(...list[j]);
      if (spread < 3) continue;
      if (frets.slice(lo + 1, hi).filter(f => f > 0 && f < fret).length >= 2) return true;
    }
  }
  return false;
}

// A partial index barre with a note on a thicker string, 2+ frets above it:
// that note has to be reached over the base of the index finger (C13 as
// 8 5 8 5 5 5). One fret above is the normal 7b9 grip, x 3 2 3 2 x.
function isOverBarre(frets: number[], fingers: number[], barreAt?: number): boolean {
  if (barreAt === undefined) return false;
  const barreFrom = fingers.findIndex(f => f === 1);
  return frets.slice(0, barreFrom).some(f => f >= barreAt + 2);
}

// Generated shapes only mix open strings with fretted notes in open position
// (within the first 5 frets). Higher up, an open string makes a shape nobody
// would read off a chart, and the diagram can't show the nut.
const OPEN_POSITION_MAX_FRET = 5;

/**
 * Search the neck for playable voicings of a chord, easiest first. Each result
 * sits in a clearly different place (bass string or position) from the others.
 */
export function generateVoicings(
  spec: ChordSpec,
  tuning: number[],
  limit: number,
  avoid: number[][] = [],
  { allowStretch = false }: AssessOptions = {},
): GuitarFingering[] {
  const tones = chordTones(spec);
  const found = new Map<string, { frets: number[]; a: VoicingAssessment }>();
  const span = allowStretch ? STRETCH_SPAN : MAX_SPAN;

  for (let windowStart = 1; windowStart <= MAX_FRET - span; windowStart++) {
    // Per string: mute, open (if it's a chord tone), or a chord tone in the window
    const openAllowed = windowStart + span <= OPEN_POSITION_MAX_FRET;
    const options = tuning.map(open => {
      const opts = [-1];
      if (openAllowed && tones.allowed.has(open % 12)) opts.push(0);
      for (let f = windowStart; f <= windowStart + span; f++) {
        if (tones.allowed.has((open + f) % 12)) opts.push(f);
      }
      return opts;
    });

    const frets = new Array(6).fill(-1);
    const walk = (s: number, bassPlaced: boolean) => {
      if (s === 6) {
        if (!bassPlaced) return;
        const key = frets.join(',');
        if (found.has(key)) return;
        const a = assessVoicing(frets, spec, tuning, { allowStretch });
        if (!a.ok || isSplitGrip(frets, a.fingers) || isOverBarre(frets, a.fingers, a.barreAt)) return;
        found.set(key, { frets: [...frets], a });
        return;
      }
      for (const f of options[s]) {
        // Until the bass is placed, a sounding string has to be the bass note
        if (!bassPlaced && f >= 0 && !tones.bassPcs.has((tuning[s] + f) % 12)) continue;
        // The bass must sit on one of the three lowest strings
        if (!bassPlaced && s > 2 && f < 0) return;
        frets[s] = f;
        walk(s + 1, bassPlaced || f >= 0);
      }
      frets[s] = -1;
    };
    walk(0, false);
  }

  const avoidKeys = new Set(avoid.map(f => f.join(',')));
  const ranked = [...found.values()]
    .filter(v => !avoidKeys.has(v.frets.join(',')))
    .sort((x, y) => x.a.score - y.a.score);

  // Keep results spread out: skip a shape too close to one already taken
  const position = (fr: number[]) => {
    const pressed = fr.filter(f => f > 0);
    return { bass: fr.findIndex(f => f >= 0), low: pressed.length ? Math.min(...pressed) : 0 };
  };
  const taken = avoid.map(position);
  const chosen: typeof ranked = [];
  for (const v of ranked) {
    if (chosen.length >= limit) break;
    const p = position(v.frets);
    if (taken.some(t => t.bass === p.bass && Math.abs(t.low - p.low) <= 2)) continue;
    taken.push(p);
    chosen.push(v);
  }
  // Not enough distinct positions (a sparse chord) — take the next best anyway
  for (const v of ranked) {
    if (chosen.length >= limit) break;
    if (!chosen.includes(v)) chosen.push(v);
  }

  return chosen.map(v => {
    const fingering: GuitarFingering = { frets: v.frets, fingers: v.a.fingers };
    if (v.a.barreAt !== undefined) fingering.barreAt = v.a.barreAt;
    if (v.a.startFret !== undefined) fingering.startFret = v.a.startFret;
    return fingering;
  });
}
