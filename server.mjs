// =============================================================================
// Tiny web service (Render / local). No dependencies.
//
//   GET /            -> the page (index.html, css/, js/)
//   GET /api/data    -> raw Glide rows + derived conversion rates, fetched on
//                       request (= when someone opens / reloads the page).
//                       The keys stay here; the browser computes the cards.
//   GET /healthz     -> "ok" (Render health check)
//
// Env:  GLIDE_TOKEN, EXCHANGE_RATE_API_KEY   (required)
//       ACCESS_KEY      optional: /api/data then needs ?k=<ACCESS_KEY>
//                       (put it in the Web Embed URL: https://…/?k=<ACCESS_KEY>)
//       CACHE_SECONDS   reuse one Glide fetch for this long (default 60), so
//                       several viewers opening the page together cost one fetch
//       PORT            set by Render (default 8080)
//
// Local:  npm start   (reads .env)
// =============================================================================
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from './js/config.js';
import { fetchAllRaw } from './js/glideApi.js';
import { fetchExchangeRates, ratesStillFresh } from './js/exchangeRates.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const CACHE_MS = (Number(process.env.CACHE_SECONDS) || 60) * 1000;
const { GLIDE_TOKEN, EXCHANGE_RATE_API_KEY, ACCESS_KEY } = process.env;

const MISSING = ['GLIDE_TOKEN', 'EXCHANGE_RATE_API_KEY'].filter((k) => !process.env[k]);
if (MISSING.length) console.warn(`WARNING missing ${MISSING.join(', ')}: /api/data will fail (?sample still works)`);

// ---- Data -------------------------------------------------------------------
let exchange = null;                 // exchange rate API response, kept until its next daily update
let cached = null;                   // { at, raw }
let inflight = null;                 // one Glide fetch at a time

async function getRaw() {
  if (MISSING.length) throw new Error(`Server is missing ${MISSING.join(', ')}`);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.raw;
  inflight ??= (async () => {
    try {
      if (!ratesStillFresh(exchange, CONFIG.exchangeRate.base)) {
        exchange = await fetchExchangeRates(EXCHANGE_RATE_API_KEY, CONFIG.exchangeRate.base);
      }
      const raw = await fetchAllRaw(CONFIG, GLIDE_TOKEN, exchange);
      cached = { at: Date.now(), raw };
      return raw;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// ---- Static files (only what the page needs: never .env, .cache, scripts) -----
const PUBLIC = ['index.html', `css${sep}`, `js${sep}`, join('data', 'sample-raw.json')];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
};

async function serveFile(pathname, res) {
  const rel = normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname)).replace(/^[/\\]+/, '');
  if (!PUBLIC.some((p) => rel === p || (p.endsWith(sep) && rel.startsWith(p)))) return send(res, 404, 'Not found');
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    send(res, 404, 'Not found');
  }
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  if (url.pathname === '/healthz') return send(res, 200, 'ok');
  if (url.pathname === '/api/data') {
    if (ACCESS_KEY && url.searchParams.get('k') !== ACCESS_KEY) return send(res, 401, '{"error":"Missing or wrong access key"}', 'application/json');
    try {
      return send(res, 200, JSON.stringify(await getRaw()), 'application/json');
    } catch (e) {
      console.error(e);
      return send(res, 502, JSON.stringify({ error: e.message }), 'application/json');
    }
  }
  return serveFile(url.pathname, res);
}).listen(PORT, () => console.log(`Weekly Metrics on http://localhost:${PORT}`));
