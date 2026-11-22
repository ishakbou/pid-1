// Content check. Reads every page in src/content/docs and reports breaks of the lesson format
// and of the writing rules.   Run:  node scripts/check-content.mjs [module-folder ...]
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', 'src', 'content', 'docs');
const only = process.argv.slice(2);

const BANNED = ['delve', 'dive in', 'deep dive', 'unlock', 'unleash', 'supercharge', 'journey', "in today's digital world",
  "in today's landscape", 'seamless', 'robust', 'game-changer', 'game changer', "it's important to note", 'embark',
  'harness the power', 'revolutionize'];
const SECTIONS = ['Goal', 'Why it matters', 'The idea', 'Try it', 'Exercise', 'Check yourself', 'Common mistakes', 'Key terms', 'Go further'];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

const problems = [];
const stats = { pages: 0, lessons: 0, overviews: 0, cheats: 0, words: 0 };
const say = (file, msg) => problems.push(`${file}: ${msg}`);

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.mdx?$/.test(e.name)) check(p);
  }
}

function check(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (only.length && !only.some((m) => rel.startsWith(m + '/'))) return;
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  stats.pages++;
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!fm) return say(rel, 'no frontmatter');
  const head = fm[1];
  const body = raw.slice(fm[0].length);
  if (!/^title:\s*\S/m.test(head)) say(rel, 'no title');
  if (!/^description:\s*\S/m.test(head)) say(rel, 'no description');

  // Prose only: code blocks, inline code and HTML comments are not prose.
  // A fence closes only with a line of the same character, at least as long as the opening one,
  // so a Markdown file shown inside a longer fence stays code.
  let fence = null;
  const kept = [];
  for (const line of body.split('\n')) {
    const m = /^[ \t]*(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && !m[2].trim()) fence = null;
      continue;
    }
    if (m) { fence = m[1]; continue; }
    kept.push(line);
  }
  const text = kept.join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const prose = text.replace(/`[^`\n]*`/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const lower = prose.toLowerCase();
  for (const b of BANNED) {
    const re = new RegExp('(^|[^a-z])' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z])', 'i');
    const m = re.exec(lower);
    if (m) say(rel, `banned phrase "${b}": ...${lower.slice(Math.max(0, m.index - 30), m.index + b.length + 30).replace(/\n/g, ' ')}...`);
  }
  if (EMOJI.test(raw)) say(rel, 'emoji or symbol character: ' + JSON.stringify(EMOJI.exec(raw)[0]));
  const bangs = (prose.match(/[a-z]!(\s|$)/gi) || []).length;
  if (bangs > 2) say(rel, `${bangs} exclamation marks`);
  if (/github\.com\/ishakbou/i.test(body) && rel !== 'start-here/three-ways-to-practice.md' && rel !== 'start-here/three-ways-to-practice.mdx') say(rel, 'links to the author\'s GitHub');
  const asides = (body.match(/^:::(note|tip|caution|danger)/gm) || []).length;
  if (asides > 2) say(rel, `${asides} asides (2 at most)`);
  // only drawings on the page: an SVG inside a code block or a hidden lab comment is not shown
  for (const m of text.matchAll(/<svg\b[^>]*>/g)) {
    const end = text.indexOf('</svg>', m.index);
    const svg = text.slice(m.index, end);
    if (!/role="img"/.test(m[0]) || !/<title[ >]/.test(svg)) say(rel, 'an SVG without role="img" and <title>');
  }
  for (const m of prose.matchAll(/!\[([^\]]*)\]\(/g)) if (!m[1].trim()) say(rel, 'an image without alt text');

  const isIndex = /(^|\/)index\.mdx?$/.test(rel);
  const isCheat = /cheatSheet:\s*true/.test(head);
  const isLesson = /^lesson:/m.test(head);
  if (isCheat) stats.cheats++;
  else if (isLesson) {
    stats.lessons++;
    if (!/^time:\s*\d+ min/m.test(head)) say(rel, 'no "time: N min"');
    const found = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    const order = found.filter((h) => SECTIONS.includes(h));
    for (const s of SECTIONS) if (!found.includes(s)) say(rel, `section missing: ${s}`);
    if (order.join('|') !== SECTIONS.filter((s) => order.includes(s)).join('|')) say(rel, 'sections out of order: ' + order.join(', '));
    const extra = found.filter((h) => !SECTIONS.includes(h) && h !== 'Lesson map');
    if (extra.length) say(rel, 'unexpected sections: ' + extra.join(', '));
    const words = prose.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    stats.words += words;
    if (words < 1100 || words > 2400) say(rel, `${words} words of prose (guide: 1,300 to 1,900)`);
    const quiz = (body.match(/<summary>Answer<\/summary>/g) || []).length;
    if (quiz < 3 || quiz > 5) say(rel, `${quiz} quiz questions (3 to 5)`);
    if (!/<summary>Show the solution<\/summary>/.test(body)) say(rel, 'no exercise solution block');
  } else if (isIndex && /^module:/m.test(head)) {
    stats.overviews++;
    if (!/```mindmap/.test(body)) say(rel, 'module overview without a mind map');
  }
}

walk(root);
console.log(`${stats.pages} pages: ${stats.lessons} lessons, ${stats.overviews} module overviews, ${stats.cheats} cheat sheets. About ${Math.round(stats.words / 1000)}k words of lesson prose.`);
if (problems.length) { console.log(`\n${problems.length} problem(s):\n` + problems.join('\n')); process.exitCode = 2; } else console.log('No problems found.');
