// What kind of page is being rendered, worked out from its URL.
import { BASE, course } from './course.mjs';

/**
 * kind: 'home' | 'lesson' | 'overview' | 'cheat' | 'page'
 * For module pages: module, lesson, prev, next (see course().find).
 */
export function pageInfo(Astro) {
  const docPath = decodeURIComponent(Astro.url.pathname).replace(new RegExp('^' + BASE), '').replace(/^\/+|\/+$/g, '');
  const c = course();
  const route = Astro.locals.starlightRoute;
  const data = route?.entry?.data || {};
  if (docPath === '') return { kind: 'home', docPath, course: c, data, route };
  const found = c.find(docPath);
  if (found && found.kind !== 'extra') return { ...found, docPath, course: c, data, route };
  return { kind: 'page', docPath, course: c, data, route, module: found?.module || null };
}

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (d) => (d instanceof Date && !isNaN(d) ? fmt.format(d) : '');
