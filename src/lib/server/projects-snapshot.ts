import getProjects from './projects';
import { developmentProjectData } from './projects-dev';

const SNAPSHOT_KEY = 'projects:v1';

export type ProjectData = Awaited<ReturnType<typeof getProjects>>;

type ProjectsSnapshot = ProjectData & {
	version: 1;
	updatedAt: string;
};

function isSnapshot(value: unknown): value is ProjectsSnapshot {
	if (value === null || typeof value !== 'object') return false;
	const snapshot = value as Record<string, unknown>;
	return (
		snapshot.version === 1 &&
		typeof snapshot.updatedAt === 'string' &&
		Array.isArray(snapshot.projects) &&
		Array.isArray(snapshot.contributions)
	);
}

export async function refreshProjects(
	namespace: KVNamespace,
	token: string | undefined
): Promise<ProjectData> {
	const { projects, contributions } = await getProjects(token, namespace);
	const snapshot: ProjectsSnapshot = {
		version: 1,
		updatedAt: new Date().toISOString(),
		projects,
		contributions
	};
	await namespace.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
	console.log(
		JSON.stringify({
			message: 'Projects snapshot updated',
			projects: projects.length,
			contributions: contributions.length
		})
	);
	return { projects, contributions };
}

export async function readProjects(namespace: KVNamespace): Promise<ProjectData | null> {
	const value = await namespace.get(SNAPSHOT_KEY, 'json');
	if (value === null) return null;
	if (!isSnapshot(value)) throw new TypeError(`Invalid projects snapshot in ${SNAPSHOT_KEY}`);
	return { projects: value.projects, contributions: value.contributions };
}

function isGitHubRateLimit(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes('rate limit exceeded for https://api.github.com/') ||
			error.message.startsWith('403 '))
	);
}

/**
 * Production reads the snapshot the scheduled Worker writes. When no snapshot exists yet, such as
 * right after the first deploy, the request builds and stores it once instead of waiting for cron.
 * Development has no KV snapshot, so it
 * loads live data and falls back to fixtures when the local GitHub API rate limit is reached.
 */
export async function loadProjects(
	env: { GITHUB_TOKEN?: string; PACKAGE_STATS: KVNamespace },
	development: boolean
): Promise<{ data: ProjectData; fixtures: boolean }> {
	if (!development) {
		const data = await readProjects(env.PACKAGE_STATS);
		if (data) return { data, fixtures: false };
		console.warn(`Projects snapshot ${SNAPSHOT_KEY} is missing; building it for this request.`);
		return { data: await refreshProjects(env.PACKAGE_STATS, env.GITHUB_TOKEN), fixtures: false };
	}
	try {
		return { data: await getProjects(env.GITHUB_TOKEN, env.PACKAGE_STATS, true), fixtures: false };
	} catch (error) {
		if (!isGitHubRateLimit(error)) throw error;
		console.warn(
			'GitHub project data is unavailable in development because the API rate limit was reached.'
		);
		return { data: developmentProjectData as ProjectData, fixtures: true };
	}
}
