import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import attrs from 'markdown-it-attrs';
import footnote from 'markdown-it-footnote';
import alerts from 'markdown-it-github-alerts';
import tableCaptions from 'markdown-it-table-captions';
import { createHighlighter, type BundledLanguage, type ThemeRegistrationRaw } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

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
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | undefined;
let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function initializeHighlighter() {
	highlighterPromise ??= createHighlighter({
		themes: [tokyoNightDay, 'tokyo-night'],
		langs: languages,
		engine: createJavaScriptRegexEngine()
	}).then((loadedHighlighter) => {
		highlighter = loadedHighlighter;
		return loadedHighlighter;
	});
	return highlighterPromise;
}

const markdown: MarkdownIt = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: false,
	breaks: true,
	highlight(code, language): string {
		const normalizedLanguage = language === 'linuxconfig' ? 'bash' : language;
		if (!highlighter) throw new Error('Markdown highlighter was not initialized');
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

const alertIcons = {
	Documentation:
		'<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3Z"/><path d="M21 18a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-5a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3Z"/></svg>',
	'TL;DR':
		'<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 3 5"/><path d="m19 3 2 2"/><path d="M9 2h6"/></svg>'
} as const;

function normalizeCustomAlerts(content: string) {
	return content.replaceAll('[!TL;DR]', '[!TLDR] TL;DR');
}

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

export function renderInline(content: string) {
	return markdown.renderInline(content);
}

export async function renderMarkdown(content: string, shiftPostHeadings = false) {
	await initializeHighlighter();
	const tokens = markdown.parse(normalizeCustomAlerts(content), {});
	if (shiftPostHeadings) {
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

export function slugifyTitle(title: string) {
	return title
		.toLowerCase()
		.replace(/`/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
