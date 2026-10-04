# Working with AI agents

The repository has instructions for AI coding agents, so that an agent follows the same conventions as a human contributor. The reasons are in [ADR 0014](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0014-instructions-for-ai-coding-agents.md).

## What each agent reads

| File | Content | Read by |
| --- | --- | --- |
| `AGENTS.md` | Commands, rules with their ADR, what never to do | Copilot, Cursor, Codex and most agents, in every session |
| `CLAUDE.md` | `@AGENTS.md`: imports it | Claude Code, in every session |
| `.agents/skills/` | Procedures with templates | Codex, Copilot, Cursor, when the task matches |
| `.claude/skills/` | A symlink to `.agents/skills/` | Claude Code, when the task matches |

The skills:

- `operation`: add or change an operation, with the templates of the JSDoc, the specs, the bench and the documentation page.
- `adr`: record an architecture decision.
- `pull-request`: prepare a branch for a pull request: changeset, checks, commits.

An agent loads a skill by itself when the task matches its description. You can also ask for it: "use the operation skill", or `/operation` in Claude Code.

On Windows, clone with symlinks enabled (`git config --global core.symlinks true`, with Developer Mode or administrator rights), or Claude Code does not find the skills.

## What the CI checks anyway

The instructions help the agent; the checks hold whoever writes the code:

- `pnpm lint`: the style, and the order of the imports in the specs and the benches;
- `pnpm check:structure`: every operation has its specs, its bench with the `direct` and `small` groups, its export and its chain method, and a complete JSDoc, and the operations are in alphabetical order in the exports, in the chain and in the API reference;
- `pnpm check:since`: `@since` is `next` or a released version;
- `pnpm check:instructions`: the links of `AGENTS.md` and of the skills point to existing files, and the ADRs they cite exist; it cannot tell whether a rule still matches its ADR;
- `pnpm check:changeset`: a pull request that changes `src/` has a changeset;
- `pnpm check:commits`: the `feat`, `fix`, `perf` and `refactor` commits of a pull request have a body.

GitHub also protects `main` and the release tags ([ADR 0016](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0016-protection-rules-for-main-and-release-tags.md)): a push to `main`, a force-push or a merge with the CI red is rejected, even when the agent uses your credentials.

The documentation site and the quality of the changelog note are not checked: look at them in the review.

## Tips

- Ask the agent to run the [checks before a pull request](how-to-contribute.md#checks-before-a-pull-request) and to show you their output.
- Review the changeset and the `@since` tags: the agent must not write a version in them.
- Point the agent to the issue: the signatures agreed there are its specification.

## Changing the rules

The rules live in three places: `AGENTS.md`, the skills (with their `references/`) and [How to contribute](how-to-contribute.md). When an ADR adds, changes, supersedes or amends a convention, the same pull request:

1. updates the rule in `AGENTS.md`, with the number of the ADR, and removes the rules that no longer hold;
2. updates every skill that covers it, templates in `references/` included: skills hold checklists and templates, the reasons stay in the ADR;
3. updates How to contribute;
4. adds a check in `scripts/` when the rule can be verified, and runs it in `.github/workflows/build-test.yml`.

A change to the code the templates are taken from (`map`, `some`, the test and bench helpers) updates the templates too. `AGENTS.md` and the `adr` skill tell agents the same.
