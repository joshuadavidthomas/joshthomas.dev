import { getEntry } from 'astro:content';
import tailwindTheme from 'tailwindcss/theme.css?raw';
import colorsCss from './styles/colors.css?raw';
import { renderMarkdown } from './markdown';

function renderColorSwatches() {
	const styles = [tailwindTheme, colorsCss];
	const colors = new Map<string, string>();
	for (const css of styles) {
		for (const match of css.matchAll(/--color-([^:]+):\s*([^;]+);/g)) {
			colors.set(match[1], match[2].trim());
		}
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

export async function renderDesignSystem() {
	const entry = await getEntry('design', 'design-system');
	if (!entry) throw new Error('Design system content was not found');
	const content = (entry.body ?? '').replace(
		/<!-- color-swatches-start -->[\s\S]*<!-- color-swatches-end -->/,
		`<!-- color-swatches-start -->\n\n${renderColorSwatches()}\n\n<!-- color-swatches-end -->`
	);
	return renderMarkdown(content);
}
