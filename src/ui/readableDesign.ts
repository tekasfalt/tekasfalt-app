/**
 * TEK ASFALT sade mobil tasarım sistemi.
 * Bütün ekranlar aynı renk, yazı, boşluk ve dokunma kurallarını kullanır.
 */
export const readableDesign = {
  colors: {
    brand: "#E74022",
    navy: "#1B2E53",
    navyRaised: "#1B2E53",
    canvas: "#F5F6F8",
    surface: "#FFFFFF",
    text: "#10203D",
    textMuted: "#5F6D82",
    line: "#DDE3EB",
    success: "#16865F",
    danger: "#C83E35",
  },
  fonts: {
    regular: "Vodafone",
    light: "VodafoneLight",
    bold: "VodafoneBold",
    extraBold: "VodafoneExtraBold",
  },
  type: {
    display: { fontSize: 42, lineHeight: 47 },
    title: { fontSize: 30, lineHeight: 35 },
    section: { fontSize: 24, lineHeight: 29 },
    card: { fontSize: 17, lineHeight: 22 },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 12, lineHeight: 17 },
    label: { fontSize: 11, lineHeight: 14 },
  },
  space: { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 },
  radius: { sm: 12, md: 18, lg: 24, round: 999 },
  touch: { minimum: 48, primary: 56 },
  themes: {
    light: {
      canvas: "#F4F5F7",
      surface: "#FFFFFF",
      surfaceRaised: "#FFFFFF",
      text: "#10203D",
      textMuted: "#657188",
      line: "#DDE3EB",
      navigation: "#FFFFFF",
    },
    dark: {
      canvas: "#0F1322",
      surface: "#181C2B",
      surfaceRaised: "#2B303C",
      text: "#F7F9FC",
      textMuted: "#AEB7C8",
      line: "#343A4A",
      navigation: "#242B47",
    },
  },
} as const;

export type ReadableDesign = typeof readableDesign;
