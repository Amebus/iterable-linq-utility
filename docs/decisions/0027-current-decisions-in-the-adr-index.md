# Current decisions in the ADR index

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-31

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/<number>

Amends: [ADR 0014](0014-instructions-for-ai-coding-agents.md)

## Context and Problem Statement

The ADRs record each decision with its context, the options and the consequences: 26 files, about 16,000 words. To know how the library is built today, a reader has to open them one by one. The state of an amended decision is split across two files (0003 and 0023, 0021 and 0022, 0025 and 0026). `AGENTS.md` lists the rules for contributors ([ADR 0014](0014-instructions-for-ai-coding-agents.md)), but it leaves out the decisions that are not rules for writing code (the package formats, the documentation engine, the checks on the release pull request). The index of `docs/decisions/` lists the records with their title and status, not what they decided.

Where can a reader, human or agent, find the architecture chosen today without reading every ADR, and without the history of how it got there?

## Decision Drivers

* A snapshot of the current state: what holds today, not the options rejected or the decisions replaced
* One place to read, which links to the ADRs for the reasons
* Little to keep in sync, and a check that fails when it drifts
* The catalog of all the records stays, for the numbering and the links between ADRs

## Considered Options

* A: a "Current decisions" section at the top of the index, above the catalog of all the records
* B: a separate file, for example `docs/decisions/current-state.md`
* C: a "Decision" column in the catalog of the index
* D: nothing: `AGENTS.md` is already the snapshot for the agents

## Decision Outcome

Chosen option: "A: a 'Current decisions' section at the top of the index".

* `docs/decisions/README.md` has two sections:
  * **Current decisions**: one row for each decision in force, `Decision | ADR`. The decision is one sentence in the present tense: what holds, not why.
  * **All records**: the catalog that exists today, `ADR | Title | Status`, with every record, superseded ones included.
* A decision amended by another ADR has one row, with the state that results from both and a link to each of them.
* A decision superseded entirely is not in the snapshot: only the ADR that replaces it is. The history is in the catalog, in the ADRs and in git.
* The ADR that adds, amends or supersedes a decision updates the snapshot in the same pull request. It adds a row, merges its change into the row of the amended decision, or removes the row of the superseded one ([adr skill](../../.agents/skills/adr/SKILL.md)).
* `pnpm check:instructions` fails when:
  * an ADR that is not superseded is not cited in the snapshot;
  * a superseded ADR is still cited in it;
  * the status of a record in the catalog differs from the `Status:` line of its file.
* `AGENTS.md` and `documentation/docs/how-to-contribute.md` point to the snapshot for the current decisions, and to the ADRs for the reasons.

### Positive Consequences

* The current architecture can be read in one page, and an agent reads the snapshot instead of opening every ADR
* An amended decision reads as one rule, not as two files to combine
* No new file: the snapshot lives where the ADRs are already listed, next to the catalog
* The check keeps the snapshot complete and the catalog consistent with the files

### Negative Consequences

* Every ADR updates one more place, and the sentence of an amended decision has to be rewritten, not appended to
* One sentence per decision leaves out details: the ADR remains the reference
* The check verifies that each ADR is cited, not that the sentence is right: that is left to the review

## Pros and Cons of the Options

### A: a section at the top of the index

* Good, because it is one page, next to the catalog that the [adr skill](../../.agents/skills/adr/SKILL.md) already updates
* Good, because the snapshot leaves out the superseded decisions while the catalog keeps every record
* Bad, because the index grows, with two tables that cite the same ADRs

### B: a separate file

* Good, because it can group the decisions by topic and read as a description of the architecture
* Bad, because it is one more file to find and to keep in sync, away from the catalog

### C: a "Decision" column in the catalog

* Good, because it is the smallest change: one cell per row
* Bad, because the catalog lists every record: a superseded decision would stay among the current ones, and the snapshot would carry the history
* Bad, because an amended decision would still be split across two rows

### D: nothing

* Good, because there is nothing to write or check
* Bad, because `AGENTS.md` holds the rules for contributors, not the decisions that are not rules (0002, 0006, 0010, 0015, 0017, 0023), and an amended decision is still split across two files
