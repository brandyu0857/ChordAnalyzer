import type { ParsedChord } from '../utils/chordUtils';
import { getChordNotes } from '../utils/chordUtils';
import { INTERVAL_NAMES, INTERVAL_NAMES_EN, getNoteIndex } from '../data/notes';
import { useLocale } from '../i18n/context';

interface ChordInfoProps {
  chord: ParsedChord;
}

function getInversionLabel(chord: ParsedChord, isEn: boolean): { label: string; desc: string } | null {
  if (!chord.bassNote) return null;
  const bassIdx = getNoteIndex(chord.bassNote);
  const rootIdx = getNoteIndex(chord.root);
  const interval = (bassIdx - rootIdx + 12) % 12;
  const toneIndex = chord.chordType.intervals.findIndex(iv => (iv % 12) === interval);

  if (toneIndex === -1) {
    return isEn
      ? { label: 'Passing Bass', desc: `Bass ${chord.bassNote} is not a chord tone, used as a passing or pedal tone` }
      : { label: '经过低音', desc: `低音 ${chord.bassNote} 不在和弦音内，作为经过音或踏板音使用` };
  }
  if (toneIndex === 0) {
    return isEn
      ? { label: 'Root Position', desc: `Bass ${chord.bassNote} is the root, standard voicing` }
      : { label: '根音位置', desc: `低音 ${chord.bassNote} 为根音，标准排列` };
  }

  if (isEn) {
    const ordinals = ['', '1st Inversion', '2nd Inversion', '3rd Inversion'];
    const label = ordinals[toneIndex] || `${toneIndex}th Inversion`;
    const intervalNames = INTERVAL_NAMES_EN[interval % 12];
    const toneName = intervalNames?.replace(/\s*\(.*\)/, '') || `${interval} semitones`;
    return { label, desc: `Bass ${chord.bassNote} is the ${toneName}, the ${toneIndex + 1}${toneIndex === 1 ? 'st' : toneIndex === 2 ? 'nd' : toneIndex === 3 ? 'rd' : 'th'} note of ${chord.chordType.nameEn}` };
  }

  const ordinals = ['', '第一转位', '第二转位', '第三转位'];
  const label = ordinals[toneIndex] || `第 ${toneIndex} 转位`;
  const toneName = INTERVAL_NAMES[interval % 12]?.replace(/\s*\(.*\)/, '') || `${interval}半音`;
  return { label, desc: `低音 ${chord.bassNote} 为${toneName}，是 ${chord.chordType.name} 的第 ${toneIndex + 1} 个音` };
}

export default function ChordInfo({ chord }: ChordInfoProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const notes = getChordNotes(chord.root, chord.type);
  const intervals = chord.chordType.intervals;
  const inversion = getInversionLabel(chord, isEn);
  const intervalNames = isEn ? INTERVAL_NAMES_EN : INTERVAL_NAMES;

  return (
    <div className="rounded-xl p-5 bg-gray-50">
      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        {chord.display}
        <span className="text-base font-normal text-gray-400 ml-2">
          {isEn ? chord.chordType.nameEn : chord.chordType.name}
        </span>
      </h3>

      <p className="text-gray-500 text-base mb-4 italic">
        {isEn ? chord.chordType.descriptionEn : chord.chordType.description}
      </p>

      {/* Inversion / slash chord info */}
      {inversion && (
        <div className="mb-4 flex items-start gap-2.5 px-3.5 py-2.5 bg-white rounded-lg">
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap">
            {inversion.label}
          </span>
          <p className="text-sm text-gray-500 leading-snug">{inversion.desc}</p>
        </div>
      )}

      <div className="mb-5">
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
          {isEn ? 'Notes' : '组成音'}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Bass note indicator (only show if different from root) */}
          {chord.bassNote && chord.bassNote !== chord.root && (
            <>
              <span
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-base font-bold bg-gray-600 text-white"
                title={isEn ? `Bass ${chord.bassNote}` : `低音 ${chord.bassNote}`}
              >{chord.bassNote}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0">
                <path d="M5 12h14" />
              </svg>
            </>
          )}
          {notes.map((note, i) => (
            <span key={i}
              className={`inline-flex items-center justify-center w-11 h-11 rounded-lg text-base font-bold
                ${i === 0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
            >{note}</span>
          ))}
        </div>
        {chord.bassNote && chord.bassNote !== chord.root && (
          <p className="text-xs text-gray-400 mt-1.5">
            {isEn ? 'Dark gray = bass · Black = root' : '深灰 = 低音 · 黑色 = 根音'}
          </p>
        )}
      </div>

      <div>
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
          {isEn ? 'Intervals' : '音程结构'}
        </div>
        <div className="flex flex-wrap gap-2">
          {intervals.map((interval, i) => (
            <span key={i} className="text-sm px-2.5 py-1 rounded-md bg-white text-gray-600">
              {intervalNames[interval % 12] || (isEn ? `${interval} st` : `${interval}半音`)}
              <span className="text-gray-400 ml-1">({notes[i]})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
