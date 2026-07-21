import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const clientDir = path.join(root, 'dist/client');
const site = 'https://joshthomas.dev';
const sourceBase = 'https://github.com/joshuadavidthomas/joshthomas.dev/tree/main/';

const exists = async (filename) => {
	try {
		await access(filename);
		return true;
	} catch (error) {
		if (error?.code === 'ENOENT') return false;
		throw error;
	}
};

const read = (filename) => readFile(filename, 'utf8');
const pageUrl = (pathname) => new URL(pathname, site).href;

async function checkPage(outputPath, pathname, sourcePath) {
	const html = await read(path.join(clientDir, outputPath));
	const url = pageUrl(pathname);
	assert.ok(
		html.includes(`<link rel="canonical" href="${url}">`),
		`${outputPath} must have canonical URL ${url}`
	);
	assert.ok(
		html.includes(`<meta property="og:url" content="${url}">`),
		`${outputPath} must have og:url ${url}`
	);
	assert.ok(
		html.includes(`href="${sourceBase}${sourcePath}"`),
		`${outputPath} must link to source file ${sourcePath}`
	);
	assert.ok(await exists(path.join(root, sourcePath)), `${sourcePath} must exist`);
	return html;
}

async function directDirectories(directory) {
	return (await readdir(directory, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

async function check() {
	await checkPage('index.html', '/', 'src/pages/index.astro');
	await checkPage('blog/index.html', '/blog/', 'src/pages/blog/[...page].astro');
	const designSystemHtml = await checkPage(
		'design-system/index.html',
		'/design-system/',
		'src/pages/design-system.astro'
	);
	assert.ok(
		designSystemHtml.includes('class="color-swatch"'),
		'design system must render swatches'
	);
	assert.ok(
		designSystemHtml.includes('<caption>Classic Monty Python insults</caption>'),
		'design system must render table captions'
	);
	assert.ok(
		designSystemHtml.includes('class="markdown-alert markdown-alert-documentation"'),
		'design system must render custom alerts'
	);
	assert.ok(
		designSystemHtml.includes('<section class="footnotes">'),
		'design system must render footnotes'
	);
	await checkPage('404.html', '/404/', 'src/pages/404.astro');

	const blogDir = path.join(clientDir, 'blog');
	const blogArticles = [];
	const paginationPages = [];
	for (const directory of await directDirectories(blogDir)) {
		const directIndex = path.join(blogDir, directory, 'index.html');
		if (/^\d+$/.test(directory) && (await exists(directIndex))) {
			assert.ok(Number(directory) >= 2, `unexpected numeric blog page /blog/${directory}/`);
			paginationPages.push(directory);
			await checkPage(
				`blog/${directory}/index.html`,
				`/blog/${directory}/`,
				'src/pages/blog/[...page].astro'
			);
			continue;
		}

		for (const slug of await directDirectories(path.join(blogDir, directory))) {
			const outputPath = `blog/${directory}/${slug}/index.html`;
			if (!(await exists(path.join(clientDir, outputPath)))) continue;
			const pathname = `/blog/${directory}/${slug}/`;
			const html = await checkPage(outputPath, pathname, 'src/pages/blog/[year]/[slug].astro');
			blogArticles.push({ pathname, html });
		}
	}
	assert.ok(blogArticles.length > 0, 'the build must contain at least one blog article');

	const tilArticles = [];
	const tilDir = path.join(clientDir, 'til');
	for (const category of await directDirectories(tilDir)) {
		for (const slug of await directDirectories(path.join(tilDir, category))) {
			const outputPath = `til/${category}/${slug}/index.html`;
			if (!(await exists(path.join(clientDir, outputPath)))) continue;
			const pathname = `/til/${category}/${slug}/`;
			const html = await checkPage(outputPath, pathname, 'src/pages/til/[category]/[slug].astro');
			tilArticles.push({ pathname, html });
		}
	}
	assert.ok(tilArticles.length > 0, 'the build must contain at least one TIL article');

	const feed = await read(path.join(clientDir, 'feeds/blog.xml'));
	const firstEntry = feed.indexOf('<entry>');
	assert.ok(firstEntry > 0, 'the Atom feed must contain an entry');
	const feedMetadata = feed.slice(0, firstEntry);
	assert.ok(
		feedMetadata.includes(
			`<link href="${site}/feeds/blog.xml" rel="self" type="application/atom+xml"/>`
		),
		'Atom self link must use the production site'
	);
	assert.ok(
		feedMetadata.includes(`<link href="${site}/blog/" rel="alternate" type="text/html"/>`),
		'Atom alternate link must use the production site'
	);
	assert.ok(
		feedMetadata.includes(
			`<author><email>josh@joshthomas.dev</email><name>Josh Thomas</name><uri>${site}/</uri></author>`
		),
		'Atom author URI must use the production site'
	);
	assert.ok(
		feedMetadata.includes(`<id>${site}/blog/</id>`),
		'Atom feed ID must use the production site'
	);
	assert.doesNotMatch(
		feed,
		/(?:href|src)=["']\/(?!\/)/,
		'Atom href and src values must not be root-relative'
	);

	const entryUrls = [];
	const entryBodies = new Map();
	for (const match of feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
		const entry = match[1];
		const link = entry.match(/<link href="([^"]+)"\/>/)?.[1];
		const id = entry.match(/<id>([^<]+)<\/id>/)?.[1];
		const body = entry.match(/<content type="html"><!\[CDATA\[([\s\S]*?)\]\]><\/content>/)?.[1];
		assert.ok(link, 'each Atom entry must have a link');
		assert.ok(id, 'each Atom entry must have an ID');
		assert.ok(body, `each Atom entry must have an HTML CDATA body: ${link}`);
		assert.equal(id, link, `Atom entry link and ID must match for ${link}`);
		assert.equal(
			new URL(link).origin,
			site,
			`Atom entry URL must use the production site: ${link}`
		);
		entryUrls.push(link);
		entryBodies.set(link, body);
	}
	assert.deepEqual(
		entryUrls.sort(),
		blogArticles.map(({ pathname }) => pageUrl(pathname)).sort(),
		'Atom entries must match the built blog articles'
	);

	const representativePath = '/blog/2025/open-source-is-a-gift/';
	const representativeBody =
		'<p>When people say &quot;open source is a gift,&quot; they usually mean the final product: a library or application given freely to society, with no expectation of reciprocity.</p>';
	const representativeArticle = blogArticles.find(
		({ pathname }) => pathname === representativePath
	);
	assert.ok(representativeArticle, `the build must contain ${representativePath}`);
	assert.ok(
		representativeArticle.html.includes(representativeBody),
		`${representativePath} must contain its rendered article body`
	);
	assert.ok(
		entryBodies.get(pageUrl(representativePath))?.includes(representativeBody),
		`the Atom entry for ${representativePath} must contain the same rendered body`
	);

	const sitemap = await read(path.join(clientDir, 'sitemap.xml'));
	const sitemapEntries = new Map();
	for (const match of sitemap.matchAll(
		/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g
	)) {
		const [, loc, lastmod] = match;
		assert.equal(new URL(loc).origin, site, `sitemap URL must use the production site: ${loc}`);
		assert.ok(!sitemapEntries.has(loc), `sitemap URL must be unique: ${loc}`);
		sitemapEntries.set(loc, lastmod);
	}
	for (const pathname of ['/', '/blog/', '/projects/', '/design-system/']) {
		assert.ok(sitemapEntries.has(pageUrl(pathname)), `sitemap must contain ${pageUrl(pathname)}`);
	}
	const sitemapPaginationPages = [...sitemapEntries.keys()]
		.map((loc) => loc.match(/^https:\/\/joshthomas\.dev\/blog\/(\d+)\/$/)?.[1])
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b));
	assert.deepEqual(
		sitemapPaginationPages,
		paginationPages,
		'sitemap numeric blog pages must match direct blog/<number>/index.html output'
	);
	for (const { pathname, html } of [...blogArticles, ...tilArticles]) {
		const loc = pageUrl(pathname);
		const lastmod = sitemapEntries.get(loc);
		assert.ok(lastmod, `sitemap content URL must have lastmod: ${loc}`);
		assert.match(
			lastmod,
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			`invalid lastmod for ${loc}`
		);
		assert.ok(
			html.includes(`datetime="${lastmod.slice(0, 10)}"`),
			`sitemap lastmod must match the rendered content date for ${loc}`
		);
	}

	assert.equal(
		await exists(path.join(clientDir, 'projects/index.html')),
		false,
		'/projects/ must not have static client HTML'
	);
	console.log('Built-site contracts passed.');
}

try {
	await check();
} catch (error) {
	console.error(`Built-site contract failed: ${error.message}`);
	process.exitCode = 1;
}
