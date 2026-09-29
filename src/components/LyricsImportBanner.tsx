import { useState } from 'react';
import type { RankedResult } from '../utils/lyrics';
import { formatTime } from '../utils/youtubeApi';

export type LyricsLookupStatus = 'idle' | 'manual' | 'searching' | 'found' | 'none' | 'error';

export interface LyricsLookupState {
  status: LyricsLookupStatus;
  videoTitle: string;
  ranked: RankedResult[];
  importedId: number | null;   // the result currently in the editor, if imported from here
  note: string | null;         // one-line outcome, e.g. "timestamps added, chords kept"
}

interface LyricsImportBannerProps {
  state: LyricsLookupState;
  isEn: boolean;
  onImport: (r: RankedResult) => void;
  onSearch: (query: string) => void;
  onUndo?: () => void;
  onDismiss: () => void;
}

/** Status of the automatic lyrics lookup, with a way to pick another match
 *  or search by hand when the video title didn't find the right song. */
export default function LyricsImportBanner({ state, isEn, onImport, onSearch, onUndo, onDismiss }: LyricsImportBannerProps) {
  const [showList, setShowList] = useState(false);
  const [query, setQuery] = useState('');
  const imported = state.ranked.find(r => r.result.id === state.importedId);
  const listOpen = showList || (state.status === 'found' && !imported);

  const search = (
    <form
      className="flex items-center gap-1.5"
      onSubmit={e => { e.preventDefault(); if (query.trim()) onSearch(query.trim()); }}
    >
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={isEn ? 'Song name, artist…' : '歌名、歌手…'}
        className="w-44 px-2 py-1 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400"
      />
      <button type="submit" disabled={!query.trim()}
        className="px-2 py-1 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
        {isEn ? 'Search' : '搜索'}
      </button>
    </form>
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-400">{isEn ? 'Lyrics' : '歌词'}</span>
        {state.status === 'searching' && (
          <span className="text-gray-500">
            {isEn ? 'Looking up lyrics for ' : '正在查找歌词：'}<span className="text-gray-700">{state.videoTitle || '…'}</span>
          </span>
        )}
        {imported && (
          <span className="text-gray-700">
            {isEn ? 'Imported ' : '已导入 '}
            <b>{imported.result.trackName}</b> – {imported.result.artistName}
            {imported.result.syncedLyrics && (
              <span className="ml-1.5 text-green-600">{isEn ? '· synced to the song' : '· 带时间轴'}</span>
            )}
          </span>
        )}
        {state.status === 'found' && !imported && (
          <span className="text-gray-700">{isEn ? 'Pick the right song:' : '选一首对应的歌：'}</span>
        )}
        {state.status === 'manual' && (
          <span className="text-gray-500">{isEn ? 'Search lyrics by name:' : '按歌名搜索歌词：'}</span>
        )}
        {state.status === 'none' && (
          <span className="text-gray-500">
            {isEn ? 'No lyrics found for this video. Search by name:' : '没找到这首歌的歌词，试试手动搜索：'}
          </span>
        )}
        {state.status === 'error' && (
          <span className="text-red-500">{isEn ? 'Lyrics lookup failed. Search again:' : '歌词查找失败，重新搜索：'}</span>
        )}
        {state.note && <span className="text-gray-500">{state.note}</span>}

        <div className="ml-auto flex items-center gap-2">
          {imported && state.ranked.length > 1 && (
            <button onClick={() => setShowList(v => !v)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              {isEn ? 'Wrong song?' : '不对？换一首'} {showList ? '▴' : '▾'}
            </button>
          )}
          {imported && onUndo && (
            <button onClick={onUndo} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              {isEn ? 'Undo' : '撤销'}
            </button>
          )}
          <button onClick={onDismiss} aria-label={isEn ? 'Close' : '关闭'}
            className="text-gray-300 hover:text-gray-600 cursor-pointer">✕</button>
        </div>
      </div>

      {(state.status === 'manual' || state.status === 'none' || state.status === 'error') && search}

      {listOpen && state.ranked.length > 0 && (
        <div className="space-y-1">
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
            {state.ranked.slice(0, 8).map(r => (
              <li key={r.result.id} className="flex items-center gap-2 py-1">
                <span className="flex-1 min-w-0 truncate text-gray-700">
                  <b>{r.result.trackName}</b> – {r.result.artistName}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">{formatTime(r.result.duration)}</span>
                {r.result.syncedLyrics
                  ? <span className="text-xs text-green-600">{isEn ? 'synced' : '时间轴'}</span>
                  : <span className="text-xs text-gray-300">{isEn ? 'text only' : '纯文本'}</span>}
                <button
                  onClick={() => { onImport(r); setShowList(false); }}
                  disabled={r.result.id === state.importedId}
                  className="px-2 py-0.5 text-xs rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 cursor-pointer"
                >
                  {r.result.id === state.importedId ? (isEn ? 'In use' : '使用中') : (isEn ? 'Use' : '导入')}
                </button>
              </li>
            ))}
          </ul>
          {search}
        </div>
      )}
    </div>
  );
}
