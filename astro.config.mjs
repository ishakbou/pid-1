// PID 1: the course site. Astro + Starlight, published on GitHub Pages under /pid-1/.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeCourse from './src/plugins/rehype-course.mjs';
import { BASE, SITE_URL, site, sitePages, pendingPaths, starlightSidebar, href } from './src/lib/course.mjs';

const override = (name) => `./src/components/overrides/${name}.astro`;

// Links the checker must not fail on:
//  - pages of the curriculum that are planned but not written yet (the list empties itself as lessons arrive)
//  - the pages built by src/pages (home, roadmap, glossary, about, license), which the checker cannot see into
const customPages = new Set([href(''), ...sitePages.map((p) => href(p.path))]);
const excludeLink = ({ link }) => {
  const clean = link.split('#')[0].split('?')[0];
  return customPages.has(clean) || pendingPaths().has(clean);
};

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  trailingSlash: 'always',
  markdown: {
    // Code blocks are drawn by src/plugins/rehype-course.mjs (it calls Shiki itself)
    syntaxHighlight: false,
    processor: unified({ rehypePlugins: [rehypeHeadingIds, rehypeCourse] }),
  },
  integrations: [
    starlight({
      title: site.course,
      description: site.sentence,
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: `${BASE}/favicon-32.png`, sizes: '32x32', type: 'image/png' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${BASE}/apple-touch-icon.png` } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE_URL}${BASE}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: `${site.course}: ${site.tagline}. A free course.` } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE_URL}${BASE}/og.png` } },
        { tag: 'meta', attrs: { name: 'author', content: site.author } },
        { tag: 'meta', attrs: { name: 'copyright', content: `Copyright 2026 ${site.author}. Lessons: CC BY-NC-SA 4.0. Code: MIT.` } },
        { tag: 'link', attrs: { rel: 'license', href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' } },
        {
          // Who made the course and under which license, in the form search engines read
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: `${site.course}: ${site.tagline}`,
            description: site.sentence,
            url: site.url,
            inLanguage: 'en',
            isAccessibleForFree: true,
            author: { '@type': 'Person', name: site.author, url: site.linkedin },
            copyrightHolder: { '@type': 'Person', name: site.author },
            copyrightYear: 2026,
            license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
            provider: { '@type': 'Person', name: site.author, url: site.url },
          }),
        },
      ],
      lastUpdated: true,
      pagination: false,
      tableOfContents: false,
      credits: false,
      expressiveCode: false,
      markdown: { headingLinks: false },
      customCss: [
        '@fontsource-variable/red-hat-display',
        '@fontsource-variable/red-hat-text',
        '@fontsource-variable/red-hat-text/wght-italic.css',
        '@fontsource-variable/red-hat-mono',
        './src/styles/site.css',
        './src/styles/course.css',
        './src/styles/identity.css',
        './src/styles/boot.css',
        './src/styles/print.css',
      ],
      sidebar: starlightSidebar(),
      components: {
        ThemeProvider: override('ThemeProvider'),
        ThemeSelect: override('ThemeSelect'),
        PageFrame: override('PageFrame'),
        Header: override('Header'),
        Sidebar: override('Sidebar'),
        TwoColumnContent: override('TwoColumnContent'),
        PageSidebar: override('Empty'),
        MobileMenuToggle: override('Empty'),
        SocialIcons: override('Empty'),
        EditLink: override('Empty'),
        Pagination: override('Empty'),
        Hero: override('Empty'),
        ContentPanel: override('ContentPanel'),
        PageTitle: override('PageTitle'),
        MarkdownContent: override('MarkdownContent'),
        Footer: override('Footer'),
      },
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          exclude: excludeLink,
        }),
      ],
    }),
  ],
});
