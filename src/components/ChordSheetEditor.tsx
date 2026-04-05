import { useState, useCallback, useRef, useEffect } from 'react';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { useLocale } from '../i18n/context';

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

export default function ChordSheetEditor() {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<ChordPlacement[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverInput, setPopoverInput] = useState('');
  const popoverInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = lyrics.split('\n');

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {isEn ? 'Chord Sheet Editor' : '和弦谱编辑器'}
        </span>
        {placements.length > 0 && (
          <button
            onClick={() => setPlacements([])}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {isEn ? 'Clear chords' : '清除和弦'}
          </button>
        )}
      </div>

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
      )}
    </div>
  );
}
