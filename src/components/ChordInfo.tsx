import type { ParsedChord } from '../utils/chordUtils';
import { getChordNotes } from '../utils/chordUtils';
import { INTERVAL_NAMES, getNoteIndex } from '../data/notes';

interface ChordInfoProps {
  chord: ParsedChord;
}

function getInversionLabel(chord: ParsedChord): { label: string; desc: string } | null {
  if (!chord.bassNote) return null;
  const bassIdx = getNoteIndex(chord.bassNote);
  const rootIdx = getNoteIndex(chord.root);
  const interval = (bassIdx - rootIdx + 12) % 12;
  const toneIndex = chord.chordType.intervals.findIndex(iv => (iv % 12) === interval);

  if (toneIndex === -1) {
    return { label: '经过低音', desc: `低音 ${chord.bassNote} 不在和弦音内，作为经过音或踏板音使用` };
  }
  if (toneIndex === 0) {
    return { label: '根音位置', desc: `低音 ${chord.bassNote} 为根音，标准排列` };
  }
  const ordinals = ['', '第一转位', '第二转位', '第三转位'];
  const label = ordinals[toneIndex] || `第 ${toneIndex} 转位`;
  const toneName = INTERVAL_NAMES[interval % 12]?.replace(/\s*\(.*\)/, '') || `${interval}半音`;
  return { label, desc: `低音 ${chord.bassNote} 为${toneName}，是 ${chord.chordType.name} 的第 ${toneIndex + 1} 个音` };
}

export default function ChordInfo({ chord }: ChordInfoProps) {
  const notes = getChordNotes(chord.root, chord.type);
  const intervals = chord.chordType.intervals;
  const inversion = getInversionLabel(chord);

  return (
    <div className="rounded-xl p-5 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        {chord.display}
        <span className="text-base font-normal text-gray-400 ml-2">{chord.chordType.name}</span>
      </h3>

      <p className="text-gray-500 text-base mb-4 italic">{chord.chordType.description}</p>

      {/* Inversion / slash chord info */}
      {inversion && (
        <div className="mb-4 flex items-start gap-2.5 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap">
            {inversion.label}
          </span>
          <p className="text-sm text-gray-500 leading-snug">{inversion.desc}</p>
        </div>
      )}

      <div className="mb-5">
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">组成音</div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Bass note indicator (only show if different from root) */}
          {chord.bassNote && chord.bassNote !== chord.root && (
            <>
              <span
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-base font-bold bg-gray-600 text-white"
                title={`低音 ${chord.bassNote}`}
              >{chord.bassNote}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" className="flex-shrink-0">
                <path d="M5 12h14" />
              </svg>
            </>
          )}
          {notes.map((note, i) => (
            <span key={i}
              className={`inline-flex items-center justify-center w-11 h-11 rounded-lg text-base font-bold
                ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
            >{note}</span>
          ))}
        </div>
        {chord.bassNote && chord.bassNote !== chord.root && (
          <p className="text-xs text-gray-400 mt-1.5">深灰 = 低音 · 黑色 = 根音</p>
        )}
      </div>

      <div>
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">音程结构</div>
        <div className="flex flex-wrap gap-2">
          {intervals.map((interval, i) => (
            <span key={i} className="text-sm px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
              {INTERVAL_NAMES[interval % 12] || `${interval}半音`}
              <span className="text-gray-400 ml-1">({notes[i]})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
