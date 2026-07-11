import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { entries as getEntries, findEntry } from '$lib/server/content';

export const entries = async () =>
	(await getEntries())
		.filter((entry) => entry.type === 'til')
		.map((entry) => ({ category: entry.category!, slug: entry.slug }));
export const load: PageServerLoad = async ({ params }) => {
	const entry = await findEntry('til', params.slug, params.category);
	if (!entry) throw error(404, 'TIL not found');
	return { entry };
};
