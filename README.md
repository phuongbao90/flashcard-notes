# Flashcard Notes

Markdown flashcards, one deck per file.

## Layout

- Folder = topic (`react/`), file = subtopic (`react-context.md` → subtopic `react-context`).
- Filenames may carry a numeric prefix (`01-`, `1-`, `1 - `) — strip for display, sort numerically by it for order.
- `<subtopic>.notes.md` = long-form study notes for that subtopic (e.g. `react/react-context.notes.md`). Match the suffix case-insensitively, pair by sibling path (same directory, same stem before `.notes`). Not decks; load as the subtopic's notes. Missing notes files are normal.

## Card format

- `### Question <uuid>` + `### Answer` heading blocks, one question bullet, answer bullets, separated by `---`.
- UUIDs are enforced by the pre-push hook: `npm run check:question-uuids`.

## Ignored by deck importers

`README.md`, `AGENTS.md`, `NOTE.md`, `.agents/`, `.temp-questions/`, `node_modules/`. `*.notes.md` is loaded as notes, never parsed as a deck.
