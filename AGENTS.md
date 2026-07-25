# AGENTS.md

## Purpose

Define how AI agents should generate structured Question & Answer content for technical topics. The output must follow a strict, consistent format to ensure readability, correctness, and usefulness for learning or interview preparation.
Target for mid-level React, Next.js developers

---

## Output Format (Strict)

Every item MUST follow this exact structure:

````
### Question 05573229-eb5b-47f8-a42d-ba05e432576e

- <Question text>

### Answer

- <Direct answer explanation>
- <Additional clarification or edge cases if needed>

```javascript
// Optional code example (only if useful)
````

---

````

### Rules
- Use `### Question` and `### Answer` headings exactly.
- Questions must be concise, specific, and technical.
- Answers must be:
  - Accurate, Concise
  - Direct
  - Structured with bullet points
- Always include:
  - Core explanation
  - Behavioral details (edge cases, caveats)
- Include code blocks **only when they add value**.
- Separate each Q&A pair with `---`.
- Hightlight key terms in answers using ***

---

## Question Generation Guidelines

Agents should generate questions that:
- Test **real understanding**, not memorization
- Focus on:
  - Behavior
  - Trade-offs
  - Edge cases
  - Internal mechanics
- Avoid:
  - Trivial definitions
  - Yes/No questions
  - Vague wording

### Good Examples
- "How does fetch() handle HTTP error statuses?"
- "Why does React re-render a component?"
- "What problem does useMemo actually solve?"

### Bad Examples
- "What is fetch?"
- "Is React fast?"

---

## Answer Guidelines

Each answer should contain:

### 1. Direct Answer
- Clear explanation of the concept
- No fluff

### 2. Important Behavior / Gotchas
- Edge cases
- Common mistakes
- Non-obvious behavior

### 3. Practical Usage
- When applicable, show correct usage

### 4. Code Example (Optional)
- Only include if it improves understanding
- Keep it minimal and focused

---

## Example Output

### Question 2eb3fc87-dc20-4dc9-a936-857a74466210

- How does fetch() handle HTTP error statuses (like 404 or 500)?

### Answer

- fetch() does NOT reject the Promise for HTTP errors (e.g., 404, 500).
- It only rejects on network failures (e.g., offline, CORS issues, aborted request).
- You must manually check `response.ok` or `response.status`.

```javascript
const response = await fetch("/api/data");

if (!response.ok) {
  throw new Error(`HTTP error! Status: ${response.status}`);
}

const data = await response.json();
````

---

## Style Guidelines

- Use simple, precise language
- Avoid unnecessary verbosity
- Prefer bullet points over paragraphs
- Keep answers dense and informative
- Do NOT include conversational text

---

## Agent Behavior Rules

- Do not hallucinate APIs or behavior
- If uncertain, prefer omission over guessing
- Prioritize correctness over completeness
- Maintain consistent formatting across all outputs
- Ensure every answer directly addresses the question

---

## Optional Enhancements

Agents MAY include:

- "Follow-up" clarification bullets
- Comparisons with related concepts
- Performance considerations

Agents MUST NOT:

- Change the format
- Add unrelated commentary
- Skip sections

---

## Scope

This format is intended for:

- Flashcard-style technical Q&A
- Interview preparation
- Technical learning
- Knowledge base generation

---

## Summary

Agents should behave like:

- A strict technical interviewer when generating questions
- A senior engineer when answering

Output must be:

- Structured
- Precise
- Practical
