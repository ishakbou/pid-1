// Small interface icons: inline SVG on a 16px grid, drawn for this site. No icon font, no emoji.
const svg = (d) => `<svg class="ic" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const IC = {
  search: svg('<circle cx="7" cy="7" r="4.25"/><path d="M10.2 10.2 13.5 13.5"/>'),
  ext: svg('<path d="M6.5 3.5h-3v9h9v-3"/><path d="M9 3.5h3.5V7"/><path d="M12.5 3.5 7.5 8.5"/>'),
  sun: svg('<circle cx="8" cy="8" r="2.75"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>'),
  moon: svg('<path d="M13 9.2A5.5 5.5 0 1 1 6.8 3a4.4 4.4 0 0 0 6.2 6.2Z"/>'),
  left: svg('<path d="M9.5 3.5 5 8l4.5 4.5"/>'),
  right: svg('<path d="M6.5 3.5 11 8l-4.5 4.5"/>'),
  down: svg('<path d="M3.5 6 8 10.5 12.5 6"/>'),
  check: svg('<path d="M3 8.5 6.5 12 13 4.5"/>'),
  clock: svg('<circle cx="8" cy="8" r="5.75"/><path d="M8 4.75V8l2.25 1.5"/>'),
  term: svg('<rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5"/><path d="M4.5 6.5 6.5 8l-2 1.5M8 10h3"/>'),
  list: svg('<path d="M5.5 4h8M5.5 8h8M5.5 12h8"/><path d="M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>'),
  x: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  copy: svg('<rect x="5.25" y="5.25" width="8" height="8" rx="1.25"/><path d="M10.75 5.25V3.5a.75.75 0 0 0-.75-.75H3.5a.75.75 0 0 0-.75.75V10c0 .41.34.75.75.75h1.75"/>'),
  play: svg('<path d="M5 3.5v9l7-4.5-7-4.5Z"/>'),
  board: svg('<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>'),
  rows: svg('<rect x="2" y="2.5" width="12" height="11" rx="1.25"/><path d="M2 6.5h12M2 10h12"/>'),
  panel: svg('<rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5"/><path d="M9.5 2.75v10.5"/>'),
  reset: svg('<path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 3v2.5h2.5"/>'),
  file: svg('<path d="M4 1.75h5l3 3v9.5H4z"/><path d="M9 1.75v3h3"/>'),
  print: svg('<path d="M4.5 5.5v-3h7v3"/><rect x="2" y="5.5" width="12" height="6" rx="1.25"/><path d="M4.5 9.5h7v4h-7z"/>'),
};
