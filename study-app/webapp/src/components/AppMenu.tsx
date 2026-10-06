import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface AppMenuProps {
  onHome: () => void; onLearn: () => void; onInfinite: () => void; onTimed: () => void;
  onReports: () => void; onClearData: () => void; onPause?: () => void; onRestart?: () => void;
}
export function AppMenu(props: AppMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent): void => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent): void => { if (open && event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const entry = (label: string, icon: IconName, action: () => void): JSX.Element => <button onClick={() => { setOpen(false); action(); }}><Icon name={icon} />{label}</button>;
  return <div className="app-menu" ref={ref}>
    <button className="menu-trigger" ref={trigger} aria-expanded={open} aria-controls="app-navigation" onClick={() => setOpen(!open)}><Icon name="menu" />Menu</button>
    {open && <nav id="app-navigation" className="menu-panel" aria-label="App navigation">
      {entry("Learn mode", "learn", props.onLearn)}
      {entry("Home", "home", props.onHome)}
      <details><summary><Icon name="test" />Tests</summary><div>{entry("Test all questions", "test", props.onInfinite)}{entry("Timed test", "timer", props.onTimed)}{props.onPause && entry("Pause test", "timer", props.onPause)}{props.onRestart && entry("Restart test", "test", props.onRestart)}</div></details>
      <details><summary><Icon name="chart" />Reports</summary><div>{entry("Statistics", "chart", props.onReports)}{entry("Clear data", "trash", props.onClearData)}</div></details>
    </nav>}
  </div>;
}
