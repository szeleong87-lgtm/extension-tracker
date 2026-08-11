// Validates data.js before it's deployed:
// - data.js must load without throwing
// - every category needs id/name/page/items, and its page file must exist
//   (checked case-sensitively, same as GitHub Pages' Linux hosting)
// - every category .html page in the repo must be linked from some category
// - every item needs a name, and numeric estimate/actual
// - no two categories share an id
//
// Run with: node scripts/validate-data.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data.js");
const source = fs.readFileSync(dataPath, "utf8");

const sandbox = {};
vm.createContext(sandbox);
try {
  // `const`/`let` at the top level don't become sandbox properties inside a
  // vm context (only `var` does) — alias it to one that does.
  vm.runInContext(source + "\nvar __EXTENSION_DATA__ = EXTENSION_DATA;", sandbox, { filename: "data.js" });
} catch (err) {
  console.error("data.js failed to run:\n" + err.message);
  process.exit(1);
}

const data = sandbox.__EXTENSION_DATA__;

const errors = [];

if (!data || typeof data !== "object") {
  console.error("EXTENSION_DATA is not defined or not an object.");
  process.exit(1);
}

if (typeof data.budget !== "number" || Number.isNaN(data.budget)) {
  errors.push(`budget must be a number, got: ${JSON.stringify(data.budget)}`);
}

if (!Array.isArray(data.categories) || data.categories.length === 0) {
  console.error("categories must be a non-empty array.");
  process.exit(1);
}

const seenIds = new Set();
const seenPages = new Set();

data.categories.forEach((cat, i) => {
  const label = `categories[${i}] (${cat && cat.name ? cat.name : "unnamed"})`;

  if (!cat.id || typeof cat.id !== "string") {
    errors.push(`${label}: missing or invalid id`);
  } else if (seenIds.has(cat.id)) {
    errors.push(`${label}: duplicate category id "${cat.id}"`);
  } else {
    seenIds.add(cat.id);
  }

  if (!cat.name || typeof cat.name !== "string") {
    errors.push(`${label}: missing or invalid name`);
  }

  if (!cat.page || typeof cat.page !== "string") {
    errors.push(`${label}: missing or invalid page`);
  } else {
    seenPages.add(cat.page);
    const dir = path.dirname(path.join(rootDir, cat.page));
    const base = path.basename(cat.page);
    const filesHere = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    if (!filesHere.includes(base)) {
      errors.push(`${label}: page "${cat.page}" does not exist (check exact capitalization)`);
    }
  }

  if (!Array.isArray(cat.items)) {
    errors.push(`${label}: items must be an array`);
    return;
  }

  cat.items.forEach((item, j) => {
    const itemLabel = `${label} > items[${j}]`;
    if (!item.name || typeof item.name !== "string") {
      errors.push(`${itemLabel}: missing or invalid name`);
    }
    if (typeof item.estimate !== "number" || Number.isNaN(item.estimate)) {
      errors.push(`${itemLabel} "${item.name}": estimate must be a number, got: ${JSON.stringify(item.estimate)}`);
    }
    if (typeof item.actual !== "number" || Number.isNaN(item.actual)) {
      errors.push(`${itemLabel} "${item.name}": actual must be a number, got: ${JSON.stringify(item.actual)}`);
    }
  });
});

// Every category page .html file in the repo (that renders a category) should
// be linked from data.js — catches an orphaned or renamed page file.
const htmlFiles = fs.readdirSync(rootDir).filter((f) => f.toLowerCase().endsWith(".html"));
htmlFiles.forEach((file) => {
  if (file.toLowerCase() === "index.html") return;
  const contents = fs.readFileSync(path.join(rootDir, file), "utf8");
  if (contents.includes("renderCategory(") && !seenPages.has(file)) {
    errors.push(`${file} looks like a category page but no category in data.js has page: "${file}"`);
  }
});

if (errors.length) {
  console.error(`data.js validation failed with ${errors.length} error(s):\n`);
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}

console.log(`data.js looks good — ${data.categories.length} categories, ${data.categories.reduce((n, c) => n + c.items.length, 0)} items.`);
