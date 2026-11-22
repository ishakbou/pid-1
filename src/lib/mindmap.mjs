// Mind maps. A fenced block
//
//   ```mindmap
//   Files and navigation
//     Where am I
//       pwd
//       working directory
//   ```
//
// becomes one <figure> with two drawings of the same data: a wide one (the centre in the middle,
// the branches around it) and a narrow one (a vertical tree, for phones). CSS shows the one that
// fits the column.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parse the indented text. Two spaces per level, three levels at most. */
export function parseMindMap(source) {
  const lines = String(source).replace(/\t/g, '  ').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return null;
  const map = { center: lines[0].trim(), branches: [] };
  const base = lines[0].match(/^ */)[0].length;
  for (const line of lines.slice(1)) {
    const depth = Math.round((line.match(/^ */)[0].length - base) / 2);
    const text = line.trim();
    if (depth <= 1 || !map.branches.length) map.branches.push({ label: text, leaves: [] });
    else {
      // A leaf written between backticks is shown in the code font
      const m = /^`(.+)`$/.exec(text);
      map.branches[map.branches.length - 1].leaves.push(m ? { t: m[1], code: true } : text);
    }
  }
  return map;
}

const leafText = (l) => (typeof l === 'string' ? l : l.t);
const isCode = (l) => typeof l !== 'string' && l.code;
// Rough text widths, in SVG units, for the fonts and sizes of the style sheet
const wLeaf = (l) => leafText(l).length * (isCode(l) ? 7.3 : 6.5) + 18;
const wBranch = (s) => s.length * 7.6 + 26;
const wCenter = (s) => s.length * 8.6 + 34;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const rect = (x, y, w, h, cls, r) => `<rect class="mm-node ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
// A label that would not fit is squeezed a little instead of leaving its box
const text = (x, y, s, cls, max, est) => `<text class="mm-text ${cls}" x="${x}" y="${y}" dy="0.35em" text-anchor="middle"${max && est > max ? ` textLength="${Math.round(max - 10)}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(s)}</text>`;
const leaf = (x, y, w, l) => rect(x, y, w, 24, 'mm-leaf', 5) + text(x + w / 2, y + 12, leafText(l), 'mm-leaf' + (isCode(l) ? ' mm-code' : ''), w, wLeaf(l));

/** Split a long centre label over two lines. */
function centerLines(s, maxChars) {
  if (s.length <= maxChars) return [s];
  const words = s.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (!best || score < best.score) best = { a, b, score };
  }
  return best ? [best.a, best.b] : [s];
}
function centerBox(x, y, w, h, lines, max) {
  const out = [rect(x, y, w, h, 'mm-center', 9)];
  const lh = 18, y0 = y + h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => out.push(text(x + w / 2, y0 + i * lh, ln, 'mm-center', max, wCenter(ln) - 14)));
  return out.join('');
}

/** A vertical tree of branches, starting at (x0, y0). Returns the drawing and where it ends. */
function tree(branches, x0, y0, W) {
  const BH = 34, P = 30, BW = Math.min(W - 40, clamp(Math.max(...branches.map((b) => wBranch(b.label))), 150, 240));
  let y = y0, links = '', nodes = '', lastBranchY = y0;
  branches.forEach((b) => {
    const two = b.leaves.length > 1 && b.leaves.every((l) => leafText(l).length <= 9);
    const full = W - 58, lw = two ? (full - 8) / 2 : full, rows = two ? Math.ceil(b.leaves.length / 2) : b.leaves.length;
    lastBranchY = y + BH / 2;
    links += `<path class="mm-link mm-main" d="M${x0 + 14} ${lastBranchY}H${x0 + 30}"/>`;
    nodes += rect(x0 + 30, y, BW, BH, 'mm-branch', 8) + text(x0 + 30 + BW / 2, y + BH / 2, b.label, 'mm-branch', BW, wBranch(b.label));
    const ly0 = y + BH + 8;
    if (rows) links += `<path class="mm-link" d="M${x0 + 42} ${y + BH}V${ly0 + (rows - 1) * P + 12}"/>`;
    b.leaves.forEach((l, k) => {
      const row = two ? Math.floor(k / 2) : k, col = two ? k % 2 : 0, ly = ly0 + row * P;
      if (col === 0) links += `<path class="mm-link" d="M${x0 + 42} ${ly + 12}H${x0 + 56}"/>`;
      nodes += leaf(x0 + 56 + col * (lw + 8), ly, lw, l);
    });
    y = ly0 + rows * P + 8;
  });
  return { links, nodes, end: y, lastBranchY };
}

/** map = { center, branches: [{ label, leaves }] }, caption optional. Returns an HTML string. */
export function mindMap(map, caption = '') {
  const label = `Mind map. Centre: ${map.center}. ` + map.branches.map((b) => `Branch ${b.label}${b.leaves.length ? ': ' + b.leaves.map(leafText).join(', ') : ''}.`).join(' ');
  const n = map.branches.length;
  let wide = '';

  if (n >= 2 && n <= 4) {
    // Wide: the centre in the middle, one branch in each corner. The leaves sit on the outside.
    const allLeaves = map.branches.flatMap((b) => b.leaves);
    const LW = clamp(Math.max(120, ...allLeaves.map(wLeaf)), 120, 196);
    const BW = clamp(Math.max(...map.branches.map((b) => wBranch(b.label))), 112, 150);
    const BH = 38, P = 30, GAP = 30;
    const W = Math.max(680, 2 * (LW + 14 + BW) + 36);
    const cl = centerLines(map.center, 24), CW = clamp(Math.max(...cl.map(wCenter)), 150, 260), CH = cl.length > 1 ? 60 : 46;
    const half = Math.ceil(n / 2);
    const quad = [map.branches[0], map.branches[half], map.branches[1] && half > 1 ? map.branches[1] : null, map.branches[half + 1]]; // TL, TR, BL, BR
    const blockH = (b) => (b ? Math.max(BH, b.leaves.length * P - 6) : 0);
    const topH = Math.max(blockH(quad[0]), blockH(quad[1])), botH = Math.max(blockH(quad[2]), blockH(quad[3]));
    const cy = topH + GAP, H = cy + CH + (botH ? GAP + botH : 0), cx = W / 2;
    let links = '', nodes = '';
    quad.forEach((b, i) => {
      if (!b) return;
      const left = i % 2 === 0, top = i < 2, h = blockH(b);
      const y0 = top ? topH - h : cy + CH + GAP;
      const bx = left ? LW + 14 : W - LW - 14 - BW, by = y0 + h / 2 - BH / 2, lx = left ? 0 : W - LW;
      const sx = cx + (left ? -52 : 52), sy = top ? cy : cy + CH, ex = bx + BW / 2, ey = top ? by + BH : by;
      links += `<path class="mm-link mm-main" d="M${sx} ${sy}C${sx} ${(sy + ey) / 2} ${ex} ${(sy + ey) / 2} ${ex} ${ey}"/>`;
      const ly0 = y0 + (h - (b.leaves.length * P - 6)) / 2, edge = left ? bx : bx + BW, mid = left ? bx - 7 : bx + BW + 7, inner = left ? LW : lx;
      b.leaves.forEach((l, k) => {
        const ly = ly0 + k * P;
        links += `<path class="mm-link" d="M${edge} ${by + BH / 2}H${mid}V${ly + 12}H${inner}"/>`;
        nodes += leaf(lx, ly, LW, l);
      });
      nodes += rect(bx, by, BW, BH, 'mm-branch', 8) + text(bx + BW / 2, by + BH / 2, b.label, 'mm-branch', BW, wBranch(b.label));
    });
    nodes += centerBox(cx - CW / 2, cy, CW, CH, cl, CW);
    wide = `<svg class="mm mm-wide" viewBox="-1 -1 ${W + 2} ${H + 2}" role="img" aria-label="${esc(label)}">${links}${nodes}</svg>`;
  } else if (n > 4) {
    // Wide, for five branches or more: two vertical trees side by side under the centre.
    const COL = 310, GAPX = 40, W = COL * 2 + GAPX;
    const cl = centerLines(map.center, 30), CW = clamp(Math.max(...cl.map(wCenter)), 180, 320), CH = cl.length > 1 ? 60 : 44;
    const half = Math.ceil(n / 2), top = CH + 26;
    const a = tree(map.branches.slice(0, half), 0, top, COL), b = tree(map.branches.slice(half), COL + GAPX, top, COL);
    const cx = W / 2, xa = 14, xb = COL + GAPX + 14;
    const trunk = `<path class="mm-link mm-main" d="M${cx} ${CH}V${CH + 12}H${xa}V${a.lastBranchY}"/><path class="mm-link mm-main" d="M${cx} ${CH + 12}H${xb}V${b.lastBranchY}"/>`;
    wide = `<svg class="mm mm-wide" viewBox="-1 -1 ${W + 2} ${Math.max(a.end, b.end)}" role="img" aria-label="${esc(label)}">${trunk}${a.links}${b.links}${a.nodes}${b.nodes}${centerBox(cx - CW / 2, 0, CW, CH, cl, CW)}</svg>`;
  }

  // Narrow: one vertical tree. Short leaves go two per row.
  const W = 310;
  const cl = centerLines(map.center, 26), CW = clamp(Math.max(...cl.map(wCenter)), 180, 280), CH = cl.length > 1 ? 58 : 42;
  const t = tree(map.branches, 0, CH + 14, W);
  const trunk = map.branches.length ? `<path class="mm-link mm-main" d="M14 ${CH}V${t.lastBranchY}"/>` : '';
  const narrow = `<svg class="mm mm-narrow" viewBox="-1 -1 ${W + 2} ${t.end}" role="img" aria-label="${esc(label)}">${trunk}${t.links}${t.nodes}${centerBox(0, 0, CW, CH, cl, CW)}</svg>`;

  return `<figure class="mindmap${wide ? '' : ' only-narrow'}">${wide}${narrow}${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}
