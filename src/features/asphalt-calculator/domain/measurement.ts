export type MeasurementTechnology =
  | "ios-lidar"
  | "android-depth"
  | "manual-ar"
  | "manual-input";

export type MeasurementLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type PotholeMeasurement = {
  id: string;
  createdAt: string;
  technology: MeasurementTechnology;
  lengthMeters: number;
  widthMeters: number;
  surfaceAreaSquareMeters: number;
  maximumDepthMeters: number;
  averageDepthMeters: number;
  volumeCubicMeters: number;
  qualityScore: number;
  validDepthPointCount: number;
  previewUri?: string;
  location?: MeasurementLocation;
};

export function clampQualityScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function qualityLabel(score: number) {
  const normalized = clampQualityScore(score);
  if (normalized >= 80) return "Yüksek";
  if (normalized >= 55) return "Orta";
  return "Düşük";
}

export function createMeasurementId(now = new Date()) {
  return `TA-M-${now.toISOString().replace(/\D/g, "").slice(0, 14)}`;
}
