import { NOTES } from '../data/notes';

interface TransposeControlProps {
  currentKey: string;
  onKeyChange: (key: string) => void;
  semitones: number;
  onSemitonesChange: (semitones: number) => void;
}

export default function TransposeControl({
  currentKey, onKeyChange, semitones, onSemitonesChange,
}: TransposeControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">调式:</label>
        <select value={currentKey} onChange={(e) => onKeyChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-gray-400 cursor-pointer"
        >
          {NOTES.map(note => (
            <option key={note} value={note}>{note} 大调</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <label className="text-sm text-gray-500 whitespace-nowrap">转调:</label>
        <button onClick={() => onSemitonesChange(Math.max(-11, semitones - 1))}
          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 text-sm cursor-pointer"
        >-</button>
        <input type="range" min={-11} max={11} value={semitones}
          onChange={(e) => onSemitonesChange(Number(e.target.value))}
          className="flex-1 accent-gray-900"
        />
        <button onClick={() => onSemitonesChange(Math.min(11, semitones + 1))}
          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 text-sm cursor-pointer"
        >+</button>
        <span className="text-sm text-gray-600 w-20 text-center">
          {semitones > 0 ? `+${semitones}` : semitones} 半音
        </span>
      </div>

      {semitones !== 0 && (
        <button onClick={() => onSemitonesChange(0)}
          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
        >重置</button>
      )}
    </div>
  );
}
