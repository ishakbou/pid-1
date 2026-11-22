// Checks every external link of the site.   Run:  node scripts/check-links.mjs
// It reads the lessons, the pages and the README, collects every http(s) link, and asks each one once.
// Internal links are checked by starlight-links-validator during `npm run build`.
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const sources = ['src/content/docs', 'src/pages', 'src/components', 'src/lib', 'README.md', 'CONTRIBUTING.md'];
const found = new Map(); // url -> first file

function read(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) return fs.readdirSync(p).forEach((n) => read(path.join(p, n)));
  if (!/\.(mdx?|astro|mjs|js)$/.test(p)) return;
  const rel = path.relative(root, p).replace(/\\/g, '/');
  const isDoc = /\.mdx?$/.test(p);
  let s = fs.readFileSync(p, 'utf8');
  if (isDoc) {
    // In lessons, only real links count: [text](url) and <a href="url">, outside code blocks.
    s = s.replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1[ \t]*$/gm, '').replace(/<!--[\s\S]*?-->/g, '').replace(/`[^`\n]*`/g, '');
    for (const m of s.matchAll(/\]\((https?:\/\/[^)\s]+)\)|href="(https?:\/\/[^"]+)"|<(https?:\/\/[^>\s]+)>/g)) add(m[1] || m[2] || m[3], rel);
  } else {
    for (const m of s.matchAll(/href=["'`](https?:\/\/[^"'`\s$]+)["'`]/g)) add(m[1], rel);
  }
}
function add(url, rel) {
  url = url.replace(/[.,;]+$/, '');
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|example\.(com|org|net)|[^/]*\.example|[^/]*\.test)([:/]|$)/.test(url)) return;
  if (!found.has(url)) found.set(url, rel);
}

async function ask(url) {
  const opts = { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'Mozilla/5.0 (link check)', accept: 'text/html,*/*' } };
  try {
    let r = await fetch(url, { ...opts, method: 'GET' });
    await r.body?.cancel();
    return r.status;
  } catch (e) {
    return 'no answer (' + (e.cause?.code || e.name) + ')';
  }
}

sources.forEach((s) => { const p = path.join(root, s); if (fs.existsSync(p)) read(p); });
const urls = [...found.keys()].sort();
console.log(urls.length + ' external links.');
const bad = [];
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < urls.length) {
    const url = urls[i++];
    let st = await ask(url);
    if (st !== 200) st = await ask(url); // one more try
    if (st !== 200) bad.push(`${st}  ${url}  (${found.get(url)})`);
  }
}));
if (bad.length) { console.log(`\n${bad.length} to look at:\n` + bad.sort().join('\n')); process.exitCode = 2; } else console.log('All answered 200.');
