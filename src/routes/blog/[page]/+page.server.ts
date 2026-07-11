import { error } from '@sveltejs/kit';
import { entries as getEntries } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const prerender = 'auto';
const PAGE_SIZE = 10;
export const entries = async () => {
	const count = Math.ceil((await getEntries()).length / PAGE_SIZE);
	return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
		page: String(index + 2)
	}));
};
export const load: PageServerLoad = async ({ params }) => {
	const page = Number(params.page);
	const all = await getEntries();
	const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
	if (!Number.isInteger(page) || page < 2 || page > totalPages)
		throw error(404, 'Blog page not found');
	return { entries: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, totalPages };
};
