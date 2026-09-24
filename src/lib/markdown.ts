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

const syntaxScopes = {
	comment: ['comment', 'punctuation.definition.comment'],
	keyword: ['keyword', 'storage', 'storage.type'],
	string: ['string', 'string.quoted', 'constant.character', 'markup.inserted'],
	constant: ['constant.numeric', 'constant.language', 'variable.language'],
	function: ['entity.name.function', 'support.function'],
	type: ['entity.name.type', 'support.type', 'support.class', 'entity.name.tag'],
	variable: ['variable', 'meta.definition.variable'],
	punctuation: ['keyword.operator', 'punctuation'],
	deleted: ['markup.deleted']
};

// TokyoNight's Vim/Tree-sitter roles, adapted to TextMate scopes for Shiki.
// See folke/tokyonight.nvim: groups/treesitter.lua and extra/prism.lua.
const tokyoSyntaxScopes = {
	...syntaxScopes,
	constant: ['constant.numeric', 'constant.language', 'support.constant'],
	type: ['entity.name.type', 'support.type', 'support.class'],
	punctuation: ['punctuation'],
	operator: ['keyword.operator', 'punctuation.separator'],
	property: ['variable.other.property', 'variable.object.property', 'entity.other.attribute-name'],
	parameter: ['variable.parameter'],
	builtin: ['variable.language', 'support.variable'],
	tag: ['entity.name.tag']
};

function codeTheme<Role extends string>(
	name: string,
	mode: 'light' | 'dark',
	palette: Record<NoInfer<Role> | 'background' | 'variable', string>,
	scopes: Record<Role, string[]>
): ThemeRegistrationRaw {
	return {
		name,
		type: mode,
		colors: { 'editor.background': palette.background, 'editor.foreground': palette.variable },
		settings: Object.keys(scopes).map((role) => ({
			scope: scopes[role as Role],
			settings: {
				foreground: palette[role as Role],
				...(role === 'comment' ? { fontStyle: 'italic' } : {})
			}
		}))
	};
}

const codeThemes = [
	codeTheme(
		'warm-light',
		'light',
		{
			background: '#f1eee7',
			variable: '#47443f',
			comment: '#706b62',
			keyword: '#8b4933',
			string: '#536444',
			constant: '#806032',
			function: '#52676d',
			type: '#775568',
			punctuation: '#665e53',
			deleted: '#99483e'
		},
		syntaxScopes
	),
	codeTheme(
		'warm-dark',
		'dark',
		{
			background: '#2c2925',
			variable: '#d6d1c8',
			comment: '#aaa398',
			keyword: '#dca58b',
			string: '#b3bf9c',
			constant: '#d4b381',
			function: '#a4bdc2',
			type: '#c6a7ba',
			punctuation: '#b8afa1',
			deleted: '#e2a096'
		},
		syntaxScopes
	),
	codeTheme(
		'tokyo-night-day',
		'light',
		{
			background: '#d0d5e3',
			variable: '#3760bf',
			comment: '#848cb5',
			keyword: '#7847bd',
			string: '#587539',
			constant: '#b15c00',
			function: '#2e7de9',
			type: '#188092',
			punctuation: '#6172b0',
			operator: '#006a83',
			property: '#387068',
			parameter: '#8c6c3e',
			builtin: '#f52a65',
			tag: '#587539',
			deleted: '#c64343'
		},
		tokyoSyntaxScopes
	),
	codeTheme(
		'tokyo-night-moon',
		'dark',
		{
			background: '#1e2030',
			variable: '#c8d3f5',
			comment: '#636da6',
			keyword: '#fca7ea',
			string: '#c3e88d',
			constant: '#ff966c',
			function: '#82aaff',
			type: '#65bcff',
			punctuation: '#828bb8',
			operator: '#89ddff',
			property: '#4fd6be',
			parameter: '#ffc777',
			builtin: '#ff757f',
			tag: '#c3e88d',
			deleted: '#ff757f'
		},
		tokyoSyntaxScopes
	)
];

const loadedLanguages = new Set<string>(languages);
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | undefined;
let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function initializeHighlighter() {
	highlighterPromise ??= createHighlighter({
		themes: [...codeThemes, 'catppuccin-latte', 'catppuccin-mocha', 'dracula'],
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
			themes: {
				light: 'warm-light',
				dark: 'warm-dark',
				'tokyo-day': 'tokyo-night-day',
				'tokyo-moon': 'tokyo-night-moon',
				latte: 'catppuccin-latte',
				mocha: 'catppuccin-mocha',
				dracula: 'dracula'
			}
		});
		const icon =
			'<svg class="code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>';
		return html.replace('<code>', `${icon}<code>`);
	}
});

markdown.use(anchor, {
	permalink: anchor.permalink.linkInsideHeader({ symbol: '#', placement: 'before', space: false })
});
markdown.use(attrs);
markdown.use(footnote);
markdown.use(alerts, { markers: '*' });
markdown.use(tableCaptions);
markdown.core.ruler.after('inline', 'task-lists', (state) => {
	const listItems = [];
	for (const token of state.tokens) {
		if (token.type === 'list_item_open') {
			listItems.push(token);
			continue;
		}
		if (token.type === 'list_item_close') {
			listItems.pop();
			continue;
		}
		if (token.type !== 'inline' || !token.children) continue;

		let startsLine = true;
		for (let index = 0; index < token.children.length; index += 1) {
			const child = token.children[index];
			if (startsLine && child.type === 'text') {
				const marker = child.content.match(/^\[([ xX-])\]\s+/);
				if (marker) {
					const checked =
						marker[1].toLowerCase() === 'x' ? 'true' : marker[1] === '-' ? 'mixed' : 'false';
					const checkbox = new state.Token('html_inline', '', 0);
					checkbox.content = `<span class="task-list-checkbox" role="checkbox" aria-checked="${checked}" aria-disabled="true"></span>`;
					child.content = child.content.slice(marker[0].length);
					token.children.splice(index, 0, checkbox);
					index += 1;
					listItems.at(-1)?.attrJoin('class', 'task-list-item');
				}
			}
			startsLine = child.type === 'softbreak' || child.type === 'hardbreak';
		}
	}
});
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

export async function renderMarkdown(content: string, headingOffset = 0) {
	await initializeHighlighter();
	const tokens = markdown.parse(normalizeCustomAlerts(content), {});
	if (headingOffset) {
		for (const token of tokens) {
			if (
				(token.type === 'heading_open' || token.type === 'heading_close') &&
				/^h[1-6]$/.test(token.tag)
			) {
				token.tag = `h${Math.min(6, Number(token.tag.slice(1)) + headingOffset)}`;
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
