import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSite } from "../src/build.mjs";

const real = JSON.parse(readFileSync(new URL("../content/profile.json", import.meta.url), "utf8"));
const out = () => mkdtempSync(join(tmpdir(), "site-"));
const clone = (o) => JSON.parse(JSON.stringify(o));
const read = (dir, f) => readFileSync(join(dir, f), "utf8");

test("builds with the real data", () => {
  const dir = out(); const { pages } = buildSite({ data: real, outDir: dir });
  assert.ok(pages >= 11);
  for (const f of ["index.html", "work/index.html", "research/index.html", "about/index.html", "resume/index.html", "404.html", "sitemap.xml", "robots.txt"]) assert.ok(existsSync(join(dir, f)), f);
});

for (const n of [0, 1, 4, 10]) {
  test(`works with ${n} projects`, () => {
    const data = clone(real);
    const base = data.projects[0];
    data.projects = Array.from({ length: n }, (_, i) => ({ ...clone(base), id: `p${i}`, name: `Project ${i}` }));
    data.featured = data.projects.slice(0, 4).map((p) => p.id);
    const dir = out(); buildSite({ data, outDir: dir });
    assert.ok(existsSync(join(dir, "index.html")));
    for (const p of data.projects) assert.ok(existsSync(join(dir, `work/${p.id}/index.html`)));
  });
}

test("private project: no repo link, shows the private note, case study still renders", () => {
  const data = clone(real); const p = data.projects[0]; p.visibility = "private";
  const dir = out(); buildSite({ data, outDir: dir });
  const html = read(dir, `work/${p.id}/index.html`);
  assert.match(html, /Private repository \(code available on request\)/);
  assert.ok(!html.includes(p.repo), "repo URL must not appear");
  assert.match(html, /The problem/);
});

test("a project with no video shows no video UI", () => {
  const data = clone(real); const p = data.projects.find((x) => x.id === "fabric-defect");
  const html = read((() => { const d = out(); buildSite({ data, outDir: d }); return d; })(), `work/${p.id}/index.html`);
  assert.ok(!html.includes("video-facade"));
});

test("videos are click-to-load only (no video element in the HTML)", () => {
  const dir = out(); buildSite({ data: real, outDir: dir });
  const html = read(dir, "work/gestureos/index.html");
  assert.match(html, /video-facade/); assert.ok(!/<video/.test(html));
});

test("no phone number, no attribution, email not in plain HTML", () => {
  const dir = out(); buildSite({ data: real, outDir: dir });
  for (const f of ["index.html", "work/index.html", "about/index.html", "resume/index.html", "research/index.html"]) {
    const h = read(dir, f);
    assert.ok(!/\+91|[6-9]\d{4}[ -]?\d{5}/.test(h), `phone-like number in ${f}`);
    assert.ok(!new RegExp(['cl','aude|anthr','opic|generated w','ith'].join(''), 'i').test(h), `attribution in ${f}`);
    assert.ok(!h.includes("dhairyagshah233@gmail.com"), `plain email in ${f}`);
  }
});

test("navigation has no Contact tab", () => {
  const dir = out(); buildSite({ data: real, outDir: dir });
  assert.ok(!/>Contact</.test(read(dir, "index.html")));
});

test("certificates use the exact titles and never say AWS Certified", () => {
  const dir = out(); buildSite({ data: real, outDir: dir });
  const h = read(dir, "about/index.html");
  assert.ok(h.includes("AWS Academy Cloud Foundations") && h.includes("AWS Academy Graduate - Data Engineering"));
  assert.ok(!/AWS Certified/.test(h));
});

test("every image has alt text", () => {
  const dir = out(); buildSite({ data: real, outDir: dir });
  for (const f of ["index.html", "work/gestureos/index.html", "work/fabric-defect/index.html"]) {
    for (const m of read(dir, f).matchAll(/<img [^>]*>/g)) assert.match(m[0], / alt="/);
  }
});
