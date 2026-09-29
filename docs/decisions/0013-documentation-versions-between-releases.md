# Documentation versions between releases

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-29

Technical Story: [design](../superpowers/specs/2026-09-29-release-process-design.md)

## Context and Problem Statement

The site is published with mike, one version per minor release, and `latest` is the default ([ADR 0002](0002-material-for-mkdocs-as-documentation-engine.md)). `publish_doc.yml` publishes what is on `main` under the minor of `package.json`.

With releases prepared on `main` ([ADR 0012](0012-trunk-based-releases-with-changesets.md)), `main` often documents features that are not released yet. Publishing it to fix a typo would describe, under the released version, APIs that the npm package does not have. How do documentation changes go online between two releases?

## Decision Drivers

* A released version of the site describes only what that version of the package contains
* A fix to the site should not wait for the next release to be visible somewhere
* An urgent fix to a released version must stay possible
* Little manual work

## Considered Options

* A: a `next` version of the site, published automatically from `main`
* B: a manual redeploy of a released version, from a chosen ref
* C: A and B together
* D: nothing: the site changes only at release time

## Decision Outcome

Chosen option: "C: A and B together".

* Every push to `main` that changes `documentation/` or `src/` deploys the `next` version ("next (unreleased)"). It never moves `latest` or the default version.
* A release deploys its minor and moves `latest`, as before.
* A manual run of `publish_doc.yml` redeploys a released version from a `ref` (by default the last tag), and moves `latest` only when that is the latest minor. For an urgent fix: merge it into `main`, create `docs/<minor>` from the release tag, cherry-pick the fix, and run the workflow on that branch.
* Deployments share a `concurrency` group, because each one pushes to `gh-pages`.

### Positive Consequences

* Released versions stay true to their package
* Fixes and new pages are visible in `next` as soon as they are merged
* Readers can preview the next release

### Negative Consequences

* A fix reaches `latest` only at the next release, unless it is redeployed by hand
* The manual redeploy needs a branch from the tag and a cherry-pick

## Pros and Cons of the Options

### A: `next` from `main`

* Good, because it is automatic and never touches released versions
* Bad, because alone it gives no way to fix a released version before the next release

### B: manual redeploy from a ref

* Good, because it can fix any released version
* Bad, because alone it leaves merged fixes invisible until someone runs it

### C: A and B

* Good, because it has the benefits of both; the manual path is needed only for urgent fixes
* Bad, because the workflow has three modes instead of one

### D: nothing

* Good, because it needs no change
* Bad, because a typo stays online until the next release
