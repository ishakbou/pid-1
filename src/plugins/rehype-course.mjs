// The rehype plugin that turns plain lesson Markdown into the approved "Workspace" lesson page.
// It runs on every file of src/content/docs and does, in this order:
//   1. parse raw HTML (details, figures, comments) so the whole page is one tree
//   2. remove comments (the lab markers must not reach the page)
//   3. make relative links absolute, so the link checker can check them
//   4. code blocks: commands with their output, files, plain output, mind maps
//   5. details, tables
//   6. lessons only: the nine sections grouped as Learn, Practice, Review, the "In this lesson"
//      block and the section navigator
import path from 'node:path';
import { raw } from 'hast-util-raw';
import { fromHtml } from 'hast-util-from-html';
import { toString } from 'hast-util-to-string';
import { h } from 'hastscript';
import { visit, SKIP } from 'unist-util-visit';
import { find, html as htmlSchema, svg as svgSchema } from 'property-information';
import { createHighlighter, bundledLanguages } from 'shiki';
import { IC } from '../lib/icons.mjs';
import { mindMap, parseMindMap } from '../lib/mindmap.mjs';
import { BASE, DOCS_DIR, STAGES, plural, course, href, sitePages, pendingPaths } from '../lib/course.mjs';

const MDX_NODES = ['mdxFlowExpression', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxTextExpression', 'mdxjsEsm'];
const SHELL = new Set(['bash', 'sh', 'shell', 'console', 'zsh']);
const PLAIN = new Set(['', 'text', 'txt', 'plaintext', 'plain']);
const THEMES = { light: 'github-light-default', dark: 'github-dark-default' };
const LANG_LABEL = {
  python: 'Python', py: 'Python', js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', html: 'HTML', css: 'CSS',
  sql: 'SQL', json: 'JSON', yaml: 'YAML', yml: 'YAML', c: 'C', bash: 'Bash', sh: 'Shell', shell: 'Shell', ini: 'INI', toml: 'TOML',
  diff: 'Diff', http: 'HTTP', dockerfile: 'Dockerfile', markdown: 'Markdown', md: 'Markdown', text: 'Text', txt: 'Text',
  powershell: 'PowerShell', csv: 'CSV', xml: 'XML', jinja: 'Jinja', 'jinja-html': 'Jinja', nginx: 'nginx', java: 'Java', go: 'Go', rust: 'Rust',
};

let highlighterPromise;
const getHighlighter = () => (highlighterPromise ??= createHighlighter({ themes: Object.values(THEMES), langs: [] }));

// ---------- small hast helpers ----------
const isEl = (n, tag) => n && n.type === 'element' && (!tag || n.tagName === tag);
const isWs = (n) => n && n.type === 'text' && !n.value.trim();
const real = (nodes) => nodes.filter((n) => !isWs(n));
const classes = (n) => {
  const c = n.properties?.className;
  return Array.isArray(c) ? c.map(String) : typeof c === 'string' ? c.split(/\s+/) : [];
};
const icon = (name) => structuredClone(fromHtml(IC[name], { fragment: true }).children[0]);
const frag = (htmlText) => fromHtml(htmlText, { fragment: true }).children;
const clone = (n) => structuredClone(n);
const slugOf = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "src/content/docs/linux/index.md" gives "linux/index.md". Null for files outside the docs folder. */
function docRelOf(file) {
  const p = file.path || file.history?.[0];
  if (!p) return null;
  const rel = path.relative(DOCS_DIR, path.resolve(String(p))).split(path.sep).join('/');
  return rel.startsWith('..') ? null : rel;
}
/** "src/content/docs/linux/index.md" gives "linux". Null for files outside the docs folder. */
function docPathOf(file) {
  const rel = docRelOf(file);
  if (rel === null) return null;
  return rel.replace(/\.(md|mdx)$/, '').replace(/(^|\/)index$/, '');
}

/** Every site path a link may point to: pages that exist, planned pages, and the custom pages. */
function knownPaths() {
  const c = course();
  const out = new Set([href(''), ...sitePages.map((p) => href(p.path)), ...pendingPaths()]);
  for (const o of c.order) out.add(o.href);
  return out;
}

// ---------- MDX: plain HTML tags written in an .mdx file become normal elements ----------
function normalizeMdx(tree) {
  const convert = (node, inSvg) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      const isJsx = child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement';
      const tag = isJsx ? child.name : child.type === 'element' ? child.tagName : null;
      const svgHere = inSvg || tag === 'svg';
      if (isJsx && tag && /^[a-z][a-z0-9]*$/.test(tag) && child.attributes.every((a) => a.type === 'mdxJsxAttribute' && (a.value === null || typeof a.value === 'string'))) {
        const properties = {};
        for (const a of child.attributes) {
          const info = find(svgHere ? svgSchema : htmlSchema, a.name);
          properties[info.property] = a.value === null ? true : info.property === 'className' ? a.value.split(/\s+/) : a.value;
        }
        child = { type: 'element', tagName: tag, properties, children: child.children, position: child.position };
      }
      convert(child, svgHere);
      return child;
    });
  };
  convert(tree, false);
}

// ---------- commands: which lines start a new command, and which continue one ----------
export function shellLines(src) {
  const out = [];
  let heredoc = null, cont = false, depth = 0, quote = null;
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (heredoc) {
      out.push({ text: line, kind: 'cont' });
      if (t === heredoc) heredoc = null;
      continue;
    }
    const continues = cont || depth > 0 || quote !== null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) { if (ch === '\\' && quote === '"') i++; else if (ch === quote) quote = null; }
      else if (ch === '\\') i++;
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) break;
    }
    if (quote === null) {
      const hd = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(line);
      if (hd && !line.includes('<<<')) heredoc = hd[2];
      const words = t.split(/[\s;]+/).filter(Boolean);
      if (/^(if|for|while|until|case)$/.test(words[0] || '') || /\{$/.test(t)) depth++;
      for (const w of words) if (/^(fi|done|esac)$/.test(w)) depth--;
      if (words[0] === '}') depth--;
      if (depth < 0) depth = 0;
    }
    cont = quote === null && /(\\|\||&&)$/.test(t);
    out.push({ text: line, kind: continues ? 'cont' : !t ? 'blank' : t.startsWith('#') ? 'note' : 'cmd' });
  }
  return out;
}

// ---------- code blocks ----------
function codeInfo(node) {
  if (!isEl(node, 'pre')) return null;
  const kids = real(node.children);
  if (kids.length !== 1 || !isEl(kids[0], 'code')) return null;
  const code = kids[0];
  const lang = (classes(code).find((c) => c.startsWith('language-')) || '').slice(9).toLowerCase();
  const meta = String(code.properties?.dataMeta ?? code.properties?.metastring ?? code.data?.meta ?? '');
  const title = (/title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta) || []).slice(1).find(Boolean) || '';
  return { lang, title, text: toString(code).replace(/\n$/, '') };
}

const copyBtn = () => h('button', { type: 'button', className: ['tb-btn', 'tb-copy'] }, [icon('copy'), h('span', 'Copy')]);

function terminalBlock(text, output, ctx) {
  const lines = shellLines(text);
  const code = [];
  lines.forEach((l, i) => {
    if (i) code.push({ type: 'text', value: '\n' });
    code.push(h('span', { className: ['line', l.kind] }, l.text));
  });
  const actions = [copyBtn()];
  if (ctx.terminal) actions.push(h('button', { type: 'button', className: ['tb-btn', 'tb-run'] }, [icon('play'), h('span', 'Run')]));
  const block = h('div', { className: ['tblock'] }, [
    h('div', { className: ['tb-head'], dataPagefindIgnore: '' }, [h('span', { className: ['tb-title'] }, [icon('term'), h('span', 'Terminal')]), h('span', { className: ['tb-actions'] }, actions)]),
    h('pre', { className: ['cmd'], tabIndex: 0 }, [h('code', code)]),
  ]);
  if (output !== null) block.children.push(outputPart(output));
  return block;
}
const outputPart = (text) => h('div', { className: ['tb-out'] }, [h('span', { className: ['tb-out-label'], dataPagefindIgnore: '' }, 'Output'), h('pre', { className: ['out'], tabIndex: 0 }, [h('code', text)])]);

function fileBlock(info, highlighted) {
  const pre = highlighted || h('pre', { className: ['code', 'plain-code'], tabIndex: 0 }, [h('code', info.text)]);
  pre.properties.tabIndex = 0;
  const label = info.title || LANG_LABEL[info.lang] || info.lang || 'Text';
  return h('figure', { className: ['fblock', info.title ? 'is-file' : 'is-snippet'] }, [
    h('figcaption', { className: ['fb-head'] }, [
      h('span', { className: ['fb-title'] }, [icon(info.title ? 'file' : 'rows'), h('span', label)]),
      h('span', { className: ['tb-actions'], dataPagefindIgnore: '' }, [copyBtn()]),
    ]),
    pre,
  ]);
}

async function transformCode(tree, ctx) {
  // First pass: find the blocks that need highlighting, and highlight them (async).
  const jobs = [];
  visit(tree, (node) => {
    const info = codeInfo(node);
    if (!info) return;
    if (info.lang === 'mindmap' || info.lang === 'output') return SKIP;
    if (SHELL.has(info.lang) && !info.title) return SKIP;
    if (PLAIN.has(info.lang)) return SKIP;
    jobs.push({ node, info });
    return SKIP;
  });
  const highlighted = new Map();
  if (jobs.length) {
    const hl = await getHighlighter();
    for (const { node, info } of jobs) {
      const lang = info.lang in bundledLanguages ? info.lang : null;
      if (!lang) continue;
      if (!hl.getLoadedLanguages().includes(lang)) await hl.loadLanguage(lang);
      const root = hl.codeToHast(info.text, { lang, themes: THEMES, defaultColor: false });
      const pre = root.children.find((c) => isEl(c, 'pre'));
      if (pre) { pre.properties.className = ['code', ...classes(pre)]; highlighted.set(node, pre); }
    }
  }

  // Second pass: rebuild the children of every parent.
  const rebuild = (parent) => {
    const kids = parent.children, out = [];
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      const info = codeInfo(k);
      if (!info) {
        if (k.children) rebuild(k);
        out.push(k);
        continue;
      }
      if (info.lang === 'mindmap') {
        const map = parseMindMap(info.text);
        if (map) out.push(...frag(mindMap(map)));
        continue;
      }
      if (SHELL.has(info.lang) && !info.title) {
        let j = i + 1;
        while (j < kids.length && isWs(kids[j])) j++;
        const next = j < kids.length ? codeInfo(kids[j]) : null;
        let output = null;
        if (next && next.lang === 'output') { output = next.text; i = j; }
        out.push(terminalBlock(info.text, output, ctx));
        continue;
      }
      if (info.lang === 'output') {
        const prev = real(out).at(-1);
        const attached = isEl(prev, 'figure') && classes(prev).includes('fblock');
        if (attached) prev.properties.className = [...classes(prev), 'has-output'];
        out.push(h('div', { className: ['oblock', ...(attached ? ['attached'] : [])] }, [outputPart(info.text)]));
        continue;
      }
      if (PLAIN.has(info.lang) && !info.title) {
        out.push(h('pre', { className: ['plain'], tabIndex: 0 }, [h('code', info.text)]));
        continue;
      }
      out.push(fileBlock(info, highlighted.get(k)));
    }
    parent.children = out;
  };
  rebuild(tree);
}

// ---------- lesson sections ----------
function liParts(li) {
  let kids = real(li.children);
  if (kids.length === 1 && isEl(kids[0], 'p')) kids = kids[0].children.slice();
  while (kids.length && isWs(kids[0])) kids.shift();
  return kids;
}
const trimStart = (nodes) => {
  const out = nodes.map(clone);
  while (out.length && isWs(out[0])) out.shift();
  if (out[0]?.type === 'text') out[0].value = out[0].value.replace(/^\s+/, '');
  return out;
};
const capFirst = (nodes) => {
  if (nodes[0]?.type === 'text') nodes[0].value = nodes[0].value.replace(/^[a-z]/, (c) => c.toUpperCase());
  return nodes;
};
const firstList = (nodes, tag) => nodes.find((n) => isEl(n, tag));

function buildKeyTerms(body) {
  const ul = firstList(body, 'ul');
  if (!ul) return null;
  const rows = [];
  for (const li of ul.children.filter((c) => isEl(c, 'li'))) {
    const kids = liParts(li);
    if (!isEl(kids[0], 'strong')) return null;
    const rest = kids.slice(1);
    const at = rest.findIndex((n) => n.type === 'text' && n.value.includes(': '));
    if (at === -1) return null;
    const cut = rest[at].value.indexOf(': ');
    const extra = [...rest.slice(0, at).map(clone), { type: 'text', value: rest[at].value.slice(0, cut) }];
    const def = capFirst([{ type: 'text', value: rest[at].value.slice(cut + 2) }, ...rest.slice(at + 1).map(clone)]);
    const hasExtra = toString({ type: 'root', children: extra }).trim() !== '';
    rows.push(h('div', [h('dt', [...kids[0].children, ...(hasExtra ? [h('span', { className: ['t-extra'] }, trimStart(extra))] : [])]), h('dd', def)]));
  }
  if (!rows.length) return null;
  const i = body.indexOf(ul);
  return { nodes: [...body.slice(0, i), h('dl', { className: ['terms'] }, rows), ...body.slice(i + 1)], meta: plural(rows.length, 'term') };
}

function buildMistakes(body) {
  const ul = firstList(body, 'ul');
  if (!ul) return null;
  const rows = [];
  for (const li of ul.children.filter((c) => isEl(c, 'li'))) {
    const kids = liParts(li);
    if (!isEl(kids[0], 'strong')) return null;
    const strong = clone(kids[0]);
    const last = strong.children.at(-1);
    if (last?.type === 'text') last.value = last.value.replace(/\.$/, '');
    rows.push(h('li', [h('p', { className: ['fx-m'] }, [strong]), h('p', { className: ['fx-f'] }, trimStart(kids.slice(1)))]));
  }
  if (!rows.length) return null;
  const i = body.indexOf(ul);
  return {
    nodes: [...body.slice(0, i), h('div', { className: ['fix-head'], ariaHidden: 'true' }, [h('span', 'The mistake'), h('span', 'What to do')]), h('ul', { className: ['fixes'] }, rows), ...body.slice(i + 1)],
    meta: plural(rows.length, 'mistake'),
  };
}

function buildResources(body) {
  const ul = firstList(body, 'ul');
  if (!ul) return null;
  const rows = [];
  for (const li of ul.children.filter((c) => isEl(c, 'li'))) {
    const kids = liParts(li);
    const a = kids[0];
    if (!isEl(a, 'a') || typeof a.properties?.href !== 'string') return null;
    let host = '';
    try { host = new URL(a.properties.href).hostname.replace(/^www\./, ''); } catch { return null; }
    const rest = trimStart(kids.slice(1));
    if (rest[0]?.type === 'text') rest[0].value = rest[0].value.replace(/^:?\s*/, '');
    const link = clone(a);
    link.children.push(icon('ext'));
    rows.push(h('li', [link, h('span', { className: ['r-site'] }, host), h('p', capFirst(rest))]));
  }
  if (!rows.length) return null;
  const i = body.indexOf(ul);
  return { nodes: [...body.slice(0, i), h('ul', { className: ['resources'] }, rows), ...body.slice(i + 1)], meta: plural(rows.length, 'resource') };
}

function buildQuiz(body) {
  const out = [], items = [];
  let list = null;
  const nodes = real(body);
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i], d = nodes[i + 1];
    const strong = isEl(p, 'p') && real(p.children).length === 1 && isEl(real(p.children)[0], 'strong') ? real(p.children)[0] : null;
    if (strong && isEl(d, 'details') && /^\s*\d+\.\s/.test(toString(strong))) {
      const q = strong.children.map(clone);
      if (q[0]?.type === 'text') q[0].value = q[0].value.replace(/^\s*\d+\.\s+/, '');
      if (!list) { list = h('ol', { className: ['quiz'] }, []); out.push(list); }
      list.children.push(h('li', [h('p', { className: ['q'] }, q), d]));
      items.push(1);
      i++;
    } else out.push(p);
  }
  return items.length ? { nodes: out, meta: plural(items.length, 'question') } : null;
}

function buildTryIt(body, ctx) {
  const steps = [];
  let current = null;
  const mark = (node) => visit(node, 'element', (n) => { if (classes(n).includes('tblock')) n.properties.dataStep = String(current); });
  const out = body.map((node) => {
    if (isEl(node, 'h3')) {
      const m = /^\s*(\d+)\.\s+/.exec(toString(node));
      if (m) {
        current = Number(m[1]);
        const title = node.children.map(clone);
        if (title[0]?.type === 'text') title[0].value = title[0].value.replace(/^\s*\d+\.\s+/, '');
        steps.push({ n: current, title });
        return h('h3', { id: `step-${current}` }, [h('span', { className: ['step-k'], dataPagefindIgnore: '' }, `Step ${current}`), ...title.map(clone)]);
      }
      current = null;
    } else if (current !== null) mark(node);
    return node;
  });
  if (ctx.terminal) {
    out.unshift(h('div', { className: ['practice-note'] }, [
      h('div', [
        h('p', [h('strong', 'You can do this part in the practice terminal.'), ' Start it once, then press ', h('span', { className: ['kbd-like'] }, 'Run'), ' on a command and it runs there. You can also type there yourself.']),
        h('p', { className: ['pn-small'] }, 'It is a small real Linux (Alpine Linux with BusyBox) running in your browser, not Ubuntu, so a few outputs look a little different from the lesson.'),
      ]),
      h('button', { type: 'button', className: ['btn'], dataTermOpen: '' }, [icon('term'), h('span', 'Open the terminal')]),
    ]));
  }
  return { nodes: out, meta: steps.length ? plural(steps.length, 'step') : '', steps };
}

function buildExercise(body, ctx) {
  const firstDetails = body.findIndex((n) => isEl(n, 'details'));
  const before = firstDetails === -1 ? body : body.slice(0, firstDetails);
  const ol = firstList(before, 'ol');
  const n = ol ? ol.children.filter((c) => isEl(c, 'li')).length : 0;
  return {
    nodes: [h('div', { className: ['task'] }, [
      h('div', { className: ['task-head'] }, [h('span', 'Task'), h('span', ctx.terminal ? 'Do it in the terminal' : 'Try it alone first')]),
      h('div', { className: ['task-body'] }, body),
    ])],
    meta: n ? plural(n, 'step') : '',
  };
}

const BUILDERS = {
  'try-it': buildTryIt,
  exercise: buildExercise,
  'check-yourself': (b) => buildQuiz(b),
  'key-terms': (b) => buildKeyTerms(b),
  'common-mistakes': (b) => buildMistakes(b),
  'go-further': (b) => buildResources(b),
};

function buildLesson(children, ctx) {
  // Split the page at every h2.
  const intro = [], sections = [];
  for (const node of children) {
    if (isEl(node, 'h2')) sections.push({ h2: node, id: slugOf(toString(node)), body: [] });
    else if (sections.length) sections.at(-1).body.push(node);
    else intro.push(node);
  }
  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));
  const known = new Map();
  let no = 0;
  STAGES.forEach((st, si) => st.items.forEach(([id]) => known.set(id, { stage: si, no: ++no })));

  // Every section gets a stage: its own, or the stage of the section before it.
  let stage = 0;
  for (const s of sections) {
    const k = known.get(s.id);
    if (k) { stage = k.stage; s.no = k.no; }
    else if (s.id === 'lesson-map') stage = 2;
    s.stage = stage;
    const built = BUILDERS[s.id]?.(s.body, ctx) || null;
    s.nodes = built ? built.nodes : s.body;
    s.meta = built?.meta || '';
    if (built?.steps) ctx.steps = built.steps;
  }

  const sectionEl = (s) => {
    s.h2.properties = { ...s.h2.properties, id: s.id };
    if (s.no) s.h2.children.unshift(h('span', { className: ['sec-no'], dataPagefindIgnore: '' }, String(s.no)));
    return h('section', { className: ['lsec', `sec-${s.id}`], ariaLabelledBy: s.id }, [
      h('header', { className: ['lsec-head'] }, [s.h2, ...(s.meta ? [h('span', { className: ['lsec-meta'] }, s.meta)] : [])]),
      ...s.nodes,
    ]);
  };

  const stages = STAGES.map((st, si) => {
    const mine = sections.filter((s) => s.stage === si);
    if (!mine.length) return null;
    return h('div', { className: ['stage'], role: 'group', ariaLabelledBy: `stage-${si + 1}` }, [
      h('p', { className: ['stage-label'], id: `stage-${si + 1}` }, [h('span', `Stage ${si + 1} of 3`), st.name]),
      ...mine.map(sectionEl),
    ]);
  }).filter(Boolean);

  // "In this lesson": the goals and the steps
  const goalList = byId.goal ? firstList(byId.goal.body, 'ul') : null;
  const goals = goalList ? goalList.children.filter((c) => isEl(c, 'li')).map((li) => h('li', [icon('check'), h('span', liParts(li).map(clone))])) : [];
  const steps = ctx.steps || [];
  const cols = [];
  if (goals.length) cols.push(h('div', [h('h3', { id: 'inthis-goals' }, 'You will be able to'), h('ul', { className: ['goals'] }, goals)]));
  if (steps.length) {
    cols.push(h('div', [
      h('h3', { id: 'inthis-steps' }, ctx.terminal
        ? ['Steps to run', h('span', { className: ['steps-count'], id: 'steps-count', ariaLive: 'polite' }, `0 of ${plural(steps.length, 'step')} run`)]
        : ['Steps', h('span', { className: ['steps-count'] }, plural(steps.length, 'step'))]),
      h('ol', { className: ['steplist', ...(ctx.terminal ? [] : ['plain'])] }, steps.map((s) => h('li', { dataStep: String(s.n) }, [
        ...(ctx.terminal ? [h('span', { className: ['tick'], ariaHidden: 'true' }, [icon('check')])] : [h('span', { className: ['num'], ariaHidden: 'true' }, String(s.n))]),
        h('a', { href: `#step-${s.n}` }, [h('span', { className: ['visually-hidden'] }, `Step ${s.n}: `), ...s.title.map(clone)]),
        ...(ctx.terminal ? [h('span', { className: ['visually-hidden'], dataRunText: '' })] : []),
      ]))),
    ]));
  }
  const inthis = cols.length
    ? h('section', { className: ['inthis'], ariaLabelledBy: 'inthis-h', dataPagefindIgnore: '' }, [h('h2', { id: 'inthis-h' }, 'In this lesson'), h('div', { className: ['inthis-grid', ...(cols.length === 1 ? ['one'] : [])] }, cols)])
    : null;

  // Section navigator
  const groups = STAGES.map((st, si) => {
    const mine = sections.filter((s) => s.stage === si);
    if (!mine.length) return null;
    return h('div', { className: ['sn-group'] }, [
      h('span', { className: ['sn-stage'] }, st.name),
      ...mine.map((s) => h('a', { href: `#${s.id}` }, [...(s.no ? [h('span', { className: ['sn-no'] }, String(s.no))] : []), s.id === 'lesson-map' ? 'Map' : toString({ type: 'root', children: s.h2.children.filter((c) => !classes(c).includes('sec-no')) })])),
    ]);
  }).filter(Boolean);
  const secnav = groups.length ? h('nav', { className: ['secnav'], ariaLabel: 'Sections of this lesson', dataPagefindIgnore: '' }, groups) : null;

  return [
    ...(inthis ? [inthis] : []),
    ...(secnav ? [secnav] : []),
    h('div', { className: ['prose'] }, [h('div', { className: ['intro'] }, intro), ...stages]),
  ];
}

// ---------- the plugin ----------
export default function rehypeCourse() {
  return async function transformer(tree, file) {
    const docPath = docPathOf(file);
    if (docPath === null) return;
    const fm = file.data?.astro?.frontmatter || {};
    const isMdx = /\.mdx$/.test(String(file.path || file.history?.[0] || ''));
    const ctx = { terminal: fm.practiceTerminal === true, isLesson: fm.lesson !== undefined && fm.lesson !== null, steps: null };

    // Keep the "title=..." of a code block: raw HTML parsing drops node.data
    visit(tree, 'element', (node) => {
      if (node.tagName === 'code' && node.data?.meta) node.properties = { ...node.properties, dataMeta: String(node.data.meta) };
    });

    if (isMdx) normalizeMdx(tree);
    else tree = raw(tree, { file, passThrough: MDX_NODES });

    // Comments never reach the page. In MDX a comment is an expression: {/* lab: skip */}
    const strip = (node) => {
      if (!node.children) return;
      node.children = node.children.filter((c) => c.type !== 'comment' && !((c.type === 'mdxFlowExpression' || c.type === 'mdxTextExpression') && /^\s*\/\*[\s\S]*\*\/\s*$/.test(c.value || '')));
      node.children.forEach(strip);
    };
    strip(tree);

    // Relative links become absolute paths under the base.
    // The content guide writes them relative to the Markdown file ("../linux/files-and-navigation/"
    // from any file of a module folder), so they are resolved from the folder of the file.
    // If that gives no known page but resolving from the page URL does, the page URL wins.
    const fileDir = path.posix.dirname(docRelOf(file) || '');
    const fileUrl = `https://x${BASE}/${fileDir && fileDir !== '.' ? fileDir + '/' : ''}`;
    const pageUrl = `https://x${BASE}/${docPath ? docPath + '/' : ''}`;
    const known = knownPaths();
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const to = node.properties?.href;
      if (typeof to !== 'string' || !to || /^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(to)) return;
      try {
        let u = new URL(to, fileUrl);
        if (!known.has(u.pathname)) {
          const alt = new URL(to, pageUrl);
          if (known.has(alt.pathname)) u = alt;
        }
        node.properties.href = u.pathname + u.search + u.hash;
      } catch { /* leave it */ }
    });

    await transformCode(tree, ctx);

    // details: a chevron in front of the summary. Tables: a wrapper that can scroll sideways.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'summary' && !node.children.some((c) => classes(c).includes('ic'))) {
        node.children = [icon('right'), h('span', node.children)];
        return SKIP;
      }
      if (node.tagName === 'table' && parent && !classes(parent).includes('table-wrap')) {
        parent.children[index] = h('div', { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Table' }, [node]);
        return SKIP;
      }
    });

    // Layout: lessons get their sections, every other page is plain prose
    const esm = tree.children.filter((c) => c.type === 'mdxjsEsm');
    const body = tree.children.filter((c) => c.type !== 'mdxjsEsm');
    tree.children = [...esm, ...(ctx.isLesson ? buildLesson(body, ctx) : [h('div', { className: ['prose', 'page-prose', ...(fm.cheatSheet ? ['cheat'] : [])] }, body)])];
    return tree;
  };
}
