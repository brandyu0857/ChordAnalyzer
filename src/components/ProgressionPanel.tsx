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
import { NOTES, getNoteAtInterval } from '../data/notes';
import { findSongExamples } from '../utils/progressionMatcher';
import { useLocale } from '../i18n/context';
import { CHORD_STYLES, applyStyleToProgression } from '../utils/chordStyleUtils';
import type { ChordStyle } from '../utils/chordStyleUtils';
import { loadProgressions, saveProgression, updateProgression, deleteProgression, type SavedProgression } from '../utils/storage';

interface Props {
  onChordSelect?: (chord: ParsedChord) => void;
  appendChord?: { display: string; fingeringIndex: number } | null;
  onAppendDone?: () => void;
}

export default function ProgressionPanel({ appendChord, onAppendDone }: Props) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  // Template section
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [styleFilter, setStyleFilter] = useState(isEn ? 'All' : '全部');
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [templateKey, setTemplateKey] = useState('C');

  // Progression editor
  const [input, setInput] = useState('');
  const [baseChords, setBaseChords] = useState<ParsedChord[]>([]);
  const [semitones, setSemitones] = useState(0);
  const analysisKey = getNoteAtInterval(templateKey, semitones);
  const [parseError, setParseError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | undefined>(undefined);
  const [isNashville, setIsNashville] = useState(false);
  const [fingeringIndices, setFingeringIndices] = useState<number[]>([]);
  const [chordStyle, setChordStyle] = useState<ChordStyle>('default');
  // Section labels: maps chord index to section name (e.g. {0: "Intro", 4: "Verse"})
  const [sectionBreaks, setSectionBreaks] = useState<Record<number, string>>({});
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeError, setRecognizeError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SavedProgression[]>(() => loadProgressions());
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subPanelRef = useRef<HTMLDivElement>(null);
  const skipParse = useRef(false);
  const keepTranspose = useRef(false);

  // Track grid column count for inline sub panel placement
  const [gridCols, setGridCols] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    if (w >= 1024) return 5;
    if (w >= 768) return 4;
    if (w >= 640) return 3;
    return 2;
  });
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setGridCols(w >= 1024 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Auto-scroll to substitution panel when expanded
  useEffect(() => {
    if (expandedIdx !== null && subPanelRef.current) {
      setTimeout(() => subPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [expandedIdx]);

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
  };

  useEffect(() => {
    if (skipParse.current) { skipParse.current = false; return; }
    if (!input.trim()) { setBaseChords([]); setParseError(''); setIsNashville(false); setSectionBreaks({}); return; }
    const timer = setTimeout(() => {
      const tokens = input.split(/[\s\-,|]+/).filter(Boolean);

      // Extract section markers like [Intro], [Verse], etc. and filter noise
      const sections: Record<number, string> = {};
      let chordIndex = 0;
      const cleanTokens: string[] = [];
      for (const t of tokens) {
        const sectionMatch = t.match(/^\[(.+)\]$/);
        if (sectionMatch) {
          sections[chordIndex] = sectionMatch[1];
        } else if (t === 'NO_CHORDS_FOUND') {
          // Skip GPT noise token
        } else {
          cleanTokens.push(t);
          chordIndex++;
        }
      }

      // Mixed parsing: try each token as Nashville first, then as chord name
      const nashvilleRe = /^[b#]?[1-7][a-z0-9#b]*(\/[b#]?[1-7])?$/i;
      const hasNashville = cleanTokens.some(t => nashvilleRe.test(t) && !/^[A-Ga-g]/.test(t));
      const parsed: ParsedChord[] = [];
      const failed: string[] = [];
      for (const t of cleanTokens) {
        // Try Nashville number first (e.g. "1maj7", "5", "6m", "4/5")
        const isNashvilleToken = nashvilleRe.test(t) && !/^[A-Ga-g]/.test(t);
        const nashvilleResult = isNashvilleToken ? parseNashvilleToken(t, templateKey) : null;
        // Then try chord name (e.g. "Em7", "Cmaj7")
        const chordResult = nashvilleResult || parseChordName(t);
        if (chordResult) parsed.push(chordResult);
        else failed.push(t);
      }
      if (!parsed.length) return;
      setIsNashville(hasNashville);
      setSectionBreaks(sections);
      setParseError(failed.length
        ? (isEn ? `Unrecognized: ${failed.join(', ')}` : `无法识别：${failed.join(', ')}`)
        : '');
      setBaseChords(parsed);
      setFingeringIndices(parsed.map(() => 0));
      if (keepTranspose.current) {
        keepTranspose.current = false;
      } else {
        setSemitones(0);
      }
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
    const parsed = parseChordName(display);
    if (!parsed) { onAppendDone?.(); return; }
    // Reverse-transpose so baseChords stays in the original key
    const inBase = semitones !== 0 ? transposeChord(parsed, -semitones) : parsed;
    skipParse.current = true;
    keepTranspose.current = true;
    setInput(prev => (prev.trim() ? prev.trim() + ' ' + inBase.display : inBase.display));
    setBaseChords(prev => [...prev, inBase]);
    setFingeringIndices(prev => [...prev, fingeringIndex]);
    setSelectedTemplateIdx(null);
    setExpandedIdx(null);
    setTemplatesOpen(false);
    onAppendDone?.();
  }, [appendChord, onAppendDone, semitones]);

  const handleReplace = useCallback((subDisplay: string) => {
    if (expandedIdx === null) return;
    const parsed = parseChordName(subDisplay);
    if (!parsed) return;
    const inBase = semitones !== 0 ? transposeChord(parsed, -semitones) : parsed;
    const newBase = baseChords.map((c, i) => i === expandedIdx ? inBase : c);
    skipParse.current = true;
    keepTranspose.current = true;
    setBaseChords(newBase);
    setFingeringIndices(prev => prev.map((fi, i) => i === expandedIdx ? 0 : fi));
    setInput(newBase.map(c => c.display).join(' '));
    setExpandedIdx(null);
  }, [expandedIdx, semitones, baseChords]);

  const handleSave = useCallback(() => {
    if (!input.trim()) return;
    const name = chords.map(c => c.display).join(' - ');
    const entry = saveProgression({
      name,
      input,
      templateKey,
      semitones,
      fingeringIndices,
      chordStyle,
      sectionBreaks,
    });
    setCurrentSaveId(entry.id);
    setSavedList(loadProgressions());
  }, [input, chords, templateKey, semitones, fingeringIndices, chordStyle, sectionBreaks]);

  const handleLoadSaved = useCallback((saved: SavedProgression) => {
    skipParse.current = true;
    keepTranspose.current = true;
    setInput(saved.input);
    setTemplateKey(saved.templateKey);
    setSemitones(saved.semitones);
    setFingeringIndices(saved.fingeringIndices);
    setChordStyle(saved.chordStyle as ChordStyle);
    setSectionBreaks(saved.sectionBreaks);
    setCurrentSaveId(saved.id);
    setSelectedTemplateIdx(null);
    setExpandedIdx(null);
    // Re-parse the input to rebuild baseChords
    const tokens = saved.input.split(/[\s\-,|]+/).filter(Boolean);
    const parsed: ParsedChord[] = [];
    for (const t of tokens) {
      const match = /^\[(.+)\]$/.test(t) ? null : parseChordName(t);
      if (match) parsed.push(match);
    }
    setBaseChords(parsed);
  }, []);

  const handleDeleteSaved = useCallback((id: string) => {
    deleteProgression(id);
    setSavedList(loadProgressions());
    if (currentSaveId === id) setCurrentSaveId(null);
  }, [currentSaveId]);

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleRenameTitle = useCallback((id: string, newTitle: string) => {
    updateProgression(id, { title: newTitle.trim() || undefined });
    setSavedList(loadProgressions());
    setEditingNameId(null);
  }, []);

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
    if (!file.type.startsWith('image/')) return;
    setRecognizeError('');
    setIsRecognizing(true);

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
        skipParse.current = false;
        setInput(data.chords);
        setPreviewImage(null);
      } catch {
        setRecognizeError(isEn ? 'Network error, please try again' : '网络错误，请重试');
      } finally {
        setIsRecognizing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [isEn]);

  // Paste image from clipboard (Ctrl+V / Cmd+V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  }, [handleImageUpload]);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  }, [handleImageUpload]);

  return (
    <div className="space-y-4">
      {/* Template section (collapsible) */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: templatesOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="bg-gray-50 rounded-xl px-4 pb-4 space-y-3">
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

      {/* Progression editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              {isEn ? 'Custom Chord Progression' : '自定义和弦进行'}
            </span>
            <button
              onClick={() => setTemplatesOpen(v => !v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                templatesOpen
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-400 border-gray-200 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {isEn ? 'Templates' : '模板'}
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: templatesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {baseChords.length > 0 && (
              <button
                onClick={handleSave}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {isEn ? 'Save' : '保存'}
              </button>
            )}
            {input.trim() && (
              <button
                onClick={() => { setInput(''); setBaseChords([]); setFingeringIndices([]); setParseError(''); setSemitones(0); setSelectedTemplateIdx(null); setExpandedIdx(null); setSectionBreaks({}); setCurrentSaveId(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {isEn ? 'Clear' : '清空'}
              </button>
            )}
          </div>
        </div>
        {/* Unified editor container */}
        <div
          className={`bg-gray-50 rounded-xl p-4 space-y-4 relative transition-colors ${isDragging ? 'ring-2 ring-gray-900 bg-gray-100' : ''}`}
          onPaste={handlePaste}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-gray-900/10 rounded-xl flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {isEn ? 'Drop image to recognize chords' : '松开以识别和弦谱'}
              </div>
            </div>
          )}
          {/* Input row */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setParseError(''); }}
              placeholder={isEn ? 'Enter chords, or paste/drop an image' : '输入和弦，或粘贴/拖入图片识谱'}
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

              {/* Chord grid — grouped by sections */}
              {(() => {
                // Build sections array from sectionBreaks
                const hasSections = Object.keys(sectionBreaks).length > 0;
                const sectionEntries = hasSections
                  ? Object.entries(sectionBreaks).map(([idx, label]) => ({ startIdx: parseInt(idx), label })).sort((a, b) => a.startIdx - b.startIdx)
                  : [{ startIdx: 0, label: '' }];

                return sectionEntries.map((section, si) => {
                  const nextStart = si < sectionEntries.length - 1 ? sectionEntries[si + 1].startIdx : chords.length;
                  const sectionChords = chords.slice(section.startIdx, nextStart);
                  if (!sectionChords.length) return null;

                  return (
                    <div key={si} className={hasSections ? 'space-y-2' : ''}>
                      {hasSections && section.label && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-white bg-gray-900 px-2.5 py-0.5 rounded-full">
                            {section.label}
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}
                      {(() => {
                        // Calculate which row the expanded chord is in (within this section)
                        const expandedJ = (expandedIdx !== null && expandedIdx >= section.startIdx && expandedIdx < nextStart)
                          ? expandedIdx - section.startIdx : -1;
                        const expandedRow = expandedJ >= 0 ? Math.floor(expandedJ / gridCols) : -1;

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {sectionChords.map((chord, j) => {
                              const i = section.startIdx + j;
                              const allFingerings = getGuitarFingerings(chord.root, chord.type, chord.bassNote);
                              const fi = Math.min(fingeringIndices[i] ?? 0, allFingerings.length - 1);
                              const fingering = allFingerings[fi];
                              const isExpanded = expandedIdx === i;
                              const isActive = activeIdx === i;
                              const row = Math.floor(j / gridCols);

                              return (
                                <div key={i}
                                  style={{ order: row * 2 }}
                                  className={`group/card rounded-xl p-2 flex flex-col items-center cursor-pointer transition-all
                                    ${isActive
                                      ? 'bg-white ring-1 ring-gray-900 scale-105'
                                      : isExpanded
                                        ? 'bg-white ring-1 ring-gray-900'
                                        : 'bg-white hover:bg-gray-50'}`}
                                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                                >
                                  {/* Chord diagram with hover circle-arrows for voicing switch */}
                                  <div className="relative flex items-center justify-center">
                                    {allFingerings.length > 1 && (
                                      <button
                                        onClick={e => { e.stopPropagation(); setFingeringIndices(prev => prev.map((v, idx) => idx === i ? (v - 1 + allFingerings.length) % allFingerings.length : v)); }}
                                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow border border-gray-200 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100"
                                        title={isEn ? 'Previous voicing' : '上一个指法'}
                                      >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500"><polyline points="15 18 9 12 15 6" /></svg>
                                      </button>
                                    )}
                                    <div className="px-2">
                                      {fingering ? (
                                        <ChordDiagram fingering={fingering} chordName="" size="small" interactive={false} />
                                      ) : (
                                        <div className="w-16 h-24 flex items-center justify-center text-lg font-bold text-gray-900">
                                          {chord.display}
                                        </div>
                                      )}
                                    </div>
                                    {allFingerings.length > 1 && (
                                      <button
                                        onClick={e => { e.stopPropagation(); setFingeringIndices(prev => prev.map((v, idx) => idx === i ? (v + 1) % allFingerings.length : v)); }}
                                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow border border-gray-200 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100"
                                        title={isEn ? 'Next voicing' : '下一个指法'}
                                      >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500"><polyline points="9 18 15 12 9 6" /></svg>
                                      </button>
                                    )}
                                    {allFingerings.length > 1 && (
                                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 tabular-nums opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        {fi + 1}/{allFingerings.length}
                                      </span>
                                    )}
                                  </div>
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
                            {/* Substitution panel — inserted in grid with order to appear after the correct row */}
                            {expandedRow >= 0 && chords[expandedIdx!] && (() => {
                              const chord = chords[expandedIdx!];
                              const subs = getSubstitutions(chord.root, chord.type, locale);
                              return (
                                <div ref={subPanelRef} style={{ order: expandedRow * 2 + 1 }} className="col-span-full bg-white rounded-xl p-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs font-bold">
                                      {expandedIdx! + 1}
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
                          </div>
                        );
                      })()}
                    </div>
                  );
                });
              })()}
              {/* Analysis */}
              <div className="border-t border-gray-100 pt-4 mt-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-500">
                    {isEn ? 'Progression Analysis' : '和弦进行分析'}
                  </h3>
                  <span className="ml-auto text-xs text-gray-400">
                    {analysisKey} {isEn ? 'Major' : '大调'}
                  </span>
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

      {/* Saved progressions */}
      {savedList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {isEn ? 'Saved Progressions' : '已保存的进行'}
            </span>
            <span className="text-xs text-gray-300">{savedList.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {savedList.map(saved => (
              <div
                key={saved.id}
                className={`group flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                  currentSaveId === saved.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => handleLoadSaved(saved)}
              >
                <div className="flex-1 min-w-0">
                  {editingNameId === saved.id ? (
                    <input
                      autoFocus
                      value={editingNameValue}
                      onChange={e => setEditingNameValue(e.target.value)}
                      onBlur={() => handleRenameTitle(saved.id, editingNameValue)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameTitle(saved.id, editingNameValue);
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      placeholder={isEn ? 'Title (e.g. song name)' : '标题（如歌名）'}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-500"
                    />
                  ) : (
                    <div
                      className="text-sm font-medium text-gray-900 truncate hover:underline decoration-gray-300 cursor-text"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingNameId(saved.id);
                        setEditingNameValue(saved.title || '');
                      }}
                      title={isEn ? 'Click to edit title' : '点击编辑标题'}
                    >
                      {saved.title || <span className="text-gray-300 italic">{isEn ? 'Untitled' : '未命名'}</span>}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{saved.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {saved.templateKey}{saved.semitones !== 0 ? ` (${saved.semitones > 0 ? '+' : ''}${saved.semitones})` : ''}
                    {' · '}
                    {new Date(saved.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSaved(saved.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
