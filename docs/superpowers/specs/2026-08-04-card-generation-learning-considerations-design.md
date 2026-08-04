# Card-Generation Learning Considerations

## Goal

Add advisory guidance for card-set answers without changing the repository's strict Q&A output format.

## Options Considered

1. Add the guidance as a short subsection in `AGENTS.md` — recommended. It is visible alongside existing card-generation rules and adds no runtime behavior.
2. Make the principles mandatory output sections — rejected because it conflicts with the strict Q&A-only format and the request says they are considerations, not requirements.
3. Create a separate learning-guidelines file — rejected because it adds an unnecessary file and makes the guidance easier to miss.

## Design

Add an **Optional Learning Considerations for Card Sets** subsection to `AGENTS.md` near the generation guidance. When responding to a request to generate a set of cards, agents should consider:

- keeping each card to one discrete fact or idea (Atomic Principle; Wozniak; cognitive-load rationale);
- suggesting a useful diagram or other visual companion where it materially improves recall (Dual Coding; Paivio);
- suggesting that related topics be shuffled in review to improve contrast and retrieval (Interleaving; Rohrer & Taylor).

The guidance must explicitly state that these are optional considerations, not required content. It must not add headings or commentary to generated flashcard output and does not apply to ordinary individual-answer requests.

## Validation

Review the resulting `AGENTS.md` to confirm the three principles are present, clearly advisory, scoped to card-set generation, and do not alter the existing required output format.
