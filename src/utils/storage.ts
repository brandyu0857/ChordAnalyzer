export interface SavedProgression {
  id: string;
  name: string;
  title?: string;
  input: string;
  templateKey: string;
  semitones: number;
  fingeringIndices: number[];
  chordStyle: string;
  sectionBreaks: Record<number, string>;
  createdAt: number;
  updatedAt: number;
}

export interface SavedChordSheet {
  id: string;
  name: string;
  lyrics: string;
  placements: { line: number; charIndex: number; chord: string }[];
  createdAt: number;
  updatedAt: number;
}

const PROGRESSIONS_KEY = 'chord_analyzer_progressions';
const SHEETS_KEY = 'chord_analyzer_sheets';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// --- Progressions ---

export function loadProgressions(): SavedProgression[] {
  try {
    const raw = localStorage.getItem(PROGRESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProgression(prog: Omit<SavedProgression, 'id' | 'createdAt' | 'updatedAt'>): SavedProgression {
  const list = loadProgressions();
  const now = Date.now();
  const entry: SavedProgression = { ...prog, id: generateId(), createdAt: now, updatedAt: now };
  list.unshift(entry);
  localStorage.setItem(PROGRESSIONS_KEY, JSON.stringify(list));
  return entry;
}

export function updateProgression(id: string, updates: Partial<Omit<SavedProgression, 'id' | 'createdAt'>>): void {
  const list = loadProgressions();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...updates, updatedAt: Date.now() };
  localStorage.setItem(PROGRESSIONS_KEY, JSON.stringify(list));
}

export function deleteProgression(id: string): void {
  const list = loadProgressions().filter(p => p.id !== id);
  localStorage.setItem(PROGRESSIONS_KEY, JSON.stringify(list));
}

// --- Chord Sheets ---

export function loadChordSheets(): SavedChordSheet[] {
  try {
    const raw = localStorage.getItem(SHEETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChordSheet(sheet: Omit<SavedChordSheet, 'id' | 'createdAt' | 'updatedAt'>): SavedChordSheet {
  const list = loadChordSheets();
  const now = Date.now();
  const entry: SavedChordSheet = { ...sheet, id: generateId(), createdAt: now, updatedAt: now };
  list.unshift(entry);
  localStorage.setItem(SHEETS_KEY, JSON.stringify(list));
  return entry;
}

export function updateChordSheet(id: string, updates: Partial<Omit<SavedChordSheet, 'id' | 'createdAt'>>): void {
  const list = loadChordSheets();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...updates, updatedAt: Date.now() };
  localStorage.setItem(SHEETS_KEY, JSON.stringify(list));
}

export function deleteChordSheet(id: string): void {
  const list = loadChordSheets().filter(s => s.id !== id);
  localStorage.setItem(SHEETS_KEY, JSON.stringify(list));
}
