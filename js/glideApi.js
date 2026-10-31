// =============================================================================
// Raw row fetching from the Glide API. Used by the browser (glide-api mode)
// and by scripts/fetch-data.mjs (GitHub Action / local).
// Returns ONLY the basic columns, in table order.
// =============================================================================
import { applyConversionRates } from './exchangeRates.js';

export const TABLE_KEYS = ['rfqs', 'companies', 'statusUpdates', 'currencyRates', 'purchaseOrders'];

async function fetchV1(tableName, { appId, token }) {
  const rows = [];
  let startAt;
  for (let guard = 0; guard < 1000; guard++) {
    const query = { tableName, utc: true };
    if (startAt) query.startAt = startAt;
    const res = await fetch('https://api.glideapp.io/api/function/queryTables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appID: appId, queries: [query] }),
    });
    if (!res.ok) throw new Error(`Glide v1 ${tableName}: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    const part = Array.isArray(json) ? json[0] : json;
    rows.push(...(part.rows || []));
    if (!part.next) break;
    startAt = part.next;
  }
  return rows;
}

async function fetchV2(tableId, { token }) {
  const rows = [];
  let continuation;
  for (let guard = 0; guard < 1000; guard++) {
    const url = new URL(`https://api.glideapps.com/tables/${encodeURIComponent(tableId)}/rows`);
    if (continuation) url.searchParams.set('continuation', continuation);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Glide v2 ${tableId}: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    rows.push(...(json.data || []));
    if (!json.continuation) break;
    continuation = json.continuation;
  }
  return rows;
}

export async function fetchTable(tableCfg, glideCfg, token) {
  if (!tableCfg.table || tableCfg.table === 'FILL_ME') return [];
  const opts = { appId: glideCfg.appId, token };
  return glideCfg.apiFlavor === 'v2' ? fetchV2(tableCfg.table, opts) : fetchV1(tableCfg.table, opts);
}

// Only keep the configured columns (smaller payload, no unrelated data in the repo).
function pick(rows, fields) {
  const cols = Object.values(fields);
  return rows.map((r) => {
    const o = {};
    for (const c of cols) if (c in r) o[c] = r[c];
    return o;
  });
}

// exchange = result of fetchExchangeRates(): fills the derived Currency rates
// "conversion rate" column (see js/exchangeRates.js).
export async function fetchAllRaw(config, token, exchange) {
  // tables in parallel; row order inside each table is kept
  const out = {};
  await Promise.all(TABLE_KEYS.map(async (key) => {
    const t = config.tables[key];
    out[key] = pick(await fetchTable(t, config.glide, token), t.fields);
  }));
  const raw = { fetchedAt: new Date().toISOString(), tables: out };
  if (exchange) {
    const missing = applyConversionRates(out.currencyRates, config.tables.currencyRates.fields, exchange.rates);
    raw.exchangeRates = { base: exchange.base, lastUpdateUtc: exchange.lastUpdateUtc, missingCodes: missing };
  }
  return raw;
}
