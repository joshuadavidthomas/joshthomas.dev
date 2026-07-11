import { entries } from '$lib/server/content';

export const prerender = true;
const escape = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absoluteHtml = (html: string) =>
	html
		.replaceAll('href="/', 'href="https://joshthomas.dev/')
		.replaceAll('src="/', 'src="https://joshthomas.dev/');

export const GET = async () => {
	const posts = (await entries()).filter((entry) => entry.type === 'post');
	const items = posts
		.map((post) => {
			const url = `https://joshthomas.dev${post.url}`;
			return `<entry><title>${escape(post.title)}</title><link href="${url}"/><updated>${post.date}</updated><id>${url}</id><content type="html"><![CDATA[${absoluteHtml(post.html)}]]></content></entry>`;
		})
		.join('');
	const body = `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-us"><title>Josh Thomas</title><subtitle>Latest entries posted to Josh Thomas's blog.</subtitle><link href="https://joshthomas.dev/feeds/blog.xml" rel="self" type="application/atom+xml"/><link href="https://joshthomas.dev/blog/" rel="alternate" type="text/html"/><author><email>josh@joshthomas.dev</email><name>Josh Thomas</name><uri>https://joshthomas.dev/</uri></author><updated>${posts[0]?.date ?? new Date(0).toISOString()}</updated><id>https://joshthomas.dev/blog/</id>${items}</feed>`;
	return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
