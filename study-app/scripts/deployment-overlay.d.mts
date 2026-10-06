interface OverlayBranch {
  name: string;
  path: string;
  published: boolean;
}

export function renderDeploymentOverlay(options?: { version?: string; branch?: string; branches?: OverlayBranch[] }): string;
