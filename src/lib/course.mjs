// One place for the course structure. The curriculum (phase0/curriculum.mjs) gives the order,
// the numbers and the titles. The files in src/content/docs say which pages exist right now.
// Used by astro.config.mjs, the markdown plugins and the components.
import fs from 'node:fs';
import path from 'node:path';
import { parts as rawParts, moduleAbout, lessonSlug } from '../../phase0/curriculum.mjs';
import { site as rawSite } from '../../phase0/site.config.mjs';

export const BASE = '/pid-1';
export const SITE_URL = 'https://ishakbou.github.io';
export const DOCS_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

export const site = {
  ...rawSite,
  telegramUrl: `https://t.me/${rawSite.telegram}`,
  url: `${SITE_URL}${BASE}/`,
};

/** A link inside the site, always with the base and a trailing slash. */
export const href = (p = '') => {
  const clean = String(p).replace(/^\/+|\/+$/g, '');
  return clean ? `${BASE}/${clean}/` : `${BASE}/`;
};

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** The planning estimate used on the Home page: 15 minutes per lesson. */
export const mins = (n) => {
  const m = n * 15, h = Math.floor(m / 60), r = m % 60;
  return (h ? h + ' h' : '') + (h && r ? ' ' : '') + (r ? r + ' min' : '');
};
export const about = (n) => 'about ' + mins(n);
/** "Project step: start mylab" becomes "Start mylab". "mylab" is a name and stays in lower case. */
export const stepTitle = (t) => {
  const s = t.replace(/^Project step: /, '');
  return s.startsWith('mylab') ? s : s.charAt(0).toUpperCase() + s.slice(1);
};

const pageExists = (p) => fs.existsSync(path.join(DOCS_DIR, p + '.md')) || fs.existsSync(path.join(DOCS_DIR, p + '.mdx'));

/** The whole course, with what exists on disk at the moment of the call. */
export function course() {
  const parts = rawParts.map((p) => ({
    n: p.n,
    title: p.title,
    modules: p.modules.map((m) => {
      const lessons = m.lessons.map((l, i) => {
        const slug = lessonSlug(l);
        const p2 = `${m.slug}/${slug}`;
        return {
          id: `${m.n}.${i + 1}`,
          index: i,
          title: l.title,
          shortTitle: stepTitle(l.title),
          summary: l.summary,
          project: !!l.project,
          slug,
          path: p2,
          href: href(p2),
          exists: pageExists(p2),
          module: m.n,
        };
      });
      return {
        n: m.n,
        title: m.title,
        slug: m.slug,
        about: moduleAbout[m.n] || '',
        cheatSheet: m.cheatSheet || '',
        part: p.n,
        partTitle: p.title,
        path: m.slug,
        href: href(m.slug),
        hasOverview: pageExists(`${m.slug}/index`),
        cheatPath: `${m.slug}/cheat-sheet`,
        cheatHref: href(`${m.slug}/cheat-sheet`),
        hasCheat: pageExists(`${m.slug}/cheat-sheet`),
        time: about(m.lessons.length),
        lessons,
      };
    }),
  }));
  const modules = parts.flatMap((p) => p.modules);
  const lessons = modules.flatMap((m) => m.lessons);

  // Every page that exists, in reading order: overview, lessons, cheat sheet, module after module.
  const order = [];
  for (const m of modules) {
    if (m.hasOverview) order.push({ kind: 'overview', path: m.path, href: m.href, label: `Module ${m.n}`, title: m.title, summary: m.about, module: m });
    for (const l of m.lessons) if (l.exists) order.push({ kind: 'lesson', path: l.path, href: l.href, label: l.id, title: l.title, summary: l.summary, module: m, lesson: l });
    if (m.hasCheat) order.push({ kind: 'cheat', path: m.cheatPath, href: m.cheatHref, label: `Module ${m.n}`, title: `Cheat sheet: ${m.cheatSheet}`, summary: 'One printable page for this module.', module: m });
  }

  return {
    parts,
    modules,
    lessons,
    order,
    counts: { modules: modules.length, lessons: lessons.length, written: lessons.filter((l) => l.exists).length },
    /** What a docs path is: { kind, module, lesson, prev, next } or null for pages outside the modules. */
    find(docPath) {
      const clean = String(docPath).replace(/^\/+|\/+$/g, '').replace(/\/index$/, '');
      const i = order.findIndex((o) => o.path === clean);
      if (i === -1) {
        // A page of a module that the curriculum does not list (should not happen): still give the module.
        const m = modules.find((x) => clean === x.slug || clean.startsWith(x.slug + '/'));
        return m ? { kind: 'extra', module: m, lesson: null, prev: null, next: null } : null;
      }
      return { ...order[i], prev: order[i - 1] || null, next: order[i + 1] || null };
    },
  };
}

/** Curriculum pages that are planned but not written yet, as site paths ("/pid-1/git/"). */
export function pendingPaths() {
  const c = course();
  const out = new Set();
  for (const m of c.modules) {
    if (!m.hasOverview) out.add(m.href);
    if (!m.hasCheat) out.add(m.cheatHref);
    for (const l of m.lessons) if (!l.exists) out.add(l.href);
  }
  return out;
}

/** The pages of the site that are not lessons. */
export const sitePages = [
  { path: 'roadmap', title: 'Roadmap' },
  { path: 'glossary', title: 'Glossary' },
  { path: 'certificate', title: 'Certificate' },
  { path: 'about', title: 'About' },
  { path: 'license', title: 'License' },
];

/** The nine parts of every lesson, in three stages. */
export const STAGES = [
  { name: 'Learn', items: [['goal', 'Goal', 'What you can do after the lesson.'], ['why-it-matters', 'Why it matters', 'A real reason to care about it.'], ['the-idea', 'The idea', 'A plain explanation with one example.']] },
  { name: 'Practice', items: [['try-it', 'Try it', 'Commands to type, with their real output.'], ['exercise', 'Exercise', 'A task to do alone. The solution is hidden.'], ['check-yourself', 'Check yourself', 'Three to five questions. The answers are hidden.']] },
  { name: 'Review', items: [['common-mistakes', 'Common mistakes', 'What usually goes wrong, and how to fix it.'], ['key-terms', 'Key terms', 'Short definitions of the words used.'], ['go-further', 'Go further', 'Two or three free, trusted resources.']] },
];

/** Starlight sidebar config: Part > Module > pages that exist. */
export function starlightSidebar() {
  const c = course();
  return c.parts.map((p) => ({
    label: `Part ${p.n}: ${p.title}`,
    items: p.modules
      .map((m) => {
        const items = [];
        if (m.hasOverview) items.push({ label: 'Overview', link: `/${m.path}/` });
        for (const l of m.lessons) if (l.exists) items.push({ label: `${l.id} ${l.shortTitle}`, link: `/${l.path}/` });
        if (m.hasCheat) items.push({ label: 'Cheat sheet', link: `/${m.cheatPath}/` });
        return items.length ? { label: `Module ${m.n}: ${m.title}`, collapsed: true, items } : null;
      })
      .filter(Boolean),
  })).filter((g) => g.items.length);
}
