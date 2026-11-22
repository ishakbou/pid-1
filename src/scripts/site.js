// Behavior shared by every page: progress numbers, the outline sheet, Copy buttons, printing.
// The home page and the lesson page load their own script on top of this one.
import { courseData, progress } from './progress.js';

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
const STATE = { done: 'Completed', now: 'In progress', todo: '' };

function setBar(i, n, total) {
  if (!i) return;
  i.style.width = (total ? Math.round((n / total) * 100) : 0) + '%';
  i.setAttribute('data-done', total && n >= total ? 'true' : 'false');
}

/** Writes every progress number that is on the page. Pages only add the right attributes. */
export function renderProgress() {
  const p = progress();
  const d = courseData();
  d.modules.forEach((m) => {
    const st = p.mods[m.n];
    $$('[data-module="' + m.n + '"]').forEach((node) => {
      node.setAttribute('data-mstate', st.state);
      const state = $('[data-state]', node);
      if (state) {
        state.setAttribute('data-state', st.state);
        state.textContent = STATE[st.state];
        state.hidden = st.state === 'todo'; // an untouched module shows no state, only "0 of n"
      }
      const c = $('[data-count]', node);
      if (c) c.textContent = st.n + ' of ' + st.total;
      const cl = $('[data-count-long]', node);
      if (cl) cl.textContent = st.n + ' of ' + st.total + ' completed';
      const cs = $('[data-count-short]', node);
      if (cs) cs.textContent = st.total ? st.n + '/' + st.total : '';
      setBar($('.bar i', node), st.n, st.total);
    });
  });
  $$('[data-lesson]').forEach((li) => {
    const done = !!p.set[li.getAttribute('data-lesson')];
    li.setAttribute('data-done', done ? 'true' : 'false');
    const t = $('[data-done-text]', li);
    if (t) t.textContent = done ? ' Completed.' : '';
  });
  $$('[data-overall-pct]').forEach((n) => { n.textContent = p.pct + '%'; });
  $$('[data-overall-bar]').forEach((n) => { setBar(n, p.done, p.total); });
  $$('[data-overall-count]').forEach((n) => { n.textContent = p.done + ' of ' + plural(p.total, 'lesson') + ' completed'; });
  $$('.track[data-part]').forEach((node) => {
    const t = p.parts[node.getAttribute('data-part')] || { n: 0, total: 0 };
    setBar($('.bar i', node), t.n, t.total);
    const c = $('[data-part-count]', node);
    if (c) c.textContent = t.n + ' of ' + plural(t.total, 'lesson') + ' completed';
  });
  if (d.module !== null && p.mods[d.module]) {
    const st = p.mods[d.module];
    setBar($('[data-module-bar]'), st.n, st.total);
    const mc = $('[data-module-count]');
    if (mc) mc.textContent = st.n + ' of ' + st.total + ' completed';
  }
  return p;
}

/** Marks the link of the section that is on screen. The links are in page order. */
export function scrollSpy(links, offset, onChange) {
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href').split('#')[1] || '')));
  let last = -2;
  const tick = () => {
    let cur = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= offset) cur = i; });
    if (cur === last) return;
    last = cur;
    links.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    if (onChange && cur >= 0) onChange(links[cur]);
  };
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
}
export function keepVisible(a) {
  const box = a.closest('.secnav, .rail');
  if (!box || box.scrollWidth <= box.clientWidth) return;
  const r = a.getBoundingClientRect(), b = box.getBoundingClientRect();
  box.scrollLeft += r.left - b.left - (b.width - r.width) / 2;
}

// ---------- Copy on every code block ----------
function blockText(block) {
  const cmd = $('pre.cmd', block);
  if (cmd) return $$('.line', cmd).map((l) => l.textContent).join('\n');
  const pre = $('pre', block);
  return pre ? pre.textContent.replace(/\n$/, '') : '';
}
document.addEventListener('click', (e) => {
  const copy = e.target.closest && e.target.closest('.tb-copy');
  if (!copy) return;
  const block = copy.closest('.tblock, .fblock');
  const label = $('span', copy);
  const done = (text) => {
    label.textContent = text;
    setTimeout(() => { label.textContent = 'Copy'; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(blockText(block)).then(() => done('Copied'), () => done('Copy failed'));
  else done('Copy failed');
});

// ---------- Print (cheat sheets) ----------
$$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

// ---------- The outline sheet ----------
const wrap = $('#outline-sheet'), opener = $('#outline-btn');
if (wrap && opener) {
  const panel = $('.sheet', wrap);
  const close = () => {
    if (wrap.hidden) return;
    wrap.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    opener.focus();
  };
  opener.addEventListener('click', () => {
    wrap.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    panel.scrollTop = 0;
    const here = $('.cnav [aria-current="page"]', wrap);
    if (here) here.scrollIntoView({ block: 'center' });
    $('button[data-sheet-close]', wrap).focus();
  });
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-close]')) close(); });
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button, summary', wrap).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
}

// The rail scrolls to the current page
const railHere = $('.rail .cnav [aria-current="page"]');
if (railHere) {
  const rail = railHere.closest('.rail');
  const r = railHere.getBoundingClientRect(), b = rail.getBoundingClientRect();
  if (r.bottom > b.bottom || r.top < b.top) rail.scrollTop += r.top - b.top - b.height / 3;
}

renderProgress();
window.addEventListener('pid1:progress', renderProgress);
window.addEventListener('storage', renderProgress); // another tab changed the progress

const kind = ($('.frame') || document.body).getAttribute('data-kind');
if (kind === 'home') import('./home.js');
if (kind === 'lesson') import('./lesson.js');
