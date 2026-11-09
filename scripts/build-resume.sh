#!/usr/bin/env bash
# Build the resume PDF locally with latexmk (pdfLaTeX).
#   scripts/build-resume.sh              -> resume/build/Dhairya_Shah_Resume.pdf
#   PUBLIC=1 scripts/build-resume.sh     -> same, phone hidden (the website copy)
# If resume/private/phone.tex exists, the phone number is included (local copy only).
set -euo pipefail
cd "$(dirname "$0")/../resume"
command -v latexmk >/dev/null || { echo "latexmk not found. Install TeX Live (or use Overleaf)."; exit 1; }
mkdir -p build
hidephone=""
[ "${PUBLIC:-0}" = "1" ] && hidephone='\def\hidephone{1}'
latexmk -g -pdf -interaction=nonstopmode -halt-on-error -outdir=build -jobname=Dhairya_Shah_Resume \
  -pdflatex="pdflatex %O '${hidephone}\\input{%S}'" main.tex >/dev/null
pages=$(pdfinfo build/Dhairya_Shah_Resume.pdf 2>/dev/null | awk '/^Pages:/{print $2}')
echo "build/Dhairya_Shah_Resume.pdf (pages: ${pages:-?})"
