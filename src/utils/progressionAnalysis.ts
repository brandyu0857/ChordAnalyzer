import type { ParsedChord } from './chordUtils';
import { getChordNotes, findChordDegree } from './chordUtils';
import { getSemitoneDifference } from '../data/notes';
import type { Locale } from '../i18n/context';

export type ChordFunction = 'tonic' | 'dominant' | 'subdominant' | 'borrowed' | 'secondary' | 'unknown';

export interface ChordAnalysis {
  chord: ParsedChord;
  degree: string;
  degreeDisplay: string;
  function: ChordFunction;
  functionLabel: string;
  functionDescription: string;
  isNatural: boolean;
}

export interface ConnectionAnalysis {
  fromChord: ParsedChord;
  toChord: ParsedChord;
  commonNotes: string[];
  rootMotion: number;
  rootMotionDirection: string;
  connectionType: string;
  connectionDescription: string;
  tension: 'smooth' | 'moderate' | 'strong';
}

const FUNCTION_MAP: Record<string, { func: ChordFunction; label: string; labelEn: string; desc: string; descEn: string }> = {
  'I': { func: 'tonic', label: '主功能', labelEn: 'Tonic', desc: '调性中心，最稳定的和弦，给人"回家"的感觉', descEn: 'Tonal center, the most stable chord, gives a sense of "coming home"' },
  'ii': { func: 'subdominant', label: '下属功能', labelEn: 'Subdominant', desc: '温和的过渡和弦，常引向属和弦', descEn: 'Gentle transitional chord, often leads to the dominant' },
  'iii': { func: 'tonic', label: '主功能(弱)', labelEn: 'Tonic (weak)', desc: '与主和弦共享两个音，可作为主功能的替代', descEn: 'Shares two notes with the tonic, can serve as a tonic substitute' },
  'IV': { func: 'subdominant', label: '下属功能', labelEn: 'Subdominant', desc: '次要稳定点，常用于过渡到属和弦', descEn: 'Secondary stability point, commonly transitions to the dominant' },
  'V': { func: 'dominant', label: '属功能', labelEn: 'Dominant', desc: '最强的张力和弦，强烈倾向于解决到主和弦', descEn: 'Strongest tension chord, strongly tends to resolve to the tonic' },
  'vi': { func: 'tonic', label: '主功能(弱)', labelEn: 'Tonic (weak)', desc: '主和弦的关系小调，可替代主功能', descEn: 'Relative minor of the tonic, can substitute for tonic function' },
  'VII': { func: 'dominant', label: '属功能(弱)', labelEn: 'Dominant (weak)', desc: '包含导音，有向主和弦解决的倾向', descEn: 'Contains the leading tone, tends to resolve to the tonic' },
};

export function analyzeChordInKey(chord: ParsedChord, key: string, locale: Locale = 'en'): ChordAnalysis {
  const isEn = locale === 'en';
  const degreeInfo = findChordDegree(chord.root, key);

  if (!degreeInfo) {
    return {
      chord,
      degree: '?',
      degreeDisplay: '?',
      function: 'unknown',
      functionLabel: isEn ? 'Unknown' : '未知',
      functionDescription: isEn ? 'Cannot determine the function of this chord in the current key' : '无法确定此和弦在当前调性中的功能',
      isNatural: false,
    };
  }

  const { degree, isNatural } = degreeInfo;
  const isMinor = chord.type === 'minor' || chord.type === 'm7' || chord.type === 'm6';
  const degreeDisplay = isMinor ? degree.toLowerCase() : degree;

  // Check if natural diatonic chord
  if (isNatural) {
    const funcInfo = FUNCTION_MAP[degreeDisplay] || FUNCTION_MAP[degree];
    if (funcInfo) {
      return {
        chord,
        degree: degreeDisplay,
        degreeDisplay,
        function: funcInfo.func,
        functionLabel: isEn ? funcInfo.labelEn : funcInfo.label,
        functionDescription: isEn ? funcInfo.descEn : funcInfo.desc,
        isNatural: true,
      };
    }
  }

  // Borrowed chord or chromatic
  if (degree.startsWith('b')) {
    const borrowedDescs: Record<string, { zh: string; en: string }> = {
      'bVII': { zh: '从混合利底亚调式借用，给摇滚音乐带来力量感', en: 'Borrowed from Mixolydian mode, brings power to rock music' },
      'bIII': { zh: '从同主音小调借用，增添暗色彩', en: 'Borrowed from parallel minor, adds dark color' },
      'bVI': { zh: '从同主音小调借用，带来戏剧性的意外感', en: 'Borrowed from parallel minor, brings dramatic surprise' },
      'bII': { zh: '那不勒斯和弦，常用于终止式前的色彩变化', en: 'Neapolitan chord, commonly used for color before cadences' },
    };
    const bd = borrowedDescs[degree];
    return {
      chord,
      degree: degreeDisplay,
      degreeDisplay,
      function: 'borrowed',
      functionLabel: isEn ? 'Borrowed' : '借用和弦',
      functionDescription: bd ? (isEn ? bd.en : bd.zh) : (isEn ? 'Chord borrowed from a parallel key or mode' : '从平行调或其他调式借用的和弦'),
      isNatural: false,
    };
  }

  return {
    chord,
    degree: degreeDisplay,
    degreeDisplay,
    function: 'unknown',
    functionLabel: isEn ? 'Color Chord' : '色彩和弦',
    functionDescription: isEn ? 'Adds color variation to the progression' : '为和弦进行增添色彩变化',
    isNatural: false,
  };
}

export function analyzeConnection(from: ParsedChord, to: ParsedChord, key: string, locale: Locale = 'en'): ConnectionAnalysis {
  const isEn = locale === 'en';
  const fromNotes = getChordNotes(from.root, from.type);
  const toNotes = getChordNotes(to.root, to.type);
  const commonNotes = fromNotes.filter(n => toNotes.includes(n));

  const rootMotion = getSemitoneDifference(from.root, to.root);
  const rootMotionDown = rootMotion > 6 ? rootMotion - 12 : rootMotion;

  let rootMotionDirection: string;
  if (rootMotion === 0) rootMotionDirection = isEn ? 'Same root' : '同根音';
  else if (rootMotion === 7 || rootMotion === 5)
    rootMotionDirection = rootMotion === 7
      ? (isEn ? 'Up P5' : '上行纯五度')
      : (isEn ? 'Down P5' : '下行纯五度');
  else if (rootMotionDown > 0)
    rootMotionDirection = isEn ? `Up ${getIntervalNameSimple(rootMotion, locale)}` : `上行${getIntervalNameSimple(rootMotion, locale)}`;
  else
    rootMotionDirection = isEn ? `Down ${getIntervalNameSimple(12 - rootMotion, locale)}` : `下行${getIntervalNameSimple(12 - rootMotion, locale)}`;

  // Analyze connection type
  const fromAnalysis = analyzeChordInKey(from, key, locale);
  const toAnalysis = analyzeChordInKey(to, key, locale);

  let connectionType: string;
  let connectionDescription: string;
  let tension: 'smooth' | 'moderate' | 'strong';

  // V → I (authentic cadence)
  if (fromAnalysis.degree === 'V' && toAnalysis.degree === 'I') {
    connectionType = isEn ? 'Authentic Cadence (V→I)' : '正格终止 (V→I)';
    connectionDescription = isEn
      ? 'The strongest resolution. The leading tone in the dominant chord resolves up by half step to the tonic, and the tritone also resolves, creating a powerful sense of "coming home".'
      : '最强的解决进行。属和弦中的导音（大七度）半音上行解决到主音，三全音也得到解决，产生强烈的"回家"感。';
    tension = 'strong';
  }
  // IV → I (plagal cadence)
  else if (fromAnalysis.degree === 'IV' && toAnalysis.degree === 'I') {
    connectionType = isEn ? 'Plagal Cadence (IV→I)' : '变格终止 (IV→I)';
    connectionDescription = isEn
      ? 'Also called the "Amen cadence", the subdominant resolves smoothly to the tonic, gentler than V→I.'
      : '也叫"阿门终止"，下属和弦平稳解决到主和弦，比V→I更柔和。';
    tension = 'moderate';
  }
  // I → V
  else if (fromAnalysis.degree === 'I' && toAnalysis.degree === 'V') {
    connectionType = isEn ? 'Tonic to Dominant' : '主到属';
    connectionDescription = isEn
      ? 'From stability to tension, building a need for resolution. Root motion up a 5th is one of the most natural harmonic movements.'
      : '从稳定到紧张，建立需要解决的张力。根音上行五度是最自然的和声运动之一。';
    tension = 'moderate';
  }
  // Root motion by fifth (circle of fifths)
  else if (rootMotion === 5 || rootMotion === 7) {
    connectionType = isEn ? 'Fifth Motion' : '五度进行';
    connectionDescription = isEn
      ? `Root moves along the circle of fifths, the most natural harmonic connection. The two chords share ${commonNotes.length} common note(s) (${commonNotes.join(', ')}), smooth voice leading.`
      : `根音沿五度圈运动，这是和声学中最自然的连接方式。两个和弦共享${commonNotes.length}个共同音(${commonNotes.join(', ')})，声部进行平滑。`;
    tension = 'smooth';
  }
  // Root motion by step (second)
  else if (rootMotion === 2 || rootMotion === 10 || rootMotion === 1 || rootMotion === 11) {
    connectionType = isEn ? 'Stepwise Motion' : '二度进行';
    connectionDescription = isEn
      ? `Stepwise root motion (by 2nd), adjacent chord connection. ${commonNotes.length > 0 ? `Shares ${commonNotes.join(', ')}.` : 'No common notes, but close voice leading.'}`
      : `根音级进（二度运动），相邻和弦的连接。${commonNotes.length > 0 ? `共享${commonNotes.join(', ')}。` : '没有共同音，但声部进行紧密。'}`;
    tension = 'moderate';
  }
  // Root motion by third
  else if (rootMotion === 3 || rootMotion === 4 || rootMotion === 8 || rootMotion === 9) {
    connectionType = isEn ? 'Third Motion' : '三度进行';
    connectionDescription = isEn
      ? `Root moves by a 3rd, the two chords share many common notes (${commonNotes.join(', ') || 'none'}), rich color change with smooth connection.`
      : `根音三度运动，两个和弦共享较多共同音(${commonNotes.join(', ') || '无'})，色彩变化丰富但连接柔和。`;
    tension = 'smooth';
  }
  // Tritone
  else if (rootMotion === 6) {
    connectionType = isEn ? 'Tritone Motion' : '三全音进行';
    connectionDescription = isEn
      ? 'Roots are a tritone apart (augmented 4th / diminished 5th), the most unstable interval relationship, creating intense dramatic tension.'
      : '根音相距三全音（增四度/减五度），最不稳定的音程关系，制造强烈的戏剧张力。';
    tension = 'strong';
  }
  else {
    connectionType = isEn ? 'Color Connection' : '色彩连接';
    connectionDescription = isEn
      ? `${commonNotes.length > 0 ? `Connected through common notes ${commonNotes.join(', ')}` : 'Connected through voice leading'}.`
      : `${commonNotes.length > 0 ? `通过共同音 ${commonNotes.join(', ')} 连接` : '通过声部进行连接'}。`;
    tension = 'moderate';
  }

  return {
    fromChord: from,
    toChord: to,
    commonNotes,
    rootMotion,
    rootMotionDirection,
    connectionType,
    connectionDescription,
    tension,
  };
}

function getIntervalNameSimple(semitones: number, locale: Locale = 'en'): string {
  if (locale === 'en') {
    const names: Record<number, string> = {
      1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3',
      5: 'P4', 6: 'TT', 7: 'P5', 8: 'm6',
      9: 'M6', 10: 'm7', 11: 'M7',
    };
    return names[semitones] || `${semitones}st`;
  }
  const names: Record<number, string> = {
    1: '小二度', 2: '大二度', 3: '小三度', 4: '大三度',
    5: '纯四度', 6: '三全音', 7: '纯五度', 8: '小六度',
    9: '大六度', 10: '小七度', 11: '大七度',
  };
  return names[semitones] || `${semitones}半音`;
}

export function analyzeProgression(chords: ParsedChord[], key: string, locale: Locale = 'en'): {
  chordAnalyses: ChordAnalysis[];
  connections: ConnectionAnalysis[];
} {
  const chordAnalyses = chords.map(c => analyzeChordInKey(c, key, locale));
  const connections: ConnectionAnalysis[] = [];

  for (let i = 0; i < chords.length - 1; i++) {
    connections.push(analyzeConnection(chords[i], chords[i + 1], key, locale));
  }

  return { chordAnalyses, connections };
}
