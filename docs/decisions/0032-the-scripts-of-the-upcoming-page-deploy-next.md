# The scripts of the Upcoming page deploy next

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-03

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/208

Amends: [ADR 0017](0017-state-of-the-next-documentation.md)

## Context and Problem Statement

[ADR 0017](0017-state-of-the-next-documentation.md) deploys `next` on every push to `main` that changes `documentation/**`, `src/**` or `.changeset/**`, and builds its banner and its Upcoming page with `scripts/next-doc.ts`. The script is not one of those paths: a fix to it (#208, the notes after a note of several paragraphs were not list items) reaches the site only at the next push that changes one of them, or with a manual run of Publish Doc. How does a change to the code that builds `next` reach `next`?

## Decision Drivers

* A fix to the Upcoming page is visible on the site as soon as it is merged, as a fix to the documentation is
* No manual step after the merge
* No deployment for a change that cannot change the site

## Considered Options

* A: the scripts that build the Upcoming page and the banner are in the push paths of `publish_doc.yml`
* B: all of `scripts/` in the push paths
* C: nothing: run Publish Doc by hand after such a change

## Decision Outcome

Chosen option: "A: the scripts that build the Upcoming page and the banner are in the push paths".

* The push trigger of `publish_doc.yml` also includes `scripts/next-doc.ts` and the modules it imports, `scripts/upcoming.ts` and `scripts/sourceFiles.ts`. A module added to them goes in the paths too.
* The other scripts (the checks, the bench report, the release notes) do not change the site and stay out.

### Positive Consequences

* A change to the Upcoming page or to the banner is on `next` when it is merged
* The other changes to `scripts/` deploy nothing, as before

### Negative Consequences

* The list of paths has to follow the imports of `scripts/next-doc.ts`: a module it starts to import and that is not in the list does not deploy `next`
* A change to `sourceFiles.ts` made for the checks deploys `next` too, with the same site

## Pros and Cons of the Options

### A: the scripts of the page in the paths

* Good, because only a change that can change the site deploys it
* Bad, because the list repeats the imports of `next-doc.ts`

### B: all of `scripts/`

* Good, because no list to keep in sync
* Bad, because every change to a check or to the bench report deploys the same site again

### C: nothing

* Good, because it needs no change
* Bad, because a fix to the page waits for an unrelated push or a manual run, which is easy to forget
