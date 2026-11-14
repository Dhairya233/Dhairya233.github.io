# How to change things (no coding needed)

Almost everything on the website **and** the resume comes from one file:
[`content/profile.json`](content/profile.json).

**The whole routine**

1. Open this link: https://github.com/Dhairya233/Dhairya233.github.io/edit/main/content/profile.json
2. Make your change (recipes below). Use `Ctrl+F` to find the part you want.
3. Click **Commit changes**, then **Commit directly to the main branch**, then **Commit changes** again.
4. Wait about 2 to 3 minutes. Open the **Actions** tab: a green tick means the site and the resume PDF are updated. A red cross means something in the file is wrong. Click it and read the message, which names the line.

If it fails, the live site is not changed. Fix the line and commit again.

## The one rule about commas

Entries in a list are separated by a comma, **except the last one**.

```
{ ...first thing... },
{ ...second thing... },
{ ...last thing... }
```

If you add something at the end of a list, put a comma after the thing that used to be last.

## Recipes

### Add a certificate
Find `"certifications": [`. Copy one whole block from `{` to `}` and paste it after the last block (add a comma after the block above). Change the words:

```
{
  "id": "my-new-certificate",
  "title": "Exact title printed on the certificate",
  "issuer": "Who issued it",
  "date": "Month 2026",
  "link": null,
  "kind": "certificate"
},
```

- `id` must be unique and use only lowercase letters and dashes.
- `kind` is `"certificate"` for a course or exam, or `"appreciation"` for a letter of appreciation.
- Use the exact title as printed. Never write "AWS Certified" for AWS Academy courses.
- Put the document itself in your Google Drive folder, in `02_Certificates`.

### Add something under Leadership & Design
Find `"leadership": {` and its `"items": [`. Copy the whole `sae` block, paste it after it, and change the words. Keep claims small and true; every bullet needs its own unique `id`.

### Change your skills on the resume
Find `"skillRows": [`. Each row has a `label` and a list of `items`. Add a skill by adding `"Skill name"` to the list (comma between items).

### Change the "right now" text
Find `"about": {` and edit the `"now"` line.

### Hide a project
Find the project, change `"visibility": "public"` to `"private"`. Its code link disappears and the case study stays. (To remove it entirely, remove its id from the `"featured"` list as well.)

## What is NOT in this file

- **Project and research bullet wording on the resume** lives in `resume/bank/`. It is hand-written on purpose, because you tailor it per company. Ask for help when you want those changed.
- **Your phone number** must never be added anywhere in this repository. The checker blocks it.

## Preview before you publish (optional)

If you want to see the result first, open the pencil view, click **Preview** to check the text, and commit only when you like it. Every commit is undoable: on the repo page click **History**, open the commit, and choose **Revert**.
