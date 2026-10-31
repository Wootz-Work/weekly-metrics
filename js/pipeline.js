// =============================================================================
// Re-implementation of every NON-JavaScript Glide column the screen depends on
// (Query, Relation, Lookup, If-Then-Else, Math, Rollup, Template, Joined List,
// Make JSON Object), then feeds the results into the verbatim JS columns and
// cards exactly the way Glide wires them.
//
// Column names in comments are the Glide column names.
// =============================================================================

import * as COL from './glideColumns.js';
import * as CARD from './cards.js';

const DAY = 86400000;

// -----------------------------------------------------------------------------
// Glide value helpers
// -----------------------------------------------------------------------------
export function isEmpty(v) {
  return v === undefined || v === null || v === '' || (typeof v === 'number' && isNaN(v));
}
function toDate(v) {
  if (isEmpty(v)) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function toIso(v) {
  const d = toDate(v);
  return d ? d.toISOString() : undefined;
}
function toNum(v) {
  if (isEmpty(v)) return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? undefined : n;
}
// Glide boolean: checked only when true
function isChecked(v) {
  return v === true || v === 'true' || v === 'TRUE';
}

export function makeSemantics(sem) {
  const textNorm = sem.textCompare === 'case-insensitive'
    ? (s) => String(s).trim().toLowerCase()
    : (s) => String(s);
  const textIs = (a, b) => !isEmpty(a) && !isEmpty(b) && textNorm(a) === textNorm(b);

  let dayKey = null;
  if (sem.dateCompare === 'day') {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: sem.dayTimeZone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    dayKey = (d) => fmt.format(d); // "YYYY-MM-DD" sorts lexicographically
  }
  // "<date> is on or after <ref>"
  const onOrAfter = (v, ref) => {
    const a = toDate(v), b = toDate(ref);
    if (!a || !b) return false;
    return dayKey ? dayKey(a) >= dayKey(b) : a.getTime() >= b.getTime();
  };
  // "<date> is before <ref>"
  const before = (v, ref) => {
    const a = toDate(v), b = toDate(ref);
    if (!a || !b) return false;
    return dayKey ? dayKey(a) < dayKey(b) : a.getTime() < b.getTime();
  };
  return { textIs, onOrAfter, before };
}

// "Make JSON Object" column -> JSON text. Empty values are left out.
function jsonObject(pairs) {
  const o = {};
  for (const [k, v] of pairs) if (!isEmpty(v)) o[k] = v;
  return JSON.stringify(o);
}
// "Joined List" separated by ", "  (empty list -> empty value)
function joinedList(texts) {
  const t = texts.filter((x) => !isEmpty(x));
  return t.length ? t.join(', ') : undefined;
}
// "Template" column
function template(tpl, replacements) {
  let out = tpl;
  for (const [key, val] of Object.entries(replacements)) {
    out = out.split(key).join(isEmpty(val) ? '' : String(val));
  }
  return out;
}
// A Glide JavaScript column: empty inputs arrive as undefined, a thrown error
// gives an empty value.
function js(fn, p1, p2, p3) {
  const norm = (v) => (isEmpty(v) ? undefined : v);
  try {
    const r = fn(norm(p1), norm(p2), norm(p3));
    return isEmpty(r) ? undefined : r;
  } catch (e) {
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Map raw API rows -> objects with the names used in the code
// -----------------------------------------------------------------------------
function mapRows(rows, fields) {
  return (rows || []).map((r) => {
    const o = {};
    for (const [k, col] of Object.entries(fields)) o[k] = r[col];
    return o;
  });
}

// -----------------------------------------------------------------------------
// Main: compute every column of "Metrics (Do not touch)" that a card uses.
// raw = { rfqs:[], companies:[], statusUpdates:[], currencyRates:[], purchaseOrders:[] }
// -----------------------------------------------------------------------------
export function computeMetrics(raw, config, nowArg) {
  const S = makeSemantics(config.semantics);
  const T = config.tables;
  const now = nowArg ? new Date(nowArg) : new Date();

  const rfqs = mapRows(raw.rfqs, T.rfqs.fields);
  const companies = mapRows(raw.companies, T.companies.fields);
  const statusUpdates = mapRows(raw.statusUpdates, T.statusUpdates.fields);
  const currencyRates = mapRows(raw.currencyRates, T.currencyRates.fields);
  const purchaseOrders = mapRows(raw.purchaseOrders, T.purchaseOrders.fields);

  // ---- Math columns on "Metrics (Do not touch)" ----------------------------
  // Last week date = NOW - 7 (unused by cards), Last 2 week date = NOW - 14,
  // Last month date = NOW - 45, Last 6 month date = NOW - 180
  const lastWeekDate = new Date(now.getTime() - 7 * DAY);
  const last2WeekDate = new Date(now.getTime() - 14 * DAY);
  const lastMonthDate = new Date(now.getTime() - 45 * DAY);
  const last6MonthDate = new Date(now.getTime() - 180 * DAY);

  // ---- Helper relations -----------------------------------------------------
  // Relation: first row whose <field> matches value
  const relFirst = (rows, field, value) => rows.find((r) => S.textIs(r[field], value));

  // =========================================================================
  // Table "All RFQs - Strike" computed columns
  // =========================================================================
  // Active RFQ (If-Then-Else): Current status is Live -> 1 | is Repricing -> 1 | is Hot -> 1 | else 0
  const activeRfq = (r) =>
    (S.textIs(r.currentStatus, 'Live') || S.textIs(r.currentStatus, 'Repricing') || S.textIs(r.currentStatus, 'Hot')) ? 1 : 0;
  // JSON Dashboard: {Active RFQ, Received date, 🔒 Row ID, Customer: Customer name}
  const jsonDashboard = (r) => jsonObject([
    ['Active RFQ', activeRfq(r)],
    ['Received date', toIso(r.receivedDate)],
    ['🔒 Row ID', r.rowId],
    ['Customer', r.customerName],
  ]);

  // =========================================================================
  // Table "All companies" computed columns
  // =========================================================================
  // JSON: {Name, Added date, Local currency}
  const jsonCompany = (c) => jsonObject([
    ['Name', c.name],
    ['Added date', toIso(c.addedDate)],
    ['Local currency', c.localCurrency],
  ]);

  // =========================================================================
  // Table "Status updates" computed columns
  // =========================================================================
  // Rel-rfq: RFQ ID -> All RFQs.🔒 Row ID ;  Lookup rfq archive = Rel-rfq.archive
  const rfqById = new Map();
  for (const r of rfqs) if (!isEmpty(r.rowId) && !rfqById.has(String(r.rowId))) rfqById.set(String(r.rowId), r);
  const lookupRfqArchive = (u) => {
    const r = isEmpty(u.rfqId) ? undefined
      : (config.semantics.textCompare === 'case-insensitive'
        ? relFirst(rfqs, 'rowId', u.rfqId)
        : rfqById.get(String(u.rfqId)));
    return r ? r.archive : undefined;
  };

  // Rel-currency: Quote currency -> Currency rates.Currency code ; Conversion rate = lookup
  // Quote value usd (Math) = Quote value / Conversion rate
  const rateFor = (code) => {
    if (isEmpty(code)) return undefined;
    const c = relFirst(currencyRates, 'currencyCode', code);
    return c ? toNum(c.conversionRate) : undefined;
  };
  const quoteValueUsd = (u) => {
    const rate = rateFor(u.quoteCurrency);
    if (!rate) return undefined;                 // empty / 0 divisor -> empty in Glide
    return (toNum(u.quoteValue) || 0) / rate;
  };
  // Won Value USD (Math) = Won value / Lookup won Conversion Rate (rel-Won Currency). JSON only.
  const wonValueUsdSU = (u) => {
    const rate = rateFor(u.wonCurrency);
    if (!rate) return undefined;
    return (toNum(u.wonValue) || 0) / rate;
  };

  // Group status updates by RFQ ID (keeps table order inside each group)
  const suByRfq = new Map();
  statusUpdates.forEach((u) => {
    if (isEmpty(u.rfqId)) return;
    const key = config.semantics.textCompare === 'case-insensitive' ? String(u.rfqId).trim().toLowerCase() : String(u.rfqId);
    if (!suByRfq.has(key)) suByRfq.set(key, []);
    suByRfq.get(key).push(u);
  });
  const sameRfq = (u) => {
    if (isEmpty(u.rfqId)) return [];
    const key = config.semantics.textCompare === 'case-insensitive' ? String(u.rfqId).trim().toLowerCase() : String(u.rfqId);
    return suByRfq.get(key) || [];
  };

  // Query - Last update: Status updates where RFQ ID is this RFQ ID AND Status updated at
  //   is before this Status updated at; single match; Table order (reversed).
  const queryLastUpdate = (u) => {
    const m = sameRfq(u).filter((x) => S.before(x.statusAt, u.statusAt));
    if (!m.length) return undefined;
    return config.semantics.lastUpdatePick === 'first' ? m[0] : m[m.length - 1];
  };
  // Query - Last update quoted: same + Status updated to is Quoted + 🔒 Row ID is not this Row ID
  const hasPrevQuoted = (u) => sameRfq(u).some((x) =>
    S.before(x.statusAt, u.statusAt) && S.textIs(x.statusTo, 'Quoted') && !(String(x.rowId) === String(u.rowId)));
  // Last update date final: if Query - Last update quoted is empty -> RFQ Added date
  //                         else -> Lookup Last update date (= Query - Last update . Status updated at)
  const lastUpdateDateFinal = (u) => {
    if (!hasPrevQuoted(u)) return u.rfqAddedDate;
    const prev = queryLastUpdate(u);
    return prev ? prev.statusAt : undefined;
  };
  // JSON Status updates
  const jsonStatusUpdate = (u) => jsonObject([
    ['RFQ', u.rfqId],
    ['Title', u.rfqTitle],
    ['Status', u.statusTo],
    ['Date', toIso(u.statusAt)],
    ['Added date', toIso(u.rfqAddedDate)],
    ['POC', u.rfqPoc],
    ['value_usd', quoteValueUsd(u)],
    ['last_updated_date', toIso(lastUpdateDateFinal(u))],
    ['won_value_usd', wonValueUsdSU(u)],
  ]);
  // cache per row (several queries use the same JSON)
  const suJsonCache = new Map();
  const suJson = (u) => {
    if (!suJsonCache.has(u)) suJsonCache.set(u, jsonStatusUpdate(u));
    return suJsonCache.get(u);
  };

  // =========================================================================
  // Table "Purchase Orders" computed columns (hidden Won Value card only)
  // =========================================================================
  // ASSUMED chain (see config): Rel-customer -> company -> Local currency -> Currency rates
  const poUsdRate = (p) => {
    const company = relFirst(companies, T.purchaseOrders.customerMatchesCompanyField || 'name', p.customer);
    return company ? rateFor(company.localCurrency) : undefined;
  };
  // Won value USD (Math "P2/P1": P2 = Won value (Local currency), P1 = USD Conversion rate)
  const poWonValueUsd = (p) => {
    const rate = poUsdRate(p);
    if (!rate) return undefined;
    return (toNum(p.wonValueLocal) || 0) / rate;
  };
  // JSON Status updates (PO): {RFQ: Added To Projects, Date: Created at, Value: Won value USD}
  const jsonPO = (p) => jsonObject([
    ['RFQ', p.addedToProjects],
    ['Date', toIso(p.createdAt)],
    ['Value', poWonValueUsd(p)],
  ]);

  // =========================================================================
  // "Metrics (Do not touch)" — Received group
  // =========================================================================
  // Received / RFQs received (Query All RFQs): Received date on/after Last month date AND archive not checked
  const rfqsReceived = rfqs.filter((r) => S.onOrAfter(r.receivedDate, lastMonthDate) && !isChecked(r.archive));
  // Count rfqs received (Rollup, not used by cards)
  const countRfqsReceived = rfqsReceived.length;
  // Lookup JSON RFQs -> Join JSON RFQs
  const joinJsonRfqs = joinedList(rfqsReceived.map(jsonDashboard));

  const rfqsAddedW1 = js(COL.JS_RFQS_ADDED_W1, joinJsonRfqs);
  const rfqsAddedW2 = js(COL.JS_RFQS_ADDED_W2, joinJsonRfqs);
  const rfqsAddedW3 = js(COL.JS_RFQS_ADDED_W3, joinJsonRfqs);
  const rfqsAddedW4 = js(COL.JS_RFQS_ADDED_W4, joinJsonRfqs);
  const rfqsAddedW5 = js(COL.JS_RFQS_ADDED_W5, joinJsonRfqs);
  // Received / Template chart = "p1,p2,p3,p4,p5"
  const receivedTemplateChart = template('p1,p2,p3,p4,p5',
    { p1: rfqsAddedW1, p2: rfqsAddedW2, p3: rfqsAddedW3, p4: rfqsAddedW4, p5: rfqsAddedW5 });
  const uniqueCustomersAddedW1 = js(COL.JS_UNIQUE_CUSTOMERS_ADDED_W1, joinJsonRfqs);
  const receivedHigherBetter = 'true';

  // Received / RFQs active (Query All RFQs): Active RFQ = 1 AND archive not checked
  const rfqsActive = rfqs.filter((r) => activeRfq(r) === 1 && !isChecked(r.archive));
  const rfqsActiveOpenCount = rfqsActive.length;           // Rollup count
  // Received / RFQs sampling (Query All RFQs): Current status is Sampling AND archive not checked
  const rfqsSampling = rfqs.filter((r) => S.textIs(r.currentStatus, 'Sampling') && !isChecked(r.archive));
  const rfqsSamplingCount = rfqsSampling.length;           // Rollup count

  // =========================================================================
  // Customers group
  // =========================================================================
  // Customers added (Query All companies): Added date on/after Last month date
  const customersAdded = companies.filter((c) => S.onOrAfter(c.addedDate, lastMonthDate));
  const joinJsonCustomersAddedCopy = joinedList(customersAdded.map(jsonCompany));
  const uniqueCustomersAddedW1Copy = js(COL.JS_UNIQUE_CUSTOMERS_ADDED_W1_COPY, joinJsonCustomersAddedCopy);

  // =========================================================================
  // Quoted group
  // =========================================================================
  // Query - status update quoed (Status updates): Status updated at on/after Last month date
  //   AND Status updated to is Quoted AND Lookup rfq archive is not checked
  const queryStatusUpdateQuoted = statusUpdates.filter((u) =>
    S.onOrAfter(u.statusAt, lastMonthDate) && S.textIs(u.statusTo, 'Quoted') && !isChecked(lookupRfqArchive(u)));
  const joinJsonStatusUpdates = joinedList(queryStatusUpdateQuoted.map(suJson));
  const rfqsQuotedValue = js(COL.JS_RFQS_QUOTED_VALUE, joinJsonStatusUpdates);

  // RFQs quoted (Status updates): Status updated to is Quoted AND Status updated at on/after
  //   Last month date AND Lookup rfq archive is not checked   (same set, separate column in Glide)
  const rfqsQuoted = statusUpdates.filter((u) =>
    S.textIs(u.statusTo, 'Quoted') && S.onOrAfter(u.statusAt, lastMonthDate) && !isChecked(lookupRfqArchive(u)));
  const quotedJoinJsonRfqs = joinedList(rfqsQuoted.map(suJson));
  const rfqsQuotesWeekwise = js(COL.JS_RFQS_QUOTES_WEEKWISE, quotedJoinJsonRfqs);

  // =========================================================================
  // Quote timeline group
  // =========================================================================
  const qtWeekwise = js(COL.QT_WEEKWISE, quotedJoinJsonRfqs);
  const qtMetricLabel = 'Avg. Quote time';
  const qtHigherBetter = 'false';

  // =========================================================================
  // Active group
  // =========================================================================
  // RFQs Active (Status updates): Status updated at on/after Last 2 week date AND
  //   Status updated to is included in [Live, Repricing, Hot, Sampling]
  const ACTIVE_SET = ['Live', 'Repricing', 'Hot', 'Sampling'];
  const rfqsActiveSU = statusUpdates.filter((u) =>
    S.onOrAfter(u.statusAt, last2WeekDate) && ACTIVE_SET.some((s) => S.textIs(u.statusTo, s)));
  const joinJsonRfqsActive = joinedList(rfqsActiveSU.map(suJson));
  const relativeActiveWeekIndicator = js(COL.RELATIVE_ACTIVE_WEEK_INDICATOR, joinJsonRfqsActive);
  const relativeSamplingWeekIndicator = js(COL.RELATIVE_SAMPLING_WEEK_INDICATOR, joinJsonRfqsActive);
  const currentWeekAndLastWeek = js(COL.CURRENT_WEEK_AND_LAST_WEEK, joinJsonRfqsActive);

  // =========================================================================
  // Won group (hidden)
  // =========================================================================
  // RFQs Won (Status updates): Status updated at on/after Last month date AND Status updated to is Won
  const rfqsWon = statusUpdates.filter((u) => S.onOrAfter(u.statusAt, lastMonthDate) && S.textIs(u.statusTo, 'Won'));
  const joinJsonRfqsWon = joinedList(rfqsWon.map(suJson));
  const wonCountWeekwise = js(COL.WON_COUNT_WEEKWISE, joinJsonRfqsWon);
  const wonMetricLabel = 'Won';
  const wonHigherBetter = 'true';

  // Query - Status Update Won (Purchase Orders): Created at on/after Last 6 month date AND Verification is checked
  const queryStatusUpdateWon = purchaseOrders.filter((p) => S.onOrAfter(p.createdAt, last6MonthDate) && isChecked(p.verification));
  const joinWonJsonUpdates = joinedList(queryStatusUpdateWon.map(jsonPO));
  const wonJsValue = js(COL.WON_JS_VALUE, joinWonJsonUpdates);

  // =========================================================================
  // Total Quoted group (hidden)
  // =========================================================================
  // Total RFQs Quoted (Query All RFQs): Current status is Quoted AND archive not checked
  const totalRfqsQuoted = rfqs.filter((r) => S.textIs(r.currentStatus, 'Quoted') && !isChecked(r.archive));
  const countTotalRfqsQuoted = totalRfqsQuoted.length;

  // =========================================================================
  // Cards (Rich Text components, in the Glide component order)
  // =========================================================================
  const C = config.components || {};
  const cards = [
    { key: 'received',      visible: true,               html: js(CARD.CARD_RECEIVED, receivedTemplateChart, uniqueCustomersAddedW1, receivedHigherBetter) },
    { key: 'won',           visible: !!C.won,            html: js(CARD.CARD_WON, wonCountWeekwise, wonMetricLabel, wonHigherBetter) },
    { key: 'customers',     visible: true,               html: js(CARD.CARD_CUSTOMERS, uniqueCustomersAddedW1Copy) },
    { key: 'quoted',        visible: true,               html: js(CARD.CARD_QUOTED, rfqsQuotesWeekwise, rfqsQuotedValue) },
    { key: 'totalOpen',     visible: true,               html: js(CARD.CARD_TOTAL_OPEN, rfqsActiveOpenCount, relativeActiveWeekIndicator) },
    { key: 'wonValue',      visible: !!C.wonValue,       html: js(CARD.CARD_WON_VALUE, wonJsValue) },
    { key: 'totalQuoted',   visible: !!C.totalQuoted,    html: js(CARD.CARD_TOTAL_QUOTED, countTotalRfqsQuoted) },
    { key: 'quotedValue',   visible: true,               html: js(CARD.CARD_QUOTED_VALUE, rfqsQuotedValue) },
    { key: 'totalSampling', visible: true,               html: js(CARD.CARD_TOTAL_SAMPLING, rfqsSamplingCount, relativeSamplingWeekIndicator) },
    { key: 'quoteTimeline', visible: true,               html: js(CARD.CARD_QUOTE_TIMELINE, qtWeekwise, qtMetricLabel, qtHigherBetter) },
  ];

  // Intermediate values (handy for comparing against the Glide data editor)
  const debug = {
    now: now.toISOString(),
    lastWeekDate: lastWeekDate.toISOString(),
    last2WeekDate: last2WeekDate.toISOString(),
    lastMonthDate: lastMonthDate.toISOString(),
    last6MonthDate: last6MonthDate.toISOString(),
    countRfqsReceived,
    'JS RFQs added W1..W5': [rfqsAddedW1, rfqsAddedW2, rfqsAddedW3, rfqsAddedW4, rfqsAddedW5],
    'Received / Template chart': receivedTemplateChart,
    'JS unique customers added W1': uniqueCustomersAddedW1,
    'JS unique customers added W1 copy': uniqueCustomersAddedW1Copy,
    'RFQs active open count': rfqsActiveOpenCount,
    'RFQs sampling count': rfqsSamplingCount,
    'JS RFQs Quotes Weekwise': rfqsQuotesWeekwise,
    'JS RFQs quoted value': rfqsQuotedValue,
    'Quote timeline / Weekwise': qtWeekwise,
    'Relative Active week indicator': relativeActiveWeekIndicator,
    'Relative Sampling week indicator': relativeSamplingWeekIndicator,
    'Current Week and Last Week': currentWeekAndLastWeek,
    'Won / Count Weekwise': wonCountWeekwise,
    'Won JS Value': wonJsValue,
    'Count Total RFQs Quoted': countTotalRfqsQuoted,
    rowCounts: {
      rfqs: rfqs.length, companies: companies.length, statusUpdates: statusUpdates.length,
      currencyRates: currencyRates.length, purchaseOrders: purchaseOrders.length,
    },
  };

  return { cards, debug };
}
