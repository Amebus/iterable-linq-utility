# State of the next documentation

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-02

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/96

Amends: [ADR 0013](0013-documentation-versions-between-releases.md)

## Context and Problem Statement

[ADR 0013](0013-documentation-versions-between-releases.md) publishes the `next` version of the site from `main`, titled "next (unreleased)", and never deletes it. Right after a release `next` is the same as `latest`, but it still says "unreleased"; when it documents changes that are not released, it does not say which ones. How does a reader of `next` know whether it matches the latest release, and what it adds?

## Decision Drivers

* The reader sees the state of `next` at a glance, on every page
* The released versions of the site do not change
* The state is computed, not maintained by hand
* No new tool or dependency

## Considered Options

* A: a banner and a version title computed from the pending changesets, and an Upcoming page with their notes
* B: a fixed banner on `next` ("this documents `main`"), without the state
* C: nothing

## Decision Outcome

Chosen option: "A: a banner and a version title computed from the pending changesets".

* The pending changesets (`.changeset/*.md`, without the empty ones) are the changes that are not released yet ([ADR 0012](0012-trunk-based-releases-with-changesets.md)). In the `next` mode, `publish_doc.yml` runs `scripts/next-doc.ts` before `mike deploy`:
  * with no pending changeset, `next` is titled "next (= 0.X)" and its banner says that it matches the latest release, with a link to `latest`;
  * with pending changesets, `next` is titled "next (unreleased)", its banner says how many changes are unreleased, and links to an Upcoming page generated from their notes, with the pull request that added each one.
* The banner is an override of the `announce` block of Material (`documentation/overrides/main.html`), fed by `extra.next` with `!ENV`. Only the `next` mode sets the variables, so a release or a redeploy builds the site without the banner, and the Upcoming page exists only in `next`.
* The latest release is the version in `package.json`, not the last tag. The release pull request changes the version and deletes the changesets in the same commit, so the two always match; the tag is created later by Npm Publish, which runs at the same time as the `next` deployment.
* The push trigger of `publish_doc.yml` includes `.changeset/**`, besides `documentation/**` and `src/**`. A release with no new API does not change `src/` (only `@since next` is replaced there), and without this path `next` would keep announcing the changes that were just released.

### Positive Consequences

* `next` says whether it is ahead of `latest`, and by what
* The Upcoming page has the text of the next changelog, before the release
* Released versions are built as before

### Negative Consequences

* For a few minutes after a release is merged, the banner says "matches 0.X" and links to `latest`, which is still the previous version until Npm Publish deploys the new one
* The banner is a template override of Material: the migration to Zensical ([#88](https://github.com/Amebus/iterable-linq-utility/issues/88)) has to port it
* A link to the Upcoming page breaks after the release, when `next` is deployed without it; the banner links to it only while it exists

## Pros and Cons of the Options

### A: computed banner, title and Upcoming page

* Good, because the state is always the one of `main`, with no manual step
* Bad, because it adds a script, a template override and a step to the workflow

### B: a fixed banner

* Good, because it is one line of configuration
* Bad, because it does not say whether `next` differs from `latest`, which was the problem

### C: nothing

* Good, because it needs no change
* Bad, because readers cannot tell `next` from `latest` after a release
