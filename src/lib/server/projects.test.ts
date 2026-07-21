import { afterEach, describe, expect, it, vi } from 'vitest';
import getProjects from './projects';

type FetchStub = (input: RequestInfo | URL) => Response | Promise<Response>;

const repo = (name: string, stars: number, owner = 'joshuadavidthomas') => ({
	name,
	full_name: `${owner}/${name}`,
	description: `${name} description`,
	html_url: `https://github.com/${owner}/${name}`,
	homepage: null,
	stargazers_count: stars,
	forks_count: 2,
	topics: ['astro'],
	fork: false
});

function urlOf(input: RequestInfo | URL) {
	return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
	return Response.json(data, { status, headers });
}

function crateStats(downloads = 1) {
	return {
		version_downloads: [{ date: '2026-07-22', downloads }],
		meta: { extra_downloads: [] }
	};
}

function installFetch(stub: FetchStub) {
	vi.stubGlobal(
		'fetch',
		vi.fn((input: RequestInfo | URL) => stub(input))
	);
}

function installImmediateTimers() {
	return vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
		callback();
		return 0;
	}) as typeof setTimeout);
}

function packageStats(
	packages: Record<string, { lastDay: number; lastWeek: number; lastMonth: number }>
) {
	const get = vi.fn(async () => ({
		version: 1,
		packages: Object.fromEntries(
			Object.entries(packages).map(([name, stats]) => [
				name,
				{ stats, updatedAt: '2026-07-29T04:17:00.000Z' }
			])
		)
	}));
	return { namespace: { get } as unknown as KVNamespace, get };
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('getProjects', () => {
	it('rejects when the personal project list fails', async () => {
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json({ message: 'rate limited' }, 403);
			}
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow('403');
	});

	it('retries a network failure before loading projects', async () => {
		const projectRepo = repo('project', 12);
		const timeout = installImmediateTimers();
		let projectListRequests = 0;
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				projectListRequests += 1;
				if (projectListRequests === 1) throw new TypeError('network unavailable');
				return json([projectRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/languages')) return json({});
			if (url.endsWith('/releases?per_page=100')) return json([]);
			if (url.includes('/search/issues')) return json({ items: [] });
			throw new Error(`Unexpected request: ${url}`);
		});

		const data = await getProjects(undefined, undefined);
		expect(timeout).toHaveBeenCalledWith(expect.any(Function), 250);
		expect(projectListRequests).toBe(2);
		expect(data.projects).toHaveLength(1);
	});

	it('rejects malformed personal repository records', async () => {
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([{ ...repo('malformed', 8), full_name: null }]);
			}
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow('valid repository records');
	});

	it('rejects malformed organization repository records', async () => {
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) return json([]);
			if (url.includes('/orgs/westerveltco/repos')) {
				return json([{ ...repo('malformed', 8, 'westerveltco'), topics: null }]);
			}
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow('valid repository records');
	});

	it('rejects malformed contributor records', async () => {
		const orgRepo = repo('work-project', 8, 'westerveltco');
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) return json([]);
			if (url.includes('/orgs/westerveltco/repos')) return json([orgRepo]);
			if (url.includes('/work-project/contributors')) return json([{ login: null }]);
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow('valid contributor records');
	});

	it('rejects when a declared package is missing from the snapshot', async () => {
		const projectRepo = repo('mcp-django', 12);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([projectRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, packageStats({}).namespace)).rejects.toThrow(
			'PyPI statistics are unavailable for mcp-django'
		);
	});

	it('uses declared package names and reads PyPI statistics from the snapshot', async () => {
		const pythonRepo = repo('mcp-django', 12);
		const npmRepo = repo('sveltekit-adapter-cloudflare', 10);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([pythonRepo, npmRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/languages')) return json({});
			if (
				url.includes(
					'api.npmjs.org/downloads/point/last-day/%40joshthomas%2Fsveltekit-adapter-cloudflare'
				)
			) {
				return json({ downloads: 20 });
			}
			if (
				url.includes(
					'api.npmjs.org/downloads/point/last-week/%40joshthomas%2Fsveltekit-adapter-cloudflare'
				)
			) {
				return json({ downloads: 140 });
			}
			if (
				url.includes(
					'api.npmjs.org/downloads/point/last-month/%40joshthomas%2Fsveltekit-adapter-cloudflare'
				)
			) {
				return json({ downloads: 600 });
			}
			if (url.endsWith('/releases?per_page=100')) return json([]);
			if (url.includes('/search/issues')) return json({ items: [] });
			throw new Error(`Unexpected request: ${url}`);
		});

		const stats = packageStats({
			'mcp-django': { lastDay: 10, lastWeek: 70, lastMonth: 300 }
		});
		const data = await getProjects(undefined, stats.namespace);
		expect(stats.get).toHaveBeenCalledTimes(1);
		expect(data.projects).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					fullName: 'joshuadavidthomas/mcp-django',
					pypiPackage: 'mcp-django',
					pypiStats: { lastDay: 10, lastWeek: 70, lastMonth: 300 }
				}),
				expect.objectContaining({
					fullName: 'joshuadavidthomas/sveltekit-adapter-cloudflare',
					npmPackage: '@joshthomas/sveltekit-adapter-cloudflare',
					npmStats: { lastDay: 20, lastWeek: 140, lastMonth: 600 }
				})
			])
		);
	});

	it('returns declared crates.io and Zed extension statistics', async () => {
		const crateRepo = repo('kbd', 12);
		const zedRepo = repo('zed-django', 10);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([crateRepo, zedRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/languages')) return json({});
			if (url.startsWith('https://crates.io/api/v1/crates/')) return json(crateStats());
			if (url.includes('api.zed.dev/extensions?filter=django')) {
				return json({ data: [{ id: 'django', download_count: 123 }] });
			}
			if (url.endsWith('/releases?per_page=100')) return json([]);
			if (url.includes('/search/issues')) return json({ items: [] });
			throw new Error(`Unexpected request: ${url}`);
		});

		const data = await getProjects(undefined, undefined);
		const crateProject = data.projects.find((project) => project.name === 'kbd');
		expect(crateProject?.cratesIOCrates.map((crate) => crate.name)).toEqual([
			'kbd',
			'kbd-crossterm',
			'kbd-egui',
			'kbd-evdev',
			'kbd-global',
			'kbd-iced',
			'kbd-tao',
			'kbd-winit'
		]);
		expect(crateProject?.cratesIOCrates[0].stats).toEqual({
			lastDay: 1,
			lastWeek: 1,
			lastMonth: 1
		});
		expect(data.projects.find((project) => project.name === 'zed-django')).toMatchObject({
			zedExtension: 'django',
			zedStats: { totalDownloads: 123 }
		});
	});

	it('rejects malformed statistics for a declared crate', async () => {
		const projectRepo = repo('kbd', 12);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([projectRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/kbd/languages')) return json({});
			if (url.includes('crates.io/api/v1/crates/kbd/downloads')) return json({});
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow(
			'valid crates.io statistics for kbd'
		);
	});

	it('rejects malformed statistics for a declared Zed extension', async () => {
		const projectRepo = repo('zed-django', 12);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([projectRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/zed-django/languages')) return json({});
			if (url.endsWith('/zed-django/releases?per_page=100')) return json([]);
			if (url.includes('api.zed.dev/extensions?filter=django')) return json({ data: [] });
			throw new Error(`Unexpected request: ${url}`);
		});

		await expect(getProjects(undefined, undefined)).rejects.toThrow(
			'valid Zed extension statistics for django'
		);
	});

	it('keeps projects when optional contributions fail', async () => {
		const projectRepo = repo('project', 12);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([projectRepo]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/languages')) return json({});
			if (url.endsWith('/releases?per_page=100')) return json([]);
			if (url.includes('/search/issues')) return json({ items: 'malformed' });
			throw new Error(`Unexpected request: ${url}`);
		});

		const data = await getProjects(undefined, undefined);
		expect(data.projects).toHaveLength(1);
		expect(data.contributions).toEqual([]);
	});

	it('returns sorted projects and only merged contributions', async () => {
		const lower = repo('lower-stars', 6);
		const higher = repo('higher-stars', 20);
		installFetch((input) => {
			const url = urlOf(input);
			if (url.includes('/users/joshuadavidthomas/repos?sort=pushed')) {
				return json([lower, higher]);
			}
			if (url.includes('/orgs/westerveltco/repos')) return json([]);
			if (url.endsWith('/languages')) return json({});
			if (url.endsWith('/releases?per_page=100')) return json([]);
			if (url.includes('/search/issues')) {
				return json({
					items: [
						{
							repository_url: 'https://api.github.com/repos/withastro/astro',
							html_url: 'https://github.com/withastro/astro/pull/1',
							number: 1,
							title: 'Improve Astro',
							pull_request: { merged_at: '2026-07-21T00:00:00Z' }
						},
						{
							repository_url: 'https://api.github.com/repos/withastro/astro',
							html_url: 'https://github.com/withastro/astro/pull/2',
							number: 2,
							title: 'Unmerged Astro change',
							pull_request: { merged_at: null }
						}
					]
				});
			}
			throw new Error(`Unexpected request: ${url}`);
		});

		const data = await getProjects(undefined, undefined);
		expect(data.projects.map((project) => project.fullName)).toEqual([
			'joshuadavidthomas/higher-stars',
			'joshuadavidthomas/lower-stars'
		]);
		expect(data.projects[0]).toEqual({
			name: 'higher-stars',
			fullName: 'joshuadavidthomas/higher-stars',
			description: 'higher-stars description',
			url: 'https://github.com/joshuadavidthomas/higher-stars',
			homepage: null,
			topics: ['astro'],
			stars: 20,
			forks: 2,
			languages: [],
			pypiPackage: null,
			pypiStats: null,
			npmPackage: null,
			npmStats: null,
			cratesIOCrates: [],
			releaseDownloads: null,
			zedExtension: null,
			zedStats: null
		});
		expect(data.contributions).toEqual([
			{
				title: 'Improve Astro',
				url: 'https://github.com/withastro/astro/pull/1',
				repoFullName: 'withastro/astro',
				repoUrl: 'https://github.com/withastro/astro',
				number: 1
			}
		]);
	});
});
