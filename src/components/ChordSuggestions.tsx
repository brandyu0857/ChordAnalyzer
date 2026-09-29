import type { SuggestionContext } from '../utils/chordSuggestions';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import { playChordStrum } from '../utils/audioUtils';

interface ChordSuggestionsProps {
  context: SuggestionContext;
  isEn: boolean;
  onPick: (chord: string) => void;
}

function preview(chord: string) {
  const parsed = parseChordName(chord);
  const f = parsed ? getGuitarFingerings(parsed.root, parsed.type, parsed.bassNote)[0] : null;
  if (f) void playChordStrum(f);
}

/** "Can't hear it?" clues: likely chords after the previous one, each with
 *  a reason, a play button to compare against the recording, and one click
 *  to insert. */
export default function ChordSuggestions({ context, isEn, onPick }: ChordSuggestionsProps) {
  if (!context.suggestions.length) return null;
  return (
    <div className="space-y-1.5 pt-1 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        {isEn
          ? <>After <b className="text-gray-700">{context.previous}</b> (key of {context.keyName}), try:</>
          : <>接在 <b className="text-gray-700">{context.previous}</b> 后面（{context.keyName} 调）可能是：</>}
      </p>
      <ul className="space-y-0.5">
        {context.suggestions.map(s => (
          <li key={s.chord} className="flex items-center gap-1.5">
            <button
              onClick={() => preview(s.chord)}
              title={isEn ? `Listen to ${s.chord}` : `试听 ${s.chord}`}
              aria-label={isEn ? `Listen to ${s.chord}` : `试听 ${s.chord}`}
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
            </button>
            <button
              onClick={() => onPick(s.chord)}
              title={isEn ? `Insert ${s.chord}` : `插入 ${s.chord}`}
              className="flex-1 min-w-0 flex items-baseline gap-2 px-1.5 py-1 rounded-md text-left hover:bg-blue-50 cursor-pointer"
            >
              <span className="w-12 shrink-0 font-bold text-sm text-blue-700">{s.chord}</span>
              <span className="w-12 shrink-0 text-xs text-gray-400">{s.degree}</span>
              <span className="flex-1 min-w-0 text-xs text-gray-500 leading-snug">{s.reason}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
