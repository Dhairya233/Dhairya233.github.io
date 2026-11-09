# Resume: tailoring guide

There is **one resume** (`content.tex`). It shows what I know, with no role label. To apply somewhere, copy it and tailor it by hand: remove, reorder or swap bullets. The **bullet bank** holds every true bullet, each with a unique id and a comment naming its evidence.

## Files

| File | What it does |
|---|---|
| `main.tex` | Compile this. It pulls in `content.tex`. |
| `content.tex` | The resume itself: which bullets, in which order. Edit this to tailor. |
| `preamble.tex` | Packages and layout macros, each explained in comments. |
| `contact.tex` | Name, email, links and the phone toggle (see below). |
| `bank/projects.tex`, `bank/research.tex` | Every bullet, with its id and evidence comment. |
| `sections/` | Education, certifications and the research heading. |
| `private/` | Git-ignored. Your real phone number lives here for local builds only. |

## Tailor it for a company (about five minutes)

1. In Overleaf, use Menu > Copy Project, and name it after the company.
2. Read the job description. Underline the skills and tasks it asks for.
3. In `content.tex`, keep the bullets that **honestly** match and put the strongest first. Swap in other ids from the bank if one fits better (for example `gos-4`, `gos-6`, `arc-4`, `rpg-4`, `ime-4`).
4. Mirror the job's keywords **only where they are true**. If a keyword is not true, leave it out.
5. Move the Research block above Projects if the job is research or data heavy.
6. Aim for **one page** (two is acceptable if every line earns its place), then download and name it `Dhairya_Shah_<Company>_Resume.pdf`.

## Compile

**Overleaf**

1. New Project > Upload Project, choose `resume-overleaf.zip` (made by `scripts/build-overleaf-zip.sh`).
2. Menu: Compiler = **pdfLaTeX**, Main document = `main.tex`.
3. **Check page fit:** aim for one page; if it spills to a second page, remove or shorten a bullet unless you are happy with two pages. Open the logs (button beside Recompile) and make sure there are no "Overfull \hbox" warnings.
4. Download the PDF from the Download PDF button.

**Your computer (needs TeX Live and `latexmk`)**

```bash
scripts/build-resume.sh            # resume/build/Dhairya_Shah_Resume.pdf
PUBLIC=1 scripts/build-resume.sh   # same, phone hidden
```

## Phone number

The real number is **never committed** and appears only on the resume you send to companies.

* Overleaf copy: in `contact.tex` change `\showphonefalse` to `\showphonetrue` and type the number into `\phonenumber`. Do this only inside Overleaf.
* Local copy: copy `private/phone.example.tex` to `private/phone.tex` and put your number in it. It is git-ignored and skipped by the Overleaf zip script.
* `PUBLIC=1` hides the phone even if `phone.tex` exists.

## Keep it ATS-friendly

One column, real text, standard headings, no icons or images, links printed as visible text. After compiling, test extraction:

```bash
pdftotext -layout resume/build/Dhairya_Shah_Resume.pdf - | less
```

Sections must come out in order with no jumbled lines.

## Rules for every bullet

* True, and traceable to the evidence comment above it in `bank/`.
* Numbers match `content/profile.json`. Run `python3 scripts/check-consistency.py` after editing.
* Certificates use the exact titles "AWS Academy Cloud Foundations" and "AWS Academy Graduate - Data Engineering". Never "AWS Certified".
* Research: say "primary research" for the Institute snapshot, nothing larger.
* DSA and C++ stay under **Learning**.
