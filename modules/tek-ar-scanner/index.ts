import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type TekArScanResult = {
  id: string;
  createdAt: string;
  technology: "ios-lidar" | "android-depth" | "manual-ar" | "manual-input";
  method: "arkit_lidar" | "arkit_world_tracking" | "arcore_depth" | "manual";
  lengthCm: number;
  widthCm: number;
  depthCm: number;
  buckets: number;
  confidence: "high" | "medium" | "low";
  pointCount: number;
  lengthMeters: number;
  widthMeters: number;
  surfaceAreaSquareMeters: number;
  maximumDepthMeters: number;
  averageDepthMeters: number;
  volumeCubicMeters: number;
  qualityScore: number;
  validDepthPointCount: number;
  durationMs: number;
  measurementMode?: "operator-verified" | "automatic-candidate";
  previewUri?: string;
  latitude?: number;
  longitude?: number;
};

/**
 * A field capture is deliberately not a volume estimate. It records whether a
 * stockpile was scanned with enough AR mesh coverage for the calculation
 * service to evaluate it. Keeping capture separate from calculation prevents
 * the app from presenting an unvalidated volume as a survey result.
 */
export type TekStockpileCapture = {
  id: string;
  createdAt: string;
  captureState: "captured";
  technology: "ios-lidar-mesh" | "arkit-world-tracking";
  meshAnchorCount: number;
  meshVertexCount: number;
  coverageScore: number;
  quality: "ready" | "needs-more-coverage";
  durationMs: number;
  requiresVolumeProcessing: true;
};

export type TekArDiagnostics = {
  supported: boolean;
  lidarSupported: boolean;
  meshSupported: boolean;
  cameraPermission: "authorized" | "notDetermined" | "denied" | "restricted" | "unknown";
  reason?: string;
};

type NativeScanner = {
  isSupported(): Promise<{
    supported: boolean;
    lidarSupported: boolean;
    cameraPermission?: "authorized" | "notDetermined" | "denied" | "restricted" | "unknown";
    depthSupported?: boolean;
    technology?: TekArScanResult["technology"];
  }>;
  diagnostics(): Promise<TekArDiagnostics>;
  requestCameraPermission(): Promise<{
    granted: boolean;
    status: "authorized" | "denied" | "restricted" | "unknown";
  }>;
  scanPothole(): Promise<TekArScanResult>;
  scanStockpile(): Promise<TekStockpileCapture>;
};

const native = Platform.OS === "ios" || Platform.OS === "android"
  ? requireOptionalNativeModule<NativeScanner>("TekArScanner")
  : null;

export const TekArScanner = {
  available: Boolean(native),
  isSupported: async () =>
    native?.isSupported() ?? {
      supported: false,
      lidarSupported: false,
      cameraPermission: "unknown" as const,
      depthSupported: false,
      technology: "manual-input" as const,
    },
  requestCameraPermission: async () =>
    native?.requestCameraPermission() ?? {
      granted: false,
      status: "unknown" as const,
    },
  diagnostics: async (): Promise<TekArDiagnostics> =>
    native?.diagnostics() ?? {
      supported: false,
      lidarSupported: false,
      meshSupported: false,
      cameraPermission: "unknown",
      reason: "Yerel AR modülü bu uygulama derlemesinde bulunmuyor.",
    },
  scanPothole: async () => {
    if (!native) throw new Error("Bu cihazda yerel derinlik ölçümü kullanılamıyor.");
    return native.scanPothole();
  },
  scanStockpile: async () => {
    if (!native) throw new Error("Stok tarama modülü bu uygulama derlemesinde bulunmuyor.");
    return native.scanStockpile();
  },
};

export default TekArScanner;
