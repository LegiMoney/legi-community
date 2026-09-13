import { rmSync, mkdirSync, cpSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

copyFileSync(join(root, "index.html"), join(dist, "index.html"));
cpSync(join(root, "css"), join(dist, "css"), { recursive: true });
cpSync(join(root, "js"), join(dist, "js"), { recursive: true });
cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });

// registry.json is fetched at runtime by js/app.js (./registry.json) — the
// build is not deployable without it, even though it isn't one of the
// named directories.
if (existsSync(join(root, "registry.json"))) {
  copyFileSync(join(root, "registry.json"), join(dist, "registry.json"));
}

console.log(`built dist/ at ${dist}`);
