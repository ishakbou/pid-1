// The practice terminal: a real small Linux (Alpine Linux with BusyBox, 32-bit) running in the reader's browser
// in the v86 emulator. Nothing is downloaded until the reader presses "Start practice terminal".
// The system lives in memory only: Reset or a page reload gives a fresh one.
//
// Files (all served by this site, see public/practice/ and tools/practice-image/):
//   v86 (libv86.js + v86.wasm, from the npm package "v86"), SeaBIOS + VGABIOS, the kernel and the initrd.
import xtermCss from '@xterm/xterm/css/xterm.css?url';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const DIR = BASE + 'practice/';
const PROMPT_END = /\$ $/;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const mb = (n) => (n / 1048576).toFixed(n < 10485760 ? 1 : 0);

// The downloads are kept for the whole page, so Reset and a second terminal do not download again.
let assetsPromise = null;
function loadAssets(onProgress) {
  if (assetsPromise) return assetsPromise;
  assetsPromise = (async () => {
    const cfg = await (await fetch(DIR + 'config.json')).json();
    const files = [cfg.bios, cfg.vgaBios, cfg.kernel, cfg.initrd];
    const total = cfg.sizes ? files.reduce((s, f) => s + (cfg.sizes[f] || 0), 0) : 0;
    const done = new Array(files.length).fill(0);
    const report = () => onProgress && onProgress(done.reduce((a, b) => a + b, 0), total);
    const get = async (f, i) => {
      const res = await fetch(DIR + f);
      if (!res.ok) throw new Error(f + ': HTTP ' + res.status);
      if (!res.body || !res.body.getReader) { const b = await res.arrayBuffer(); done[i] = b.byteLength; report(); return b; }
      const reader = res.body.getReader(), parts = [];
      let n = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        parts.push(value); n += value.length; done[i] = n; report();
      }
      const out = new Uint8Array(n);
      let o = 0;
      for (const p of parts) { out.set(p, o); o += p.length; }
      return out.buffer;
    };
    // v86 is loaded as its classic script (it then sets window.V86), unchanged from the npm package, so the
    // bundler does not touch it. Its Node.js code paths stay unused in the browser.
    const loadV86 = (url) => new Promise((resolve, reject) => {
      if (window.V86) return resolve(window.V86);
      const s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = () => (window.V86 ? resolve(window.V86) : reject(new Error('v86 did not load')));
      s.onerror = () => reject(new Error('libv86.js: download failed'));
      document.head.appendChild(s);
    });
    const [libUrl, wasm, xterm, fit] = await Promise.all([
      import('v86/build/libv86.js?url'),
      import('v86/build/v86.wasm?url'),
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
    ]);
    const V86 = await loadV86(libUrl.default);
    const bufs = await Promise.all(files.map(get));
    if (!document.querySelector('link[data-xterm]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = xtermCss; link.setAttribute('data-xterm', '');
      document.head.appendChild(link);
    }
    return { cfg, V86, Terminal: xterm.Terminal, FitAddon: fit.FitAddon, wasm: wasm.default, bios: bufs[0], vgaBios: bufs[1], kernel: bufs[2], initrd: bufs[3] };
  })();
  assetsPromise.catch(() => { assetsPromise = null; });
  return assetsPromise;
}

export function createV86Terminal(win, opts) {
  const body = win.querySelector('[data-term]');
  const startBox = win.querySelector('.tw-start');
  const startBtn = win.querySelector('[data-term-start]');
  const status = win.querySelector('.tw-status');
  const host = win.querySelector('.tw-xterm');
  const resetBtn = win.querySelector('[data-term-reset]');
  let a = null, emulator = null, term = null, fitter = null;
  let state = 'idle'; // idle, loading, booting, ready
  let tail = '', queue = [], sending = false, waitPrompt = null, gen = 0;
  const pendingOut = [];
  let flushQueued = false;

  const say = (text) => { if (status) status.textContent = text; };
  const encoder = new TextEncoder();
  // The serial port takes bytes: text is sent as UTF-8, one byte per character of the string
  const toGuest = (s) => {
    if (!emulator) return;
    let bin = '';
    for (const b of encoder.encode(s)) bin += String.fromCharCode(b);
    emulator.serial0_send(bin);
  };

  function flush() {
    flushQueued = false;
    if (!term || !pendingOut.length) return;
    term.write(new Uint8Array(pendingOut.splice(0)));
  }
  function onByte(b) {
    pendingOut.push(b);
    if (!flushQueued) { flushQueued = true; requestAnimationFrame(flush); }
    // Keep the end of the text to see when the shell shows its prompt again
    tail = (tail + String.fromCharCode(b)).slice(-300);
    if (state === 'booting' && /sam@practice:[^\n]*\$ $/.test(tail)) {
      state = 'ready';
      win.setAttribute('data-state', 'ready');
      pump();
    }
    if (waitPrompt && PROMPT_END.test(tail.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, ''))) { const w = waitPrompt; waitPrompt = null; w(); }
  }

  // Run buttons: each command is typed when the shell shows its prompt again (or after 20 s, for a command
  // that keeps running, such as nano)
  function pump() {
    if (sending || state !== 'ready' || !queue.length) return;
    sending = true;
    const my = gen;
    const next = () => {
      if (my !== gen) return;
      if (!queue.length) { sending = false; return; }
      const cmd = queue.shift();
      const timer = setTimeout(() => { if (waitPrompt) { waitPrompt = null; next(); } }, 20000);
      waitPrompt = () => { clearTimeout(timer); setTimeout(next, 120); };
      tail = '';
      toGuest(cmd + '\n');
    };
    next();
  }

  async function boot() {
    gen++;
    state = 'booting';
    win.setAttribute('data-state', 'booting');
    tail = ''; sending = false; waitPrompt = null;
    if (!term) {
      term = new a.Terminal({
        fontFamily: '"Red Hat Mono Variable", ui-monospace, monospace', fontSize: 13, lineHeight: 1.2,
        cursorBlink: true, scrollback: 3000, convertEol: false,
        theme: { background: '#0A0C0D', foreground: '#D9E0E1', cursor: '#45C6B9', selectionBackground: '#2F6F69', black: '#0A0C0D', brightBlack: '#8C989B', cyan: '#45C6B9', brightCyan: '#86DCD2', blue: '#6CB6FF', brightBlue: '#86C5FF' },
      });
      fitter = new a.FitAddon();
      term.loadAddon(fitter);
      term.open(host);
      term.onData((d) => toGuest(d));
    } else {
      term.reset();
    }
    try { fitter.fit(); } catch { /* the pane is hidden: keep the default size */ }
    const cols = term.cols || 80, rows = term.rows || 24;
    term.write('\x1b[90mStarting Linux in your browser. This takes a few seconds...\x1b[0m\r\n');
    emulator = new a.V86({
      wasm_path: a.wasm,
      memory_size: a.cfg.memoryMB * 1048576,
      vga_memory_size: 2 * 1048576,
      bios: { buffer: a.bios.slice(0) },
      vga_bios: { buffer: a.vgaBios.slice(0) },
      bzimage: { buffer: a.kernel.slice(0) },
      initrd: { buffer: a.initrd.slice(0) },
      cmdline: a.cfg.cmdline + ' practice.cols=' + cols + ' practice.rows=' + rows,
      autostart: true,
      disable_keyboard: true,
      disable_mouse: true,
      disable_speaker: true,
    });
    emulator.add_listener('serial0-output-byte', onByte);
    term.focus();
  }

  async function start() {
    if (state !== 'idle') return;
    if (typeof WebAssembly !== 'object') { say('Your browser cannot run the practice terminal (it has no WebAssembly). Try a recent Firefox, Chrome, Edge or Safari.'); return; }
    state = 'loading';
    win.setAttribute('data-state', 'loading');
    if (startBtn) startBtn.disabled = true;
    say('Downloading the small Linux...');
    try {
      a = await loadAssets((n, total) => say(total ? `Downloading the small Linux: ${mb(n)} of ${mb(total)} MB` : `Downloading the small Linux: ${mb(n)} MB`));
    } catch (e) {
      state = 'idle';
      win.setAttribute('data-state', 'idle');
      if (startBtn) startBtn.disabled = false;
      say('The download failed (' + e.message + '). Check your connection and press Start again.');
      return;
    }
    if (startBox) startBox.hidden = true;
    host.hidden = false;
    await boot();
  }

  async function reset() {
    queue = [];
    if (state === 'idle' || state === 'loading') return;
    const old = emulator;
    emulator = null;
    if (old) { try { await old.destroy(); } catch { /* already stopped */ } }
    await boot();
  }

  if (startBtn) startBtn.addEventListener('click', start);
  if (resetBtn) resetBtn.addEventListener('click', () => { reset(); });
  win.setAttribute('data-state', 'idle');
  window.addEventListener('resize', () => { if (term && fitter) { try { fitter.fit(); } catch { /* hidden */ } } });

  return {
    simulated: false,
    get started() { return state !== 'idle'; },
    start,
    // Commands from the Run buttons wait until the reader has started the terminal and Linux is ready
    send(commands) {
      queue = queue.concat(commands.map(String).filter((c) => c.trim()));
      if (state === 'idle') say('Press "Start practice terminal" first. The command will run as soon as Linux is ready.');
      pump();
    },
    focus() { if (term && state !== 'idle' && state !== 'loading') term.focus(); else if (startBtn) startBtn.focus({ preventScroll: true }); },
    reset,
  };
}
