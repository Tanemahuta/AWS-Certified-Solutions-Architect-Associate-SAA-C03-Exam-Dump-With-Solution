import type { JSX } from "react";
import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import javascript from "highlight.js/lib/languages/javascript";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("plaintext", plaintext);

export function CodeBlock({ code, language }: { code: string; language?: string }): JSX.Element {
  const highlighted = useMemo(() => {
    if (language) {
      const supported = hljs.getLanguage(language) ? language : "plaintext";
      return hljs.highlight(code, { language: supported });
    }
    return hljs.highlightAuto(code);
  }, [code, language]);
  const detected = highlighted.language ?? "plaintext";
  // Highlight.js escapes the source before producing its own highlighting spans.
  // Never pass the original source or arbitrary database HTML to this property.
  return <code className={`code-block hljs language-${detected}`} data-language={detected}
    aria-label={`${detected} code`} dangerouslySetInnerHTML={{ __html: highlighted.value }} />;
}
