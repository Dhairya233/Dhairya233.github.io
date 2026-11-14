// validate-profile.mjs: checks content/profile.json BEFORE anything is built, and explains
// problems in plain English. If this fails, the live site is left untouched.
//   node scripts/validate-profile.mjs
import { readFileSync } from "node:fs";

const file = "content/profile.json";
const text = readFileSync(new URL("../" + file, import.meta.url), "utf8");
const annotate = (msg, line) => console.error(`::error file=${file}${line ? `,line=${line}` : ""}::${msg}`);
const fail = (msg, line) => { annotate(msg, line); console.error("\nPROBLEM: " + msg + (line ? ` (at line ${line}, or the line just above it)` : "") + "\nFix it on GitHub: open content/profile.json, click the pencil icon, correct the line, and commit again.\nThe live website has NOT been changed."); process.exit(1); };

let d;
try { d = JSON.parse(text); }
catch (e) {
  let pos = Number((/position (\d+)/.exec(e.message) || [])[1]);
  const line = Number.isFinite(pos) ? text.slice(0, pos).split("\n").length : undefined;
  const lines = text.split("\n");
  const prev = line ? lines[line - 2] : "";
  const hint = /^\s*[}\]]/.test(lines[(line || 1) - 1] || "") && /[}\]"\d]\s*$/.test(prev || "") && !/,\s*$/.test(prev || "")
    ? "Most likely a comma is missing at the end of the line above." : "Check for a missing or extra comma, a missing quote, or an unclosed bracket. Every entry except the last in a list needs a comma after it.";
  fail(`The file is not valid JSON. ${hint}\nParser said: ${e.message}`, line);
}

const errs = [];
const need = (cond, msg) => { if (!cond) errs.push(msg); };
const str = (v) => typeof v === "string" && v.trim().length > 0;
const ids = (list, what) => { const seen = new Set(); for (const x of list) { if (seen.has(x.id)) errs.push(`${what}: the id "${x.id}" is used twice`); seen.add(x.id); } return seen; };

need(Array.isArray(d.certifications), "certifications must be a list");
for (const c of d.certifications || []) {
  need(str(c.id) && str(c.title) && str(c.issuer), `a certificate is missing its id, title or issuer (near "${c.title || c.id || "?"}")`);
  need(["certificate", "appreciation"].includes(c.kind), `certificate "${c.title}": "kind" must be "certificate" or "appreciation"`);
  need(!/AWS Certified/i.test(c.title || ""), `certificate "${c.title}": never write "AWS Certified"; use the exact title on the document`);
}
ids(d.certifications || [], "certifications");

for (const p of d.projects || []) {
  need(str(p.id) && str(p.name) && str(p.pitch), `a project is missing its id, name or pitch (near "${p.name || p.id || "?"}")`);
  need(["public", "private", "archived"].includes(p.visibility), `project "${p.name}": visibility must be public, private or archived`);
}
const pids = ids(d.projects || [], "projects");
for (const f of d.featured || []) need(pids.has(f), `featured lists "${f}" but no project has that id`);

const L = d.leadership;
if (L) {
  need(str(L.title), "leadership needs a title");
  for (const it of L.items || []) {
    need(str(it.id) && str(it.role) && str(it.org) && str(it.period), `a leadership item is missing id, role, org or period (near "${it.org || it.id || "?"}")`);
    need(Array.isArray(it.bullets) && it.bullets.length > 0, `leadership item "${it.org}" needs at least one bullet`);
    for (const b of it.bullets || []) need(str(b.id) && str(b.text), `a bullet in "${it.org}" is missing its id or text`);
  }
  ids(L.items || [], "leadership");
}
for (const r of d.resume?.skillRows || []) need(str(r.label) && Array.isArray(r.items) && r.items.length > 0, `resume skill row "${r.label}" needs a label and at least one item`);
need(!/(?<!\d)(?:\+?91[ -]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)/.test(text), "a phone-like number is in this file; the phone number must never be stored here");

if (errs.length) { errs.forEach((m) => annotate(m)); console.error("PROBLEMS:\n" + errs.map((m) => "  - " + m).join("\n") + "\n\nThe live website has NOT been changed. Fix these in content/profile.json and commit again."); process.exit(1); }
console.log("profile.json is valid");
