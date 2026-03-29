import { useState, useCallback, useMemo, useRef } from 'react';
import ChordSearch from './components/ChordSearch';
import ChordDiagram from './components/ChordDiagram';
import ChordInfo from './components/ChordInfo';
import PlayButton from './components/PlayButton';
import ProgressionPanel from './components/ProgressionPanel';
import FretboardIdentifier from './components/FretboardIdentifier';
import type { ParsedChord } from './utils/chordUtils';
import { parseChordName, getChordNotes } from './utils/chordUtils';
import { getGuitarFingerings } from './data/chords';
import { playChordStrum, playChordBlock } from './utils/audioUtils';
import { useLocale } from './i18n/context';

type Page = 'chord' | 'progression' | 'identify';

function App() {
  const { locale, setLocale } = useLocale();
  const isEn = locale === 'en';
  const [page, setPage] = useState<Page>('chord');
  const [currentChord, setCurrentChord] = useState<ParsedChord | null>(() => parseChordName('C'));
  const [searchInput, setSearchInput] = useState('C');
  const [error, setError] = useState('');
  const [voicingIndex, setVoicingIndex] = useState(0);
  const [chordToAppend, setChordToAppend] = useState<{ display: string; fingeringIndex: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleAddToProgression = useCallback(() => {
    if (!currentChord) return;
    setChordToAppend({ display: currentChord.display, fingeringIndex: voicingIndex });
    showToast(isEn ? 'Added to progression' : '已添加到和弦进行');
  }, [currentChord, voicingIndex, showToast, isEn]);

  const handleSearch = useCallback((name: string) => {
    setSearchInput(name);
    const parsed = parseChordName(name);
    if (parsed) {
      setCurrentChord(parsed);
      setVoicingIndex(0);
      setError('');
    } else {
      setError(isEn
        ? `Unrecognized chord "${name}". Try C, Am, G7, Dmaj7, etc.`
        : `无法识别和弦 "${name}"。试试 C, Am, G7, Dmaj7 等格式。`);
    }
  }, [isEn]);

  const handleChordSelect = useCallback((chord: ParsedChord) => {
    setCurrentChord(chord);
    setSearchInput(chord.display);
    setVoicingIndex(0);
    setError('');
    setPage('chord');
  }, []);

  const fingerings = useMemo(() => {
    return currentChord ? getGuitarFingerings(currentChord.root, currentChord.type, currentChord.bassNote) : [];
  }, [currentChord]);

  const fingering = fingerings[voicingIndex] || null;
  const totalVoicings = fingerings.length;

  const handlePlayStrum = async () => {
    if (!fingering) return;
    await playChordStrum(fingering);
  };

  const handlePlayBlock = async () => {
    if (!currentChord) return;
    const notes = getChordNotes(currentChord.root, currentChord.type);
    await playChordBlock(notes);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-gray-900">ChordAnalyzer</h1>
            <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer
                  ${locale === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >EN</button>
              <button
                onClick={() => setLocale('zh')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer
                  ${locale === 'zh' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >CN</button>
            </div>
          </div>

          <nav className="flex gap-0 -mb-px">
            <button
              onClick={() => setPage('chord')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer
                ${page === 'chord' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {isEn ? 'Chord Lookup' : '和弦查询'}
              {page === 'chord' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
            <button
              onClick={() => setPage('progression')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer
                ${page === 'progression' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {isEn ? 'Progressions' : '和弦进行'}
              {page === 'progression' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
            <button
              onClick={() => setPage('identify')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer
                ${page === 'identify' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {isEn ? 'Identify' : '反查和弦'}
              {page === 'identify' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {page === 'chord' && (
          <div className="space-y-6">
            <ChordSearch onSearch={handleSearch} currentChord={searchInput} />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {currentChord && (
              <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
                <div className="flex flex-col items-center gap-3">
                  {fingering ? (
                    <>
                      <div className="p-4 rounded-xl bg-gray-50 relative">
                        <ChordDiagram fingering={fingering} chordName={currentChord.display} size="large" />
                      </div>

                      {totalVoicings > 1 && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setVoicingIndex((voicingIndex - 1 + totalVoicings) % totalVoicings)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 cursor-pointer transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-400 tabular-nums">
                            {isEn ? 'Voicing' : '按法'} {voicingIndex + 1} / {totalVoicings}
                          </span>
                          <button
                            onClick={() => setVoicingIndex((voicingIndex + 1) % totalVoicings)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 cursor-pointer transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap justify-center">
                        <PlayButton onPlay={handlePlayStrum} label={isEn ? 'Strum' : '扫弦'} small />
                        <PlayButton onPlay={handlePlayBlock} label={isEn ? 'Chord' : '和弦'} small />
                        <button
                          onClick={handleAddToProgression}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          {isEn ? 'Add to progression' : '加入进行'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-48 h-48 rounded-xl bg-gray-50">
                      <span className="text-3xl font-bold text-gray-900 mb-1">{currentChord.display}</span>
                      <span className="text-xs text-gray-400">{isEn ? 'No fingering available' : '指法图暂无'}</span>
                      <div className="mt-3">
                        <PlayButton onPlay={handlePlayBlock} label={isEn ? 'Play' : '播放'} small />
                      </div>
                    </div>
                  )}
                </div>
                <ChordInfo chord={currentChord} />
              </section>
            )}
          </div>
        )}

        {/* Always mounted so appendChord is received even when on another tab */}
        <div className={page === 'progression' ? '' : 'hidden'}>
          <ProgressionPanel
            onChordSelect={handleChordSelect}
            appendChord={chordToAppend}
            onAppendDone={() => setChordToAppend(null)}
          />
        </div>

        <div className={page !== 'identify' ? 'hidden' : ''}>
          <FretboardIdentifier onChordSelect={handleChordSelect} />
        </div>
      </main>

      <footer className="border-t border-gray-100 mt-16 py-4 text-center text-xs text-gray-300">
        ChordAnalyzer
      </footer>

      {/* Toast */}
      <div
        className="fixed bottom-6 z-50 pointer-events-none"
        style={{
          left: '50%',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          opacity: toast ? 1 : 0,
          transform: toast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(8px)',
        }}
      >
        <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      </div>
    </div>
  );
}

export default App;
