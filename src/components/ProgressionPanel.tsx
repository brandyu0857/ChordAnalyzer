import { useState, useCallback, useMemo } from 'react';
import { PROGRESSION_TEMPLATES } from '../data/progressions';
import type { ParsedChord } from '../utils/chordUtils';
import { progressionDegreesToChords, getChordNotes, parseChordName, transposeChord } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import { getSubstitutions, CATEGORY_STYLES } from '../utils/substitutionUtils';
import ChordDiagram from './ChordDiagram';
import PlayButton from './PlayButton';
import ProgressionAnalysisView from './ProgressionAnalysis';
import { playChordStrum, playChordBlock, playProgression } from '../utils/audioUtils';
import { NOTES } from '../data/notes';

interface Props {
  onChordSelect?: (chord: ParsedChord) => void;
}

export default function ProgressionPanel({ onChordSelect: _onChordSelect }: Props) {
  // Template section
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [styleFilter, setStyleFilter] = useState('全部');
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [templateKey, setTemplateKey] = useState('C');
  const [analysisKey, setAnalysisKey] = useState('C');

  // Progression editor
  const [input, setInput] = useState('');
  const [baseChords, setBaseChords] = useState<ParsedChord[]>([]);
  const [semitones, setSemitones] = useState(0);
  const [parseError, setParseError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | undefined>(undefined);

  const styles = ['全部', ...new Set(PROGRESSION_TEMPLATES.map(t => t.style))];
  const filteredTemplates = styleFilter === '全部'
    ? PROGRESSION_TEMPLATES
    : PROGRESSION_TEMPLATES.filter(t => t.style === styleFilter);

  const chords = useMemo(() => {
    if (semitones === 0) return baseChords;
    return baseChords.map(c => transposeChord(c, semitones));
  }, [baseChords, semitones]);

  const handleTemplateSelect = (idx: number) => {
    const template = PROGRESSION_TEMPLATES[idx];
    const parsed = progressionDegreesToChords(template.degrees, templateKey)
      .filter((c): c is ParsedChord => c !== null);
    const chordStr = parsed.map(c => c.display).join(' ');
    setInput(chordStr);
    setBaseChords(parsed);
    setSemitones(0);
    setSelectedTemplateIdx(idx);
    setTemplatesOpen(false);
    setParseError('');
    setExpandedIdx(null);
    setAnalysisKey(templateKey);
  };

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
      setParseError('未能识别出任何和弦，请检查格式（如 C Em F Fm）');
      return;
    }
    setParseError(failed.length ? `无法识别：${failed.join(', ')}` : '');
    setBaseChords(parsed);
    setSemitones(0);
    setSelectedTemplateIdx(null);
    setExpandedIdx(null);
  }, [input]);

  const handleReplace = useCallback((subDisplay: string) => {
    if (expandedIdx === null) return;
    const parsed = parseChordName(subDisplay);
    if (!parsed) return;
    const inBase = semitones !== 0 ? transposeChord(parsed, -semitones) : parsed;
    const newBase = baseChords.map((c, i) => i === expandedIdx ? inBase : c);
    setBaseChords(newBase);
    setInput(newBase.map(c => c.display).join(' '));
    setExpandedIdx(null);
  }, [expandedIdx, semitones, baseChords]);

  const handlePlay = async (root: string, type: string) => {
    const f = getGuitarFingerings(root, type)[0];
    if (f) await playChordStrum(f);
    else await playChordBlock(getChordNotes(root, type));
  };

  const handlePlayAll = async () => {
    const notesList = chords.map(c => getChordNotes(c.root, c.type));
    await playProgression(notesList, 90, i => setActiveIdx(i));
    setTimeout(() => setActiveIdx(undefined), 500);
  };

  return (
    <div className="space-y-4">
      {/* Template section (collapsible) */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setTemplatesOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">常用模板</span>
            {selectedTemplateIdx !== null && !templatesOpen && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {PROGRESSION_TEMPLATES[selectedTemplateIdx].name}
              </span>
            )}
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ transform: templatesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {templatesOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            {/* Key selector */}
            <div className="flex items-center gap-2 pt-3">
              <span className="text-xs text-gray-500">以</span>
              <select
                value={templateKey}
                onChange={e => setTemplateKey(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none cursor-pointer"
              >
                {NOTES.map(n => <option key={n} value={n}>{n} 大调</option>)}
              </select>
              <span className="text-xs text-gray-500">加载模板</span>
            </div>

            {/* Style filter */}
            <div className="flex gap-1.5 flex-wrap">
              {styles.map(s => (
                <button key={s} onClick={() => setStyleFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer border
                    ${styleFilter === s
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300'}`}
                >{s}</button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTemplates.map(t => {
                const realIdx = PROGRESSION_TEMPLATES.indexOf(t);
                return (
                  <button key={realIdx} onClick={() => handleTemplateSelect(realIdx)}
                    className={`text-left p-3 rounded-lg transition-all cursor-pointer border
                      ${selectedTemplateIdx === realIdx
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className="font-medium text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.degrees.join(' - ')}</div>
                    <div className="text-[10px] text-gray-300 mt-1">{t.style}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progression editor */}
      <div className="space-y-4">
        {/* Input row */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setParseError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleParse()}
            placeholder="输入和弦进行，如 C Em F Fm，或从上方选择模板"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
          <button onClick={handleParse}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >解析</button>
          {chords.length > 0 && <PlayButton onPlay={handlePlayAll} label="播放" />}
        </div>
        {parseError && <p className="text-xs text-red-400">{parseError}</p>}

        {chords.length > 0 && (
          <>
            {/* Transpose bar */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5">
              <span className="text-sm text-gray-500 flex-shrink-0">转调</span>
              <button onClick={() => setSemitones(s => s - 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors">-</button>
              <span className="text-sm font-medium text-gray-900 w-16 text-center tabular-nums">
                {semitones === 0 ? '原调' : `${semitones > 0 ? '+' : ''}${semitones} 半音`}
              </span>
              <button onClick={() => setSemitones(s => s + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors">+</button>
              {semitones !== 0 && (
                <button onClick={() => setSemitones(0)}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">重置</button>
              )}
              {baseChords[0] && semitones !== 0 && (
                <span className="ml-auto text-xs text-gray-400">{baseChords[0].display} → {chords[0].display}</span>
              )}
            </div>

            {/* Chord grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {chords.map((chord, i) => {
                const fingering = getGuitarFingerings(chord.root, chord.type, chord.bassNote)[0];
                const isExpanded = expandedIdx === i;
                const isActive = activeIdx === i;

                return (
                  <div key={i}
                    className={`border rounded-xl p-2 flex flex-col items-center cursor-pointer transition-all
                      ${isActive
                        ? 'border-gray-900 bg-gray-50 scale-105 shadow-sm'
                        : isExpanded
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'}`}
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
                        onClick={e => { e.stopPropagation(); handlePlay(chord.root, chord.type); }}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title="试听"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                      <span className={`text-[10px] ${isExpanded ? 'text-gray-600' : 'text-gray-300'}`}>替代</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Substitution panel */}
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
                    <button onClick={() => setExpandedIdx(null)}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors">收起</button>
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
                                <div className="w-14 h-20 flex items-center justify-center text-sm font-bold text-gray-900">{sub.display}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 w-full">
                              <span className="text-xs font-semibold text-gray-700 flex-1 text-center">{sub.display}</span>
                              <button onClick={() => handlePlay(sub.root, sub.type)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed text-center line-clamp-2">{sub.explanation}</p>
                          </div>
                        );
                      })}
                      {subs.length === 0 && <span className="text-sm text-gray-300 py-4">暂无替代建议</span>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Analysis */}
        {chords.length > 0 && (
          <div className="rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-500">和弦进行分析</h3>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-gray-400">调式</span>
                <select
                  value={analysisKey}
                  onChange={e => setAnalysisKey(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none cursor-pointer"
                >
                  {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <ProgressionAnalysisView
              chords={chords}
              musicalKey={analysisKey}
              activeChordIndex={activeIdx}
              onChordClick={i => setActiveIdx(i)}
            />
          </div>
        )}

        {/* Empty state */}
        {baseChords.length === 0 && !parseError && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">从上方选择模板，或直接输入和弦进行</p>
          </div>
        )}
      </div>
    </div>
  );
}
