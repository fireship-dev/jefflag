// Jefflag core: an immutable, timezone-aware instant.
// Everything is stored as UTC epoch milliseconds plus an IANA zone id;
// all wall-clock math is resolved through Intl so DST is handled by the platform.

/** An IANA zone id, e.g. `"America/New_York"`, `"Europe/Berlin"`, `"UTC"`. */
export type Zone = string;

/** Wall-clock components of an instant in a particular zone. */
export interface Parts {
  /** Full (proleptic Gregorian) year. */
  year: number;
  /** Month of year, `1`-`12`. */
  month: number;
  /** Day of month, `1`-`31`. */
  day: number;
  /** Hour of day, `0`-`23`. */
  hour: number;
  /** Minute of hour, `0`-`59`. */
  minute: number;
  /** Second of minute, `0`-`59`. */
  second: number;
  /** Millisecond of second, `0`-`999`. */
  millisecond: number;
}

/**
 * A duration to add or subtract. Calendar units (`years`, `months`, `days`) are
 * applied in wall time; exact units (`hours` and smaller) are applied to the epoch.
 */
export interface Duration {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

/** Units accepted by {@link JefflagDate.diff}. */
export type DiffUnit = "millisecond" | "second" | "minute" | "hour" | "day";

const MS: Record<DiffUnit, number> = {
  millisecond: 1,
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

type PartName = "year" | "month" | "day" | "hour" | "minute" | "second";

/** Resolve the wall-clock parts of `epochMs` in `zone` via Intl. */
function fmtParts(epochMs: number, zone: Zone): Parts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map: Partial<Record<PartName, number>> = {};
  for (const p of dtf.formatToParts(new Date(epochMs))) {
    if (p.type !== "literal") map[p.type as PartName] = Number(p.value);
  }
  const hour = map.hour ?? 0;
  return {
    year: map.year ?? 0,
    month: map.month ?? 1,
    day: map.day ?? 1,
    hour: hour === 24 ? 0 : hour,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
    millisecond: epochMs % 1000,
  };
}

/**
 * Offset of `zone` at a given instant, in minutes east of UTC.
 *
 * Derived from the formatted wall time so that DST is resolved by the platform's
 * timezone database rather than a bundled table.
 *
 * @param epochMs - Instant as UTC epoch milliseconds.
 * @param zone - IANA zone id.
 * @returns Offset in minutes; negative for zones west of UTC.
 */
export function zoneOffset(epochMs: number, zone: Zone): number {
  const p = fmtParts(epochMs, zone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.millisecond);
  return Math.round((asUTC - epochMs) / MS.minute);
}

/**
 * Resolve a wall-clock time in `zone` to a UTC epoch.
 *
 * Handles the DST gap/overlap by iterating the offset twice (the classic two-pass
 * fixed-point used by temporal libraries). Times inside a spring-forward gap are
 * pushed forward by the size of the gap; ambiguous fall-back times resolve to the
 * earlier (daylight) instant.
 *
 * @param parts - Wall-clock components.
 * @param zone - IANA zone id the parts are expressed in.
 * @returns UTC epoch milliseconds.
 */
export function wallToEpoch(parts: Parts, zone: Zone): number {
  const guess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  const o1 = zoneOffset(guess, zone);
  const adjusted = guess - o1 * MS.minute;
  const o2 = zoneOffset(adjusted, zone);
  return o2 === o1 ? adjusted : guess - o2 * MS.minute;
}

/**
 * An immutable instant paired with the IANA zone its wall clock is read in.
 *
 * Construct one with {@link JefflagDate.fromEpoch}, {@link JefflagDate.fromParts},
 * {@link JefflagDate.now}, or via `parseISO`. Every method returns a new instance.
 */
export class JefflagDate {
  private constructor(
    /** UTC epoch milliseconds. */
    readonly epochMs: number,
    /** IANA zone id used for wall-clock reads. */
    readonly zone: Zone,
  ) {}

  /**
   * Wrap a UTC epoch in a zone.
   * @param epochMs - UTC epoch milliseconds.
   * @param zone - IANA zone id (default `"UTC"`).
   */
  static fromEpoch(epochMs: number, zone: Zone = "UTC"): JefflagDate {
    return new JefflagDate(epochMs, zone);
  }

  /**
   * Build an instant from wall-clock parts in a zone.
   * @param parts - Wall-clock components.
   * @param zone - IANA zone id (default `"UTC"`).
   */
  static fromParts(parts: Parts, zone: Zone = "UTC"): JefflagDate {
    return new JefflagDate(wallToEpoch(parts, zone), zone);
  }

  /**
   * The current instant.
   * @param zone - IANA zone id (default `"UTC"`).
   */
  static now(zone: Zone = "UTC"): JefflagDate {
    return new JefflagDate(Date.now(), zone);
  }

  /** Wall-clock parts of this instant in its zone. */
  get parts(): Parts {
    return fmtParts(this.epochMs, this.zone);
  }

  /** Offset of the zone at this instant, in minutes east of UTC. */
  get offsetMinutes(): number {
    return zoneOffset(this.epochMs, this.zone);
  }

  /** True if the zone is observing daylight saving at this instant. */
  isDST(): boolean {
    const p = this.parts;
    const jan = zoneOffset(Date.UTC(p.year, 0, 1), this.zone);
    const jul = zoneOffset(Date.UTC(p.year, 6, 1), this.zone);
    const standard = Math.min(jan, jul);
    return this.offsetMinutes > standard;
  }

  /**
   * Same instant, read on a different wall clock.
   * @param zone - IANA zone id.
   */
  withZone(zone: Zone): JefflagDate {
    return new JefflagDate(this.epochMs, zone);
  }

  /**
   * Add a duration. Calendar units are applied in wall time (DST-aware); exact
   * units are added to the epoch.
   * @param d - Duration to add; negative values subtract.
   */
  add(d: Duration): JefflagDate {
    const p = this.parts;
    const wall: Parts = {
      ...p,
      year: p.year + (d.years ?? 0),
      month: p.month + (d.months ?? 0),
      day: p.day + (d.days ?? 0),
    };
    let epoch = wallToEpoch(normalizeMonths(wall), this.zone);
    epoch +=
      (d.hours ?? 0) * MS.hour +
      (d.minutes ?? 0) * MS.minute +
      (d.seconds ?? 0) * MS.second +
      (d.milliseconds ?? 0);
    return new JefflagDate(epoch, this.zone);
  }

  /**
   * Subtract a duration. Equivalent to {@link add} with every field negated.
   * @param d - Duration to subtract.
   */
  subtract(d: Duration): JefflagDate {
    const neg: Duration = {};
    for (const k of Object.keys(d) as (keyof Duration)[]) {
      const v = d[k];
      if (v !== undefined) neg[k] = -v;
    }
    return this.add(neg);
  }

  /**
   * Difference `this - other` in the given exact unit.
   * @param other - Instant to subtract.
   * @param unit - One of `"millisecond" | "second" | "minute" | "hour" | "day"`.
   * @returns Signed, possibly fractional, difference.
   */
  diff(other: JefflagDate, unit: DiffUnit = "millisecond"): number {
    return (this.epochMs - other.epochMs) / MS[unit];
  }

  /** Round-trippable ISO-8601 string with the zone's offset (`Z` for UTC). */
  toISO(): string {
    const p = this.parts;
    const o = this.offsetMinutes;
    const sign = o >= 0 ? "+" : "-";
    const oh = pad(Math.floor(Math.abs(o) / 60));
    const om = pad(Math.abs(o) % 60);
    const zoneSuffix = o === 0 ? "Z" : `${sign}${oh}:${om}`;
    return (
      `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}` +
      `T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
      (p.millisecond ? `.${pad(p.millisecond, 3)}` : "") +
      zoneSuffix
    );
  }
}

/** Carry out-of-range months into the year so `Date.UTC` sees `1`-`12`. */
function normalizeMonths(p: Parts): Parts {
  let year = p.year;
  let month = p.month;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return { ...p, year, month };
}

/** Left-pad a number with zeros. */
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
