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
	scopes: Record<Role, string[]>,
	bold: NoInfer<Role>[] = []
): ThemeRegistrationRaw {
	return {
		name,
		type: mode,
		colors: { 'editor.background': palette.background, 'editor.foreground': palette.variable },
		settings: Object.keys(scopes).map((role) => ({
			scope: scopes[role as Role],
			settings: {
				foreground: palette[role as Role],
				...(role === 'comment' ? { fontStyle: 'italic' } : {}),
				...(bold.includes(role as Role) ? { fontStyle: 'bold' } : {})
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
	),
	codeTheme(
		'alucard',
		'light',
		{
			background: '#fffbeb',
			variable: '#1f1f1f',
			comment: '#6c664b',
			keyword: '#a3144d',
			string: '#846e15',
			constant: '#a34d14',
			function: '#14710a',
			type: '#036a96',
			punctuation: '#1f1f1f',
			operator: '#a3144d',
			property: '#1f1f1f',
			parameter: '#a34d14',
			builtin: '#644ac9',
			tag: '#a3144d',
			deleted: '#cb3a2a'
		},
		tokyoSyntaxScopes
	),
	codeTheme(
		'django',
		'light',
		{
			background: '#f8f8f8',
			variable: '#0c4b33',
			comment: '#3d7a7a',
			keyword: '#008000',
			string: '#ba2121',
			constant: '#666666',
			function: '#0000ff',
			type: '#0000ff',
			punctuation: '#666666',
			deleted: '#ba2121'
		},
		syntaxScopes,
		['keyword', 'type']
	),
	codeTheme(
		'django-dark',
		'dark',
		{
			background: '#181d27',
			variable: '#f8f8f8',
			comment: '#8b949e',
			keyword: '#ff7b72',
			string: '#a5d6ff',
			constant: '#79c0ff',
			function: '#d2a8ff',
			type: '#f0883e',
			punctuation: '#c9d1d9',
			deleted: '#ffa198'
		},
		syntaxScopes,
		['keyword', 'function', 'type']
	),
	codeTheme(
		'django-admin-light',
		'light',
		{
			background: '#f8f8f8',
			variable: '#333333',
			comment: '#707070',
			keyword: '#205067',
			string: '#3d7a14',
			constant: '#a0521f',
			function: '#417893',
			type: '#6b4f9e',
			punctuation: '#555555',
			deleted: '#ba2121'
		},
		syntaxScopes
	),
	codeTheme(
		'django-admin-dark',
		'dark',
		{
			background: '#212121',
			variable: '#eeeeee',
			comment: '#9e9e9e',
			keyword: '#81d4fa',
			string: '#a5d6a7',
			constant: '#f5dd5d',
			function: '#79aec8',
			type: '#ce93d8',
			punctuation: '#bdbdbd',
			deleted: '#e35f5f'
		},
		syntaxScopes
	),
	codeTheme(
		'djangonaut-space',
		'light',
		{
			background: '#ffffff',
			variable: '#202020',
			comment: '#6b7280',
			keyword: '#5c0287',
			string: '#15803d',
			constant: '#b45309',
			function: '#1d4ed8',
			type: '#9d174d',
			punctuation: '#4b5563',
			deleted: '#b91c1c'
		},
		syntaxScopes
	),
	codeTheme(
		'djangonaut-space-dark',
		'dark',
		{
			background: '#1a1025',
			variable: '#f3f4f6',
			comment: '#9ca3af',
			keyword: '#c084fc',
			string: '#86efac',
			constant: '#fcd34d',
			function: '#93c5fd',
			type: '#f9a8d4',
			punctuation: '#d1d5db',
			deleted: '#f87171'
		},
		syntaxScopes
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
				dracula: 'dracula',
				alucard: 'alucard',
				django: 'django',
				'django-dark': 'django-dark',
				admin: 'django-admin-light',
				'admin-dark': 'django-admin-dark',
				djangonaut: 'djangonaut-space',
				'djangonaut-dark': 'djangonaut-space-dark'
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
