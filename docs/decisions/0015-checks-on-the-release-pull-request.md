# Checks on the release pull request

* Status: accepted, amended by [ADR 0016](0016-protection-rules-for-main-and-release-tags.md)
* Deciders: Amebus
* Date: 2026-09-29

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/73

Amends: [ADR 0012](0012-trunk-based-releases-with-changesets.md)

## Context and Problem Statement

[ADR 0012](0012-trunk-based-releases-with-changesets.md) says that the CI does not run on the release pull request, because `prepare-release.yml` opens it with `GITHUB_TOKEN`. The first release (#71) showed otherwise: GitHub creates the CI run of a pull request opened by `github-actions`, and holds it until a maintainer approves it ("Approve and run workflows").

The first release also showed a gap: the release pull request is computed when Prepare release runs. A pull request that changes `src/` and is merged after that is not part of it: its changeset waits for the next release, and its `@since next` is not replaced, so an API published in this version would get the next version at the next release.

How are the release pull request's checks handled, and how is it kept up to date with `main`?

## Decision Drivers

* The release publishes exactly what `main` contains, with the right versions in `@since` and in the changelog
* No extra work when nothing changed
* The checks of Prepare release stay the gate; the CI on the release pull request is optional

## Considered Options

* A: a documented rule: before merging, check that nothing changed `src/` or `.changeset/` since Prepare release, otherwise run it again
* B: a CI check that fails the release pull request when `main` changed `src/` since it was computed
* C: run Prepare release automatically on every push to `main` that changes `src/` or `.changeset/`

## Decision Outcome

Chosen option: "A: a documented rule".

* The CI run on the release pull request waits for an approval. It can be left pending: Prepare release already ran the same checks. If `main` ever requires status checks, approve it.
* Before merging, the maintainer runs `git diff --stat origin/changeset-release/main...origin/main -- src .changeset`. An empty output means the release is up to date; otherwise Prepare release runs again and updates the same pull request. The steps are in the Releases section of the contribution guide.

### Positive Consequences

* No new workflow and no new check for a situation that is rare with a single maintainer
* The documentation of the process matches what GitHub does

### Negative Consequences

* The rule depends on the maintainer remembering it; nothing blocks a stale release pull request
* The CI run on the release pull request stays pending unless approved

## Pros and Cons of the Options

### A: a documented rule

* Good, because it needs no code
* Bad, because it is not enforced

### B: a CI check

* Good, because a stale release cannot be merged by mistake
* Bad, because the CI on the release pull request waits for an approval, so the check would run only if approved
* Bad, because it adds a script and a workflow step for a rare case

### C: automatic Prepare release

* Good, because the release pull request is always up to date
* Bad, because it contradicts ADR 0012: the release is prepared on demand, and opening a release pull request after every merge adds noise
