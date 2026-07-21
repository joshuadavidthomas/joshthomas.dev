import type { APIRoute } from 'astro';
import { BLOG_PAGE_SIZE, entries } from '@/lib/content';

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('Astro site is required to build the sitemap.');
	const content = await entries();
	const pageCount = Math.ceil(content.length / BLOG_PAGE_SIZE);
	const staticPaths = [
		'/',
		'/blog/',
		...Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => `/blog/${index + 2}/`),
		'/projects/',
		'/design-system/'
	];
	const urls = [
		...staticPaths.map((path) => ({ path, lastmod: undefined as string | undefined })),
		...content.map((entry) => ({ path: entry.url, lastmod: entry.date }))
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
		.map(
			({ path, lastmod }) =>
				`<url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
		)
		.join('')}</urlset>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
