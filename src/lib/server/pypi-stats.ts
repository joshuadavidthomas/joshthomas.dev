import { PYPI_PACKAGES } from './project-packages';

const USER_AGENT = 'joshthomas.dev (https://joshthomas.dev)';
const SNAPSHOT_KEY = 'pypi-stats:v1';
const REQUEST_INTERVAL_MS = 1_000;

export type PyPIStats = {
	lastDay: number;
	lastWeek: number;
	lastMonth: number;
};

type PackageSnapshot = {
	stats: PyPIStats;
	updatedAt: string;
};

type PyPIStatsSnapshot = {
	version: 1;
	packages: Record<string, PackageSnapshot>;
};

function isStats(value: unknown): value is PyPIStats {
	if (value === null || typeof value !== 'object') return false;
	const stats = value as Record<string, unknown>;
	return (
		Number.isFinite(stats.lastDay) &&
		Number.isFinite(stats.lastWeek) &&
		Number.isFinite(stats.lastMonth)
	);
}

function isSnapshot(value: unknown): value is PyPIStatsSnapshot {
	if (value === null || typeof value !== 'object') return false;
	const snapshot = value as Record<string, unknown>;
	if (
		snapshot.version !== 1 ||
		snapshot.packages === null ||
		typeof snapshot.packages !== 'object'
	) {
		return false;
	}
	return Object.values(snapshot.packages).every(
		(value) =>
			value !== null &&
			typeof value === 'object' &&
			typeof (value as PackageSnapshot).updatedAt === 'string' &&
			isStats((value as PackageSnapshot).stats)
	);
}

async function readSnapshot(namespace: KVNamespace): Promise<PyPIStatsSnapshot> {
	const value = await namespace.get(SNAPSHOT_KEY, 'json');
	if (value === null) return { version: 1, packages: {} };
	if (!isSnapshot(value))
		throw new TypeError(`Invalid PyPI statistics snapshot in ${SNAPSHOT_KEY}`);
	return value;
}

async function fetchPackageStats(packageName: string): Promise<PyPIStats> {
	const url = `https://pypistats.org/api/packages/${packageName}/recent`;
	const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
	if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);

	const value: unknown = await response.json();
	const data =
		value !== null && typeof value === 'object'
			? (value as { data?: Record<string, unknown> }).data
			: undefined;
	const stats = {
		lastDay: data?.last_day,
		lastWeek: data?.last_week,
		lastMonth: data?.last_month
	};
	if (!isStats(stats)) throw new TypeError(`Expected valid PyPI statistics for ${packageName}`);
	return stats;
}

function wait(delay: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function refreshPyPIStats(namespace: KVNamespace): Promise<void> {
	const snapshot = await readSnapshot(namespace);
	let refreshed = 0;

	for (const [index, packageName] of PYPI_PACKAGES.entries()) {
		if (index > 0) await wait(REQUEST_INTERVAL_MS);
		try {
			snapshot.packages[packageName] = {
				stats: await fetchPackageStats(packageName),
				updatedAt: new Date().toISOString()
			};
			refreshed += 1;
		} catch (error) {
			console.error(
				JSON.stringify({
					message: 'PyPI statistics refresh failed',
					package: packageName,
					error: error instanceof Error ? error.message : String(error),
					retainedPreviousValue: packageName in snapshot.packages
				})
			);
		}
	}

	if (refreshed === 0) throw new Error('PyPI statistics refresh failed for every package');
	await namespace.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
	console.log(
		JSON.stringify({
			message: 'PyPI statistics snapshot updated',
			refreshed,
			retained: PYPI_PACKAGES.length - refreshed
		})
	);
}

export async function getPyPIStats(
	namespace: KVNamespace,
	packageNames: string[]
): Promise<Record<string, PyPIStats>> {
	const snapshot = await readSnapshot(namespace);
	const stats: Record<string, PyPIStats> = {};
	for (const packageName of packageNames) {
		const value = snapshot.packages[packageName];
		if (!value) {
			throw new Error(
				`PyPI statistics are unavailable for ${packageName}; run the scheduled refresh first`
			);
		}
		stats[packageName] = value.stats;
	}
	return stats;
}
