import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PROGRESSION_TEMPLATES } from '../data/progressions';
import type { ParsedChord } from '../utils/chordUtils';
import { progressionDegreesToChords, getChordNotes, parseChordName, transposeChord, parseNashvilleToken } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import { getSubstitutions, CATEGORY_STYLES } from '../utils/substitutionUtils';
import ChordDiagram from './ChordDiagram';
import PlayButton from './PlayButton';
import ProgressionAnalysisView from './ProgressionAnalysis';
import { playChordStrum, playChordBlock, playProgression, stopProgression } from '../utils/audioUtils';
import { NOTES } from '../data/notes';
import { findSongExamples } from '../utils/progressionMatcher';
import { useLocale } from '../i18n/context';
import { CHORD_STYLES, applyStyleToProgression } from '../utils/chordStyleUtils';
import type { ChordStyle } from '../utils/chordStyleUtils';

interface Props {
  onChordSelect?: (chord: ParsedChord) => void;
  appendChord?: { display: string; fingeringIndex: number } | null;
  onAppendDone?: () => void;
}

export default function ProgressionPanel({ appendChord, onAppendDone }: Props) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  // Template section
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [styleFilter, setStyleFilter] = useState(isEn ? 'All' : '全部');
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
  const [isNashville, setIsNashville] = useState(false);
  const [fingeringIndices, setFingeringIndices] = useState<number[]>([]);
  const [chordStyle, setChordStyle] = useState<ChordStyle>('default');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeError, setRecognizeError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipParse = useRef(false);

  const allLabel = isEn ? 'All' : '全部';
  const styles = [allLabel, ...new Set(PROGRESSION_TEMPLATES.map(t => isEn ? t.styleEn : t.style))];
  const filteredTemplates = styleFilter === allLabel
    ? PROGRESSION_TEMPLATES
    : PROGRESSION_TEMPLATES.filter(t => (isEn ? t.styleEn : t.style) === styleFilter);

  // Reset style filter when locale changes
  useEffect(() => {
    setStyleFilter(allLabel);
  }, [locale, allLabel]);

  const chords = useMemo(() => {
    let result = baseChords;
    if (chordStyle !== 'default') {
      result = applyStyleToProgression(result, templateKey, chordStyle);
    }
    if (semitones !== 0) {
      result = result.map(c => transposeChord(c, semitones));
    }
    return result;
  }, [baseChords, semitones, chordStyle, templateKey]);

  const handleTemplateSelect = (idx: number) => {
    const template = PROGRESSION_TEMPLATES[idx];
    const parsed = progressionDegreesToChords(template.degrees, templateKey)
      .filter((c): c is ParsedChord => c !== null);
    const chordStr = parsed.map(c => c.display).join(' ');
    skipParse.current = true;
    setInput(chordStr);
    setBaseChords(parsed);
    setFingeringIndices(parsed.map(() => 0));
    setSemitones(0);
    setSelectedTemplateIdx(idx);
    setTemplatesOpen(false);
    setParseError('');
    setExpandedIdx(null);
    setAnalysisKey(templateKey);
  };

  useEffect(() => {
    if (skipParse.current) { skipParse.current = false; return; }
    if (!input.trim()) { setBaseChords([]); setParseError(''); setIsNashville(false); return; }
    const timer = setTimeout(() => {
      const tokens = input.split(/[\s\-,|]+/).filter(Boolean);

      // Mixed parsing: try each token as Nashville first, then as chord name
      const hasNashville = tokens.some(t => /^[b#]?[1-7][a-z0-9#b]*$/i.test(t) && !/^[A-Ga-g]/.test(t));
      const parsed: ParsedChord[] = [];
      const failed: string[] = [];
      for (const t of tokens) {
        // Try Nashville number first (e.g. "1maj7", "5", "6m")
        const isNashvilleToken = /^[b#]?[1-7][a-z0-9#b]*$/i.test(t) && !/^[A-Ga-g]/.test(t);
        const nashvilleResult = isNashvilleToken ? parseNashvilleToken(t, templateKey) : null;
        // Then try chord name (e.g. "Em7", "Cmaj7")
        const chordResult = nashvilleResult || parseChordName(t);
        if (chordResult) parsed.push(chordResult);
        else failed.push(t);
      }
      if (!parsed.length) return;
      setIsNashville(hasNashville);
      setParseError(failed.length
        ? (isEn ? `Unrecognized: ${failed.join(', ')}` : `无法识别：${failed.join(', ')}`)
        : '');
      setBaseChords(parsed);
      setFingeringIndices(parsed.map(() => 0));
      setSemitones(0);
      setSelectedTemplateIdx(null);
      setExpandedIdx(null);
      setTemplatesOpen(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [input, templateKey, isEn]);

  // Append a chord pushed from the chord query page
  useEffect(() => {
    if (!appendChord) return;
    const { display, fingeringIndex } = appendChord;
    skipParse.current = true;
    setInput(prev => (prev.trim() ? prev.trim() + ' ' + display : display));
    setBaseChords(prev => {
      const c = parseChordName(display);
      return c ? [...prev, c] : prev;
    });
    setFingeringIndices(prev => [...prev, fingeringIndex]);
    setSelectedTemplateIdx(null);
    setSemitones(0);
    setExpandedIdx(null);
    setTemplatesOpen(false);
    onAppendDone?.();
  }, [appendChord, onAppendDone]);

  const handleReplace = useCallback((subDisplay: string) => {
    if (expandedIdx === null) return;
    const parsed = parseChordName(subDisplay);
    if (!parsed) return;
    const inBase = semitones !== 0 ? transposeChord(parsed, -semitones) : parsed;
    const newBase = baseChords.map((c, i) => i === expandedIdx ? inBase : c);
    skipParse.current = true;
    setBaseChords(newBase);
    setFingeringIndices(prev => prev.map((fi, i) => i === expandedIdx ? 0 : fi));
    setInput(newBase.map(c => c.display).join(' '));
    setExpandedIdx(null);
  }, [expandedIdx, semitones, baseChords]);

  const handlePlay = async (root: string, type: string) => {
    const f = getGuitarFingerings(root, type)[0];
    if (f) await playChordStrum(f);
    else await playChordBlock(getChordNotes(root, type));
  };

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAll = async () => {
    if (isPlaying) { stopProgression(); setIsPlaying(false); setActiveIdx(undefined); return; }
    setIsPlaying(true);
    try {
      const notesList = chords.map(c => getChordNotes(c.root, c.type));
      await playProgression(notesList, 90, i => setActiveIdx(i));
    } finally {
      setIsPlaying(false);
      setTimeout(() => setActiveIdx(undefined), 500);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setRecognizeError('');
    setIsRecognizing(true);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);

      try {
        const resp = await fetch('/api/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          setRecognizeError(data.error || (isEn ? 'Recognition failed' : '识别失败'));
          return;
        }
        if (data.message) {
          setRecognizeError(isEn ? 'No chords found in image' : '未在图片中找到和弦');
          return;
        }
        // Fill recognized chords into input
        const chordsText = data.chords;
        skipParse.current = false;
        setInput(chordsText);
        setPreviewImage(null);
      } catch {
        setRecognizeError(isEn ? 'Network error, please try again' : '网络错误，请重试');
      } finally {
        setIsRecognizing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [isEn]);

  return (
    <div className="space-y-4">
      {/* Template section (collapsible) */}
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        <button
          onClick={() => setTemplatesOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {isEn ? 'Common Templates' : '常用模板'}
            </span>
            {selectedTemplateIdx !== null && !templatesOpen && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {isEn ? PROGRESSION_TEMPLATES[selectedTemplateIdx].nameEn : PROGRESSION_TEMPLATES[selectedTemplateIdx].name}
              </span>
            )}
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400" strokeWidth="2"
            style={{ transform: templatesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: templatesOpen ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {/* Key selector */}
              <div className="flex items-center gap-2 pt-3">
                <span className="text-xs text-gray-500">{isEn ? 'Load template in' : '以'}</span>
                <select
                  value={templateKey}
                  onChange={e => setTemplateKey(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none cursor-pointer"
                >
                  {NOTES.map(n => <option key={n} value={n}>{n} {isEn ? 'Major' : '大调'}</option>)}
                </select>
                {!isEn && <span className="text-xs text-gray-500">加载模板</span>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredTemplates.map(t => {
                  const realIdx = PROGRESSION_TEMPLATES.indexOf(t);
                  return (
                    <button key={realIdx} onClick={() => handleTemplateSelect(realIdx)}
                      className={`text-left p-3 rounded-lg transition-all cursor-pointer
                        ${selectedTemplateIdx === realIdx
                          ? 'bg-white shadow-sm ring-1 ring-gray-900'
                          : 'bg-white hover:shadow-sm'}`}
                    >
                      <div className="font-medium text-sm text-gray-900">{isEn ? t.nameEn : t.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.degrees.join(' - ')}</div>
                      <div className="text-[10px] text-gray-300 mt-1">{isEn ? t.styleEn : t.style}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progression editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {isEn ? 'Custom Chord Progression' : '自定义和弦进行'}
          </span>
          {input.trim() && (
            <button
              onClick={() => { setInput(''); setBaseChords([]); setFingeringIndices([]); setParseError(''); setSemitones(0); setSelectedTemplateIdx(null); setExpandedIdx(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {isEn ? 'Clear' : '清空'}
            </button>
          )}
        </div>
        {/* Unified editor container */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          {/* Input row */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setParseError(''); }}
              placeholder={isEn ? 'Enter chords: C Em F G, or degrees: 1 6m 4 5' : '输入和弦：C Em F G，或级数：1 6m 4 5'}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
            />
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecognizing}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title={isEn ? 'Upload chord sheet image' : '上传和弦谱图片'}
            >
              {isRecognizing ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
              <span className="hidden sm:inline">{isRecognizing ? (isEn ? 'Recognizing...' : '识别中...') : (isEn ? 'Scan' : '识谱')}</span>
            </button>
            {chords.length > 0 && (
              isPlaying
                ? <button onClick={() => { stopProgression(); setIsPlaying(false); setActiveIdx(undefined); }}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    {isEn ? 'Stop' : '停止'}
                  </button>
                : <PlayButton onPlay={handlePlayAll} label={isEn ? 'Play' : '播放'} />
            )}
          </div>
          {parseError && <p className="text-xs text-red-400">{parseError}</p>}
          {recognizeError && <p className="text-xs text-red-400">{recognizeError}</p>}
          {/* Image preview during recognition */}
          {previewImage && isRecognizing && (
            <div className="relative">
              <img src={previewImage} alt="Chord sheet" className="w-full max-h-48 object-contain rounded-lg border border-gray-200" />
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  {isEn ? 'Analyzing chord sheet...' : '正在分析和弦谱...'}
                </div>
              </div>
            </div>
          )}
          {isNashville && baseChords.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 shrink-0">{templateKey} {isEn ? 'Major' : '大调'} →</span>
              {baseChords.map((c, i) => (
                <span key={i} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                  {c.display}
                </span>
              ))}
            </div>
          )}

          {/* Chord Style Selector */}
          {baseChords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">
                  {isEn ? 'Style' : '风格'}
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {CHORD_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setChordStyle(s.id);
                        setFingeringIndices(prev => prev.map(() => 0));
                        setExpandedIdx(null);
                      }}
                      className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer border
                        ${chordStyle === s.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      title={isEn ? s.descriptionEn : s.description}
                    >
                      {isEn ? s.nameEn : s.name}
                    </button>
                  ))}
                </div>
              </div>
              {chordStyle !== 'default' && (
                <p className="text-xs text-gray-400 pl-10">
                  {isEn
                    ? CHORD_STYLES.find(s => s.id === chordStyle)?.descriptionEn
                    : CHORD_STYLES.find(s => s.id === chordStyle)?.description}
                </p>
              )}
            </div>
          )}

          {chords.length > 0 && (
            <>
              {/* Transpose bar */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-500 flex-shrink-0">{isEn ? 'Transpose' : '转调'}</span>
                <button onClick={() => setSemitones(s => s - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors">-</button>
                <span className="text-sm font-medium text-gray-900 w-16 text-center tabular-nums">
                  {semitones === 0
                    ? (isEn ? 'Original' : '原调')
                    : `${semitones > 0 ? '+' : ''}${semitones} ${isEn ? 'st' : '半音'}`}
                </span>
                <button onClick={() => setSemitones(s => s + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-pointer transition-colors">+</button>
                {semitones !== 0 && (
                  <button onClick={() => setSemitones(0)}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">
                    {isEn ? 'Reset' : '重置'}
                  </button>
                )}
                {baseChords[0] && semitones !== 0 && (
                  <span className="ml-auto text-xs text-gray-400">{baseChords[0].display} → {chords[0].display}</span>
                )}
              </div>

              {/* Chord grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {chords.map((chord, i) => {
                const allFingerings = getGuitarFingerings(chord.root, chord.type, chord.bassNote);
                const fi = Math.min(fingeringIndices[i] ?? 0, allFingerings.length - 1);
                const fingering = allFingerings[fi];
                const isExpanded = expandedIdx === i;
                const isActive = activeIdx === i;

                return (
                  <div key={i}
                    className={`rounded-xl p-2 flex flex-col items-center cursor-pointer transition-all
                      ${isActive
                        ? 'bg-white ring-1 ring-gray-900 scale-105'
                        : isExpanded
                          ? 'bg-white ring-1 ring-gray-900'
                          : 'bg-white hover:bg-gray-50'}`}
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
                        title={isEn ? 'Preview' : '试听'}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                      <span className={`text-[10px] ${isExpanded ? 'text-gray-600' : 'text-gray-300'}`}>
                        {isEn ? 'Sub' : '替代'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Substitution panel */}
            {expandedIdx !== null && chords[expandedIdx] && (() => {
              const chord = chords[expandedIdx];
              const subs = getSubstitutions(chord.root, chord.type, locale);
              return (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold">
                      {expandedIdx + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{chord.display}</span>
                    <span className="text-xs text-gray-400">
                      {isEn ? 'substitutions' : '的替代和弦'}
                    </span>
                    <button onClick={() => setExpandedIdx(null)}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                      {isEn ? 'Collapse' : '收起'}
                    </button>
                  </div>
                  <div className="overflow-x-auto pb-2 -mx-1 px-1">
                    <div className="flex gap-4 items-start" style={{ minWidth: 'max-content' }}>
                      {subs.map((sub, si) => {
                        const sf = getGuitarFingerings(sub.root, sub.type)[0];
                        return (
                          <div key={si} className="group flex-shrink-0 flex flex-col items-center gap-1 w-32">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full leading-4 ${CATEGORY_STYLES[sub.category]}`}>
                              {sub.categoryLabel}
                            </span>
                            <div
                              className="bg-gray-50 dark:bg-gray-100 rounded-xl p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors w-full flex flex-col items-center"
                              onClick={() => handleReplace(sub.display)}
                            >
                              {sf ? (
                                <ChordDiagram fingering={sf} chordName={sub.display} size="small" interactive={false} />
                              ) : (
                                <div className="w-14 h-20 flex items-center justify-center text-sm font-bold text-gray-900">{sub.display}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 w-full">
                              <span className="text-sm font-semibold text-gray-700 flex-1 text-center">{sub.display}</span>
                              <button onClick={() => handlePlay(sub.root, sub.type)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed text-center line-clamp-2 group-hover:line-clamp-none transition-all">{sub.explanation}</p>
                          </div>
                        );
                      })}
                      {subs.length === 0 && (
                        <span className="text-sm text-gray-300 py-4">
                          {isEn ? 'No substitution suggestions' : '暂无替代建议'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
              {/* Analysis */}
              <div className="border-t border-gray-100 pt-4 mt-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-500">
                    {isEn ? 'Progression Analysis' : '和弦进行分析'}
                  </h3>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-gray-400">{isEn ? 'Key' : '调式'}</span>
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
            </>
          )}
        </div>

        {/* Song examples */}
        {chords.length > 0 && (() => {
          const match = findSongExamples(chords);
          if (!match) return null;
          return (
            <div className="rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
                <span className="text-xs font-medium text-gray-500">
                  {isEn ? 'Songs using this progression' : '使用此进行的歌曲'}
                </span>
                <span className="text-[10px] text-gray-300 font-mono">{match.progressionKey}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.songs.map((song, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-gray-800">{song.title}</span>
                    <span className="text-xs text-gray-400">— {song.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Empty state */}
        {baseChords.length === 0 && !parseError && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              {isEn ? 'Select a template above, or enter a chord progression directly' : '从上方选择模板，或直接输入和弦进行'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
