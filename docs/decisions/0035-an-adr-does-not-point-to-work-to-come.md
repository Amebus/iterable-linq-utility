# An ADR does not point to work to come

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-08

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/219

Amends: [ADR 0017](0017-state-of-the-next-documentation.md), [ADR 0021](0021-benchmark-standards.md), [ADR 0025](0025-property-keys-as-selectors.md)

## Context and Problem Statement

An ADR records a decision that has been taken. Four passages of accepted ADRs point instead to work that is still open:

* [ADR 0017](0017-state-of-the-next-documentation.md), in its consequences: "the migration to Zensical (#88) has to port it";
* [ADR 0021](0021-benchmark-standards.md): "Whether to publish them in the documentation is discussed in #161";
* [ADR 0025](0025-property-keys-as-selectors.md), in its compatibility: "An options object after the selectors (#167)…" and "A data-last form (#114)…".

They read as if part of the decision were still to be taken, or as if the ADR bound a change that nobody has decided. The same ADR 0025 also cites #177, which is open too, as the source of a measurement that was already made: that passage leaves nothing open. Nothing in the `adr` skill, its template or the instructions says how an ADR may cite an issue, and the first draft of [ADR 0033](0033-a-second-sample-for-the-length-of-the-runs.md) linked its follow-up issue.

An accepted ADR is never edited, only its status changes. What may an ADR say about the work after it, and what happens to the four passages?

## Decision Drivers

* An ADR says what holds, limits included, so that it reads the same once every issue it mentions is closed
* An accepted ADR is not edited
* The open questions stay in one place, the issue
* A rule that can be followed and reviewed without knowing which issues are open today

## Considered Options

* A: no pointer to work or decisions to come; an issue may be cited as the source of a fact or as the origin of the decision, and one new ADR amends the four passages
* B: no open issue cited at all, in any role
* C: the rule from now on only, the four passages left as a record of their time
* D: close or decide #88, #114, #161 and #167, so that the links no longer point to open issues

## Decision Outcome

Chosen option: "A: no pointer to work to come".

* An ADR states what was decided and what it costs. It does not point to work to come, to a decision still to be taken or to an issue that will discuss it. A limit that the decision accepts is written as a limit, without a pointer to whoever may lift it.
* An issue or a pull request may be cited as the source of a fact (a measurement, a report, a bug) or as the origin of the decision: `Technical Story` links the issue or the pull request the ADR comes from, also while it is open.
* The open question goes in its issue, which may link the ADR. When the issue changes the decision, a new ADR amends or supersedes the old one.
* The four passages of ADR 0017, 0021 and 0025 listed above bind nothing: the Zensical migration, the publication of the benchmark results, the options of `collectToMap` and a data-last form are not decided by those ADRs, and stay open in their issues. What those ADRs decide does not change, so their rows in [Current decisions](README.md#current-decisions) do not change either. The citation of #177 in ADR 0025 is a source and stays valid.
* The status of ADR 0017, 0021 and 0025 adds `amended by ADR 0035`, the only edit allowed on an accepted ADR.
* The `adr` skill and its template, `AGENTS.md` and How to contribute state the rule. No script checks it.

### Positive Consequences

* An ADR reads as a closed decision, today and after its issues are closed
* The rule depends on what the text says, not on the state of an issue, so a review can apply it without the GitHub API
* The issues that the four passages pointed to keep their discussion, and can cite the ADRs they would change

### Negative Consequences

* The four passages stay in the text of their ADRs: a reader has to see the status line, and this ADR, to know that they bind nothing
* Telling a source from a pointer to future work is a judgement made in the review, not by a check

## Pros and Cons of the Options

### A: no pointer to work to come, issues allowed as sources

* Good, because it targets what makes an ADR read as undecided: the pointer to the future, not the issue number
* Good, because the measurements and the reports that justify a decision can still be cited where they are
* Good, because one ADR fixes the four passages without editing them
* Bad, because it needs a judgement on each citation

### B: no open issue cited at all

* Good, because it is simple to state
* Bad, because a citation that is valid while an issue is closed becomes invalid when it reopens, and the reverse: the text of the ADR does not change, its validity does
* Bad, because it forbids citing the source of a measurement, such as #177 in ADR 0025, that is still open for other reasons
* Bad, because a check needs the GitHub API, so the network, in the local run and in the CI

### C: the rule from now on only

* Good, because it changes no ADR
* Bad, because four passages of accepted ADRs keep reading as decisions still to be taken, with nothing that says otherwise

### D: close or decide the issues

* Good, because no ADR changes
* Bad, because it decides four unrelated topics to fix a wording, or closes issues that are still open
* Bad, because the passages would still read as pointers to work, only to closed issues
