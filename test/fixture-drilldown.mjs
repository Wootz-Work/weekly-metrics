// Small hand-built dataset for the drill-down screens: every expected row is known.
// NOW = Mon 2 Nov 2026 13:30 IST (08:00Z). This week starts Mon 2 Nov 00:00 IST = 2026-11-01T18:30Z.
// Weeks: -1 = from 2026-10-25T18:30Z, -2 = from 10-18T18:30Z, -3 = from 10-11T18:30Z, -4 = from 10-04T18:30Z.
import { CONFIG } from '../js/config.js';

export const NOW = new Date('2026-11-02T08:00:00.000Z');
const DAY = 86400000;
const ago = (d, h = 0) => new Date(NOW.getTime() - d * DAY - h * 3600000).toISOString();
const MONDAY_W1 = '2026-10-25T18:30:00.000Z'; // Monday 26 Oct 00:00 IST (date-only values look like this)
const MONDAY_W2 = '2026-10-18T18:30:00.000Z'; // Monday 19 Oct 00:00 IST

// field names == keys
const id = (keys) => Object.fromEntries(keys.map((k) => [k, k]));
export const DD_CONFIG = {
  ...CONFIG,
  components: { won: true, wonValue: true, totalQuoted: true },
  tables: {
    rfqs: { table: 'x', fields: id(['rowId', 'receivedDate', 'currentStatus', 'archive', 'customerName', 'title', 'confidential',
      'costingOrderOfMagnitude', 'rfqCreatedDate', 'publishedLiveDate', 'internalPoc', 'sharingEnabled']) },
    companies: { table: 'x', fields: id(['name', 'addedDate', 'localCurrency']) },
    statusUpdates: { table: 'x', fields: id(['rowId', 'rfqId', 'rfqTitle', 'statusTo', 'statusAt', 'rfqAddedDate', 'rfqPoc',
      'quoteValue', 'quoteCurrency', 'wonValue', 'wonCurrency', 'statusUpdatedBy']) },
    currencyRates: { table: 'x', fields: id(['currencyCode', 'conversionRate']) },
    purchaseOrders: { table: 'x', fields: id(['createdAt', 'verification', 'addedToProjects', 'wonValueLocal', 'customer',
      'defer', 'fromName', 'subjectLine']), customerMatchesCompanyField: 'name' },
    admins: { table: 'x', fields: id(['email', 'name']) },
  },
};

const rfq = (o) => ({
  rowId: o.rowId, receivedDate: o.receivedDate ?? '', currentStatus: o.currentStatus ?? '', archive: o.archive ?? false,
  customerName: o.customerName ?? 'C', title: o.title ?? '', confidential: o.confidential ?? false,
  costingOrderOfMagnitude: o.size ?? 'x,xxx', rfqCreatedDate: o.created ?? '', publishedLiveDate: o.pld ?? '',
  internalPoc: o.poc ?? '', sharingEnabled: o.sharing ?? true,
});

export function buildDrilldownFixture() {
  const rfqs = [
    rfq({ rowId: 'R1', title: 'Entai 1 - Bolt', receivedDate: ago(1), currentStatus: 'Live', created: ago(1), poc: 'harsh.maheshwari@wootz.work', pld: ago(3, 10), size: 'xx,xxx' }),
    rfq({ rowId: 'R2', title: 'Entai 2 - Nut', receivedDate: ago(9), currentStatus: 'Quoted', created: ago(9), confidential: true, sharing: false }),
    rfq({ rowId: 'R3', title: '', receivedDate: ago(2), currentStatus: 'Live', created: ago(2), sharing: false }), // empty title: the card counts it
    rfq({ rowId: 'R4', title: 'Entai 4 - Washer', receivedDate: ago(3), currentStatus: '', created: ago(3) }),
    rfq({ rowId: 'R5', title: 'Entai 5 - Pin', receivedDate: ago(4), currentStatus: 'Weird', created: ago(4) }),
    rfq({ rowId: 'R6', title: 'Entai 6 - Arch', receivedDate: ago(5), currentStatus: 'Live', archive: true, created: ago(5) }),
    rfq({ rowId: 'R7', title: 'Entai 7 - Old', receivedDate: ago(50), currentStatus: 'Hot', created: ago(50), pld: ago(-2) /* future */ }),
    rfq({ rowId: 'R8', title: 'Entai 8 - Sample', receivedDate: ago(20), currentStatus: 'Sampling', created: ago(20) }),
    rfq({ rowId: 'R9', title: 'Entai 9 - Repr', receivedDate: ago(6, 14), currentStatus: 'Repricing', created: '' }), // no created date -> last
    rfq({ rowId: 'R10', title: 'Entai 10 - Sample2', receivedDate: ago(60), currentStatus: 'Sampling', created: ago(60) }),
    rfq({ rowId: 'R11', title: 'Entai 11 - Quoted', receivedDate: ago(70), currentStatus: 'Quoted', created: ago(70) }),
    rfq({ rowId: 'R12', title: 'Entai 12 - Monday', receivedDate: MONDAY_W1, currentStatus: 'Live', created: MONDAY_W1 }), // Monday 00:00 -> Week -1
    rfq({ rowId: 'R13', title: 'Entai 13 - Future', receivedDate: ago(-1), currentStatus: 'Arrival', created: ago(-1) }), // future: not on the card
    rfq({ rowId: 'R14', title: 'Entai 14 - Week -5', receivedDate: ago(33), currentStatus: 'Lost', created: ago(33) }), // in 45 days, not drawn
  ];
  const admins = [
    { email: 'Harsh.Maheshwari@Wootz.work', name: 'Harsh Maheshwari' },
    { email: 'vinay@wootz.work', name: 'Vinay' },
  ];
  const companies = [
    { name: 'Kamikaze', addedDate: ago(6), localCurrency: 'INR' },
    { name: 'Monco', addedDate: MONDAY_W2, localCurrency: 'USD' },                  // Monday 00:00 -> Week -2
    { name: 'Atlas', addedDate: ago(17), localCurrency: 'USD' },
    { name: 'Argo', addedDate: '2026-09-24T06:00:00.000Z', localCurrency: 'USD' }, // in 45 days, Week -6: not drawn
    { name: 'Belgium', addedDate: ago(46), localCurrency: 'USD' },
    { name: 'NoDate', addedDate: '', localCurrency: 'USD' },
  ];
  const currencyRates = [{ currencyCode: 'USD', conversionRate: 1 }, { currencyCode: 'INR', conversionRate: 83 }];
  // table order = chronological per RFQ
  const statusUpdates = [
    { rowId: 'S11', rfqId: 'R12', rfqTitle: 'Entai 12 - Monday', statusTo: 'Quoted', statusAt: MONDAY_W2, rfqAddedDate: '2026-10-15T18:30:00.000Z', quoteValue: 50, quoteCurrency: 'USD' },
    { rowId: 'S12', rfqId: 'R3', rfqTitle: 'Untitled', statusTo: 'Quoted', statusAt: ago(40), rfqAddedDate: ago(41), quoteValue: 7, quoteCurrency: 'USD' }, // Week -6: not drawn
    { rowId: 'S1', rfqId: 'R1', rfqTitle: 'Entai 1 - Bolt', statusTo: 'Live', statusAt: ago(10), rfqAddedDate: ago(12), statusUpdatedBy: 'Anuj Kumar' },
    { rowId: 'S2', rfqId: 'R1', rfqTitle: 'Entai 1 - Bolt', statusTo: 'Quoted', statusAt: ago(8), rfqAddedDate: ago(12), quoteValue: 830000, quoteCurrency: 'INR', statusUpdatedBy: 'Anuj Kumar' },
    { rowId: 'S3', rfqId: 'R1', rfqTitle: 'Entai 1 - Bolt', statusTo: 'Repricing', statusAt: ago(5), rfqAddedDate: ago(12), statusUpdatedBy: 'Anuj Kumar' },
    { rowId: 'S4', rfqId: 'R1', rfqTitle: 'Entai 1 - Bolt', statusTo: 'Quoted', statusAt: ago(2), rfqAddedDate: ago(12), quoteValue: 12000.5, quoteCurrency: 'USD', statusUpdatedBy: 'Suraj Jaiswal' },
    { rowId: 'S5', rfqId: 'R6', rfqTitle: 'Entai 6 - Arch', statusTo: 'Quoted', statusAt: ago(3), rfqAddedDate: ago(5), quoteValue: 5, quoteCurrency: 'USD' }, // archived RFQ: card excludes it
    { rowId: 'S6', rfqId: 'R2', rfqTitle: 'Entai 2 - Nut', statusTo: 'Quoted', statusAt: ago(1), rfqAddedDate: '', quoteValue: 100, quoteCurrency: 'EUR' }, // no rate, no added date
    { rowId: 'S7', rfqId: 'R2', rfqTitle: 'Entai 2 - Nut', statusTo: 'Won', statusAt: ago(0, 5), statusUpdatedBy: 'Hemant' },
    { rowId: 'S8', rfqId: 'R6', rfqTitle: 'Entai 6 - Arch', statusTo: 'Won', statusAt: ago(1) }, // archived RFQ: the Won card still counts it
    { rowId: 'S9', rfqId: 'R7', rfqTitle: 'Entai 7 - Old', statusTo: 'Won', statusAt: ago(50) },  // older than 45 days
    { rowId: 'S10', rfqId: 'NOPE', rfqTitle: 'Orphan', statusTo: 'Quoted', statusAt: ago(4), rfqAddedDate: ago(4, 12), quoteValue: 1, quoteCurrency: 'USD' },
  ];
  const po = (o) => ({ createdAt: o.createdAt, verification: o.verification, addedToProjects: o.project ?? '', wonValueLocal: o.value ?? '',
    customer: o.customer ?? '', defer: o.defer ?? false, fromName: o.from ?? '', subjectLine: o.subject });
  const purchaseOrders = [
    po({ createdAt: ago(1), verification: true, project: 'Entai 101,Entai 102', value: 194810, customer: 'Kamikaze', from: 'anuj', subject: 'PO 1' }),
    po({ createdAt: ago(3), verification: false, project: '', value: 500, customer: 'Atlas', from: 'tanmay', subject: 'PO 2' }),   // to accept: no project
    po({ createdAt: ago(2), verification: true, project: 'X', value: 1, customer: 'Atlas', defer: true, from: 'x', subject: 'PO 3' }), // verified: the card counts it
    po({ createdAt: ago(400), verification: true, project: 'Old , Older', value: 10, customer: 'Kamikaze', subject: 'PO 4' }),       // too old
    po({ createdAt: ago(40), verification: true, project: 'Big 4', value: '', subject: 'PO 5' }),                                     // verified, no value
    po({ createdAt: ago(35), project: 'Trump 9', value: '', from: 'shivam', subject: 'PO 6' }),                                      // to accept: no value
    po({ createdAt: ago(36), verification: false, project: '', value: 10, defer: true, subject: 'PO 7' }),                           // deferred: hidden
    po({ createdAt: ago(150), verification: true, project: 'Big 1', value: 99, customer: 'Atlas', subject: 'PO 8' }),               // in 180 days, month -5
    po({ createdAt: ago(100), verification: true, project: 'Shakti 1', value: 1000, customer: 'Kamikaze', subject: 'PO 9' }),        // July = month -4
  ];
  return { rfqs, admins, companies, currencyRates, statusUpdates, purchaseOrders };
}
