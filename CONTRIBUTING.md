# Contributing to Jefflag

Thanks for helping. A few conventions the maintainers follow:

- Every bug fix ships with a regression test in `test/regressions.test.ts`.
- Branch names: `fix/<short-slug>` or `feat/<short-slug>`.
- Timezone logic always goes through `Intl`. Never hardcode an offset.
- A CI failure near midnight UTC is almost always flaky. Re-run before assuming it is a real bug.
- `tsconfig.json` is strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`). Don't loosen it; fix the type instead.
- Type-only imports use a separate `import type { ... }` line (enforced by ESLint).
- Every exported function, class and method carries a JSDoc block. `npm run lint` covers `src` and `test`.
