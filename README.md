# ✈️ Jefflag

[![npm version](https://img.shields.io/badge/npm-v3.4.1-cb3837)](https://www.npmjs.com/package/jefflag)
[![downloads](https://img.shields.io/badge/downloads-2.1M%2Fmonth-brightgreen)](https://www.npmjs.com/package/jefflag)
[![stars](https://img.shields.io/badge/★-24.3k-yellow)](https://github.com/fireship-dev/jefflag)
[![bundle size](https://img.shields.io/badge/minzip-3.9kB-blue)](https://bundlephobia.com/package/jefflag)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](https://github.com/fireship-dev/jefflag/actions)
[![license](https://img.shields.io/badge/license-MIT-000)](./LICENSE)

**A timezone-first date library that actually survives daylight saving.**

Jefflag stores every instant as UTC epoch + an IANA zone, and resolves all wall-clock math through the platform's `Intl` database, so spring-forward gaps and fall-back overlaps stop being your problem. Immutable, ~4 kB, zero dependencies.

```bash
npm install jefflag
```

```ts
import { jefflag, parseISO, format } from "jefflag";

const t = parseISO("2026-03-08T01:30:00", "America/New_York"); // 30 min before the DST gap
const later = t.add({ hours: 1 });        // jumps the gap correctly -> 03:30 local
later.isDST();                            // true
format(later, "dddd HH:mm Z");            // "Sunday 03:30 -04:00"

jefflag("2026-07-01T12:00:00Z")
  .withZone("Asia/Kolkata")
  .toISO();                               // "2026-07-01T17:30:00+05:30"
```

## Why another date library

Because the last one you used either mutated in place, shipped 70 kB of locale data, or quietly rounded your DST transition into the void. Jefflag does none of that.

- **Timezone-first.** A `JefflagDate` is never "floating." It always knows its zone.
- **DST-correct arithmetic.** Calendar units (`days`, `months`) are applied in wall time; exact units (`hours`, `minutes`) are applied to the epoch. That's the difference between "same time tomorrow" and "24 hours from now," and Jefflag keeps them distinct.
- **Immutable.** Every operation returns a new instance.
- **Tiny.** No moment-sized bundles. `Intl` already ships the timezone database, so we don't.

## API

| Function | Description |
| --- | --- |
| `jefflag(iso?, zone?)` | Now, or a parsed ISO string. |
| `parseISO(str, zone?)` | Parse ISO-8601; honours embedded offsets. |
| `format(date, pattern)` | Token formatter (`YYYY MMMM DD HH:mm Z`, `[escapes]`). |
| `JefflagDate.fromParts(parts, zone)` | Build from wall-clock parts. |
| `.add(d)` / `.subtract(d)` | DST-aware duration math. |
| `.withZone(zone)` | Same instant, new wall clock. |
| `.isDST()` / `.offsetMinutes` | Zone introspection. |
| `.diff(other, unit)` | Difference in a given unit. |
| `.toISO()` | Round-trippable ISO-8601 with offset. |

## Status

Jefflag is maintained by a very small, very tired team. If your issue is about **daylight saving time**, please search the [4,000 open issues](https://github.com/fireship-dev/jefflag/issues) first — it is almost certainly already in there.

## License

MIT
