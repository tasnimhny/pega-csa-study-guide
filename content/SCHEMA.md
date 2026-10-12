# Content file schema (one JSON file per exam domain)
{
  "id": "case-management",            // kebab-case
  "title": "Case Management",
  "weight": 25,                        // exam % from blueprint
  "intro": "1-2 sentence orientation for this domain.",
  "objectives": [                      // one per blueprint bullet, in blueprint order
    {
      "objective": "exact blueprint bullet text",
      "modules": ["Mission module name(s) this came from"],
      "summary": ["paragraph 1", "paragraph 2"],          // plain text, original wording
      "keyFacts": ["short, testable fact", "..."],         // 4-10 bullets
      "table": {"headers": ["..",".."], "rows": [["..",".."]]},   // OPTIONAL comparison table
      "examTraps": ["common confusion / distractor to watch for", "..."]  // 2-4
    }
  ],
  "questions": [
    {
      "id": "cm-001",
      "objective": 0,                   // index into objectives
      "type": "single" | "multi",      // multi = "Select all that apply" / "Choose two"
      "stem": "Scenario-based question text. For multi, say how many to choose e.g. (Choose two.)",
      "options": ["A text", "B text", "C text", "D text"],   // 4 options (5 allowed for multi)
      "answer": [1],                    // zero-based indices of correct option(s)
      "explanation": "Why the correct answer is right AND why each distractor is wrong.",
      "difficulty": "medium" | "hard"
    }
  ]
}
Formatting: inline `code` with backticks allowed; **bold** allowed. No HTML.
