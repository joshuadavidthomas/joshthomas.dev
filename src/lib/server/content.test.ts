import { describe, expect, it } from 'vite-plus/test';
import { entries, renderMarkdownFile } from './content';

describe('content collection', () => {
	it('preserves published post and TIL URLs', async () => {
		const urls = (await entries()).map((entry) => entry.url);
		expect(urls).toContain('/blog/2025/open-source-is-a-gift/');
		expect(urls).toContain('/til/direnv/using-direnv-to-add-a-personal-gitignore-file-to-repos/');
	});

	it('renders inline title markup and enhanced Markdown', async () => {
		const til = (await entries()).find((entry) => entry.type === 'til');
		expect(til?.titleHtml).toContain('<code>.gitignore</code>');
		const design = await renderMarkdownFile('content/design-system.md');
		expect(design.html).toContain('markdown-alert-documentation');
		expect(design.html).toContain('markdown-alert-tldr');
		expect(design.html).toContain('<svg class="alert-icon"');
		expect(design.html).toContain('footnotes');
		expect(design.html).toContain('header-anchor');
	});

	it('renders code blocks with paired Shiki themes', async () => {
		const post = (await entries()).find(
			(entry) =>
				entry.url ===
				'/blog/2024/debugging-a-no-time-zone-found-error-while-using-the-official-playwright-docker-image/'
		);
		expect(post?.html).toContain('shiki-themes tokyo-night-day tokyo-night');
		expect(post?.html).toContain('--shiki-dark');
	});
});
