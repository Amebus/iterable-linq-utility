# Instructions for AI coding agents

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-29

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/72

## Context and Problem Statement

The conventions of the repository (one file per operation, specs and benches for each one, complete JSDoc, `@since next`, a changeset per pull request) are written for humans, in the ADRs and in the contribution guide. An AI coding agent follows them only if it happens to read those pages: benches were forgotten for `reduce`, and #69 guessed a `@since` version.

Contributors use different agents: Claude Code, GitHub Copilot, Cursor, Codex. How does the repository make every agent follow its conventions, without keeping one copy of the rules per tool?

## Decision Drivers

* A convention that can be checked is checked, for agents and humans alike
* One source for the rules, readable by the most used agents
* The instructions loaded in every session stay short; long procedures load only when needed
* The ADRs stay the source of the reasons: instructions point to them instead of copying them

## Considered Options

* A: nothing, agents read the contribution guide on their own
* B: a skill only
* C: one instruction file per tool (`CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules`, …)
* D: three levels: checks in the CI, `AGENTS.md` loaded in every session, skills for the procedures

## Decision Outcome

Chosen option: "D: three levels".

1. **Checks.** What can be verified runs in the CI: `check:since`, `check:changeset` and `check:structure`, which fails when an operation of `src/functions` has no spec, wrapper spec, bench, export or chain method, or when a raw function or a chain method has an incomplete JSDoc.
2. **`AGENTS.md`**, the [open format](https://agents.md) read by Copilot, Cursor, Codex and other agents: the commands, the rules with their ADR, and what an agent must never do (bump the version, edit the changelog, write a version in `@since`). `CLAUDE.md` only imports it (`@AGENTS.md`), because Claude Code reads `CLAUDE.md` first.
3. **Skills** in `.agents/skills/`, the directory of the [Agent Skills](https://agentskills.io) standard, read by Codex, Copilot and Cursor: `operation`, `adr` and `pull-request`, each with templates in `references/`. `.claude/skills` is a symlink to it, because Claude Code reads only its own directory.

A new convention adds a line to `AGENTS.md` with its ADR, and a check when it can be verified.

### Positive Consequences

* The structural rules hold whoever writes the code
* One set of files works with the most used agents
* An agent gets the rules at the start of a session and the procedure when it starts the task

### Negative Consequences

* Rules that cannot be checked (the documentation site, the quality of a changeset note) still depend on the agent reading the instructions, and on the review
* The instructions must be updated with the ADRs; a skill that copies an ADR would drift, so the skills hold only checklists and templates
* On Windows the symlink needs `core.symlinks` (Git for Windows with symlinks enabled); without it Claude Code does not find the skills, the other agents still do
* `check:structure` knows the chain starters (`empty`, `range` as `fromRange`, `repeat`) and the helper `getMemoizeDefaultOptions` by name: a new one updates its tables

## Pros and Cons of the Options

### A: nothing

* Good, because there is nothing to maintain
* Bad, because the conventions are followed by chance

### B: a skill only

* Good, because it holds a detailed procedure
* Bad, because a skill loads only when the agent recognises the task: a rule it never loads does not exist
* Bad, because nothing checks the result

### C: one file per tool

* Good, because each tool reads its own native file
* Bad, because the same rules are copied three or four times and drift apart

### D: three levels

* Good, because each rule sits at the strongest level it can: a check when possible, otherwise the always-loaded file, and the procedure in a skill
* Bad, because it has three places to keep up to date
