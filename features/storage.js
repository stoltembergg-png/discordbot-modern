const fs = require("node:fs");
const path = require("node:path");

class JsonStore {
  constructor(filePath, initialValue = {}) {
    this.filePath = filePath;
    this.initialValue = initialValue;
    this.value = this.load();
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Unable to load ${this.filePath}: ${error.message}`);
      }
      return structuredClone(this.initialValue);
    }
  }

  save() {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(this.value, null, 2)}\n`, "utf8");
    fs.renameSync(temporaryPath, this.filePath);
  }

  update(mutator) {
    mutator(this.value);
    this.save();
    return this.value;
  }
}

module.exports = { JsonStore };
