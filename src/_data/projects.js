import Fetch from "@11ty/eleventy-fetch";

/**
 * @typedef {Object} GitHubRepo
 * @property {string} name - Repository name
 * @property {string} full_name - Full repository name (owner/repo)
 * @property {string} description - Repository description
 * @property {string} html_url - Repository URL
 * @property {string|null} homepage - Repository homepage URL
 * @property {number} stargazers_count - Number of stars
 * @property {number} forks_count - Number of forks
 * @property {string|null} language - Primary language
 * @property {string[]} topics - Repository topics/tags
 * @property {boolean} fork - Whether this is a fork
 * @property {string} pushed_at - Last push date
 */

/**
 * @typedef {Object} GitHubPR
 * @property {string} repository_url - URL to the repository
 * @property {string} html_url - URL to the PR
 * @property {number} number - PR number
 * @property {string} title - PR title
 * @property {Object} pull_request - PR metadata
 * @property {string|null} pull_request.merged_at - Merge timestamp
 */

/**
 * @typedef {Object} PRContribution
 * @property {string} type - Type (always 'pr')
 * @property {string} title - PR title
 * @property {string} url - PR URL
 * @property {string} repoName - Repository name
 * @property {string} repoOwner - Repository owner
 * @property {string} repoUrl - Repository URL
 * @property {number} number - PR number
 * @property {boolean} merged - Whether PR was merged
 */

/**
 * @typedef {Object} Language
 * @property {string} name - Language name
 * @property {number} bytes - Number of bytes
 * @property {string} icon - Devicon class name
 */

/**
 * @typedef {Object} Project
 * @property {string} type - Type (always 'project')
 * @property {string} name - Project name
 * @property {string} fullName - Full repository name (owner/repo)
 * @property {string} description - Project description
 * @property {string} url - Project URL
 * @property {string|null} homepage - Project homepage
 * @property {string[]} topics - Project topics
 * @property {number} stars - Number of stars
 * @property {number} forks - Number of forks
 * @property {Language[]} languages - Languages used in the project
 * @property {string} updated - Last update date
 */

const GITHUB_USERNAME = "joshuadavidthomas";
const MIN_STARS = 4; // Minimum stars for a repo to be included
const MAX_LANGUAGES = 4; // Maximum number of languages to display per project
const MAX_PRS_TO_FETCH = 100; // Maximum number of PRs to fetch from GitHub
const MAX_CONTRIBUTIONS = 10; // Maximum number of PR contributions to display
const WORK_ORGS = ["westerveltco"]; // Organizations to include as work projects
const MIN_ORG_CONTRIBUTION_RANK = 5; // Only include org repos where user is in top N contributors
const EXCLUDED_ORGS = ["westerveltco"]; // Organizations to exclude from PR contributions
const EXCLUDED_REPOS = ["neovim/nvim-lspconfig", "zed-industries/extensions"]; // Repositories to exclude from contributions

/**
 * Map language names to devicon class names
 * @param {string} language - Language name from GitHub
 * @returns {string} Devicon class name
 */
function getDeviconClass(language) {
  const languageMap = {
    Angular: "angularjs",
    C: "c",
    "C#": "csharp",
    "C++": "cplusplus",
    CSS: "css3",
    Clojure: "clojure",
    Dart: "dart",
    Docker: "docker",
    Elixir: "elixir",
    Erlang: "erlang",
    Go: "go",
    HTML: "html5",
    Haskell: "haskell",
    Java: "java",
    JavaScript: "javascript",
    Jupyter: "jupyter",
    Kotlin: "kotlin",
    Lua: "lua",
    Markdown: "markdown",
    Nix: "nixos",
    PHP: "php",
    Perl: "perl",
    PowerShell: "powershell",
    Python: "python",
    R: "r",
    React: "react",
    Ruby: "ruby",
    Rust: "rust",
    SCSS: "sass",
    Scala: "scala",
    Shell: "bash",
    Svelte: "svelte",
    Swift: "swift",
    TypeScript: "typescript",
    Vim: "vim",
    Vue: "vuejs",
  };
  const deviconLang = languageMap[language] || "github";

  const deviconStyleMap = {
    rust: "colored dark:var(--tw-invert)",
  };
  const deviconStyle = deviconStyleMap[deviconLang] || "colored";

  return `devicon-${deviconLang}-plain ${deviconStyle}`;
}

/**
 * Fetch data from GitHub API with authentication and caching
 * @async
 * @param {string} url - GitHub API URL
 * @returns {Promise<any>} API response data
 */
async function fetchFromGitHubApi(url) {
  const options = {
    duration: "1d",
    type: "json",
    fetchOptions: {
      headers: {
        "User-Agent": "Eleventy",
      },
    },
  };

  if (process.env.GITHUB_TOKEN) {
    options.fetchOptions.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    return await Fetch(url, options);
  } catch (error) {
    console.warn("Failed to fetch from GitHub API:", error.message);
    return [];
  }
}

/**
 * Fetch languages for a repository
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<Language[]>} Array of languages sorted by bytes
 */
async function fetchRepoLanguages(fullName) {
  const languagesData = await fetchFromGitHubApi(
    `https://api.github.com/repos/${fullName}/languages`,
  );

  const languages = Object.entries(languagesData)
    .map(([name, bytes]) => ({
      name,
      bytes,
      icon: getDeviconClass(name),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, MAX_LANGUAGES);

  return languages;
}

/**
 * Check if user is a top contributor to a repository
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<boolean>} True if user is in top contributors
 */
async function isTopContributor(fullName) {
  const contributors = await fetchFromGitHubApi(
    `https://api.github.com/repos/${fullName}/contributors?per_page=${MIN_ORG_CONTRIBUTION_RANK}`,
  );

  if (!Array.isArray(contributors)) {
    return false;
  }

  return contributors.some(
    (contributor) => contributor.login === GITHUB_USERNAME,
  );
}

/**
 * Fetch and transform public repositories from an organization where user is a top contributor
 * @async
 * @param {string} org - Organization name
 * @returns {Promise<Project[]>} Array of project objects
 */
async function fetchOrgProjects(org) {
  console.log(`Fetching projects from ${org} organization...`);

  const orgRepos = await fetchFromGitHubApi(
    `https://api.github.com/orgs/${org}/repos?type=public&per_page=100`,
  );

  if (!Array.isArray(orgRepos)) {
    console.warn(`Failed to fetch repos for org ${org}`);
    return [];
  }

  const orgProjects = [];
  for (const repo of orgRepos) {
    if (repo.fork || repo.stargazers_count < MIN_STARS) {
      continue;
    }

    const isContributor = await isTopContributor(repo.full_name);
    if (!isContributor) {
      continue;
    }

    const languages = await fetchRepoLanguages(repo.full_name);
    orgProjects.push({
      type: "project",
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || null,
      url: repo.html_url,
      homepage: repo.homepage || null,
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      languages: languages,
      updated: repo.pushed_at,
    });
  }

  console.log(`Found ${orgProjects.length} projects from ${org}`);
  return orgProjects;
}

/**
 * Fetch and transform user's own repositories
 * @async
 * @returns {Promise<Project[]>} Array of project objects
 */
async function fetchUserProjects() {
  console.log("Fetching user GitHub projects...");

  const userRepos = await fetchFromGitHubApi(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=100`,
  );

  const filteredRepos = userRepos.filter(
    (repo) => !repo.fork && repo.stargazers_count >= MIN_STARS,
  );

  const userProjects = [];
  for (const repo of filteredRepos) {
    const languages = await fetchRepoLanguages(repo.full_name);
    userProjects.push({
      type: "project",
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || null,
      url: repo.html_url,
      homepage: repo.homepage || null,
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      languages: languages,
      updated: repo.pushed_at,
    });
  }

  console.log(`Found ${userProjects.length} user projects`);

  return userProjects;
}

/**
 * Fetch and transform projects from work organizations
 * @async
 * @returns {Promise<Project[]>} Array of project objects from work orgs
 */
async function fetchWorkProjects() {
  const workProjects = [];

  for (const org of WORK_ORGS) {
    const orgProjects = await fetchOrgProjects(org);
    workProjects.push(...orgProjects);
  }

  console.log(`Found ${workProjects.length} total work projects`);
  return workProjects;
}
/**
 * Fetch and transform projects for user, including from work organizations
 * @async
 * @returns {Promise<Project[]>} Array of project objects from work orgs
 */
async function fetchProjects() {
  const userProjects = await fetchUserProjects();
  const workProjects = await fetchWorkProjects();
  const projects = [...userProjects, ...workProjects];
  projects.sort((a, b) => b.stars - a.stars);
  return projects;
}

/**
 * Fetch and transform user's contributions to other repositories
 * @async
 * @returns {Promise<PRContribution[]>} Array of PR contribution objects
 */
async function fetchContributions() {
  console.log("Fetching user GitHub contributions...");
  const contributionSearch = await fetchFromGitHubApi(
    `https://api.github.com/search/issues?q=type:pr+author:${GITHUB_USERNAME}+is:public+-user:${GITHUB_USERNAME}+is:merged&sort=created&order=desc&per_page=${MAX_PRS_TO_FETCH}`,
  );
  const contributedPRs = contributionSearch.items || [];
  console.log(`Found ${contributedPRs.length} contributed PRs`);

  const contributions = contributedPRs
    .map((pr) => {
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
        type: "pr",
        title: pr.title,
        url: pr.html_url,
        repoName: repoName,
        repoOwner: repoOwner,
        repoUrl: `https://github.com/${repoFullName}`,
        number: pr.number,
        merged: !!pr.pull_request?.merged_at,
      };
    })
    .filter(Boolean);

  const topContributions = contributions.slice(0, MAX_CONTRIBUTIONS);

  console.log(
    `Processed ${contributions.length} contributions, showing top ${topContributions.length}`,
  );

  return topContributions;
}

/**
 * Main function to fetch and combine project data
 * @async
 * @returns {Promise<Array<Project|PRContribution>>} Array of projects and contributions
 */
export default async function () {
  try {
    const projects = await fetchProjects();
    const contributions = await fetchContributions();
    return [...projects, ...contributions];
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    return [];
  }
}
