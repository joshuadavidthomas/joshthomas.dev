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
 * @property {string} title - PR title
 * @property {string} state - PR state (open/closed)
 * @property {string} created_at - Creation date
 */

/**
 * @typedef {Object} Project
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {string} url - Project URL
 * @property {string|null} homepage - Project homepage
 * @property {string[]} topics - Project topics
 * @property {boolean} contribution - Whether this is a contribution
 * @property {number} stars - Number of stars
 * @property {number} forks - Number of forks
 * @property {string|null} language - Primary language
 * @property {string} updated - Last update date
 */

const GITHUB_USERNAME = "joshuadavidthomas";
const MIN_STARS = 0; // Minimum stars for a repo to be included

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
 * Fetch repositories where user has contributed via pull requests
 * @async
 * @returns {Promise<string[]>} Array of repository full names
 */
async function fetchContributedRepos() {
  const url = `https://api.github.com/search/issues?q=type:pr+author:${GITHUB_USERNAME}+is:public+-user:${GITHUB_USERNAME}&sort=created&order=desc&per_page=100`;

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

    // Extract unique repository full names from PR data
    const repoSet = new Set();
    for (const pr of data.items || []) {
      // Extract repo full name from repository_url
      // Format: https://api.github.com/repos/owner/repo
      const match = pr.repository_url?.match(/repos\/([^/]+\/[^/]+)$/);
      if (match) {
        repoSet.add(match[1]);
      }
    }

    return Array.from(repoSet);
  } catch (error) {
    console.warn("Failed to fetch contributed repos:", error.message);
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
 * Transform GitHub repo data to project format
 * @param {GitHubRepo} repo - GitHub repository data
 * @param {boolean} isContribution - Whether this is a contribution
 * @returns {Project} Transformed project data
 */
function transformRepo(repo, isContribution = false) {
  return {
    name: repo.name,
    description: repo.description || "No description available",
    url: repo.html_url,
    homepage: repo.homepage || null,
    topics: repo.topics || [],
    contribution: isContribution,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    updated: repo.pushed_at,
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
    const ownProjects = userRepos
      .filter((repo) => !repo.fork && repo.stargazers_count >= MIN_STARS)
      .map((repo) => transformRepo(repo, false))
      .sort((a, b) => b.stars - a.stars); // Sort by stars descending

    console.log(`Found ${ownProjects.length} own projects`);

    // Fetch contributed repos
    const contributedRepoNames = await fetchContributedRepos();
    console.log(`Found ${contributedRepoNames.length} contributed repos`);

    // Fetch details for contributed repos (limit to top 10 by activity)
    const contributionDetails = [];
    for (const repoName of contributedRepoNames.slice(0, 10)) {
      const repo = await fetchRepoDetails(repoName);
      if (repo) {
        contributionDetails.push(transformRepo(repo, true));
      }
    }

    // Sort contributions by stars
    contributionDetails.sort((a, b) => b.stars - a.stars);

    console.log(`Processed ${contributionDetails.length} contributions`);

    // Combine both lists
    return [...ownProjects, ...contributionDetails];
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    // Return fallback data in case of error
    return [];
  }
}
