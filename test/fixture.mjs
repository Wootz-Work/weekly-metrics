// Synthetic data that reproduces the Glide screen as captured on
// Fri 30 Oct 2026, 12:52 IST (Received 14 / ▼9%, New Customers 2 / ▲40%,
// Quoted 25 $2.4M / ▲115%, Total Open 32 / ▼36.6%, Quoted Value $2.4M,
// Total Sampling 9 / ―0%, Avg. Quote time 12d / ▼52%).
import { CONFIG } from '../js/config.js';

export const NOW = new Date('2026-10-30T07:22:00.000Z'); // Fri 12:52 IST
const H = 3600000, DAY = 24 * H, WEEK = 7 * DAY;
// Monday 26 Oct 2026 00:00 IST
export const MON = new Date('2026-10-25T18:30:00.000Z').getTime();
const weekStart = (k) => MON - k * WEEK; // k=0 current, 1 = -1w ...

// test config: field names == keys
const f = (keys) => Object.fromEntries(keys.map((k) => [k, k]));
export const TEST_CONFIG = {
  ...CONFIG,
  tables: {
    rfqs: { table: 'x', fields: f(['rowId', 'receivedDate', 'currentStatus', 'archive', 'customerName']) },
    companies: { table: 'x', fields: f(['name', 'addedDate', 'localCurrency']) },
    statusUpdates: { table: 'x', fields: f(['rowId', 'rfqId', 'rfqTitle', 'statusTo', 'statusAt', 'rfqAddedDate', 'rfqPoc', 'quoteValue', 'quoteCurrency', 'wonValue', 'wonCurrency']) },
    currencyRates: { table: 'x', fields: f(['currencyCode', 'conversionRate']) },
    purchaseOrders: { table: 'x', fields: f(['createdAt', 'verification', 'addedToProjects', 'wonValueLocal', 'customer']), customerMatchesCompanyField: 'name' },
  },
};

const iso = (t) => new Date(t).toISOString();

export function buildFixture() {
  const rfqs = [];
  const companies = [];
  const statusUpdates = [];
  const currencyRates = [
    { currencyCode: 'USD', conversionRate: 1 },
    { currencyCode: 'INR', conversionRate: 83 },
  ];
  const purchaseOrders = [];
  let id = 0;
  const nid = (p) => `${p}${++id}`;

  // ---------------- RFQs received per week ----------------
  // week:            0   1   2   3   4
  const recv =      [14, 27, 42, 17, 0];
  const recvCust =  [9,  8,  17, 11, 0];
  for (let k = 0; k <= 4; k++) {
    for (let i = 0; i < recv[k]; i++) {
      // spread inside the week, current week stays before NOW
      const t = weekStart(k) + (k === 0 ? (i + 1) * H : DAY + i * 2 * H);
      rfqs.push({ rowId: nid('R'), receivedDate: iso(t), currentStatus: 'Lost', archive: false,
        customerName: `C${k}_${i % recvCust[k]}` });
    }
  }
  // excluded: archived, older than 45 days, no date
  rfqs.push({ rowId: nid('R'), receivedDate: iso(weekStart(0) + 2 * H), currentStatus: 'Lost', archive: true, customerName: 'ARCH' });
  rfqs.push({ rowId: nid('R'), receivedDate: iso(NOW.getTime() - 50 * DAY), currentStatus: 'Lost', archive: false, customerName: 'OLD' });
  rfqs.push({ rowId: nid('R'), receivedDate: '', currentStatus: 'Lost', archive: false, customerName: 'NODATE' });

  // ---------------- current status snapshot (Total Open = 32, Total Sampling = 9) ----------------
  // re-use old rows (received > 45 days ago so the Received card is unaffected)
  const old = (status, archive = false) => rfqs.push({ rowId: nid('R'), receivedDate: iso(NOW.getTime() - 60 * DAY),
    currentStatus: status, archive, customerName: 'OLDC' });
  for (let i = 0; i < 20; i++) old('Live');
  for (let i = 0; i < 7; i++) old('Repricing');
  for (let i = 0; i < 5; i++) old('Hot');
  old('Live', true);           // archived -> excluded
  old('live');                 // wrong case -> excluded with textCompare 'exact'
  for (let i = 0; i < 9; i++) old('Sampling');
  old('Sampling', true);       // archived -> excluded
  for (let i = 0; i < 4; i++) old('Quoted');

  // ---------------- companies added per week (2,2,3,3,0) ----------------
  const comp = [2, 2, 3, 3, 0];
  for (let k = 0; k <= 4; k++) for (let i = 0; i < comp[k]; i++) {
    companies.push({ name: `Co${k}_${i}`, addedDate: iso(weekStart(k) + (k === 0 ? (i + 1) * H : 3 * DAY)), localCurrency: 'INR' });
  }
  companies.push({ name: 'CoOld', addedDate: iso(NOW.getTime() - 46 * DAY), localCurrency: 'USD' });
  companies.push({ name: 'CoNoDate', addedDate: '', localCurrency: 'USD' });

  // ---------------- Quoted status updates ----------------
  // unique RFQs quoted per week: 25,23,34,8,0 ; USD value per week ; avg quote days 12,7,14,80
  const quotedCount = [25, 23, 34, 8, 0];
  const quotedValue = [2414999, 6706803, 4873307, 467343, 0];
  const quoteDays = [12, 7, 14, 80, 0];
  for (let k = 0; k <= 3; k++) {
    const n = quotedCount[k];
    const base = Math.floor(quotedValue[k] / n);
    for (let i = 0; i < n; i++) {
      const rfqId = nid('Q');
      rfqs.push({ rowId: rfqId, receivedDate: iso(NOW.getTime() - 100 * DAY), currentStatus: 'Lost', archive: false, customerName: 'X' });
      const at = weekStart(k) + (k === 0 ? (i + 1) * 3 * 60000 + H : DAY + i * H);
      const usd = i === n - 1 ? quotedValue[k] - base * (n - 1) : base;
      const inr = i % 2 === 0; // half the quotes in INR to exercise the currency relation
      statusUpdates.push({
        rowId: nid('S'), rfqId, rfqTitle: `Proj ${rfqId}`, statusTo: 'Quoted', statusAt: iso(at),
        rfqAddedDate: iso(at - quoteDays[k] * DAY), rfqPoc: 'poc',
        quoteValue: inr ? usd * 83 : usd, quoteCurrency: inr ? 'INR' : 'USD',
      });
    }
  }
  // Excluded from Quoted: archived RFQ, older than 45 days
  const archQ = nid('Q');
  rfqs.push({ rowId: archQ, receivedDate: iso(NOW.getTime() - 100 * DAY), currentStatus: 'Lost', archive: true, customerName: 'X' });
  statusUpdates.push({ rowId: nid('S'), rfqId: archQ, rfqTitle: 'Arch', statusTo: 'Quoted', statusAt: iso(weekStart(0) + 2 * H),
    rfqAddedDate: iso(weekStart(0)), quoteValue: 999999, quoteCurrency: 'USD' });
  statusUpdates.push({ rowId: nid('S'), rfqId: 'R1', rfqTitle: 'Old', statusTo: 'Quoted', statusAt: iso(NOW.getTime() - 50 * DAY),
    rfqAddedDate: iso(NOW.getTime() - 60 * DAY), quoteValue: 999999, quoteCurrency: 'USD' });

  // ---------------- Active status updates (rolling 7 days) ----------------
  // currentStart = 23 Oct 18:30Z, lastStart = 16 Oct 18:30Z
  const curStart = new Date('2026-10-23T18:30:00.000Z').getTime();
  const lastStart = new Date('2026-10-16T18:30:00.000Z').getTime();
  const act = ['Live', 'Repricing', 'Hot'];
  for (let i = 0; i < 26; i++) statusUpdates.push({ rowId: nid('S'), rfqId: `A${i}`, rfqTitle: 't', statusTo: act[i % 3], statusAt: iso(curStart + DAY + i * H) });
  for (let i = 0; i < 41; i++) statusUpdates.push({ rowId: nid('S'), rfqId: `B${i}`, rfqTitle: 't', statusTo: act[i % 3], statusAt: iso(lastStart + DAY + i * H) });
  for (let i = 0; i < 3; i++) statusUpdates.push({ rowId: nid('S'), rfqId: `SC${i}`, rfqTitle: 't', statusTo: 'Sampling', statusAt: iso(curStart + DAY + i * H) });
  for (let i = 0; i < 3; i++) statusUpdates.push({ rowId: nid('S'), rfqId: `SL${i}`, rfqTitle: 't', statusTo: 'Sampling', statusAt: iso(lastStart + DAY + i * H) });

  return { rfqs, companies, statusUpdates, currencyRates, purchaseOrders };
}

// Shape it like data/raw.json
export function buildRawJson() {
  return { fetchedAt: NOW.toISOString(), tables: buildFixture() };
}
