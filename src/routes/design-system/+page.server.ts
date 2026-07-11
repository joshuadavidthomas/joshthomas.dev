import { renderMarkdownFile } from '$lib/server/content';

export const load = async () => renderMarkdownFile('content/design-system.md');
