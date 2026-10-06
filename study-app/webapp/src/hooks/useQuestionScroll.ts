import { useEffect } from "react";

/** Reset page scroll after rendering a different question, including keyboard navigation. */
export function useQuestionScroll(questionKey: string | number | undefined): void {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [questionKey]);
}
