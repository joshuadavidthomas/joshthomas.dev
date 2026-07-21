import { afterEach, describe, expect, it, vi } from 'vitest';
import { PYPI_PACKAGES } from './project-packages';
import { getPyPIStats, refreshPyPIStats } from './pypi-stats';

const previous = {
	version: 1,
	packages: {
		'mcp-django': {
			stats: { lastDay: 1, lastWeek: 7, lastMonth: 30 },
			updatedAt: '2026-07-28T04:17:00.000Z'
		}
	}
};

function namespace(value: unknown = null) {
	const get = vi.fn(async () => value);
	const put = vi.fn(async (_key: string, _value: string) => undefined);
	return { namespace: { get, put } as unknown as KVNamespace, get, put };
}

function urlOf(input: RequestInfo | URL) {
	return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('PyPI statistics snapshot', () => {
	it('reads requested package statistics with one KV lookup', async () => {
		const kv = namespace(previous);

		await expect(getPyPIStats(kv.namespace, ['mcp-django'])).resolves.toEqual({
			'mcp-django': { lastDay: 1, lastWeek: 7, lastMonth: 30 }
		});
		expect(kv.get).toHaveBeenCalledTimes(1);
	});

	it('retains the last successful value when a refresh is rate limited', async () => {
		const kv = namespace(previous);
		vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
			callback();
			return 0;
		}) as typeof setTimeout);
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo | URL) => {
				const packageName = /packages\/([^/]+)\/recent/.exec(urlOf(input))?.[1];
				if (packageName === 'mcp-django') {
					return Response.json({ message: 'slow down' }, { status: 429 });
				}
				return Response.json({
					data: { last_day: 2, last_week: 14, last_month: 60 }
				});
			})
		);

		await refreshPyPIStats(kv.namespace);

		expect(fetch).toHaveBeenCalledTimes(PYPI_PACKAGES.length);
		expect(kv.put).toHaveBeenCalledTimes(1);
		const written = JSON.parse(kv.put.mock.calls[0][1] as string);
		expect(written.packages['mcp-django']).toEqual(previous.packages['mcp-django']);
		expect(written.packages['django-bird'].stats).toEqual({
			lastDay: 2,
			lastWeek: 14,
			lastMonth: 60
		});
	});

	it('does not replace the snapshot when every refresh fails', async () => {
		const kv = namespace(previous);
		vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
			callback();
			return 0;
		}) as typeof setTimeout);
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Response.json({ message: 'slow down' }, { status: 429 }))
		);

		await expect(refreshPyPIStats(kv.namespace)).rejects.toThrow('failed for every package');
		expect(kv.put).not.toHaveBeenCalled();
	});
});
