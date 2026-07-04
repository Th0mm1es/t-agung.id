import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      // Required core fields
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      category: z.string(),
      cover: image(),
      coverAlt: z.string(),

      // Existing / core workflow fields
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),

      // Recommended optional fields
      slug: z.string().optional(),
      excerpt: z.string().optional(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Thomas Agung'),
      lang: z.string().default('id-ID'),
      featured: z.boolean().default(false),

      // Series / editorial structure
      series: z.string().optional(),
      seriesOrder: z.number().int().positive().optional(),

      // SEO / indexing
      canonicalURL: z.string().url().optional(),
      keywords: z.array(z.string()).default([]),
      noindex: z.boolean().default(false),

      // Presentation helpers
      showToc: z.boolean().default(true),

      // Future internal-linking helper
      relatedPosts: z.array(z.string()).default([]),
    }),
});

export const collections = { blog };