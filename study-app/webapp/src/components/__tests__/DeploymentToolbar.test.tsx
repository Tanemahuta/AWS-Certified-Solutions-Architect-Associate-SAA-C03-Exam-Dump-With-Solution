import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeploymentToolbar } from "../DeploymentToolbar";

describe("DeploymentToolbar", () => {
  afterEach(() => {
    document.querySelector('meta[name="study-app-site-root"]')?.remove();
    jest.restoreAllMocks();
  });

  it("displays the embedded version and branch without requesting a branch list for a standalone file", () => {
    render(<DeploymentToolbar version="1.2.3" branch="main" />);
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Branch" })).toHaveValue("main");
  });

  it("loads the root branch list from a nested preview and navigates to the selected branch", async () => {
    const meta = document.createElement("meta");
    meta.name = "study-app-site-root";
    meta.content = "https://example.github.io/repo/";
    document.head.append(meta);
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ branches: [
      { name: "main", path: "", published: true },
      { name: "feat/a", path: "feat/a/", published: true },
      { name: "pending", path: "pending/", published: false },
    ] }) });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock;
    const navigate = jest.fn();
    try {
      render(<DeploymentToolbar version="1.2.3-preview.shaabc" branch="feat/a" navigate={navigate} />);
      await waitFor(() => expect(screen.getByRole("option", { name: "main" })).toBeInTheDocument());
      expect(fetchMock.mock.calls[0][0].href).toBe("https://example.github.io/repo/branches.json");
      expect(screen.getByRole("option", { name: "pending (build pending)" })).toBeDisabled();
      fireEvent.change(screen.getByRole("combobox", { name: "Branch" }), { target: { value: "main" } });
      expect(navigate).toHaveBeenCalledWith("https://example.github.io/repo/index.html");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
