#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const VALID_SCOPES = new Set(["source", "dist", "all"]);
const argScope = process.argv.find((arg) => arg.startsWith("--scope="));
const scope = argScope ? argScope.split("=")[1] : "source";

if (!VALID_SCOPES.has(scope)) {
  console.error(`[encoding-check] Unknown scope "${scope}". Use source|dist|all.`);
  process.exit(2);
}

const SOURCE_ROOTS = [
  "src",
  "scripts",
  ".github/workflows",
  ".eleventy.js",
  "package.json",
  "package-lock.json",
  "README.md"
];
const DIST_ROOTS = ["dist"];
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const TEXT_EXTENSIONS = new Set([
  ".njk",
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".html",
  ".xml",
  ".txt",
  ".webmanifest",
  ".yml",
  ".yaml"
]);
const ROOT_TEXT_FILES = new Set([".eleventy.js", "package.json", "package-lock.json", "README.md"]);
const CYRILLIC_MOJIBAKE_PAIR_RE =
  /(?:\u0420|\u0421)[\u0403\u0453\u0404\u0454\u0406\u0456\u0407\u0457\u0408\u0458\u0409\u0459\u040a\u045a\u040b\u045b\u040c\u045c\u040e\u045e\u040f\u045f]/g;
const LATIN_MOJIBAKE_RE = /(?:\u00d0|\u00d1|\u00c3|\u00c2|\u00e2\u20ac|\u00e2\u201e)/g;

function isTextFile(filePath) {
  const base = path.basename(filePath);
  if (ROOT_TEXT_FILES.has(base)) {
    return true;
  }

  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function collectTextFilesFrom(rootPath, out) {
  if (!fs.existsSync(rootPath)) {
    return;
  }

  const stat = fs.statSync(rootPath);
  if (stat.isFile()) {
    if (isTextFile(rootPath)) {
      out.push(rootPath);
    }
    return;
  }

  const base = path.basename(rootPath);
  if (SKIP_DIRS.has(base)) {
    return;
  }

  for (const name of fs.readdirSync(rootPath)) {
    collectTextFilesFrom(path.join(rootPath, name), out);
  }
}

function isAllowedRussianCyrillic(codePoint) {
  return (
    codePoint === 0x0401 || // Yo
    codePoint === 0x0451 || // yo
    (codePoint >= 0x0410 && codePoint <= 0x044f) // A-ya
  );
}

function findSuspiciousCyrillic(text) {
  const samples = [];
  let count = 0;
  let line = 1;
  let column = 1;

  for (const char of text) {
    const codePoint = char.codePointAt(0);

    if (char === "\n") {
      line += 1;
      column = 1;
      continue;
    }

    const isCyrillic = codePoint >= 0x0400 && codePoint <= 0x04ff;
    if (isCyrillic && !isAllowedRussianCyrillic(codePoint)) {
      count += 1;
      if (samples.length < 8) {
        samples.push({ char, line, column });
      }
    }

    column += 1;
  }

  return { count, samples };
}

function toUnixPath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

const scanRoots = [];
if (scope === "source" || scope === "all") {
  scanRoots.push(...SOURCE_ROOTS);
}
if (scope === "dist" || scope === "all") {
  scanRoots.push(...DIST_ROOTS);
}

const files = [];
for (const root of scanRoots) {
  collectTextFilesFrom(root, files);
}

if ((scope === "dist" || scope === "all") && !fs.existsSync("dist")) {
  console.error("[encoding-check] dist directory is missing.");
  process.exit(1);
}

files.sort((a, b) => a.localeCompare(b));

const issues = [];
for (const file of files) {
  const bytes = fs.readFileSync(file);
  let text = "";

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    issues.push({
      file: toUnixPath(file),
      reason: "invalid-utf8"
    });
    continue;
  }

  const suspicious = findSuspiciousCyrillic(text);
  const pairArtifacts = text.match(CYRILLIC_MOJIBAKE_PAIR_RE)?.length ?? 0;
  const latinArtifacts = text.match(LATIN_MOJIBAKE_RE)?.length ?? 0;

  if (suspicious.count || pairArtifacts > 0 || latinArtifacts >= 4) {
    issues.push({
      file: toUnixPath(file),
      reason: "mojibake",
      suspiciousCount: suspicious.count,
      pairArtifacts,
      latinArtifacts,
      samples: suspicious.samples
    });
  }
}

if (issues.length === 0) {
  console.log(`[encoding-check] OK: scanned ${files.length} text files (${scope}).`);
  process.exit(0);
}

console.error(`[encoding-check] FAIL: found ${issues.length} problematic file(s).`);
for (const issue of issues) {
  if (issue.reason === "invalid-utf8") {
    console.error(`- ${issue.file}: invalid UTF-8`);
    continue;
  }

  const sampleText = (issue.samples || [])
    .map((sample) => `${sample.char}@${sample.line}:${sample.column}`)
    .join(", ");

  console.error(
    `- ${issue.file}: mojibake signatures (non-RU cyr=${issue.suspiciousCount}, pairs=${issue.pairArtifacts}, latin=${issue.latinArtifacts})`
  );
  if (sampleText) {
    console.error(`  samples: ${sampleText}`);
  }
}

process.exit(1);
