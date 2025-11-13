// Sundial core: an immutable, timezone-aware instant.
// Everything is stored as UTC epoch milliseconds plus an IANA zone id;
// all wall-clock math is resolved through Intl so DST is handled by the platform.

export type Zone = string; // IANA id, e.g. "America/New_York", "Europe/Berlin", "UTC"

export interface Parts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  millisecond: number;
}

export interface Duration {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

const MS = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

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
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(new Date(epochMs))) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === 24 ? 0 : map.hour,
    minute: map.minute,
    second: map.second,
    millisecond: epochMs % 1000,
  };
}

// Offset (minutes) of a zone at a given instant, derived from the formatted wall time.
export function zoneOffset(epochMs: number, zone: Zone): number {
  const p = fmtParts(epochMs, zone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.millisecond);
  return Math.round((asUTC - epochMs) / MS.minute);
}

// Resolve a wall-clock time in a zone to an epoch. Handles the DST gap/overlap by
// iterating the offset twice (the classic two-pass fixed-point used by temporal libs).
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

export class SundialDate {
  private constructor(
    readonly epochMs: number,
    readonly zone: Zone,
  ) {}

  static fromEpoch(epochMs: number, zone: Zone = "UTC"): SundialDate {
    return new SundialDate(epochMs, zone);
  }

  static fromParts(parts: Parts, zone: Zone = "UTC"): SundialDate {
    return new SundialDate(wallToEpoch(parts, zone), zone);
  }

  static now(zone: Zone = "UTC"): SundialDate {
    return new SundialDate(Date.now(), zone);
  }

  get parts(): Parts {
    return fmtParts(this.epochMs, this.zone);
  }

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

  withZone(zone: Zone): SundialDate {
    return new SundialDate(this.epochMs, zone); // same instant, new wall clock
  }

  add(d: Duration): SundialDate {
    const p = this.parts;
    // Calendar units are applied in wall time (DST-aware); exact units are added to the epoch.
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
    return new SundialDate(epoch, this.zone);
  }

  subtract(d: Duration): SundialDate {
    const neg: Duration = {};
    for (const k of Object.keys(d) as (keyof Duration)[]) neg[k] = -(d[k] ?? 0);
    return this.add(neg);
  }

  diff(other: SundialDate, unit: keyof typeof MS = "millisecond" as never): number {
    const delta = this.epochMs - other.epochMs;
    if (unit in MS) return delta / (MS as Record<string, number>)[unit];
    return delta;
  }

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

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
