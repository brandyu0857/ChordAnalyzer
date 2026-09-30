import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  label: string;
  /** Esc; the owner decides whether to actually close */
  onRequestClose: () => void;
  children: ReactNode;
}

/** A full-screen, plain white layer over the page. Locks page scrolling. */
export default function Modal({ label, onRequestClose, children }: ModalProps) {
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
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 bg-white flex flex-col">
      {children}
    </div>,
    document.body,
  );
}
