// Пересчитать отпечатки эталонных снимков поиска по фото после замены файлов в
// `public/demo/photo-search/` (например, своих фото плуга). Отпечаток считается в Chromium
// тем же кодом, что на сайте (`imageFingerprint` из `src/components/image-tools.ts`), и
// записывается в `src/server/photo-search/profiles.ts` у снимка с тем же именем файла.
//
// Запуск: node scripts/photo-search-fingerprints.mjs   (нужны npm ci и Playwright с Chromium)

import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node-tools/node_modules/playwright");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const profilesPath = join(root, "src/server/photo-search/profiles.ts");
const photosDir = join(root, "public/demo/photo-search");

const bundle = await build({
  stdin: {
    contents: `import { imageFingerprint } from "./src/components/image-tools.ts"; window.imageFingerprint = imageFingerprint;`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "iife",
  write: false,
});

let profiles = await readFile(profilesPath, "utf8");
const files = [...profiles.matchAll(/file: "([^"]+)"/g)].map((m) => m[1]);

const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.setContent("<body></body>");
await page.addScriptTag({ content: bundle.outputFiles[0].text });

let changed = 0;
for (const file of files) {
  const data = (await readFile(join(photosDir, file))).toString("base64");
  const type = file.endsWith(".png")
    ? "image/png"
    : file.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  const fingerprint = await page.evaluate(
    async ({ data, type }) => {
      const blob = await (await fetch(`data:${type};base64,${data}`)).blob();
      return window.imageFingerprint(blob);
    },
    { data, type },
  );
  const pattern = new RegExp(
    `(file: "${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",[\\s\\S]*?fingerprint: ")([0-9a-f]*)(")`,
  );
  const before = profiles.match(pattern)?.[2];
  if (before !== fingerprint) {
    profiles = profiles.replace(pattern, `$1${fingerprint}$3`);
    changed++;
  }
  console.log(
    `${file}: ${fingerprint}${before === fingerprint ? "" : `  (было ${before || "—"})`}`,
  );
}
await browser.close();

if (changed) {
  await writeFile(profilesPath, profiles);
  console.log(`Обновлено отпечатков: ${changed}. Проверьте: npm test`);
} else {
  console.log("Отпечатки не изменились.");
}
