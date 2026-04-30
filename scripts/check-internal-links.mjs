import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "app");
const sourceDirs = ["app", "components", "lib"].map((dir) => path.join(root, dir));
const sourceExtensions = new Set([".ts", ".tsx"]);

function walkFiles(dir, predicate, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") {
        continue;
      }

      walkFiles(fullPath, predicate, files);
      continue;
    }

    if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeAppRoute(filePath) {
  const relative = path.relative(appDir, path.dirname(filePath));
  const parts = relative
    .split(path.sep)
    .filter(Boolean)
    .filter((part) => !(part.startsWith("(") && part.endsWith(")")))
    .map((part) => (part.startsWith("[") && part.endsWith("]") ? "*" : part));

  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
}

const pageRoutes = walkFiles(
  appDir,
  (filePath) => path.basename(filePath) === "page.tsx"
).map(normalizeAppRoute);

const routePatterns = pageRoutes.map((route) => {
  const escaped = route
    .split("/")
    .map((part) => {
      if (part === "*") {
        return "[^/]+";
      }

      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return {
    route,
    regex: new RegExp(`^${escaped}$`),
  };
});

function isKnownRoute(href) {
  const cleanHref = href.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  return routePatterns.some(({ regex }) => regex.test(cleanHref));
}

function shouldCheckHref(href) {
  return (
    href.startsWith("/") &&
    !href.startsWith("//") &&
    !href.includes("${") &&
    !href.includes("[") &&
    !href.includes("]")
  );
}

function collectLinks(filePath) {
  const content = readFileSync(filePath, "utf8");
  const patterns = [
    /\bhref\s*=\s*["'](\/[^"']*)["']/g,
    /\bhref\s*:\s*["'](\/[^"']*)["']/g,
    /\b(?:redirect|router\.push|router\.replace)\(\s*["'](\/[^"']*)["']/g,
  ];
  const links = [];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const href = match[1];

      if (!shouldCheckHref(href)) {
        continue;
      }

      const line = content.slice(0, match.index).split(/\r?\n/).length;
      links.push({ href, line });
    }
  }

  return links;
}

const sourceFiles = sourceDirs.flatMap((dir) =>
  walkFiles(dir, (filePath) => sourceExtensions.has(path.extname(filePath)))
);

const brokenLinks = [];

for (const filePath of sourceFiles) {
  for (const link of collectLinks(filePath)) {
    if (!isKnownRoute(link.href)) {
      brokenLinks.push({
        file: path.relative(root, filePath),
        ...link,
      });
    }
  }
}

if (brokenLinks.length) {
  console.error("Broken internal links found:");
  for (const link of brokenLinks) {
    console.error(`- ${link.file}:${link.line} -> ${link.href}`);
  }
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} files against ${pageRoutes.length} page routes.`);
console.log("No broken static internal links found.");
