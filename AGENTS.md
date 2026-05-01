# AGENTS.md

## Project

Sample RAG service — TypeScript source-of-truth (`.ts` files). Compiled `.js` is gitignored (except `*.config.js`). No runtime source files exist yet; the repo is a scaffold.

## Commands

Before committing, always run in order:

```
npm run typecheck
npm run test
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