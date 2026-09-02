import { useState, useCallback, useRef, useEffect, useImperativeHandle } from 'react';
import { toPng } from 'html-to-image';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { useLocale } from '../i18n/context';
import { loadChordSheets, saveChordSheet, updateChordSheet, deleteChordSheet, type SavedChordSheet } from '../utils/storage';
import { extractYouTubeId } from '../utils/youtube';
import FloatingYouTubePlayer from './FloatingYouTubePlayer';

interface ChordPlacement {
  line: number;
  charIndex: number;
  chord: string;
}

interface PopoverState {
  line: number;
  charIndex: number;
  x: number;
  y: number;
}

export interface ChordSheetEditorHandle {
  newSheet: () => void;
}

interface ChordSheetEditorProps {
  ref?: React.Ref<ChordSheetEditorHandle>;
}

export default function ChordSheetEditor({ ref }: ChordSheetEditorProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<ChordPlacement[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverInput, setPopoverInput] = useState('');
  const [savedSheets, setSavedSheets] = useState<SavedChordSheet[]>(() => loadChordSheets());
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const popoverInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const lines = lyrics.split('\n');
  const videoId = extractYouTubeId(youtubeUrl);

  // Focus input when popover opens
  useEffect(() => {
    if (popover) {
      setTimeout(() => popoverInputRef.current?.focus(), 10);
    }
  }, [popover]);

  // Close popover on click outside
  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
        setPopoverInput('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  const confirmChord = useCallback(() => {
    if (!popover) return;
    const chord = popoverInput.trim();
    if (!chord || !parseChordName(chord)) return;
    setPlacements(prev => {
      const filtered = prev.filter(p => !(p.line === popover.line && p.charIndex === popover.charIndex));
      return [...filtered, { line: popover.line, charIndex: popover.charIndex, chord }]
        .sort((a, b) => a.line - b.line || a.charIndex - b.charIndex);
    });
    setPopover(null);
    setPopoverInput('');
  }, [popover, popoverInput]);

  const removeChord = useCallback((line: number, charIndex: number) => {
    setPlacements(prev => prev.filter(p => !(p.line === line && p.charIndex === charIndex)));
  }, []);

  const getChordsForLine = useCallback((lineIdx: number) => {
    return placements.filter(p => p.line === lineIdx);
  }, [placements]);

  const handleCharClick = useCallback((e: React.MouseEvent, line: number, charIndex: number) => {
    // If there's already a chord here, remove it
    const existing = placements.find(p => p.line === line && p.charIndex === charIndex);
    if (existing) {
      removeChord(line, charIndex);
      return;
    }
    // Open popover positioned above the clicked character
    const charRect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const x = containerRect ? charRect.left - containerRect.left : 0;
    const y = containerRect ? charRect.top - containerRect.top : 0;
    setPopover({ line, charIndex, x, y });
    setPopoverInput('');
  }, [placements, removeChord]);

  const isValidChord = popoverInput.trim() ? parseChordName(popoverInput.trim()) !== null : false;

  const handleSaveSheet = useCallback(() => {
    if (!lyrics.trim() || !placements.length) return;
    let name = sheetName.trim();
    if (!name) {
      const firstLine = lyrics.split('\n').find(l => l.trim()) || '';
      name = firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '');
    }
    const trimmedUrl = youtubeUrl.trim() || undefined;
    if (currentSheetId) {
      updateChordSheet(currentSheetId, { name, lyrics, placements, youtubeUrl: trimmedUrl });
    } else {
      const entry = saveChordSheet({ name, lyrics, placements, youtubeUrl: trimmedUrl });
      setCurrentSheetId(entry.id);
    }
    setSheetName(name);
    setSavedSheets(loadChordSheets());
  }, [lyrics, placements, sheetName, currentSheetId, youtubeUrl]);

  const handleNewSheet = useCallback(() => {
    const hasUnsavedContent = !currentSheetId && (lyrics.trim().length > 0 || placements.length > 0);
    if (hasUnsavedContent) {
      const msg = isEn
        ? 'Start a new chord sheet? Unsaved changes will be lost.'
        : '开始新的和弦谱？未保存的更改将会丢失。';
      if (!window.confirm(msg)) return;
    }
    setLyrics('');
    setPlacements([]);
    setIsEditing(true);
    setPopover(null);
    setPopoverInput('');
    setCurrentSheetId(null);
    setSheetName('');
    setYoutubeUrl('');
    setShowYoutubeInput(false);
    setShowPlayer(false);
  }, [lyrics, placements, currentSheetId, isEn]);

  useImperativeHandle(ref, () => ({ newSheet: handleNewSheet }), [handleNewSheet]);

  const handleLoadSheet = useCallback((sheet: SavedChordSheet) => {
    setLyrics(sheet.lyrics);
    setPlacements(sheet.placements);
    setIsEditing(false);
    setCurrentSheetId(sheet.id);
    setSheetName(sheet.name);
    setYoutubeUrl(sheet.youtubeUrl || '');
    setShowYoutubeInput(!!sheet.youtubeUrl);
    setShowPlayer(false);
    setPopover(null);
  }, []);

  const handleDeleteSheet = useCallback((id: string) => {
    deleteChordSheet(id);
    setSavedSheets(loadChordSheets());
    if (currentSheetId === id) {
      setCurrentSheetId(null);
      setSheetName('');
      setYoutubeUrl('');
      setShowYoutubeInput(false);
      setShowPlayer(false);
    }
  }, [currentSheetId]);

  const handleRenameSheet = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) { setEditingNameId(null); return; }
    updateChordSheet(id, { name: trimmed });
    setSavedSheets(loadChordSheets());
    if (currentSheetId === id) setSheetName(trimmed);
    setEditingNameId(null);
  }, [currentSheetId]);

  const handleExportPng = useCallback(async () => {
    if (!exportRef.current || isExporting) return;
    setPopover(null);
    setIsExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const safeName = (sheetName.trim() || (isEn ? 'chord-sheet' : '和弦谱')).replace(/[\\/:*?"<>|]/g, '_');
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export chord sheet as PNG', err);
    } finally {
      setIsExporting(false);
    }
  }, [sheetName, isEn, isExporting]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-900 shrink-0">
          {isEn ? 'Chord Sheet Editor' : '和弦谱编辑器'}
        </span>
        {placements.length > 0 && (
          <input
            value={sheetName}
            onChange={e => setSheetName(e.target.value)}
            placeholder={isEn ? 'Song name...' : '歌曲名称...'}
            className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNewSheet}
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
            title={isEn ? 'Start a new chord sheet' : '新建和弦谱'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {isEn ? 'New' : '新建'}
          </button>
          <button
            onClick={() => setShowYoutubeInput(v => !v)}
            className={`text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              showYoutubeInput ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
            title={isEn ? 'Add YouTube link' : '添加YouTube链接'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
            </svg>
            YouTube
          </button>
          {placements.length > 0 && (
            <button
              onClick={handleSaveSheet}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {isEn ? 'Save' : '保存'}
            </button>
          )}
          {!isEditing && placements.length > 0 && (
            <button
              onClick={handleExportPng}
              disabled={isExporting}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
              </svg>
              {isExporting ? (isEn ? 'Exporting...' : '导出中...') : (isEn ? 'Export PNG' : '导出图片')}
            </button>
          )}
          {placements.length > 0 && (
            <button
              onClick={() => setPlacements([])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {isEn ? 'Clear chords' : '清除和弦'}
            </button>
          )}
        </div>
      </div>

      {showYoutubeInput && (
        <div className="flex items-center gap-2">
          <input
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder={isEn ? 'Paste a YouTube link...' : '粘贴YouTube链接...'}
            className={`flex-1 min-w-0 px-3 py-1.5 text-xs bg-white border rounded-lg placeholder-gray-300 focus:outline-none focus:ring-1 ${
              youtubeUrl.trim()
                ? videoId
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700'
                  : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700'
                : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
            }`}
          />
          <button
            onClick={() => setShowPlayer(v => !v)}
            disabled={!videoId}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            {showPlayer ? (isEn ? 'Hide player' : '隐藏播放器') : (isEn ? 'Open player' : '打开播放器')}
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            placeholder={isEn
              ? 'Paste lyrics here...\n\nExample:\nYesterday, all my troubles seemed so far away\nNow it looks as though they\'re here to stay'
              : '粘贴歌词...\n\n例如：\n已经为了变的更好去掉锋芒\n一不小心成了你的倾诉对象'}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 min-h-32 resize-y"
            rows={6}
          />
          {lyrics.trim() && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors"
            >
              {isEn ? 'Place Chords' : '开始放置和弦'} →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
            >
              ← {isEn ? 'Edit lyrics' : '编辑歌词'}
            </button>
            <span className="text-xs text-gray-400">
              {isEn ? 'Click lyrics to place chord, click chord to remove' : '点击歌词放置和弦，点击和弦删除'}
            </span>
          </div>

          <div ref={exportRef} className="space-y-3 bg-white">
          {/* Lyrics with chord placement */}
          <div ref={containerRef} className="bg-white rounded-xl p-5 space-y-0 select-none relative">
            {lines.map((line, li) => {
              if (!line.trim()) return <div key={li} className="h-4" />;

              const lineChords = getChordsForLine(li);

              return (
                <div key={li}>
                  {/* Chord row */}
                  <div className="h-5 text-xs font-bold whitespace-pre" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {(() => {
                      const sorted = [...lineChords].sort((a, b) => a.charIndex - b.charIndex);
                      if (!sorted.length) return null;

                      const segments: { pos: number; chord: string; charIdx: number }[] = [];
                      let cursor = 0;
                      for (const c of sorted) {
                        const pos = Math.max(c.charIndex, cursor);
                        segments.push({ pos, chord: c.chord, charIdx: c.charIndex });
                        cursor = pos + c.chord.length + 1;
                      }

                      return segments.map((seg, si) => {
                        const padding = si === 0 ? seg.pos : seg.pos - (segments[si - 1].pos + segments[si - 1].chord.length);
                        return (
                          <span key={si}>
                            {padding > 0 && <span>{' '.repeat(padding)}</span>}
                            <span
                              className="text-blue-600 cursor-pointer hover:text-red-500 transition-colors"
                              onClick={() => removeChord(li, seg.charIdx)}
                              title={isEn ? 'Click to remove' : '点击删除'}
                            >
                              {seg.chord}
                            </span>
                          </span>
                        );
                      });
                    })()}
                  </div>
                  {/* Lyrics row */}
                  <div
                    className="whitespace-pre text-gray-800 leading-relaxed mb-1"
                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                  >
                    {[...line].map((char, ci) => {
                      const hasChord = lineChords.some(p => p.charIndex === ci);
                      return (
                        <span
                          key={ci}
                          className={`cursor-pointer transition-colors rounded-sm ${
                            hasChord
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={e => handleCharClick(e, li, ci)}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Chord input popover */}
            {popover && (
              <div
                ref={popoverRef}
                className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 space-y-2"
                style={{ left: popover.x, top: popover.y - 8, transform: 'translateY(-100%)' }}
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={popoverInputRef}
                    value={popoverInput}
                    onChange={e => setPopoverInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmChord();
                      if (e.key === 'Escape') { setPopover(null); setPopoverInput(''); }
                    }}
                    placeholder={isEn ? 'Chord name...' : '和弦名...'}
                    className={`w-32 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                      popoverInput.trim()
                        ? isValidChord
                          ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700 bg-green-50'
                          : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700 bg-red-50'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
                    }`}
                  />
                  <button
                    onClick={confirmChord}
                    disabled={!isValidChord}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    ✓
                  </button>
                </div>
                {/* Mini chord preview */}
                {popoverInput.trim() && isValidChord && (() => {
                  const parsed = parseChordName(popoverInput.trim())!;
                  const f = getGuitarFingerings(parsed.root, parsed.type)[0];
                  return f ? (
                    <div className="flex justify-center">
                      <div className="w-20">
                        <ChordDiagram fingering={f} chordName={parsed.root + (parsed.chordType?.symbol || '')} size="small" interactive={false} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-center text-gray-500 font-medium">{popoverInput.trim()}</p>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Chord legend */}
          {placements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{isEn ? 'Chords used' : '使用的和弦'}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex gap-3 flex-wrap">
                {[...new Set(placements.map(p => p.chord))].map(chord => {
                  const parsed = parseChordName(chord);
                  if (!parsed) return null;
                  const f = getGuitarFingerings(parsed.root, parsed.type)[0];
                  return (
                    <div key={chord} className="flex flex-col items-center">
                      {f ? (
                        <ChordDiagram fingering={f} chordName="" size="small" interactive={false} />
                      ) : (
                        <div className="w-16 h-24 flex items-center justify-center text-sm font-bold text-gray-900">{chord}</div>
                      )}
                      <span className="text-xs font-semibold text-gray-700 mt-1">{chord}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Saved sheets */}
      {savedSheets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-400">{isEn ? 'Saved sheets' : '已保存的谱'} ({savedSheets.length})</span>
          <div className="flex flex-col gap-1.5">
            {savedSheets.map(sheet => (
              <div
                key={sheet.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentSheetId === sheet.id
                    ? 'bg-white border border-gray-900'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleLoadSheet(sheet)}
              >
                <div className="flex-1 min-w-0">
                  {editingNameId === sheet.id ? (
                    <input
                      autoFocus
                      value={editingNameValue}
                      onChange={e => setEditingNameValue(e.target.value)}
                      onBlur={() => handleRenameSheet(sheet.id, editingNameValue)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSheet(sheet.id, editingNameValue);
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-500"
                    />
                  ) : (
                    <div
                      className="text-xs font-medium text-gray-700 truncate hover:underline decoration-gray-300 cursor-text"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingNameId(sheet.id);
                        setEditingNameValue(sheet.name);
                      }}
                      title={isEn ? 'Click to rename' : '点击重命名'}
                    >
                      {sheet.name}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400">
                    {sheet.placements.length} {isEn ? 'chords' : '个和弦'}
                    {' · '}
                    {new Date(sheet.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPlayer && videoId && (
        <FloatingYouTubePlayer videoId={videoId} onClose={() => setShowPlayer(false)} />
      )}
    </div>
  );
}
