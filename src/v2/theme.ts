import { Platform } from "react-native";

export const colors = {
  ink: "#1B2E53",
  inkDeep: "#1B2E53",
  inkSoft: "#1B2E53",
  orange: "#E74022",
  orangeSoft: "#FFF0E4",
  green: "#16B968",
  greenSoft: "#EAF9F1",
  sky: "#E9F2FF",
  canvas: "#F5F7FB",
  surface: "#FFFFFF",
  line: "#DCE3ED",
  text: "#1B2E53",
  muted: "#66748C",
  faint: "#96A1B3",
  danger: "#D83A2E",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 34,
  round: 999,
};

export const type = {
  regular: "Vodafone",
  light: "Vodafone-Light",
  bold: "Vodafone-Bold",
  extraBold: "Vodafone-ExtraBold",
  display: { fontFamily: "Vodafone-ExtraBold", fontSize: 44, lineHeight: 50, letterSpacing: -0.8 },
  h1: { fontFamily: "Vodafone-ExtraBold", fontSize: 38, lineHeight: 45, letterSpacing: -0.5 },
  h2: { fontFamily: "Vodafone-Bold", fontSize: 30, lineHeight: 37, letterSpacing: -0.25 },
  h3: { fontFamily: "Vodafone-Bold", fontSize: 23, lineHeight: 30, letterSpacing: -0.05 },
  body: { fontFamily: "Vodafone", fontSize: 18, lineHeight: 28 },
  bodyStrong: { fontFamily: "Vodafone-Bold", fontSize: 18, lineHeight: 27 },
  meta: { fontFamily: "Vodafone-Bold", fontSize: 14, lineHeight: 20, letterSpacing: 1.05 },
  caption: { fontFamily: "Vodafone", fontSize: 16, lineHeight: 24 },
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#07152F",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 5 },
  default: {},
});
