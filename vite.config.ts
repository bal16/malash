import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import solid from "vite-plugin-solid";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    tailwindcss(),
    solid(),
    webExtension({
      manifest: "public/manifest.json",
    }),
  ],
  // @ts-ignore - vitest types augment vite config
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
