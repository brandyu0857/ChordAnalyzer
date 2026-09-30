import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';

/** Diagrams of every chord used in a sheet, in order of first use. */
export default function ChordLegend({ chords, isEn }: { chords: string[]; isEn: boolean }) {
  const unique = [...new Set(chords)];
  if (!unique.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{isEn ? 'Chords used' : '使用的和弦'}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="flex gap-3 flex-wrap">
        {unique.map(chord => {
          const parsed = parseChordName(chord);
          if (!parsed) return null;
          const f = getGuitarFingerings(parsed.root, parsed.type, parsed.bassNote)[0];
          return (
            <div key={chord} className="flex flex-col items-center">
              {f ? (
                <ChordDiagram fingering={f} chordName="" size="small" interactive={false} />
              ) : (
                <div className="w-16 h-24 flex items-center justify-center text-base font-bold text-gray-900">{chord}</div>
              )}
              <span className="text-sm font-semibold text-gray-700 mt-1">{chord}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
