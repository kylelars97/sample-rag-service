# AGENTS.md

## Project

Sample RAG service — TypeScript source-of-truth (`.ts` files). Runs on Deno with Deno.serve(), jsr: specifiers, and Deno's built-in test runner.

## Commands

Before committing, always run in order:

```
deno check src/api/server.ts src/ingest/index.ts
deno task test
```

## Sandcastle (`.sandcastle/`)

Automated issue-driven CI orchestration (plan → implement → review → merge). Not part of the application itself.

- **Run:** `npx tsx .sandcastle/main.mts`
- **Requires:** `OPENCODE_API_KEY` and `GH_TOKEN` in `.sandcastle/.env`
- **Branch naming:** `sandcastle/issue-{id}-{slug}`
- **Commit prefix:** Sandcastle agent commits use `RALPH:` prefix
- **Docker sandbox:** Node 22 Bookworm with `opencode-ai` CLI + `gh` CLI

## Coding Standards

Enforced file: `.sandcastle/CODING_STANDARDS.md` — key deviations from defaults:

- Explicit return types on **all** functions
- `readonly` on immutable properties/arrays
- `unknown` over `any`
- Named exports only (no default exports)
- Test names: `MethodUnderTest_ActionBeingTested_ExpectedResult`
- Minimize comments; write self-documenting code