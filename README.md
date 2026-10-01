# Localdot

**An autonomous agent that works on your machine, with models that run on your machine.**

Localdot takes a task in plain language — _"run the tests, find the failure, fix it"_ — and works through it step by step: reading files, searching code, running commands, editing, verifying. It runs on local models (Qwen, Ollama, LM Studio, MLX) through any OpenAI-compatible endpoint, asks before doing anything sensitive, and stops itself when it is going in circles.

> **Status: early development.** The foundation is in place; the agent is not usable yet. Watch the repository to follow progress.

## Principles

- **Local first.** Your code and prompts stay on your machine. No API key required.
- **A real agent loop.** Bounded steps, error limits, repetition detection, cancellation — controlled by the runtime, not left to the model.
- **Safe by default.** Work is scoped to a workspace; risky actions wait for your approval.
- **Model agnostic.** Any OpenAI-compatible server with tool calling.
- **Mac first.** Built and tested on Apple Silicon.

## Requirements

- macOS (Apple Silicon recommended)
- Node 22.18 or newer, with Corepack
- A local model server such as [LM Studio](https://lmstudio.ai) or [Ollama](https://ollama.com)

## Development

```sh
corepack enable
pnpm install
pnpm --filter @localdot/web dev     # http://127.0.0.1:4317
```

Quality checks (the same ones CI runs):

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Project layout

```
apps/
  web/          Next.js app: the interface, plus the local server that hosts the agent runtime
packages/
  shared/       Contracts shared by everything: runs, steps, tools, providers, permissions, events
```

Planned packages, added as they are built: `agent` (the execution loop), `providers` (model backends), `tools` (files, shell, browser and the permission gateway), `mcp` (Model Context Protocol servers as tools) and `memory` (local SQLite persistence).

Dependencies point one way: `web → agent, providers, tools, mcp, memory → shared`. The agent depends only on contracts, never on a specific tool or provider, and nothing in the runtime depends on React or Next.js.

Why the runtime lives inside the local web server: [ADR 0001](docs/adr/0001-local-runtime-host.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch and commit conventions, and the review checklist. Architectural decisions are recorded in [`docs/adr/`](docs/adr).

## License

[MIT](LICENSE)
