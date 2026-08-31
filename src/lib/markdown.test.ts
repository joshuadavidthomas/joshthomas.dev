import { describe, expect, it } from 'vite-plus/test';
import { renderInline, renderMarkdown, slugifyTitle } from './markdown';

describe('content rendering', () => {
	it('preserves the published title slugs', () => {
		expect(slugifyTitle('Open Source is a Gift')).toBe('open-source-is-a-gift');
		expect(slugifyTitle('Using direnv to add a personal `.gitignore` file to repos')).toBe(
			'using-direnv-to-add-a-personal-gitignore-file-to-repos'
		);
	});

	it('renders inline code in titles', () => {
		expect(renderInline('A `.gitignore` file')).toContain('<code>.gitignore</code>');
	});

	it('passes through raw HTML', async () => {
		const html = await renderMarkdown('<span data-test="raw">Raw HTML</span>');
		expect(html).toContain('<span data-test="raw">Raw HTML</span>');
	});

	it('linkifies URLs', async () => {
		const html = await renderMarkdown('Visit https://example.com for details.');
		expect(html).toContain('<a href="https://example.com">https://example.com</a>');
	});

	it('renders hard line breaks', async () => {
		const html = await renderMarkdown('First line\nSecond line');
		expect(html).toContain('First line<br>\nSecond line');
	});

	it('renders heading permalinks and general attributes', async () => {
		const html = await renderMarkdown('## Heading {#custom-heading .featured data-kind=example}');
		expect(html).toContain(
			'<h2 id="custom-heading" class="featured" data-kind="example" tabindex="-1">'
		);
		expect(html).toContain('class="header-anchor"');
		expect(html).toContain('href="#custom-heading"');
		expect(html).toContain('</a>Heading</h2>');
	});

	it('renders standard and custom alerts with custom icons', async () => {
		const html = await renderMarkdown(
			'> [!NOTE]\n> Standard alert.\n\n> [!Documentation]\n> Read the docs.\n\n> [!TL;DR]\n> Short version.'
		);
		expect(html).toContain('markdown-alert-note');
		expect(html).toContain('markdown-alert-documentation');
		expect(html).toContain('markdown-alert-tldr');
		expect(html).toContain('<svg class="alert-icon"');
		expect(html.match(/<svg class="alert-icon"/g)).toHaveLength(2);
	});

	it('renders footnotes', async () => {
		const html = await renderMarkdown('Text with a footnote.[^1]\n\n[^1]: Footnote text.');
		expect(html).toContain('class="footnotes"');
		expect(html).toContain('id="fn1"');
		expect(html).toContain('Footnote text.');
	});

	it('wraps captioned tables for responsive overflow', async () => {
		const html = await renderMarkdown(
			'| Name | Value |\n| ---- | ----- |\n| Answer | 42 |\n\n: Useful values'
		);
		expect(html).toContain('<div class="min-w-full overflow-x-auto"><table class="w-full">');
		expect(html).toContain('<caption>Useful values</caption>');
		expect(html).toContain('</table></div>');
	});

	it('shifts post headings from h1 through h5', async () => {
		const markdown = Array.from(
			{ length: 5 },
			(_, index) => `${'#'.repeat(index + 1)} Heading ${index + 1}`
		).join('\n\n');
		const html = await renderMarkdown(markdown, true);
		for (let level = 2; level <= 6; level += 1) {
			expect(html).toContain(`<h${level} id="heading-${level - 1}" tabindex="-1">`);
		}
		expect(html).not.toContain('<h1');
	});

	it('renders code blocks with paired Shiki themes and the code icon', async () => {
		const html = await renderMarkdown('```typescript\nconst answer = 42;\n```');
		expect(html).toContain('shiki-themes tokyo-night-day tokyo-night');
		expect(html).toContain('--shiki-dark');
		expect(html).toContain('<svg class="code-icon"');
	});
});
