# Contributing to Localdot

Thanks for your interest. This guide covers setup, the quality bar, and how changes move from a branch to `main`.

## Setup

Requirements: macOS (Apple Silicon recommended), Node 22.18 or newer, Git.

```sh
nvm use            # reads .nvmrc (Node 22)
corepack enable    # provisions the exact pnpm version from package.json
pnpm install
```

If your Node version no longer bundles Corepack, install it with `npm i -g corepack`.

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm format`       | Format all files with Prettier                 |
| `pnpm format:check` | Fail if any file is not formatted              |
| `pnpm lint`         | ESLint, zero warnings allowed                  |
| `pnpm typecheck`    | Strict TypeScript across the workspace         |
| `pnpm test`         | Unit tests (Vitest)                            |
| `pnpm build`        | Production build of every package that has one |

CI runs `format:check → lint → typecheck → test → build` on every pull request and every push to `main`. Any failure fails the check.

### TypeScript rules

- Strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- No `any`. Use `unknown` and validate.
- No `@ts-ignore`. If a suppression is truly needed, use `@ts-expect-error` followed by the reason.
- Lint rules are only disabled with a comment explaining why.

## Branches

`main` is always releasable. Never commit directly to it.

Every unit of work gets its own short-lived branch, named `<type>/<short-description>` in lowercase kebab-case:

| Prefix      | For                                    |
| ----------- | -------------------------------------- |
| `feat/`     | New capability (`feat/agent-loop`)     |
| `fix/`      | Bug fix (`fix/shell-timeout`)          |
| `refactor/` | Restructuring without behaviour change |
| `perf/`     | Performance work                       |
| `test/`     | Tests only                             |
| `docs/`     | Documentation only                     |
| `ci/`       | CI/CD workflows                        |
| `chore/`    | Tooling, dependencies, housekeeping    |

Avoid vague names such as `work`, `update`, `changes`, `tmp` or `test2`. One branch, one coherent change.

```sh
git status                 # must be clean
git checkout main
git pull --ff-only
git checkout -b fix/shell-timeout
```

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`, `style`.
- Scope is the area touched: `agent`, `providers`, `tools`, `shared`, `web`, `readme`, `github`, …
- Description in English, imperative mood, specific, no trailing period, no emojis.

Good:

```
feat(agent): implement bounded execution loop
fix(shell): terminate timed-out child processes
refactor(agent): extract permission gateway
test(agent): cover max-step termination
docs(readme): add LM Studio quickstart
```

Not acceptable: `updates`, `changes`, `fix stuff`, `WIP`, `final`, `misc fixes`.

Each commit is **atomic**: one intention, reviewable on its own, and ideally passing every check. Don't mix a refactor, a feature and a docs rewrite in one commit; don't split a single change into one commit per line either.

### Authorship

- Commit with your own, already configured Git identity. Do not change `user.name`, `user.email` or the `GIT_AUTHOR_*` / `GIT_COMMITTER_*` variables.
- Commit messages contain the subject and, if useful, a body. No co-author trailers, signatures or promotional lines added by tools. If a tool adds one, remove it before committing.

### Before every commit

```sh
git status
git diff
git add <specific files>      # never a blind `git add .`
git diff --cached
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Check that the staged diff contains:

- no secrets (`.env`, keys, tokens, cookies, local databases);
- no temporary files or debug logging;
- no trailers in the message;
- exactly one logical change.

Never force-add an ignored path (`git add -f`). If something is ignored, it is ignored on purpose.

### Before every push

- You are on your feature branch, not `main` (`git branch --show-current`).
- Working tree is clean and checks pass.
- Commits are reviewed and correctly attributed.

If you rebased a personal branch, push with `git push --force-with-lease`. Never use plain `--force`, and never force-push `main`.

## Pull requests

Keep your branch current before opening or merging:

```sh
git fetch origin
git rebase origin/main
```

Resolve conflicts deliberately, then run all checks again.

- Title in Conventional Commits form, e.g. `feat(agent): implement autonomous execution loop`.
- Fill in the template: Summary, Why, What changed, How tested, Screenshots / video for UI changes, Risks. Keep it short.
- Pull requests are merged with **squash and merge**; the squashed commit uses the PR title.

### Before merging

- CI is green: format, lint, typecheck, tests, build.
- The diff has been reviewed.
- `CHANGELOG.md` and docs are updated where relevant.
- No secrets, debug output or temporary workarounds left behind.

## Changelog

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

- Unreleased changes go under `## [Unreleased]`, in `Added`, `Changed`, `Fixed`, `Removed` or `Security`. Omit empty sections.
- Write for users and contributors: _"Prevented repeated tool calls from causing infinite agent runs."_, not _"Modified AgentRunner.ts"_.
- Skip formatting-only changes, internal renames and small refactors without visible effect. The changelog is not a copy of `git log`.

## Versioning and releases

- [Semantic Versioning](https://semver.org/). Before 1.0, versions are `0.MINOR.PATCH`: a minor bump for a new capability, a patch for fixes.
- Versions are bumped deliberately at release time, never per commit.
- Releasing moves `[Unreleased]` entries to `## [X.Y.Z] - YYYY-MM-DD`, commits that change, and tags it `vX.Y.Z`. Tags match released versions exactly. Release notes are taken from the changelog.

## Architecture decisions

Decisions that are expensive to reverse are recorded in [`docs/adr/`](docs/adr) as numbered records with context, decision and consequences. Trivial choices don't get an ADR.

## Repository settings

`main` should be protected with: pull request required, the `CI / Quality` check required, force pushes blocked, deletion blocked.
