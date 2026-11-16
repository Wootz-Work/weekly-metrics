// =============================================================================
// DRILL-DOWN — the table shown when a Weekly Metrics card is clicked
// (Glide: the card's "Show new screen" / workflow action).
//
// Every screen lists exactly the rows its card counts. The rows come from
// computeMetrics(...).drill (js/pipeline.js): the SAME filtered arrays and
// helpers the card was computed from. This file only
//   1) keeps the weeks / months drawn on the card (this one + the 4 before),
//   2) sorts like the Glide screen,
//   3) builds the Glide screen's columns.
// Pure functions, no DOM (the overlay is js/drilldownView.js).
//
//   computeDrilldown(cardKey, drill, config) -> { key, title, columns, rows, link, tableTitle, meta }
// =============================================================================

const DAY = 86400000;
const WEEK = 7 * DAY;
const IST = 5.5 * 3600000;

function isEmpty(v) {
  return v === undefined || v === null || v === '' || (typeof v === 'number' && isNaN(v));
}
function toDate(v) {
  if (isEmpty(v)) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function isChecked(v) {
  return v === true || v === 'true' || v === 'TRUE';
}
const text = (v) => (isEmpty(v) ? '' : String(v));

// -----------------------------------------------------------------------------
// Weeks and months — the same rules as the cards
// -----------------------------------------------------------------------------
// Monday 00:00 IST of the week containing `now`, as a UTC instant.
function mondayUTC(now) {
  const d = new Date(now.getTime() + IST);
  const back = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back) - IST;
}
// 0 = this week (from Monday 00:00 IST), 1..n = weeks before, each Monday 00:00 ->
// Sunday 23:59 IST. Same rule as the card columns in js/glideColumns.js
// (Math.ceil, "CHANGED from Glide"). null = no date.
export function weekIndex(value, now) {
  const d = toDate(value);
  if (!d) return null;
  const mon = mondayUTC(now);
  return d.getTime() >= mon ? 0 : Math.ceil((mon - d.getTime()) / WEEK);
}
// Glide "Week" column labels: "Current week", "Week -1", ...
export function weekLabel(value, now) {
  const w = weekIndex(value, now);
  return w === null ? '' : w === 0 ? 'Current week' : 'Week -' + w;
}
// Calendar month in IST: 0 = this month, 1..n = months before (same as "Won JS Value").
export function monthIndex(value, now) {
  const d = toDate(value);
  if (!d) return null;
  const a = new Date(now.getTime() + IST), b = new Date(d.getTime() + IST);
  return (a.getUTCFullYear() * 12 + a.getUTCMonth()) - (b.getUTCFullYear() * 12 + b.getUTCMonth());
}
// Same labels as the Won Value card: "Nov", "Oct", ... ("Dec '25" in another year).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function monthLabel(value, now) {
  const d = toDate(value);
  if (!d) return '';
  const a = new Date(now.getTime() + IST), b = new Date(d.getTime() + IST);
  let name = MONTHS[b.getUTCMonth()];
  if (b.getUTCFullYear() !== a.getUTCFullYear()) name += " '" + String(b.getUTCFullYear()).slice(-2);
  return name;
}
const CARD_WEEKS = 4;   // the cards draw this week + the 4 before
const CARD_MONTHS = 4;  // the Won Value card draws this month + the 4 before

// -----------------------------------------------------------------------------
// Display helpers (Glide column display settings)
// -----------------------------------------------------------------------------
function makeFormatters(dd = {}) {
  const locale = dd.locale || 'en-GB';
  const timeZone = dd.timeZone || 'Asia/Kolkata';
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone });
  const dateTimeFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
  });
  const money2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    date: (v) => { const d = toDate(v); return d ? dateFmt.format(d) : ''; },          // "27 Oct 2026"
    dateTime: (v) => { const d = toDate(v); return d ? dateTimeFmt.format(d) : ''; },  // "31 Oct 2026, 13:30"
    money2: (v) => (isEmpty(v) || !isFinite(v) ? '' : money2.format(v)),               // "138,594.71"
  };
}
// Glide number "Precision 1" inside a Template -> whole number
function precision1(v) {
  if (isEmpty(v)) return '';
  const r = Math.round(v);
  return String(r === 0 ? 0 : r); // avoid "-0"
}
// Glide "Split Text" by "," then "Joined List" with ", "
function splitJoin(v) {
  if (isEmpty(v)) return '';
  return String(v).split(',').map((s) => s.trim()).filter((s) => s !== '').join(', ');
}
// Date Difference in days (fractional)
function dateDiffDays(start, end) {
  const a = toDate(start), b = toDate(end);
  return a && b ? (b.getTime() - a.getTime()) / DAY : undefined;
}
// Newest first; rows without a date go last; ties keep table order (stable sort).
function sortByDateDesc(rows, getDate) {
  const t = (r) => { const d = toDate(getDate(r)); return d ? d.getTime() : null; };
  return [...rows].sort((a, b) => {
    const ta = t(a), tb = t(b);
    if (ta === null || tb === null) return (ta === null) - (tb === null);
    return tb - ta;
  });
}

// Glide column "Icon-Disable sharing": Heroicons v2 "pause", outline, #FFD665
export const ICON_DISABLE_SHARING_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFD665" ' +
  'width="20" height="20" aria-label="Sharing disabled"><path stroke-linecap="round" stroke-linejoin="round" ' +
  'd="M15.75 5.25v13.5m-7.5-13.5v13.5"/></svg>';

// =============================================================================
// Screens
// =============================================================================
// card -> screen it opens (several cards open the same screen, like in Glide)
export const CARD_TO_SCREEN = {
  received: 'rfqsReceived',
  won: 'rfqsWon',
  customers: 'newCustomers',
  quoted: 'rfqsQuoted',
  quotedValue: 'rfqsQuoted',
  quoteTimeline: 'rfqsQuoted',
  totalOpen: 'openRfqs',
  totalSampling: 'samplingRfqs',
  wonValue: 'wonPOs',
  totalQuoted: 'totalQuotedRfqs',
};

export function computeDrilldown(cardKey, drill, config) {
  const screenKey = CARD_TO_SCREEN[cardKey];
  if (!screenKey) throw new Error(`No drill-down screen for card "${cardKey}"`);
  const now = new Date(drill.now);
  const dd = config.drilldown || {};
  const F = makeFormatters(dd);
  const { rows, tables, fn } = drill;

  const inCardWeeks = (v) => { const w = weekIndex(v, now); return w !== null && w <= CARD_WEEKS; };
  const inCardMonths = (v) => { const m = monthIndex(v, now); return m !== null && m >= 0 && m <= CARD_MONTHS; };

  // ---- "All RFQs - Strike" computed columns --------------------------------
  // Title confidential: Confidential checked -> "ⓒ <Title>" else Title
  const titleConfidential = (r) => (isChecked(r.confidential) ? 'ⓒ ' : '') + text(r.title);
  // PoC: Internal PoC email -> Admins "Email lowercase" -> Name
  const adminByEmail = new Map();
  for (const a of tables.admins || []) {
    const e = text(a.email).trim().toLowerCase();
    if (e && !adminByEmail.has(e)) adminByEmail.set(e, a);
  }
  const pocName = (r) => text((adminByEmail.get(text(r.internalPoc).trim().toLowerCase()) || {}).name);
  // Active Since: Published Live Date -> now (days) if not in the future,
  // else the rounded days since Received date; shown as "<n> Days"
  const activeSince = (r) => {
    const pldd = dateDiffDays(r.publishedLiveDate, now);
    if (!isEmpty(pldd) && pldd >= 0) return precision1(pldd) + ' Days';
    const rda = dateDiffDays(r.receivedDate, now);
    return precision1(isEmpty(rda) ? undefined : Math.round(rda)) + ' Days';
  };
  // Image: Sharing enabled? checked -> nothing, else the "sharing disabled" icon
  const sharingIcon = (r) => (isChecked(r.sharingEnabled) ? '' : ICON_DISABLE_SHARING_SVG);

  // ---- columns (label = Glide table header) --------------------------------
  const C = {
    size: { key: 'size', label: 'Size ($)', type: 'text', get: (r) => text(r.costingOrderOfMagnitude) },
    title: { key: 'title', label: 'Title', type: 'text', get: titleConfidential },
    poc: { key: 'poc', label: 'PoC', type: 'person', get: pocName },
    activeSince: { key: 'activeSince', label: 'Active Since', type: 'text', get: activeSince },
    image: { key: 'image', label: 'Image', type: 'html', get: sharingIcon },
    salesStatus: { key: 'salesStatus', label: 'sales status', type: 'text', get: (r) => text(r.currentStatus) },
  };
  const rfqOpenColumns = [C.size, C.title, C.activeSince, C.poc, C.image];

  let screen;
  switch (screenKey) {
    case 'rfqsReceived':
      screen = {
        title: 'RFQs Received',
        // card: Received date in this week (up to now) or the 4 before
        rows: sortByDateDesc(rows.received.filter((r) => inCardWeeks(r.receivedDate) && toDate(r.receivedDate) <= now), (r) => r.rfqCreatedDate),
        columns: [C.size, C.title,
          { key: 'receivedDate', label: 'Received date', type: 'text', get: (r) => F.date(r.receivedDate) },
          C.poc,
          { key: 'week', label: 'Week', type: 'pill', get: (r) => weekLabel(r.receivedDate, now) }],
      };
      break;
    case 'rfqsWon':
      screen = {
        title: 'RFQs Won',
        rows: sortByDateDesc(rows.won.filter((u) => inCardWeeks(u.statusAt)), (u) => u.statusAt),
        columns: [
          { key: 'title', label: 'Title', type: 'text', get: (u) => text(u.rfqTitle) },
          { key: 'updatedBy', label: 'Updated by', type: 'text', get: (u) => text(u.statusUpdatedBy) },
          { key: 'wonDate', label: 'Won date', type: 'text', get: (u) => F.dateTime(u.statusAt) },
          { key: 'week', label: 'Week', type: 'pill', get: (u) => weekLabel(u.statusAt, now) },
        ],
      };
      break;
    case 'newCustomers':
      screen = {
        title: 'New Customers',
        rows: sortByDateDesc(rows.customers.filter((c) => inCardWeeks(c.addedDate)), (c) => c.addedDate),
        columns: [
          { key: 'name', label: 'Name', type: 'text', get: (c) => text(c.name) },
          { key: 'addedDate', label: 'Added Date', type: 'text', get: (c) => F.date(c.addedDate) },
          { key: 'week', label: 'Week', type: 'pill', get: (c) => weekLabel(c.addedDate, now) },
        ],
      };
      break;
    case 'rfqsQuoted':
      screen = {
        title: 'RFQs Quoted',
        rows: sortByDateDesc(rows.quoted.filter((u) => inCardWeeks(u.statusAt)), (u) => u.statusAt),
        columns: [
          { key: 'title', label: 'Title', type: 'text', get: (u) => text(u.rfqTitle) },
          { key: 'quoteValueUsd', label: 'Quote value (USD)', type: 'number', get: (u) => F.money2(fn.quoteValueUsd(u)) },
          // Template Quote Time = "<Date Difference(Last update date final -> Status updated at)> Days"
          { key: 'quoteTime', label: 'Quote Time', type: 'text', get: (u) => precision1(dateDiffDays(fn.lastUpdateDateFinal(u), u.statusAt)) + ' Days' },
          { key: 'statusUpdatedBy', label: 'Status updated by', type: 'text', get: (u) => text(u.statusUpdatedBy) },
          { key: 'statusUpdatedAt', label: 'Status updated at', type: 'text', get: (u) => F.dateTime(u.statusAt) },
          { key: 'week', label: 'Week', type: 'pill', get: (u) => weekLabel(u.statusAt, now) },
        ],
      };
      break;
    case 'openRfqs':
      screen = {
        title: 'Open RFQs',
        rows: sortByDateDesc(rows.totalOpen, (r) => r.rfqCreatedDate),
        columns: [...rfqOpenColumns, C.salesStatus],
      };
      break;
    case 'samplingRfqs':
      screen = {
        title: 'Sampling RFQs',
        rows: sortByDateDesc(rows.totalSampling, (r) => r.rfqCreatedDate),
        columns: rfqOpenColumns,
      };
      break;
    case 'wonPOs': {
      // The card's POs (Verified, last 180 days) in the months drawn on the card,
      // plus the POs still to be accepted: not deferred, Project or Value empty.
      const counted = rows.wonValue.filter((p) => inCardMonths(p.createdAt));
      const toAccept = tables.purchaseOrders.filter((p) => inCardMonths(p.createdAt) && !isChecked(p.defer) &&
        (splitJoin(p.addedToProjects) === '' || isEmpty(p.wonValueLocal)));
      const all = [...new Set([...counted, ...toAccept])];
      screen = {
        title: 'Won POs',
        tableTitle: 'Purchase Orders',
        link: dd.wonPOsLink || null,
        rows: sortByDateDesc(all, (p) => p.createdAt),
        columns: [
          { key: 'project', label: 'Project', type: 'text', get: (p) => splitJoin(p.addedToProjects) },
          { key: 'valueUsd', label: 'Value (USD)', type: 'number', get: (p) => F.money2(fn.poWonValueUsd(p)) },
          { key: 'fromName', label: 'From name', type: 'text', get: (p) => text(p.fromName) },
          { key: 'createdAt', label: 'Created at', type: 'text', get: (p) => F.dateTime(p.createdAt) },
          { key: 'subjectLine', label: 'Subject line', type: 'text', get: (p) => text(p.subjectLine) },
          { key: 'month', label: 'Month', type: 'pill', get: (p) => monthLabel(p.createdAt, now) },
        ],
        meta: { counted: counted.length, toAccept: toAccept.length },
      };
      break;
    }
    case 'totalQuotedRfqs':
      screen = {
        title: 'Total Quoted',
        rows: sortByDateDesc(rows.totalQuoted, (r) => r.rfqCreatedDate),
        columns: [...rfqOpenColumns, C.salesStatus],
      };
      break;
    default:
      throw new Error(`Unknown drill-down screen "${screenKey}"`);
  }

  return {
    key: screenKey,
    title: screen.title,
    tableTitle: screen.tableTitle || '',
    link: screen.link || null,
    columns: screen.columns.map(({ key, label, type }) => ({ key, label, type })),
    rows: screen.rows.map((r) => {
      const out = { _raw: r };
      for (const c of screen.columns) out[c.key] = c.get(r);
      return out;
    }),
    meta: { now: now.toISOString(), count: screen.rows.length, ...(screen.meta || {}) },
  };
}
