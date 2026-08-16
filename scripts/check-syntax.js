const fs = require("node:fs");
const { execFileSync, spawnSync } = require("node:child_process");

const result = spawnSync("git", ["ls-files", "-z", "*.js"], { encoding: "buffer" });
if (result.status !== 0) {
  process.stderr.write(result.stderr.toString());
  process.exit(result.status || 1);
}
const files = result.stdout
  .toString()
  .split("\0")
  .filter((file) => file && fs.existsSync(file));

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log(`Syntax OK: ${files.length} JavaScript files`);
