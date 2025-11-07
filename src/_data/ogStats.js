import Fetch from "@11ty/eleventy-fetch";

const GITHUB_USERNAME = "joshuadavidthomas";

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
 * Fetch comprehensive GitHub stats for OG images
 * @async
 * @returns {Promise<Object>} Stats object with totals
 */
export default async function () {
  try {
    console.log("Fetching comprehensive GitHub stats for OG images...");

    const userRepos = await fetchFromGitHubApi(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`,
    );

    // Filter out forks, only count original repos
    const originalRepos = userRepos.filter((repo) => !repo.fork);

    const totalRepos = originalRepos.length;
    const totalStars = originalRepos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0,
    );
    const totalForks = originalRepos.reduce(
      (sum, repo) => sum + repo.forks_count,
      0,
    );

    console.log(
      `OG Stats: ${totalRepos} repos, ${totalStars} stars, ${totalForks} forks`,
    );

    return {
      totalRepos,
      totalStars,
      totalForks,
    };
  } catch (error) {
    console.error("Error fetching OG stats:", error);
    return {
      totalRepos: 0,
      totalStars: 0,
      totalForks: 0,
    };
  }
}
