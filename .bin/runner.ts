import type { SpawnOptions } from "bun";

const spawnOptions: SpawnOptions.OptionsObject = {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
};

const run = async () => {
  const command = process.argv[2] || "";
  const packageJson = await Bun.file("package.json").json();
  const scripts = packageJson.scripts || {};

  const scriptKeys = Object.keys(scripts).filter((key) =>
    key.startsWith(`${command}:`),
  );

  if (scriptKeys.length === 0) {
    console.error(`No scripts found for command: ${command}`);
    process.exit(1);
  }

  for (const key of scriptKeys) {
    Bun.spawn(["bun", "run", key], spawnOptions);
  }

  process.on("SIGINT", async () => {
    console.log("Cleaning up...");
  });
};

run();
