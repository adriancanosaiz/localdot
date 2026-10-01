# 0001. Host the agent runtime in the local Next.js server

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

Localdot runs an autonomous agent that reads and writes files, runs shell commands and drives a browser on the user's machine. The UI is a Next.js application today and will be wrapped in a Tauri desktop shell later. The agent runtime must:

- run in Node (shell, file system, Playwright, MCP stdio servers);
- stream fine-grained events to the UI while a run is in progress;
- pause for human approval and resume when the user decides;
- be cancellable at any moment;
- stay a single, easy-to-install process for the MVP.

Options considered:

1. **In-process in the Next.js Node server.** Route handlers start runs and stream events.
2. **Separate local daemon** with its own HTTP/WebSocket API, the UI as a client.
3. **Electron main process.**

## Decision

The agent runtime runs **inside the Next.js server process**, using Node-runtime route handlers, bound to `127.0.0.1` only.

- `POST` starts a run and returns its id.
- Run events (`AgentEvent`, defined in `@localdot/shared`) are delivered over **Server-Sent Events**.
- Approvals and cancellation are separate `POST` requests that resolve the pending approval or abort the run's `AbortController`.
- Active runs live in an in-memory registry; persistence to SQLite comes later and does not change this API.

The runtime itself lives in framework-independent packages (`agent`, `providers`, `tools`); route handlers are thin adapters. Nothing in the runtime imports Next.js or React.

## Consequences

**Security.** A localhost server that can execute commands is reachable by any web page the user visits (cross-site requests, DNS rebinding). Therefore every route that starts, approves or cancels work MUST:

- listen on the loopback interface only, never `0.0.0.0`;
- reject requests whose `Host` header is not the exact loopback host and port;
- reject requests whose `Origin` header is present and not the app's own origin;
- require a random token generated at server start and injected into the served page, sent back on every mutating request.

These checks ship with the first route that triggers model or tool work.

**Simplicity.** One process, one port, one install step. No IPC protocol to version.

**Desktop path.** With Tauri, the same server runs as a sidecar and the webview loads it; the runtime packages are unchanged.

**Limits.** Runs do not survive a server restart until persistence lands, and the in-memory registry assumes a single server instance — acceptable for a local, single-user application. If a headless CLI or multiple frontends become a requirement, the runtime packages can be moved behind a standalone daemon (option 2) without changing their interfaces.
