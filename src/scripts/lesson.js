// Lesson page: the docked practice terminal, Run on commands, the section navigator
// and "Mark as complete".
import { courseData, progress, certs, setDone, readPref, writePref } from './progress.js';
import { renderProgress, scrollSpy, keepVisible } from './site.js';
import { createTerminal } from './terminal/index.js';

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
const data = courseData();

// ---------- Mark as complete ----------
const btn = $('#complete'), box = $('.complete');
function renderLesson() {
  if (!btn) return;
  const mine = !!progress().set[data.current];
  btn.setAttribute('aria-pressed', mine ? 'true' : 'false');
  $('.c-label', btn).textContent = mine ? 'Completed' : 'Mark as complete';
  box.classList.toggle('is-done', mine);
  $('#complete-h').textContent = mine ? 'Lesson completed' : 'Finished this lesson?';
  // When this lesson is done and its part (or the whole course) is finished: the way to the certificate
  const note = $('#complete-cert');
  if (!note) return;
  const list = certs();
  const mod = data.modules.find((m) => m.n === data.module);
  const whole = list.find((k) => k.id === 'course'), part = mod && list.find((k) => k.part === mod.part);
  const hit = !mine ? null : whole && whole.open ? whole : part && part.open ? part : null;
  note.hidden = !hit;
  if (!hit) return;
  const title = ((data.parts || []).find((x) => x.n === hit.part) || {}).title;
  $('span', note).textContent = hit.part ? 'You finished Part ' + hit.part + ': ' + title + '.' : 'You finished the whole course.';
  const a = $('a', note);
  a.textContent = hit.part ? 'Get your Part ' + hit.part + ' certificate' : 'Get your course certificate';
  a.setAttribute('href', (data.cert || '') + '#' + (hit.part ? 'part-' + hit.part : 'course'));
}
if (btn) {
  btn.addEventListener('click', () => {
    const ok = setDone(data.current, btn.getAttribute('aria-pressed') !== 'true');
    if (!ok) $('p', box).textContent = 'Your browser did not allow saving. The mark will be lost when you leave this page.';
  });
  window.addEventListener('pid1:progress', renderLesson);
  window.addEventListener('storage', renderLesson);
  renderLesson();
}

// ---------- Section navigator ----------
const secLinks = $$('.secnav a');
if (secLinks.length) scrollSpy(secLinks, 150, keepVisible);

// ---------- Practice terminal (only on lessons with practiceTerminal: true) ----------
const work = $('#work'), pane = $('#termpane');
if (work && pane) {
  const toggle = $('#term-toggle'), fab = $('#term-fab');
  const narrow = () => window.matchMedia('(max-width: 900px)').matches;
  let term = null;
  const ready = createTerminal($('#lesson-term')).then((t) => { term = t; return t; });

  const showTerm = (focus) => {
    if (narrow()) work.classList.add('sheet-open');
    else { work.classList.remove('no-term'); if (toggle) toggle.setAttribute('aria-pressed', 'true'); }
    if (focus) ready.then((t) => t.focus());
  };
  const hideTerm = () => {
    if (narrow()) { work.classList.remove('sheet-open'); if (fab) fab.focus(); }
    else { work.classList.add('no-term'); if (toggle) { toggle.setAttribute('aria-pressed', 'false'); toggle.focus(); } }
  };
  if (toggle) toggle.addEventListener('click', () => { if (work.classList.contains('no-term')) showTerm(true); else hideTerm(); });
  if (fab) fab.addEventListener('click', () => showTerm(true));
  $$('[data-term-hide]').forEach((b) => b.addEventListener('click', hideTerm));
  $$('[data-term-open]').forEach((b) => b.addEventListener('click', () => showTerm(true)));
  pane.addEventListener('keydown', (e) => { if (e.key === 'Escape' && narrow()) hideTerm(); });

  // Run on every command block. A step is ticked when all its command blocks were run.
  const stepItems = $$('.steplist li'), stepsCount = $('#steps-count');
  const renderSteps = () => {
    let n = 0;
    stepItems.forEach((li) => {
      const blocks = $$('.tblock[data-step="' + li.getAttribute('data-step') + '"]');
      const ran = blocks.length > 0 && blocks.every((b) => b.getAttribute('data-ran') === 'true');
      li.setAttribute('data-run', ran ? 'true' : 'false');
      const t = $('[data-run-text]', li);
      if (t) t.textContent = ran ? ' (run)' : '';
      if (ran) n++;
    });
    if (stepsCount) stepsCount.textContent = n + ' of ' + plural(stepItems.length, 'step') + ' run';
  };
  $$('.tblock').forEach((block) => {
    const run = $('.tb-run', block);
    if (!run) return;
    // One entry per command: a continuation line belongs to the command above it
    const commands = [];
    $$('.cmd .line', block).forEach((l) => {
      if (l.classList.contains('cont') && commands.length) commands[commands.length - 1] += '\n' + l.textContent;
      else if (l.classList.contains('cmd')) commands.push(l.textContent);
    });
    run.addEventListener('click', () => {
      showTerm(false);
      ready.then((t) => t.send(commands));
      block.setAttribute('data-ran', 'true');
      renderSteps();
    });
  });
  renderSteps();

  // Divider: drag, or use the arrow keys, to resize the terminal pane
  const divider = $('#divider');
  if (divider) {
    const setW = (pct, save) => {
      pct = Math.max(28, Math.min(60, pct));
      work.style.setProperty('--term-w', pct + '%');
      divider.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (save) writePref('pid1-termw', String(pct));
    };
    divider.setAttribute('aria-valuemin', '28');
    divider.setAttribute('aria-valuemax', '60');
    const saved = parseFloat(readPref('pid1-termw'));
    setW(isNaN(saved) ? 42 : saved, false);
    divider.addEventListener('pointerdown', (e) => {
      divider.setPointerCapture(e.pointerId);
      divider.classList.add('drag');
      const move = (ev) => { const r = work.getBoundingClientRect(); setW(((r.right - ev.clientX) / r.width) * 100, true); };
      const up = () => { divider.classList.remove('drag'); divider.removeEventListener('pointermove', move); divider.removeEventListener('pointerup', up); };
      divider.addEventListener('pointermove', move);
      divider.addEventListener('pointerup', up);
    });
    divider.addEventListener('keydown', (e) => {
      const now = parseFloat(divider.getAttribute('aria-valuenow'));
      if (e.key === 'ArrowLeft') { setW(now + 2, true); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setW(now - 2, true); e.preventDefault(); }
    });
  }
}

renderProgress();
