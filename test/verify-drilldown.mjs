// Drill-down screens (click a card -> table of the rows behind its number).
//  1) Hand-computed rows, order and cell values for every screen.
//  2) Each screen adds up to its card: rows per week / month == the card's numbers,
//     on the fixture and on 300 random datasets.
// Run: node test/verify-drilldown.mjs
process.env.TZ = 'Asia/Kolkata';
import assert from 'node:assert/strict';

const RealDate = Date;
let FIXED = null;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length === 0 && FIXED !== null) super(FIXED); else super(...a); }
  static now() { return FIXED !== null ? FIXED : RealDate.now(); }
}
globalThis.Date = FakeDate; // the card JS columns use new Date() like Glide
const setNow = (d) => { FIXED = new RealDate(d).getTime(); };

const { computeMetrics } = await import('../js/pipeline.js');
const { computeDrilldown, CARD_TO_SCREEN, weekIndex, monthIndex } = await import('../js/drilldown.js');
const { NOW, DD_CONFIG, buildDrilldownFixture } = await import('./fixture-drilldown.mjs');

let n = 0;
const eq = (a, b, m) => { assert.deepEqual(a, b, ...(m === undefined ? [] : [m])); n++; }; // Node 26 rejects message: undefined
const col = (d, k) => d.rows.map((r) => r[k]);
const ids = (d) => d.rows.map((r) => r._raw.rowId ?? r._raw.name ?? r._raw.subjectLine);

// ---------------------------------------------------------------------------
// 1) Hand-computed screens
// ---------------------------------------------------------------------------
setNow(NOW);
const raw = buildDrilldownFixture();
const { drill, debug } = computeMetrics(raw, DD_CONFIG, NOW);
const open = (card) => computeDrilldown(card, drill, DD_CONFIG);

eq(CARD_TO_SCREEN, {
  received: 'rfqsReceived', won: 'rfqsWon', customers: 'newCustomers', quoted: 'rfqsQuoted',
  quotedValue: 'rfqsQuoted', quoteTimeline: 'rfqsQuoted', totalOpen: 'openRfqs', totalSampling: 'samplingRfqs',
  wonValue: 'wonPOs', totalQuoted: 'totalQuotedRfqs',
}, 'card -> screen');

{ // RFQs Received
  const d = open('received');
  eq(d.title, 'RFQs Received');
  eq(d.columns.map((c) => c.label), ['Size ($)', 'Title', 'Received date', 'PoC', 'Week']);
  eq(ids(d), ['R1', 'R3', 'R4', 'R5', 'R12', 'R2', 'R8', 'R9'], 'received: card rows, drawn weeks only, sorted by RFQ created date');
  eq(col(d, 'title').slice(0, 2), ['Entai 1 - Bolt', ''], 'empty title kept (the card counts it)');
  eq(col(d, 'title')[5], 'ⓒ Entai 2 - Nut', 'Title confidential');
  eq(col(d, 'size')[0], 'xx,xxx');
  eq(col(d, 'receivedDate')[0], '1 Nov 2026');
  eq(col(d, 'poc').slice(0, 2), ['Harsh Maheshwari', ''], 'PoC via Admins email (any case)');
  eq(col(d, 'week'), ['Week -1', 'Week -1', 'Week -1', 'Week -1', 'Week -1', 'Week -2', 'Week -3', 'Week -1'], 'Monday 00:00 stays in its week');
  eq(debug['JS RFQs added W1..W5'], [0, 6, 1, 1, 0], 'card numbers for the same rows');
}
{ // RFQs Won (the Won card does not filter archived RFQs)
  const d = open('won');
  eq(d.columns.map((c) => c.label), ['Title', 'Updated by', 'Won date', 'Week']);
  eq(ids(d), ['S7', 'S8'], 'won: archived kept like the card, > 45 days dropped');
  eq([d.rows[0].title, d.rows[0].updatedBy, d.rows[0].wonDate, d.rows[0].week], ['Entai 2 - Nut', 'Hemant', '2 Nov 2026, 08:30', 'Current week']);
  eq(d.rows[1].week, 'Week -1');
}
{ // New Customers
  const d = open('customers');
  eq(d.columns.map((c) => c.label), ['Name', 'Added Date', 'Week']);
  eq(ids(d), ['Kamikaze', 'Monco', 'Atlas'], 'week -6 not drawn on the card -> not listed');
  eq(col(d, 'addedDate'), ['27 Oct 2026', '19 Oct 2026', '16 Oct 2026']);
  eq(col(d, 'week'), ['Week -1', 'Week -2', 'Week -3']);
}
{ // RFQs Quoted (quoted / quotedValue / quoteTimeline)
  const d = open('quoted');
  eq(['quotedValue', 'quoteTimeline'].map((k) => ids(open(k))), [ids(d), ids(d)], 'same screen from 3 cards');
  eq(d.columns.map((c) => c.label), ['Title', 'Quote value (USD)', 'Quote Time', 'Status updated by', 'Status updated at', 'Week']);
  eq(ids(d), ['S6', 'S4', 'S10', 'S2', 'S11'], 'archived and week -6 dropped, sorted by status time');
  eq(col(d, 'quoteValueUsd'), ['', '12,000.50', '1.00', '10,000.00', '50.00']);
  eq(col(d, 'quoteTime'), [' Days', '3 Days', '1 Days', '4 Days', '3 Days'], 're-quote measured from the previous update');
  eq(col(d, 'statusUpdatedBy'), ['', 'Suraj Jaiswal', '', 'Anuj Kumar', '']);
  eq(col(d, 'statusUpdatedAt')[1], '31 Oct 2026, 13:30');
  eq(col(d, 'week'), ['Week -1', 'Week -1', 'Week -1', 'Week -2', 'Week -2']);
}
{ // Open RFQs
  const d = open('totalOpen');
  eq(d.columns.map((c) => c.label), ['Size ($)', 'Title', 'Active Since', 'PoC', 'Image', 'sales status']);
  eq(ids(d), ['R1', 'R3', 'R12', 'R7', 'R9']);
  eq(col(d, 'activeSince'), ['3 Days', '2 Days', '8 Days', '50 Days', '7 Days'], 'Published Live Date, else days since received');
  eq(col(d, 'salesStatus'), ['Live', 'Live', 'Live', 'Hot', 'Repricing']);
  eq(col(d, 'image').map((v) => (v.includes('M15.75 5.25v13.5') ? 'icon' : '')), ['', 'icon', '', '', ''], 'icon only when sharing is off');
  eq(d.rows.length, debug['RFQs active open count']);
}
{ // Sampling RFQs, Total Quoted
  const s = open('totalSampling');
  eq(s.columns.map((c) => c.label), ['Size ($)', 'Title', 'Active Since', 'PoC', 'Image']);
  eq(ids(s), ['R8', 'R10']);
  eq(ids(open('totalQuoted')), ['R2', 'R11']);
}
{ // Won POs: card POs in the drawn months + POs still to accept (not deferred, Project or Value empty)
  const d = open('wonValue');
  eq(d.columns.map((c) => c.label), ['Project', 'Value (USD)', 'From name', 'Created at', 'Subject line', 'Month']);
  eq(ids(d), ['PO 1', 'PO 3', 'PO 2', 'PO 6', 'PO 5', 'PO 9']);
  eq(col(d, 'project'), ['Entai 101, Entai 102', 'X', '', 'Trump 9', 'Big 4', 'Shakti 1']);
  eq(col(d, 'valueUsd'), ['2,347.11', '1.00', '500.00', '', '', '12.05'], 'USD via the customer currency, like the card');
  eq(col(d, 'month'), ['Nov', 'Oct', 'Oct', 'Sep', 'Sep', 'Jul']);
  eq(col(d, 'createdAt')[0], '1 Nov 2026, 13:30');
  eq([d.meta.counted, d.meta.toAccept], [4, 3]);
  eq(d.tableTitle, 'Purchase Orders');
  eq(d.link.url, 'https://wootz-browser.glide.page/dl/d0a5f4');
  eq(debug['Won JS Value'], '2347,1,0,0,12');
}
{ // No Admins table configured -> PoC empty, everything else works
  const cfg = { ...DD_CONFIG, tables: { ...DD_CONFIG.tables } };
  delete cfg.tables.admins;
  const d = computeDrilldown('received', computeMetrics(raw, cfg, NOW).drill, cfg);
  eq(col(d, 'poc')[0], '');
  eq(d.rows.length, 8);
}

// ---------------------------------------------------------------------------
// 2) Every screen adds up to its card
// ---------------------------------------------------------------------------
function checkAgainstCards(rawTables, cfg, now) {
  setNow(now);
  const { debug: dbg, drill: dr } = computeMetrics(rawTables, cfg, now);
  const scr = (k) => computeDrilldown(k, dr, cfg);
  const nowD = new RealDate(now);
  const perWeek = (rows, date, key) => {
    const b = [0, 1, 2, 3, 4].map(() => new Set());
    for (const r of rows) b[weekIndex(date(r._raw), nowD)].add(key(r._raw));
    return b.map((s) => s.size);
  };
  eq(perWeek(scr('received').rows, (r) => r.receivedDate, (r) => r.rowId), dbg['JS RFQs added W1..W5'].map((v) => v ?? 0), 'received = card');
  const q = scr('quoted').rows;
  eq(perWeek(q, (u) => u.statusAt, (u) => String(u.rfqId)).join(','), dbg['JS RFQs Quotes Weekwise'] ?? '0,0,0,0,0', 'quoted = card');
  const sums = [0, 0, 0, 0, 0];
  for (const r of q) sums[weekIndex(r._raw.statusAt, nowD)] += dr.fn.quoteValueUsd(r._raw) || 0;
  eq(sums.map((v) => Math.round(v)).join(','), dbg['JS RFQs quoted value'] ?? '0,0,0,0,0', 'quote values = Quoted Value card');
  eq(perWeek(scr('won').rows, (u) => u.statusAt, (u) => String(u.rfqId)).join(','), dbg['Won / Count Weekwise'] ?? '0,0,0,0,0', 'won = card');
  const c = [0, 0, 0, 0, 0];
  for (const r of scr('customers').rows) c[weekIndex(r._raw.addedDate, nowD)]++;
  eq(c.join(','), dbg['JS unique customers added W1 copy'] ?? '0,0,0,0,0', 'customers = card');
  eq(scr('totalOpen').rows.length, dbg['RFQs active open count']);
  eq(scr('totalSampling').rows.length, dbg['RFQs sampling count']);
  eq(scr('totalQuoted').rows.length, dbg['Count Total RFQs Quoted']);
  const counted = new Set(dr.rows.wonValue);
  const m = [0, 0, 0, 0, 0];
  for (const r of scr('wonValue').rows) if (counted.has(r._raw)) m[monthIndex(r._raw.createdAt, nowD)] += dr.fn.poWonValueUsd(r._raw) || 0;
  eq(m.map((v) => Math.round(v)).join(','), dbg['Won JS Value'] ?? '0,0,0,0,0', 'won POs = Won Value card');
}

checkAgainstCards(raw, DD_CONFIG, NOW);

let seed = 4242;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const DAY = 86400000, IST = 5.5 * 3600000;
function randomRaw(nowMs) {
  // ~1/3 of dates are date-only (00:00 IST, like "Received date"), a few in the future
  const t = (span = 70) => {
    let x = nowMs - Math.floor(rnd() * span * DAY) + Math.floor(rnd() * 2 * DAY);
    if (rnd() < 0.33) x -= (x + IST) % DAY;
    return new RealDate(x).toISOString();
  };
  const STAT = ['Live', 'Repricing', 'Hot', 'Sampling', 'Quoted', 'Won', 'Lost', 'Deferred', 'Arrival'];
  const rfqs = [], statusUpdates = [], companies = [], purchaseOrders = [];
  for (let i = 0; i < 120; i++) {
    rfqs.push({ rowId: `R${i}`, receivedDate: rnd() < 0.05 ? '' : t(), currentStatus: pick(STAT), archive: rnd() < 0.15,
      customerName: `C${Math.floor(rnd() * 25)}`, title: rnd() < 0.1 ? '' : `T${i}`, rfqCreatedDate: t() });
  }
  for (let i = 0; i < 40; i++) companies.push({ name: `Co${i}`, addedDate: rnd() < 0.1 ? '' : t(), localCurrency: pick(['USD', 'INR']) });
  const ev = [];
  for (let i = 0; i < 400; i++) ev.push({ at: t(), rfqId: `R${Math.floor(rnd() * 125)}`, statusTo: pick(STAT) });
  ev.sort((a, b) => a.at.localeCompare(b.at)).forEach((e, i) => statusUpdates.push({
    rowId: `S${i}`, rfqId: e.rfqId, rfqTitle: `T${i}`, statusTo: e.statusTo, statusAt: e.at, rfqAddedDate: t(),
    quoteValue: Math.floor(rnd() * 100000), quoteCurrency: pick(['USD', 'INR', 'EUR', '']),
  }));
  for (let i = 0; i < 60; i++) {
    purchaseOrders.push({ createdAt: t(200), verification: pick([true, false, undefined]), defer: rnd() < 0.2,
      addedToProjects: rnd() < 0.2 ? '' : `P${i}`, wonValueLocal: rnd() < 0.2 ? '' : Math.floor(rnd() * 50000),
      customer: rnd() < 0.2 ? '' : `Co${Math.floor(rnd() * 45)}`, subjectLine: `PO ${i}` });
  }
  return { rfqs, companies, statusUpdates, purchaseOrders, admins: [],
    currencyRates: [{ currencyCode: 'USD', conversionRate: 1 }, { currencyCode: 'INR', conversionRate: 83 }, { currencyCode: 'EUR', conversionRate: 0.92 }] };
}
const before = n;
for (let i = 0; i < 300; i++) {
  const nowMs = RealDate.UTC(2026, 0, 1) + Math.floor(rnd() * 365 * DAY);
  checkAgainstCards(randomRaw(nowMs), DD_CONFIG, nowMs);
}
console.log(`random datasets: ${(n - before) / 9} x 9 card checks`);

console.log(`\nALL DRILL-DOWN CHECKS PASSED (${n})`);
