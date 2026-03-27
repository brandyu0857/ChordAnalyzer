import { useState, useMemo } from 'react';
import { PROGRESSION_TEMPLATES } from '../data/progressions';
import type { ParsedChord } from '../utils/chordUtils';
import { progressionDegreesToChords, getChordNotes } from '../utils/chordUtils';
import { getNoteAtInterval } from '../data/notes';
import TransposeControl from './TransposeControl';
import ProgressionAnalysisView from './ProgressionAnalysis';
import PlayButton from './PlayButton';
import { playProgression } from '../utils/audioUtils';

interface ProgressionPanelProps {
  onChordSelect: (chord: ParsedChord) => void;
}

export default function ProgressionPanel({ onChordSelect }: ProgressionPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [musicalKey, setMusicalKey] = useState('C');
  const [semitones, setSemitones] = useState(0);
  const [activeChordIndex, setActiveChordIndex] = useState<number | undefined>(undefined);
  const [styleFilter, setStyleFilter] = useState<string>('全部');

  const template = PROGRESSION_TEMPLATES[selectedTemplate];
  const styles = ['全部', ...new Set(PROGRESSION_TEMPLATES.map(t => t.style))];

  const filteredTemplates = styleFilter === '全部'
    ? PROGRESSION_TEMPLATES
    : PROGRESSION_TEMPLATES.filter(t => t.style === styleFilter);

  const effectiveKey = useMemo(() => getNoteAtInterval(musicalKey, semitones), [musicalKey, semitones]);

  const chords = useMemo(() => {
    const result = progressionDegreesToChords(template.degrees, effectiveKey);
    return result.filter((c): c is ParsedChord => c !== null);
  }, [template, effectiveKey]);

  const handleKeyChange = (key: string) => { setMusicalKey(key); setSemitones(0); };

  const handlePlayProgression = async () => {
    const chordNotesList = chords.map(c => getChordNotes(c.root, c.type));
    await playProgression(chordNotesList, 90, (index) => setActiveChordIndex(index));
    setTimeout(() => setActiveChordIndex(undefined), 500);
  };

  return (
    <div className="space-y-5">
      {/* Style filter */}
      <div className="flex gap-1.5 flex-wrap">
        {styles.map(s => (
          <button key={s}
            onClick={() => {
              setStyleFilter(s);
              setSelectedTemplate(s === '全部' ? 0 : PROGRESSION_TEMPLATES.findIndex(t => t.style === s));
            }}
            className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer border
              ${styleFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
          >{s}</button>
        ))}
      </div>

      {/* Progression templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredTemplates.map((t) => {
          const realIndex = PROGRESSION_TEMPLATES.indexOf(t);
          return (
            <button key={realIndex}
              onClick={() => setSelectedTemplate(realIndex)}
              className={`text-left p-3 rounded-lg transition-all cursor-pointer border
                ${selectedTemplate === realIndex
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <div className="font-medium text-sm text-gray-900">{t.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.degrees.join(' - ')}</div>
              <div className="text-[10px] text-gray-300 mt-1">{t.style}</div>
            </button>
          );
        })}
      </div>

      {/* Selected progression */}
      <div className="rounded-xl p-5 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            {template.examples.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">曲例: {template.examples.join(', ')}</p>
            )}
          </div>
          <PlayButton onPlay={handlePlayProgression} label="播放进行" />
        </div>

        <TransposeControl
          currentKey={musicalKey} onKeyChange={handleKeyChange}
          semitones={semitones} onSemitonesChange={setSemitones}
        />

        <div className="mt-3 text-sm text-gray-500">
          当前调: <span className="text-gray-900 font-medium">{effectiveKey} 大调</span>
          {semitones !== 0 && (
            <span className="text-gray-400 ml-2">
              (原调 {musicalKey} {semitones > 0 ? `+${semitones}` : semitones} 半音)
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chords.map((chord, i) => (
            <button key={i}
              onClick={() => onChordSelect(chord)}
              className={`px-4 py-2 rounded-lg font-bold text-lg transition-all cursor-pointer border
                ${activeChordIndex === i
                  ? 'bg-gray-900 text-white border-gray-900 scale-105'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400'
                }`}
            >{chord.display}</button>
          ))}
        </div>
      </div>

      {/* Analysis */}
      <div className="rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">和弦进行分析</h3>
        <ProgressionAnalysisView
          chords={chords} musicalKey={effectiveKey} activeChordIndex={activeChordIndex}
          onChordClick={(i) => { setActiveChordIndex(i); onChordSelect(chords[i]); }}
        />
      </div>
    </div>
  );
}
