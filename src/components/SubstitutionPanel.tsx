import { useState, useCallback } from 'react';
import { parseChordName } from '../utils/chordUtils';
import {
  getSubstitutions,
  CATEGORY_STYLES,
  type SubstitutionSuggestion,
} from '../utils/substitutionUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { playChordStrum, playChordBlock } from '../utils/audioUtils';
import { getChordNotes } from '../utils/chordUtils';

interface ChordEntry {
  root: string;
  type: string;
  display: string;
}

interface SubstitutionPanelProps {
  onChordSelect?: (chordName: string) => void;
}

const EXAMPLES = [
  'C - Am - F - G',
  'Am - F - C - G',
  'Dm - G7 - Cmaj7 - Am7',
  'C - E7 - Am - F',
  'C - G - Am - Em - F - C - F - G',
];

function ChordCard({
  root, type, display, label, onClick, onPlay,
}: {
  root: string; type: string; display: string; label?: string;
  onClick?: () => void; onPlay?: () => void;
}) {
  const fingerings = getGuitarFingerings(root, type);
  const fingering = fingerings[0];

  return (
    <div className="flex flex-col items-center gap-1.5 w-32 flex-shrink-0">
      {label && (
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      )}
      <div
        className="border border-gray-200 rounded-xl p-2 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors w-full flex flex-col items-center"
        onClick={onClick}
      >
        {fingering ? (
          <ChordDiagram fingering={fingering} chordName={display} size="small" interactive={false} />
        ) : (
          <div className="w-16 h-20 flex items-center justify-center text-base font-bold text-gray-900">
            {display}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 w-full">
        <span className="text-sm font-semibold text-gray-900 flex-1 text-center">{display}</span>
        <button
          onClick={onPlay}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer"
          title="试听"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SubCard({
  sub, onSelect, onPlay,
}: {
  sub: SubstitutionSuggestion;
  onSelect: () => void;
  onPlay: () => void;
}) {
  const fingerings = getGuitarFingerings(sub.root, sub.type);
  const fingering = fingerings[0];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-36 flex-shrink-0">
      {/* Category badge */}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full self-start leading-4 ${CATEGORY_STYLES[sub.category]}`}>
        {sub.categoryLabel}
      </span>

      {/* Diagram */}
      <div
        className="border border-gray-100 rounded-xl p-2 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center bg-white"
        onClick={onSelect}
      >
        {fingering ? (
          <ChordDiagram fingering={fingering} chordName={sub.display} size="small" interactive={false} />
        ) : (
          <div className="w-16 h-20 flex items-center justify-center text-base font-bold text-gray-900">
            {sub.display}
          </div>
        )}
      </div>

      {/* Name + play */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-gray-900 flex-1">{sub.display}</span>
        <button
          onClick={onPlay}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
          title="试听"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* Explanation — collapsed by default, expand on click */}
      <button
        className="text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <p className={`text-[11px] text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {sub.explanation}
        </p>
        {!expanded && (
          <span className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">展开 ↓</span>
        )}
      </button>
    </div>
  );
}

export default function SubstitutionPanel({ onChordSelect }: SubstitutionPanelProps) {
  const [input, setInput] = useState('C - Am - F - G');
  const [progression, setProgression] = useState<ChordEntry[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = useCallback(() => {
    const tokens = input.split(/[\s\-,|\/]+/).filter(t => t.trim().length > 0);
    const parsed: ChordEntry[] = [];
    const failed: string[] = [];

    for (const token of tokens) {
      const chord = parseChordName(token.trim());
      if (chord) {
        parsed.push({ root: chord.root, type: chord.type, display: chord.display });
      } else if (token.trim().length > 0) {
        failed.push(token.trim());
      }
    }

    if (parsed.length === 0) {
      setError('未能识别出任何和弦，请检查格式（如 C - Am - F - G）');
      setProgression([]);
      setAnalyzed(false);
      return;
    }

    setError(failed.length > 0 ? `无法识别：${failed.join(', ')}` : '');
    setProgression(parsed);
    setAnalyzed(true);
  }, [input]);

  const handlePlay = async (root: string, type: string) => {
    const fingerings = getGuitarFingerings(root, type);
    const fingering = fingerings[0];
    if (fingering) {
      await playChordStrum(fingering);
    } else {
      const notes = getChordNotes(root, type);
      await playChordBlock(notes);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input area */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setAnalyzed(false); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="输入和弦进行，如 C - Am - F - G"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
          <button
            onClick={handleAnalyze}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            分析
          </button>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs text-gray-300">示例：</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setInput(ex); setAnalyzed(false); setError(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Results */}
      {analyzed && progression.length > 0 && (
        <div className="space-y-10">
          {progression.map((chord, idx) => {
            const subs = getSubstitutions(chord.root, chord.type);

            return (
              <section key={idx} className="space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-lg text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{chord.display}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Horizontal scroll row: original → substitutions */}
                <div className="overflow-x-auto pb-3 -mx-1 px-1">
                  <div className="flex gap-5 items-start" style={{ minWidth: 'max-content' }}>
                    {/* Original chord */}
                    <ChordCard
                      root={chord.root}
                      type={chord.type}
                      display={chord.display}
                      label="原和弦"
                      onClick={() => onChordSelect?.(chord.display)}
                      onPlay={() => handlePlay(chord.root, chord.type)}
                    />

                    {/* Divider arrow */}
                    <div className="flex items-center self-center mt-6 flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Substitutions */}
                    {subs.length > 0 ? subs.map((sub, si) => (
                      <SubCard
                        key={si}
                        sub={sub}
                        onSelect={() => onChordSelect?.(sub.display)}
                        onPlay={() => handlePlay(sub.root, sub.type)}
                      />
                    )) : (
                      <div className="flex items-center self-center mt-6 text-sm text-gray-300">
                        暂无替代建议
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!analyzed && (
        <div className="py-12 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">输入和弦进行，查看每个和弦的替代建议</p>
          <p className="text-xs text-gray-300 mt-1">支持三全音替代、关系调替代、延伸音版本等多种和声手法</p>
        </div>
      )}
    </div>
  );
}
