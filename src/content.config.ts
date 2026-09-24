import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const datedEntry = z.object({
	title: z.string(),
	summary: z.string().optional(),
	ogSummary: z.string().optional(),
	date: z.coerce.date().optional()
});

export const collections = {
	home: defineCollection({
		loader: glob({ pattern: '*.md', base: './content/home', deferRender: true }),
		schema: z.object({
			title: z.string(),
			order: z.number(),
			kind: z.enum([
				'intro',
				'prose',
				'projects',
				'community',
				'writing',
				'dated-list',
				'links',
				'contact'
			]),
			subtitle: z.string().optional(),
			items: z
				.array(
					z.object({
						title: z.string(),
						subtitle: z.string().optional(),
						date: z.string(),
						href: z.string()
					})
				)
				.optional(),
			links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
			link: z.object({ label: z.string(), href: z.string() }).optional()
		})
	}),
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
