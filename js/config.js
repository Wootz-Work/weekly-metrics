// =============================================================================
// CONFIG — the ONLY file you need to edit.
// Fill every value marked FILL_ME with your real Glide table / column names.
// =============================================================================
//
// Column names below are the names the Glide API returns for each column
// (in the v1 API these are the internal column ids, e.g. "Name", "remote\u001dCol",
// "$rowID", etc. Use "Show API" in the Glide Data editor to see them).
//
// IMPORTANT: The Glide API only returns BASIC (stored) columns. Every computed
// column used by the Glide screen (queries, lookups, if-then, math, JS) is
// re-implemented in js/pipeline.js and js/glideColumns.js, so only basic
// columns are needed here.

export const CONFIG = {
  // ---------------------------------------------------------------------------
  // Where the raw rows come from.
  //   'server'      : GET ./api/data from server.mjs (Render). Fetched from Glide
  //                   when the page is opened / reloaded. Keys stay on the server. RECOMMENDED.
  //   'static-json' : read ./data/raw.json (written by scripts/fetch-data.mjs).
  //   'static-cards': read ./data/cards.json = card HTML already computed by
  //                   scripts/fetch-data.mjs. Numbers frozen at fetch time.
  //   'glide-api'   : call the Glide API directly from the browser. Needs the
  //                   token in the page -> only for local testing, never commit it.
  // ---------------------------------------------------------------------------
  dataMode: 'server',
  serverDataUrl: './api/data',
  staticJsonUrl: './data/raw.json',
  staticCardsUrl: './data/cards.json',

  glide: {
    // 'v1' = Glide Tables API  (POST https://api.glideapp.io/api/function/queryTables)
    // 'v2' = Big Tables API    (GET  https://api.glideapps.com/tables/{id}/rows)
    apiFlavor: 'v1',
    appId: 'ARzoymvBNIgO6RcvRk7l',          // v1 only
    token: '',                        // glide-api mode only (local testing). Action uses env GLIDE_TOKEN.
  },

  // ---------------------------------------------------------------------------
  // Tables and their BASIC columns.  key (left) = name used in the code,
  // value (right) = column name as returned by the Glide API.
  // Row order matters for ONE rule ("Query - Last update" picks by table order),
  // so the fetch keeps the API's row order.
  // ---------------------------------------------------------------------------
  tables: {
    // Glide table: "All RFQs - Strike"
    rfqs: {
      table: 'native-table-24696dcc-caaf-4bf8-a015-1e9ef394aa1b',               // v1: "native-table-xxxx" | v2: table id
      fields: {
        rowId: '$rowID',            // "🔒 Row ID"
        receivedDate: 'xbe3m',      // "Received date"   (date)
        currentStatus: '6P9Ok',     // "Current status"  (text)
        archive: 'oaHXQ',           // "archive"         (boolean)
        customerName: 'BietT',      // "Customer name"   (text)
      },
    },

    // Glide table: "All companies"
    companies: {
      table: 'native-table-g1GlBSdbNmRtTx16ecxD',
      fields: {
        name: 'Name',              // "Name"
        addedDate: '6AQt0',         // "Added date"      (date)
        localCurrency: 'aUEW2',     // "Local currency"  (text)
      },
    },

    // Glide table: "Status updates"
    statusUpdates: {
      table: 'native-table-c2c710ba-9454-4709-b877-920ddc634cad',
      fields: {
        rowId: '$rowID',            // "🔒 Row ID"
        rfqId: 'Name',             // "RFQ ID"            (text = All RFQs row id)
        rfqTitle: 'JPInh',          // "RFQ Title"         (text)
        statusTo: 'Ocmhy',          // "Status updated to" (text)
        statusAt: 'VFCKb',          // "Status updated at" (date-time)
        rfqAddedDate: 'txfBO',      // "RFQ Added date"    (date)  -- the BASIC column, not "Lookup RFQ Added date"
        rfqPoc: 'SdY6r',            // "RFQ POC"           (text)  -- only copied into the JSON, not used in maths
        quoteValue: '2OKOO',        // "Quote value"       (number)
        quoteCurrency: 'y0J47',     // "Quote currency"    (text)
        wonValue: 'XVoWk',          // "Won value"         (number) -- only copied into the JSON, not used in maths
        wonCurrency: 'k6EyO',       // "Won Currency"      (text)   -- only copied into the JSON, not used in maths
      },
    },

    // Glide table: "Currency rates" (the one the Status updates "Rel-currency" relation points at;
    // there are TWO tables called "Currency rates" in the app — check which one).
    currencyRates: {
      table: 'native-table-Bvet9JT66E5YBAjWfbQv',
      fields: {
        currencyCode: 'Name',      // "Currency code"
        // "conversion rate" is a computed column (Call API + JSON query), so it is NOT read
        // from Glide: it is derived from the exchange rate API when data is fetched
        // (see `exchangeRate` below and js/exchangeRates.js). Any name works here.
        conversionRate: 'conversion rate',
      },
    },

    // Glide table: "Purchase Orders" — only needed for the hidden "Won Value" card.
    purchaseOrders: {
      table: 'native-table-992ebb81-8eed-4e60-b723-aa4e0efa6af5',
      fields: {
        createdAt: 'GhPKL',         // "Created at"                 (date-time)
        verification: 'zwXfO',      // "Verification"               (boolean)
        addedToProjects: '4L30B',   // "Added To Projects"          (text)
        wonValueLocal: 'FbEcY',     // "Won value (Local currency)" (number)
        customer: '6VtPa',          // "Customer"                   (text)
      },
      // ASSUMED (not opened in Glide): "Rel-customer" matches Customer -> All companies.<this field>,
      // then "Lookup customer currency" = company.Local currency -> Currency rates -> "USD Conversion rate".
      // Verify in Glide before switching the Won Value card on.
      customerMatchesCompanyField: 'name',
    },
  },

  // ---------------------------------------------------------------------------
  // Currency rates "Currency API response" -> "conversion rate"
  // (Glide: https://v6.exchangerate-api.com/v6/<key>/pair/USD/<Currency code>)
  // ---------------------------------------------------------------------------
  exchangeRate: {
    base: 'USD',
    apiKey: '',                       // glide-api mode only (local testing). Fetch script uses env EXCHANGE_RATE_API_KEY.
  },

  // ---------------------------------------------------------------------------
  // Hidden components (hidden in Glide by visibility rules). Keep OFF.
  // ---------------------------------------------------------------------------
  components: {
    won: false,          // "Won / JS Card"            (Glide: visible when Email is empty)
    wonValue: false,     // "Won Value JS Card"        (Glide: visible when Email is empty)
    totalQuoted: false,  // "Total Quoted/JS Card ..." (Glide: Role is Admin AND Email is empty)
  },

  // ---------------------------------------------------------------------------
  // Glide filter semantics that cannot be read from the editor. Defaults are
  // the most literal reading; flip them if your numbers differ from Glide.
  // ---------------------------------------------------------------------------
  semantics: {
    // How Glide date conditions ("is on or after", "is before") compare:
    //   'datetime' -> compare exact instants
    //   'day'      -> compare calendar days in `dayTimeZone`
    dateCompare: 'datetime',
    dayTimeZone: 'Asia/Kolkata',
    // Text "is" / "is included in" / relation matching:
    //   'exact' | 'case-insensitive'
    textCompare: 'exact',
    // "Query - Last update" is single-match, sorted by Table order with the
    // reverse arrow selected -> picks the LAST matching row in table order.
    lastUpdatePick: 'last',   // 'last' | 'first'
  },

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------
  page: {
    title: 'Weekly Metrics',
    showHeader: true,
    autoRefreshMinutes: 0,    // 0 = off (data is fetched when the page is opened / reloaded).
  },
};
