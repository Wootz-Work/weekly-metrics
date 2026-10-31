import { CONFIG } from './config.js';
import { computeMetrics } from './pipeline.js';
import { fetchAllRaw } from './glideApi.js';
import { fetchExchangeRates } from './exchangeRates.js';

const $grid = document.getElementById('grid');
const $status = document.getElementById('status');
const $debug = document.getElementById('debug');
const showDebug = new URLSearchParams(location.search).has('debug');

const useSample = new URLSearchParams(location.search).has('sample');

async function loadRaw() {
  if (useSample) {
    // ?sample -> synthetic data (test/fixture.mjs) with field names == keys
    const res = await fetch('./data/sample-raw.json', { cache: 'no-store' });
    return res.json();
  }
  if (CONFIG.dataMode === 'server') {
    // forward the embed URL's ?k=<ACCESS_KEY> (if any) to the server
    const k = new URLSearchParams(location.search).get('k');
    const res = await fetch(`${CONFIG.serverDataUrl}${k ? `?k=${encodeURIComponent(k)}` : ''}`, { cache: 'no-store' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Could not load data (HTTP ${res.status})`);
    return body;
  }
  if (CONFIG.dataMode === 'glide-api') {
    const exchange = await fetchExchangeRates(CONFIG.exchangeRate.apiKey, CONFIG.exchangeRate.base);
    return fetchAllRaw(CONFIG, CONFIG.glide.token, exchange);
  }
  const res = await fetch(`${CONFIG.staticJsonUrl}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load ${CONFIG.staticJsonUrl} (HTTP ${res.status})`);
  return res.json();
}

// For ?sample: same config but column names == code names
function sampleConfig() {
  const tables = {};
  for (const [k, t] of Object.entries(CONFIG.tables)) {
    tables[k] = { ...t, fields: Object.fromEntries(Object.keys(t.fields).map((f) => [f, f])) };
  }
  return { ...CONFIG, tables };
}

function render(cards) {
  $grid.innerHTML = '';
  for (const c of cards) {
    if (!c.visible) continue;
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.card = c.key;
    // Glide shows an empty Rich Text when the JS column errors / is empty
    cell.innerHTML = c.html || '';
    $grid.appendChild(cell);
  }
}

async function run() {
  try {
    let raw, cards, debug;
    if (CONFIG.dataMode === 'static-cards' && !useSample) {
      const res = await fetch(`${CONFIG.staticCardsUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not load ${CONFIG.staticCardsUrl} (HTTP ${res.status})`);
      raw = await res.json();
      ({ cards, debug } = raw);
      // switches are applied at view time
      const C = CONFIG.components || {};
      const sw = { won: !!C.won, wonValue: !!C.wonValue, totalQuoted: !!C.totalQuoted };
      cards = cards.map((c) => (c.key in sw ? { ...c, visible: sw[c.key] } : c));
    } else {
      raw = await loadRaw();
      ({ cards, debug } = computeMetrics(raw.tables, useSample ? sampleConfig() : CONFIG));
    }
    render(cards);
    const asOf = raw.fetchedAt ? new Date(raw.fetchedAt).toLocaleString() : '';
    $status.textContent = asOf ? `Data as of ${asOf}` : '';
    if (showDebug) {
      $debug.hidden = false;
      $debug.textContent = JSON.stringify(debug, null, 2);
    }
  } catch (e) {
    console.error(e);
    $status.textContent = `Error: ${e.message}`;
    $status.classList.add('error');
  }
}

document.title = CONFIG.page.title;
document.getElementById('title').textContent = CONFIG.page.title;
if (!CONFIG.page.showHeader) document.getElementById('header').hidden = true;

run();
if (CONFIG.page.autoRefreshMinutes > 0) {
  setInterval(run, CONFIG.page.autoRefreshMinutes * 60000);
}
