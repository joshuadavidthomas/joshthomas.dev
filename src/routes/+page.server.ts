import { entries } from '$lib/server/content';
export const load = async () => ({
	latest: (await entries()).find((entry) => entry.type === 'post')
});
