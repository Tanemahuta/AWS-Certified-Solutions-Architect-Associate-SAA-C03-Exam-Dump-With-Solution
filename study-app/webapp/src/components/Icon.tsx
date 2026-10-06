import type { JSX } from "react";

export type IconName = "home" | "learn" | "test" | "timer" | "chart" | "trash" | "menu" | "next" | "previous" | "restart" | "pause" | "play" | "save" | "load";
const paths: Record<IconName, string> = {
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  learn: "M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15",
  test: "M8 4H4v17h16V4h-4M8 2h8v5H8ZM8 12l2 2 5-5M8 18h8",
  timer: "M9 2h6M12 5v2M19 5l2 2M12 10v5l3 2M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
  chart: "M4 3v18h17M8 17v-5M13 17V7M18 17V4",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  menu: "M4 6h16M4 12h16M4 18h16",
  next: "M5 12h14M13 6l6 6-6 6",
  save: "M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8M14 4v3",
  load: "M3 20V8h7l2 2h9v10ZM12 2v5M9 4l3 3 3-3",
  pause: "M8 5v14M16 5v14",
  play: "M8 4l12 8-12 8Z",
  restart: "M20 8a8 8 0 0 0-13-2L4 9M4 4v5h5M4 16a8 8 0 0 0 13 2l3-3M20 20v-5h-5",
  previous: "M19 12H5M11 6l-6 6 6 6",
};

/** Inline vectors keep icons available in the downloaded, single-file app. */
export function Icon({ name }: { name: IconName }): JSX.Element {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
