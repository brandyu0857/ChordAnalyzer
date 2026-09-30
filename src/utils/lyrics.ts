/* ─── Lyrics lookup ────────────────────────────────────────────────────────
 * Finds lyrics for a YouTube video on LRCLIB (lrclib.net), a free, open
 * lyrics database whose entries often carry per-line timestamps (LRC). The
 * timestamps let the editor follow the song line by line.
 *
 * The video title is noisy ("周杰倫【告白氣球】Official MV"), so several
 * queries are derived from it, and results are ranked by how well the track
 * name matches the title and how close its length is to the video's.
 * ------------------------------------------------------------------------ */

export interface LyricsResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;          // seconds
  instrumental?: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface ImportedLyrics {
  lines: string[];
  times: (number | null)[] | null;  // per line, null when the source isn't synced
  source: LyricsResult;
}

export interface RankedResult {
  result: LyricsResult;
  score: number;
  titleMatch: number;        // 0–1, share of the track name found in the video title
}

const LRCLIB_SEARCH = 'https://lrclib.net/api/search';

// Words in a video title that describe the upload rather than the song
const NOISE = /official|music\s*video|\bm\/?v\b|lyrics?|lyric\s*video|\baudio\b|\bhd\b|\bhq\b|\b4k\b|1080p|visualizer|karaoke|\bktv\b|teaser|premiere|官方|高畫質|高画质|完整版|動態歌詞|动态歌词|歌詞|歌词|字幕|伴奏|純音樂|纯音乐|中字|拼音/i;

const BRACKETS = /[(（[【《「『]([^)）\]】》」』]*)[)）\]】》」』]/g;

const hasCjk = (s: string) => /[\u3040-\u9fff]/.test(s);
// "告白氣球 Love Confession" → "告白氣球": bilingual titles search better
// with the Chinese part alone
const cjkOnly = (s: string) => s.replace(/[A-Za-z][A-Za-z'’.&\s]*/g, ' ').replace(/\s+/g, ' ').trim();

/** Search queries to try for a video, best guess first (at most 4). */
export function buildQueries(title: string, author = ''): string[] {
  const inside: string[] = [];
  const outside = title.replace(BRACKETS, (_, text: string) => {
    if (text.trim() && !NOISE.test(text)) inside.push(text.trim());
    return ' ';
  });

  const clean = (s: string) => s
    .split(/\s+[-–—|｜~]\s+|[|｜]/)
    .map(part => part.replace(new RegExp(NOISE.source, 'gi'), ' ').replace(/\bfeat\.?.*$/i, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rest = clean(outside);
  // Auto-generated music channels are called "<Artist> - Topic"
  const topicArtist = author.match(/^(.*?)\s*-\s*Topic$/i)?.[1] ?? '';

  const bilingual = (t: string) => hasCjk(t) && /[A-Za-z]/.test(t);
  const queries = [
    ...inside.flatMap(song => bilingual(song) || bilingual(rest)
      ? [`${cjkOnly(clean(song))} ${cjkOnly(rest)}`.trim(), cjkOnly(clean(song))]
      : []),
    ...inside.map(song => `${clean(song)} ${rest}`.trim()),
    ...inside.map(song => clean(song)),
    ...(bilingual(rest) ? [cjkOnly(rest)] : []),
    [rest, topicArtist].filter(Boolean).join(' '),
  ];
  return [...new Set(queries.filter(q => q.length >= 2))].slice(0, 4);
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!(res.headers.get('content-type') ?? '').includes('json')) throw new Error('not JSON');
  return res.json();
}

// Traditional → Simplified Chinese, loaded only when a query contains Chinese:
// a Taiwanese or Hong Kong upload titled 竇靖童 空中飛人 is usually stored in
// the lyrics database as 窦靖童 空中飞人. (The reverse converter is ~10x the
// size — about 470 KB gzipped — so Simplified titles aren't tried in
// Traditional.)
type Convert = (s: string) => string;
let toSimplifiedPromise: Promise<Convert | null> | null = null;
function loadToSimplified(): Promise<Convert | null> {
  toSimplifiedPromise ??= import('opencc-js/t2cn')
    .then(m => m.Converter({ from: 'tw', to: 'cn' }))
    .catch(() => null);
  return toSimplifiedPromise;
}

/** The query as written, then in Simplified Chinese if that differs. */
export async function scriptVariants(query: string): Promise<string[]> {
  if (!hasCjk(query)) return [query];
  const toSimplified = await loadToSimplified();
  return [...new Set([query, ...(toSimplified ? [toSimplified(query)] : [])])];
}

/** One LRCLIB search. Uses the site's /api/lyrics proxy when deployed, and
 *  calls LRCLIB directly otherwise (local dev has no /api). */
export async function searchLyrics(query: string, signal?: AbortSignal): Promise<LyricsResult[]> {
  const q = encodeURIComponent(query);
  let data: unknown;
  try {
    data = await fetchJson(`/api/lyrics?q=${q}`, signal);
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    data = await fetchJson(`${LRCLIB_SEARCH}?q=${q}`, signal);
  }
  return Array.isArray(data) ? (data as LyricsResult[]).filter(r => !r.instrumental) : [];
}

const normalize = (s: string) => s.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

// Share of the track name that appears in the title: per character for CJK
// (so 告白氣球 still matches 告白气球 at 3/4), per word otherwise.
function titleMatch(trackName: string, title: string): number {
  const t = normalize(title);
  const track = normalize(trackName);
  if (!track) return 0;
  if (t.includes(track)) return 1;
  if (/[぀-鿿]/.test(trackName)) {
    const chars = [...track];
    return chars.filter(c => t.includes(c)).length / chars.length;
  }
  const words = trackName.toLowerCase().split(/\s+/).map(normalize).filter(Boolean);
  return words.length ? words.filter(w => t.includes(w)).length / words.length : 0;
}

export function rankResults(results: LyricsResult[], title: string, author: string, videoDuration: number): RankedResult[] {
  const seen = new Set<number>();
  return results
    .filter(r => !seen.has(r.id) && seen.add(r.id) && (r.syncedLyrics || r.plainLyrics))
    .map(result => {
      const match = titleMatch(result.trackName, title);
      const artistHit = titleMatch(result.artistName, `${title} ${author}`) >= 0.6;
      const diff = videoDuration > 0 ? Math.abs(result.duration - videoDuration) : Infinity;
      const score =
        match * 4 +
        (artistHit ? 1.5 : 0) +
        (result.syncedLyrics ? 1.5 : 0) +
        (diff <= 3 ? 3 : diff <= 8 ? 2 : diff <= 20 ? 1 : 0);
      return { result, score, titleMatch: match };
    })
    .sort((a, b) => b.score - a.score);
}

/** Whether the best result is confident enough to import without asking. */
export function isConfidentMatch(r: RankedResult | undefined): boolean {
  return !!r && r.titleMatch >= 0.6 && r.score >= 5;
}

/** Search with each query derived from the video until one returns results. */
export async function findLyricsForVideo(
  title: string, author: string, videoDuration: number, signal?: AbortSignal,
): Promise<RankedResult[]> {
  // Rank against the title in both scripts so 空中飞人 matches 空中飛人
  const matchTitle = (await scriptVariants(title)).join(' ');
  const all: LyricsResult[] = [];
  for (const query of buildQueries(title, author)) {
    for (const q of await scriptVariants(query)) {
      all.push(...await searchLyrics(q, signal));
      const ranked = rankResults(all, matchTitle, author, videoDuration);
      if (isConfidentMatch(ranked[0])) return ranked;
    }
  }
  return rankResults(all, matchTitle, author, videoDuration);
}

/** A search the user typed, tried in both Chinese scripts. */
export async function searchLyricsByName(query: string, videoDuration: number, signal?: AbortSignal): Promise<RankedResult[]> {
  const variants = await scriptVariants(query);
  const all: LyricsResult[] = [];
  for (const q of variants) all.push(...await searchLyrics(q, signal));
  return rankResults(all, variants.join(' '), '', videoDuration);
}

/** Parse LRC text into timed lines. A line with several stamps (a repeated
 *  chorus) appears once per stamp; empty lines (instrumental gaps) are dropped. */
export function parseLrc(lrc: string): { time: number; text: string }[] {
  const out: { time: number; text: string }[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    if (!text) continue;
    for (const m of stamps) out.push({ time: Number(m[1]) * 60 + Number(m[2]), text });
  }
  return out.sort((a, b) => a.time - b.time);
}

/** Turn a search result into editor lines, with timestamps when available. */
export function toImportedLyrics(result: LyricsResult): ImportedLyrics | null {
  if (result.syncedLyrics) {
    const timed = parseLrc(result.syncedLyrics);
    if (timed.length) {
      return { lines: timed.map(l => l.text), times: timed.map(l => l.time), source: result };
    }
  }
  if (result.plainLyrics) {
    const lines = result.plainLyrics.split(/\r?\n/).map(l => l.trim());
    // Keep single blank lines as section breaks, drop the rest
    const compact = lines.filter((l, i) => l || (i > 0 && lines[i - 1]));
    return { lines: compact, times: null, source: result };
  }
  return null;
}

/**
 * Pair each line of edited lyrics with the line it came from. Lines with the
 * same text match in order, however many lines were removed or added around
 * them (longest common subsequence); where the same number of lines sit
 * between two matches, they're taken as edited in place (a typo fixed) and
 * paired too. Returns, for each new line, the old line's index, or null for a
 * line that's new.
 */
export function alignLines(oldLines: string[], newLines: string[]): (number | null)[] {
  const a = oldLines.map(l => l.trim());
  const b = newLines.map(l => l.trim());
  const n = a.length, m = b.length;
  // common[i][j]: length of the longest common run of a[i..] and b[j..]
  const common = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }
  const out: (number | null)[] = new Array(m).fill(null);
  const pairGap = (i0: number, i1: number, j0: number, j1: number) => {
    if (i1 - i0 === j1 - j0) for (let k = 0; k < j1 - j0; k++) out[j0 + k] = i0 + k;
  };
  let i = 0, j = 0, gapI = 0, gapJ = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairGap(gapI, i, gapJ, j);
      out[j] = i;
      gapI = ++i;
      gapJ = ++j;
    } else if (common[i + 1][j] >= common[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  pairGap(gapI, n, gapJ, m);
  return out;
}

/**
 * Carry line timestamps across a lyrics edit: each new line takes the time of
 * the line it came from (see alignLines), or null when it's new.
 */
export function remapLineTimes(oldLines: string[], oldTimes: (number | null)[] | null, newLines: string[]): (number | null)[] | null {
  if (!oldTimes) return null;
  const out = alignLines(oldLines, newLines).map(i => (i === null ? null : oldTimes[i] ?? null));
  return out.some(t => t !== null) ? out : null;
}

/**
 * Carry things placed on lines (chords) across a lyrics edit: each moves with
 * its line; those on removed lines go, and a character position past the end
 * of an edited line moves to its last character.
 */
export function remapLinePlacements<T extends { line: number; charIndex: number }>(oldLines: string[], items: T[], newLines: string[]): T[] {
  const newIndex = new Map<number, number>();
  alignLines(oldLines, newLines).forEach((oldI, newI) => { if (oldI !== null) newIndex.set(oldI, newI); });
  return items.flatMap(item => {
    const line = newIndex.get(item.line);
    if (line === undefined) return [];
    const length = newLines[line].length;
    if (!length) return [];
    return [{ ...item, line, charIndex: Math.min(item.charIndex, length - 1) }];
  });
}
