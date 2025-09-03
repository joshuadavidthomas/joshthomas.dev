import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default {
  updatedAt: async (data) => {
    if (data.updatedAt) {
      return data.updatedAt;
    }

    // Try to get git timestamp
    try {
      const gitCommand = `git log -1 --format=%at -- "${data.page.inputPath}"`;
      const { stdout } = await execAsync(gitCommand);

      const timestamp = stdout.trim();

      if (timestamp) {
        const date = new Date(Number.parseInt(timestamp, 10) * 1000);
        return date;
      }
    } catch (e) {
      // Git command failed, fallback
    }

    return data.page.date;
  },
};
