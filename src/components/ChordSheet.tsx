import { useState, useMemo } from 'react';
import { parseChordPro, EXAMPLE_CHORD_PRO, EXAMPLE_PLAIN_CHORDS } from '../utils/chordProParser';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';
import { useLocale } from '../i18n/context';

interface ChordSheetProps {
  onChordSelect?: (chordName: string) => void;
}

export default function ChordSheet({ onChordSelect }: ChordSheetProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [input, setInput] = useState('');
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState('');

  const sheet = useMemo(() => {
    if (!rendered || !input.trim()) return null;
    return parseChordPro(input);
  }, [input, rendered]);

  const handleRender = () => {
    if (input.trim()) { setRendered(true); setError(''); }
  };

  const handleClear = () => {
    setInput('');
    setRendered(false);
    setError('');
  };

  const getBaseChord = (name: string) => {
    const base = name.includes('/') ? name.split('/')[0] : name;
    return parseChordName(base);
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Text input area */}
      <div>
        <label className="text-sm text-gray-500 block mb-2">
          {isEn ? 'Manual input:' : '或手动输入：'}
          <code className="text-gray-700 bg-gray-100 px-1 mx-1 rounded">{isEn ? '[C]lyrics [Am]lyrics' : '[C]歌词 [Am]歌词'}</code>
          /
          <code className="text-gray-700 bg-gray-100 px-1 mx-1 rounded">C - Am - F - G</code>
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setRendered(false); }}
          placeholder={isEn
            ? 'Enter ChordPro format: [C]lyrics [Am]lyrics\nor plain chords: C - Am - F - G'
            : '输入 ChordPro 格式：[C]歌词 [Am]歌词\n或纯和弦进行：C - Am - F - G'}
          className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 text-sm font-mono resize-y"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={handleRender}
            disabled={!input.trim()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isEn ? 'Render' : '渲染乐谱'}
          </button>
          <button
            onClick={() => { setInput(EXAMPLE_CHORD_PRO); setRendered(true); }}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {isEn ? 'Example: Lyrics + Chords' : '示例: 歌词+和弦'}
          </button>
          <button
            onClick={() => { setInput(EXAMPLE_PLAIN_CHORDS); setRendered(true); }}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {isEn ? 'Example: Chords Only' : '示例: 纯和弦'}
          </button>
          {input && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors cursor-pointer"
            >
              {isEn ? 'Clear' : '清除'}
            </button>
          )}
        </div>
      </div>

      {/* Rendered chord sheet */}
      {sheet && (
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          {sheet.title && (
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{sheet.title}</h2>
          )}

          {/* Chord legend */}
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              {isEn ? 'Chord Legend' : '和弦一览'}
            </div>
            <div className="flex flex-wrap gap-3">
              {sheet.allChords.map((chordName) => {
                const parsed = getBaseChord(chordName);
                const fingerings = parsed ? getGuitarFingerings(parsed.root, parsed.type) : [];
                const fingering = fingerings[0];
                return (
                  <div key={chordName}
                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors"
                    onClick={() => onChordSelect?.(chordName)}
                  >
                    {fingering ? (
                      <ChordDiagram fingering={fingering} chordName={chordName} size="small" interactive={false} />
                    ) : (
                      <div className="w-14 h-18 flex items-center justify-center text-xs text-gray-400 border border-gray-100 rounded p-2">
                        {chordName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sheet body */}
          <div className="space-y-1">
            {sheet.lines.map((line, lineIdx) => {
              if (line.isBlank) return <div key={lineIdx} className="h-5" />;

              const hasChords = line.segments.some(s => s.chord);
              const isChordsOnly = hasChords && !line.segments.some(s => s.lyrics.trim().length > 2);

              if (isChordsOnly) {
                return (
                  <div key={lineIdx} className="flex flex-wrap items-end gap-4 py-2">
                    {line.segments.filter(s => s.chord).map((seg, segIdx) => {
                      const parsed = getBaseChord(seg.chord!);
                      const fingerings = parsed ? getGuitarFingerings(parsed.root, parsed.type) : [];
                      const fingering = fingerings[0];
                      return (
                        <div key={segIdx}
                          className="flex flex-col items-center cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors"
                          onClick={() => onChordSelect?.(seg.chord!)}
                        >
                          {fingering ? (
                            <ChordDiagram fingering={fingering} chordName={seg.chord!} size="small" interactive={false} />
                          ) : (
                            <div className="px-3 py-1 border border-gray-200 rounded text-sm font-bold text-gray-900">
                              {seg.chord}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div key={lineIdx} className="leading-relaxed font-mono">
                  {hasChords ? (
                    <div className="flex flex-wrap">
                      {line.segments.map((seg, segIdx) => (
                        <span key={segIdx} className="inline-flex flex-col">
                          <span className="h-6 flex items-end">
                            {seg.chord && (
                              <span className="text-sm font-bold text-gray-900 cursor-pointer hover:text-gray-600 transition-colors pr-1"
                                onClick={() => onChordSelect?.(seg.chord!)}
                              >{seg.chord}</span>
                            )}
                          </span>
                          <span className="text-base text-gray-700 whitespace-pre">
                            {seg.lyrics || '\u00A0'}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="h-6" />
                      <span className="text-base text-gray-700">
                        {line.segments.map(s => s.lyrics).join('')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
