# Development

## Setup and branches

Use pnpm with the versions pinned in package.json and the lockfile. After installing dependencies, run `pnpm hooks:install` once per clone. This sets the local Git hook path to the tracked `.githooks` directory; it refuses to replace another hook path. The pre-commit hook runs lint and typecheck on the working tree. Keep unrelated unfinished edits out of commits.

For the Gift Exchange MVP, `gift-exchange-mvp` is the integration branch. Create ticket branches from it unless the user names another base. Commit work on the ticket branch. Merge or start another ticket only when authorized. The ticket's explicit stopping conditions take precedence.

The integration owner updates ticket Status fields. Implementation agents leave those fields unchanged. Git and the current user request establish branch state; temporary handoffs can contain older checkpoints.

## Database access

`.env.local` is gitignored and contains local database credentials. Keep values out of terminal output, reports and commits. A worktree may symlink the main checkout's `.env.local`.

Use `TEST_DATABASE_URL` for tests. The test harness creates, migrates and drops a unique Postgres schema per Vitest or Playwright run. Tests must use that harness rather than the application's normal DATABASE_URL. Never weaken isolation to get a test passing.

Schema changes require a Drizzle migration. Inspect generated SQL for schema-qualified `public` references: migrations must run in the test harness's schema. Text columns with check constraints are used for Status instead of Postgres enums for this reason.

## Verification

Run `pnpm verify` before reporting an integration candidate ready. It requires TEST_DATABASE_URL, then runs lint, typecheck, tooling tests, module tests and the complete phone/desktop browser suite, stopping on the first failure. Run focused tests during implementation; full verification includes existing pages that a new component might affect. Passing verification does not authorize a merge.

The commit hook runs only lint and typecheck; database and browser checks belong to full verification. To install the hook in another clone, run `pnpm hooks:install` there too. Hook installation is local Git configuration and is not copied by a checkout.

Playwright selects a port (or uses E2E_PORT) and starts its own Next server with E2E_TEST=1. That server owns `.next-e2e`; interactive development owns `.next`. Run one browser suite per checkout; use separate worktrees for parallel suites. Each suite retains its own database schema.

Before the E2E server starts, `scripts/prepare-e2e.mjs` checks its output lock. It preserves a dead process's lock under a stale filename. A live owner or unreadable lock stops startup with an explanation. Inspect that case rather than removing a live server's lock. Interactive `.next` locks are outside this script's scope.

Next regenerates the root next-env.d.ts for whichever server runs last. TypeScript excludes that changing file and gets framework references from types/next.d.ts instead. Normal typechecking includes only `.next` route helpers; tsconfig.e2e.json selects the E2E helpers. Keep the two sets separate to avoid importing another server's generated types. Next's configured tsconfig must continue listing next-env.d.ts where Next requires it; its exclusion controls TypeScript's actual input.

Generated Next, Playwright and worktree output is excluded from lint/typechecking as appropriate. When adding a new generated directory, update tool exclusions as well as .gitignore.

## References

Read the relevant installed Next guide under node_modules/next/dist/docs before changing Next behavior. For ui-sdk controls, start at node_modules/@ui-sdk/react/docs/llms.txt and read the component page. The spec's explicit scope exceptions apply to generic skill defaults, including the excluded ui-sdk agent-ready step.

Consult references in bounded sections and reuse material already read in the session. For a failing check, inspect its exact error before widening the investigation.
