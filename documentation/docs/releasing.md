# Releasing

How a version is released, and the rules that protect `main` and the release tags. Only the maintainer runs a release; a contributor needs only [How to contribute](how-to-contribute.md).

## Releasing a version

The repository has one long-lived branch, `main`, and the changesets of the merged pull requests wait there until a release ([ADR 0012](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0012-trunk-based-releases-with-changesets.md), [ADR 0015](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0015-checks-on-the-release-pull-request.md)).

1. Run the **Prepare release** workflow from the Actions tab. It runs the checks and opens, or updates, the `chore: release` pull request: the new version in `package.json`, the entries of `CHANGELOG.md`, the changesets deleted, `@since next` replaced with the version.
2. Review the version and the changelog in that pull request. Its CI run, created by `github-actions`, waits for an approval: click "Approve and run workflows", or close and reopen the pull request (`check:changeset` is skipped for `changeset-release/*` branches). `main` requires the `build` check, so the pull request cannot be merged until that run passes.
3. **Before merging, check that nothing changed `src/` on `main` since the workflow ran.** The pull request is computed when the workflow runs: a pull request merged later keeps its changeset pending for the next release, and its `@since next` is not replaced, so an API published in this version would get the next version at the next release. If that happened, run **Prepare release** again: it recomputes the release from `main` and updates the same pull request. A change outside `src/` (documentation, CI) needs nothing. To check, an empty output means nothing to do:

    ```bash
    git fetch origin
    git diff --stat origin/changeset-release/main...origin/main -- src .changeset
    ```

4. Merge it. The **Npm Publish** workflow sees a version without a tag: it publishes the package to npm, creates the tag and the GitHub Release, and deploys the documentation of that minor as `latest`.

## Protection rules

Two rulesets protect the repository ([ADR 0016](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0016-protection-rules-for-main-and-release-tags.md)), and nobody bypasses them, administrators included:

- `main`: no deletion, no force-push, changes only through a pull request with the `build` check passed;
- `release-tags` (`X.Y.Z`): a tag can be created, but not deleted or moved.

Their definitions are in `.github/rulesets/`. To change a rule, change the file in a pull request, then apply it:

```bash
gh api repos/Amebus/iterable-linq-utility/rulesets --jq '.[] | "\(.id) \(.name)"'   # the ids
gh api -X PUT repos/Amebus/iterable-linq-utility/rulesets/<id> --input .github/rulesets/main.json
```

On a new repository, create them with `gh api -X POST repos/<owner>/<repo>/rulesets --input .github/rulesets/<name>.json`. In an emergency, an administrator can disable a ruleset in Settings → Rules → Rulesets, and must enable it again afterwards.

## Documentation between releases

The site has a `next` version, deployed on every push to `main` that changes `documentation/`, `src/` or `.changeset/`: a fix is visible there at once, and in `latest` at the next release ([ADR 0013](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0013-documentation-versions-between-releases.md)).

`next` shows a banner computed from the pending changesets ([ADR 0017](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0017-state-of-the-next-documentation.md)): without changesets it matches the latest release, the version in `package.json`; with changesets it links to an Upcoming page generated from their notes. The note of a changeset is therefore visible on the site as soon as the pull request is merged. To preview the banner and the page, from the root of the repository:

```bash
env $(node scripts/next-doc.ts) mkdocs serve -f documentation/mkdocs.yml
```

`scripts/next-doc.ts` writes `documentation/docs/upcoming.md`, which git ignores. A release or a plain `mkdocs serve` builds the site without the banner.

The Changelog page includes `CHANGELOG.md`, which the release writes: every version of the site shows the notes up to its own release, and the unreleased ones are on the Upcoming page of `next`.

After a deployment, the version selector can show the old title for up to 10 minutes: it reads `versions.json`, which GitHub Pages serves with `cache-control: max-age=600`, while the banner is in the page itself. A hard refresh shows the new title. For the same reason, right after a release is merged the banner can say that `next` matches the new version while `latest` still shows the previous one, until **Npm Publish** deploys it.

For an urgent fix to a released version:

```bash
git switch -c docs/0.1 0.1.0   # the release tag
git cherry-pick <commit of the fix on main>
git push -u origin docs/0.1
```

Then run the **Publish Doc** workflow with `ref` set to `docs/0.1`. Without a `ref` it redeploys the last tag.
