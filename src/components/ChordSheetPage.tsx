import { useCallback, useState } from 'react';
import { useLocale } from '../i18n/context';
import { loadChordSheets, deleteChordSheet, type SavedChordSheet } from '../utils/storage';
import ChordSheetViewer from './ChordSheetViewer';
import ChordSheetEditor from './ChordSheetEditor';

const SELECTED_KEY = 'chord_analyzer_selected_sheet';

function loadSelected(): string | null {
  try { return localStorage.getItem(SELECTED_KEY); } catch { return null; }
}

interface EditorState {
  sheet: SavedChordSheet | null;   // null = a new sheet
  startAt: number;
}

/**
 * The chord sheet tab: play mode (pick a song, watch and play along with its
 * chords), with editing in a modal on top.
 */
export default function ChordSheetPage() {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [sheets, setSheets] = useState<SavedChordSheet[]>(loadChordSheets);
  const [selectedId, setSelectedIdState] = useState<string | null>(loadSelected);
  const [editor, setEditor] = useState<EditorState | null>(null);
  // Remount the viewer's video after editing, continuing from where it was
  const [viewer, setViewer] = useState({ epoch: 0, startAt: 0 });

  const selected = sheets.find(s => s.id === selectedId) ?? sheets[0] ?? null;

  const select = useCallback((id: string) => {
    setSelectedIdState(id);
    setViewer(v => ({ epoch: v.epoch + 1, startAt: 0 }));
    try { localStorage.setItem(SELECTED_KEY, id); } catch { /* preference only */ }
  }, []);

  const handleSaved = useCallback((sheet: SavedChordSheet) => {
    setSheets(loadChordSheets());
    setSelectedIdState(sheet.id);
    try { localStorage.setItem(SELECTED_KEY, sheet.id); } catch { /* preference only */ }
  }, []);

  const handleClose = useCallback((lastTime: number, sheetId: string | null) => {
    // Continue the song's video from where the editor left it (a new sheet
    // becomes the selected one when it's saved)
    const sameSong = sheetId !== null && sheetId === selected?.id;
    setEditor(null);
    setViewer(v => ({ epoch: v.epoch + 1, startAt: sameSong ? lastTime : 0 }));
  }, [selected]);

  const handleDelete = useCallback((sheet: SavedChordSheet) => {
    const msg = isEn ? `Delete "${sheet.name}"? This can't be undone.` : `删除「${sheet.name}」？删除后无法恢复。`;
    if (!window.confirm(msg)) return;
    deleteChordSheet(sheet.id);
    setSheets(loadChordSheets());
  }, [isEn]);

  const newButton = (
    <button
      onClick={() => setEditor({ sheet: null, startAt: 0 })}
      className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-2 shadow-sm shrink-0"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {isEn ? 'New Chord Sheet' : '新增和弦谱'}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
      {/* Song list */}
      <aside className="hidden md:block w-60 shrink-0 space-y-2">
        {newButton}
        <div className="text-sm text-gray-400 pt-2">{isEn ? 'Songs' : '歌曲'} ({sheets.length})</div>
        <div className="flex flex-col gap-1.5">
          {sheets.map(sheet => (
            <div
              key={sheet.id}
              onClick={() => select(sheet.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                selected?.id === sheet.id ? 'bg-white border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{sheet.name}</div>
                <div className="text-xs text-gray-400">
                  {sheet.placements.length} {isEn ? 'chords' : '个和弦'}
                  {sheet.youtubeUrl && ' · ▶'}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(sheet); }}
                aria-label={isEn ? `Delete ${sheet.name}` : `删除 ${sheet.name}`}
                title={isEn ? 'Delete' : '删除'}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex-1 min-w-0 space-y-3" aria-label="chord-sheet">
        {/* Phones: switch songs from a menu instead of the sidebar */}
        <div className="md:hidden flex items-center gap-2">
          {sheets.length > 0 && (
            <select
              value={selected?.id ?? ''}
              onChange={e => select(e.target.value)}
              aria-label={isEn ? 'Song' : '歌曲'}
              className="flex-1 min-w-0 h-10 px-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              {sheets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {newButton}
        </div>

        {selected ? (
          <div className="bg-gray-50 rounded-xl p-4">
            <ChordSheetViewer
              key={`${selected.id}-${viewer.epoch}`}
              sheet={selected}
              isEn={isEn}
              startAt={viewer.startAt}
              showPlayer={!editor}
              onEdit={t => setEditor({ sheet: selected, startAt: t })}
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-10 text-center space-y-3">
            <p className="text-base text-gray-600">{isEn ? 'No chord sheets yet' : '还没有和弦谱'}</p>
            <p className="text-sm text-gray-400">
              {isEn
                ? 'Create one: paste a YouTube link, get the lyrics, and add chords line by line.'
                : '新建一张：贴上 YouTube 链接，自动找歌词，再一句一句扒和弦。'}
            </p>
            <div className="flex justify-center">{newButton}</div>
          </div>
        )}
      </section>

      {editor && (
        <ChordSheetEditor
          key={editor.sheet?.id ?? 'new'}
          sheet={editor.sheet}
          startAt={editor.startAt}
          onSaved={handleSaved}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
