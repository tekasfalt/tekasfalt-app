import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

type Props = { style?: StyleProp<ViewStyle> };

export default function EntryModel({ style }: Props) {
  const modelUri = Image.resolveAssetSource(require("../../assets/models/tek-a.glb")).uri;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}model-viewer{width:100%;height:100%;background:transparent;--poster-color:transparent}</style></head><body><model-viewer src="${modelUri}" camera-controls auto-rotate rotation-per-second="18deg" auto-rotate-delay="0" interaction-prompt="none" shadow-intensity="0" exposure="1.15" camera-orbit="0deg 72deg 105%" field-of-view="28deg"></model-viewer></body></html>`;
  return <View style={[styles.frame, style]}><WebView source={{ html }} originWhitelist={["*"]} javaScriptEnabled scrollEnabled={false} bounces={false} style={styles.webview} containerStyle={styles.webview} /></View>;
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: "transparent" },
  webview: { backgroundColor: "transparent" },
});
