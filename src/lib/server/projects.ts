// @ts-nocheck

import { PROJECT_PACKAGES } from './project-packages';
import { getPyPIStats } from './pypi-stats';

const USER_AGENT = 'joshthomas.dev (https://joshthomas.dev)';
const RETRY_DELAYS_MS = [250, 1_000];
const MAX_RETRY_WAIT_MS = 30_000;

function retryDelay(response: Response, attempt: number) {
	const retryAfter = response.headers.get('Retry-After');
	if (retryAfter) {
		const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1_000 : Number.NaN;
		const date = Number.isNaN(seconds) ? Date.parse(retryAfter) - Date.now() : Number.NaN;
		const delay = Number.isNaN(seconds) ? date : seconds;
		if (Number.isFinite(delay)) {
			const nonNegativeDelay = Math.max(0, delay);
			return nonNegativeDelay <= MAX_RETRY_WAIT_MS ? nonNegativeDelay : null;
		}
	}
	return RETRY_DELAYS_MS[attempt];
}

function wait(delay: number) {
	return new Promise((resolve) => setTimeout(resolve, delay));
}

function responseError(response: Response, url: string) {
	return new Error(`${response.status} ${response.statusText} for ${url}`);
}

async function fetchJsonWithRetry(url: string, options: RequestInit = {}) {
	for (let attempt = 0; ; attempt += 1) {
		let response;
		try {
			response = await fetch(url, options);
		} catch (error) {
			if (attempt >= RETRY_DELAYS_MS.length) throw error;
			await wait(RETRY_DELAYS_MS[attempt]);
			continue;
		}

		if (response.ok) return response.json();
		const retryable = response.status === 429 || (response.status >= 500 && response.status < 600);
		if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw responseError(response, url);
		const delay = retryDelay(response, attempt);
		if (delay === null) throw responseError(response, url);
		await wait(delay);
	}
}

/**
 * @typedef {Object} GitHubRepo
 * @property {string} name - Repository name
 * @property {string} full_name - Full repository name (owner/repo)
 * @property {string} description - Repository description
 * @property {string} html_url - Repository URL
 * @property {string|null} homepage - Repository homepage URL
 * @property {number} stargazers_count - Number of stars
 * @property {number} forks_count - Number of forks
 * @property {string[]} topics - Repository topics/tags
 * @property {boolean} fork - Whether this is a fork
 */

/**
 * @typedef {Object} PRContribution
 * @property {string} title - PR title
 * @property {string} url - PR URL
 * @property {string} repoFullName - Full repository name (owner/repo)
 * @property {string} repoUrl - Repository URL
 * @property {number} number - PR number
 */

/**
 * @typedef {Object} Language
 * @property {string} name - Language name
 * @property {string} icon - Devicon class name
 */

/**
 * @typedef {Object} PyPIStats
 * @property {number} lastDay - Downloads in the last day
 * @property {number} lastWeek - Downloads in the last week
 * @property {number} lastMonth - Downloads in the last month
 */

/**
 * @typedef {Object} NPMStats
 * @property {number} lastDay - Downloads in the last day
 * @property {number} lastWeek - Downloads in the last week
 * @property {number} lastMonth - Downloads in the last month
 */

/**
 * @typedef {Object} CratesIOStats
 * @property {number} lastDay - Downloads in the last day
 * @property {number} lastWeek - Downloads in the last week
 * @property {number} lastMonth - Downloads in the last month
 */

/**
 * @typedef {Object} ZedStats
 * @property {number} totalDownloads - Total downloads for the extension
 */

/**
 * @typedef {Object} Project
 * @property {string} name - Project name
 * @property {string} fullName - Full repository name (owner/repo)
 * @property {string} description - Project description
 * @property {string} url - Project URL
 * @property {string|null} homepage - Project homepage
 * @property {string[]} topics - Project topics
 * @property {number} stars - Number of stars
 * @property {number} forks - Number of forks
 * @property {Language[]} languages - Languages used in the project
 * @property {string|null} pypiPackage - PyPI package name if available
 * @property {PyPIStats|null} pypiStats - PyPI download statistics
 * @property {string|null} npmPackage - npm package name if available
 * @property {NPMStats|null} npmStats - npm download statistics
 * @property {Array<{name: string, stats: CratesIOStats}>} cratesIOCrates - crates.io crates with individual download statistics
 * @property {number|null} releaseDownloads - Total GitHub release asset downloads
 * @property {string|null} zedExtension - Zed extension ID if available
 * @property {ZedStats|null} zedStats - Zed extension download statistics
 */

const GITHUB_USERNAME = 'joshuadavidthomas';
const MIN_STARS = 4; // Minimum stars for a repo to be included
const MAX_LANGUAGES = 4; // Maximum number of languages to display per project
const MAX_PRS_TO_FETCH = 100; // Maximum number of PRs to fetch from GitHub
const MAX_CONTRIBUTIONS = 10; // Maximum number of PR contributions to display
const WORK_ORGS = ['westerveltco']; // Organizations to include as work projects
const MIN_ORG_CONTRIBUTION_RANK = 5; // Only include org repos where user is in top N contributors
const EXCLUDED_ORGS = ['westerveltco']; // Organizations to exclude from PR contributions
const EXCLUDED_REPOS = ['neovim/nvim-lspconfig', 'zed-industries/extensions']; // Repositories to exclude from contributions
/**
 * Map language names to devicon class names
 * @param {string} language - Language name from GitHub
 * @returns {string} Devicon class name
 */
function getDeviconClass(language) {
	const languageMap = {
		Angular: 'angularjs',
		C: 'c',
		'C#': 'csharp',
		'C++': 'cplusplus',
		CSS: 'css3',
		Clojure: 'clojure',
		Dart: 'dart',
		Docker: 'docker',
		Elixir: 'elixir',
		Erlang: 'erlang',
		Go: 'go',
		HTML: 'html5',
		Haskell: 'haskell',
		Java: 'java',
		JavaScript: 'javascript',
		Jupyter: 'jupyter',
		Kotlin: 'kotlin',
		Lua: 'lua',
		Markdown: 'markdown',
		Nix: 'nixos',
		PHP: 'php',
		Perl: 'perl',
		PowerShell: 'powershell',
		Python: 'python',
		R: 'r',
		React: 'react',
		Ruby: 'ruby',
		Rust: 'rust',
		SCSS: 'sass',
		Scala: 'scala',
		Shell: 'bash',
		Svelte: 'svelte',
		Swift: 'swift',
		TypeScript: 'typescript',
		Vim: 'vim',
		Vue: 'vuejs'
	};
	const deviconLang = languageMap[language] || 'github';

	const deviconStyleMap = {
		rust: 'colored dark:var(--tw-invert)'
	};
	const deviconStyle = deviconStyleMap[deviconLang] || 'colored';

	return `devicon-${deviconLang}-plain ${deviconStyle}`;
}

/**
 * Fetch data from the GitHub API.
 * @async
 * @param {string} url - GitHub API URL
 * @returns {Promise<any>} API response data
 */
async function fetchFromGitHubApi(url, token) {
	const headers = { 'User-Agent': USER_AGENT };
	if (token) headers.Authorization = `Bearer ${token}`;
	return fetchJsonWithRetry(url, { headers });
}

function isGitHubRepository(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof value.name === 'string' &&
		typeof value.full_name === 'string' &&
		(value.description === null || typeof value.description === 'string') &&
		typeof value.html_url === 'string' &&
		(value.homepage === null || typeof value.homepage === 'string') &&
		Number.isFinite(value.stargazers_count) &&
		Number.isFinite(value.forks_count) &&
		Array.isArray(value.topics) &&
		value.topics.every((topic) => typeof topic === 'string') &&
		typeof value.fork === 'boolean'
	);
}

async function fetchRequiredGitHubRepositories(url, token) {
	const data = await fetchFromGitHubApi(url, token);
	if (!Array.isArray(data) || !data.every(isGitHubRepository)) {
		throw new TypeError(`Expected valid repository records from GitHub API: ${url}`);
	}
	return data;
}

async function fetchRequiredGitHubContributors(url, token) {
	const data = await fetchFromGitHubApi(url, token);
	if (
		!Array.isArray(data) ||
		!data.every(
			(contributor) =>
				contributor !== null &&
				typeof contributor === 'object' &&
				typeof contributor.login === 'string'
		)
	) {
		throw new TypeError(`Expected valid contributor records from GitHub API: ${url}`);
	}
	return data;
}

/**
 * Fetch required PyPI download statistics for a declared package.
 * @async
 * @param {string} packageName - PyPI package name
 * @returns {Promise<PyPIStats>} Download statistics
 */
/**
 * Fetch required npm download statistics for a declared package.
 * @async
 * @param {string} packageName - npm package name
 * @returns {Promise<NPMStats>} Download statistics
 */
async function fetchNPMStats(packageName) {
	const encodedName = encodeURIComponent(packageName);
	const options = { headers: { 'User-Agent': USER_AGENT } };
	const [lastDayData, lastWeekData, lastMonthData] = await Promise.all([
		fetchJsonWithRetry(`https://api.npmjs.org/downloads/point/last-day/${encodedName}`, options),
		fetchJsonWithRetry(`https://api.npmjs.org/downloads/point/last-week/${encodedName}`, options),
		fetchJsonWithRetry(`https://api.npmjs.org/downloads/point/last-month/${encodedName}`, options)
	]);
	if (
		!Number.isFinite(lastDayData?.downloads) ||
		!Number.isFinite(lastWeekData?.downloads) ||
		!Number.isFinite(lastMonthData?.downloads)
	) {
		throw new TypeError(`Expected valid npm statistics for ${packageName}`);
	}
	return {
		lastDay: lastDayData.downloads,
		lastWeek: lastWeekData.downloads,
		lastMonth: lastMonthData.downloads
	};
}

/**
 * Fetch required crates.io download statistics for a declared crate.
 * @async
 * @param {string} crateName - crates.io crate name
 * @returns {Promise<CratesIOStats>} Download statistics
 */
async function fetchCratesIOStats(crateName) {
	const data = await fetchJsonWithRetry(`https://crates.io/api/v1/crates/${crateName}/downloads`, {
		headers: { 'User-Agent': USER_AGENT }
	});
	const versionDownloads = data?.version_downloads;
	const extraDownloads = data?.meta?.extra_downloads;
	const validEntry = (entry) => typeof entry?.date === 'string' && Number.isFinite(entry.downloads);
	if (
		!Array.isArray(versionDownloads) ||
		!versionDownloads.every(validEntry) ||
		!Array.isArray(extraDownloads) ||
		!extraDownloads.every(validEntry)
	) {
		throw new TypeError(`Expected valid crates.io statistics for ${crateName}`);
	}

	const dailyTotals = {};
	for (const entry of [...versionDownloads, ...extraDownloads]) {
		dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.downloads;
	}
	const dates = Object.keys(dailyTotals).sort().reverse();
	return {
		lastDay: dates.length > 0 ? dailyTotals[dates[0]] : 0,
		lastWeek: dates.slice(0, 7).reduce((sum, date) => sum + dailyTotals[date], 0),
		lastMonth: dates.slice(0, 30).reduce((sum, date) => sum + dailyTotals[date], 0)
	};
}

/**
 * Fetch total download count across all GitHub release assets
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<number|null>} Total downloads or null if no releases
 */
async function fetchReleaseDownloads(fullName, token) {
	try {
		const releases = await fetchFromGitHubApi(
			`https://api.github.com/repos/${fullName}/releases?per_page=100`,
			token
		);
		if (!Array.isArray(releases) || releases.length === 0) return null;

		const checksumExts = ['.sha256', '.sha512', '.md5', '.asc', '.sig'];
		let total = 0;
		for (const release of releases) {
			if (!release.assets) continue;
			for (const asset of release.assets) {
				const isChecksum = checksumExts.some((ext) => asset.name.endsWith(ext));
				if (!isChecksum) total += asset.download_count;
			}
		}
		return total > 0 ? total : null;
	} catch (error) {
		console.warn(`Failed to fetch release downloads for ${fullName}:`, error.message);
		return null;
	}
}

/**
 * Fetch required download statistics for a declared Zed extension.
 * @async
 * @param {string} extensionId - Zed extension ID
 * @returns {Promise<ZedStats>} Download statistics
 */
async function fetchZedExtensionStats(extensionId) {
	const data = await fetchJsonWithRetry(`https://api.zed.dev/extensions?filter=${extensionId}`, {
		headers: { 'User-Agent': USER_AGENT }
	});
	const extension = Array.isArray(data?.data)
		? data.data.find((candidate) => candidate.id === extensionId)
		: undefined;
	if (!Number.isFinite(extension?.download_count)) {
		throw new TypeError(`Expected valid Zed extension statistics for ${extensionId}`);
	}
	return { totalDownloads: extension.download_count };
}

/**
 * Fetch languages for a repository
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<Language[]>} Array of languages sorted by bytes
 */
async function fetchRepoLanguages(fullName, token) {
	try {
		const languagesData = await fetchFromGitHubApi(
			`https://api.github.com/repos/${fullName}/languages`,
			token
		);
		if (!languagesData || typeof languagesData !== 'object' || Array.isArray(languagesData)) {
			throw new TypeError(`Expected a language map for ${fullName}`);
		}
		return Object.entries(languagesData)
			.map(([name, bytes]) => ({ name, bytes }))
			.sort((a, b) => b.bytes - a.bytes)
			.slice(0, MAX_LANGUAGES)
			.map(({ name }) => ({ name, icon: getDeviconClass(name) }));
	} catch (error) {
		console.warn(`Failed to fetch languages for ${fullName}:`, error.message);
		return [];
	}
}

/**
 * Check if user is a top contributor to a repository
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<boolean>} True if user is in top contributors
 */
async function isTopContributor(fullName, token) {
	const contributors = await fetchRequiredGitHubContributors(
		`https://api.github.com/repos/${fullName}/contributors?per_page=${MIN_ORG_CONTRIBUTION_RANK}`,
		token
	);
	return contributors.some((contributor) => contributor.login === GITHUB_USERNAME);
}

/**
 * Fetch and transform public repositories from an organization where user is a top contributor
 * @async
 * @param {string} org - Organization name
 * @returns {Promise<Project[]>} Array of project objects
 */
async function fetchOrgProjectRepos(org, token) {
	const orgRepos = await fetchRequiredGitHubRepositories(
		`https://api.github.com/orgs/${org}/repos?type=public&per_page=100`,
		token
	);
	const projectRepos = [];
	for (const repo of orgRepos) {
		if (repo.fork || repo.stargazers_count < MIN_STARS) continue;
		if (await isTopContributor(repo.full_name, token)) projectRepos.push(repo);
	}
	return projectRepos;
}

/**
 * Fetch and transform user's own repositories
 * @async
 * @returns {Promise<Project[]>} Array of project objects
 */
async function fetchUserProjectRepos(token) {
	const userRepos = await fetchRequiredGitHubRepositories(
		`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=100`,
		token
	);
	return userRepos.filter((repo) => !repo.fork && repo.stargazers_count >= MIN_STARS);
}

async function fetchProjectRepos(token) {
	const projectRepos = await fetchUserProjectRepos(token);
	for (const org of WORK_ORGS) {
		projectRepos.push(...(await fetchOrgProjectRepos(org, token)));
	}
	return projectRepos;
}

async function enrichProject(repo, token, pypiStatsByPackage) {
	const packages = PROJECT_PACKAGES[repo.full_name] || {};
	const languages = await fetchRepoLanguages(repo.full_name, token);
	const pypiPackage = packages.pypi || null;
	const pypiStats = pypiPackage ? pypiStatsByPackage[pypiPackage] : null;
	const npmPackage = packages.npm || null;
	const npmStats = npmPackage ? await fetchNPMStats(npmPackage) : null;
	const cratesIOCrates = [];
	for (const name of packages.crates || []) {
		cratesIOCrates.push({ name, stats: await fetchCratesIOStats(name) });
	}
	const releaseDownloads = await fetchReleaseDownloads(repo.full_name, token);
	const zedExtension = packages.zed || null;
	const zedStats = zedExtension ? await fetchZedExtensionStats(zedExtension) : null;

	return {
		name: repo.name,
		fullName: repo.full_name,
		description: repo.description || null,
		url: repo.html_url,
		homepage: repo.homepage || null,
		topics: repo.topics || [],
		stars: repo.stargazers_count,
		forks: repo.forks_count,
		languages,
		pypiPackage,
		pypiStats,
		npmPackage,
		npmStats,
		cratesIOCrates,
		releaseDownloads,
		zedExtension,
		zedStats
	};
}

/**
 * Fetch and transform user's contributions to other repositories
 * @async
 * @returns {Promise<PRContribution[]>} Array of PR contribution objects
 */
async function fetchContributions(token) {
	console.log('Fetching user GitHub contributions...');
	const contributionSearch = await fetchFromGitHubApi(
		`https://api.github.com/search/issues?q=type:pr+author:${GITHUB_USERNAME}+is:public+-user:${GITHUB_USERNAME}+is:merged&sort=created&order=desc&per_page=${MAX_PRS_TO_FETCH}`,
		token
	);
	if (!contributionSearch || !Array.isArray(contributionSearch.items)) {
		throw new TypeError('Expected an items array from the GitHub contribution search');
	}
	const contributedPRs = contributionSearch.items;
	console.log(`Found ${contributedPRs.length} contributed PRs`);

	const contributions = contributedPRs
		.map((pr) => {
			if (!pr.pull_request?.merged_at) return null;

			const match = pr.repository_url?.match(/repos\/([^/]+)\/([^/]+)$/);
			if (!match) return null;

			const repoOwner = match[1];
			const repoName = match[2];
			const repoFullName = `${repoOwner}/${repoName}`;

			if (EXCLUDED_ORGS.includes(repoOwner)) {
				return null;
			}

			if (EXCLUDED_REPOS.includes(repoFullName)) {
				return null;
			}

			return {
				title: pr.title,
				url: pr.html_url,
				repoFullName: repoFullName,
				repoUrl: `https://github.com/${repoFullName}`,
				number: pr.number
			};
		})
		.filter(Boolean);

	const topContributions = contributions.slice(0, MAX_CONTRIBUTIONS);

	console.log(
		`Processed ${contributions.length} contributions, showing top ${topContributions.length}`
	);

	return topContributions;
}

async function fetchOptionalContributions(token) {
	try {
		return await fetchContributions(token);
	} catch (error) {
		console.warn('Failed to fetch GitHub contributions:', error.message);
		return [];
	}
}

/**
 * Fetch projects and optional contributions for the projects route.
 * @async
 * @param {string|undefined} token
 * @param {KVNamespace|undefined} [packageStats]
 * @returns {Promise<{projects: Project[], contributions: PRContribution[]}>}
 */
export default async function (token, packageStats) {
	const projectRepos = await fetchProjectRepos(token);
	const pypiPackages = projectRepos.flatMap((repo) => {
		const packages = PROJECT_PACKAGES[repo.full_name];
		return packages && 'pypi' in packages ? [packages.pypi] : [];
	});
	const pypiStatsByPackage =
		pypiPackages.length > 0 ? await getPyPIStats(packageStats, pypiPackages) : {};
	const projects = [];
	for (const repo of projectRepos)
		projects.push(await enrichProject(repo, token, pypiStatsByPackage));
	projects.sort((a, b) => b.stars - a.stars);
	const contributions = await fetchOptionalContributions(token);
	return { projects, contributions };
}
