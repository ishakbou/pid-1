// One icon per module, drawn for this site on a 24px grid (line icons, no icon font, no emoji).
// The icon says what the module is about, so a reader can find a module by its look.
const P = (d) => `<path d="${d}"/>`;

const ICONS = {
  // 0 Start Here: a power button
  0: P('M12 3v8') + P('M6.6 6.6a7.6 7.6 0 1 0 10.8 0'),
  // 1 Linux & the Terminal: a terminal window with a prompt
  1: '<rect x="3" y="4.5" width="18" height="15" rx="2.2"/>' + P('M7 10l3 2.5L7 15') + P('M12.5 15H17'),
  // 2 Git & GitHub: a branch that leaves and comes back
  2: '<circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="8.5" r="2.2"/>' + P('M6.5 7.7v8.6') + P('M17.5 10.7c0 3.6-3.4 4.3-6.2 4.6-2.2.3-4.8.5-4.8 1'),
  // 3 Programming with Python: indented lines of code
  3: P('M4 6h9') + P('M8 10h12') + P('M8 14h8') + P('M4 18h9'),
  // 4 Data Structures & Algorithms: a tree
  4: '<circle cx="12" cy="5" r="2.1"/><circle cx="6" cy="12.5" r="2.1"/><circle cx="18" cy="12.5" r="2.1"/><circle cx="3.6" cy="19.6" r="1.6"/><circle cx="9" cy="19.6" r="1.6"/>' + P('M10.6 6.6 7.3 10.8') + P('M13.4 6.6l3.3 4.2') + P('M5.2 14.5 4.2 18') + P('M6.9 14.5 8.3 18'),
  // 5 How Computers Work: a chip
  5: '<rect x="7" y="7" width="10" height="10" rx="1.6"/><rect x="10.2" y="10.2" width="3.6" height="3.6" rx="0.6"/>' + P('M9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4'),
  // 6 Networking: a globe
  6: '<circle cx="12" cy="12" r="8.6"/>' + P('M3.4 12h17.2') + P('M12 3.4c3.2 3.4 3.2 13.8 0 17.2') + P('M12 3.4c-3.2 3.4-3.2 13.8 0 17.2'),
  // 7 Databases & SQL: a database cylinder
  7: '<ellipse cx="12" cy="6" rx="7" ry="3"/>' + P('M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6') + P('M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3'),
  // 8 The Web: a browser window with tags
  8: '<rect x="3" y="4" width="18" height="16" rx="2.2"/>' + P('M3 8.6h18') + P('M10 12.2l-2.4 2.3 2.4 2.3') + P('M14 12.2l2.4 2.3-2.4 2.3'),
  // 9 Security Fundamentals: a shield
  9: P('M12 3.2 19 6v5.2c0 4.4-2.9 7.9-7 9.6-4.1-1.700-7-5.200-7-9.600V6z') + P('M9 12.200l2.200 2.200 3.900-4.300'),
  // 10 Cryptography Basics: a key
  10: '<circle cx="8" cy="15.5" r="4.2"/>' + P('M11 12.500 19.500 4') + P('M16 7.500l2.600 2.600') + P('M13.400 10.100l2.200 2.200'),
  // 11 System & Network Security: a padlock
  11: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/>' + P('M8.200 10.500V8a3.800 3.800 0 0 1 7.600 0v2.500') + P('M12 14.600v2'),
  // 12 Web Security: a bug
  12: '<ellipse cx="12" cy="14.2" rx="4.4" ry="5.6"/>' + P('M9.600 8.900a2.400 2.400 0 0 1 4.800 0') + P('M12 9.200v10.600') + P('M7.600 12.300H4M7.800 16.300H4.600M16.400 12.300H20M16.200 16.300h3.200M9.400 6.300 8 4.400M14.600 6.300 16 4.400'),
  // 13 Defense & Incident Response: a monitoring line
  13: P('M3 12.500h3.800l2.200-6 3.800 11.500 2.300-5.500H21'),
  // 14 Practice: Labs & CTFs: a flag
  14: P('M5.500 21V3.500') + P('M5.500 4.500h12.500l-2.600 4 2.600 4H5.500'),
  // 15 Building with AI the Right Way: a simple robot head
  15: '<rect x="5" y="8.5" width="14" height="10.5" rx="2.4"/>' + P('M12 8.500V5.600') + '<circle cx="12" cy="4.4" r="1.2"/>' + P('M9.300 12.800v1.400M14.700 12.800v1.400') + P('M10 16.300h4'),
  // 16 Talking About Your Field: a speech bubble
  16: P('M4 5h16v11.500H10.500L6.500 20v-3.500H4z') + P('M8 9.300h8M8 12.500h5'),
  // 17 Final Projects: a finished package
  17: P('M12 3.200 20 7.600v8.800L12 20.800 4 16.400V7.600z') + P('M4.300 7.800 12 12l7.700-4.200') + P('M12 12v8.600'),
};

/** The icon of a module as an inline SVG string. `size` is the drawn size in pixels. */
export function moduleIcon(n, size = 22) {
  const d = ICONS[n] || ICONS[0];
  return `<svg class="mi" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
