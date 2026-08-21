# Changelog

## Unreleased

- fix: `format` derives the weekday from the wall-clock date instead of the UTC
  epoch, so `dddd`/`ddd` are correct for instants whose zone day differs from the
  epoch day (e.g. midnights east of UTC).

## 3.4.1

- fix: preserve wall hour when adding a day across the US spring-forward gap.
- docs: clarify calendar-vs-exact unit semantics in the README.

## 3.4.0

- feat: `diff()` accepts an explicit unit.
- fix: disambiguate fall-back overlaps by offset in `isDST()`.

## 3.3.2

- fix: half-hour and 45-minute offset zones round to the correct minute.
- perf: cache `Intl.DateTimeFormat` instances per zone.

## 3.3.0

- feat: `withZone()` keeps the instant and swaps the wall clock.
- test: broaden DST transition coverage.
