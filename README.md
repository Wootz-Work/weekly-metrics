# Weekly Metrics (native copy of the Glide "Weekly Metrics" screen)

This is a small web service (one Node file, no dependencies) you can host on Render. It reads the raw rows from your Glide tables, works out every metric the same way the Glide screen does, and draws the same cards.

- **Logic:** every Glide JavaScript column is copied unchanged in `js/glideColumns.js`. The card HTML is copied unchanged in `js/cards.js`.
- **Other Glide columns:** the Query, Lookup, If-Then-Else, Math, Rollup, Template, Joined List and JSON Object columns are rebuilt in `js/pipeline.js`. The Glide API only returns basic (stored) columns, so these have to be recomputed.
- **Hidden cards:** Won, Won Value and Total Quoted are behind switches in `js/config.js`. They are **OFF** by default.

```
index.html              page shell (Glide container, 4 columns)
css/styles.css          page background / grid only (cards carry their own inline styles)
js/config.js            <-- the ONLY file you edit: tables, columns, switches
js/glideColumns.js      verbatim Glide JS columns (week buckets, values, quote time, trends)
js/cards.js             verbatim Glide JS Card columns (the HTML of each card)
js/pipeline.js          Glide Query/Lookup/If/Math/Rollup/Template/Join/JSON re-implementation + wiring
js/glideApi.js          Glide API fetch (v1 queryTables or v2 Big Tables), keeps table order
js/exchangeRates.js     Currency rates "Currency API response" -> "conversion rate" (exchangerate-api.com)
.env                    your keys: GLIDE_TOKEN, EXCHANGE_RATE_API_KEY (gitignored; template in .env.example)
js/app.js               loads data, computes, renders
server.mjs              web service: serves the page + /api/data (fetches Glide on page load)
render.yaml             Render deploy config
scripts/fetch-data.mjs  CLI check: fetches Glide -> data/raw.json + data/cards.json, prints warnings
test/verify.mjs         verification suite (npm test)
data/sample-raw.json    synthetic data reproducing the Glide screen of 30 Oct 2026
```

## 1. Fill in `js/config.js`
- **API flavour and app id:** set `glide.apiFlavor` (`v1` for normal Glide Tables, `v2` for Big Tables) and `glide.appId`.
- **Table ids and column names:** for each table, set `table` (the table id) and the column names. You can find both in the Glide Data editor under **Show API**.
- **Row ID:** in the v1 API the row id is `$rowID`.
- **Currency rates:** the app has **two** tables called "Currency rates". Use the one that the *Status updates → Rel-currency* relation points to.

## 2. Put your keys in `.env`
`GLIDE_TOKEN` (Glide: **Show API** → the Bearer token) and `EXCHANGE_RATE_API_KEY` (the key in the Glide Call API URL). `.env` is gitignored. Needs Node 22.9+.

**Currency rates:** in Glide, *conversion rate* is a computed column: a Call API column (`…/v6/<key>/pair/USD/<Currency code>`) followed by a JSON query. The Glide API does not return it, so the server derives it. It makes one `/latest/USD` call, which gives the same numbers for every code, and reuses it until the API's next daily update.

## 3. Test locally
```bash
npm test         # verification suite (no Glide access needed)
npm start        # server (uses .env), then open:
#   http://localhost:8080/?debug           -> your real data + all intermediate values
#   http://localhost:8080/?sample&debug    -> synthetic data, should look like the Glide screen
npm run fetch    # CLI check: row counts, conversion rate per currency, WARNING for column ids not found
```
`?debug` prints every intermediate column value, such as `JS RFQs added W1..W5`, `JS RFQs Quotes Weekwise` and `Relative Active week indicator`. You can compare them one by one with the columns in **Metrics (Do not touch)** in the Glide Data editor.

## 4. Deploy on Render
1. Push this folder to a GitHub repo. `.env` is gitignored, so your keys are not pushed.
2. In Render, go to **New → Blueprint** and pick the repo. It reads `render.yaml`.
3. Render asks for `GLIDE_TOKEN`, `EXCHANGE_RATE_API_KEY` and `ACCESS_KEY`. `ACCESS_KEY` is optional; make up a long random string.
4. Put the service URL in the Glide **Web Embed**: `https://<service>.onrender.com/?k=<ACCESS_KEY>`. Leave out `?k=` if you didn't set `ACCESS_KEY`.

Every push to the repo redeploys the service.

**How data is loaded:** the page calls `/api/data` when it is opened or reloaded. The server then fetches the 5 Glide tables (about 5 API calls, plus more for large tables) and adds the conversion rates. If several people open the page within `CACHE_SECONDS` (60 by default), they share one fetch. The cards are computed in the viewer's browser, the same way Glide does it.

> **Free plan:** the service sleeps after 15 minutes without visits. The next visit then takes about a minute to load. The `starter` plan stays on all the time.
>
> **Privacy:** `/api/data` returns the selected raw columns, such as customer names and quote values. Anyone with the URL can see them unless you set `ACCESS_KEY`. The Glide and exchange-rate keys never leave the server.

## Data modes (`dataMode` in `js/config.js`)
| mode | data source | freshness |
|---|---|---|
| `server` (default) | `/api/data` from `server.mjs` | live on every page load (≤ `CACHE_SECONDS` old) |
| `static-json` | `data/raw.json` written by `npm run fetch` | as of the last fetch |
| `static-cards` | `data/cards.json` written by `npm run fetch` | as of the last fetch |
| `glide-api` | Glide API called from the browser | live, but **the token is exposed**, so use it only for local tests |

## Glide behaviour that cannot be read from the editor (`config.semantics`)
The defaults are the most literal reading. If one number differs from Glide, try the switch for it.
- **`dateCompare`** (`'datetime'` or `'day'`): how Glide's "is on or after" and "is before" compare dates.
  - It only matters at the very edge of the 45, 14 and 180 day windows.
  - It also matters for *Query - Last update*, which feeds Avg. Quote time.
- **`textCompare`** (`'exact'` or `'case-insensitive'`): how status text and relations are matched.
- **`lastUpdatePick`** (`'last'` or `'first'`): *Query - Last update* is a single match sorted by "Table order" with the reverse arrow selected. That means the last matching row in table order, so the data must arrive in table order. The fetch keeps the API order.

## Exact wiring (Glide → code)
| Card (Rich Text) | JS Card params | Built from |
|---|---|---|
| Received | Template chart = `W1,W2,W3,W4,W5`; JS unique customers added W1; `"true"` | All RFQs: Received date ≥ NOW−45d, archive not checked → JSON {Active RFQ, Received date, 🔒 Row ID, Customer} |
| New Customers | JS unique customers added W1 copy | All companies: Added date ≥ NOW−45d → JSON {Name, Added date, Local currency} |
| Quoted | JS RFQs Quotes Weekwise; JS RFQs quoted value | Status updates: to = Quoted, at ≥ NOW−45d, RFQ archive not checked |
| Total Open | RFQs active open count; Relative Active week indicator | All RFQs: Active RFQ = 1 (Live/Repricing/Hot), not archived · Status updates: at ≥ NOW−14d, to ∈ {Live, Repricing, Hot, Sampling} |
| Quoted Value | JS RFQs quoted value | as Quoted; value_usd = Quote value ÷ Currency rates.conversion rate (by Quote currency) |
| Total Sampling | RFQs sampling count; Relative Sampling week indicator | All RFQs: Current status = Sampling, not archived · same Active status updates |
| Avg. Quote time | Quote timeline/Weekwise; "Avg. Quote time"; `"false"` | Quoted status updates; last_updated_date = RFQ Added date when there is no earlier Quoted update for that RFQ, otherwise the time of the previous status update |
| Won *(off)* | Won/Count Weekwise; "Won"; `"true"` | Status updates: to = Won, at ≥ NOW−45d |
| Won Value *(off)* | Won JS Value (calendar months) | Purchase Orders: Created at ≥ NOW−180d, Verification checked |
| Total Quoted *(off)* | Count Total RFQs Quoted | All RFQs: Current status = Quoted, not archived |

## Not ported, on purpose: these do not feed any card
- **Template charts and single-week columns:** the Template chart of the Quoted, Won and Quote timeline groups, and the single-week columns behind them (JS RFQs Quotes W2–W5, Won Count W2–W5, Quote timeline Count W1–W5).
- **Duplicate or debug columns:** "JS value quoted" (a copy of "JS RFQs quoted value"), "Count rfqs received", "Count rfqs Open", "Current Week and Last Week" (ported but only shown in `?debug`).
- **Unused helpers:** the user-specific `… static` text columns, and the "Filter date" and "Last 3/6 months" helpers.

## Assumptions to check before switching on Won Value
The Purchase Orders "USD Conversion rate" chain was not opened in Glide. The code assumes:
- Customer → All companies, matched on `customerMatchesCompanyField`.
- The company's Local currency → Currency rates.
- Won value USD = Won value (Local currency) ÷ rate.
