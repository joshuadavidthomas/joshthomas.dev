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
 * @property {string} state - PR state (open/closed)
 * @property {string} created_at - Creation date
 * @property {string|null} merged_at - Merge date
 * @property {Object} pull_request - PR metadata
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
 * @property {string} state - PR state
 * @property {boolean} merged - Whether PR was merged
 * @property {string} created - Creation date
 * @property {Language[]} languages - Languages in the repo
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
const MIN_STARS = 0; // Minimum stars for a repo to be included
const MAX_LANGUAGES = 4; // Maximum number of languages to display per project
const MAX_CONTRIBUTIONS = 10; // Maximum number of PR contributions to display

/**
 * Map language names to devicon class names
 * @param {string} language - Language name from GitHub
 * @returns {string} Devicon class name
 */
function getDeviconClass(language) {
  const languageMap = {
    JavaScript: "devicon-javascript-plain colored",
    TypeScript: "devicon-typescript-plain colored",
    Python: "devicon-python-plain colored",
    Java: "devicon-java-plain colored",
    "C++": "devicon-cplusplus-plain colored",
    "C#": "devicon-csharp-plain colored",
    C: "devicon-c-plain colored",
    Go: "devicon-go-plain colored",
    Rust: "devicon-rust-plain colored",
    Ruby: "devicon-ruby-plain colored",
    PHP: "devicon-php-plain colored",
    Swift: "devicon-swift-plain colored",
    Kotlin: "devicon-kotlin-plain colored",
    Dart: "devicon-dart-plain colored",
    Scala: "devicon-scala-plain colored",
    R: "devicon-r-plain colored",
    Shell: "devicon-bash-plain colored",
    PowerShell: "devicon-powershell-plain colored",
    HTML: "devicon-html5-plain colored",
    CSS: "devicon-css3-plain colored",
    SCSS: "devicon-sass-plain colored",
    Vue: "devicon-vuejs-plain colored",
    React: "devicon-react-original colored",
    Angular: "devicon-angularjs-plain colored",
    Svelte: "devicon-svelte-plain colored",
    Elixir: "devicon-elixir-plain colored",
    Erlang: "devicon-erlang-plain colored",
    Haskell: "devicon-haskell-plain colored",
    Lua: "devicon-lua-plain colored",
    Perl: "devicon-perl-plain colored",
    Clojure: "devicon-clojure-plain colored",
    Docker: "devicon-docker-plain colored",
    Vim: "devicon-vim-plain colored",
    Markdown: "devicon-markdown-plain colored",
    Jupyter: "devicon-jupyter-plain colored",
    Nix: "devicon-nixos-plain colored",
  };

  return languageMap[language] || "devicon-github-plain colored";
}

/**
 * Fetch user's repositories from GitHub
 * @async
 * @returns {Promise<GitHubRepo[]>} Array of repositories
 */
async function fetchUserRepos() {
  const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=100`;

  const options = {
    duration: "1d",
    type: "json",
    fetchOptions: {
      headers: {
        "User-Agent": "Eleventy",
      },
    },
  };

  // Add GitHub token if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    options.fetchOptions.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return await Fetch(url, options);
}

/**
 * Fetch pull requests where user has contributed
 * @async
 * @returns {Promise<GitHubPR[]>} Array of pull request details
 */
async function fetchContributedPRs() {
  const url = `https://api.github.com/search/issues?q=type:pr+author:${GITHUB_USERNAME}+is:public+-user:${GITHUB_USERNAME}+is:merged&sort=created&order=desc&per_page=${MAX_CONTRIBUTIONS}`;

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
    const data = await Fetch(url, options);
    return data.items || [];
  } catch (error) {
    console.warn("Failed to fetch contributed PRs:", error.message);
    return [];
  }
}

/**
 * Fetch repository details by full name
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<GitHubRepo|null>} Repository details
 */
async function fetchRepoDetails(fullName) {
  const url = `https://api.github.com/repos/${fullName}`;

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
    console.warn(`Failed to fetch repo ${fullName}:`, error.message);
    return null;
  }
}

/**
 * Fetch languages for a repository
 * @async
 * @param {string} fullName - Repository full name (owner/repo)
 * @returns {Promise<Language[]>} Array of languages sorted by bytes
 */
async function fetchRepoLanguages(fullName) {
  const url = `https://api.github.com/repos/${fullName}/languages`;

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
    const languagesData = await Fetch(url, options);

    // Convert object to array and sort by bytes descending
    const languages = Object.entries(languagesData)
      .map(([name, bytes]) => ({
        name,
        bytes,
        icon: getDeviconClass(name),
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, MAX_LANGUAGES);

    return languages;
  } catch (error) {
    console.warn(`Failed to fetch languages for ${fullName}:`, error.message);
    return [];
  }
}

/**
 * Transform GitHub repo data to project format
 * @param {GitHubRepo} repo - GitHub repository data
 * @param {Language[]} languages - Languages used in the repo
 * @returns {Project} Transformed project data
 */
function transformRepo(repo, languages = []) {
  return {
    type: "project",
    name: repo.name,
    description: repo.description || "No description available",
    url: repo.html_url,
    homepage: repo.homepage || null,
    topics: repo.topics || [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    languages: languages,
    updated: repo.pushed_at,
  };
}

/**
 * Transform GitHub PR data to contribution format
 * @param {GitHubPR} pr - GitHub PR data
 * @param {Language[]} languages - Languages used in the repo
 * @returns {PRContribution} Transformed PR contribution data
 */
function transformPR(pr, languages = []) {
  // Extract repo info from repository_url
  const match = pr.repository_url?.match(/repos\/([^/]+)\/([^/]+)$/);
  const repoOwner = match ? match[1] : "";
  const repoName = match ? match[2] : "";
  const repoFullName = match ? `${repoOwner}/${repoName}` : "";

  return {
    type: "pr",
    title: pr.title,
    url: pr.html_url,
    repoName: repoName,
    repoOwner: repoOwner,
    repoUrl: `https://github.com/${repoFullName}`,
    number: pr.number,
    state: pr.state,
    merged: !!pr.pull_request?.merged_at,
    created: pr.created_at,
    languages: languages,
  };
}

/**
 * Main function to fetch and combine project data
 * @async
 * @returns {Promise<Project[]>} Array of projects
 */
export default async function () {
  try {
    console.log("Fetching GitHub projects data...");

    // Fetch user's repos
    const userRepos = await fetchUserRepos();

    // Filter user repos: not forks, have stars >= MIN_STARS
    const filteredRepos = userRepos.filter(
      (repo) => !repo.fork && repo.stargazers_count >= MIN_STARS
    );

    // Fetch languages for each user repo
    const ownProjects = [];
    for (const repo of filteredRepos) {
      const languages = await fetchRepoLanguages(repo.full_name);
      ownProjects.push(transformRepo(repo, languages, false));
    }

    // Sort by stars descending
    ownProjects.sort((a, b) => b.stars - a.stars);

    console.log(`Found ${ownProjects.length} own projects`);

    // Fetch contributed PRs
    const contributedPRs = await fetchContributedPRs();
    console.log(`Found ${contributedPRs.length} contributed PRs`);

    // Transform PRs with language data
    const contributions = [];
    for (const pr of contributedPRs) {
      // Extract repo full name from repository_url
      const match = pr.repository_url?.match(/repos\/([^/]+\/[^/]+)$/);
      if (match) {
        const repoFullName = match[1];
        const languages = await fetchRepoLanguages(repoFullName);
        contributions.push(transformPR(pr, languages));
      }
    }

    console.log(`Processed ${contributions.length} contributions`);

    // Combine both lists
    return [...ownProjects, ...contributions];
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    // Return fallback data in case of error
    return [];
  }
}
