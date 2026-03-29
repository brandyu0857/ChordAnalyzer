import { useState, useEffect, useRef } from 'react';
import { useLocale } from '../i18n/context';

interface ChordSearchProps {
  onSearch: (chordName: string) => void;
  currentChord: string;
}

export default function ChordSearch({ onSearch, currentChord }: ChordSearchProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [input, setInput] = useState(currentChord);
  const skipSearch = useRef(false);

  useEffect(() => {
    skipSearch.current = true;
    setInput(currentChord);
  }, [currentChord]);

  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return; }
    if (!input.trim()) return;
    const timer = setTimeout(() => {
      onSearch(input.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [input, onSearch]);

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isEn ? 'Enter chord name (e.g. Am, G7, Cmaj7, C/E)' : '输入和弦名称（如 Am, G7, Cmaj7, C/E）'}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 text-base"
      />
    </div>
  );
}
