
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Required for GitHub Pages repository:
  // https://ayush-uttam732.github.io/PORTFOLIO/
  base: "/PORTFOLIO/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
});
