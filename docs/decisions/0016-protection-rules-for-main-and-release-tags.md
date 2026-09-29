# Protection rules for main and the release tags

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-29

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/76

Amends: [ADR 0015](0015-checks-on-the-release-pull-request.md)

## Context and Problem Statement

[ADR 0012](0012-trunk-based-releases-with-changesets.md) makes `main` the only long-lived branch: every release is published from it. Nothing protects it. Anyone with write access can push to it directly, force-push it or delete it, and a pull request can be merged with the CI red or still running. An AI coding agent runs with the credentials of whoever uses it, so the rule "never push unless asked" in `AGENTS.md` ([ADR 0014](0014-instructions-for-ai-coding-agents.md)) is only an instruction.

The release tags (`X.Y.Z`) are not protected either. `publish.yml` publishes a version when its tag does not exist, and the documentation of a released version is built from its tag: a tag deleted or moved breaks both.

Which rules protect `main` and the release tags?

## Decision Drivers

* Every change to `main` goes through a pull request with the CI green, whoever makes it
* The release workflows keep working: none of them pushes to `main`, `gh release create` creates the tags
* A single maintainer can merge their own pull requests
* The rules can be reviewed and recreated

## Considered Options

* A: nothing
* B: classic branch protection on `main`
* C: rulesets, with a bypass for the administrators
* D: rulesets, without a bypass

## Decision Outcome

Chosen option: "D: rulesets, without a bypass".

Two repository rulesets, saved in [`.github/rulesets/`](../../.github/rulesets) in the format of the REST API:

* `main` (the default branch): no deletion, no force-push, changes only through a pull request, with the `build` job of the CI passed. No review is required, and the branch does not have to be up to date with `main` before merging.
* `release-tags` (`refs/tags/*.*.*`): no deletion, no update, no force-push. Creating a tag is allowed, so the release workflow needs no bypass.

Nobody bypasses them, the administrators included. In an emergency, an administrator disables a ruleset in the settings and enables it again afterwards.

The rulesets are applied with `gh api`, as described in the contribution guide. The files in `.github/rulesets/` are the reference: a change to the rules changes them in a pull request, then applies them.

This amends [ADR 0015](0015-checks-on-the-release-pull-request.md): `main` now requires the `build` check, so the CI run of the release pull request must be approved (or the pull request closed and reopened) before it can be merged.

### Positive Consequences

* A direct push, a force-push or a merge with the CI red is rejected by GitHub, for people and for agents alike
* A published version keeps its tag
* The rules are versioned next to the code

### Negative Consequences

* An urgent fix also waits for the CI, or needs the ruleset disabled by hand
* The release pull request needs one more click: approving its CI run
* The files in `.github/rulesets/` can drift from the settings when the rules are changed from the UI; nothing checks them

## Pros and Cons of the Options

### A: nothing

* Good, because it needs no setup
* Bad, because a mistake on `main` or on a tag is caught only after it is published

### B: classic branch protection

* Good, because it is the well-known option
* Bad, because it cannot protect tags, and GitHub develops rulesets in its place
* Bad, because administrators bypass it unless "Do not allow bypassing" is set

### C: rulesets with a bypass for the administrators

* Good, because an urgent fix can skip the CI
* Bad, because the maintainer's credentials, used by agents too, bypass it: it would protect against nobody

### D: rulesets without a bypass

* Good, because the rules hold for everybody
* Good, because rulesets also protect tags, and can be exported and imported as JSON
* Bad, because an emergency needs the ruleset disabled by hand
