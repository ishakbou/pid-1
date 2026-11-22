import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// The extra frontmatter fields of the content guide (docs/CONTENT_GUIDE.md, sections 2, 8 and 9).
const courseFields = z.object({
  /** Lesson number from the curriculum, for example "1.2". A bare number is accepted and kept as text. */
  lesson: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  /** Honest reading and practice time, for example "20 min". */
  time: z.union([z.string(), z.number()]).transform((v) => (typeof v === 'number' ? `${v} min` : v)).optional(),
  /** True when every command of "Try it" works in the practice terminal. */
  practiceTerminal: z.boolean().default(false),
  /** Module number, on a module overview page. */
  module: z.number().int().min(0).max(17).optional(),
  /** True on a cheat sheet page. */
  cheatSheet: z.boolean().default(false),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: courseFields }) }),
};
