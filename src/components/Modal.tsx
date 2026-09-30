import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: ReactNode;
  /** Buttons and fields shown in the header, next to the close button */
  actions?: ReactNode;
  closeLabel: string;
  /** Close button and Esc; the owner decides whether to actually close */
  onRequestClose: () => void;
  children: ReactNode;
}

/** A large dialog over the page: full screen on phones, a centred panel on
 *  wider screens. Locks page scrolling while open. */
export default function Modal({ title, actions, closeLabel, onRequestClose, children }: ModalProps) {
  const closeRef = useRef(onRequestClose);
  useEffect(() => { closeRef.current = onRequestClose; });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-[rgba(0,0,0,0.45)] sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full h-full sm:h-[94vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 shrink-0">{title}</h2>
          <div className="flex-1 min-w-0 flex items-center justify-end gap-2 flex-wrap">{actions}</div>
          <button
            onClick={onRequestClose}
            aria-label={closeLabel}
            title={closeLabel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
