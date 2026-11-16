# Development

## Setup and branches

Use pnpm with the versions pinned in package.json and the lockfile. After installing dependencies, run `pnpm hooks:install` once per clone. This sets the local Git hook path to the tracked `.githooks` directory; it refuses to replace another hook path. The pre-commit hook runs lint and typecheck on the working tree. Keep unrelated unfinished edits out of commits.

For the Gift Exchange MVP, `gift-exchange-mvp` is the integration branch. Create ticket branches from it unless the user names another base. Commit work on the ticket branch. Merge or start another ticket only when authorized. The ticket's explicit stopping conditions take precedence.

Before the first implementation slice, identify the ticket and spec's required architectural boundaries and mechanisms alongside the behavior to test. Use those requirements when choosing the implementation and review seams.

For a behavior-changing review fix, first demonstrate the gap with a failing test at an agreed public seam when one can exercise it. Then implement the fix and rerun the test.

The integration owner updates ticket Status fields. Implementation agents leave those fields unchanged. Git and the current user request establish branch state; temporary handoffs can contain older checkpoints.

## Database access

`.env.local` is gitignored and contains local database credentials. Keep values out of terminal output, reports and commits. A worktree may symlink the main checkout's `.env.local`.

Use `TEST_DATABASE_URL` for tests. The test harness creates, migrates and drops a unique Postgres schema per Vitest or Playwright run. Tests must use that harness rather than the application's normal DATABASE_URL. Never weaken isolation to get a test passing.

Schema changes require a Drizzle migration. The tooling suite rejects `public`-qualified application table references before database tests: migrations must run in the test harness's schema. Text columns with check constraints are used for Status instead of Postgres enums for this reason.

## Verification

Run `pnpm verify` before reporting an integration candidate ready. It requires TEST_DATABASE_URL, then runs lint, typecheck, tooling tests, module tests and the complete phone/desktop browser suite, stopping on the first failure. Run focused tests during implementation; full verification includes existing pages that a new component might affect. Passing verification does not authorize a merge.

Verification fingerprints tracked and untracked Git-visible inputs before running checks and after each check. An edit invalidates the result even if every executed check passed. Generated Next files and ignored outputs are excluded. Finish focused fixes and review corrections before the final run, and keep inputs unchanged until it finishes. Edits reverted between snapshots cannot be detected; use an unchanged checkout for final verification.

Each verification run prints its fingerprint and saves a JSON summary plus per-check logs under `test-results/verification/<run-id>/`. Browser output goes to `test-results/e2e/<run-id>/`; focused runs get their own identifiers too, so a later run preserves earlier traces and screenshots. A failed summary identifies the check, exit code, log and browser output directory. Inspect those artifacts and build a focused reproducer for repeated failures before rerunning the full suite. Ports are checked before server startup, but another process can claim one after the probe; in that case inspect startup output and choose another port.

The commit hook runs only lint and typecheck; database and browser checks belong to full verification. To install the hook in another clone, run `pnpm hooks:install` there too. Hook installation is local Git configuration and is not copied by a checkout.

Use `pnpm test:e2e [spec paths or Playwright flags]` for focused browser checks. Its wrapper selects an available port outside the installed Next reserved-port list, or validates E2E_PORT, then starts its own Next server with E2E_TEST=1. That server owns `.next-e2e`; interactive development owns `.next`. Run one browser suite per checkout; use separate worktrees for parallel suites. Each suite retains its own database schema.

Before the E2E server starts, `scripts/prepare-e2e.mjs` checks its output lock. It preserves a dead process's lock under a stale filename. A live owner or unreadable lock stops startup with an explanation. Inspect that case rather than removing a live server's lock. Interactive `.next` locks are outside this script's scope.

Next regenerates the root next-env.d.ts for whichever server runs last. TypeScript excludes that changing file and gets framework references from types/next.d.ts instead. Normal typechecking includes only `.next` route helpers; tsconfig.e2e.json selects the E2E helpers. Keep the two sets separate to avoid importing another server's generated types. Next's configured tsconfig must continue listing next-env.d.ts where Next requires it; its exclusion controls TypeScript's actual input.

Generated Next, Playwright and worktree output is excluded from lint/typechecking as appropriate. When adding a new generated directory, update tool exclusions as well as .gitignore.

## References

Read the relevant installed Next guide under node_modules/next/dist/docs before changing Next behavior. For ui-sdk controls, start at node_modules/@ui-sdk/react/docs/llms.txt and read the component page. The spec's explicit scope exceptions apply to generic skill defaults, including the excluded ui-sdk agent-ready step.

Consult references in bounded sections and reuse material already read in the session. For a failing check, inspect its exact error before widening the investigation.

For client controls that need JavaScript, reuse `delayedPage` and `expectNativeDisabled` from `e2e/fixtures.ts` to exercise the server-rendered state and then release scripts. Native behavior such as form submission requires the native disabled attribute before hydration; an ARIA-only assertion does not establish that protection. `openAndExpectMotion` separately exercises normal pointer, reduced-motion pointer and keyboard activation, including a preference change after the page has mounted.

For visibility-aware polling, use `observeRequests` and `setPageVisibility` from `e2e/fixtures.ts` to verify that requests stop while hidden and resume on return, alongside assertions on the displayed data.
