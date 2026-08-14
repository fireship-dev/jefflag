# Contributing to Jefflag

Thanks for helping. A few conventions the maintainers follow:

- Every bug fix ships with a regression test in `test/regressions.test.ts`.
- Branch names: `fix/<short-slug>` or `feat/<short-slug>`.
- Timezone logic always goes through `Intl`. Never hardcode an offset.
- A CI failure near midnight UTC is almost always flaky. Re-run before assuming it is a real bug.
