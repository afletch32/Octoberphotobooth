#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const JSON_IGNORE = new Set([
  'update.json'
]);

const DIR_IGNORE = new Set([
  'node_modules',
  'vendor',
]);

async function findJsonFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (DIR_IGNORE.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      if (!JSON_IGNORE.has(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function validateJsonFiles() {
  const jsonFiles = await findJsonFiles(repoRoot);
  const failures = [];
  for (const file of jsonFiles) {
    try {
      const contents = await fs.promises.readFile(file, 'utf8');
      JSON.parse(contents);
    } catch (error) {
      failures.push({ file, error: error.message });
    }
  }
  if (failures.length > 0) {
    console.error('JSON validation failed:');
    for (const failure of failures) {
      console.error(` - ${path.relative(repoRoot, failure.file)}: ${failure.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Validated ${jsonFiles.length} JSON file(s).`);
  }
}

(async () => {
  try {
    await validateJsonFiles();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
})();
