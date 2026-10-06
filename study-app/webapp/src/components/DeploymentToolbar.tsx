import type { JSX } from "react";
import { useEffect, useState } from "react";

interface Branch {
  name: string;
  path: string;
  published: boolean;
}

interface DeploymentToolbarProps {
  version: string;
  branch: string;
  navigate?: (url: string) => void;
}

export function DeploymentToolbar({ version, branch, navigate = (url) => window.location.assign(url) }: DeploymentToolbarProps): JSX.Element {
  const [branches, setBranches] = useState<Branch[]>([{ name: branch, path: "", published: true }]);
  const siteRoot = document.querySelector<HTMLMetaElement>('meta[name="study-app-site-root"]')?.content;

  useEffect(() => {
    if (!siteRoot || !["http:", "https:"].includes(window.location.protocol)) return;
    const controller = new AbortController();
    fetch(new URL("branches.json", siteRoot), { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Branch list unavailable");
        return response.json() as Promise<{ branches: Branch[] }>;
      })
      .then((manifest) => setBranches(manifest.branches))
      .catch(() => { /* A downloaded HTML file still works without the hosted branch list. */ });
    return () => controller.abort();
  }, [siteRoot]);

  return <aside className="deployment-toolbar" aria-label="App version and branch">
    <span title={`Version ${version}`}>v{version}</span>
    <label htmlFor="deployment-branch">Branch</label>
    <select id="deployment-branch" value={branch} onChange={(event) => {
      const selected = branches.find((item) => item.name === event.target.value);
      if (siteRoot && selected?.published) navigate(new URL(`${selected.path}index.html`, siteRoot).href);
    }}>
      {!branches.some((item) => item.name === branch) && <option value={branch} disabled>{branch} (deleted)</option>}
      {branches.map((item) => <option key={item.name} value={item.name} disabled={!item.published}>
        {item.name}{item.published ? "" : " (build pending)"}
      </option>)}
    </select>
  </aside>;
}
