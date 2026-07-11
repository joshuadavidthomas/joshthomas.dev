import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { entries as getEntries, findEntry } from '$lib/server/content';

export const entries = async () =>
	(await getEntries())
		.filter((entry) => entry.type === 'post')
		.map((entry) => ({ year: entry.date.slice(0, 4), slug: entry.slug }));
export const load: PageServerLoad = async ({ params }) => {
	const entry = await findEntry('post', params.slug, params.year);
	if (!entry) throw error(404, 'Post not found');
	return { entry };
};
