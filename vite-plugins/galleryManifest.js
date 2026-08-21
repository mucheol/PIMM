import fs from "node:fs";
import path from "node:path";

const GALLERY_DIR = "images/gallery";
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const MAX_PHOTOS = 40;

function buildManifest(publicDir) {
  const dir = path.join(publicDir, GALLERY_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXT.test(file))
    .map((file) => ({ file, mtime: fs.statSync(path.join(dir, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, MAX_PHOTOS)
    .map((entry) => `/${GALLERY_DIR}/${entry.file}`);
}

export function galleryManifestPlugin() {
  let publicDir = "";
  return {
    name: "gallery-manifest",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    configureServer(server) {
      server.middlewares.use(`/${GALLERY_DIR}/manifest.json`, (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(buildManifest(publicDir)));
      });
    },
    buildStart() {
      const dir = path.join(publicDir, GALLERY_DIR);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(buildManifest(publicDir)));
    },
  };
}
