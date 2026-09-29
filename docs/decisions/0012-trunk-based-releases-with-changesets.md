# Trunk-based releases with changesets

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-29

Technical Story: [design](../superpowers/specs/2026-09-29-release-process-design.md)

## Context and Problem Statement

Up to 0.1.0 a release was manual: the maintainer bumped `package.json` and created a GitHub Release, which triggered `publish.yml`. Nothing said when the version changes, and a pull request could not know the version it would ship in, so `@since` tags were guessed (#69 merged `@since 0.2.0` while the package was at `0.1.0`).

Which branches does the repository use, who decides the version of a release, and how is a release published?

## Decision Drivers

* The bump is decided, and reviewed, where the change is made
* Several pull requests can ship in the same release, when the maintainer decides
* `@since` never holds a guessed version
* A single maintainer: little ceremony, no branches to keep aligned
* Independent of the merge strategy (rebase, squash or merge commit)
* The npm trusted publisher is bound to `publish.yml`

## Considered Options

* Branching
  * A: gitflow, with a `release` branch where the version is bumped
  * B: `main` only, with feature branches
* Versioning
  * C: version computed from the Conventional Commits (release-please, semantic-release)
  * D: version declared in each pull request (changesets)
  * E: version chosen by hand at release time

## Decision Outcome

Chosen options: "B: `main` only" and "D: changesets".

* A pull request that changes `src/` adds a changeset with the bump and a note for users; the CI fails without it. Before 1.0 a breaking change is a `minor`.
* New APIs use `@since next`. The CI rejects a `@since` greater than the version in `package.json`.
* The `prepare-release.yml` workflow, started by hand, runs the checks and opens the "Version Packages" pull request: `changeset version` bumps `package.json`, writes `CHANGELOG.md` and deletes the changesets, then `@since next` becomes the new version.
* Merging that pull request publishes: `publish.yml`, on a push to `main` whose version has no tag, publishes to npm, creates the tag `X.Y.Z` and the GitHub Release, and deploys the documentation. Everything runs in one workflow, because a tag created with `GITHUB_TOKEN` does not trigger other workflows.

### Positive Consequences

* The reviewer of a pull request sees its bump and its changelog note
* The changelog is written for users, not assembled from commit messages
* A wrong bump is fixed before the release by editing a file, not by rewriting history
* One long-lived branch: nothing to merge back after a release

### Negative Consequences

* One more file in every pull request that changes `src/`, and an empty changeset for the ones that release nothing
* `main` contains unreleased changes; the documentation handles that with a `next` version ([ADR 0013](0013-documentation-versions-between-releases.md))
* The CI does not run on the Version Packages pull request, because it is opened with `GITHUB_TOKEN`; `prepare-release.yml` runs the same checks before opening it
* Two more devDependencies: `@changesets/cli` and `@changesets/changelog-github`

## Pros and Cons of the Options

### A: gitflow, with a `release` branch

* Good, because a branch always matches what is released
* Bad, because the bump commit lands on `release` and must be merged back into `main` after every release, or the next release consumes the same changesets again; with rebase merges the two branches diverge
* Bad, because it is heavy for a single maintainer

### B: `main` only

* Good, because there is nothing to keep aligned
* Good, because the release is a pull request like any other
* Bad, because `main` is not always what is published

### C: version computed from the commits

* Good, because pull requests need no extra file
* Bad, because every commit decides the bump: a `feat` that should be a `fix` changes the version, and with rebase merges its message cannot be fixed after the merge
* Bad, because the changelog is only as good as the commit messages

### D: changesets

* Good, because the bump and the note are reviewed with the change and can be edited until the release
* Good, because it does not depend on commit messages or on the merge strategy
* Bad, because a pull request can forget its changeset (the CI checks it)

### E: version chosen at release time

* Good, because it needs no tooling
* Bad, because nobody records the impact of a change when it is made, and `@since` stays a guess until the release
