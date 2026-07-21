import type { APIRoute } from 'astro';
import { entries } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

const escape = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absoluteHtml = (html: string, site: URL) =>
	html.replace(
		/(href|src)="(\/(?!\/)[^"]*)"/g,
		(_match, attribute: string, path: string) => `${attribute}="${new URL(path, site).href}"`
	);

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('Astro site is required to build the Atom feed.');
	const posts = (await entries()).filter((entry) => entry.type === 'post');
	const items = (
		await Promise.all(
			posts.map(async (post) => {
				const url = new URL(post.url, site).href;
				const html = await renderMarkdown(post.body, true);
				return `<entry><title>${escape(post.title)}</title><link href="${url}"/><updated>${post.date}</updated><id>${url}</id><content type="html"><![CDATA[${absoluteHtml(html, site)}]]></content></entry>`;
			})
		)
	).join('');
	const feedUrl = new URL('/feeds/blog.xml', site).href;
	const blogUrl = new URL('/blog/', site).href;
	const homeUrl = new URL('/', site).href;
	const body = `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-us"><title>Josh Thomas</title><subtitle>Latest entries posted to Josh Thomas's blog.</subtitle><link href="${feedUrl}" rel="self" type="application/atom+xml"/><link href="${blogUrl}" rel="alternate" type="text/html"/><author><email>josh@joshthomas.dev</email><name>Josh Thomas</name><uri>${homeUrl}</uri></author><updated>${posts[0]?.date ?? new Date(0).toISOString()}</updated><id>${blogUrl}</id>${items}</feed>`;
	return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
