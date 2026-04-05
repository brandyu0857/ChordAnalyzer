import { useState, useCallback, useRef } from 'react';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { useLocale } from '../i18n/context';

interface ChordPlacement {
  line: number;
  charIndex: number;
  chord: string;
}

export default function ChordSheetEditor() {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<ChordPlacement[]>([]);
  const [chordInput, setChordInput] = useState('');
  const [isEditing, setIsEditing] = useState(true); // true = editing lyrics, false = placing chords
  const [hoveredPos, setHoveredPos] = useState<{ line: number; charIndex: number } | null>(null);
  const chordInputRef = useRef<HTMLInputElement>(null);

  const lines = lyrics.split('\n');

  const addChord = useCallback((line: number, charIndex: number) => {
    const chord = chordInput.trim();
    if (!chord) {
      chordInputRef.current?.focus();
      return;
    }
    // Remove existing chord at this exact position
    setPlacements(prev => {
      const filtered = prev.filter(p => !(p.line === line && p.charIndex === charIndex));
      return [...filtered, { line, charIndex, chord }].sort((a, b) => a.line - b.line || a.charIndex - b.charIndex);
    });
  }, [chordInput]);

  const removeChord = useCallback((line: number, charIndex: number) => {
    setPlacements(prev => prev.filter(p => !(p.line === line && p.charIndex === charIndex)));
  }, []);

  const getChordsForLine = useCallback((lineIdx: number) => {
    return placements.filter(p => p.line === lineIdx);
  }, [placements]);

  // Validate current chord input
  const isValidChord = chordInput.trim() ? parseChordName(chordInput.trim()) !== null : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {isEn ? 'Chord Sheet Editor' : '和弦谱编辑器'}
        </span>
        {placements.length > 0 && (
          <button
            onClick={() => { setPlacements([]); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {isEn ? 'Clear chords' : '清除和弦'}
          </button>
        )}
      </div>

      {isEditing ? (
        /* Step 1: Paste lyrics */
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
        /* Step 2: Place chords on lyrics */
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
            >
              ← {isEn ? 'Edit lyrics' : '编辑歌词'}
            </button>
            <div className="flex-1" />
            <span className="text-xs text-gray-500">{isEn ? 'Chord:' : '和弦：'}</span>
            <input
              ref={chordInputRef}
              value={chordInput}
              onChange={e => setChordInput(e.target.value)}
              placeholder="C, Am7, G/B..."
              className={`w-28 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                chordInput.trim()
                  ? isValidChord
                    ? 'border-green-300 focus:border-green-400 focus:ring-green-200 text-green-700 bg-green-50'
                    : 'border-red-300 focus:border-red-400 focus:ring-red-200 text-red-700 bg-red-50'
                  : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 text-gray-900'
              }`}
            />
            {chordInput.trim() && isValidChord && (() => {
              const parsed = parseChordName(chordInput.trim())!;
              const f = getGuitarFingerings(parsed.root, parsed.type)[0];
              return f ? (
                <div className="w-12">
                  <ChordDiagram fingering={f} chordName="" size="small" interactive={false} />
                </div>
              ) : null;
            })()}
          </div>

          <p className="text-xs text-gray-400">
            {isEn
              ? 'Click on lyrics to place the chord. Click a placed chord to remove it.'
              : '点击歌词位置放置和弦，点击已放置的和弦可删除。'}
          </p>

          {/* Lyrics with chord placement */}
          <div className="bg-white rounded-xl p-5 space-y-1 select-none">
            {lines.map((line, li) => {
              if (!line.trim()) return <div key={li} className="h-4" />;

              const lineChords = getChordsForLine(li);

              return (
                <div key={li} className="relative">
                  {/* Chord row — always reserve space to prevent layout jump on hover */}
                  <div className="h-5 text-xs font-bold whitespace-pre" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {(() => {
                      const sorted = [...lineChords].sort((a, b) => a.charIndex - b.charIndex);
                      const showGhost = hoveredPos?.line === li && chordInput.trim() && isValidChord;
                      const allChords = showGhost
                        ? [...sorted, { line: li, charIndex: hoveredPos!.charIndex, chord: chordInput.trim(), isGhost: true as const }]
                          .sort((a, b) => a.charIndex - b.charIndex)
                        : sorted.map(c => ({ ...c, isGhost: false as const }));

                      if (!allChords.length) return null;

                      const segments: { pos: number; chord: string; isGhost: boolean; origIdx: number }[] = [];
                      let cursor = 0;
                      for (let ci = 0; ci < allChords.length; ci++) {
                        const c = allChords[ci];
                        const pos = Math.max(c.charIndex, cursor);
                        segments.push({ pos, chord: c.chord, isGhost: 'isGhost' in c && c.isGhost, origIdx: ci });
                        cursor = pos + c.chord.length + 1;
                      }

                      return segments.map((seg, si) => {
                        const padding = si === 0 ? seg.pos : seg.pos - (segments[si - 1].pos + segments[si - 1].chord.length);
                        return (
                          <span key={seg.origIdx}>
                            {padding > 0 && <span>{' '.repeat(padding)}</span>}
                            <span
                              className={seg.isGhost
                                ? 'text-blue-300 pointer-events-none'
                                : 'text-blue-600 cursor-pointer hover:text-red-500 transition-colors'}
                              onClick={seg.isGhost ? undefined : () => removeChord(li, lineChords.sort((a, b) => a.charIndex - b.charIndex)[si]?.charIndex ?? seg.pos)}
                              title={seg.isGhost ? undefined : (isEn ? 'Click to remove' : '点击删除')}
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
                    className="whitespace-pre cursor-crosshair text-gray-800 leading-relaxed"
                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                  >
                    {[...line].map((char, ci) => (
                      <span
                        key={ci}
                        className={`hover:bg-blue-100 transition-colors rounded-sm ${
                          lineChords.some(p => p.charIndex === ci) ? 'bg-blue-50 text-blue-800 font-medium' : ''
                        }`}
                        onClick={() => addChord(li, ci)}
                        onMouseEnter={() => setHoveredPos({ line: li, charIndex: ci })}
                        onMouseLeave={() => setHoveredPos(null)}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chord legend — unique chords used */}
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
