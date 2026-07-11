import { entries } from '$lib/server/content';

export const prerender = true;
export const GET = async () => {
	const content = await entries();
	const staticUrls = ['/', '/blog/', '/projects/', '/design-system/'].map((url) => ({
		url,
		lastmod: undefined as string | undefined
	}));
	const urls = [
		...staticUrls,
		...content.map((entry) => ({ url: entry.url, lastmod: entry.date }))
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ url, lastmod }) => `<url><loc>https://joshthomas.dev${url}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
