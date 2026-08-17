import { createElement } from "react";
import { StyleProp, ViewStyle } from "react-native";

type Props = { style?: StyleProp<ViewStyle> };

export default function EntryModel({ style }: Props) {
  return createElement("model-viewer", { src:"/assets/models/tek-a.glb", "auto-rotate":"", "camera-controls":"", "interaction-prompt":"none", style:{width:"100%",height:"100%",background:"transparent",...(style as object)} }) as any;
}
