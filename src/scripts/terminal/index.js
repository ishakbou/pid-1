// The practice terminal, behind one small interface.
//
//   const term = await createTerminal(windowElement);
//   term.send(['pwd', 'ls -l']);   // type and run commands, one after the other (they wait for the start)
//   term.focus();                  // put the cursor in the terminal (or on its Start button)
//   term.reset();                  // restart with a fresh system
//   term.start();                  // the same as pressing "Start practice terminal"
//   term.simulated                 // false: this is a real Linux
//
// The terminal is a real small Linux (Alpine Linux with BusyBox, 32-bit) running in the browser with v86.
// See v86.js, public/practice/ and tools/practice-image/. The lesson page and the home page use only
// these members. v86.js itself is small and imported directly, so the Start button works as soon as the
// page's script runs; the emulator and the Linux image are downloaded only when the reader presses it.
import { createV86Terminal } from './v86.js';

export async function createTerminal(win, opts) {
  return createV86Terminal(win, opts || {});
}
