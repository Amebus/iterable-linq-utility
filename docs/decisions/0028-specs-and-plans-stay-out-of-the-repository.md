# Specs and plans stay out of the repository

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-01

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/195

## Context and Problem Statement

The AI agents that work on the repository write a design spec before a large change and an implementation plan before the code, in `docs/superpowers/specs/` and `docs/superpowers/plans/`, and the workflow commits them. Four specs and four plans are in `main`, about 17,000 words. Once the work is merged they describe the design of that moment, not the code of today: nothing links them, nobody updates them, and an agent that reads `docs/` can take them as current. The decisions they led to are already in the ADRs, and the discussion is in the issues and the pull requests.

Where do the specs and plans of a change live once the change is merged?

## Decision Drivers

* One place for what holds today: the code, the ADRs and [Current decisions](README.md#current-decisions)
* No document in the repository that describes a past state as if it were current
* The history stays reachable
* The agents can still write a spec and a plan while they work

## Considered Options

* A: keep committing them
* B: keep them, with a note that they describe the design of their time
* C: keep them local: git ignores `docs/superpowers/`, and the files in `main` are deleted

## Decision Outcome

Chosen option: "C: keep them local".

* `.gitignore` lists `docs/superpowers/`. The agents still write the specs and the plans there, as working files: they are not committed.
* The four specs and four plans in `main` are deleted. They stay in the git history: for example the spec that [ADR 0007](0007-iterator-base-classes-with-explicit-state.md) cites is in commit `28f94d5`.
* What a change leaves in the repository: a decision in an ADR, the agreed design in the issue or in the description of the pull request, the explanation of how the code works in the documentation ([Architecture](../../documentation/docs/architecture.md)).
* `AGENTS.md`, [Working with AI agents](../../documentation/docs/ai-agents.md) and How to contribute say so.

### Positive Consequences

* `docs/` holds only the ADRs, which are kept current by their statuses and by Current decisions
* An agent reading the repository finds no outdated design
* No document to keep in sync after the merge

### Negative Consequences

* A spec or a plan is lost when the machine it was written on is: what must last goes in the issue, the pull request or an ADR
* A reviewer cannot read the plan in the pull request unless the description includes what matters of it
* ADR 0007 cites a path that no longer exists in `main`

## Pros and Cons of the Options

### A: keep committing them

* Good, because the design of every large change is next to the code
* Bad, because the documents grow out of date at the merge, with nothing that tells the reader
* Bad, because they repeat what the ADRs and the pull requests already hold

### B: keep them, with a note

* Good, because the history stays in the tree, readable without git
* Bad, because a note at the top of the folder does not stop an agent that opens one file, and the folder keeps growing with every change

### C: keep them local

* Good, because what is in the repository is current, and the history is in git
* Bad, because the working documents of a change are no longer shared: the pull request has to carry what matters
