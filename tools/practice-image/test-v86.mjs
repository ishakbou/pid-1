// Boots the practice terminal image in v86 (in Node.js, the same emulator the page uses) and runs a lesson in it.
//
//   node tools/practice-image/test-v86.mjs [lesson.md ...]       default: public/practice for the image files
//   node tools/practice-image/test-v86.mjs --cmd "ls -l /" --cmd "python3 -V"
//
// Every bash block of the lesson is typed into the terminal line by line, as a reader would, and what the
// terminal printed is compared with the lesson's output block (dates masked, as lab/lab.mjs does).
// Blocks marked <!-- lab: skip --> are not run. Nothing runs on the computer itself: only inside the emulator.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { V86 } from 'v86';

const argv = process.argv.slice(2);
const IMG = path.resolve(process.env.PRACTICE_DIR || 'public/practice');
const require = createRequire(import.meta.url);
const wasm = path.join(path.dirname(require.resolve('v86')), 'v86.wasm');
const buf = (f) => { const b = fs.readFileSync(path.join(IMG, f)); return { buffer: b.buffer.slice(b.byteOffset, b.byteOffset + b.length) }; };
const cfg = JSON.parse(fs.readFileSync(path.join(IMG, 'config.json'), 'utf8'));

const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const emulator = new V86({
  wasm_path: wasm,
  bios: buf('seabios.bin'),
  vga_bios: buf('vgabios.bin'),
  bzimage: buf(cfg.kernel),
  initrd: buf(cfg.initrd),
  cmdline: cfg.cmdline + ' practice.cols=80 practice.rows=24',
  memory_size: cfg.memoryMB * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  autostart: true,
  disable_keyboard: true,
  disable_mouse: true,
  disable_speaker: true,
});

let out = '';
const waiters = [];
emulator.add_listener('serial0-output-byte', (b) => {
  out += String.fromCharCode(b);
  for (const w of waiters.slice()) if (w.test(clean(out))) { waiters.splice(waiters.indexOf(w), 1); w.done(); }
});
// Terminal text without colours, cursor moves and carriage returns
const clean = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\x1b[()][A-Z0-9]/g, '').replace(/\r/g, '');
const waitFor = (re, ms) => new Promise((resolve, reject) => {
  const w = { test: (s) => re.test(s), done: resolve };
  if (w.test(clean(out))) return resolve();
  waiters.push(w);
  setTimeout(() => reject(new Error(`timeout waiting for ${re} after ${secs()}. Last output:\n${clean(out).slice(-600)}`)), ms);
});
const PROMPT = /sam@practice:[^\n]*\$ $/;

// Types one line and returns what it printed (without the echoed line and the next prompt)
async function line(cmd) {
  out = '';
  emulator.serial0_send(cmd + '\n');
  await waitFor(PROMPT, 120000);
  let text = clean(out).replace(PROMPT, '');
  // Remove the echo of the typed line. A long line is echoed with line breaks where the screen wraps it.
  let i = 0, j = 0;
  while (j < cmd.length && i < text.length) {
    if (text[i] === cmd[j]) { i++; j++; } else if (text[i] === '\n' || text[i] === ' ') i++; else break;
  }
  if (j === cmd.length) text = text.slice(i).replace(/^ ?\n/, '');
  return text.replace(/\n$/, '');
}

const untab = (l) => { let o = ''; for (const ch of l) o += ch === '\t' ? ' '.repeat(8 - (o.length % 8)) : ch; return o; };
const mask = (s) => s.split('\n').map((l) => untab(l).replace(/\s+$/, '')).join('\n')
  .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) +\d{1,2} +(\d{2}:\d{2}|\d{4})\b/g, 'DATE').trim();

function blocks(md) {
  const re = /^```(\w*)([^\n]*)\n([\s\S]*?)\n```[ \t]*$/gm;
  const items = []; let m;
  while ((m = re.exec(md))) {
    const before = md.slice(0, m.index).replace(/\s+$/, '').split('\n').pop() || '';
    items.push({ lang: m[1], body: m[3], line: md.slice(0, m.index).split('\n').length, skip: /lab:\s*skip/.test(before), nocheck: /lab:\s*nocheck/.test(before) });
  }
  const steps = [];
  items.forEach((it, i) => {
    if (it.lang !== 'bash' || it.skip) return;
    const next = items[i + 1] && items[i + 1].lang === 'output' ? items[i + 1].body : null;
    steps.push({ ...it, expected: it.nocheck ? null : next });
  });
  return steps;
}

try {
  await waitFor(PROMPT, 600000);
  console.log(`Booted to the prompt after ${secs()}.`);
  const cmds = [];
  argv.forEach((a, i) => { if (a === '--cmd') cmds.push(argv[i + 1]); });
  for (const c of cmds) console.log(`$ ${c}\n${await line(c)}`);
  let pass = 0, diff = 0, other = 0;
  for (const file of argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--cmd')) {
    await line('cd ~');
    for (const s of blocks(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))) {
      const outs = [];
      for (const l of s.body.split('\n')) if (l.trim() && !l.trim().startsWith('#')) outs.push(await line(l));
      const got = outs.filter((o) => o !== '').join('\n');
      if (s.expected == null) { other++; console.log(`--- line ${s.line} (not compared)\n${s.body}\n${got}`); continue; }
      if (mask(got) === mask(s.expected)) { pass++; console.log(`--- line ${s.line}: same as the lesson`); continue; }
      diff++;
      console.log(`--- line ${s.line}: DIFFERENT\n${s.body}\n--- lesson (Ubuntu) says\n${s.expected}\n--- practice terminal printed\n${got}`);
    }
    console.log(`${path.basename(file)}: ${pass} same, ${diff} different, ${other} not compared. Total time ${secs()}.`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  try { await emulator.destroy(); } catch { /* already stopped */ }
  setTimeout(() => process.exit(), 200);
}
