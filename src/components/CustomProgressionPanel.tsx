import { useState, useCallback, useMemo } from 'react';
import { parseChordName, transposeChord, getChordNotes } from '../utils/chordUtils';
import type { ParsedChord } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import { getSubstitutions, CATEGORY_STYLES } from '../utils/substitutionUtils';
import ChordDiagram from './ChordDiagram';
import { playChordStrum, playChordBlock } from '../utils/audioUtils';

interface Props {
  onChordSelect?: (chord: ParsedChord) => void;
}

const EXAMPLES = [
  'C Em F Fm',
  'Am F C G Em Am Dm E',
  'C Am Dm G7 Em Am F G',
  'Dm7 G7 Cmaj7 Am7 Dm7 G7 C',
];

export default function CustomProgressionPanel({ onChordSelect }: Props) {
  const [input, setInput] = useState('');
  const [baseChords, setBaseChords] = useState<ParsedChord[]>([]);
  const [semitones, setSemitones] = useState(0);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleParse = useCallback(() => {
    const tokens = input.split(/[\s\-,|]+/).filter(Boolean);
    const parsed: ParsedChord[] = [];
    const failed: string[] = [];
    for (const t of tokens) {
      const c = parseChordName(t);
      if (c) parsed.push(c);
      else failed.push(t);
    }
    if (!parsed.length) {
      setError('未能识别出任何和弦，请检查格式（如 C Em F Fm）');
      return;
    }
    setError(failed.length ? `无法识别：${failed.join(', ')}` : '');
    setBaseChords(parsed);
    setSemitones(0);
    setExpandedIdx(null);
  }, [input]);

  const chords = useMemo(() => {
    if (semitones === 0) return baseChords;
    return baseChords.map(c => transposeChord(c, semitones));
  }, [baseChords, semitones]);

  const handleReplace = useCallback((subDisplay: string) => {
    if (expandedIdx === null) return;
    const parsed = parseChordName(subDisplay);
    if (!parsed) return;
    // Substitution is computed in transposed space; untranspose back to base before storing
    const inBaseSpace = semitones !== 0 ? transposeChord(parsed, -semitones) : parsed;
    setBaseChords(prev => prev.map((c, i) => i === expandedIdx ? inBaseSpace : c));
    setExpandedIdx(null);
  }, [expandedIdx, semitones]);

  const handlePlay = async (root: string, type: string) => {
    const fingerings = getGuitarFingerings(root, type);
    if (fingerings[0]) await playChordStrum(fingerings[0]);
    else await playChordBlock(getChordNotes(root, type));
  };

  return (
    <div className="space-y-5">
      {/* Input area */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleParse()}
            placeholder="输入和弦进行，如 C Em F Fm 或 C-Am-F-G"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
          <button
            onClick={handleParse}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            解析
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs text-gray-300">示例：</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setInput(ex); setError(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {chords.length > 0 && (
        <>
          {/* Transpose bar */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5">
            <span className="text-sm text-gray-500 flex-shrink-0">转调</span>
            <button
              onClick={() => setSemitones(s => s - 1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors"
            >-</button>
            <span className="text-sm font-medium text-gray-900 w-16 text-center tabular-nums">
              {semitones === 0 ? '原调' : `${semitones > 0 ? '+' : ''}${semitones} 半音`}
            </span>
            <button
              onClick={() => setSemitones(s => s + 1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors"
            >+</button>
            {semitones !== 0 && (
              <button
                onClick={() => setSemitones(0)}
                className="ml-2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
              >
                重置
              </button>
            )}
            <div className="ml-auto text-xs text-gray-400">
              {baseChords[0] && semitones !== 0 && (
                <span>{baseChords[0].display} → {chords[0].display}</span>
              )}
            </div>
          </div>

          {/* Chord grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {chords.map((chord, i) => {
              const fingerings = getGuitarFingerings(chord.root, chord.type, chord.bassNote);
              const fingering = fingerings[0];
              const isExpanded = expandedIdx === i;

              return (
                <div
                  key={`${i}-${chord.display}`}
                  className={`border rounded-xl p-2 transition-all flex flex-col items-center cursor-pointer
                    ${isExpanded
                      ? 'border-gray-900 bg-gray-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-400'
                    }`}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  {fingering ? (
                    <ChordDiagram fingering={fingering} chordName="" size="small" interactive={false} />
                  ) : (
                    <div className="w-16 h-24 flex items-center justify-center text-lg font-bold text-gray-900">
                      {chord.display}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900 mt-1">{chord.display}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePlay(chord.root, chord.type); }}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="试听"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onChordSelect?.(chord); }}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="查看详情"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                      </svg>
                    </button>
                    <span className={`text-[10px] ${isExpanded ? 'text-gray-600' : 'text-gray-300'}`}>替代</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded substitution panel */}
          {expandedIdx !== null && chords[expandedIdx] && (() => {
            const chord = chords[expandedIdx];
            const subs = getSubstitutions(chord.root, chord.type);

            return (
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold">
                    {expandedIdx + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{chord.display}</span>
                  <span className="text-xs text-gray-400">的替代和弦</span>
                  <button
                    onClick={() => setExpandedIdx(null)}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    收起
                  </button>
                </div>
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                  <div className="flex gap-4 items-start" style={{ minWidth: 'max-content' }}>
                    {subs.map((sub, si) => {
                      const sf = getGuitarFingerings(sub.root, sub.type)[0];
                      return (
                        <div key={si} className="flex-shrink-0 flex flex-col items-center gap-1 w-28">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full leading-4 ${CATEGORY_STYLES[sub.category]}`}>
                            {sub.categoryLabel}
                          </span>
                          <div
                            className="border border-gray-100 rounded-xl p-2 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors w-full flex flex-col items-center"
                            onClick={() => handleReplace(sub.display)}
                          >
                            {sf ? (
                              <ChordDiagram fingering={sf} chordName={sub.display} size="small" interactive={false} />
                            ) : (
                              <div className="w-14 h-20 flex items-center justify-center text-sm font-bold text-gray-900">
                                {sub.display}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 w-full">
                            <span className="text-xs font-semibold text-gray-700 flex-1 text-center">{sub.display}</span>
                            <button
                              onClick={() => handlePlay(sub.root, sub.type)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                              title="试听"
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed text-center line-clamp-2">
                            {sub.explanation}
                          </p>
                        </div>
                      );
                    })}
                    {subs.length === 0 && (
                      <span className="text-sm text-gray-300 py-4">暂无替代建议</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Empty state */}
      {baseChords.length === 0 && !error && (
        <div className="py-12 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">自由输入和弦进行，生成指法图</p>
          <p className="text-xs text-gray-300 mt-1">支持转调、试听，并查看每个和弦的替代建议</p>
        </div>
      )}
    </div>
  );
}
