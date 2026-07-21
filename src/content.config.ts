import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const datedEntry = z.object({
	title: z.string(),
	summary: z.string().optional(),
	date: z.coerce.date().optional()
});

export const collections = {
	posts: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './content/posts', deferRender: true }),
		schema: datedEntry
	}),
	til: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './content/til', deferRender: true }),
		schema: datedEntry
	}),
	design: defineCollection({
		loader: glob({ pattern: 'design-system.md', base: './content', deferRender: true }),
		schema: z.object({ title: z.string() })
	})
};
