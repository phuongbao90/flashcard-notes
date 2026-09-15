---
name: flashcard-creator
description: Generate structured technical questions and answers for staff level React and Next.js developers, or fill blank sections in existing Q&A files. Use for technical flashcards, interview preparation, and Q&A learning materials. Do not apply to ordinary technical explanations unless Q&A formatting is requested.
metadata:
  version: "1.0.0"
---

# Technical Q&A

Create concise (can sacrifice grammar for clarity), practical Q&A content that tests understanding of behavior, trade-offs, edge cases, and internal mechanics. Target senior to staff-level React and Next.js developers.

## When to Apply

- Generate technical interview questions with answers.
- Create flashcards or Q&A learning materials.
- Fill missing questions or answers in existing Q&A files.

## Required Output Format

Output only question-and-answer pairs. Use `### Question` and `### Answer` headings, one question bullet, and answer bullets. Separate pairs with `---` on its own line. Do not add an introduction, conclusion, category headings, or answer subsection headings.

For new pairs, use `### Question` exactly. When filling existing pairs, preserve the original heading, including any question ID; do not create or replace IDs.

````markdown
### Question

- How does `fetch()` handle HTTP error statuses such as 404 or 500?

### Answer

- **HTTP error statuses** do not cause `fetch()` to reject; it resolves with a `Response`.
- Check **`response.ok`** or `response.status` before treating the response as successful. Network failures and request cancellation can cause rejection.

```javascript
const response = await fetch("/api/data");

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

const data = await response.json();
```

---

### Question

- When should you check `response.status` instead of relying only on `response.ok`?

### Answer

- Use **`response.status`** when handling a particular status requires different behavior, such as treating a 404 as an absent resource.
- **`response.ok`** groups statuses from 200 through 299 as successful; it does not describe the response body or guarantee that JSON parsing will succeed.
````

## Question Quality

- Ask one concise, specific technical question per pair.
- Test reasoning about behavior, trade-offs, edge cases, or internal mechanics rather than memorized definitions.
- Prefer questions such as “Why does React re-render a component?” or “What problem does `useMemo` solve?”
- Avoid trivial definitions, yes/no questions, and vague prompts such as “Is React fast?”

## Answer Quality

- Start with a direct answer explaining the core concept.
- Include relevant behavioral details, caveats, or common mistakes. Do not invent a gotcha merely to fill a bullet.
- Add practical usage, comparisons, follow-up clarification, or performance considerations only when they help answer the question.
- Use simple, precise language and concise bullets. Highlight key terms with **bold** and API names with inline code.
- Include a minimal, focused code block only when it improves understanding. Use an appropriate language tag and keep the example within its answer block.
- Do not invent APIs or behavior. Verify uncertain or version-dependent claims against authoritative documentation when available; omit unsupported claims rather than guessing.

## Fill Blank Sections

When asked to complete existing content:

1. Preserve all non-blank content, question IDs, and pair order. Do not reformat or correct existing content unless requested.
2. Fill a blank answer from its question, following the answer guidelines.
3. Fill a blank question from its answer. If both are blank, infer the topic from the file's subject or surrounding content.
4. If the topic cannot be inferred, request the missing context instead of inventing it.
5. Ensure each completed pair has one question block and one answer block. If fixing an existing structural problem would change non-blank content, identify the need for a separate repair rather than silently editing it.

The preservation requirement takes precedence over normalizing existing headings or formatting in this mode.

## Optional Learning Principles

Apply these only when useful, without changing the required output format:

- **Atomicity:** Keep each card focused on one discrete idea.
- **Dual coding:** Suggest a relevant visual within an answer bullet when it aids understanding.
- **Interleaving:** When review advice is requested, suggest shuffling related topics within an answer bullet to encourage comparison and retrieval.

## Final Check

- Each generated pair contains the required headings, one question bullet, and a direct answer in bullets.
- Pairs are separated by `---`, and code fences are balanced.
- Answers include relevant behavior and directly address their questions.
- No extra headings or conversational text appear in generated Q&A output.
- When completing blanks, existing content and IDs remain unchanged.
