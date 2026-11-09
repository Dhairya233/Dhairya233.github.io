// check-links.mjs: finds broken links.
//   node scripts/check-links.mjs                 internal links in dist/ plus every external project link
//   node scripts/check-links.mjs --internal-only internal only (used in CI, needs no network)
// A private repository looks like a 404, so a warning on a repo link may just mean "now private":
// change that project's `visibility` to "private" in content/profile.json.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const internalOnly = process.argv.includes("--internal-only");
const problems = [];

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(DIST).filter((f) => f.endsWith(".html"));

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(DIST.length + 1);
  const base = rel === "404.html" ? "" : dirname(rel) === "." ? "" : dirname(rel) + "/";
  for (const m of html.matchAll(/(?:href|src)="([^"#][^"#]*)(#[^"]*)?"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|data:|javascript:)/.test(url) || url.startsWith("//")) continue;
    let target = url.startsWith("/") ? join(DIST, url) : resolve(DIST, base, url);
    if (!target.startsWith(DIST)) { problems.push(`${rel}: link leaves the site: ${url}`); continue; }
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!existsSync(target)) problems.push(`${rel}: missing target ${url}`);
  }
  for (const m of html.matchAll(/<img [^>]*>/g)) if (!/ alt="/.test(m[0])) problems.push(`${rel}: image without alt text`);
}

if (!internalOnly) {
  const data = JSON.parse(readFileSync(join(ROOT, "content/profile.json"), "utf8"));
  const urls = new Set([data.identity.github, data.identity.linkedin, data.identity.documents, data.research.publication.url]);
  for (const p of data.projects) {
    if (p.visibility === "public") { if (p.repo) urls.add(p.repo); }
    if (p.live) urls.add(p.live);
  }
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "link-check" } });
      // LinkedIn answers bots with 999; treat that as "could not check"
      if (res.status === 404) problems.push(`404: ${u} (a private repository looks like this)`);
      else if (res.status >= 400 && res.status !== 999 && res.status !== 403) problems.push(`${res.status}: ${u}`);
    } catch (e) {
      console.warn(`could not reach ${u} (${e.cause?.code || e.name}); skipped`);
    }
  }
}

if (problems.length) { console.error(problems.map((p) => "  - " + p).join("\n")); console.error(`${problems.length} problem(s)`); process.exit(1); }
console.log(`links ok (${pages.length} pages${internalOnly ? ", internal only" : ""})`);
