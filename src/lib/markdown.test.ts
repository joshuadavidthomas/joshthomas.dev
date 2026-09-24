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

	it('renders task list and standalone checkbox states', async () => {
		const html = await renderMarkdown(
			'- [ ] To do\n  - [X] Done\n- [-] In progress\n\n[ ] Standalone\n\nNot a task [x]'
		);
		expect(html.match(/class="task-list-checkbox"/g)).toHaveLength(4);
		expect(html.match(/class="task-list-item"/g)).toHaveLength(3);
		expect(html).toContain('aria-checked="false"');
		expect(html).toContain('aria-checked="true"');
		expect(html).toContain('aria-checked="mixed"');
		expect(html).toContain('Not a task [x]');
		expect(html).not.toContain('[ ] To do');
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
		const html = await renderMarkdown(markdown, 1);
		for (let level = 2; level <= 6; level += 1) {
			expect(html).toContain(`<h${level} id="heading-${level - 1}" tabindex="-1">`);
		}
		expect(html).not.toContain('<h1');
	});

	it('places section headings at the requested depth without changing anchors or code', async () => {
		const source =
			'# Group {#stable}\n\n## Project\n\n##### Deep\n\n###### Deepest\n\n```text\n# Not a heading\n```';
		const html = await renderMarkdown(source, 2);
		expect(html).toContain('<h3 id="stable"');
		expect(html).toContain('href="#stable"');
		expect(html).toContain('Group</h3>');
		expect(html).toContain('<h4 id="project"');
		expect(html).toContain('Project</h4>');
		expect(html).toContain('<h6 id="deep"');
		expect(html).toContain('<h6 id="deepest"');
		expect(html).not.toMatch(/<\/?h[78]/);
		expect(html).toContain('# Not a heading');
		const unshifted = await renderMarkdown('# Group {#stable}');
		expect(unshifted).toContain('<h1 id="stable"');
	});

	it('renders code blocks with paired Shiki themes and the code icon', async () => {
		const html = await renderMarkdown('```typescript\nconst answer = 42;\n```');
		expect(html).toContain('shiki-themes warm-light warm-dark');
		expect(html).toContain('--shiki-dark');
		expect(html).toMatch(/color:#8B4933;[^>]*--shiki-dark:#DCA58B[^>]*>const</);
		expect(html).toMatch(/color:#806032;[^>]*--shiki-dark:#D4B381[^>]*>\s*42</);
		expect(html).toMatch(/--shiki-tokyo-day:#7847BD;[^>]*--shiki-tokyo-moon:#FCA7EA[^>]*>const</);
		expect(html).toMatch(/--shiki-tokyo-day:#B15C00;[^>]*--shiki-tokyo-moon:#FF966C[^>]*>\s*42</);
		expect(html).toContain('--shiki-tokyo-moon-bg:#1e2030');
		expect(html).toContain('--shiki-latte-bg:#eff1f5');
		expect(html).toContain('--shiki-mocha-bg:#1e1e2e');
		expect(html).toMatch(/--shiki-dracula-bg:#282a36/i);
		expect(html).toMatch(
			/--shiki-latte:#FE640B;[^>]*--shiki-mocha:#FAB387;[^>]*--shiki-dracula:#BD93F9[^>]*>\s*42</
		);
		expect(html).toContain('--shiki-django-bg:#f8f8f8');
		expect(html).toContain('--shiki-django-dark-bg:#181d27');
		expect(html).toContain('--shiki-admin-bg:#f8f8f8');
		expect(html).toContain('--shiki-admin-dark-bg:#212121');
		expect(html).toContain('--shiki-djangonaut-bg:#ffffff');
		expect(html).toContain('--shiki-alucard-bg:#fffbeb');
		expect(html).toMatch(/--shiki-alucard:#A3144D[^>]*>const</);
		expect(html).toContain('--shiki-djangonaut-dark-bg:#1a1025');
		expect(html).toMatch(/--shiki-djangonaut:#5C0287[^>]*>const</);
		expect(html).toMatch(/--shiki-django:#008000;--shiki-django-font-weight:bold[^>]*>const</);
		expect(html).toContain('<svg class="code-icon"');
	});

	it('keeps TokyoNight comments, types, and parameters distinct', async () => {
		const html = await renderMarkdown(
			'```typescript\n// A comment\ninterface Person {}\nfunction greet(name: string) { return true; }\n```'
		);
		expect(html).toMatch(
			/--shiki-tokyo-day:#848CB5;--shiki-tokyo-day-font-style:italic;--shiki-tokyo-moon:#636DA6;--shiki-tokyo-moon-font-style:italic[^>]*>\/\/ A comment</
		);
		expect(html).toMatch(
			/--shiki-tokyo-day:#188092;[^>]*--shiki-tokyo-moon:#65BCFF[^>]*>\s*Person</
		);
		expect(html).toMatch(/--shiki-tokyo-day:#8C6C3E;[^>]*--shiki-tokyo-moon:#FFC777[^>]*>name</);
		expect(html).toMatch(/--shiki-tokyo-day:#B15C00;--shiki-tokyo-moon:#FF966C[^>]*>\s*true</);
	});
});
