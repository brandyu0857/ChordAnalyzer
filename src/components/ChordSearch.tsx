import { useState } from 'react';
import { CHORD_TYPES } from '../data/chords';
import { NOTES } from '../data/notes';

interface ChordSearchProps {
  onSearch: (chordName: string) => void;
  currentChord: string;
}

export default function ChordSearch({ onSearch, currentChord }: ChordSearchProps) {
  const [input, setInput] = useState(currentChord);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
      setShowSuggestions(false);
    }
  };

  const quickChords = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'G7', 'Cmaj7', 'Am7', 'Bdim'];

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="输入和弦名称（如 Am, G7, Cmaj7）"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 text-base"
          />

          {showSuggestions && input.length === 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-400 mb-2">快速选择</div>
              <div className="flex flex-wrap gap-1.5">
                {quickChords.map(chord => (
                  <button
                    key={chord}
                    type="button"
                    onClick={() => { setInput(chord); onSearch(chord); setShowSuggestions(false); }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm transition-colors cursor-pointer border border-gray-100"
                  >
                    {chord}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && input.length > 0 && (() => {
            const root = input.length >= 2 && (input[1] === '#' || input[1] === 'b')
              ? input.substring(0, 2) : input[0]?.toUpperCase() || '';

            const isValidRoot = NOTES.includes(root as typeof NOTES[number]) || ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(root);
            if (!isValidRoot) return null;

            // Show all chords for this root, with matches first
            const exact: string[] = [];
            const startsWith: string[] = [];
            const sameRoot: string[] = [];

            Object.values(CHORD_TYPES).forEach(ct => {
              const name = root + ct.symbol;
              if (name.toLowerCase() === input.toLowerCase()) {
                exact.push(name);
              } else if (name.toLowerCase().startsWith(input.toLowerCase())) {
                startsWith.push(name);
              } else {
                sameRoot.push(name);
              }
            });

            const suggestions = [...exact, ...startsWith, ...sameRoot];
            if (suggestions.length === 0) return null;

            return (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm max-h-60 overflow-y-auto">
                {suggestions.slice(0, 15).map(s => (
                  <button key={s} type="button"
                    onClick={() => { setInput(s); onSearch(s); setShowSuggestions(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer
                      ${s.toLowerCase() === input.toLowerCase()
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >{s}</button>
                ))}
              </div>
            );
          })()}
        </div>

        <button type="submit"
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          分析
        </button>
      </form>
    </div>
  );
}
