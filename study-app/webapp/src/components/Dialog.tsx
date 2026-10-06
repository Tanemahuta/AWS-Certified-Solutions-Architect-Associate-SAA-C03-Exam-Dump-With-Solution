import type { JSX, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

interface DialogProps { title: string; onClose: () => void; children: ReactNode }

/** Native modal supplies focus trapping, an inert background, and focus restoration. */
export function Dialog({ title, onClose, children }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="modal-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-content"><h2 id={titleId}>{title}</h2>{children}</div>
  </dialog>;
}
