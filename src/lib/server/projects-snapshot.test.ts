import { afterEach, describe, expect, it, vi } from 'vitest';
import getProjects from './projects';
import { loadProjects, readProjects, refreshProjects } from './projects-snapshot';

vi.mock('./projects', () => ({ default: vi.fn() }));

const data = {
	projects: [{ name: 'django-bird', stars: 10 }],
	contributions: [{ title: 'Fix a bug', number: 1 }]
};

function namespace(value: unknown = null) {
	const get = vi.fn(async () => value);
	const put = vi.fn(async (_key: string, _value: string) => undefined);
	return { namespace: { get, put } as unknown as KVNamespace, get, put };
}

afterEach(() => {
	vi.resetAllMocks();
});

describe('projects snapshot', () => {
	it('stores the loaded projects and contributions', async () => {
		vi.mocked(getProjects).mockResolvedValue(data as never);
		const kv = namespace();

		await refreshProjects(kv.namespace, 'token');

		expect(getProjects).toHaveBeenCalledWith('token', kv.namespace);
		expect(kv.put).toHaveBeenCalledTimes(1);
		const [key, value] = kv.put.mock.calls[0];
		expect(key).toBe('projects:v1');
		expect(JSON.parse(value)).toMatchObject({ version: 1, ...data });
	});

	it('keeps the previous snapshot when loading fails', async () => {
		vi.mocked(getProjects).mockRejectedValue(new Error('403 rate limit exceeded'));
		const kv = namespace();

		await expect(refreshProjects(kv.namespace, undefined)).rejects.toThrow('403');
		expect(kv.put).not.toHaveBeenCalled();
	});

	it('reads the stored projects and contributions', async () => {
		const kv = namespace({ version: 1, updatedAt: '2026-09-28T04:17:00.000Z', ...data });

		await expect(readProjects(kv.namespace)).resolves.toEqual(data);
	});

	it('returns null for a missing snapshot and rejects an invalid one', async () => {
		await expect(readProjects(namespace().namespace)).resolves.toBeNull();
		await expect(readProjects(namespace({ version: 1 }).namespace)).rejects.toThrow('Invalid');
	});

	it('builds and stores a missing snapshot once in production', async () => {
		vi.mocked(getProjects).mockResolvedValue(data as never);
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		const kv = namespace();

		await expect(
			loadProjects({ GITHUB_TOKEN: 'token', PACKAGE_STATS: kv.namespace }, false)
		).resolves.toEqual({ data, fixtures: false });
		expect(getProjects).toHaveBeenCalledWith('token', kv.namespace);
		expect(kv.put).toHaveBeenCalledTimes(1);
	});

	it('serves production requests from the snapshot without upstream calls', async () => {
		const kv = namespace({ version: 1, updatedAt: '2026-09-28T04:17:00.000Z', ...data });

		await expect(loadProjects({ PACKAGE_STATS: kv.namespace }, false)).resolves.toEqual({
			data,
			fixtures: false
		});
		expect(getProjects).not.toHaveBeenCalled();
	});

	it('falls back to fixtures when development hits the GitHub rate limit', async () => {
		vi.mocked(getProjects).mockRejectedValue(
			new Error('403 Forbidden for https://api.github.com/')
		);
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		const result = await loadProjects({ PACKAGE_STATS: namespace().namespace }, true);

		expect(result.fixtures).toBe(true);
		expect(result.data.projects.length).toBeGreaterThan(0);
	});
});
