// =============================================================================
// VERBATIM ports of the Glide "JavaScript" columns of table
// "Metrics (Do not touch)". The body of every function below is the code
// copied from Glide unchanged (only comment lines removed / whitespace).
// Parameters p1, p2, p3 are wired exactly as in Glide (see comments).
//
// Do NOT "clean up" these functions: quirks (e.g. UTC vs IST, no divide-by-zero
// guard) are intentional copies.
// Deliberate exception, marked "CHANGED from Glide": the week buckets that used
// Math.floor now use Math.ceil, so every week is Monday 00:00 -> Sunday 23:59 IST
// by date. With Math.floor a value at exactly Monday 00:00 (every date-only value,
// e.g. "Received date") was counted in the week before.
// =============================================================================

// -----------------------------------------------------------------------------
// Received group
// -----------------------------------------------------------------------------

// "Received / JS RFQs added W1"   p1 = Received / Join JSON RFQs
export function JS_RFQS_ADDED_W1(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const start = new Date(mon.getTime() - IST);
  const items = JSON.parse(`[${p1}]`);
  const s = new Set();
  items.forEach(i => { const d = new Date(i["Received date"]); if (d >= start && d <= now) s.add(i["🔒 Row ID"]); });
  return s.size;
}

// "Received / JS RFQs added W2"   p1 = Received / Join JSON RFQs
export function JS_RFQS_ADDED_W2(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 86400000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const monUTC = new Date(mon.getTime() - IST);
  const start = new Date(monUTC.getTime() - WEEK);
  const items = JSON.parse(`[${p1}]`);
  const s = new Set();
  items.forEach(i => { const d = new Date(i["Received date"]); if (d >= start && d < monUTC) s.add(i["🔒 Row ID"]); });
  return s.size;
}

// "Received / JS RFQs added W3"   p1 = Received / Join JSON RFQs
export function JS_RFQS_ADDED_W3(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 86400000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const monUTC = new Date(mon.getTime() - IST);
  const start = new Date(monUTC.getTime() - 2 * WEEK);
  const end = new Date(monUTC.getTime() - WEEK);
  const items = JSON.parse(`[${p1}]`);
  const s = new Set();
  items.forEach(i => { const d = new Date(i["Received date"]); if (d >= start && d < end) s.add(i["🔒 Row ID"]); });
  return s.size;
}

// "Received / JS RFQs added W4"   p1 = Received / Join JSON RFQs
export function JS_RFQS_ADDED_W4(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 86400000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const monUTC = new Date(mon.getTime() - IST);
  const start = new Date(monUTC.getTime() - 3 * WEEK);
  const end = new Date(monUTC.getTime() - 2 * WEEK);
  const items = JSON.parse(`[${p1}]`);
  const s = new Set();
  items.forEach(i => { const d = new Date(i["Received date"]); if (d >= start && d < end) s.add(i["🔒 Row ID"]); });
  return s.size;
}

// "Received / JS RFQs added W5"   p1 = Received / Join JSON RFQs
export function JS_RFQS_ADDED_W5(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 86400000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const monUTC = new Date(mon.getTime() - IST);
  const start = new Date(monUTC.getTime() - 4 * WEEK);
  const end = new Date(monUTC.getTime() - 3 * WEEK);
  const items = JSON.parse(`[${p1}]`);
  const s = new Set();
  items.forEach(i => { const d = new Date(i["Received date"]); if (d >= start && d < end) s.add(i["🔒 Row ID"]); });
  return s.size;
}

// "Received / JS unique customers added W1"   p1 = Received / Join JSON RFQs
// OUTPUT: comma-separated unique customer counts: "currentWeek,-1w,-2w,-3w,-4w"
export function JS_UNIQUE_CUSTOMERS_ADDED_W1(p1, p2, p3) {
  var raw = "[" + p1 + "]";
  var items = JSON.parse(raw);
  var IST = 5.5 * 3600000;
  var WEEK = 7 * 24 * 60 * 60 * 1000;

  var nowIST = new Date(new Date().getTime() + IST);

  var day = nowIST.getUTCDay();
  var mondayOffset = day === 0 ? 6 : day - 1;

  var mondayIST = new Date(nowIST);
  mondayIST.setUTCDate(nowIST.getUTCDate() - mondayOffset);
  mondayIST.setUTCHours(0, 0, 0, 0);

  var mondayUTC = mondayIST.getTime() - IST;

  function getWeekBucket(dateStr) {
    var t = new Date(dateStr).getTime();
    if (t >= mondayUTC) return 0;
    var diff = Math.ceil((mondayUTC - t) / WEEK); // CHANGED from Glide (was Math.floor + "<"): Monday 00:00 stays in its own week
    if (diff <= 1) return 1;
    if (diff <= 2) return 2;
    if (diff <= 3) return 3;
    if (diff <= 4) return 4;
    return -1;
  }

  var buckets = {};
  for (var w = 0; w <= 4; w++) buckets[w] = {};

  for (var i = 0; i < items.length; i++) {
    var bucket = getWeekBucket(items[i]["Received date"]);
    if (bucket >= 0 && bucket <= 4) {
      buckets[bucket][items[i]["Customer"]] = true;
    }
  }

  var counts = [];
  for (var w = 0; w <= 4; w++) {
    counts.push(Object.keys(buckets[w]).length);
  }

  return counts.join(",");
}

// -----------------------------------------------------------------------------
// Customers group
// -----------------------------------------------------------------------------

// "Customers / JS unique customers added W1 copy"   p1 = Customers / Join JSON customers added copy
export function JS_UNIQUE_CUSTOMERS_ADDED_W1_COPY(p1, p2, p3) {
  var raw = "[" + p1 + "]";
  var items = JSON.parse(raw);
  var IST = 5.5 * 3600000;
  var today = new Date(new Date().getTime() + IST);
  var day = today.getUTCDay();
  var mondayOffset = day === 0 ? 6 : day - 1;
  var monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  var WEEK = 7 * 24 * 60 * 60 * 1000;
  var counts = [0,0,0,0,0];
  for (var i = 0; i < items.length; i++) {
    var d = new Date(new Date(items[i]["Added date"]).getTime() + IST);
    if (d >= monday) { counts[0]++; }
    else {
      var diff = Math.ceil((monday - d) / WEEK); // CHANGED from Glide (was Math.floor + "<"): Monday 00:00 stays in its own week
      if (diff <= 1) counts[1]++;
      else if (diff <= 2) counts[2]++;
      else if (diff <= 3) counts[3]++;
      else if (diff <= 4) counts[4]++;
    }
  }
  return counts.join(",");
}

// -----------------------------------------------------------------------------
// Quoted group
// -----------------------------------------------------------------------------

// "Quoted / JS RFQs Quotes Weekwise"   p1 = Quoted / Join JSON RFQs
export function JS_RFQS_QUOTES_WEEKWISE(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const items = JSON.parse(`[${p1}]`);
  const buckets = [{},{},{},{},{}];
  items.forEach(item => {
    const d = new Date(new Date(item.Date).getTime() + IST);
    if (d >= mon) {
      buckets[0][item.RFQ] = true;
    } else {
      const wk = Math.ceil((mon - d) / WEEK); // CHANGED from Glide (was Math.floor + "<"): Monday 00:00 stays in its own week
      if (wk <= 1) buckets[1][item.RFQ] = true;
      else if (wk <= 2) buckets[2][item.RFQ] = true;
      else if (wk <= 3) buckets[3][item.RFQ] = true;
      else if (wk <= 4) buckets[4][item.RFQ] = true;
    }
  });
  const counts = buckets.map(b => Object.keys(b).length);
  return counts.join(",");
}

// "Quoted / JS RFQs quoted value"   p1 = Quoted / Join JSON status updates
// (identical code also exists as "Quoted / JS value quoted" — not used by any card)
export function JS_RFQS_QUOTED_VALUE(p1, p2, p3) {
  var raw = "[" + p1 + "]";
  var items = JSON.parse(raw);
  var IST = 5.5 * 3600000;
  var today = new Date(new Date().getTime() + IST);
  var day = today.getUTCDay();
  var mondayOffset = day === 0 ? 6 : day - 1;
  var monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  var WEEK = 7 * 24 * 60 * 60 * 1000;
  var sums = [0,0,0,0,0];
  for (var i = 0; i < items.length; i++) {
    var d = new Date(new Date(items[i]["Date"]).getTime() + IST);
    var val = parseFloat(items[i]["value_usd"]) || 0;
    if (d >= monday) { sums[0] += val; }
    else {
      var diff = Math.ceil((monday - d) / WEEK); // CHANGED from Glide (was Math.floor + "<"): Monday 00:00 stays in its own week
      if (diff <= 1) sums[1] += val;
      else if (diff <= 2) sums[2] += val;
      else if (diff <= 3) sums[3] += val;
      else if (diff <= 4) sums[4] += val;
    }
  }
  return sums.map(function(v){ return Math.round(v); }).join(",");
}

// -----------------------------------------------------------------------------
// Quote timeline group
// -----------------------------------------------------------------------------

// "Quote timeline / Weekwise"   p1 = Quoted / Join JSON RFQs
export function QT_WEEKWISE(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const DAY = 86400000;
  const WEEK = 7 * DAY;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const monday = new Date(mon.getTime() - IST);
  const nextMonday = new Date(monday.getTime() + WEEK);
  const items = JSON.parse(`[${p1}]`);
  const weeks = [0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0];
  items.forEach(i => {
    if (!i.Title || i.Title.toLowerCase().includes("test")) return;
    if (!i.Date || !i.last_updated_date) return;
    const quotedDate = new Date(i.Date);
    const lastUpdatedDate = new Date(i.last_updated_date);
    if (
      isNaN(quotedDate.getTime()) ||
      isNaN(lastUpdatedDate.getTime())
    ) return;
    const days =
      (quotedDate.getTime() - lastUpdatedDate.getTime()) / DAY;
    if (days < 0) return;
    let bucket = -1;
    if (quotedDate >= monday && quotedDate < nextMonday) {
      bucket = 0;
    } else if (quotedDate < monday) {
      bucket = Math.ceil(
        (monday.getTime() - quotedDate.getTime()) / WEEK
      );
    }
    if (bucket >= 0 && bucket <= 4) {
      weeks[bucket] += days;
      counts[bucket]++;
    }
  });
  const result = weeks.map((totalDays, index) =>
    counts[index] > 0
      ? Math.ceil(totalDays / counts[index])
      : 0
  );
  return result.join(",");
}

// -----------------------------------------------------------------------------
// Active group
// -----------------------------------------------------------------------------

// "Active / Relative Active week indicator"   p1 = Active / Join JSON RFQs Active
export function RELATIVE_ACTIVE_WEEK_INDICATOR(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0);
  const currentStartIST = new Date(todayIST.getTime() - (6 * DAY));
  const lastStartIST = new Date(currentStartIST.getTime() - (7 * DAY));
  const currentStart = new Date(currentStartIST.getTime() - IST);
  const lastStart = new Date(lastStartIST.getTime() - IST);
  const items = JSON.parse(`[${p1}]`);
  const currentRFQs = {};
  const lastRFQs = {};
  items.forEach(i => {
    if (!i.RFQ || !i.Date) return;
    if ((i.Status || '').trim().toLowerCase() === 'sampling') return;
    const d = new Date(i.Date);
    if (d >= currentStart && d <= now) {
      currentRFQs[i.RFQ] = true;
    } else if (d >= lastStart && d < currentStart) {
      lastRFQs[i.RFQ] = true;
    }
  });
  const currentCount = Object.keys(currentRFQs).length;
  const lastCount = Object.keys(lastRFQs).length;
  let percentage = 0;
  if (lastCount === 0 && currentCount > 0) {
    percentage = 100;
  } else if (lastCount === 0 && currentCount === 0) {
    percentage = 0;
  } else {
    percentage = ((currentCount - lastCount) / lastCount) * 100;
  }
  return percentage.toFixed(1) + "%";
}

// "Active / Relative Sampling week indicator"   p1 = Active / Join JSON RFQs Active
export function RELATIVE_SAMPLING_WEEK_INDICATOR(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0);
  const currentStartIST = new Date(todayIST.getTime() - (6 * DAY));
  const lastStartIST = new Date(currentStartIST.getTime() - (7 * DAY));
  const currentStart = new Date(currentStartIST.getTime() - IST);
  const lastStart = new Date(lastStartIST.getTime() - IST);
  const items = p1 ? JSON.parse(`[${p1}]`) : [];
  const currentRFQs = {};
  const lastRFQs = {};
  items.forEach(i => {
    if (!i.RFQ || !i.Date) return;
    if ((i.Status || '').trim().toLowerCase() !== 'sampling') return;
    const d = new Date(i.Date);
    if (d >= currentStart && d <= now) {
      currentRFQs[i.RFQ] = true;
    } else if (d >= lastStart && d < currentStart) {
      lastRFQs[i.RFQ] = true;
    }
  });
  const currentCount = Object.keys(currentRFQs).length;
  const lastCount = Object.keys(lastRFQs).length;
  let percentage = 0;
  if (lastCount === 0 && currentCount > 0) {
    percentage = 100;
  } else if (lastCount === 0 && currentCount === 0) {
    percentage = 0;
  } else {
    percentage = ((currentCount - lastCount) / lastCount) * 100;
  }
  return percentage.toFixed(1).replace(".0", "") + "%";
}

// "Active / Current Week and Last Week" (debug column, not used by any card)
export function CURRENT_WEEK_AND_LAST_WEEK(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0);
  const currentStartIST = new Date(todayIST.getTime() - (6 * DAY));
  const lastStartIST = new Date(currentStartIST.getTime() - (7 * DAY));
  const currentStart = new Date(currentStartIST.getTime() - IST);
  const lastStart = new Date(lastStartIST.getTime() - IST);
  const items = JSON.parse(`[${p1}]`);
  const currentRFQs = {};
  const lastRFQs = {};
  items.forEach(i => {
    const d = new Date(i.Date);
    if (d >= currentStart && d <= now && i.RFQ) {
      currentRFQs[i.RFQ] = true;
    } else if (d >= lastStart && d < currentStart && i.RFQ) {
      lastRFQs[i.RFQ] = true;
    }
  });
  const currentCount = Object.keys(currentRFQs).length;
  const lastCount = Object.keys(lastRFQs).length;
  return currentCount + "," + lastCount;
}

// -----------------------------------------------------------------------------
// Won group (hidden cards)
// -----------------------------------------------------------------------------

// "Won / Count Weekwise"   p1 = Won / Join JSON RFQs Won
export function WON_COUNT_WEEKWISE(p1, p2, p3) {
  const IST = 5.5 * 3600000;
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST);
  const day = nowIST.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(nowIST);
  mon.setUTCDate(nowIST.getUTCDate() - diff);
  mon.setUTCHours(0, 0, 0, 0);
  const items = JSON.parse(`[${p1}]`);
  const buckets = [{},{},{},{},{}];
  items.forEach(item => {
    const d = new Date(new Date(item.Date).getTime() + IST);
    if (d >= mon) {
      buckets[0][item.RFQ] = true;
    } else {
      const wk = Math.ceil((mon - d) / WEEK); // CHANGED from Glide (was Math.floor + "<"): Monday 00:00 stays in its own week
      if (wk <= 1) buckets[1][item.RFQ] = true;
      else if (wk <= 2) buckets[2][item.RFQ] = true;
      else if (wk <= 3) buckets[3][item.RFQ] = true;
      else if (wk <= 4) buckets[4][item.RFQ] = true;
    }
  });
  const counts = buckets.map(b => Object.keys(b).length);
  return counts.join(",");
}

// "Won JS Value"   p1 = Join Won JSON Updates   (calendar-month buckets, IST)
export function WON_JS_VALUE(p1, p2, p3) {
  var raw = "[" + p1 + "]";
  var items = JSON.parse(raw);
  var IST = 5.5 * 3600000;
  var today = new Date(new Date().getTime() + IST);
  var curMonthIndex = today.getUTCFullYear() * 12 + today.getUTCMonth();
  var sums = [0, 0, 0, 0, 0];
  for (var i = 0; i < items.length; i++) {
    var d = new Date(new Date(items[i]["Date"]).getTime() + IST);
    var val = parseFloat(items[i]["Value"]) || 0;
    var dMonthIndex = d.getUTCFullYear() * 12 + d.getUTCMonth();
    var diff = curMonthIndex - dMonthIndex;
    if (diff === 0) sums[0] += val;
    else if (diff === 1) sums[1] += val;
    else if (diff === 2) sums[2] += val;
    else if (diff === 3) sums[3] += val;
    else if (diff === 4) sums[4] += val;
  }
  return sums
    .map(function(v) {
      return Math.round(v);
    })
    .join(",");
}
