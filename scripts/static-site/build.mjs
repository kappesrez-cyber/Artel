// Статическая копия сайта для GitHub Pages: обходит запущенное приложение (с демо-базой),
// сохраняет готовый HTML каждой страницы без скриптов Next.js и все картинки, стили и шрифты.
// Ссылки переписываются в относительные, поэтому копия работает и на
// https://<user>.github.io/<repo>/, и на своём домене, и просто из папки.
//
// Запуск (приложение уже работает на BASE, по умолчанию http://localhost:3000):
//   node scripts/static-site/build.mjs [папка=docs]
// Подробнее — scripts/static-site/README.md.

import { createHash } from "node:crypto";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node-tools/node_modules/playwright");
}

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "docs";
const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_PAGES = Number(process.env.MAX_PAGES ?? 600);

/** Поисковые запросы, для которых заранее сохраняются страницы результатов. */
const SEARCH_QUERIES = [
  "деталь",
  "подшипник",
  "подшипник 6205",
  "6205-2RS",
  "6205",
  "6206",
  "6305",
  "180205",
  "SKF",
  "фильтр",
  "фильтр гидравлический",
  "Hydac",
  "гидроцилиндр",
  "вал",
  "вал приводной жатки",
  "цепь",
  "цепь приводная",
  "манжета",
  "ремень",
  "ремень клиновой",
  "нож",
  "сегмент ножа",
  "жатка",
  "шкив",
  "мотовило",
  "амилаза",
  "фермент",
  "подшипнк", // опечатка: показывает исправление
  "насос",
];

const SKIP_PATH = [/^\/api\//, /^\/_next\//, /^\/logout/];

const pages = new Map(); // ключ URL -> { file }
const assets = new Map(); // URL ассета -> файл
const queue = [];

const searchIndex = {}; // запрос (нижний регистр) -> файл

function keyOf(u) {
  const url = new URL(u, BASE);
  url.hash = "";
  url.searchParams.sort();
  return url.pathname.replace(/\/$/, "") + (url.search || "") || "/";
}

function shortHash(s) {
  return createHash("sha1").update(s).digest("hex").slice(0, 10);
}

/** Файл страницы в копии: /a/b -> a/b/index.html, /search?q=x -> search/q-<hash>.html. */
function pageFile(key) {
  const url = new URL(key, BASE);
  const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
  const dir = path ? path.split("/").map(safeSegment).join("/") : "";
  if (!url.search) return dir ? `${dir}/index.html` : "index.html";
  return `${dir ? dir + "/" : ""}v-${shortHash(url.search)}.html`;
}

function safeSegment(s) {
  return /^[\w.-]+$/.test(s) ? s : `x-${shortHash(s)}`;
}

const EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "text/css": ".css",
  "font/woff2": ".woff2",
  "font/woff": ".woff",
  "application/pdf": ".pdf",
};

function assetFile(u, contentType) {
  const url = new URL(u, BASE);
  let path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  path = path.replace(/^_next\//, "assets/next/");
  if (path.startsWith("api/")) path = "assets/" + path;
  const parts = path.split("/").map(safeSegment);
  let file = parts.join("/");
  if (url.search && !/\.(css|woff2?|ico)$/.test(file)) file += `-${shortHash(url.search)}`;
  const ext = EXT[(contentType ?? "").split(";")[0].trim()];
  if (ext && !file.toLowerCase().endsWith(ext) && !/\.\w{2,5}$/.test(file.split("/").pop()))
    file += ext;
  return file;
}

function relative(fromFile, toFile) {
  const rel = posix.relative(posix.dirname(fromFile), toFile);
  return rel || posix.basename(toFile);
}

function enqueue(u, ctxName = "anon") {
  const url = new URL(u, BASE);
  if (url.origin !== new URL(BASE).origin) return;
  if (SKIP_PATH.some((re) => re.test(url.pathname))) return;
  if (/\.\w{2,5}$/.test(url.pathname)) return; // файл, а не страница
  const key = keyOf(url.href);
  if (pages.has(key)) return;
  if (pages.size >= MAX_PAGES) return;
  pages.set(key, { file: pageFile(key), ctxName });
  queue.push(key);
}

async function save(file, data) {
  const full = join(OUT, file);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, data);
}

async function fetchAsset(request, u) {
  const url = new URL(u, BASE);
  if (url.origin !== new URL(BASE).origin) return null;
  const key = url.pathname + url.search;
  if (assets.has(key)) return assets.get(key);
  assets.set(key, null);
  const res = await request.get(url.href).catch(() => null);
  if (!res || !res.ok()) {
    console.warn("  ассет не скачан:", key, res?.status());
    return null;
  }
  const type = res.headers()["content-type"];
  const file = assetFile(url.href, type);
  assets.set(key, file);
  let body = await res.body();
  if ((type ?? "").startsWith("text/css")) {
    let css = body.toString("utf8");
    const refs = [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].map((m) => m[2]);
    for (const ref of new Set(refs)) {
      if (ref.startsWith("data:") || ref.startsWith("#")) continue;
      const abs = new URL(ref, url.href).href;
      const target = await fetchAsset(request, abs);
      if (target) css = css.split(ref).join(relative(file, target));
    }
    body = Buffer.from(css, "utf8");
  }
  await save(file, body);
  return file;
}

// Панель меню телефона рисуется только по нажатию: откроем, заберём разметку, закроем.
async function captureMobileMenu(page) {
  const btn = page.locator('button[aria-controls="mobile-menu"]').first();
  if (!(await btn.count())) return null;
  await btn.evaluate((b) => b.click());
  await page.waitForSelector("#mobile-menu", { timeout: 3000 }).catch(() => null);
  const html = await page.evaluate(() => {
    const menu = document.getElementById("mobile-menu");
    if (!menu) return null;
    const overlay = menu.previousElementSibling;
    return (overlay?.tagName === "BUTTON" ? overlay.outerHTML : "") + menu.outerHTML;
  });
  await btn.evaluate((b) => b.click());
  await page.waitForTimeout(50);
  return html;
}

async function crawl() {
  await rm(OUT, { recursive: true, force: true });
  const browser = await playwright.chromium.launch();
  const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Гостевой вход: та же кнопка, что видят посетители.
  {
    const p = await guest.newPage();
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /гость/i }).first().click();
    await p.waitForURL(/\/profile/, { timeout: 20000 });
    await p.close();
    console.log("Гостевая сессия получена");
  }
  const contexts = { anon, guest };

  enqueue("/");
  for (const q of SEARCH_QUERIES) enqueue(`/search?q=${encodeURIComponent(q)}`);
  enqueue("/search");
  enqueue("/profile", "guest");

  const htmlByKey = new Map();

  // Несколько вкладок сразу: обход идёт в разы быстрее.
  let active = 0;
  const worker = async () => {
    while (queue.length || active) {
      if (!queue.length) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      active++;
      try {
        await visit(queue.shift());
      } finally {
        active--;
      }
    }
  };
  await Promise.all(Array.from({ length: Number(process.env.WORKERS ?? 6) }, worker));

  async function visit(key) {
    const entry = pages.get(key);
    let ctx = contexts[entry.ctxName];
    let page = await ctx.newPage();
    let res = await page.goto(BASE + key, { waitUntil: "networkidle" }).catch((e) => e);
    let finalUrl = new URL(page.url());
    // Страница только для своих: повторяем с гостевой сессией.
    if (entry.ctxName === "anon" && finalUrl.pathname === "/login" && !key.startsWith("/login")) {
      await page.close();
      entry.ctxName = "guest";
      ctx = guest;
      page = await ctx.newPage();
      res = await page.goto(BASE + key, { waitUntil: "networkidle" }).catch((e) => e);
      finalUrl = new URL(page.url());
    }
    if (res instanceof Error || !res) {
      console.warn("Не открылась:", key, String(res));
      await page.close();
      pages.delete(key);
      return;
    }
    const finalKey = keyOf(finalUrl.href);
    if (finalKey !== key) {
      // Редирект: сохраняем как перенаправление на итоговую страницу.
      entry.redirect = finalKey;
      if (!pages.has(finalKey)) {
        pages.set(finalKey, { file: pageFile(finalKey), ctxName: entry.ctxName });
        queue.unshift(finalKey);
      }
      await page.close();
      console.log(`→ ${key}  ⇒  ${finalKey}`);
      return;
    }
    await page.waitForTimeout(150);
    const menu = await captureMobileMenu(page);
    const links = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
    for (const l of links) enqueue(l, entry.ctxName);
    const html = await page.content();
    htmlByKey.set(key, { html, menu, status: res.status() });
    console.log(`✓ ${key}  (${res.status()})  → ${entry.file}`);
    await page.close();
  }

  // Переписываем ссылки и сохраняем.
  for (const [key, entry] of pages) {
    if (entry.redirect) {
      const target = pages.get(entry.redirect);
      const href = relative(entry.file, target.file);
      await save(
        entry.file,
        `<!doctype html><meta charset="utf-8"><title>Artel</title><meta http-equiv="refresh" content="0; url=${href}"><link rel="canonical" href="${href}"><a href="${href}">Перейти</a>`,
      );
      continue;
    }
    const got = htmlByKey.get(key);
    if (!got) continue;
    // Гость видит и публичные фото, и фото своих заказов.
    const request = guest.request;
    const html = await rewrite(got.html, got.menu, entry.file, request, key);
    await save(entry.file, html);

    const url = new URL(key, BASE);
    if (url.pathname === "/search" && url.searchParams.has("q")) {
      searchIndex[url.searchParams.get("q").toLowerCase()] = entry.file;
    }
  }

  // Общие файлы копии: скрипт демо-поведения и индекс поиска.
  await save("static-demo.js", await readFile(join(HERE, "static-demo.js")));
  await save(
    "search-index.js",
    `window.ARTEL_SEARCH = ${JSON.stringify({ queries: searchIndex, empty: pages.get("/search")?.file ?? "search/index.html" })};\n`,
  );
  await save(".nojekyll", "");
  await save("404.html", await notFoundPage());

  await browser.close();
  console.log(
    `Готово: ${htmlByKey.size} страниц, ${[...assets.values()].filter(Boolean).length} файлов → ${OUT}/`,
  );
}

async function notFoundPage() {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Страница не найдена — Artel</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f6fa;color:#173780;text-align:center}a{color:#173780;font-weight:700}</style></head>
<body><main><h1>Страница не найдена</h1><p>В демо-версии сайта эта страница не сохранена.</p><p><a id="home" href="./">На главную</a></p></main>
<script>/* На github.io сайт лежит в /<репозиторий>/: ведём на его корень. */var p=location.pathname.split('/');if(location.hostname.endsWith('github.io')&&p[1])document.getElementById('home').href='/'+p[1]+'/';</script></body></html>`;
}

const ATTRS = ["href", "src", "poster", "action"];

async function rewrite(html, menu, file, request, key) {
  // Скрипты Next.js не нужны: без сервера они только ломают страницу.
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<link\b[^>]*rel="(?:preload|modulepreload)"[^>]*as="script"[^>]*>/gi, "");
  html = html.replace(/<link\b[^>]*as="script"[^>]*rel="preload"[^>]*>/gi, "");
  html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi, "");
  // Скрытые поля Server Actions бесполезны без сервера.
  html = html.replace(/<input\b[^>]*name="\$ACTION_[^"]*"[^>]*>/gi, "");

  // Меню телефона: кладём заранее, скрытым; открывает static-demo.js.
  if (menu) {
    const marker = /(<button\b[^>]*aria-controls="mobile-menu"[\s\S]*?<\/button>)/;
    const hiddenMenu = `<div data-static-menu hidden>${menu}</div>`;
    html = html.replace(marker, `$1${hiddenMenu}`);
  }

  // Все ссылки на свой сайт — относительные.
  const attrRe = new RegExp(`\\s(${ATTRS.join("|")})="([^"]*)"`, "g");
  const replacements = [];
  for (const m of html.matchAll(attrRe)) replacements.push(m);
  const out = [];
  let last = 0;
  for (const m of replacements) {
    const [whole, attr, raw] = m;
    const value = decodeEntities(raw);
    const next = await mapUrl(value, attr, file, request, html, m.index);
    out.push(html.slice(last, m.index));
    out.push(next == null ? whole : ` ${attr}="${escapeAttr(next)}"`);
    last = m.index + whole.length;
  }
  out.push(html.slice(last));
  html = out.join("");

  // srcset и url() в style.
  html = await replaceAsync(html, /\s(srcset|imagesrcset)="([^"]*)"/g, async (whole, attr, raw) => {
    const parts = await Promise.all(
      decodeEntities(raw)
        .split(",")
        .map(async (p) => {
          const [u, d] = p.trim().split(/\s+/);
          const f = await localAsset(u, file, request);
          return f ? `${f}${d ? " " + d : ""}` : p.trim();
        }),
    );
    return ` ${attr}="${escapeAttr(parts.join(", "))}"`;
  });
  html = await replaceAsync(
    html,
    /url\((&quot;|'|")?([^)'"&]+)(&quot;|'|")?\)/g,
    async (whole, q1, u) => {
      if (u.startsWith("data:") || u.startsWith("#")) return whole;
      const f = await localAsset(u, file, request);
      return f ? `url(${q1 ?? ""}${f}${q1 ?? ""})` : whole;
    },
  );

  // Демо-поведение без сервера.
  const depth = file.split("/").length - 1;
  const root = depth ? "../".repeat(depth) : "./";
  const banner = `<div data-static-banner style="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100;max-width:calc(100vw - 32px);display:none;background:#173780;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:12px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.25)"></div>`;
  html = html.replace(
    "</body>",
    `${banner}<script>window.ARTEL_ROOT=${JSON.stringify(root)};window.ARTEL_PAGE=${JSON.stringify(key)};</script><script src="${root}search-index.js"></script><script src="${root}static-demo.js"></script></body>`,
  );
  return html;
}

async function mapUrl(value, attr, file, request, html, index) {
  if (!value || value.startsWith("#") || /^(data|mailto|tel|javascript|blob):/i.test(value))
    return null;
  let url;
  try {
    url = new URL(value, BASE + "/");
  } catch {
    return null;
  }
  if (url.origin !== new URL(BASE).origin) return null;
  const tag = html.lastIndexOf("<", index);
  const tagName = html
    .slice(tag + 1, tag + 10)
    .split(/[\s>]/)[0]
    .toLowerCase();

  const isPage =
    (tagName === "a" || tagName === "form") &&
    !url.pathname.startsWith("/api/") &&
    !/\.\w{2,5}$/.test(url.pathname);
  if (tagName === "form" && attr === "action") {
    const k = keyOf(url.href);
    const p = pages.get(k);
    return p ? relative(file, p.file) : "#";
  }
  if (isPage) {
    const k = keyOf(url.href);
    const p = pages.get(k);
    const hash = url.hash || "";
    if (p) return relative(file, p.file) + hash;
    // Страница не сохранена (например, вход с ?next=): ведём на ту же страницу без параметров.
    const bare = pages.get(keyOf(url.origin + url.pathname));
    if (bare) return relative(file, bare.file) + hash;
    return relative(file, "404.html");
  }
  const f = await fetchAsset(request, url.href);
  return f ? relative(file, f) : null;
}

async function localAsset(u, file, request) {
  try {
    if (!u || u.startsWith("#")) return null;
    const url = new URL(u, BASE + "/");
    if (url.origin !== new URL(BASE).origin) return null;
    const f = await fetchAsset(request, url.href);
    return f ? relative(file, f) : null;
  } catch {
    return null;
  }
}

async function replaceAsync(str, re, fn) {
  const matches = [...str.matchAll(re)];
  const results = await Promise.all(matches.map((m) => fn(...m)));
  let out = "";
  let last = 0;
  matches.forEach((m, i) => {
    out += str.slice(last, m.index) + results[i];
    last = m.index + m[0].length;
  });
  return out + str.slice(last);
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

crawl().catch((e) => {
  console.error(e);
  process.exit(1);
});
