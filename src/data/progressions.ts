export interface ProgressionTemplate {
  name: string;
  nameEn: string;
  degrees: string[];
  style: string;
  description: string;
  examples: string[];
}

// Degrees use Roman numeral notation
// Uppercase = major, lowercase = minor, ° = diminished
export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  {
    name: '经典流行进行',
    nameEn: 'Pop Canon',
    degrees: ['I', 'V', 'vi', 'IV'],
    style: '流行',
    description: '最常用的流行歌曲和弦进行，也被称为"四和弦进行"',
    examples: ['Let It Be', 'Someone Like You', '小幸运'],
  },
  {
    name: '50年代进行',
    nameEn: '50s Progression',
    degrees: ['I', 'vi', 'IV', 'V'],
    style: '流行/复古',
    description: '50年代经典流行进行，常用于抒情歌曲',
    examples: ['Stand By Me', 'Every Breath You Take'],
  },
  {
    name: '卡农进行',
    nameEn: 'Pachelbel Canon',
    degrees: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    style: '古典/流行',
    description: '帕赫贝尔卡农的经典和弦进行',
    examples: ['Canon in D', '卡农变奏'],
  },
  {
    name: '布鲁斯进行',
    nameEn: '12-Bar Blues',
    degrees: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    style: '布鲁斯',
    description: '12小节布鲁斯，蓝调音乐的基础',
    examples: ['Johnny B. Goode', 'Rock Around the Clock'],
  },
  {
    name: '爵士 ii-V-I',
    nameEn: 'Jazz ii-V-I',
    degrees: ['ii', 'V', 'I'],
    style: '爵士',
    description: '爵士乐最基本的和弦进行，属功能解决到主',
    examples: ['Autumn Leaves', 'Fly Me to the Moon'],
  },
  {
    name: '下行进行',
    nameEn: 'Descending',
    degrees: ['I', 'V/vii', 'vi', 'V/vi', 'IV', 'I/iii', 'ii', 'V'],
    style: '古典/流行',
    description: '低音下行的优美进行',
    examples: ['Stairway to Heaven', 'While My Guitar Gently Weeps'],
  },
  {
    name: '摇滚进行',
    nameEn: 'Rock Progression',
    degrees: ['I', 'bVII', 'IV', 'I'],
    style: '摇滚',
    description: '使用 bVII 借用和弦的摇滚风格进行',
    examples: ['Sweet Home Alabama', 'Born to Run'],
  },
  {
    name: '悲伤小调进行',
    nameEn: 'Sad Minor',
    degrees: ['i', 'bVI', 'bIII', 'bVII'],
    style: '流行/摇滚',
    description: '自然小调的下行进行，情感忧伤',
    examples: ['Zombie', 'Hello'],
  },
  {
    name: '乡村进行',
    nameEn: 'Country',
    degrees: ['I', 'IV', 'V', 'I'],
    style: '乡村/民谣',
    description: '最基本的三和弦进行，简洁有力',
    examples: ['Amazing Grace', 'Knockin\' on Heaven\'s Door'],
  },
  {
    name: '循环进行',
    nameEn: 'Axis Progression',
    degrees: ['vi', 'IV', 'I', 'V'],
    style: '流行',
    description: '从小调出发的流行进行，现代感强',
    examples: ['Numb', 'Apologize', '可惜不是你'],
  },
  {
    name: '安达卢西亚进行',
    nameEn: 'Andalusian Cadence',
    degrees: ['i', 'bVII', 'bVI', 'V'],
    style: '弗拉门戈/古典',
    description: '西班牙风格的经典下行进行',
    examples: ['Hit the Road Jack', 'Sultans of Swing'],
  },
  {
    name: '皇家进行',
    nameEn: 'Royal Road',
    degrees: ['IV', 'V', 'iii', 'vi'],
    style: '日系流行',
    description: '日本流行音乐（J-Pop）中极为常见的"王道进行"',
    examples: ['残酷天使的行动纲领', '丸之内Sadistic'],
  },
];

// Map degree symbols to chord types relative to major scale
export const DEGREE_TO_CHORD_TYPE: Record<string, { scaleIndex: number; type: string }> = {
  'I': { scaleIndex: 0, type: 'major' },
  'ii': { scaleIndex: 1, type: 'minor' },
  'iii': { scaleIndex: 2, type: 'minor' },
  'IV': { scaleIndex: 3, type: 'major' },
  'V': { scaleIndex: 4, type: 'major' },
  'vi': { scaleIndex: 5, type: 'minor' },
  'vii°': { scaleIndex: 6, type: 'dim' },
  // Minor key degrees
  'i': { scaleIndex: 0, type: 'minor' },
  'bIII': { scaleIndex: 2, type: 'major' },
  'iv': { scaleIndex: 3, type: 'minor' },
  'v': { scaleIndex: 4, type: 'minor' },
  'bVI': { scaleIndex: 5, type: 'major' },
  'bVII': { scaleIndex: 6, type: 'major' },
  // Secondary dominants (simplified)
  'V/V': { scaleIndex: 1, type: 'major' },
  'V/vi': { scaleIndex: 2, type: 'major' },
  'V/vii': { scaleIndex: 3, type: 'major' },
  // Slash chords (bass note handling)
  'I/iii': { scaleIndex: 0, type: 'major' },
};
