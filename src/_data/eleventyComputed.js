import { execSync } from "child_process";

export default {
  updatedAt: (data) => {
    if (data.updatedAt) {
      return data.updatedAt;
    }

    // Only use git dates in production/CI environments to save build time
    if (process.env.CI || process.env.CF_PAGES) {
      try {
        const timestamp = execSync(
          `git log -1 --format=%cI -- "${data.page.inputPath}"`,
          { encoding: "utf-8" },
        ).trim();

        return timestamp ? new Date(timestamp) : data.page.date;
      } catch (e) {
        return data.page.date;
      }
    }

    // In development, just use the page date to avoid the performance hit
    return data.page.date;
  },
};
