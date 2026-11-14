# dhairya233.github.io

The source of my portfolio site: https://dhairya233.github.io/

A small static site, generated from one data file. The hero is a Galton board: balls fall
through pegs and pile into a bell curve, and moving the pointer tilts the odds.

## How it works

- `content/profile.json` holds every fact on the site (projects, research, skills,
  certificates) in one place.
- `src/build.mjs` turns it into plain HTML pages in `dist/`. There is no framework and
  there are no runtime dependencies.
- `src/site.css` and `src/app.js` are the styles and core behaviour (themes, a plain "Fast
  lane", the Galton board). `src/extras.js` is the optional extras: command palette,
  sound, a small game and a few hidden things.
- `resume/` is the LaTeX source of my resume (pdfLaTeX, one column, plain text so
  applicant-tracking systems can read it). The phone number is never stored here.
- `scripts/` holds the helpers: resume build, an Overleaf zip, link and consistency checks.

## Changing things

Edit one file, `content/profile.json`, in the browser on GitHub. See [`EDITING.md`](EDITING.md). The site and the resume PDF rebuild automatically.

## Run it

Needs Node 20 or newer.

```bash
npm test          # tests
npm run build     # writes dist/
npm run dev       # serves dist/ at http://localhost:8080
node scripts/check-links.mjs --internal-only
```

Resume (needs TeX Live with `latexmk`, or upload `resume/` to Overleaf):

```bash
npm run resume    # builds the PDF without a phone number (resume/build/)
python3 scripts/check-consistency.py
```

To put a phone number on a private copy, create `resume/private/phone.tex`
(see `resume/private/phone.example.tex`). It is git-ignored.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: tests, build, an internal link
check, then deployment to GitHub Pages (Settings, Pages, Source: GitHub Actions).

## Measured results

Lighthouse (mobile preset, simulated slow 4G and 4x CPU slowdown), run locally on the
home, a project and the About page: performance, accessibility, best practices and SEO
all scored 100. Largest contentful paint 0.9 to 1.9 s, layout shift near 0. The home page
transfers about 112 KB. axe-core found no violations in light or dark theme. Results will
vary by machine; rerun them yourself.

## Accessibility and privacy

- Keyboard friendly, visible focus, skip link, light and dark themes, `prefers-reduced-motion`
  respected, and a plain Fast lane (`?simple` or the button).
- Single-key shortcuts are off by default (WCAG 2.1.4). Ctrl/Cmd + K opens the palette.
- No cookies, no analytics, no third-party requests. Theme, Fast lane, volume and
  achievements are stored only in your own browser.
- Sound is off by default and never autoplays. It is generated live with the Web Audio
  API, so there is no audio file.

## Credits

- Fonts: Bricolage Grotesque and JetBrains Mono, SIL Open Font Licence 1.1, self-hosted
  (licences in `public/assets/fonts/`).
- Icons, the social image and the QR code were made for this site.
- Sound: original, generated in the browser. Nothing to attribute.

## Licence

Code: MIT. Written content, resume and images: all rights reserved. See `LICENSE`.
