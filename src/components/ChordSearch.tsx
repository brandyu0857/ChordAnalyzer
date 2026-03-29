import { useState, useEffect, useRef, useCallback } from 'react';
import { CHORD_TYPES } from '../data/chords';
import { NOTES } from '../data/notes';
import { useLocale } from '../i18n/context';

interface ChordSearchProps {
  onSearch: (chordName: string) => void;
  currentChord: string;
}

export default function ChordSearch({ onSearch, currentChord }: ChordSearchProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [input, setInput] = useState(currentChord);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const skipSearch = useRef(false);

  // Sync when parent changes currentChord (e.g. clicking a chord in progression)
  useEffect(() => {
    skipSearch.current = true;
    setInput(currentChord);
  }, [currentChord]);

  // Debounce auto-search
  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return; }
    if (!input.trim()) return;
    const timer = setTimeout(() => {
      onSearch(input.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [input, onSearch]);

  // Reset highlight when input changes
  useEffect(() => { setHighlightIdx(0); }, [input]);

  const quickChords = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'G7', 'Cmaj7', 'Am7', 'Bdim'];

  const getSuggestions = useCallback((): string[] => {
    if (input.length === 0) return [];
    const root = input.length >= 2 && (input[1] === '#' || input[1] === 'b')
      ? input.substring(0, 2) : input[0]?.toUpperCase() || '';
    const isValidRoot = NOTES.includes(root as typeof NOTES[number]) || ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(root);
    if (!isValidRoot) return [];

    const exact: string[] = [];
    const startsWith: string[] = [];
    const sameRoot: string[] = [];
    Object.values(CHORD_TYPES).forEach(ct => {
      const name = root + ct.symbol;
      if (name.toLowerCase() === input.toLowerCase()) exact.push(name);
      else if (name.toLowerCase().startsWith(input.toLowerCase())) startsWith.push(name);
      else sameRoot.push(name);
    });
    return [...exact, ...startsWith, ...sameRoot].slice(0, 30);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    const suggestions = getSuggestions();
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = suggestions[highlightIdx];
      if (selected) {
        setInput(selected);
        onSearch(selected);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
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
            onKeyDown={handleKeyDown}
            placeholder={isEn ? 'Enter chord name (e.g. Am, G7, Cmaj7)' : '输入和弦名称（如 Am, G7, Cmaj7）'}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 text-base"
          />

          {showSuggestions && input.length === 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-400 mb-2">{isEn ? 'Quick select' : '快速选择'}</div>
              <div className="flex flex-wrap gap-1.5">
                {quickChords.map(chord => (
                  <button
                    key={chord}
                    type="button"
                    onClick={() => { setInput(chord); onSearch(chord); setShowSuggestions(false); }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors cursor-pointer"
                  >
                    {chord}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && input.length > 0 && (() => {
            const suggestions = getSuggestions();
            if (suggestions.length === 0) return null;

            return (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button key={s} type="button"
                    onClick={() => { setInput(s); onSearch(s); setShowSuggestions(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer
                      ${i === highlightIdx
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >{s}</button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
