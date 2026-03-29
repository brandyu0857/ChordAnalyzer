import { getNoteAtInterval } from '../data/notes';
import { CHORD_TYPES } from '../data/chords';
import type { Locale } from '../i18n/context';

export type SubstitutionCategory =
  | 'relative'    // 关系调替代
  | 'tritone'     // 三全音替代
  | 'extension'   // 延伸音版本
  | 'parallel'    // 同名调借用
  | 'diminished'  // 减和弦替代
  | 'sus'         // 暂留和弦
  | 'borrowed';   // 借用和弦

export interface SubstitutionSuggestion {
  root: string;
  type: string;
  display: string;
  category: SubstitutionCategory;
  categoryLabel: string;
  explanation: string;
}

export const CATEGORY_LABELS: Record<SubstitutionCategory, string> = {
  relative:   '关系调替代',
  tritone:    '三全音替代',
  extension:  '延伸音版本',
  parallel:   '同名调借用',
  diminished: '减和弦替代',
  sus:        '暂留和弦',
  borrowed:   '借用和弦',
};

export const CATEGORY_LABELS_EN: Record<SubstitutionCategory, string> = {
  relative:   'Relative Key',
  tritone:    'Tritone Sub',
  extension:  'Extension',
  parallel:   'Parallel Key',
  diminished: 'Diminished Sub',
  sus:        'Suspended',
  borrowed:   'Borrowed',
};

export const CATEGORY_STYLES: Record<SubstitutionCategory, string> = {
  relative:   'bg-gray-100 text-gray-600',
  tritone:    'bg-gray-900 text-white',
  extension:  'bg-gray-50 text-gray-500 border border-gray-200',
  parallel:   'bg-gray-200 text-gray-700',
  diminished: 'bg-gray-700 text-white',
  sus:        'bg-gray-100 text-gray-500',
  borrowed:   'bg-gray-300 text-gray-800',
};

function disp(root: string, type: string): string {
  const ct = CHORD_TYPES[type];
  return ct ? root + ct.symbol : root;
}

// relative minor root = up 9 semitones (= down 3)
// relative major root = up 3 semitones
function relMin(root: string) { return getNoteAtInterval(root, 9); }
function relMaj(root: string) { return getNoteAtInterval(root, 3); }
function tri(root: string)    { return getNoteAtInterval(root, 6); }
function maj3(root: string)   { return getNoteAtInterval(root, 4); }

export function getSubstitutions(root: string, type: string, locale: Locale = 'en'): SubstitutionSuggestion[] {
  const results: SubstitutionSuggestion[] = [];
  const isEn = locale === 'en';
  const labels = isEn ? CATEGORY_LABELS_EN : CATEGORY_LABELS;

  const add = (
    newRoot: string,
    newType: string,
    category: SubstitutionCategory,
    zhExplanation: string,
    enExplanation: string,
  ) => {
    if (newRoot === root && newType === type) return; // skip self
    if (!CHORD_TYPES[newType]) return;               // skip unsupported types
    results.push({
      root: newRoot,
      type: newType,
      display: disp(newRoot, newType),
      category,
      categoryLabel: labels[category],
      explanation: isEn ? enExplanation : zhExplanation,
    });
  };

  switch (type) {
    case 'major':
      add(relMin(root), 'minor', 'relative',
        `${relMin(root)}m 与 ${root} 共享两个相同的音，听感相近但色彩偏暗，制造情绪对比`,
        `${relMin(root)}m shares two notes with ${root}, similar sound but darker color for emotional contrast`);
      add(root, 'maj7', 'extension',
        `加入大七音，${root}maj7 比 ${root} 更柔和优雅，常见于流行和爵士慢歌`,
        `Adding the major 7th, ${root}maj7 is softer and more elegant than ${root}, common in pop and jazz ballads`);
      add(root, 'add9', 'extension',
        `加入九音但保留三音，比 ${root} 更饱满，现代流行吉他伴奏常用`,
        `Adding the 9th while keeping the 3rd, fuller than ${root}, common in modern pop guitar`);
      add(root, 'minor', 'parallel',
        `借用同名小调的 ${root}m，在明亮段落突然转暗，制造强烈的戏剧张力`,
        `Borrowing ${root}m from the parallel minor, suddenly darkening a bright passage for dramatic tension`);
      add(root, 'sus4', 'sus',
        `三音被四音取代，产生悬浮感，后接 ${root} 大三和弦时有明显解决感`,
        `The 3rd is replaced by the 4th creating suspension, resolves naturally to ${root} major`);
      break;

    case 'minor':
      add(relMaj(root), 'major', 'relative',
        `${relMaj(root)} 是 ${root}m 的关系大调，共享两个音，听感更明亮积极`,
        `${relMaj(root)} is the relative major of ${root}m, shares two notes, brighter and more uplifting`);
      add(root, 'm7', 'extension',
        `加入小七音，${root}m7 色彩更丰富，爵士、R&B 和现代流行中常用`,
        `Adding the minor 7th, ${root}m7 has richer color, common in jazz, R&B, and modern pop`);
      add(root, 'm6', 'extension',
        `加入大六音，带来复古温暖的气息，Bossa Nova 和爵士中的经典用法`,
        `Adding the major 6th for a vintage warmth, classic in Bossa Nova and jazz`);
      add(root, 'major', 'parallel',
        `同名大调 ${root}，将小调的忧郁色彩突然转为明亮，常见于歌曲高潮`,
        `Parallel major ${root}, suddenly shifts from minor melancholy to brightness, common in choruses`);
      break;

    case '7':
      add(tri(root), '7', 'tritone',
        `三全音替代：${tri(root)}7 与 ${root}7 共享相同的 tritone 音程（3 音与 7 音互换），解决方向完全一致`,
        `Tritone sub: ${tri(root)}7 shares the same tritone interval with ${root}7 (3rd and 7th swap), resolves identically`);
      add(maj3(root), 'dim7', 'diminished',
        `${maj3(root)}dim7 包含 ${root}7 中所有的引导音，属和弦的减七替代，紧张感更强烈`,
        `${maj3(root)}dim7 contains all leading tones of ${root}7, diminished substitute for dominant, more intense tension`);
      add(root, '9', 'extension',
        `加入九音，${root}9 比 ${root}7 色彩更丰富，爵士和放克中广泛使用`,
        `Adding the 9th, ${root}9 has richer color than ${root}7, widely used in jazz and funk`);
      add(root, 'sus4', 'sus',
        `4 音暂时替代 3 音，减弱属和弦的紧张感，解决时过渡更温柔自然`,
        `The 4th temporarily replaces the 3rd, softening dominant tension for a gentler resolution`);
      break;

    case 'maj7':
      add(relMin(root), 'm7', 'relative',
        `关系小七和弦 ${relMin(root)}m7，与 ${root}maj7 共享三个音，色彩相近但更内敛`,
        `Relative minor 7th ${relMin(root)}m7, shares three notes with ${root}maj7, similar color but more subdued`);
      add(root, '6', 'extension',
        `${root}6 比 ${root}maj7 更轻盈明亮，去掉了七音的厚重感`,
        `${root}6 is lighter and brighter than ${root}maj7, removing the heaviness of the 7th`);
      add(root, 'add9', 'extension',
        `加入九音，在明亮感上的另一种延伸方向，色彩更为开阔`,
        `Adding the 9th, another extension direction from brightness, more open color`);
      add(root, 'major', 'extension',
        `去掉七音，简化为基础 ${root} 大三和弦，听感更直接有力`,
        `Removing the 7th, simplified to basic ${root} major triad, more direct and powerful`);
      break;

    case 'm7':
      add(relMaj(root), 'maj7', 'relative',
        `关系大七和弦 ${relMaj(root)}maj7，与 ${root}m7 共享三个音，色彩更明亮开朗`,
        `Relative major 7th ${relMaj(root)}maj7, shares three notes with ${root}m7, brighter and more cheerful`);
      add(root, 'minor', 'extension',
        `去掉七音，${root}m 听感更有力直接，适合需要稳定感的段落`,
        `Removing the 7th, ${root}m is more direct and powerful, suitable for stable passages`);
      add(root, 'm6', 'extension',
        `将小七音换为大六音，带来更温暖复古的色彩`,
        `Replacing the minor 7th with the major 6th for warmer, vintage color`);
      add(root, 'm7b5', 'borrowed',
        `半减七和弦，加入减五音使紧张感增加，爵士 ii° 级常用`,
        `Half-diminished 7th, adding the b5 increases tension, common as jazz ii° chord`);
      break;

    case 'dim':
      add(getNoteAtInterval(root, 2), '7', 'borrowed',
        `${getNoteAtInterval(root, 2)}7 是 ${root}dim 最常见的来源属和弦，可互相替代`,
        `${getNoteAtInterval(root, 2)}7 is the most common source dominant for ${root}dim, interchangeable`);
      add(root, 'dim7', 'extension',
        `加入减七音，${root}dim7 比 ${root}dim 更完整对称，紧张感更强`,
        `Adding the diminished 7th, ${root}dim7 is more complete and symmetrical, greater tension`);
      add(root, 'm7b5', 'borrowed',
        `半减七和弦，情感比全减和弦更复杂微妙`,
        `Half-diminished 7th, emotionally more complex and nuanced than fully diminished`);
      break;

    case 'dim7':
      add(getNoteAtInterval(root, 2), '7', 'diminished',
        `${getNoteAtInterval(root, 2)}7 是减七和弦最常见的属和弦来源，将极度紧张转回属和弦色彩`,
        `${getNoteAtInterval(root, 2)}7 is the most common dominant source for dim7, easing extreme tension back to dominant color`);
      add(getNoteAtInterval(root, 5), '7', 'diminished',
        `减七和弦具有对称性，可替代多个属七和弦，${getNoteAtInterval(root, 5)}7 是其中之一`,
        `Dim7 chords are symmetrical and can substitute multiple dominant 7ths, ${getNoteAtInterval(root, 5)}7 is one of them`);
      add(getNoteAtInterval(root, 9), 'm7b5', 'borrowed',
        `半减七和弦，比全减七和弦情感更复杂微妙，爵士常用`,
        `Half-diminished 7th, emotionally more nuanced than fully diminished, common in jazz`);
      break;

    case 'sus2':
      add(root, 'major', 'sus',
        `还原三音，从 ${root}sus2 自然解决到 ${root} 大三和弦`,
        `Restoring the 3rd, naturally resolves from ${root}sus2 to ${root} major`);
      add(root, 'sus4', 'sus',
        `将二音换为四音，悬浮感更强，解决到 ${root} 时更有力度`,
        `Replacing the 2nd with the 4th, stronger suspension, more powerful resolution to ${root}`);
      add(root, 'add9', 'extension',
        `${root}add9 同样包含九音，但多了三音，色彩接近却更有重量感`,
        `${root}add9 also contains the 9th but adds the 3rd, similar color but heavier`);
      break;

    case 'sus4':
      add(root, 'major', 'sus',
        `经典的 sus4 → 大三和弦解决，制造强烈的期待与释放感`,
        `Classic sus4 → major resolution, creating strong anticipation and release`);
      add(root, 'sus2', 'sus',
        `将四音换为二音，悬浮感更轻盈空灵`,
        `Replacing the 4th with the 2nd, lighter and more ethereal suspension`);
      add(root, '7', 'borrowed',
        `${root}7 提供类似但更有方向感的紧张度，属和弦功能更明显`,
        `${root}7 provides similar but more directional tension, stronger dominant function`);
      break;

    case 'aug':
      add(root, 'major', 'extension',
        `去掉增五音，还原为基础 ${root} 大三和弦`,
        `Removing the augmented 5th, returning to basic ${root} major triad`);
      add(root, '7', 'borrowed',
        `${root}7 是增和弦的常见前后搭配和弦，增 → 属 → 主 是经典进行`,
        `${root}7 commonly pairs with augmented chords, aug → dom → tonic is a classic progression`);
      add(maj3(root), 'major', 'borrowed',
        `增和弦的增五音是 ${maj3(root)} 的根音，可理解为向 ${maj3(root)} 的导向`,
        `The augmented 5th is the root of ${maj3(root)}, can be understood as leading toward ${maj3(root)}`);
      break;

    case 'm7b5':
      add(getNoteAtInterval(root, 3), 'minor', 'relative',
        `关系小调 ${getNoteAtInterval(root, 3)}m，是 ${root}m7b5 最常见的解决目标`,
        `Relative minor ${getNoteAtInterval(root, 3)}m, the most common resolution target for ${root}m7b5`);
      add(getNoteAtInterval(root, 10), '7', 'borrowed',
        `${getNoteAtInterval(root, 10)}7 是对应的属七和弦，半减七常作为 ii° 接 V 的进行`,
        `${getNoteAtInterval(root, 10)}7 is the corresponding dominant 7th, half-diminished often serves as ii° → V`);
      add(root, 'dim7', 'extension',
        `全减七和弦，比半减七紧张感更强，对称性更高`,
        `Fully diminished 7th, more tension and symmetry than half-diminished`);
      break;

    case 'add9':
      add(root, 'major', 'extension',
        `去掉九音，简化为基础 ${root} 大三和弦，听感更简洁`,
        `Removing the 9th, simplified to basic ${root} major triad, cleaner sound`);
      add(root, 'maj7', 'extension',
        `换为大七和弦，色彩向内收敛，梦幻感更强`,
        `Switching to major 7th, inward color shift, more dreamy feel`);
      add(root, 'sus2', 'sus',
        `去掉三音，${root}sus2 与 add9 音高接近但三音的缺失带来更强的悬浮感`,
        `Removing the 3rd, ${root}sus2 is close in pitch to add9 but the missing 3rd creates stronger suspension`);
      break;

    case '6':
      add(root, 'major', 'extension',
        `去掉六音，简化为基础 ${root} 大三和弦`,
        `Removing the 6th, simplified to basic ${root} major triad`);
      add(root, 'maj7', 'extension',
        `换为大七和弦，方向感相近但七音的色彩更柔和飘逸`,
        `Switching to major 7th, similar direction but the 7th adds a softer, dreamier color`);
      add(relMin(root), 'm7', 'relative',
        `关系小七和弦 ${relMin(root)}m7，与 ${root}6 共享完全相同的四个音（转位关系）`,
        `Relative minor 7th ${relMin(root)}m7, shares exactly the same four notes as ${root}6 (inversion relationship)`);
      break;

    case 'm6':
      add(root, 'minor', 'extension',
        `去掉六音，简化为基础 ${root}m 小三和弦，听感更稳定`,
        `Removing the 6th, simplified to basic ${root}m minor triad, more stable sound`);
      add(root, 'm7', 'extension',
        `将大六音换为小七音，爵士气息从复古转为更现代`,
        `Replacing the major 6th with the minor 7th, shifting from vintage to modern jazz feel`);
      break;

    case '9':
      add(root, '7', 'extension',
        `去掉九音，简化为属七和弦，紧张感更集中直接`,
        `Removing the 9th, simplified to dominant 7th, more focused and direct tension`);
      add(tri(root), '9', 'tritone',
        `三全音替代：${tri(root)}9 与 ${root}9 解决方向一致，色彩更为意外`,
        `Tritone sub: ${tri(root)}9 resolves in the same direction as ${root}9, with a more unexpected color`);
      add(root, 'sus4', 'sus',
        `4 音替代 3 音，属和弦的暂留版本，解决感更温和`,
        `The 4th replaces the 3rd, suspended version of the dominant, gentler resolution`);
      break;

    default:
      add(root, 'major', 'extension',
        `基础大三和弦，最稳定的出发点`,
        `Basic major triad, the most stable starting point`);
      add(root, 'minor', 'parallel',
        `同名小调，提供色彩对比`,
        `Parallel minor, provides color contrast`);
      break;
  }

  return results;
}
