import { getCollection } from 'astro:content';
import { renderInline, slugifyTitle } from './markdown';

export type Entry = {
	type: 'post' | 'til';
	title: string;
	titleHtml: string;
	summary?: string;
	date: string;
	slug: string;
	category?: string;
	url: string;
	body: string;
};

export const BLOG_PAGE_SIZE = 10;

export async function entries(): Promise<Entry[]> {
	const [posts, tilEntries] = await Promise.all([getCollection('posts'), getCollection('til')]);
	const result = [
		...posts.map((entry): Entry => {
			const title = entry.data.title;
			const date = (entry.data.date ?? new Date(entry.id.slice(0, 10))).toISOString();
			const slug = slugifyTitle(title);
			return {
				type: 'post',
				title,
				titleHtml: renderInline(title),
				summary: entry.data.summary,
				date,
				slug,
				url: `/blog/${date.slice(0, 4)}/${slug}/`,
				body: entry.body ?? ''
			};
		}),
		...tilEntries.map((entry): Entry => {
			const title = entry.data.title;
			const filename = entry.id.split('/').at(-1) ?? entry.id;
			const date = (entry.data.date ?? new Date(filename.slice(0, 10))).toISOString();
			const category = entry.id.split('/')[0];
			const slug = slugifyTitle(title);
			return {
				type: 'til',
				title,
				titleHtml: renderInline(title),
				summary: entry.data.summary,
				date,
				slug,
				category,
				url: `/til/${category}/${slug}/`,
				body: entry.body ?? ''
			};
		})
	];
	return result.sort((a, b) => b.date.localeCompare(a.date));
}
