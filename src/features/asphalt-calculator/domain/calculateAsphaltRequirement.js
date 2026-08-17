export const ASPHALT_DENSITY_KG_PER_CUBIC_METER = 2200;
export const BUCKET_WEIGHT_KG = 25;
export const DEFAULT_WASTE_FACTOR = 0;

function stableNumber(value) {
  return Number(value.toFixed(9));
}

function finiteNonNegative(value, fieldName) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${fieldName} must be a finite, non-negative number.`);
  }
  return number;
}

/**
 * The one calculation path used by LiDAR, ARCore Depth and manual measurement.
 * A measured volume always wins because irregular potholes are not rectangular.
 */
export function calculateAsphaltRequirement(input) {
  const wasteFactor = finiteNonNegative(
    input.wasteFactor ?? DEFAULT_WASTE_FACTOR,
    "wasteFactor",
  );
  if (wasteFactor > 0.5) {
    throw new RangeError("wasteFactor must not exceed 0.5.");
  }
  const lengthMeters = finiteNonNegative(input.lengthMeters, "lengthMeters");
  const widthMeters = finiteNonNegative(input.widthMeters, "widthMeters");
  const averageDepthMeters = finiteNonNegative(
    input.averageDepthMeters,
    "averageDepthMeters",
  );
  const measuredArea = finiteNonNegative(
    input.surfaceAreaSquareMeters,
    "surfaceAreaSquareMeters",
  );
  const measuredVolume = finiteNonNegative(
    input.volumeCubicMeters,
    "volumeCubicMeters",
  );

  const surfaceAreaSquareMeters =
    measuredArea > 0 ? measuredArea : lengthMeters * widthMeters;
  const volumeCubicMeters =
    measuredVolume > 0
      ? measuredVolume
      : surfaceAreaSquareMeters * averageDepthMeters;
  const netKilograms = stableNumber(
    volumeCubicMeters * ASPHALT_DENSITY_KG_PER_CUBIC_METER,
  );
  const wasteKilograms = stableNumber(netKilograms * wasteFactor);
  const kilograms = stableNumber(netKilograms + wasteKilograms);

  return {
    surfaceAreaSquareMeters,
    volumeCubicMeters,
    netKilograms,
    wasteKilograms,
    safetyFactor: wasteFactor,
    kilograms,
    buckets: kilograms > 0 ? Math.ceil(kilograms / BUCKET_WEIGHT_KG) : 0,
  };
}

export function calculateManualAsphaltRequirement({
  lengthCentimeters,
  widthCentimeters,
  averageDepthCentimeters,
  wasteFactor = DEFAULT_WASTE_FACTOR,
}) {
  return calculateAsphaltRequirement({
    lengthMeters:
      finiteNonNegative(lengthCentimeters, "lengthCentimeters") / 100,
    widthMeters:
      finiteNonNegative(widthCentimeters, "widthCentimeters") / 100,
    averageDepthMeters:
      finiteNonNegative(averageDepthCentimeters, "averageDepthCentimeters") /
      100,
    wasteFactor,
  });
}
