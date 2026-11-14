#!/usr/bin/env bash
# Make resume-overleaf.zip for Overleaf: New Project > Upload Project.
# The zip holds only the resume/ folder. It never includes your real phone number
# (private/phone.tex is excluded) or build output. The zip itself is git-ignored.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/gen-resume.mjs >/dev/null   # Overleaf needs the generated parts inside the zip
cd resume
out="../resume-overleaf.zip"
rm -f "$out"
zip -rq "$out" . \
  -x 'build/*' 'private/phone.tex' '*.aux' '*.log' '*.out' '*.fls' '*.fdb_latexmk' '.DS_Store'
echo "wrote resume-overleaf.zip ($(du -h "$out" | cut -f1))"
unzip -l "$out" | awk 'NR>3 && $4!="" {print "  " $4}' | head -40
if unzip -l "$out" | grep -q "private/phone.tex"; then echo "ERROR: phone.tex is in the zip"; exit 1; fi
