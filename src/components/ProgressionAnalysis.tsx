import type { ParsedChord } from '../utils/chordUtils';
import { getChordNotes } from '../utils/chordUtils';
import type { ChordAnalysis, ConnectionAnalysis } from '../utils/progressionAnalysis';
import { analyzeProgression } from '../utils/progressionAnalysis';
import { useState } from 'react';
import { useLocale } from '../i18n/context';

interface ProgressionAnalysisProps {
  chords: ParsedChord[];
  musicalKey: string;
  activeChordIndex?: number;
  onChordClick?: (index: number) => void;
}

function FunctionBadge({ analysis }: { analysis: ChordAnalysis }) {
  const colorMap: Record<string, string> = {
    tonic: 'bg-gray-100 text-gray-600 border-gray-200',
    dominant: 'bg-gray-100 text-gray-600 border-gray-200',
    subdominant: 'bg-gray-100 text-gray-600 border-gray-200',
    borrowed: 'bg-gray-100 text-gray-600 border-gray-200',
    secondary: 'bg-gray-100 text-gray-600 border-gray-200',
    unknown: 'bg-gray-50 text-gray-400 border-gray-100',
  };

  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded border ${colorMap[analysis.function]}`}>
      {analysis.functionLabel}
    </span>
  );
}

function ConnectionArrow({ connection }: { connection: ConnectionAnalysis }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 min-w-[60px]">
      <div className="text-[10px] text-gray-400 text-center leading-tight mb-0.5">
        {connection.commonNotes.length > 0 && (
          <span className="block">{connection.commonNotes.join(',')}</span>
        )}
      </div>
      <svg width="40" height="14" viewBox="0 0 40 14" className="text-gray-300">
        <line x1="0" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="30,3 38,7 30,11" fill="currentColor" />
      </svg>
      <div className="text-[9px] text-gray-400 text-center leading-tight mt-0.5 max-w-[70px]">
        {connection.rootMotionDirection}
      </div>
    </div>
  );
}

export default function ProgressionAnalysisView({
  chords, musicalKey, activeChordIndex, onChordClick,
}: ProgressionAnalysisProps) {
  const { locale } = useLocale();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { chordAnalyses, connections } = analyzeProgression(chords, musicalKey, locale);

  if (chords.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start overflow-x-auto pb-2 gap-0">
        {chordAnalyses.map((analysis, i) => (
          <div key={i} className="flex items-start">
            <button
              onClick={() => {
                onChordClick?.(i);
                setExpandedIndex(expandedIndex === i ? null : i);
              }}
              className={`flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer min-w-[80px]
                ${activeChordIndex === i
                  ? 'bg-white ring-1 ring-gray-900'
                  : 'bg-white hover:bg-gray-50'
                }`}
            >
              <span className="text-xs text-gray-400 mb-1">{analysis.degreeDisplay}</span>
              <span className="text-lg font-bold text-gray-900">{analysis.chord.display}</span>
              <FunctionBadge analysis={analysis} />
            </button>
            {i < connections.length && <ConnectionArrow connection={connections[i]} />}
          </div>
        ))}
      </div>

      {expandedIndex !== null && expandedIndex < chordAnalyses.length && (
        <ExpandedChordAnalysis
          analysis={chordAnalyses[expandedIndex]}
          prevConnection={expandedIndex > 0 ? connections[expandedIndex - 1] : null}
          nextConnection={expandedIndex < connections.length ? connections[expandedIndex] : null}
          chord={chords[expandedIndex]}
        />
      )}
    </div>
  );
}

function ExpandedChordAnalysis({
  analysis, prevConnection, nextConnection, chord,
}: {
  analysis: ChordAnalysis;
  prevConnection: ConnectionAnalysis | null;
  nextConnection: ConnectionAnalysis | null;
  chord: ParsedChord;
}) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const notes = getChordNotes(chord.root, chord.type);

  return (
    <div className="rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">
            {analysis.chord.display}
            <span className="text-gray-400 font-normal text-sm ml-2">
              {analysis.degree} {isEn ? '- ' : '级 - '}{isEn ? analysis.chord.chordType.nameEn : analysis.chord.chordType.name}
            </span>
          </h4>
          <p className="text-sm text-gray-500 mt-1">{analysis.functionDescription}</p>
        </div>
        <FunctionBadge analysis={analysis} />
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-400">{isEn ? 'Notes:' : '组成音:'}</span>
        {notes.map((n, i) => (
          <span key={i} className="text-xs px-2 py-0.5 bg-white rounded text-gray-600">{n}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prevConnection && (
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">
              {prevConnection.fromChord.display} → {prevConnection.toChord.display}
            </div>
            <div className="text-sm text-gray-700 font-medium">{prevConnection.connectionType}</div>
            <p className="text-xs text-gray-500 mt-1">{prevConnection.connectionDescription}</p>
          </div>
        )}
        {nextConnection && (
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">
              {nextConnection.fromChord.display} → {nextConnection.toChord.display}
            </div>
            <div className="text-sm text-gray-700 font-medium">{nextConnection.connectionType}</div>
            <p className="text-xs text-gray-500 mt-1">{nextConnection.connectionDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}
