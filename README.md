# Pega CSA '25 Study Guide

An unofficial study guide and practice-question site for the **Certified Pega System Architect '25** exam (PEGACPSA25V1).

- **Study sheet**: organized by the official exam topic list and its weights. The content is written from the text and video-transcript topics of the Pega Academy *System Architect* mission for Pega Platform '25. The hands-on sandbox Challenges are left out.
- **Practice problems**: domain sets, mixed sets weighted like the exam, hard-only and multi-select drills, and a list of your missed questions.
- **Mock exams**: 60 questions, 90-minute timer, 65% pass line, with a score breakdown by domain. There is also a **Mission Test Simulation**: 40 questions, 60 minutes, 80% to pass.
- Questions follow the Pega Academy Mission Test format (short scenario stems, 4 options, "(Choose Two)") at certification difficulty. See `content/STYLE.md`.

## Structure

```
content/*.json   one file per exam domain (study sheet + questions)
build.js         validates content and writes docs/data.js
docs/            static site served by GitHub Pages
```

## Rebuild after editing content

```bash
node build.js
```

Not affiliated with or endorsed by Pegasystems. The practice questions are original and are not real exam items.
