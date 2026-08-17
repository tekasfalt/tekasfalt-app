import { Platform } from "react-native";
import NativePacdoraViewer from "./PacdoraViewer.native";
import WebPacdoraViewer from "./PacdoraViewer.web";

export type PacdoraViewerProps = {
  url?: string;
  title?: string;
  onInteractionChange?: (active: boolean) => void;
};

const PacdoraViewer = Platform.OS === "web" ? WebPacdoraViewer : NativePacdoraViewer;

export default PacdoraViewer;
