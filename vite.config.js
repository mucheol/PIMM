import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { galleryManifestPlugin } from "./vite-plugins/galleryManifest.js";

export default defineConfig({
  plugins: [vue(), galleryManifestPlugin()]
});
