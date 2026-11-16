// =============================================================================
// DRILL-DOWN VIEW — the Glide detail screen as an overlay with a table, for the
// data returned by computeDrilldown() (js/drilldown.js). No calculations here.
//
//   openDrilldown(screenData, { pageSize })  -> shows the overlay
//   attachCardClicks(gridEl, onCardClick)     -> click on a card slot calls onCardClick(cardKey)
// =============================================================================

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Heroicons v2 "user", outline — shown before PoC names
const PERSON_ICON =
  '<svg class="dd-person-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" ' +
  'stroke="currentColor" width="16" height="16" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" ' +
  'd="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>';

let current = null; // { data, page, pageSize }

// ---------------------------------------------------------------------------
// Centre the panel in the part of this page that is ON SCREEN.
// Inside the Glide Web Embed this page is an iframe that can be taller than the
// screen; it cannot read Glide's scroll position, but IntersectionObserver
// reports which slice of our viewport is visible. Without it: the whole viewport.
// ---------------------------------------------------------------------------
const EDGE = 16;          // gap between the panel and the visible edges
const MIN_AREA = 320;     // if less than this is visible, use the whole viewport
let visibleArea = null;   // { top, bottom } in viewport pixels, or null = whole viewport

function watchVisibleArea() {
  if (!('IntersectionObserver' in window)) return;
  const probe = document.createElement('div');   // covers our viewport, invisible
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const threshold = Array.from({ length: 101 }, (_, i) => i / 100); // re-check every 1% scrolled
  new IntersectionObserver(([e]) => {
    const r = e.intersectionRect;
    visibleArea = e.isIntersecting && r.height >= MIN_AREA ? { top: r.top, bottom: r.bottom } : null;
    if (current) placePanel();
  }, { threshold }).observe(probe);
}

function placePanel() {
  const el = document.getElementById('dd-overlay');
  const h = window.innerHeight;
  const top = visibleArea ? Math.max(0, visibleArea.top) : 0;
  const bottom = visibleArea ? Math.min(h, visibleArea.bottom) : h;
  el.style.paddingTop = `${top + EDGE}px`;
  el.style.paddingBottom = `${h - bottom + EDGE}px`;
}

function cellHtml(col, value) {
  if (col.type === 'html') return value || '';   // icon SVG built in js/drilldown.js (trusted constant)
  if (col.type === 'pill') return value ? `<span class="dd-pill">${esc(value)}</span>` : '';
  if (col.type === 'person') return value ? `<span class="dd-person">${PERSON_ICON}<span>${esc(value)}</span></span>` : '';
  return esc(value);
}

function render() {
  const { data, page, pageSize } = current;
  const total = data.rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const rows = data.rows.slice(start, start + pageSize);

  const head = data.columns.map((c) => `<th class="dd-col-${c.type}">${esc(c.label)}</th>`).join('');
  const body = rows.length
    ? rows.map((r) => `<tr>${data.columns.map((c) => `<td class="dd-col-${c.type}">${cellHtml(c, r[c.key])}</td>`).join('')}</tr>`).join('')
    : `<tr><td class="dd-empty" colspan="${data.columns.length}">No items to show.</td></tr>`;

  let pager = '';
  if (pages > 1) {
    const btn = (p, label = p, disabled = false, active = false) =>
      `<button class="dd-page${active ? ' active' : ''}" data-page="${p}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    pager = `<nav class="dd-pager">${btn(page - 1, '‹', page === 1)}${
      Array.from({ length: pages }, (_, i) => btn(i + 1, i + 1, false, i + 1 === page)).join('')
    }${btn(page + 1, '›', page === pages)}</nav>`;
  }

  const link = data.link
    ? `<a class="dd-link" href="${esc(data.link.url)}" target="_blank" rel="noopener"><span>${esc(data.link.title)}</span><span class="dd-link-arrow">↗</span></a>`
    : '';
  const tableTitle = data.tableTitle ? `<h2 class="dd-table-title">${esc(data.tableTitle)}</h2>` : '';

  document.getElementById('dd-overlay').innerHTML = `
    <div class="dd-screen" role="dialog" aria-modal="true" aria-label="${esc(data.title)}">
      <header class="dd-bar">
        <span></span>
        <h1 class="dd-title">${esc(data.title)}</h1>
        <button class="dd-close" aria-label="Close">✕</button>
      </header>
      <div class="dd-body">
        ${link}${tableTitle}
        <div class="dd-table-wrap">
          <table class="dd-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        </div>
        ${pager}
      </div>
    </div>`;
}

function ensureOverlay() {
  let el = document.getElementById('dd-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dd-overlay';
    el.className = 'dd-overlay';
    el.hidden = true;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('.dd-close') || e.target === el) return closeDrilldown();
      const pg = e.target.closest('.dd-page');
      if (pg && !pg.disabled) {
        current.page = Number(pg.dataset.page);
        render();
        el.querySelector('.dd-body').scrollTop = 0;
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) closeDrilldown(); });
    window.addEventListener('resize', () => { if (current) placePanel(); });
  }
  return el;
}

export function openDrilldown(data, { pageSize = 24 } = {}) {
  const el = ensureOverlay();
  current = { data, page: 1, pageSize };
  render();
  placePanel();
  el.hidden = false;
  document.body.classList.add('dd-open');
}

export function closeDrilldown() {
  const el = document.getElementById('dd-overlay');
  if (el) { el.hidden = true; el.innerHTML = ''; }
  current = null;
  document.body.classList.remove('dd-open');
}

// Cards are rendered by js/app.js into <div class="slot" data-slot="<cardKey>">
export function attachCardClicks(gridEl, onCardClick) {
  gridEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot[data-slot]');
    if (slot && gridEl.contains(slot) && !slot.hidden && slot.firstElementChild) onCardClick(slot.dataset.slot);
  });
  gridEl.classList.add('dd-clickable');
  watchVisibleArea(); // from page load, so the first panel already opens in the right place
}
