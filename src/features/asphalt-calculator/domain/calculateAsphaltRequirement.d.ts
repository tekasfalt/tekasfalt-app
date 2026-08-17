export const ASPHALT_DENSITY_KG_PER_CUBIC_METER: 2200;
export const BUCKET_WEIGHT_KG: 25;
export const DEFAULT_WASTE_FACTOR: 0;

export type AsphaltRequirementInput = {
  lengthMeters?: number;
  widthMeters?: number;
  averageDepthMeters?: number;
  surfaceAreaSquareMeters?: number;
  volumeCubicMeters?: number;
  wasteFactor?: number;
};

export type AsphaltRequirement = {
  surfaceAreaSquareMeters: number;
  volumeCubicMeters: number;
  netKilograms: number;
  wasteKilograms: number;
  safetyFactor: number;
  kilograms: number;
  buckets: number;
};

export function calculateAsphaltRequirement(
  input: AsphaltRequirementInput,
): AsphaltRequirement;

export function calculateManualAsphaltRequirement(input: {
  lengthCentimeters: number;
  widthCentimeters: number;
  averageDepthCentimeters: number;
  wasteFactor?: number;
}): AsphaltRequirement;
