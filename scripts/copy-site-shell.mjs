import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });
await copyFile(path.join(root, "index.html"), path.join(dist, "index.html"));
