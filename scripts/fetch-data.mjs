// Fetch raw rows from Glide (+ exchange rates) and write:
//   data/raw.json   -> used by dataMode 'static-json' (browser computes live)
//   data/cards.json -> used by dataMode 'static-cards' (pre-computed snapshot)
//
// Usage:  npm run fetch          (reads keys from .env, see .env.example)
//    or:  GLIDE_TOKEN=xxxx EXCHANGE_RATE_API_KEY=yyyy node scripts/fetch-data.mjs
// Env:    PUBLISH_RAW=false  -> do not write data/raw.json (privacy)
//         TZ=Asia/Kolkata    -> set this! The card "days elapsed" uses the local
//                               weekday (browser timezone in Glide = IST for your users).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { CONFIG } from '../js/config.js';
import { fetchAllRaw } from '../js/glideApi.js';
import { fetchExchangeRates, ratesStillFresh } from '../js/exchangeRates.js';
import { computeMetrics } from '../js/pipeline.js';

const token = process.env.GLIDE_TOKEN || CONFIG.glide.token;
const rateKey = process.env.EXCHANGE_RATE_API_KEY || CONFIG.exchangeRate.apiKey;
if (!token) {
  console.error('Missing GLIDE_TOKEN (put it in .env)');
  process.exit(1);
}
if (!rateKey) {
  console.error('Missing EXCHANGE_RATE_API_KEY (put it in .env)');
  process.exit(1);
}

// Exchange rates change once a day: reuse the cached response until the API's
// next update time, so a 15-minute schedule costs ~1 request a day.
const cacheFile = new URL('../.cache/exchange-rates.json', import.meta.url);
const base = CONFIG.exchangeRate.base;
let exchange = await readFile(cacheFile, 'utf8').then(JSON.parse).catch(() => null);
if (ratesStillFresh(exchange, base)) {
  console.log(`exchange rates: cached (${exchange.lastUpdateUtc})`);
} else {
  exchange = await fetchExchangeRates(rateKey, base);
  await mkdir(new URL('../.cache/', import.meta.url), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(exchange));
  console.log(`exchange rates: fetched (${exchange.lastUpdateUtc})`);
}

const raw = await fetchAllRaw(CONFIG, token, exchange);
await mkdir(new URL('../data/', import.meta.url), { recursive: true });

if (process.env.PUBLISH_RAW !== 'false') {
  await writeFile(new URL('../data/raw.json', import.meta.url), JSON.stringify(raw));
}

const { cards, debug } = computeMetrics(raw.tables, CONFIG);
await writeFile(
  new URL('../data/cards.json', import.meta.url),
  JSON.stringify({ fetchedAt: raw.fetchedAt, cards, debug }),
);

// ---- Report ----------------------------------------------------------------
for (const [k, rows] of Object.entries(raw.tables)) {
  console.log(`${k}: ${rows.length} rows`);
  // A configured column that is in no row is usually a wrong column id
  // (or a column that is empty in every row).
  const fields = CONFIG.tables[k].fields;
  for (const [name, col] of Object.entries(fields)) {
    if (k === 'currencyRates' && name === 'conversionRate') continue; // derived
    if (rows.length && !rows.some((r) => col in r)) {
      console.warn(`  WARNING ${k}.${name}: column "${col}" not found in any row`);
    }
  }
}
const { currencyCode, conversionRate } = CONFIG.tables.currencyRates.fields;
console.log(`conversion rates (${base} -> code):`,
  Object.fromEntries(raw.tables.currencyRates.map((r) => [r[currencyCode], r[conversionRate]])));
if (raw.exchangeRates.missingCodes.length) {
  console.warn('  WARNING no rate for currency codes:', raw.exchangeRates.missingCodes);
}
console.log(JSON.stringify(debug, null, 2));
