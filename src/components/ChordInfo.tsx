import type { ParsedChord } from '../utils/chordUtils';
import { getChordNotes } from '../utils/chordUtils';
import { INTERVAL_NAMES } from '../data/notes';

interface ChordInfoProps {
  chord: ParsedChord;
}

export default function ChordInfo({ chord }: ChordInfoProps) {
  const notes = getChordNotes(chord.root, chord.type);
  const intervals = chord.chordType.intervals;

  return (
    <div className="rounded-xl p-5 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        {chord.display}
        <span className="text-base font-normal text-gray-400 ml-2">{chord.chordType.name}</span>
      </h3>

      <p className="text-gray-500 text-base mb-5 italic">{chord.chordType.description}</p>

      <div className="mb-5">
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">组成音</div>
        <div className="flex gap-2">
          {notes.map((note, i) => (
            <span key={i}
              className={`inline-flex items-center justify-center w-11 h-11 rounded-lg text-base font-bold
                ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
            >{note}</span>
          ))}
        </div>
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
