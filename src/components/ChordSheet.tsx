import { useState, useMemo, useRef } from 'react';
import { parseChordPro, EXAMPLE_CHORD_PRO, EXAMPLE_PLAIN_CHORDS } from '../utils/chordProParser';
import { parseChordName } from '../utils/chordUtils';
import { getGuitarFingerings } from '../data/chords';
import ChordDiagram from './ChordDiagram';

interface ChordSheetProps {
  onChordSelect?: (chordName: string) => void;
}

export default function ChordSheet({ onChordSelect }: ChordSheetProps) {
  const [input, setInput] = useState('');
  const [rendered, setRendered] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPreviewUrl(null);
    setError('');
  };

  // Image upload and AI recognition
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError('');
    setAnalyzing(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Call Netlify Function
      const response = await fetch('/.netlify/functions/analyze-chords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '识别失败');
      }

      if (data.text) {
        setInput(data.text.trim());
        setRendered(true);
      } else {
        setError('未能识别出和弦内容');
      }
    } catch (err) {
      setError(`识别失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAnalyzing(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getBaseChord = (name: string) => {
    const base = name.includes('/') ? name.split('/')[0] : name;
    return parseChordName(base);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="chord-image-upload"
        />
        <label htmlFor="chord-image-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-sm text-gray-500">
              {analyzing ? '正在识别中...' : '上传和弦谱截图，AI 自动识别'}
            </span>
            <span className="text-xs text-gray-400">支持 JPG、PNG 格式</span>
          </div>
        </label>

        {analyzing && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI 正在分析图片...
          </div>
        )}
      </div>

      {/* Image preview */}
      {previewUrl && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <img src={previewUrl} alt="上传的和弦谱" className="max-h-64 mx-auto object-contain" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Text input area */}
      <div>
        <label className="text-sm text-gray-500 block mb-2">
          或手动输入：
          <code className="text-gray-700 bg-gray-100 px-1 mx-1 rounded">[C]歌词 [Am]歌词</code>
          /
          <code className="text-gray-700 bg-gray-100 px-1 mx-1 rounded">C - Am - F - G</code>
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setRendered(false); }}
          placeholder={`AI 识别结果会显示在这里，也可以手动输入或修改`}
          className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 text-sm font-mono resize-y"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={handleRender}
            disabled={!input.trim()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            渲染乐谱
          </button>
          <button
            onClick={() => { setInput(EXAMPLE_CHORD_PRO); setRendered(true); }}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
          >
            示例: 歌词+和弦
          </button>
          <button
            onClick={() => { setInput(EXAMPLE_PLAIN_CHORDS); setRendered(true); }}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
          >
            示例: 纯和弦
          </button>
          {input && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors cursor-pointer"
            >
              清除
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
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">和弦一览</div>
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix: "data:image/png;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
