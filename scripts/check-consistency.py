#!/usr/bin/env python3
"""Compare the resume (LaTeX) with content/profile.json and print warnings.

Checks
  1. Every profile bullet id exists in the bank; every bank id exists in profile.json.
  2. Numbers inside each bullet match the profile text for the same id (catches drift).
  3. Project names, certificate titles, CGPA and email match exactly.
  4. Every id used by content.tex exists in the bank.
  5. Nothing that looks like a phone number is present in tracked source files.
Exit code 0 = no warnings, 1 = warnings printed. Warnings are advice, not build errors.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
R = ROOT / "resume"
profile = json.loads((ROOT / "content" / "profile.json").read_text(encoding="utf-8"))
warn = []


def unlatex(s: str) -> str:
    s = s.replace("``", '"').replace("''", '"')
    for a, b in ((r"\&", "&"), (r"\%", "%"), (r"\$", "$"), (r"\#", "#"), (r"\_", "_")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()


def read_bank():
    out = {}
    for f in (R / "bank").glob("*.tex"):
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r"\\defbul\{([^}]+)\}\{(.*)\}\s*$", text, re.M):
            out[m.group(1)] = unlatex(m.group(2))
    return out


def nums(s: str):
    return sorted(set(re.findall(r"\d[\d.,/\-]*\d|\d", s)))


bank = read_bank()
profile_bullets = {}
for p in profile["projects"]:
    for b in p["bullets"]:
        profile_bullets[b["id"]] = b["text"]
for b in profile["researchBullets"]:
    profile_bullets[b["id"]] = b["text"]

# 1 + 2
for bid, text in profile_bullets.items():
    if bid not in bank:
        warn.append(f"bullet '{bid}' is in profile.json but not in the resume bank")
        continue
    if nums(bank[bid]) != nums(text):
        warn.append(f"numbers differ for '{bid}': bank {nums(bank[bid])} vs profile {nums(text)}")
for bid in bank:
    if bid not in profile_bullets:
        warn.append(f"bullet '{bid}' is in the bank but not in profile.json (add it there or remove it)")

# 3 names, titles, CGPA, email
def strip_comments(t: str) -> str:
    return "\n".join(l for l in t.splitlines() if not l.lstrip().startswith("%"))


alltex = "\n".join(strip_comments(p.read_text(encoding="utf-8")) for p in R.rglob("*.tex") if p.name != "phone.tex")
for p in profile["projects"]:
    if p["name"] not in alltex:
        warn.append(f"project name '{p['name']}' does not appear in any resume file")
for c in profile["certifications"]:
    if c["title"].replace("&", r"\&") not in alltex:
        warn.append(f"certificate title '{c['title']}' does not match the resume exactly")
if re.search(r"AWS Certified", alltex + " ".join(c["title"] for c in profile["certifications"])):
    warn.append("the phrase 'AWS Certified' appears; use the AWS Academy titles only")
if profile["education"]["cgpa"] not in alltex:
    warn.append(f"CGPA {profile['education']['cgpa']} not found in the resume")
if profile["identity"]["email"] not in alltex:
    warn.append("public email not found in contact.tex")

# 4 ids used by the resume
for bid in re.findall(r"\\bul\{([^}]+)\}", (R / "content.tex").read_text(encoding="utf-8")):
    if bid not in bank:
        warn.append(f"content.tex uses unknown bullet id '{bid}'")

# 5 phone-like numbers anywhere in source files (never embeds the real number)
phone = re.compile(r"(?<!\d)(?:\+?91[ -]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)")
for f in ROOT.rglob("*"):
    if not f.is_file() or ".git" in f.parts or "build" in f.parts or f.suffix in {".pdf", ".zip", ".png", ".jpg", ".gif", ".mp4"}:
        continue
    if f.name == "phone.tex":
        continue
    try:
        txt = f.read_text(encoding="utf-8")
    except Exception:
        continue
    if phone.search(txt):
        warn.append(f"phone-like number found in {f.relative_to(ROOT)}")

if warn:
    print(f"{len(warn)} warning(s):")
    for w in warn:
        print("  -", w)
    sys.exit(1)
print("consistency check: no warnings")
