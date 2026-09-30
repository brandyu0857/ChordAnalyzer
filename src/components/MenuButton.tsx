import { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  checked?: boolean;       // shows a tick when true (toggles)
  danger?: boolean;
}

/** A "⋯" button opening a small menu of secondary actions. */
export default function MenuButton({ items, label }: { items: (MenuItem | null)[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    // Esc closes just the menu, not the editor behind it
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey, true); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-52 py-1 bg-white rounded-xl shadow-lg border border-gray-200">
          {items.filter((i): i is MenuItem => !!i).map(item => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onSelect(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              <span className="w-4 text-center text-gray-500">{item.checked ? '✓' : ''}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
