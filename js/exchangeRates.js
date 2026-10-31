// =============================================================================
// Re-implementation of the two computed columns of the Glide "Currency rates"
// table, which the Glide API does not return:
//
//   "Currency API response" = Call API  GET https://v6.exchangerate-api.com/v6/<key>/pair/USD/<Currency code>
//   "conversion rate"       = JSON query on that response -> conversion_rate
//                             (units of <Currency code> per 1 USD)
//
// One call to /latest/USD returns the same numbers for every currency
// (conversion_rates[<code>] === /pair/USD/<code>.conversion_rate, both are the
// daily rate), so we call it once instead of once per row. This keeps us far
// below the free plan quota (1,500 requests / month).
// =============================================================================

const API = 'https://v6.exchangerate-api.com/v6';

// -> { base, lastUpdateUtc, nextUpdateUnix, rates: { INR: 95.07, ... } }
export async function fetchExchangeRates(apiKey, base = 'USD') {
  if (!apiKey) throw new Error('Missing exchange rate API key (EXCHANGE_RATE_API_KEY)');
  const res = await fetch(`${API}/${encodeURIComponent(apiKey)}/latest/${encodeURIComponent(base)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.result !== 'success') {
    throw new Error(`Exchange rate API: ${json['error-type'] || `HTTP ${res.status}`}`);
  }
  return {
    base: json.base_code,
    lastUpdateUtc: json.time_last_update_utc,
    nextUpdateUnix: json.time_next_update_unix,
    rates: json.conversion_rates,
  };
}

// True while the cached response is still the latest the API will give.
export function ratesStillFresh(cached, base = 'USD', nowMs = Date.now()) {
  return !!(cached && cached.rates && cached.base === base && cached.nextUpdateUnix * 1000 > nowMs);
}

// Fill the derived "conversion rate" column on the raw Currency rates rows.
// A code the API does not know (or an empty code) gets an empty rate, like the
// Glide column would. Returns the codes that got no rate.
export function applyConversionRates(rows, fields, rates) {
  const missing = [];
  for (const row of rows) {
    const code = row[fields.currencyCode];
    const rate = code == null || code === '' ? undefined : rates[String(code)];
    if (rate === undefined) {
      delete row[fields.conversionRate];
      missing.push(code);
    } else {
      row[fields.conversionRate] = rate;
    }
  }
  return missing;
}
