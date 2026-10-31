// =============================================================================
// VERBATIM ports of the Glide "JS Card" columns (each returns the HTML that the
// Rich Text component on the Weekly Metrics screen displays).
// Bodies are copied from Glide unchanged, except the lines marked
// "CHANGED from Glide" (weekday read in IST instead of the device clock).
// =============================================================================

// "Received / JS Card"
//   p1 = Received / Template chart          ("W1,W2,W3,W4,W5")
//   p2 = Received / JS unique customers added W1
//   p3 = Received / higher better           ("true")
export function CARD_RECEIVED(p1, p2, p3) {
  var all = p1.split(",").map(Number);
  var custAll = p2.split(",").map(Number);
  var current = all[0];
  var currentCust = custAll[0];
  var w = all.slice(1).reverse();
  var cw = custAll.slice(1).reverse();
  var avg = w.reduce(function(a,b){return a+b;},0) / w.length;
  var today = new Date(new Date().getTime() + 5.5 * 3600000); // CHANGED from Glide: weekday in IST, not the device clock
  var dayOfWeek = today.getUTCDay();
  var daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  var currentDaily = current / daysElapsed;
  var avgDaily = avg / 7;
  var pct = Math.round(((currentDaily - avgDaily) / avgDaily) * 100);
  var isUp = currentDaily > avgDaily;
  var higherIsBetter = p3 === "true";
  var good = higherIsBetter ? isUp : !isUp;
  var trendColor = currentDaily === avgDaily ? "#888" : (good ? "#4CAF50" : "#FF5252");
  var arrow = currentDaily > avgDaily ? "▲" : currentDaily < avgDaily ? "▼" : "―";
  var max = Math.max.apply(null, w);
  var h = w.map(function(v){ return Math.round((v/max)*100); });
  var shades = ["#444","#555","#777","#999"];
  return '<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">'
  + '<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Received</p>'
  + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:6px">'
  + '<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">' + current + '</p>'
  + '<p style="margin:0;font-size:12px;color:#999">' + currentCust + ' customers</p>'
  + '<p style="margin:0;font-size:12px;color:' + trendColor + '">' + arrow + ' ' + Math.abs(pct) + '%</p>'
  + '</div>'
  + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:15px;color:' + (i===3?'#FFF':shades[i]) + ';font-weight:700">' + v + '</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:0">'
  + cw.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:' + (i===3?'#FFF':shades[i]) + '">' + v + ' cust</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;align-items:flex-end;gap:6px;height:70px">'
  + w.map(function(v,i){ return '<div style="flex:1;background:' + shades[i] + ';border-radius:3px;height:' + h[i] + '%"></div>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-top:4px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:#555">-' + (4-i) + 'w</span>'; }).join('')
  + '</div>'
  + '</div></div>';
}

// "Customers / JS Card"  (title "New Customers")
//   p1 = Customers / JS unique customers added W1 copy
export function CARD_CUSTOMERS(p1, p2, p3) {
  var all = p1.split(",").map(Number);
  var current = all[0];
  var w = all.slice(1).reverse();
  var avg = w.reduce(function(a,b){return a+b;},0) / w.length;
  var today = new Date(new Date().getTime() + 5.5 * 3600000); // CHANGED from Glide: weekday in IST, not the device clock
  var dayOfWeek = today.getUTCDay();
  var daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  var currentDaily = current / daysElapsed;
  var avgDaily = avg / 7;
  var pct = avgDaily === 0 ? 0 : Math.round(((currentDaily - avgDaily) / avgDaily) * 100);
  var isUp = currentDaily > avgDaily;
  var trendColor = currentDaily === avgDaily ? "#888" : (isUp ? "#4CAF50" : "#FF5252");
  var arrow = currentDaily > avgDaily ? "▲" : currentDaily < avgDaily ? "▼" : "―";
  var max = Math.max.apply(null, w);
  if (max === 0) max = 1;
  var h = w.map(function(v){ return Math.round((v/max)*100); });
  var shades = ["#444","#555","#777","#999"];
  return '<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">'
  + '<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">New Customers</p>'
  + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:6px">'
  + '<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">' + current + '</p>'
  + '<p style="margin:0;font-size:12px;color:' + trendColor + '">' + arrow + ' ' + Math.abs(pct) + '%</p>'
  + '</div>'
  + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:15px;color:' + (i===3?'#FFF':shades[i]) + ';font-weight:700">' + v + '</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:0">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:' + (i===3?'#FFF':shades[i]) + '">&nbsp;</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;align-items:flex-end;gap:6px;height:70px">'
  + w.map(function(v,i){ return '<div style="flex:1;background:' + shades[i] + ';border-radius:3px;height:' + (h[i] || 2) + '%"></div>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-top:4px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:#555">-' + (4-i) + 'w</span>'; }).join('')
  + '</div>'
  + '</div></div>';
}

// "Quoted / JS Card"
//   p1 = Quoted / JS RFQs Quotes Weekwise
//   p2 = Quoted / JS RFQs quoted value   (string "v0,v1,..."; parseFloat keeps v0)
export function CARD_QUOTED(p1, p2, p3) {
  var counts = p1.split(",").map(Number);
  var current = counts[0];
  var currentVal = p2 ? parseFloat(p2) : 0;
  var w = counts.slice(1).reverse();
  var avg = w.reduce(function(a,b){return a+b;},0) / w.length;
  var today = new Date(new Date().getTime() + 5.5 * 3600000); // CHANGED from Glide: weekday in IST, not the device clock
  var dayOfWeek = today.getUTCDay();
  var daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  var currentDaily = current / daysElapsed;
  var avgDaily = avg / 7;
  var pct = avgDaily === 0 ? 0 : Math.round(((currentDaily - avgDaily) / avgDaily) * 100);
  var trendColor = currentDaily === avgDaily ? "#888" : (currentDaily > avgDaily ? "#4CAF50" : "#FF5252");
  var arrow = currentDaily > avgDaily ? "▲" : currentDaily < avgDaily ? "▼" : "―";
  var max = Math.max.apply(null, w);
  if (max === 0) max = 1;
  var h = w.map(function(v){ return Math.round((v/max)*100); });
  var shades = ["#444","#555","#777","#999"];
  function fmtVal(v) {
    if (v >= 1000000) return "$" + (v/1000000).toFixed(1) + "M";
    if (v >= 1000) return "$" + (v/1000).toFixed(1) + "K";
    return "$" + v;
  }
  return '<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">'
  + '<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Quoted</p>'
  + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:6px">'
  + '<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">' + current + '</p>'
  + '<p style="margin:0;font-size:14px;color:#999;font-weight:600">' + fmtVal(currentVal) + '</p>'
  + '<p style="margin:0;font-size:12px;color:' + trendColor + '">' + arrow + ' ' + Math.abs(pct) + '%</p>'
  + '</div>'
  + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:15px;color:' + (i===3?'#FFF':shades[i]) + ';font-weight:700">' + v + '</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:0">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:' + (i===3?'#FFF':shades[i]) + '">&nbsp;</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;align-items:flex-end;gap:6px;height:70px">'
  + w.map(function(v,i){ return '<div style="flex:1;background:' + shades[i] + ';border-radius:3px;height:' + (h[i] || 2) + '%"></div>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-top:4px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:#555">-' + (4-i) + 'w</span>'; }).join('')
  + '</div>'
  + '</div></div>';
}

// "Quoted / JS Card total open"
//   p1 = Received / RFQs active open count
//   p2 = Active / Relative Active week indicator
export function CARD_TOTAL_OPEN(p1, p2, p3) {
  var pct = p2 ? parseFloat(String(p2).replace("%", "").trim()) : 0;
  if (isNaN(pct)) pct = 0;

  var trendColor = pct === 0 ? "#888" : (pct < 0 ? "#4CAF50" : "#FF5252");
  var arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "―";

  return '<div style="background:#1E1E1E;border-radius:10px;padding:40px 24px;font-family:-apple-system,sans-serif;text-align:center;min-height:250px;display:flex;flex-direction:column;justify-content:center;align-items:center;">'
  + '<p style="margin:0;font-size:14px;color:#999;text-transform:uppercase;letter-spacing:1px;">Total Open</p>'
  + '<p style="margin:16px 0 0;font-size:72px;font-weight:700;color:#FFF;line-height:1;">' + p1 + '</p>'
  + '<p style="margin:18px 0 0;font-size:12px;color:' + trendColor + '">' + arrow + ' ' + Math.abs(pct) + '%</p>'
  + '</div>';
}

// "Quoted / JS Card total sampling"
//   p1 = Received / RFQs sampling count
//   p2 = Active / Relative Sampling week indicator
export function CARD_TOTAL_SAMPLING(p1, p2, p3) {
  var pct = p2 ? parseFloat(String(p2).replace("%", "").trim()) : 0;
  if (isNaN(pct)) pct = 0;

  var trendColor = pct === 0 ? "#888" : (pct < 0 ? "#4CAF50" : "#FF5252");
  var arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "―";

  return '<div style="background:#1E1E1E;border-radius:10px;padding:40px 24px;font-family:-apple-system,sans-serif;text-align:center;min-height:250px;display:flex;flex-direction:column;justify-content:center;align-items:center;">'
  + '<p style="margin:0;font-size:14px;color:#999;text-transform:uppercase;letter-spacing:1px;">Total Sampling</p>'
  + '<p style="margin:16px 0 0;font-size:72px;font-weight:700;color:#FFF;line-height:1;">' + p1 + '</p>'
  + '<p style="margin:18px 0 0;font-size:12px;color:' + trendColor + '">' + arrow + ' ' + Math.abs(pct) + '%</p>'
  + '</div>';
}

// "Quoted / JS Card quoted value"
//   p1 = Quoted / JS RFQs quoted value
export function CARD_QUOTED_VALUE(p1, p2, p3) {
  var vals = p1.split(",").map(Number);
  var current = vals[0];
  var w = vals.slice(1).reverse();
  var max = Math.max.apply(null, w);
  if (max === 0) max = 1;
  var h = w.map(function(v){ return Math.round((v/max)*100); });
  var shades = ["#444","#555","#777","#999"];
  function fmtVal(v) {
    if (v >= 1000000) return "$" + (v/1000000).toFixed(1) + "M";
    if (v >= 1000) return "$" + (v/1000).toFixed(1) + "K";
    return "$" + v;
  }
  function fmtShort(v) {
    if (v >= 1000000) return (v/1000000).toFixed(1) + "M";
    if (v >= 1000) return (v/1000).toFixed(1) + "K";
    return "" + v;
  }
  return '<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">'
  + '<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Quoted Value</p>'
  + '<div style="margin-top:6px">'
  + '<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">' + fmtVal(current) + '</p>'
  + '</div>'
  + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:13px;color:' + (i===3?'#FFF':shades[i]) + ';font-weight:700">' + fmtShort(v) + '</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;align-items:flex-end;gap:6px;height:80px">'
  + w.map(function(v,i){ return '<div style="flex:1;background:' + shades[i] + ';border-radius:3px;height:' + (h[i] || 2) + '%"></div>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-top:4px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:#555">-' + (4-i) + 'w</span>'; }).join('')
  + '</div>'
  + '</div></div>';
}

// "Quote timeline / JS Card"  (title from p2 = "Avg. Quote time")
//   p1 = Quote timeline / Weekwise
//   p2 = Quote timeline / metric label   ("Avg. Quote time")
//   p3 = Quote timeline / higher better  ("false")
export function CARD_QUOTE_TIMELINE(p1, p2, p3) {
  const all = p1.split(",").map(Number);
  const current = all[0];
  const w = all.slice(1).reverse();
  const avg = w.reduce((a,b)=>a+b,0) / w.length;
  const label = p2;
  const pct = Math.round(((current - avg) / avg) * 100);
  const isUp = current > avg;
  const higherIsBetter = p3 === "true";
  const good = higherIsBetter ? isUp : !isUp;
  const trendColor = current === avg ? "#888" : (good ? "#4CAF50" : "#FF5252");
  const arrow = current > avg ? "▲" : current < avg ? "▼" : "―";
  const max = Math.max(...w);
  const h = w.map(v => Math.round((v/max)*100));
  const shades = ["#444","#555","#777","#999"];
  return `<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">
<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">${label}</p>
<div style="display:flex;align-items:baseline;gap:8px;margin-top:6px">
<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">${current}<span style="font-size:16px;color:#777;font-weight:500">d</span></p>
<p style="margin:0;font-size:12px;color:${trendColor}">${arrow} ${Math.abs(pct)}%</p>
</div>
<p style="margin:4px 0 0;font-size:10px;color:#666"></p>
<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">
<div style="display:flex;justify-content:space-between;margin-bottom:8px">
${w.map((v,i)=>`<span style="flex:1;text-align:center;font-size:15px;color:${i===3?'#FFF':shades[i]};font-weight:700">${v}d</span>`).join('')}
</div>
<div style="display:flex;align-items:flex-end;gap:6px;height:80px">
${w.map((v,i)=>`<div style="flex:1;background:${shades[i]};border-radius:3px;height:${h[i]}%"></div>`).join('')}
</div>
<div style="display:flex;justify-content:space-between;margin-top:8px">
${w.map((v,i)=>`<span style="flex:1;text-align:center;font-size:9px;color:#555">-${4-i}w</span>`).join('')}
</div>
</div></div>`;
}

// ---------------------------------------------------------------------------
// Hidden cards (switches in config.components, default OFF)
// ---------------------------------------------------------------------------

// "Won / JS Card"
//   p1 = Won / Count Weekwise
//   p2 = Won / metric label copy  ("Won")
//   p3 = Won / higher better      ("true")
export function CARD_WON(p1, p2, p3) {
  const all = p1.split(",").map(Number);
  const current = all[0];
  const w = all.slice(1).reverse();
  const avg = w.reduce((a,b)=>a+b,0) / w.length;
  const label = p2;
  const today = new Date(new Date().getTime() + 5.5 * 3600000); // CHANGED from Glide: weekday in IST, not the device clock
  const dayOfWeek = today.getUTCDay();
  const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  const currentDaily = current / daysElapsed;
  const avgDaily = avg / 7;
  const pct = Math.round(((currentDaily - avgDaily) / avgDaily) * 100);
  const isUp = currentDaily > avgDaily;
  const higherIsBetter = p3 === "true";
  const good = higherIsBetter ? isUp : !isUp;
  const trendColor = currentDaily === avgDaily ? "#888" : (good ? "#4CAF50" : "#FF5252");
  const arrow = currentDaily > avgDaily ? "▲" : currentDaily < avgDaily ? "▼" : "―";
  const max = Math.max(...w);
  const h = w.map(v => Math.round((v/max)*100));
  const shades = ["#444","#555","#777","#999"];
  return `<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">
<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">${label}</p>
<div style="display:flex;align-items:baseline;gap:8px;margin-top:6px">
<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">${current}</p>
<p style="margin:0;font-size:12px;color:${trendColor}">${arrow} ${Math.abs(pct)}%</p>
</div>
<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">
<div style="display:flex;justify-content:space-between;margin-bottom:8px">
${w.map((v,i)=>`<span style="flex:1;text-align:center;font-size:15px;color:${i===3?'#FFF':shades[i]};font-weight:700">${v}</span>`).join('')}
</div>
<div style="display:flex;align-items:flex-end;gap:6px;height:80px">
${w.map((v,i)=>`<div style="flex:1;background:${shades[i]};border-radius:3px;height:${h[i]}%"></div>`).join('')}
</div>
<div style="display:flex;justify-content:space-between;margin-top:8px">
${w.map((v,i)=>`<span style="flex:1;text-align:center;font-size:9px;color:#555">-${4-i}w</span>`).join('')}
</div>
</div></div>`;
}

// "Won Value JS Card"
//   p1 = Won JS Value   (monthly: "m0,m-1,m-2,m-3,m-4")
export function CARD_WON_VALUE(p1, p2, p3) {
  var vals = p1.split(",").map(Number);
  var current = vals[0];
  var w = vals.slice(1).reverse(); // oldest -> newest: -4m, -3m, -2m, -1m
  var max = Math.max.apply(null, w);
  if (max === 0) max = 1;
  var h = w.map(function(v){ return Math.round((v/max)*100); });
  var shades = ["#444","#555","#777","#999"];
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var IST = 5.5 * 3600000;
  var nowIST = new Date(new Date().getTime() + IST);
  var curY = nowIST.getUTCFullYear();
  var curM = nowIST.getUTCMonth();
  function monthLabel(back) {
    var d = new Date(Date.UTC(curY, curM - back, 1));
    var name = MONTHS[d.getUTCMonth()];
    if (d.getUTCFullYear() !== curY) name += " '" + String(d.getUTCFullYear()).slice(-2);
    return name;
  }
  function fmtVal(v) {
    if (v >= 1000000) return "$" + (v/1000000).toFixed(1) + "M";
    if (v >= 1000) return "$" + (v/1000).toFixed(1) + "K";
    return "$" + v;
  }
  function fmtShort(v) {
    if (v >= 1000000) return (v/1000000).toFixed(1) + "M";
    if (v >= 1000) return (v/1000).toFixed(1) + "K";
    return "" + v;
  }
  return '<div style="background:#1E1E1E;border-radius:10px;padding:16px;font-family:-apple-system,sans-serif">'
  + '<p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Won Value</p>'
  + '<div style="margin-top:6px;display:flex;align-items:baseline;gap:8px">'
  + '<p style="margin:0;font-size:32px;font-weight:700;color:#FFF;line-height:1">' + fmtVal(current) + '</p>'
  + '<span style="font-size:12px;color:#777;font-weight:700">' + monthLabel(0) + '</span>'
  + '</div>'
  + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #2A2A2A">'
  + '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:13px;color:' + (i===3?'#FFF':shades[i]) + ';font-weight:700">' + fmtShort(v) + '</span>'; }).join('')
  + '</div>'
  + '<div style="display:flex;align-items:flex-end;gap:6px;height:80px">'
  + w.map(function(v,i){ return '<div style="flex:1;background:' + shades[i] + ';border-radius:3px;height:' + (h[i] || 2) + '%"></div>'; }).join('')
  + '</div>'
  + '<div style="display:flex;justify-content:space-between;margin-top:4px">'
  + w.map(function(v,i){ return '<span style="flex:1;text-align:center;font-size:9px;color:#555">' + monthLabel(4-i) + '</span>'; }).join('')
  + '</div>'
  + '</div></div>';
}

// "Total Quoted / JS Card Total Quoted"
//   p1 = Total Quoted / Count Total RFQs Quoted
export function CARD_TOTAL_QUOTED(p1, p2, p3) {
  return '<div style="background:#1E1E1E;border-radius:10px;padding:40px 24px;font-family:-apple-system,sans-serif;text-align:center;min-height:250px;display:flex;flex-direction:column;justify-content:center;align-items:center;">'
  + '<p style="margin:0;font-size:14px;color:#999;text-transform:uppercase;letter-spacing:1px;">Total Quoted</p>'
  + '<p style="margin:16px 0 0;font-size:72px;font-weight:700;color:#FFF;line-height:1;">' + p1 + '</p>'
  + '</div>';
}
