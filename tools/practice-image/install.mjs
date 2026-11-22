// Puts a built practice image into the site (public/practice/) and writes its config.json and packages.json.
//
//   node tools/practice-image/install.mjs <build-output-dir> <bios-dir>
//
// <build-output-dir> is what build.sh made (vmlinuz, initrd.zst, packages.tsv, SOURCES.txt, kernel-config.txt).
// <bios-dir> holds seabios.bin and vgabios.bin from the v86 repository (bios/ folder, same commit as the npm
// package): https://raw.githubusercontent.com/copy/v86/<commit>/bios/seabios.bin and vgabios.bin
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [from, bios] = process.argv.slice(2);
if (!from || !bios) { console.error('Usage: node tools/practice-image/install.mjs <build-output-dir> <bios-dir>'); process.exit(1); }
const dest = path.resolve('public/practice');
fs.mkdirSync(dest, { recursive: true });

const copies = [
  [path.join(from, 'vmlinuz'), 'vmlinuz.bin'],
  [path.join(from, 'initrd.zst'), 'initrd.img'],
  [path.join(bios, 'seabios.bin'), 'seabios.bin'],
  [path.join(bios, 'vgabios.bin'), 'vgabios.bin'],
  [path.join(from, 'SOURCES.txt'), 'SOURCES.txt'],
];
const sizes = {}, sha256 = {};
for (const [src, name] of copies) {
  fs.copyFileSync(src, path.join(dest, name));
  const b = fs.readFileSync(path.join(dest, name));
  sizes[name] = b.length;
  sha256[name] = crypto.createHash('sha256').update(b).digest('hex');
}

// The package table for the License page
// Optional: APKINDEX_MAIN and APKINDEX_COMMUNITY (the APKINDEX text files of Alpine's two repositories) tell
// which repository each source package is in, for links to its build recipe in Alpine's aports.
const repoOf = {};
for (const [env, repo] of [['APKINDEX_MAIN', 'main'], ['APKINDEX_COMMUNITY', 'community']]) {
  if (!process.env[env]) continue;
  for (const rec of fs.readFileSync(process.env[env], 'utf8').split(/\n\n+/)) {
    const o = /^o:(.+)$/m.exec(rec);
    if (o && !repoOf[o[1]]) repoOf[o[1]] = repo;
  }
}
const packages = fs.readFileSync(path.join(from, 'packages.tsv'), 'utf8').trim().split('\n').map((l) => {
  const [name, version, license, url, origin] = l.split('\t');
  return { name, version, license, url, origin, repo: repoOf[origin] || null };
});
fs.writeFileSync(path.join(dest, 'packages.json'), JSON.stringify(packages, null, 1) + '\n');

// v86 itself (libv86.js and v86.wasm) is copied into the site by the site build, from the npm package "v86"
const v86pkg = JSON.parse(fs.readFileSync('node_modules/v86/package.json', 'utf8'));
const wasmBytes = fs.statSync('node_modules/v86/build/v86.wasm').size + fs.statSync('node_modules/v86/build/libv86.js').size;
const files = ['seabios.bin', 'vgabios.bin', 'vmlinuz.bin', 'initrd.img'];
const config = {
  note: 'Written by tools/practice-image/install.mjs. Read by src/scripts/terminal/v86.js and the License page.',
  alpine: 'v3.24 (x86, 32-bit)',
  v86: v86pkg.version,
  bios: 'seabios.bin',
  vgaBios: 'vgabios.bin',
  kernel: 'vmlinuz.bin',
  initrd: 'initrd.img',
  cmdline: 'console=ttyS0 quiet loglevel=3 mitigations=off',
  memoryMB: 256,
  sizes,
  sha256,
  // What the reader downloads the first time: the four files plus v86 (about 0.3 MB of xterm.js not counted)
  downloadBytes: files.reduce((s, f) => s + sizes[f], 0) + wasmBytes,
};
fs.writeFileSync(path.join(dest, 'config.json'), JSON.stringify(config, null, 1) + '\n');
console.log(`Installed into ${dest}. Download: ${(config.downloadBytes / 1048576).toFixed(1)} MB`);
for (const f of files) console.log(`  ${f}  ${(sizes[f] / 1048576).toFixed(2)} MB`);
