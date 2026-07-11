import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import attrs from 'markdown-it-attrs';
import footnote from 'markdown-it-footnote';
import alerts from 'markdown-it-github-alerts';
import tableCaptions from 'markdown-it-table-captions';
import { createHighlighter, type BundledLanguage, type ThemeRegistrationRaw } from 'shiki';

const languages = [
	'bash',
	'css',
	'diff',
	'dockerfile',
	'html',
	'javascript',
	'json',
	'lua',
	'markdown',
	'python',
	'rust',
	'typescript',
	'yaml'
] satisfies BundledLanguage[];
const tokyoNightDay = {
	name: 'tokyo-night-day',
	type: 'light',
	colors: {
		'editor.background': '#e1e2e7',
		'editor.foreground': '#3760bf'
	},
	settings: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: '#6172b0', fontStyle: 'italic' }
		},
		{ scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#7847bd' } },
		{
			scope: ['string', 'string.quoted', 'constant.character'],
			settings: { foreground: '#587539' }
		},
		{
			scope: ['constant.numeric', 'constant.language', 'variable.language'],
			settings: { foreground: '#b15c00' }
		},
		{ scope: ['entity.name.function', 'support.function'], settings: { foreground: '#2e7de9' } },
		{
			scope: ['entity.name.type', 'support.type', 'support.class'],
			settings: { foreground: '#f52a65' }
		},
		{ scope: ['variable', 'meta.definition.variable'], settings: { foreground: '#3760bf' } },
		{ scope: ['keyword.operator', 'punctuation'], settings: { foreground: '#006a83' } }
	]
} satisfies ThemeRegistrationRaw;
const loadedLanguages = new Set<string>(languages);
const highlighter = await createHighlighter({
	themes: [tokyoNightDay, 'tokyo-night'],
	langs: languages
});

const markdown: MarkdownIt = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: false,
	breaks: true,
	highlight(code, language): string {
		const normalizedLanguage = language === 'linuxconfig' ? 'bash' : language;
		const html = highlighter.codeToHtml(code, {
			lang: loadedLanguages.has(normalizedLanguage)
				? (normalizedLanguage as BundledLanguage)
				: 'text',
			themes: { light: 'tokyo-night-day', dark: 'tokyo-night' }
		});
		const icon =
			'<svg class="code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>';
		return html.replace('<code>', `${icon}<code>`);
	}
});
markdown.use(anchor, {
	permalink: anchor.permalink.linkInsideHeader({ symbol: '#', placement: 'before' })
});
markdown.use(attrs);
markdown.use(footnote);
markdown.use(alerts, { markers: '*' });
markdown.use(tableCaptions);
markdown.renderer.rules.table_open = () =>
	'<div class="min-w-full overflow-x-auto"><table class="w-full">';
markdown.renderer.rules.table_close = () => '</table></div>';

export type Entry = {
	type: 'post' | 'til';
	title: string;
	titleHtml: string;
	summary?: string;
	date: string;
	slug: string;
	category?: string;
	url: string;
	html: string;
};

function normalizeCustomAlerts(content: string) {
	return content.replaceAll('[!TL;DR]', '[!TLDR] TL;DR');
}

const alertIcons = {
	Documentation:
		'<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3Z"/><path d="M21 18a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-5a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3Z"/></svg>',
	'TL;DR':
		'<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 3 5"/><path d="m19 3 2 2"/><path d="M9 2h6"/></svg>'
} as const;

function decorateCustomAlertIcons(html: string) {
	return Object.entries(alertIcons).reduce(
		(result, [title, icon]) =>
			result.replace(
				`<p class="markdown-alert-title">${title}</p>`,
				`<p class="markdown-alert-title">${icon}${title}</p>`
			),
		html
	);
}

function renderContent(content: string, type: Entry['type']) {
	const tokens = markdown.parse(normalizeCustomAlerts(content), {});
	if (type === 'post') {
		for (const token of tokens) {
			if (
				(token.type === 'heading_open' || token.type === 'heading_close') &&
				/^h[1-5]$/.test(token.tag)
			) {
				token.tag = `h${Number(token.tag.slice(1)) + 1}`;
			}
		}
	}
	return decorateCustomAlertIcons(markdown.renderer.render(tokens, markdown.options, {}));
}

async function parse(path: string, type: Entry['type']): Promise<Entry> {
	const source = await readFile(path, 'utf8');
	const { data, content } = matter(source);
	const file = basename(path, '.md');
	const slug = String(data.title)
		.toLowerCase()
		.replace(/`/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
	const date = new Date(data.date ?? file.slice(0, 10)).toISOString();
	const category = type === 'til' ? basename(dirname(path)) : undefined;
	const url = type === 'post' ? `/blog/${date.slice(0, 4)}/${slug}/` : `/til/${category}/${slug}/`;
	return {
		type,
		title: String(data.title),
		titleHtml: markdown.renderInline(String(data.title)),
		summary: data.summary,
		date,
		slug,
		category,
		url,
		html: renderContent(content, type)
	};
}

export async function entries(): Promise<Entry[]> {
	const posts = (await readdir('content/posts')).filter((name) => name.endsWith('.md'));
	const categories = await readdir('content/til', { withFileTypes: true });
	const tilPaths: string[] = [];
	for (const category of categories) {
		if (!category.isDirectory()) continue;
		for (const name of await readdir(join('content/til', category.name))) {
			if (name.endsWith('.md')) tilPaths.push(join('content/til', category.name, name));
		}
	}
	const result = await Promise.all([
		...posts.map((name) => parse(join('content/posts', name), 'post')),
		...tilPaths.map((path) => parse(path, 'til'))
	]);
	return result.sort((a, b) => b.date.localeCompare(a.date));
}

async function renderColorSwatches() {
	const styles = await Promise.all([
		readFile('node_modules/tailwindcss/theme.css', 'utf8'),
		readFile('src/lib/styles/colors.css', 'utf8')
	]);
	const colors = new Map<string, string>();
	for (const css of styles) {
		for (const match of css.matchAll(/--color-([^:]+):\s*([^;]+);/g))
			colors.set(match[1], match[2].trim());
	}
	const groups = Map.groupBy([...colors], ([name]) => name.split('-')[0]);
	return [...groups.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([group, groupColors]) => {
			const swatches = groupColors
				.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
				.map(
					([name, value]) =>
						`<div class="color-swatch"><div class="size-16 rounded-md shadow-${name}-md" style="background-color:var(--color-${name},${value})"></div><div class="mt-2"><p class="truncate font-mono text-sm">${name.replace('tokyonight-', '')}</p></div></div>`
				)
				.join('');
			return `<h3 class="capitalize">${group} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${groupColors.length} colors)</span></h3><div class="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">${swatches}</div>`;
		})
		.join('');
}

export async function renderMarkdownFile(path: string) {
	const source = await readFile(path, 'utf8');
	const { data, content } = matter(source);
	const expandedContent = content.includes('<!-- color-swatches-start -->')
		? content.replace(
				/<!-- color-swatches-start -->[\s\S]*<!-- color-swatches-end -->/,
				`<!-- color-swatches-start -->\n\n${await renderColorSwatches()}\n\n<!-- color-swatches-end -->`
			)
		: content;
	return {
		metadata: data,
		html: decorateCustomAlertIcons(markdown.render(normalizeCustomAlerts(expandedContent)))
	};
}

export async function findEntry(type: Entry['type'], slug: string, segment: string) {
	return (await entries()).find(
		(entry) =>
			entry.type === type &&
			entry.slug === slug &&
			(type === 'post' ? entry.date.startsWith(segment) : entry.category === segment)
	);
}
