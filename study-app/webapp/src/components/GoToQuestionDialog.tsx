import type { JSX } from "react";
import { useState } from "react";
import { Dialog } from "./Dialog";

interface GoToQuestionDialogProps { current: number; total: number; onGo: (position: number) => void; onClose: () => void }

export function GoToQuestionDialog({ current, total, onGo, onClose }: GoToQuestionDialogProps): JSX.Element {
  const [value, setValue] = useState(String(current));
  const number = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(number) && number >= 1 && number <= total;
  return <Dialog title="Go to question" onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); if (valid) onGo(number); }}>
      <label htmlFor="goto-question">Question (1–{total})</label>
      <div className="number-spinner">
        <input id="goto-question" type="number" inputMode="numeric" min={1} max={total} step={1} required autoFocus value={value} onChange={event => setValue(event.target.value)} />
      </div>
      <div className="actions dialog-actions"><button type="submit" className="button button--success" disabled={!valid}><span className="icon mdi mdi-check" aria-hidden="true" />OK</button><button type="button" className="button button--danger" onClick={onClose}><span className="icon mdi mdi-close" aria-hidden="true" />Cancel</button></div>
    </form>
  </Dialog>;
}
