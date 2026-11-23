// Progress. Everything is kept in ONE localStorage key, and every read and write is wrapped,
// so a browser that blocks storage never breaks a page: the page then simply forgets.
const KEY = 'pid1-progress';

let data = null;
/** The small data block PageFrame puts on every page: which lessons exist, module by module. */
export function courseData() {
  if (data) return data;
  try {
    data = JSON.parse(document.getElementById('course-data').textContent);
  } catch {
    data = { modules: [], current: null, module: null };
  }
  return data;
}

/** The ids of the completed lessons, for example ["0.1", "1.2"]. */
export function stored() {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return Array.isArray(v.done) ? v.done.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, done: list }));
    return true;
  } catch {
    return false;
  }
}

/** Mark a lesson as done or not done. Returns false when the browser refused to save. */
export function setDone(id, done) {
  const list = stored().filter((x) => x !== id);
  if (done) list.push(id);
  const ok = save(list);
  window.dispatchEvent(new CustomEvent('pid1:progress'));
  return ok;
}

/** ONE function for every number on the site: per module, per part, for the course, and what comes next. */
export function progress() {
  const d = courseData();
  const set = {};
  stored().forEach((id) => { set[id] = true; });
  const p = { set, mods: {}, parts: {}, total: 0, done: 0, next: null, pct: 0 };
  d.modules.forEach((m) => {
    let n = 0;
    m.lessons.forEach((id) => {
      if (set[id]) n++;
      else if (!p.next) p.next = id; // the first lesson not done, in course order
    });
    const total = m.lessons.length;
    p.mods[m.n] = { n, total, state: total && n >= total ? 'done' : n > 0 ? 'now' : 'todo' };
    const part = p.parts[m.part] || (p.parts[m.part] = { n: 0, total: 0 });
    part.n += n;
    part.total += total;
    p.done += n;
    p.total += total;
  });
  p.pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return p;
}

/** Small preferences (terminal width). Same rule: wrapped, never fatal. */
export function readPref(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export function writePref(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}

/** The four certificates: one for each part ("p1", "p2", "p3") and one for the whole course ("course"). */
export function certs(p = progress()) {
  const seen = [];
  courseData().modules.forEach((m) => { if (!seen.includes(m.part)) seen.push(m.part); });
  const list = seen.map((n) => {
    const t = p.parts[n] || { n: 0, total: 0 };
    return { id: 'p' + n, part: n, n: t.n, total: t.total, open: t.total > 0 && t.n >= t.total };
  });
  list.push({ id: 'course', part: null, n: p.done, total: p.total, open: p.total > 0 && p.done >= p.total });
  return list;
}

const dateKey = (id) => (id === 'course' ? 'pid1-cert-date' : 'pid1-cert-date-' + id);
/** The day a certificate was first seen as earned in this browser ("2026-11-23"). It is written once. */
export function certDate(id, open) {
  let day = readPref(dateKey(id));
  if (open && (!day || Number.isNaN(Date.parse(day)))) {
    const now = new Date(), two = (n) => String(n).padStart(2, '0');
    day = now.getFullYear() + '-' + two(now.getMonth() + 1) + '-' + two(now.getDate());
    writePref(dateKey(id), day);
  }
  return day;
}
