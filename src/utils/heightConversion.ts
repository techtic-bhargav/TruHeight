/**
 * Height conversions aligned with {@link TruHeightPicker} and {@link TruParentHeightPicker}:
 * - Metric: integer cm from 30 to 250
 * - Imperial: feet 0–8, inches 0–11 (integers)
 */

export const HEIGHT_METRIC_MIN_CM = 30;
export const HEIGHT_METRIC_MAX_CM = 250;

const CM_PER_INCH = 2.54;
const IMPERIAL_FEET_MAX = 8;
const IMPERIAL_INCHES_MAX = 11;

export type ImperialHeight = { feet: number; inches: number };

export type SyncedHeightValue = {
  metric: number;
  imperial: ImperialHeight;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeImperial(imperial: ImperialHeight): ImperialHeight {
  return {
    feet: clamp(Math.round(imperial.feet), 0, IMPERIAL_FEET_MAX),
    inches: clamp(Math.round(imperial.inches), 0, IMPERIAL_INCHES_MAX),
  };
}

/**
 * Total inches from normalized imperial height (for conversion).
 */
function totalInchesFromImperial(imperial: ImperialHeight): number {
  const { feet, inches } = normalizeImperial(imperial);
  return feet * 12 + inches;
}

/**
 * cm derived from imperial, clamped to picker metric range (integer).
 */
export function cmFromImperial(imperial: ImperialHeight): number {
  const totalIn = totalInchesFromImperial(imperial);
  const cm = totalIn * CM_PER_INCH;
  return clamp(Math.round(cm), HEIGHT_METRIC_MIN_CM, HEIGHT_METRIC_MAX_CM);
}

/**
 * Imperial derived from cm, clamped to picker imperial range.
 */
export function imperialFromCm(cm: number): ImperialHeight {
  const c = clamp(Math.round(cm), HEIGHT_METRIC_MIN_CM, HEIGHT_METRIC_MAX_CM);
  const totalInches = c / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  if (inches < 0) {
    inches = 0;
  }
  return {
    feet: clamp(feet, 0, IMPERIAL_FEET_MAX),
    inches: clamp(inches, 0, IMPERIAL_INCHES_MAX),
  };
}

/** User adjusted imperial → keep metric in sync. */
export function syncHeightFromImperial(
  imperial: ImperialHeight,
): SyncedHeightValue {
  const imperialNorm = normalizeImperial(imperial);
  return {
    imperial: imperialNorm,
    metric: cmFromImperial(imperialNorm),
  };
}

/** User adjusted metric (cm) → keep imperial in sync. */
export function syncHeightFromMetric(metricCm: number): SyncedHeightValue {
  const metric = clamp(
    Math.round(metricCm),
    HEIGHT_METRIC_MIN_CM,
    HEIGHT_METRIC_MAX_CM,
  );
  return {
    metric,
    imperial: imperialFromCm(metric),
  };
}

export function heightValuesEqual(
  a: SyncedHeightValue,
  b: SyncedHeightValue,
): boolean {
  return (
    a.metric === b.metric &&
    a.imperial.feet === b.imperial.feet &&
    a.imperial.inches === b.imperial.inches
  );
}

/** Typical API shape for `father_height` / `mother_height` on profile. */
type ProfileHeightField = {
  cm?: number;
  ft?: number;
  inches?: number;
  original?: {
    value?: number;
    unit?: string;
    inches?: number | null;
  };
};

/**
 * Parse profile API height field into a synced value (both cm and ft/in).
 */
export function syncedHeightFromProfileField(
  v: unknown,
): SyncedHeightValue | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) {
    return syncHeightFromMetric(v);
  }

  const o = v as ProfileHeightField;
  const original = o.original;

  if (original?.unit === "cm" && original.value != null) {
    const cm = Number(original.value);
    if (!Number.isNaN(cm)) return syncHeightFromMetric(cm);
  }

  if (original?.unit === "ft") {
    const val = Number(original.value);
    if (!Number.isNaN(val)) {
      const feet = Math.floor(val);
      const inchesPart =
        original.inches != null
          ? Math.round(Number(original.inches))
          : Math.round((val - feet) * 12);
      return syncHeightFromImperial({ feet, inches: inchesPart });
    }
  }

  if (original?.unit === "in" && original.value != null) {
    const totalIn = Math.round(Number(original.value));
    if (!Number.isNaN(totalIn)) {
      return syncHeightFromImperial({
        feet: Math.floor(totalIn / 12),
        inches: totalIn % 12,
      });
    }
  }

  if (o.ft != null || o.inches != null) {
    return syncHeightFromImperial({
      feet: Number(o.ft ?? 0),
      inches: Number(o.inches ?? 0),
    });
  }

  if (o.cm != null) {
    const cm = Number(o.cm);
    if (!Number.isNaN(cm)) return syncHeightFromMetric(cm);
  }

  return undefined;
}
