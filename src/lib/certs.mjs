// The four certificates of the course: one for each part, and one for the whole course.
// Used by the Certificates page and by the tiles on the Home page.
import { course, site, href, plural } from './course.mjs';

const nLessons = (p) => p.modules.reduce((a, m) => a + m.lessons.length, 0);
/** The colour of each certificate on paper (white sheet): the three part colours, and brass for the course. */
export const PAPER = { 1: '#0B7A70', 2: '#BE2C52', 3: '#1D6CB0', course: '#8A6A1E' };

export function certList() {
  const c = course();
  const page = href('certificate');
  const parts = c.parts.map((p) => ({
    id: `p${p.n}`,
    hash: `part-${p.n}`,
    part: p.n,
    kicker: `Part ${p.n}`,
    title: p.title,
    label: `Part ${p.n} certificate`,
    modules: p.modules,
    lessons: nLessons(p),
    meta: `${plural(p.modules.length, 'module')}, ${plural(nLessons(p), 'lesson')}`,
    color: PAPER[p.n],
    href: `${page}#part-${p.n}`,
  }));
  return [
    ...parts,
    {
      id: 'course',
      hash: 'course',
      part: null,
      kicker: 'Whole course',
      title: site.course,
      label: 'Course certificate',
      modules: c.modules,
      lessons: c.counts.lessons,
      meta: `${plural(c.counts.modules, 'module')}, ${plural(c.counts.lessons, 'lesson')}`,
      color: PAPER.course,
      href: `${page}#course`,
    },
  ];
}
