// Verification:
//  1) Scenario test: synthetic data that reproduces the numbers on the Glide
//     screen (30 Oct 2026 12:52 IST). Checks every visible card's text/colour.
//  2) Cross-check: an INDEPENDENT re-implementation (written separately, no
//     shared code) is compared with js/pipeline.js on 300 random datasets at
//     random "now" times.
//  3) Hidden-card switches + Glide empty-data behaviour.
process.env.TZ = 'Asia/Kolkata'; // card "days elapsed" uses local weekday, like a user in India
import assert from 'node:assert/strict';

const RealDate = Date;
let FIXED = null;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length === 0 && FIXED !== null) super(FIXED); else super(...a); }
  static now() { return FIXED !== null ? FIXED : RealDate.now(); }
}
globalThis.Date = FakeDate;
const setNow = (d) => { FIXED = new RealDate(d).getTime(); };

const { computeMetrics } = await import('../js/pipeline.js');
const { NOW, MON, TEST_CONFIG, buildFixture } = await import('./fixture.mjs');

const text = (html) => (html || '').replace(/>\s+</g, '><').replace(/<[^>]+>/g, '|').replace(/\|+/g, '|').replace(/&nbsp;/g, ' ');
let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ---------------------------------------------------------------------------
// 1) Scenario
// ---------------------------------------------------------------------------
setNow(NOW);
{
  const { cards, debug } = computeMetrics(buildFixture(), TEST_CONFIG, NOW);
  const by = Object.fromEntries(cards.map((c) => [c.key, c]));
  const show = (k) => console.log(k.padEnd(14), text(by[k].html));

  console.log('--- scenario: Fri 30 Oct 2026 12:52 IST ---');
  ['received', 'customers', 'quoted', 'totalOpen', 'quotedValue', 'totalSampling', 'quoteTimeline'].forEach(show);

  assert.deepEqual(debug['JS RFQs added W1..W5'], [14, 27, 42, 17, 0]); pass++;
  assert.equal(debug['JS unique customers added W1'], '9,8,17,11,0'); pass++;
  assert.equal(debug['JS unique customers added W1 copy'], '2,2,3,3,0'); pass++;
  assert.equal(debug['JS RFQs Quotes Weekwise'], '25,23,34,8,0'); pass++;
  assert.equal(debug['JS RFQs quoted value'], '2414999,6706803,4873307,467343,0'); pass++;
  assert.equal(debug['Quote timeline / Weekwise'], '12,7,14,80,0'); pass++;
  assert.equal(debug['RFQs active open count'], 32); pass++;
  assert.equal(debug['RFQs sampling count'], 9); pass++;
  assert.equal(debug['Relative Active week indicator'], '-36.6%'); pass++;
  assert.equal(debug['Relative Sampling week indicator'], '0%'); pass++;

  const r = text(by.received.html);
  ok(r.includes('|Received|14|9 customers|▼ 9%|'), 'Received header');
  ok(r.includes('|0|17|42|27|0 cust|11 cust|17 cust|8 cust|'), 'Received bars');
  ok(by.received.html.includes('color:#FF5252">▼ 9%'), 'Received trend red');
  const c = text(by.customers.html);
  ok(c.includes('|New Customers|2|▲ 40%|0|3|3|2|'), 'New Customers');
  ok(by.customers.html.includes('color:#4CAF50">▲ 40%'), 'New Customers green');
  const q = text(by.quoted.html);
  ok(q.includes('|Quoted|25|$2.4M|▲ 115%|0|8|34|23|'), 'Quoted');
  const o = text(by.totalOpen.html);
  ok(o.includes('|Total Open|32|▼ 36.6%|'), 'Total Open');
  ok(by.totalOpen.html.includes('color:#4CAF50">▼ 36.6%'), 'Total Open green on decrease');
  const qv = text(by.quotedValue.html);
  ok(qv.includes('|Quoted Value|$2.4M|0|467.3K|4.9M|6.7M|-4w|-3w|-2w|-1w|'), 'Quoted Value');
  const s = text(by.totalSampling.html);
  ok(s.includes('|Total Sampling|9|― 0%|'), 'Total Sampling');
  ok(by.totalSampling.html.includes('color:#888">― 0%'), 'Total Sampling grey');
  const t = text(by.quoteTimeline.html);
  ok(t.includes('|Avg. Quote time|12|d|▼ 52%|'), 'Avg quote time header');
  ok(t.includes('|0d|80d|14d|7d|'), 'Avg quote time bars');
  ok(by.quoteTimeline.html.includes('color:#4CAF50">▼ 52%'), 'Avg quote time green (lower is better)');

  // hidden switches default OFF
  ok(by.won.visible === false && by.wonValue.visible === false && by.totalQuoted.visible === false, 'hidden cards off');
  const visibleOrder = cards.filter((x) => x.visible).map((x) => x.key).join(',');
  assert.equal(visibleOrder, 'received,customers,quoted,totalOpen,quotedValue,totalSampling,quoteTimeline'); pass++;
  // Total Quoted would show 4
  ok(text(by.totalQuoted.html).includes('|Total Quoted|4|'), 'Total Quoted value');
}

// ---------------------------------------------------------------------------
// 2) Independent reference implementation + random cross-check
// ---------------------------------------------------------------------------
const IST = 5.5 * 3600000, DAY = 86400000, WEEK = 7 * DAY;
function refMonday(nowMs) {               // Monday 00:00 IST as a UTC epoch
  const d = new RealDate(nowMs + IST);
  const back = (d.getUTCDay() + 6) % 7;
  return RealDate.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back) - IST;
}
const ms = (v) => { if (v === undefined || v === null || v === '') return NaN; return new RealDate(v).getTime(); };
function reference(raw, nowMs) {
  const mon = refMonday(nowMs);
  const cutMonth = nowMs - 45 * DAY, cut2w = nowMs - 14 * DAY;
  const arch = new Map(raw.rfqs.map((r) => [r.rowId, r.archive === true]));
  const rate = (cur) => { const c = raw.currencyRates.find((x) => x.currencyCode === cur); return c ? c.conversionRate : undefined; };

  // week by date: 0 = t >= mon (no upper bound), j = 1..4 = [mon - j weeks, mon - (j-1) weeks)
  const floorBucket = (t) => { if (isNaN(t)) return -1; if (t >= mon) return 0; for (let j = 1; j <= 4; j++) if (t >= mon - j * WEEK) return j; return -1; };

  const recv = raw.rfqs.filter((r) => ms(r.receivedDate) >= cutMonth && r.archive !== true);
  const W = [0, 0, 0, 0, 0].map(() => new Set());
  for (const r of recv) {
    const t = ms(r.receivedDate);
    if (t >= mon && t <= nowMs) W[0].add(r.rowId);
    for (let j = 1; j <= 4; j++) if (t >= mon - j * WEEK && t < mon - (j - 1) * WEEK) W[j].add(r.rowId);
  }
  const cust = [0, 0, 0, 0, 0].map(() => new Set());
  for (const r of recv) { const b = floorBucket(ms(r.receivedDate)); if (b >= 0) cust[b].add(String(r.customerName ?? 'undefined')); }

  const newCo = [0, 0, 0, 0, 0];
  for (const c of raw.companies) { const t = ms(c.addedDate); if (!(t >= cutMonth)) continue; const b = floorBucket(t); if (b >= 0) newCo[b]++; }

  const quotedSU = raw.statusUpdates.filter((u) => u.statusTo === 'Quoted' && ms(u.statusAt) >= cutMonth && arch.get(u.rfqId) !== true);
  const qRfq = [0, 0, 0, 0, 0].map(() => new Set()); const qVal = [0, 0, 0, 0, 0];
  const qtSum = [0, 0, 0, 0, 0], qtCnt = [0, 0, 0, 0, 0];
  for (const u of quotedSU) {
    const t = ms(u.statusAt); const b = floorBucket(t);
    const r = rate(u.quoteCurrency); const usd = r ? (Number(u.quoteValue) || 0) / r : 0;
    if (b >= 0) { qRfq[b].add(String(u.rfqId)); qVal[b] += usd; }
    // last_updated_date
    const earlier = raw.statusUpdates.filter((x) => x.rfqId === u.rfqId && ms(x.statusAt) < t);
    const prevQuoted = earlier.some((x) => x.statusTo === 'Quoted' && x.rowId !== u.rowId);
    const last = prevQuoted ? earlier[earlier.length - 1].statusAt : u.rfqAddedDate;
    if (!u.rfqTitle || u.rfqTitle.toLowerCase().includes('test')) continue;
    const lt = ms(last); if (isNaN(t) || isNaN(lt)) continue;
    const days = (t - lt) / DAY; if (days < 0) continue;
    let qb = -1;
    if (t >= mon && t < mon + WEEK) qb = 0; else if (t < mon) qb = Math.ceil((mon - t) / WEEK);
    if (qb >= 0 && qb <= 4) { qtSum[qb] += days; qtCnt[qb]++; }
  }

  const today0 = (() => { const d = new RealDate(nowMs + IST); return RealDate.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - IST; })();
  const curStart = today0 - 6 * DAY, lastStart = curStart - 7 * DAY;
  const actSU = raw.statusUpdates.filter((u) => ms(u.statusAt) >= cut2w && ['Live', 'Repricing', 'Hot', 'Sampling'].includes(u.statusTo));
  const rel = (sampling) => {
    const cur = new Set(), last = new Set();
    for (const u of actSU) {
      if (!u.rfqId) continue;
      if ((u.statusTo.toLowerCase() === 'sampling') !== sampling) continue;
      const t = ms(u.statusAt);
      if (t >= curStart && t <= nowMs) cur.add(u.rfqId); else if (t >= lastStart && t < curStart) last.add(u.rfqId);
    }
    const p = last.size === 0 ? (cur.size > 0 ? 100 : 0) : ((cur.size - last.size) / last.size) * 100;
    return sampling ? p.toFixed(1).replace('.0', '') + '%' : p.toFixed(1) + '%';
  };
  const activeSet = ['Live', 'Repricing', 'Hot'];
  return {
    W: W.map((s) => s.size),
    cust: cust.map((s) => s.size).join(','),
    newCo: newCo.join(','),
    quotes: qRfq.map((s) => s.size).join(','),
    qval: qVal.map((v) => Math.round(v)).join(','),
    qt: qtSum.map((s, i) => (qtCnt[i] ? Math.ceil(s / qtCnt[i]) : 0)).join(','),
    open: raw.rfqs.filter((r) => activeSet.includes(r.currentStatus) && r.archive !== true).length,
    sampling: raw.rfqs.filter((r) => r.currentStatus === 'Sampling' && r.archive !== true).length,
    relA: rel(false),
    relS: rel(true),
  };
}

// random data generator
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
function randomRaw(nowMs) {
  const STAT = ['Live', 'Repricing', 'Hot', 'Sampling', 'Quoted', 'Won', 'Lost', 'Deferred', 'Arrival'];
  const rfqs = [], statusUpdates = [], companies = [];
  const t = () => nowMs - Math.floor(rnd() * 70 * DAY) + Math.floor(rnd() * 2 * DAY); // includes a little future
  for (let i = 0; i < 120; i++) {
    rfqs.push({ rowId: `R${i}`, receivedDate: rnd() < 0.05 ? '' : new RealDate(t()).toISOString(),
      currentStatus: pick(STAT), archive: rnd() < 0.15, customerName: rnd() < 0.05 ? undefined : `C${Math.floor(rnd() * 25)}` });
  }
  for (let i = 0; i < 40; i++) companies.push({ name: `Co${i}`, addedDate: rnd() < 0.1 ? '' : new RealDate(t()).toISOString(), localCurrency: 'INR' });
  // status updates in chronological table order
  const evts = [];
  for (let i = 0; i < 400; i++) evts.push({ at: t(), rfqId: rnd() < 0.03 ? 'NOPE' : `R${Math.floor(rnd() * 120)}`, statusTo: pick(STAT) });
  evts.sort((a, b) => a.at - b.at);
  evts.forEach((e, i) => statusUpdates.push({
    rowId: `S${i}`, rfqId: e.rfqId, rfqTitle: rnd() < 0.1 ? 'Test thing' : (rnd() < 0.05 ? '' : `Title ${i}`),
    statusTo: e.statusTo, statusAt: new RealDate(e.at).toISOString(),
    rfqAddedDate: rnd() < 0.1 ? '' : new RealDate(e.at - Math.floor(rnd() * 30 * DAY)).toISOString(),
    quoteValue: Math.floor(rnd() * 100000), quoteCurrency: pick(['USD', 'INR', 'EUR', '']),
  }));
  return { rfqs, companies, statusUpdates, purchaseOrders: [],
    currencyRates: [{ currencyCode: 'USD', conversionRate: 1 }, { currencyCode: 'INR', conversionRate: 83 }, { currencyCode: 'EUR', conversionRate: 0.92 }] };
}

let mismatches = 0;
for (let n = 0; n < 300; n++) {
  const nowMs = RealDate.UTC(2026, 0, 1) + Math.floor(rnd() * 365 * DAY);
  setNow(nowMs);
  const raw = randomRaw(nowMs);
  const { debug } = computeMetrics(raw, TEST_CONFIG, nowMs);
  const ref = reference(raw, nowMs);
  const got = {
    W: debug['JS RFQs added W1..W5'].map((v) => v ?? 0),
    cust: debug['JS unique customers added W1'],
    newCo: debug['JS unique customers added W1 copy'],
    quotes: debug['JS RFQs Quotes Weekwise'],
    qval: debug['JS RFQs quoted value'],
    qt: debug['Quote timeline / Weekwise'],
    open: debug['RFQs active open count'],
    sampling: debug['RFQs sampling count'],
    relA: debug['Relative Active week indicator'],
    relS: debug['Relative Sampling week indicator'],
  };
  try { assert.deepEqual(got, ref); pass++; } catch (e) {
    mismatches++;
    if (mismatches <= 3) console.log('MISMATCH at', new RealDate(nowMs).toISOString(), JSON.stringify({ got, ref }, null, 1));
  }
}
assert.equal(mismatches, 0, `${mismatches} random datasets differ from the reference`);

// ---------------------------------------------------------------------------
// 3) Empty data behaves like Glide (JS columns error -> empty Rich Text)
// ---------------------------------------------------------------------------
setNow(NOW);
{
  const empty = { rfqs: [], companies: [], statusUpdates: [], currencyRates: [], purchaseOrders: [] };
  const { cards } = computeMetrics(empty, TEST_CONFIG, NOW);
  const by = Object.fromEntries(cards.map((c) => [c.key, c]));
  ok(by.received.html === undefined, 'empty -> Received blank');
  ok(text(by.totalOpen.html).includes('|Total Open|0|― 0%|'), 'empty -> Total Open 0');
  // switches ON
  const on = { ...TEST_CONFIG, components: { won: true, wonValue: true, totalQuoted: true } };
  const r2 = computeMetrics(buildFixture(), on, NOW).cards.filter((c) => c.visible).map((c) => c.key).join(',');
  assert.equal(r2, 'received,won,customers,quoted,totalOpen,wonValue,totalQuoted,quotedValue,totalSampling,quoteTimeline'); pass++;
}

// ---------------------------------------------------------------------------
// 4) Derived Currency rates "conversion rate" (Call API + JSON query)
// ---------------------------------------------------------------------------
{
  const { applyConversionRates, ratesStillFresh } = await import('../js/exchangeRates.js');
  const fields = { currencyCode: 'Name', conversionRate: 'conversion rate' };
  const rows = [{ Name: 'USD' }, { Name: 'INR' }, { Name: 'XXX' }, { Name: '' }, {}];
  const missing = applyConversionRates(rows, fields, { USD: 1, INR: 95.0736 });
  assert.deepEqual(rows.map((r) => r['conversion rate']), [1, 95.0736, undefined, undefined, undefined]); pass++;
  assert.deepEqual(missing, ['XXX', '', undefined]); pass++;

  // derived rows feed the Quoted value maths: 950736 INR / 95.0736 = 10,000 USD
  const raw = buildFixture();
  raw.currencyRates = rows.map((r) => ({ currencyCode: r.Name, conversionRate: r['conversion rate'] }));
  raw.statusUpdates = [{ rowId: 'su1', rfqId: 'x1', statusTo: 'Quoted', statusAt: new RealDate(NOW.getTime() - 3600000).toISOString(),
    rfqAddedDate: new RealDate(NOW.getTime() - 86400000).toISOString(), quoteValue: 950736, quoteCurrency: 'INR' }];
  raw.rfqs = [{ rowId: 'x1', receivedDate: '', currentStatus: 'Quoted', archive: false }];
  const qv = computeMetrics(raw, TEST_CONFIG, NOW).cards.find((c) => c.key === 'quotedValue');
  ok(text(qv.html).includes('|$10.0K|'), `950736 INR -> $10.0K (got ${text(qv.html)})`);

  const nowMs = 1793404801000;
  ok(ratesStillFresh({ base: 'USD', nextUpdateUnix: 1793491201, rates: {} }, 'USD', nowMs), 'cache fresh before next update');
  ok(!ratesStillFresh({ base: 'USD', nextUpdateUnix: 1793491201, rates: {} }, 'USD', 1793491201000), 'cache stale at next update');
  ok(!ratesStillFresh({ base: 'EUR', nextUpdateUnix: 1793491201, rates: {} }, 'USD', nowMs), 'cache stale for other base');
}

// ---------------------------------------------------------------------------
// 5) Weeks go by date (Mon 00:00 -> Sun 23:59 IST) and the weekday is IST
// ---------------------------------------------------------------------------
{
  // "now" = Wed 28 Oct 2026 15:00 IST; this week starts Mon 26 Oct 00:00 IST
  const now = new RealDate('2026-10-28T09:30:00.000Z').getTime();
  setNow(now);
  const monIST = (k) => new RealDate(MON - k * WEEK).toISOString();          // Monday 00:00 IST, k weeks back
  const sunEnd = (k) => new RealDate(MON - (k - 1) * WEEK - 1).toISOString(); // Sunday 23:59:59.999 IST closing week -k
  const raw = { rfqs: [], companies: [], statusUpdates: [], currencyRates: [{ currencyCode: 'USD', conversionRate: 1 }], purchaseOrders: [] };
  // one item exactly at the start and one exactly at the end of each past week
  for (let k = 1; k <= 4; k++) {
    for (const [tag, at] of [['a', monIST(k)], ['z', sunEnd(k)]]) {
      raw.rfqs.push({ rowId: `R${k}${tag}`, receivedDate: at, currentStatus: 'Live', archive: false, customerName: `C${k}${tag}` });
      raw.companies.push({ name: `Co${k}${tag}`, addedDate: at, localCurrency: 'USD' });
      for (const s of ['Quoted', 'Won']) raw.statusUpdates.push({ rowId: `S${s}${k}${tag}`, rfqId: `R${k}${tag}`, rfqTitle: 'T', statusTo: s, statusAt: at, rfqAddedDate: at, quoteValue: 100, quoteCurrency: 'USD' });
    }
  }
  const { debug } = computeMetrics(raw, TEST_CONFIG, now);
  assert.deepEqual(debug['JS RFQs added W1..W5'], [0, 2, 2, 2, 2]); pass++;
  assert.equal(debug['JS unique customers added W1'], '0,2,2,2,2'); pass++;
  assert.equal(debug['JS unique customers added W1 copy'], '0,2,2,2,2'); pass++;
  assert.equal(debug['JS RFQs Quotes Weekwise'], '0,2,2,2,2'); pass++;
  assert.equal(debug['JS RFQs quoted value'], '0,200,200,200,200'); pass++;
  assert.equal(debug['Won / Count Weekwise'], '0,2,2,2,2'); pass++;

  // The weekday used by the cards is the IST weekday, whatever the device clock says.
  const moments = ['2026-10-25T20:30:00.000Z', /* Mon 02:00 IST = Sun in London/LA */
    '2026-11-01T17:30:00.000Z', /* Sun 23:00 IST = Mon in Tokyo */ '2026-10-31T11:30:00.000Z'];
  for (const at of moments) {
    const t = new RealDate(at).getTime();
    setNow(t);
    const html = {};
    for (const tz of ['Asia/Kolkata', 'Europe/London', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = tz;
      html[tz] = JSON.stringify(computeMetrics(buildFixture(), { ...TEST_CONFIG, components: { won: true, wonValue: true, totalQuoted: true } }, t).cards);
    }
    process.env.TZ = 'Asia/Kolkata';
    ok(Object.values(html).every((h) => h === html['Asia/Kolkata']), `cards identical on every device time zone at ${at}`);
  }
  setNow(NOW);
}

console.log(`\nALL CHECKS PASSED (${pass})`);
