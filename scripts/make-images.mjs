// Makes the favicon and the social preview image, in the "Boot" design.
// Run:  npm run images      Output: public/favicon.svg, favicon-32.png, apple-touch-icon.png, og.png
// The text is turned into outlines with the real font files (Red Hat Display, Text and Mono),
// so the pictures do not depend on the fonts installed on this computer.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { site } from '../phase0/site.config.mjs';
import { counts } from '../phase0/curriculum.mjs';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'public');
fs.mkdirSync(out, { recursive: true });

const load = (pkg, weight) => {
  const b = fs.readFileSync(path.join(root, 'node_modules', '@fontsource', pkg, 'files', `${pkg}-latin-${weight}-normal.woff`));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const F = {
  d900: load('red-hat-display', 900),
  d700: load('red-hat-display', 700),
  t400: load('red-hat-text', 400),
  t500: load('red-hat-text', 500),
  m400: load('red-hat-mono', 400),
  m700: load('red-hat-mono', 700),
};
const n = (v, s) => {
  if (!Number.isFinite(v)) throw new Error(`bad glyph coordinate in "${s}"`);
  return +v.toFixed(2);
};
/** The path data is written here, not with toPathData(): opentype.js 2.0 can write "MNaN" there. */
const pathData = (p, s) => p.commands.map((c) => {
  if (c.type === 'Z') return 'Z';
  if (c.type === 'Q') return `Q${n(c.x1, s)} ${n(c.y1, s)} ${n(c.x, s)} ${n(c.y, s)}`;
  if (c.type === 'C') return `C${n(c.x1, s)} ${n(c.y1, s)} ${n(c.x2, s)} ${n(c.y2, s)} ${n(c.x, s)} ${n(c.y, s)}`;
  return `${c.type}${n(c.x, s)} ${n(c.y, s)}`;
}).join('');
/** Text as an SVG path. Returns the path and the x where the text ends. */
function text(font, s, x, y, size, fill, spacing = 0) {
  const opts = { letterSpacing: spacing / size };
  return { svg: `<path d="${pathData(font.getPath(s, x, y, size, opts), s)}" fill="${fill}"/>`, end: x + font.getAdvanceWidth(s, size, opts) };
}
/** One glyph centred in a box. */
function centred(font, s, cx, cy, size, fill) {
  const b = font.getPath(s, 0, 0, size).getBoundingBox();
  const p = font.getPath(s, cx - (b.x1 + b.x2) / 2, cy - (b.y1 + b.y2) / 2, size);
  return `<path d="${pathData(p, s)}" fill="${fill}"/>`;
}

const C = {
  bg: '#12161F', line: '#2F394B', text: '#F4F6FA', text2: '#B4BECF', text3: '#8A96AB',
  term: '#0B0E14', termLine: '#1E2533', termText: '#D7DEEA', termDim: '#8794AA', ok: '#58D68D',
  p1: '#4CCDC0', p2: '#F58FA5', p3: '#8DC5F4', b1: '#33BDB0', b2: '#EF6F8B', b3: '#6CB2EE',
};

// ---------- favicon: the brand mark, a dark square with the "1" and the three part colours ----------
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="7" fill="${C.bg}"/>
${centred(F.m700, '1', 16, 13.6, 21, C.text)}
<rect x="7" y="24" width="5.4" height="2.4" fill="${C.b1}"/><rect x="13.3" y="24" width="5.4" height="2.4" fill="${C.b2}"/><rect x="19.6" y="24" width="5.4" height="2.4" fill="${C.b3}"/>
</svg>
`;
fs.writeFileSync(path.join(out, 'favicon.svg'), favicon);
await sharp(Buffer.from(favicon), { density: 300 }).resize(32, 32).png().toFile(path.join(out, 'favicon-32.png'));
await sharp(Buffer.from(favicon), { density: 600 }).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));

// ---------- social preview: 1200 x 630 ----------
const c = counts();
const parts = [];
const add = (...a) => { const t = text(...a); parts.push(t.svg); return t.end; };

// Left: the name, what it is, three facts
parts.push(`<rect x="80" y="70" width="44" height="44" rx="10" fill="${C.text}"/>`, centred(F.m700, '1', 102, 92, 28, C.bg));
add(F.d900, site.course, 138, 104, 34, C.text, -0.6);
add(F.d900, site.course, 72, 318, 196, C.text, -8);
add(F.d700, site.tagline, 80, 378, 38, C.text, -0.4);
add(F.t400, 'A free course, from your first terminal', 80, 432, 26, C.text2);
add(F.t400, 'command to a finished portfolio project.', 80, 466, 26, C.text2);
[[String(c.modules), 'modules'], [String(c.lessons), 'lessons'], ['Free', 'no account']].forEach(([v, k], i) => {
  add(F.d900, v, 80 + i * 150, 550, 34, C.text);
  add(F.t400, k, 80 + i * 150, 578, 18, C.text3);
});

// Right: the boot log
const X = 664, size = 19, step = 35;
const cw = F.m400.getAdvanceWidth('m', size);
add(F.m400, 'pid1 boot log', X, 99, 15, C.termDim);
add(F.m400, 'tty1', 1086, 99, 15, C.termDim);
const rows = [
  ['dim', 'pid1[1]: starting course'],
  ['part', C.p1, 'Part 1: Foundations'],
  ['ok', C.p1, '01', 'Linux & the Terminal'],
  ['ok', C.p1, '02', 'Git & GitHub'],
  ['ok', C.p1, '03', 'Programming with Python'],
  ['part', C.p2, 'Part 2: Cybersecurity'],
  ['ok', C.p2, '10', 'Cryptography Basics'],
  ['ok', C.p2, '12', 'Web Security'],
  ['part', C.p3, 'Part 3: Career'],
  ['ok', C.p3, '17', 'Final Projects'],
  ['prompt'],
];
let cursor = { x: X, y: 0 };
rows.forEach((r, i) => {
  const y = 152 + i * step + (i > 0 ? 6 : 0);
  if (r[0] === 'dim') add(F.m400, r[1], X, y, size, C.termDim);
  else if (r[0] === 'part') add(F.m700, r[2], X, y, size, r[1]);
  else if (r[0] === 'ok') {
    let x = add(F.m400, '[', X, y, size, C.termDim) + cw * 2;
    x = add(F.m700, 'OK', x, y, size, C.ok) + cw * 2;
    x = add(F.m400, ']', x, y, size, C.termDim) + cw;
    x = add(F.m400, r[2], x, y, size, r[1]) + cw;
    add(F.m400, r[3], x, y, size, C.termText);
  } else {
    cursor = { x: add(F.m400, 'you@pid1:~$', X, y, size, C.termText) + cw, y };
  }
});

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${C.bg}"/>
<rect x="80" y="496" width="470" height="1" fill="${C.line}"/>
<rect x="636" y="66" width="508" height="498" rx="14" fill="${C.term}" stroke="${C.termLine}"/>
<line x1="636" y1="116" x2="1144" y2="116" stroke="${C.termLine}"/>
<rect x="${cursor.x.toFixed(1)}" y="${cursor.y - 17}" width="11" height="22" fill="${C.termText}"/>
${parts.join('\n')}
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(path.join(out, 'og.png'));
console.log('images: favicon.svg, favicon-32.png, apple-touch-icon.png, og.png written to public/');
