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

- `pnpm check:structure`: every operation has its specs, its bench, its export and its chain method, and a complete JSDoc;
- `pnpm check:since`: `@since` is `next` or a released version;
- `pnpm check:instructions`: the links of `AGENTS.md` and of the skills point to existing files, and the ADRs they cite exist; it cannot tell whether a rule still matches its ADR;
- `pnpm check:changeset`: a pull request that changes `src/` has a changeset.

The documentation site and the quality of the changelog note are not checked: look at them in the review.

## Tips

- Ask the agent to run the [checks before a pull request](how-to-contribute.md#checks-before-a-pull-request) and to show you their output.
- Review the changeset and the `@since` tags: the agent must not write a version in them.
- Point the agent to the issue: the signatures agreed there are its specification.

## Changing the rules

When an ADR adds or changes a convention:

1. update the rule in `AGENTS.md`, with the number of the ADR;
2. update the skill that covers it, if any: skills hold checklists and templates, the reasons stay in the ADR;
3. add a check in `scripts/` when the rule can be verified, and run it in `.github/workflows/build-test.yml`.
