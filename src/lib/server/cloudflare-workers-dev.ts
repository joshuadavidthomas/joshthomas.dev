const packageStats = {
	get: async () => null
} as unknown as KVNamespace;

export const env = {
	GITHUB_TOKEN: process.env.GITHUB_TOKEN,
	PACKAGE_STATS: packageStats
};
