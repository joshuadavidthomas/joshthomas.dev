import { entries } from '$lib/server/content';

const PAGE_SIZE = 10;
export const load = async () => {
	const all = await entries();
	return {
		entries: all.slice(0, PAGE_SIZE),
		page: 1,
		totalPages: Math.max(1, Math.ceil(all.length / PAGE_SIZE))
	};
};
