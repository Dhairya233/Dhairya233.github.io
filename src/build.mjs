// build.mjs: generates the whole site into dist/ from content/profile.json.
// No dependencies. Run with `npm run build`.
// Design rule: projects are DATA. Any number from 0 to 10 works, and a project's
// `visibility` (public, private, archived) changes what its card and page show.

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SITE = "https://dhairya233.github.io";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Relative prefix from a page at `path` ("work/x/") back to the site root. */
const up = (path) => "../".repeat(path.split("/").filter(Boolean).length);

const NAV = [
  ["work/", "Work"],
  ["research/", "Research"],
  ["about/", "About"],
  ["resume/", "Resume"],
];

// ---------------------------------------------------------------- layout

function layout({ data, path, title, description, body, ogType = "website", jsonld = "", current = "" }) {
  const r = up(path);
  const url = `${SITE}/${path}`;
  const fullTitle = path === "" ? title : `${title} | Dhairya Shah`;
  const nav = NAV.map(
    ([href, label]) =>
      `<a href="${r}${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a>`
  ).join("");
  const id = data.identity;
  return `<!doctype html>
<!--
   o
  o o        You found view-source.
 o o o       Chance, measured carefully.
o o o o      Try Ctrl+K, or /secret/
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EFE9DD" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1315" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Dhairya Shah">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Dhairya Shah, with a small board of dots piling into a bell curve">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${r}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${r}assets/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${r}assets/apple-touch-icon.png">
<link rel="manifest" href="${r}manifest.webmanifest">
<link rel="preload" href="${r}assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>
(function(){try{var d=document.documentElement,s=localStorage,q=location.search;
var t=s.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t;
if(/[?&]simple(=1|&|$)/.test(q))s.setItem("lane","simple");
if(s.getItem("lane")==="simple")d.dataset.lane="simple";}catch(e){if(/[?&]simple/.test(location.search))document.documentElement.dataset.lane="simple";}})();
</script>
<link rel="stylesheet" href="${r}assets/site.css">
<script src="${r}assets/app.js" defer></script>
<script src="${r}assets/extras.js" defer></script>
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ""}
</head>
<body data-root="${r}">
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="logo" href="${r}" aria-label="Dhairya Shah, home"><span class="logo-dots" aria-hidden="true"></span>dhairya shah</a>
  <nav class="nav" aria-label="Main">${nav}</nav>
  <div class="tools">
    <button type="button" class="chip" id="lane" aria-pressed="false" title="A plain, quick version of this site">Fast lane</button>
    <button type="button" class="chip" id="pal" aria-haspopup="dialog" title="Command palette (Ctrl or Cmd + K)">Search <kbd>Ctrl K</kbd></button>
    <span class="snd"><button type="button" class="chip" id="sound" aria-pressed="false" title="Ambient sound, off by default"><span>Sound</span></button><input type="range" id="vol" min="0" max="1" step="0.05" value="0.5" aria-label="Sound volume" hidden></span>
    <button type="button" class="chip" id="theme" aria-label="Switch between light and dark theme"><span aria-hidden="true">Theme</span></button>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="foot">
  <p>Dhairya Shah · ${esc(id.location)}</p>
  <p class="foot-links"><a href="${esc(id.github)}">GitHub</a> <a href="${esc(id.linkedin)}">LinkedIn</a> <a href="${r}about/#documents">Documents</a></p>
  <p class="small">No cookies, no tracking, no third-party requests. Fonts: Bricolage Grotesque and JetBrains Mono (SIL Open Font Licence), self-hosted. Sound is generated in your browser; there are no audio files. Press <kbd>Ctrl K</kbd> and type “shortcuts” for keys and credits.</p>
</footer>
<script type="application/json" id="site-index">${siteIndex(data)}</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- helpers

const visible = (data) => (data.projects || []).filter((p) => ["public", "private", "archived"].includes(p.visibility));
const byId = (data, id) => (data.projects || []).find((p) => p.id === id);

function badge(p) {
  if (p.visibility === "private") return `<span class="badge">Private repository</span>`;
  if (p.visibility === "archived") return `<span class="badge">Archived</span>`;
  return "";
}

function card(p, r) {
  return `<article class="card">
  <a class="card-link" href="${r}work/${esc(p.id)}/">
    <h3>${esc(p.name)} ${badge(p)}</h3>
    <p>${esc(p.pitch)}</p>
    <ul class="tags" aria-label="Stack">${(p.stack || []).slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </a>
</article>`;
}

function links(p) {
  const out = [];
  if (p.visibility === "private") {
    out.push(`<p class="note">Private repository (code available on request).</p>`);
  } else if (p.repo) {
    out.push(`<a class="btn" href="${esc(p.repo)}">Repository</a>`);
  }
  if (p.live) out.push(`<a class="btn ghost" href="${esc(p.live)}">${esc(p.liveLabel || "Live demo")}</a>`);
  return out.length ? `<div class="actions">${out.join("")}</div>` : "";
}

function flow(steps, note) {
  if (!steps?.length) return "";
  return `<figure class="flow"><ol>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${
    note ? `<figcaption>${esc(note)}</figcaption>` : ""
  }</figure>`;
}

function videoBlock(v, r) {
  if (!v?.file) return "";
  return `<figure class="video">
  <button type="button" class="video-facade" data-video="${r}assets/media/${esc(v.file)}" aria-label="${esc(v.label)}">
    <img src="${r}assets/img/${esc(v.poster)}.webp" width="${v.w}" height="${v.h}" alt="" loading="lazy" decoding="async">
    <span class="play" aria-hidden="true"></span>
    <span class="video-label">${esc(v.label)}</span>
  </button>
  ${v.note ? `<figcaption>${esc(v.note)}</figcaption>` : ""}
</figure>`;
}

function gallery(imgs, r) {
  if (!imgs?.length) return "";
  return `<div class="gallery">${imgs
    .map(
      (i) => `<figure><img src="${r}assets/img/${esc(i.file)}.webp" width="${i.w}" height="${i.h}" alt="${esc(i.alt)}" loading="lazy" decoding="async"><figcaption>${esc(i.caption)}</figcaption></figure>`
    )
    .join("")}</div>`;
}

const section = (h, text) => (text ? `<section class="block"><h2>${h}</h2><p>${esc(text)}</p></section>` : "");

// ---------------------------------------------------------------- pages

function homePage(data) {
  const r = "";
  const feat = (data.featured || []).map((id) => byId(data, id)).filter((p) => p && ["public", "private", "archived"].includes(p.visibility));
  const proof = feat.length
    ? `<section class="proof" aria-labelledby="proof-h"><div class="proof-head"><h2 id="proof-h">Selected work</h2><a href="work/">All work</a></div>
<div class="cards">${feat.map((p) => card(p, r)).join("")}</div></section>`
    : "";
  const body = `<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Dhairya Shah · ${esc(data.identity.location)}</p>
    <h1>Chance, <em>measured</em> carefully.</h1>
    <p class="lead">${esc(data.identity.headline)}</p>
    <div class="actions">
      <a class="btn" href="work/">View projects</a>
      <a class="btn ghost" href="resume/">Resume</a>
      <a class="btn ghost" href="about/#find-me">About and email</a>
    </div>
  </div>
  <div class="board" data-board>
    <canvas id="galton" role="img" aria-label="A board of pegs. Balls fall through and pile into a bell-shaped curve."></canvas>
    <p class="board-note"><span data-board-p>p(right) = 0.50</span> · move over the board to tilt the odds</p>
  </div>
</section>
${proof}`;
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.identity.name,
    url: `${SITE}/`,
    description: data.identity.headline,
    sameAs: [data.identity.github, data.identity.linkedin],
    alumniOf: { "@type": "CollegeOrUniversity", name: data.education.school },
  };
  return layout({
    data,
    path: "",
    title: "Dhairya Shah | Computer vision, full-stack and ML projects",
    description: data.identity.headline,
    body,
    jsonld: JSON.stringify(person),
  });
}

function workIndex(data) {
  const r = "../";
  const list = visible(data);
  const main = list.filter((p) => p.visibility !== "archived");
  const arch = list.filter((p) => p.visibility === "archived");
  const body = `<section class="page-head"><h1>Work</h1><p class="lead">Projects I built, tested and can explain. Each page covers the problem, the decision that mattered and the honest limits.</p></section>
${main.length ? `<h2 class="sub">Projects</h2><div class="cards">${main.map((p) => card(p, r)).join("")}</div>` : `<p class="note">New projects will appear here.</p>`}
${arch.length ? `<h2 class="sub">Archive</h2><div class="cards">${arch.map((p) => card(p, r)).join("")}</div>` : ""}`;
  return layout({
    data,
    path: "work/",
    title: "Work",
    description: "Projects by Dhairya Shah: gesture control, a secured gamified web app, multiplayer browser games and a fabric-defect model.",
    body,
    current: "work/",
  });
}

function casePage(data, p, list) {
  const r = "../../";
  const c = p.case || {};
  const i = list.findIndex((x) => x.id === p.id);
  const prev = list[i - 1], next = list[i + 1];
  const nav = list.length > 1
    ? `<nav class="pager" aria-label="Other projects">${prev ? `<a href="../${esc(prev.id)}/">&larr; ${esc(prev.name)}</a>` : "<span></span>"}${next ? `<a href="../${esc(next.id)}/">${esc(next.name)} &rarr;</a>` : "<span></span>"}</nav>`
    : "";
  const resultBlock =
    c.result || c.caveats
      ? `<section class="block"><h2>Result, and its limits</h2>${c.result ? `<p>${esc(c.result)}</p>` : ""}${c.caveats ? `<p class="caveat"><strong>Honest limits.</strong> ${esc(c.caveats)}</p>` : ""}</section>`
      : "";
  const body = `<article class="case">
<p class="crumb"><a href="../">Work</a> / ${esc(p.name)}</p>
<header class="page-head"><h1>${esc(p.name)} ${badge(p)}</h1><p class="lead">${esc(p.pitch)}</p>
<ul class="tags" aria-label="Stack">${(p.stack || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
${c.status ? `<p class="meta">${esc(c.status)}</p>` : ""}
${links(p)}</header>
${videoBlock(c.video, r)}
${section("The problem", c.problem)}
${section("What I built", c.built)}
${gallery(c.images, r)}
${section("The decision that mattered", c.decision)}
${flow(c.flow, c.flowNote)}
${resultBlock}
${section("What I learned", c.learned)}
${nav}
</article>`;
  return layout({
    data,
    path: `work/${p.id}/`,
    title: p.name,
    description: p.pitch,
    body,
    ogType: "article",
    current: "work/",
  });
}

function researchPage(data) {
  const rs = data.research, pub = rs.publication;
  const body = `<section class="page-head"><h1>Research</h1><p class="lead">${esc(rs.role)} at the ${esc(rs.organisation)}.</p></section>
<section class="block"><h2>The snapshot</h2><p>${esc(rs.summary)}</p>
<p><a class="btn" href="${esc(pub.url)}">Read it on the Institute's site</a></p>
<p class="small">Published by Ahmedabad University as "${esc(pub.title)}" (${esc(pub.series)}, ${esc(pub.date)}). The summary here is in my own words.</p></section>
<section class="block"><h2>What I did</h2><p>${esc(rs.whatIDid)}</p>
<ul class="plain">${rs.sources.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
<section class="block"><h2>Two things the snapshot found</h2><ul class="plain">${rs.publicFacts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<p class="small">Figures are from the published snapshot (${esc(pub.credit)}).</p></section>`;
  return layout({
    data,
    path: "research/",
    title: "Research",
    description: `Primary research for the Institute of Manufacturing and Economy's textiles sector snapshot, ${pub.date}.`,
    body,
    current: "research/",
  });
}

function aboutPage(data) {
  const a = data.about, id = data.identity;
  const pname = (pid) => byId(data, pid)?.name;
  const tiers = data.skills.tiers
    .map(
      (t) => `<div class="tier"><h3>${esc(t.tier)}</h3><ul class="skills">${t.items
        .map((it) => {
          const used = (it.evidence || []).map(pname).filter(Boolean);
          return `<li><span>${esc(it.name)}</span>${used.length ? `<small>${esc(used.join(", "))}</small>` : ""}</li>`;
        })
        .join("")}</ul></div>`
    )
    .join("");
  const certs = data.certifications
    .map((c) => `<li><strong>${esc(c.title)}</strong><span>${esc(c.issuer)}</span></li>`)
    .join("");
  const body = `<section class="page-head"><h1>About</h1></section>
<section class="block prose"><p>${esc(a.intro)}</p><p>${esc(a.now)}</p><p>${esc(a.how)}</p><p>${esc(a.outside)}</p>
<p class="small">I speak ${esc(id.languagesSpoken.slice(0, -1).join(", "))} and ${esc(id.languagesSpoken.slice(-1)[0])}. ${esc(data.education.degree)}, ${esc(data.education.school)}, class of ${data.education.classOf}. CGPA ${esc(data.education.cgpa)}.</p></section>
<section class="block" id="find-me"><h2>Find me</h2>
<ul class="plain find">
<li>Email: <a data-mail data-u="dhairyagshah233" data-d="gmail.com" href="#find-me">dhairyagshah233 [at] gmail [dot] com</a></li>
<li>LinkedIn: <a href="${esc(id.linkedin)}">linkedin.com/in/dhairyagshah233</a></li>
<li>GitHub: <a href="${esc(id.github)}">github.com/Dhairya233</a></li></ul></section>
<section class="block" id="skills"><h2>Skills</h2><p class="small">Grouped by honesty: what I have used in a project, and what I am still learning. Under each skill is the project that used it.</p><div class="tiers">${tiers}</div></section>
<section class="block" id="certifications"><h2>Certifications</h2><ul class="plain certs">${certs}</ul>
<p>I hold both certificates, and they are in the Documents folder below.</p></section>
<section class="block" id="documents"><h2>Documents</h2><p>My resume and certificates, in a view-only folder.</p>
<p><a class="btn" href="${esc(id.documents)}">Open the Documents folder</a></p></section>`;
  return layout({
    data,
    path: "about/",
    title: "About",
    description: "About Dhairya Shah: a B.Tech CSE student working on computer vision, full-stack and ML projects. Skills, certifications and how to get in touch.",
    body,
    current: "about/",
  });
}

function resumePage(data) {
  const pr = visible(data).filter((p) => p.visibility === "public");
  const projects = pr
    .map(
      (p) => `<section class="rproj"><h3>${esc(p.name)} <small>${esc((p.stack || []).slice(0, 4).join(", "))}</small></h3>
<ul>${(p.bullets || []).slice(0, 3).map((b) => `<li>${esc(b.text)}</li>`).join("")}</ul></section>`
    )
    .join("");
  const rs = data.research;
  const body = `<section class="page-head"><h1>Resume</h1>
<a class="thumb" href="../Dhairya_Shah_Resume.pdf" aria-label="Open the resume PDF"><img src="../assets/img/resume-thumb.webp" width="150" height="212" alt="Preview of the one-page black-and-white resume PDF" loading="lazy"></a>
<div class="actions"><a class="btn" href="../Dhairya_Shah_Resume.pdf" download>Download PDF</a><button type="button" class="btn ghost" id="print">Print this page</button></div></section>
<article class="resume" aria-label="Resume">
<header><h2>Dhairya Shah</h2><p>${esc(data.identity.location)} · <a href="../about/#find-me">email on the About page</a></p></header>
<section><h3 class="rh">Education</h3><p><strong>${esc(data.education.school)}</strong>, class of ${data.education.classOf}<br>${esc(data.education.degree)} (${esc(data.education.year)}), CGPA ${esc(data.education.cgpa)}</p></section>
<section><h3 class="rh">Projects</h3>${projects}</section>
<section><h3 class="rh">Research Experience</h3><p><strong>${esc(rs.organisation)}</strong>, ${esc(rs.role)}</p>
<ul>${data.researchBullets.slice(0, 3).map((b) => `<li>${esc(b.text)}</li>`).join("")}</ul></section>
<section><h3 class="rh">Skills</h3>${data.skills.tiers.map((t) => `<p><strong>${esc(t.tier)}:</strong> ${esc(t.items.map((i) => i.name).join(", "))}</p>`).join("")}</section>
<section><h3 class="rh">Certifications</h3><ul>${data.certifications.map((c) => `<li>${esc(c.title)}, ${esc(c.issuer)}</li>`).join("")}</ul></section>
</article>`;
  return layout({
    data,
    path: "resume/",
    title: "Resume",
    description: "Resume of Dhairya Shah: education, projects, research experience, skills and certifications. Download the PDF.",
    body,
    current: "resume/",
  });
}


function siteIndex(data) {
  const o = {
    pages: [["Home", ""], ["Work", "work/"], ["Research", "research/"], ["About", "about/"], ["Resume", "resume/"]],
    projects: visible(data).map((p) => [p.name, `work/${p.id}/`]),
    mail: (() => { const [u, d] = data.identity.email.split("@"); return { u, d }; })(),
  };
  return JSON.stringify(o).replaceAll("<", "\\u003c");
}

function secretPage(data) {
  return layout({
    data, path: "secret/", title: "Secret", description: "A small hidden page.",
    body: `<section class="page-head"><h1>You found it.</h1><p class="lead">No prize except this: the hero board is a Galton board. Drop enough balls and they pile into a bell curve, however each one wanders.</p>
<p>Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd> and type "darts" for a small game, or "sudo hire dhairya" if you are feeling bold.</p>
<div class="actions"><a class="btn" href="../">Back home</a></div></section>`,
  }).replace("<head>", '<head>\n<meta name="robots" content="noindex">');
}

function notFound(data) {
  // 404.html is served from any depth, so it uses root-absolute asset paths.
  const html = layout({
    data,
    path: "",
    title: "Page not found | Dhairya Shah",
    description: "This page does not exist.",
    body: `<section class="page-head"><h1>404</h1><p class="lead">That page is not here. The ball took a path that does not exist.</p>
<div class="actions"><a class="btn" href="/">Home</a><a class="btn ghost" href="/work/">Work</a><a class="btn ghost" href="/about/">About</a></div></section>`,
  });
  return html
    .replaceAll('href="assets/', 'href="/assets/')
    .replaceAll('src="assets/', 'src="/assets/')
    .replace('data-root=""', 'data-root="/"')
    .replace('<link rel="canonical" href="https://dhairya233.github.io/">', '<meta name="robots" content="noindex">');
}

function sitemap(data) {
  const urls = ["", "work/", "research/", "about/", "resume/", ...visible(data).map((p) => `work/${p.id}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}/${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}

// ---------------------------------------------------------------- build

export function buildSite({ data, outDir }) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const write = (rel, content) => {
    const f = join(outDir, rel);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, content);
  };
  write("index.html", homePage(data));
  write("work/index.html", workIndex(data));
  const list = visible(data);
  for (const p of list) write(`work/${p.id}/index.html`, casePage(data, p, list));
  write("research/index.html", researchPage(data));
  write("about/index.html", aboutPage(data));
  write("resume/index.html", resumePage(data));
  write("404.html", notFound(data));
  write("secret/index.html", secretPage(data));
  write("humans.txt", `/* TEAM */\nName: Dhairya Shah\nSite: ${SITE}/\nLocation: ${data.identity.location}\n\n/* SITE */\nBuilt with: a small Node static generator, plain CSS and JS, no frameworks, no trackers\nFonts: Bricolage Grotesque, JetBrains Mono (SIL OFL)\n`);
  write("sitemap.xml", sitemap(data));
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  const pub = join(ROOT, "public");
  if (existsSync(pub)) cpSync(pub, outDir, { recursive: true });
  const src = join(ROOT, "src");
  cpSync(join(src, "site.css"), join(outDir, "assets/site.css"));
  cpSync(join(src, "app.js"), join(outDir, "assets/app.js"));
  cpSync(join(src, "extras.js"), join(outDir, "assets/extras.js"));
  return { pages: 8 + list.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(readFileSync(join(ROOT, "content/profile.json"), "utf8"));
  const { pages } = buildSite({ data, outDir: join(ROOT, "dist") });
  console.log(`built ${pages} pages into dist/`);
}
