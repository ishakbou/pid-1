// Home page: "Continue", the syllabus rows, the two curriculum views and the terminal on the first screen.
import { progress } from './progress.js';
import { scrollSpy, keepVisible } from './site.js';
import { createTerminal } from './terminal/index.js';

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// "Continue" always points to the first lesson that is not completed, in course order
function renderContinue() {
  const go = $('#continue'), start = $('#start0');
  if (!go) return;
  const p = progress();
  const kicker = $('.btn-kicker', go), main = $('.btn-main', go);
  const first = go.getAttribute('data-first-href'), firstLabel = go.getAttribute('data-first-label');
  go.removeAttribute('data-jump');
  if (p.done === 0) {
    kicker.textContent = 'Start with';
    main.textContent = firstLabel;
    if (first) go.setAttribute('href', first);
    else { go.setAttribute('href', '#m0'); go.setAttribute('data-jump', '0'); }
    if (start) start.hidden = true;
  } else if (p.next) {
    const row = $('li[data-lesson="' + p.next + '"] a.les-t');
    kicker.textContent = 'Continue';
    main.textContent = p.next + ' ' + (row ? row.textContent : '');
    if (row) go.setAttribute('href', row.getAttribute('href'));
    if (start) start.hidden = false;
  } else {
    kicker.textContent = 'Course completed';
    main.textContent = 'Get your certificate';
    go.setAttribute('href', go.getAttribute('data-cert-href') || '#curriculum');
    if (start) start.hidden = true;
  }
}
renderContinue();
window.addEventListener('pid1:progress', renderContinue);
window.addEventListener('storage', renderContinue);

// Syllabus rows open in place, one at a time
const rows = $$('.syl-row');
const setOpen = (row, open) => {
  row.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.getElementById(row.getAttribute('aria-controls')).hidden = !open;
};
rows.forEach((row) => {
  row.addEventListener('click', () => {
    const open = row.getAttribute('aria-expanded') !== 'true';
    rows.forEach((r) => { if (r !== row) setOpen(r, false); });
    setOpen(row, open);
  });
});
const views = $('.views');
const setView = (v) => {
  views.setAttribute('data-view', v);
  $$('.seg button').forEach((o) => o.setAttribute('aria-pressed', o.getAttribute('data-view') === v ? 'true' : 'false'));
};
$$('.seg button').forEach((b) => b.addEventListener('click', () => setView(b.getAttribute('data-view'))));

// A board card and "Start with Module 0" lead to the same place: the module's row, opened
const jump = (n, focus) => {
  const item = document.getElementById('m' + n);
  if (!item) return;
  setView('syllabus');
  const row = $('.syl-row', item);
  rows.forEach((r) => setOpen(r, r === row));
  item.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  if (focus) row.focus({ preventScroll: true });
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-jump]');
  if (!a) return;
  e.preventDefault();
  jump(a.getAttribute('data-jump'), true);
});
const openFromHash = () => {
  const hash = /^#m(\d+)$/.exec(window.location.hash);
  if (hash) jump(hash[1], false);
};
openFromHash();
window.addEventListener('hashchange', openFromHash);

scrollSpy($$('#page-nav a'), 130, keepVisible);

// The practice terminal on the first screen: a real small Linux, downloaded only when the reader starts it
const heroWin = $('#hero-term');
if (heroWin) createTerminal(heroWin);
