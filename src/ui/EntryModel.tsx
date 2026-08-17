import { Platform } from "react-native";
import NativeEntryModel from "./EntryModel.native";
import WebEntryModel from "./EntryModel.web";

export default Platform.OS === "web" ? WebEntryModel : NativeEntryModel;
