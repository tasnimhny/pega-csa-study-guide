# Question style guide: match the Pega Academy Mission Test, then make it harder

## What the Mission Test looks like (observed format, not copied items)
- 40 questions in 60 minutes, 80% to pass. Every question has exactly **4 options**, including multi-select.
- Multi-select questions end with **"(Choose Two)"** (sometimes "(Choose Three)"). Use this exact capitalization.
- **Stems are short and direct**: 1–3 sentences. A typical stem gives a small concrete setup and then asks the question on its own line, e.g.
  - a named application or case type, sometimes with concrete case IDs (e.g. `INV-204`, `CL-88`), followed by "Which statement about … is correct?"
  - "Which two statements describe …? (Choose Two)"
  - "Which option is available when you …?"
  - "Changes to which two of the following … can cause this result? (Choose Two)"
- **Options are short single statements**, about 4–15 words, parallel in grammar, with no "All/None of the above". Product terms are capitalized the Pega way: Case Type, Stage, Process, Step, View, Data Page, Data Transform, Decision table, When Rule, Work Queue, Access Group, Persona, Insight.
- **Distractors are near-misses.** They describe a real Pega feature in the wrong place, the wrong studio, the wrong default, the wrong scope or the wrong order of evaluation. Some distractors are things that sound plausible but don't matter (for example "the user who performs the test").

## Make it harder than the Mission Test (certification standard)
- The certification exam needs 65% on 60 questions in 90 minutes, and its items are harder than the mission test. Our goal is for someone who scores 80% here to pass comfortably.
- Every question must require **applying** a fact to a situation, or **telling apart two similar features**. Pure definition recall is not enough on its own.
- Use the subtle distinctions people get wrong, for example: goal vs deadline vs passed deadline (and which studio each is configured in); Refer vs Copy; Thread vs Requestor vs Node; Reload once per interaction restrictions; Decision table vs tree, including where only a table is allowed; Evaluate all rows; pattern vs directed inheritance search order; most-permissive role wins; production level ≥ rule; stage default (never skip) vs process default (always start); promoted action selection rule; Create stage restrictions; what Blueprint import builds in a Branch (everything except Access Roles); and so on.
- In multi-select questions, at least one wrong option should be *partly* true, with a wrong qualifier.
- About **40% multi-select**. Mark about 70% `"difficulty": "hard"`.
- The explanation must still say why the correct option(s) are right and why each distractor is wrong, using option *content*, never letters (options are shuffled at runtime).

## Hard rules
- Every fact comes from the mission notes. Don't invent features or numbers.
- Write all wording yourself. Don't reproduce Pega Mission Test or Academy items or sentences.
- Schema is unchanged (see SCHEMA.md), except that **all questions now have exactly 4 options**.
