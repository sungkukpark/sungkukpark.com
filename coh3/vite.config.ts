import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const coh3Root = path.resolve(import.meta.dirname);

export default defineConfig({
  root: coh3Root,
  base: "/coh3/",
  plugins: [react()],
  publicDir: path.join(coh3Root, "public"),
  build: {
    outDir: path.resolve(coh3Root, "..", "dist", "coh3"),
    emptyOutDir: true,
  },
});
