---
name: adr
description: Use when recording an architecture decision in iterable-linq-utility, or when a change goes against or replaces an accepted ADR in docs/decisions. Covers numbering, the MADR format, the index and superseding.
---

# Record an architecture decision

ADRs live in `docs/decisions/`, in the [MADR](https://adr.github.io/madr/) format. The index and the rules are in [docs/decisions/README.md](../../../docs/decisions/README.md).

## When

- A choice of structure, public API, tooling or process that later contributors must follow or would ask "why?" about.
- A change that contradicts an accepted ADR: write a new one that supersedes it; do not edit the old one.

A bug fix or a new operation that follows the existing ADRs needs no ADR.

## Steps

1. Take the next number: the highest `NNNN-*.md` in `docs/decisions/` plus one.
2. Name the file `NNNN-<short-title-in-kebab-case>.md` and fill [references/template.md](references/template.md).
    - At least two considered options, each with its pros and cons, including "do nothing" when it is a real option.
    - The consequences are honest: the negative ones matter as much as the positive ones.
    - `Technical Story` links the issue or the pull request.
3. Add a row to the table in `docs/decisions/README.md`.
4. When it replaces an ADR, set the old one's status to `superseded by [ADR NNNN](NNNN-….md)` (the only edit allowed on an accepted ADR); when it only corrects or completes part of one, set it to `accepted, amended by [ADR NNNN](…)` instead and link the old one from the new one.
5. Keep the instructions in sync, in the same pull request (ADR 0014):
    - a new rule for contributors goes in `AGENTS.md` (with the ADR number), in `documentation/docs/how-to-contribute.md`, in every skill of `.agents/skills/` whose procedure it touches (`SKILL.md` and its `references/`), and in a check in `scripts/` when it can be verified mechanically;
    - when the ADR supersedes or amends another one, find where the old rule is written (`grep -rn "NNNN" AGENTS.md .agents documentation/docs`, with the number of the old ADR) and change or remove it in the same places;
    - the skills keep pointing to the ADR: they hold checklists and templates, never a copy of its reasons.
