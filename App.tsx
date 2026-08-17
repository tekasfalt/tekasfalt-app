import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ScreenCapture from "expo-screen-capture";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { Component, Fragment, createElement, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Polygon } from "react-native-svg";
import TekArScanner, { type TekArScanResult, type TekStockpileCapture } from "tek-ar-scanner";
import {
  calculateAsphaltRequirement,
  calculateManualAsphaltRequirement,
} from "./src/features/asphalt-calculator/domain/calculateAsphaltRequirement";
import { readableDesign as D } from "./src/ui/readableDesign";
import PacdoraViewer from "./src/ui/PacdoraViewer";
import EntryModel from "./src/ui/EntryModel";
import { getRuntimeLanguage, setRuntimeLanguage, translateText, type AppLanguage } from "./src/i18n/appTranslations";
import {
  Animated,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Easing,
  Image,
  ImageBackground,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  InputAccessoryView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextProps,
  type TextInputProps,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

function TekAsfaltLogo({ style }: { style?: any }) {
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <Image
        source={require("./assets/TEKLOGO_V3.png")}
        resizeMode="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

function VerifiedBadge({size=18,color="#1B2E53"}: {size?:number;color?:string}) {
  return <Svg accessibilityLabel="Doğrulanmış kullanıcı" width={size} height={size} viewBox="0 0 40 40">
    <Path
      fill={color}
      fillRule="evenodd"
      d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
    />
  </Svg>;
}

function RoadMarkingIcon({color=C.orange}: {color?:string}) {
  return <Svg width={27} height={27} viewBox="0 0 93.3 78.49" accessibilityLabel="Yol çizgisi">
    <Path fill={color} d="M50.61 48.65 40.59 41.18c-.93-.82-1.62-1.71-1.92-2.92V25.25l-1.68 1.37-4.46 10.22c-.74 1.68-2.58 2.46-4.23 1.72s-2.28-2.58-1.57-4.28l4.57-11.08c.33-.81.84-1.34 1.5-1.88l7.55-6.19c1.61-1.32 3.67-1.81 5.71-1.34 1.81.41 3.5 1.96 3.5 3.95l.04 20.47 7.14 5.33c.96.72 1.58 1.65 2.12 2.71l8.93 18.43c.93 1.93.29 4.13-1.58 5.09s-4.13.18-5.1-1.78l-7.97-16.15c-.61-1.24-1.37-2.32-2.53-3.19Z"/>
    <Path fill={color} d="M32.13 68.32c-1.04 1.91-3.26 2.51-5.04 1.58s-2.54-3.21-1.52-5.08l13.81-23.33 6.2 4.69-13.44 22.14Z"/>
    <Polygon fill={color} points="7.8 78.47 0 78.46 15.31 57.77 20.39 57.78 7.8 78.47"/>
    <Polygon fill={color} points="93.3 78.43 85.54 78.49 70.94 57.78 76.02 57.76 93.3 78.43"/>
    <Polygon fill={color} points="50.57 78.46 42.76 78.49 43.12 57.77 48.21 57.77 50.57 78.46"/>
  </Svg>;
}

function AnimatedArIcon() {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [motion]);

  return (
    <Animated.View style={{ transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.08] }) }] }}>
      <LottieView source={require("./assets/animations/fingerprint-scan.json")} autoPlay loop style={s.bottomArAnimation}/>
    </Animated.View>
  );
}

function HorizontalBorderBeam() {
  const beam = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(beam, {toValue:1,duration:4000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
        Animated.timing(beam, {toValue:0,duration:4000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [beam]);

  const travel = Math.max(250, width - 36);
  const topX = beam.interpolate({inputRange:[0,1],outputRange:[-100,travel]});
  const bottomX = beam.interpolate({inputRange:[0,1],outputRange:[travel,-100]});
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[s.horizontalBeam,s.horizontalBeamTop,{transform:[{translateX:topX}]}]}>
        <LinearGradient colors={["transparent","rgba(231,64,34,.35)",C.white,"rgba(231,64,34,.35)","transparent"]} locations={[0,.28,.5,.72,1]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={StyleSheet.absoluteFill}/>
      </Animated.View>
      <Animated.View style={[s.horizontalBeam,s.horizontalBeamBottom,{transform:[{translateX:bottomX}]}]}>
        <LinearGradient colors={["transparent","rgba(231,64,34,.35)",C.white,"rgba(231,64,34,.35)","transparent"]} locations={[0,.28,.5,.72,1]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={StyleSheet.absoluteFill}/>
      </Animated.View>
    </View>
  );
}

function ShineText({children,style,tone="light"}:{children:string;style?:any;tone?:"light"|"orange"}) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "web") {
      const documentRef = (globalThis as any).document;
      if (documentRef && !documentRef.getElementById("tek-text-shine-keyframes")) {
        const sheet = documentRef.createElement("style");
        sheet.id = "tek-text-shine-keyframes";
        sheet.textContent = "@keyframes tekTextShine{0%{background-position:-220px 0}60%,100%{background-position:220px 0}}";
        documentRef.head.appendChild(sheet);
      }
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow,{toValue:1,duration:1800,easing:Easing.inOut(Easing.quad),useNativeDriver:false}),
        Animated.timing(glow,{toValue:0,duration:1200,easing:Easing.inOut(Easing.quad),useNativeDriver:false}),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [glow]);

  if (Platform.OS === "web") {
    const flatStyle = StyleSheet.flatten(style) || {};
    const colors = tone === "orange"
      ? "linear-gradient(90deg,#E74022 0%,#FFD5B8 10%,#E74022 20%)"
      : "linear-gradient(90deg,#9f9f9f 0%,#ffffff 10%,#b8b8b8 20%)";
    return createElement("span",{
      style:{...flatStyle,display:"inline-block",color:"transparent",backgroundImage:colors,backgroundSize:"220px 100%",backgroundRepeat:"no-repeat",backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"tekTextShine 3s linear infinite",whiteSpace:"nowrap"},
    },children);
  }

  return <Animated.Text style={[style,{color:glow.interpolate({
    inputRange:[0,.5,1],
    outputRange:tone==="orange"?[C.orange,"#FFD5B8",C.orange]:["#B8B8B8",C.white,"#B8B8B8"],
  })}]}>{children}</Animated.Text>;
}

function HamburgerIcon({ progress, color = C.navy }: { progress: Animated.Value; open: boolean; color?: string }) {
  return (
    <View pointerEvents="none" style={s.hamburgerIcon}>
      <Animated.View style={[s.hamburgerSwapLayer,{opacity:progress.interpolate({inputRange:[0,.55,1],outputRange:[1,0,0]}),transform:[
        {rotate:progress.interpolate({inputRange:[0,1],outputRange:["0deg","90deg"]})},
        {scale:progress.interpolate({inputRange:[0,1],outputRange:[1,.72]})},
      ]}]}>
        <Svg width={29} height={29} viewBox="0 0 512 512"><Path fill={color} d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z"/></Svg>
      </Animated.View>
      <Animated.View style={[s.hamburgerSwapLayer,{opacity:progress.interpolate({inputRange:[0,.45,1],outputRange:[0,0,1]}),transform:[
        {rotate:progress.interpolate({inputRange:[0,1],outputRange:["-90deg","0deg"]})},
        {scale:progress.interpolate({inputRange:[0,1],outputRange:[.72,1]})},
      ]}]}>
        <Svg width={29} height={29} viewBox="0 0 512 512"><Polygon fill={color} points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49"/></Svg>
      </Animated.View>
    </View>
  );
}

function AppBackButton({
  onPress,
  light = false,
  style,
}: {
  onPress: () => void;
  light?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.appBackButton, light ? s.appBackButtonLight : s.appBackButtonDark, style]}
      accessibilityRole="button"
      accessibilityLabel="Geri dön"
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={24} color={light ? C.navy : C.white} />
    </Pressable>
  );
}

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const trackEvent = (_name: string, _params: Record<string, string | number> = {}) => {};
const trackScreen = (_screen: string) => {};
const identifyAnalyticsUser = (_id: number | null) => {};

type Tab = "home" | "info" | "products" | "production" | "togo" | "calculator" | "quote" | "contact" | "portal";
type ProductId = "asphalt" | "emulsion" | "insulation";
type TekProductId = "ready" | "porous" | "colored" | "joint" | "emulsion" | "mastic" | "stoneMastic" | "modified" | "quiet";
type InfoSection = "about" | "activities" | "applications" | "laboratory" | "quality";
type PortalView = "dashboard" | "orders" | "profile" | "notifications" | "settings" | "help" | "security" | "privacy";
const SWIPE_TABS: Tab[] = ["home", "info", "products", "production", "togo", "calculator", "quote", "contact", "portal"];
type Market = {
  weather: string;
  condition: string;
  weatherCode: number;
  isDay: boolean;
  usd: string;
  eur: string;
  bitumen: string;
  bitumenGross: string;
  bitumenDate: string;
  bitumenTrend: "up" | "down" | "flat";
  bitumenPrevious?: string;
  bitumenPreviousDate?: string;
  bitumenLive: boolean;
  bitumenVat: number;
  eurChange?: number;
  usdChange?: number;
};
type WeatherForecastDay = { date: string; code: number; high: number; low: number; rain: number };
type WeatherHourly = { time: string; temperature: number; code: number };
type CustomerProfile = {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  address?: string;
  tax_office?: string;
  tax_number?: string;
  avatar?: string;
  login_count: number;
  last_login?: string;
  verified: boolean;
  is_admin?: boolean;
};
type CustomerDocument = { id: string; title: string; type?: string; available: boolean; download_url?: string };
type QuotePhoto = { uri: string; base64: string; mime: string; name: string };
type CustomerQuote = { id:number; reference:string; product:string; tonnage?:string; project_location?:string; plant?:string; preliminary_items?:string; preliminary_subtotal?:number|string; preliminary_valid_until?:string; preliminary_pdf_url?:string; status:string; status_note?:string; offer_amount?:number|string; offer_currency?:string; offer_valid_until?:string; offer_message?:string; offer_pdf_url?:string; offer_sent_at?:string; archived_at?:string; updated_at:string; created_at:string };
type DesignSetting = {
  enabled?: boolean;
  media_url?: string;
  media_type?: "image" | "video";
  x?: number;
  y?: number;
  zoom?: number;
  height?: number;
  icon?: string;
};
type DesignSettings = Record<string, DesignSetting>;

const DELIVERY_AREAS = {
  "İstanbul Avrupa": ["Arnavutköy", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kağıthane", "Küçükçekmece", "Sarıyer", "Sultangazi", "Şişli", "Zeytinburnu"],
  "Silivri": ["Silivri Merkez", "Akören", "Alipaşa", "Bekirli", "Beyciler", "Büyükçavuşlu", "Büyük Kılıçlı", "Büyüksinekli", "Çayırdere", "Danamandıra", "Fener", "Gazitepe", "Kadıköy", "Kavaklı", "Küçüksinekli", "Ortaköy", "Sayalar", "Seymen", "Yolçatı"],
} as const;

const C = {
  navy: D.colors.navy,
  navy2: D.colors.navyRaised,
  orange: D.colors.brand,
  cream: D.colors.canvas,
  white: D.colors.surface,
  ink: D.colors.text,
  muted: D.colors.textMuted,
};
const VODAFONE = D.fonts.regular;
const VODAFONE_BOLD = D.fonts.bold;
function Text({ style, children: rawChildren, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style) || {};
  const weight = Number(flattened.fontWeight) || 400;
  // Vodafone font files do not include Arabic glyphs. Let iOS use its native Arabic
  // typeface when Arabic is selected, while preserving the brand font elsewhere.
  const fontFamily = getRuntimeLanguage() === "ar" ? undefined : (flattened.fontFamily || (weight >= 700 ? VODAFONE_BOLD : VODAFONE));
  const baseSize = typeof flattened.fontSize === "number" ? flattened.fontSize : 0;
  const readableSize = baseSize > 0 && baseSize <= 14 ? baseSize + 1 : baseSize > 14 && baseSize < 19 ? baseSize + 1.5 : undefined;
  const children = typeof rawChildren === "string" ? translateText(rawChildren) : rawChildren;
  return <RNText {...props} style={[style, fontFamily ? { fontFamily } : null, readableSize ? {fontSize: readableSize} : null]}>{children}</RNText>;
}
function TextInput({ style, ...props }: TextInputProps) {
  const flattened = StyleSheet.flatten(style) || {};
  const weight = Number(flattened.fontWeight) || 400;
  const fontFamily = getRuntimeLanguage() === "ar" ? undefined : (flattened.fontFamily || (weight >= 700 ? VODAFONE_BOLD : VODAFONE));
  const numericKeyboard = props.keyboardType === "decimal-pad" || props.keyboardType === "number-pad" || props.keyboardType === "phone-pad" || props.inputMode === "decimal" || props.inputMode === "numeric" || props.inputMode === "tel";
  return <RNTextInput {...props} inputAccessoryViewID={Platform.OS === "ios" && numericKeyboard ? "tek-number-keyboard" : props.inputAccessoryViewID} style={[style, fontFamily ? { fontFamily } : null]} />;
}
function MotionArrow({color=C.navy,size=18}: {color?:string;size?:number}) {
  const shift=useRef(new Animated.Value(0)).current;
  const move=(toValue:number)=>Animated.spring(shift,{toValue,useNativeDriver:true,speed:24,bounciness:7}).start();
  return <Pressable onHoverIn={()=>move(1)} onHoverOut={()=>move(0)} onPressIn={()=>move(1)} onPressOut={()=>move(0)} style={s.motionArrowHit}>
    <Animated.View style={{transform:[{translateX:shift.interpolate({inputRange:[0,1],outputRange:[0,5]})}]}}><Ionicons name="arrow-forward" size={size} color={color}/></Animated.View>
  </Pressable>;
}

function LidarPitBackdrop() {
  const drift=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const driftLoop=Animated.loop(Animated.sequence([
      Animated.timing(drift,{toValue:1,duration:2400,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      Animated.timing(drift,{toValue:0,duration:2400,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    ]));
    driftLoop.start();
    return()=>driftLoop.stop();
  },[drift]);
  const dots=Array.from({length:96},(_,index)=>{
    const angle=(index/96)*Math.PI*8;
    const ring=.18+(index%4)*.13;
    const jitter=((index*17)%11-5)/100;
    return {
      left:`${68+Math.cos(angle)*(ring+jitter)*34}%` as `${number}%`,
      top:`${52+Math.sin(angle)*(ring+jitter)*31}%` as `${number}%`,
      size:1.5+(index%3)*.65,
      opacity:.28+(index%5)*.1,
      orange:index%17===0,
    };
  });
  return <View pointerEvents="none" style={s.arLidarBackdrop}>
    <Animated.View style={[s.arLidarDotField,{transform:[
      {translateX:drift.interpolate({inputRange:[0,1],outputRange:[-3,4]})},
      {translateY:drift.interpolate({inputRange:[0,1],outputRange:[2,-2]})},
    ]}]}>
      {dots.map((dot,index)=><View key={index} style={[s.arLidarDot,{
        left:dot.left,top:dot.top,width:dot.size,height:dot.size,borderRadius:dot.size/2,opacity:dot.opacity,
      },dot.orange&&s.arLidarDotOrange]}/>)}
    </Animated.View>
  </View>;
}

function SlideToStart({
  enabled,
  busy,
  onComplete,
}: {
  enabled:boolean;
  busy:boolean;
  onComplete:()=>void;
}) {
  return <Pressable
    disabled={!enabled||busy}
    onPress={onComplete}
    style={({pressed})=>[
      s.arSlideTrack,
      !enabled&&s.arSlideTrackDisabled,
      pressed&&enabled&&!busy&&s.arSlideTrackPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={busy?"Kamera hazırlanıyor":"Taramayı başlat"}
  >
    <View style={s.arSlideIcon}>
      <Ionicons name={busy?"hourglass-outline":"scan-outline"} size={23} color={enabled?C.orange:"#8A94A6"}/>
    </View>
    <Text style={s.arSlideText}>{busy?"Kamera hazırlanıyor…":"Taramayı başlat"}</Text>
    <Ionicons name="arrow-forward" size={23} color={enabled?C.white:"#8A94A6"}/>
  </Pressable>;
}

const CUSTOMER_API = "https://tekasfalt.com/wp-json/tek-asfalt/v1";
// Keep the approved in-app layout deterministic for this TestFlight build.
// The WordPress visual editor can be re-enabled after its live phone preview is ready.
const REMOTE_DESIGN_SETTINGS_ENABLED = false;

async function customerPost(path: string, body: Record<string, any>, token?: string) {
  // GoDaddy may cache an earlier WordPress REST "route not found" response.
  // A unique query value keeps form submissions away from that stale cache.
  const requestUrl = `${CUSTOMER_API}${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`;
  let response = await fetch(requestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  let data = await response.json().catch(() => ({}));
  // Some hosting/CDN layers can briefly serve a cached WordPress rest_no_route
  // response even after the endpoint is active. Retry only that exact 404 via
  // WordPress' canonical rest_route entry point; other failures are never sent twice.
  if (response.status === 404 && data?.code === "rest_no_route") {
    const fallbackUrl = `https://tekasfalt.com/?rest_route=/tek-asfalt/v1${path}&_=${Date.now()}`;
    response = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    data = await response.json().catch(() => ({}));
  }
  if (!response.ok) throw new Error(data?.message || "İşlem tamamlanamadı.");
  return data;
}

async function customerGet(path: string, token: string) {
  const requestUrl = `${CUSTOMER_API}${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`;
  const response = await fetch(requestUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Oturum doğrulanamadı.");
  return data;
}

async function saveCustomerToken(token: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem("tek_customer_token", token);
    return;
  }
  await SecureStore.setItemAsync("tek_customer_token", token);
}

async function readCustomerToken() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem("tek_customer_token") || null;
  return SecureStore.getItemAsync("tek_customer_token");
}
async function clearCustomerToken() {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem("tek_customer_token");
    return;
  }
  await SecureStore.deleteItemAsync("tek_customer_token");
}

async function prepareWebQuoteImage(uri: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return null;
  return new Promise<{base64:string;uri:string;mime:string}>((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => {
      try {
        const maxSide = 1600;
        const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * ratio));
        const height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Görsel hazırlanamadı.");
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const dataUri = canvas.toDataURL("image/jpeg", 0.72);
        resolve({base64:dataUri.split(",")[1] || "",uri:dataUri,mime:"image/jpeg"});
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error("Seçilen görsel okunamadı."));
    image.src = uri;
  });
}
function formatTurkishMobile(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  return [digits.slice(0,3),digits.slice(3,6),digits.slice(6,8),digits.slice(8,10)].filter(Boolean).join(" ");
}
function normalizeTurkishMobile(value: string) {
  const digits = formatTurkishMobile(value).replace(/\D/g, "");
  return digits ? `+90${digits}` : "";
}
const MEDIA = {
  before:
    "https://i0.wp.com/tekasfalt.com/wp-content/uploads/2025/01/1996_tekasfalt.png?resize=1290%2C912",
  now: "https://i0.wp.com/tekasfalt.com/wp-content/uploads/2025/01/2025_tekasfalt.png?resize=1290%2C912",
};
const TEK_REFERENCE_NAMES = [
  "TURANTEKSTIL", "TEMPO", "SSBAGCILARGUNGOREN", "SOLEN", "SITTNAK", "SAITOGULLARI", "ORA", "KITAS",
  "ISTOC", "ELVAN", "ELTE", "DOGUSAN", "ARAS", "AKTON", "AKCANSA", "SULTANGAZI",
  "SILIVRI", "KUCUKCEKMECE", "KGM_LOGO", "KAGITHANE", "GUNGOREN", "GAZIOSMANPASA", "FATIH", "EYUP",
  "CERKEZKOY", "BIGA", "BAGCILAR",
];
const TEK_REFERENCE_ASSETS = [
  require("./assets/references/tek/tek-arnavutkoy.svg.png"), require("./assets/references/tek/tek-bayrampasa.svg.png"), require("./assets/references/tek/tek-borusan.svg.png"), require("./assets/references/tek/tek-esenler.svg.png"), require("./assets/references/tek/tek-isfalt.svg.png"),
  ...TEK_REFERENCE_NAMES.map((name) => ({uri:`https://i0.wp.com/tekasfalt.com/wp-content/uploads/2024/12/${name}.png?fit=709%2C354&ssl=1`})),
];
const TOGO_REFERENCE_ASSETS = [
  require("./assets/references/togo/togo-sabanci.png"), require("./assets/references/togo/togo-metro.png"), require("./assets/references/togo/togo-ege.png"), require("./assets/references/togo/togo-erdem.png"), require("./assets/references/togo/togo-beybi.png"), require("./assets/references/togo/togo-taga.png"),
  {uri:"https://asfalttogo.com/wp-content/uploads/2025/01/milliSavunma.png"},
  {uri:"https://asfalttogo.com/wp-content/uploads/2025/01/garantiiyolasiyon.png"},
  {uri:"https://asfalttogo.com/wp-content/uploads/2025/01/adex_logo.png"},
];
const PLANTS = [
  {
    name: "Esenler",
    capacity: "340 t/s",
    silo: "80 t sıcak silo",
    image:
      "https://tekasfalt.com/wp-content/uploads/2026/07/sultangazi_plant-scaled.jpg",
    video: require("./assets/corporate/production-esenler-optimized-app.mp4"),
    heroVideo: require("./assets/corporate/production-esenler-hero-app.mp4"),
    heroScale: 1,
    description:
      "Yüksek üretim gücü, ileri teknoloji brülör ve etkili filtre sistemiyle İstanbul’un merkezinde kesintisiz üretim.",
  },
  {
    name: "Silivri",
    capacity: "200 t/s",
    silo: "50 t sıcak silo",
    image:
      "https://tekasfalt.com/wp-content/uploads/2026/07/silivri_plant-scaled.jpg",
    video: require("./assets/corporate/production-silivri-mobile-app.mp4"),
    heroVideo: require("./assets/corporate/production-silivri-mobile-app.mp4"),
    heroScale: 1,
    description:
      "Bölgenin asfalt üretim merkezi; kamu ve özel sektör projeleri için hızlı, güvenilir ve kaliteli çözümler.",
  },
  {
    name: "Silivri Plentmiks",
    capacity: "300 t/s",
    silo: "Plent Mix Temel",
    image: require("./assets/corporate/production-plentmiks-app.jpg"),
    video: require("./assets/corporate/production-plentmiks-mobile-app.mp4"),
    heroScale: 1,
    description:
      "Otomasyon kontrollü plentmiks üretimiyle homojen temel malzemesi, yüksek kapasite ve düzenli stok yönetimi.",
  },
];
const HOME_ACTIVITIES = [
  {
    title: "Asfalt serimi ve sıkıştırma",
    meta: "Zemin hazırlığından son kontrole kadar saha uygulaması",
    video: require("./assets/corporate/applications-road-mobile-app.mp4"),
    tab: "info" as Tab,
    section: "applications" as InfoSection,
  },
  {
    title: "Üretim ve sevkiyat",
    meta: "Projeye uygun karışım, planlı üretim ve zamanında teslim",
    video: require("./assets/corporate/activities-mobile-app.mp4"),
    tab: "production" as Tab,
  },
  {
    title: "Laboratuvar ve kalite",
    meta: "Hammadde, reçete ve üretim kontrolleri",
    video: require("./assets/corporate/quality-optimized-app.mp4"),
    tab: "info" as Tab,
    section: "quality" as InfoSection,
  },
] as const;
const ASPHALT_PRODUCTS = [
  "Binder Tabakası",
  "Aşınma Tip-1",
  "Bitümlü Temel",
  "Sessiz Asfalt",
  "Modifiye Asfalt",
  "Taş Mastik Asfalt",
  "Mastik Asfalt",
  "Renkli Asfalt",
  "Poröz Asfalt",
];
const PLANT_PRICE_ROWS = [
  { name:"Aşınma Tip-1", sultangazi:2606, silivri:2916 },
  { name:"Aşınma Tip-2", sultangazi:2697, silivri:3039 },
  { name:"Aşınma Tip-3", sultangazi:2850, silivri:3161 },
  { name:"Sıfır Asfalt", sultangazi:3125, silivri:3436 },
  { name:"Binder Tabakası", sultangazi:2453, silivri:2764 },
  { name:"Bitümlü Temel", sultangazi:2362, silivri:2672 },
  { name:"Poröz Asfalt", sultangazi:2534, silivri:3170 },
  { name:"Plentmiks", sultangazi:0, silivri:800 },
] as const;
const preliminaryUnitPrice = (product: string, plant: "sultangazi"|"silivri") =>
  PLANT_PRICE_ROWS.find(row=>row.name===product)?.[plant] || 0;
const PROJECT_SERVICES = [
  { id: "shipping", title: "Nakliye", meta: "Damperli kamyonla şantiyeye sevkiyat", icon: "truck-fast-outline", family: "material" },
  { id: "application", title: "Asfalt serimi", meta: "Finişerle serim ve silindir sıkıştırma", icon: "road", family: "image", image: require("./assets/project-finisher.png"), webImage: "/assets/project-finisher.png" },
  { id: "milling", title: "Asfalt frezeleme", meta: "Freze tamburuyla mevcut kaplamanın kazınması", icon: "excavator", family: "image", image: require("./assets/project-freze.png"), webImage: "/assets/project-freze.png" },
  { id: "excavation", title: "Hafriyat alımı", meta: "Kazınan malzemenin damperli araçla tahliyesi", icon: "dump-truck", family: "material" },
  { id: "primer", title: "Bitüm emülsiyonu", meta: "Distribütör tankerle yüzeye aderans tabakası", icon: "tanker-truck", family: "image", image: require("./assets/project-emulsion.png"), webImage: "/assets/project-emulsion.png" },
  { id: "marking", title: "Yol çizgisi", meta: "Şerit ve trafik işaretleme uygulaması", icon: "format-paint", family: "image", image: require("./assets/project-road-marking.png"), webImage: "/assets/project-road-marking.png" },
] as const;
const TOGO_MARKETPLACES = [
  { name: "Trendyol", meta: "Mağazadan satın al", logo: "https://asfalttogo.com/wp-content/uploads/2025/12/trendyol-seeklogo.png", url: "https://ty.gl/rkkfoxpi16pdf" },
  { name: "Hepsiburada", meta: "Tek Asfalt mağazası", logo: "https://asfalttogo.com/wp-content/uploads/2025/12/hepsiburada-seeklogo.png", url: "https://www.hepsiburada.com/magaza/tek-asfalt" },
  { name: "Amazon", meta: "Asfalt To Go mağazası", logo: "https://asfalttogo.com/wp-content/uploads/2025/12/amazon-seeklogo.png", url: "https://www.amazon.com.tr/stores/AsfaltTOGO/page/4EE01A20-FFCB-4849-9DF8-C676040DE9D0" },
] as const;
const TEK_PRODUCTS: {id: TekProductId; title: string; meta: string; icon: string; intro: string; uses: string[]; source: string}[] = [
  {id:"ready",title:"Hazır Asfalt",meta:"Yol ve saha kaplamaları",icon:"layers-outline",intro:"Yüksek kaliteli agrega ve bitümün kontrollü üretimiyle hazırlanan, şehir yollarından endüstriyel sahalara kadar dayanıklı kaplama çözümü.",uses:["Şehir içi yollar ve bağlantı yolları","Otoparklar ve endüstriyel sahalar","Kamu ve özel sektör üstyapı projeleri"],source:"https://tekasfalt.com/services/hazir-asfalt/"},
  {id:"porous",title:"Poröz Asfalt",meta:"Drenaj ve düşük gürültü",icon:"water-outline",intro:"Açık gözenekli yapısıyla yüzey suyunu hızla uzaklaştırır; yağışlı havada görüşü ve sürüş konforunu destekler.",uses:["Yağış alan yol kesimleri","Otopark ve çevre düzenlemeleri","Gürültü azaltımı hedeflenen güzergâhlar"],source:"https://tekasfalt.com/services/poroz-asfalt/"},
  {id:"colored",title:"Renkli Asfalt",meta:"Dekoratif ve güvenli yüzey",icon:"color-palette-outline",intro:"Özel pigment ve renkli agregalarla üretilen, farklı kullanım alanlarını görünür kılan dayanıklı ve estetik asfalt.",uses:["Bisiklet ve yaya yolları","Meydanlar ve prestij caddeleri","Okul çevreleri ve otobüs durakları"],source:"https://tekasfalt.com/services/renkliasfalt/"},
  {id:"joint",title:"Derz Dolgu Bitümü",meta:"Ek ve çatlaklarda su koruması",icon:"git-commit-outline",intro:"Eski ve yeni asfalt birleşimleri ile çatlaklarda su sızmasını azaltan, polimer modifiye bitüm esaslı kalıcı yalıtım çözümü.",uses:["Karayolları ve şehir içi yollar","Köprü, viyadük ve otoparklar","Yama ve birleşim derzleri"],source:"https://tekasfalt.com/services/derzdolgu/"},
  {id:"emulsion",title:"Emülsiyon",meta:"Aderans ve yüzey hazırlığı",icon:"flask-outline",intro:"Asfalt tabakaları arasında güçlü aderans sağlayan, yüzey hazırlığı ve koruyucu uygulamalarda kullanılan bitüm emülsiyonu.",uses:["Astar ve yapıştırma tabakası","Sathi kaplama uygulamaları","Bakım ve onarım işleri"],source:"https://tekasfalt.com/services/emulsiyon/"},
  {id:"mastic",title:"Mastik Asfalt",meta:"Boşluksuz ve geçirimsiz yapı",icon:"square-outline",intro:"Yüksek bitüm oranlı, boşluksuz yapısıyla su geçirimsizliği ve uzun servis ömrü sunan özel asfalt karışımı.",uses:["Köprü ve otopark üstleri","Endüstriyel zeminler","Su yalıtımı gerektiren yüzeyler"],source:"https://tekasfalt.com/services/mastikasfalt/"},
  {id:"stoneMastic",title:"Taş Mastik Asfalt",meta:"Yoğun trafik için güçlü yapı",icon:"grid-outline",intro:"Taş iskelet yapısı ve yüksek bağlayıcı içeriğiyle ağır trafik yüklerine, deformasyona ve aşınmaya dirençli kaplama.",uses:["Otoyollar ve ana arterler","Ağır taşıt trafiği olan yollar","Kavşak ve eğimli kesimler"],source:"https://tekasfalt.com/services/tasmastikasfalt/"},
  {id:"modified",title:"Modifiye Asfalt",meta:"Yüksek dayanım ve performans",icon:"shield-checkmark-outline",intro:"Polimer modifiye bağlayıcıyla sıcaklık değişimlerine, yorulmaya ve tekerlek izi oluşumuna karşı geliştirilmiş performans.",uses:["Yoğun trafik güzergâhları","Köprü ve viyadükler","Zorlu iklim koşulları"],source:"https://tekasfalt.com/services/modifiyeasfalt/"},
  {id:"quiet",title:"Sessiz Asfalt",meta:"Düşük yol ve lastik gürültüsü",icon:"volume-mute-outline",intro:"Optimize edilmiş agrega yapısıyla lastik-yol temasından doğan gürültüyü azaltmaya yardımcı, konfor odaklı kaplama.",uses:["Yerleşim bölgeleri","Şehir içi ana arterler","Gürültü hassasiyeti olan güzergâhlar"],source:"https://tekasfalt.com/services/sessizasfalt/"},
];
const TEK_PRODUCT_MEDIA: Record<TekProductId, {type:"image"|"video"; source:any; poster?:any; fit?:"cover"|"contain"}> = {
  ready:{type:"video",source:require("./assets/products/catalog/hazir-asfalt-app.mp4"),poster:require("./assets/products/catalog/hazir-asfalt.png"),fit:"contain"},
  porous:{type:"video",source:require("./assets/products/catalog/poroz-asfalt-optimized-app.mp4"),poster:require("./assets/products/catalog/poroz-asfalt-optimized-app-poster.jpg"),fit:"cover"},
  colored:{type:"image",source:require("./assets/products/catalog/renkli-asfalt-app.jpg"),fit:"cover"},
  joint:{type:"video",source:require("./assets/products/catalog/derz-dolgu-app.mp4"),poster:require("./assets/products/catalog/derz-dolgu-app-poster.jpg"),fit:"contain"},
  emulsion:{type:"video",source:require("./assets/products/catalog/emulsiyon-optimized.mp4"),poster:require("./assets/products/catalog/emulsiyon-optimized-poster.jpg"),fit:"cover"},
  mastic:{type:"video",source:require("./assets/products/catalog/mastik-asfalt-optimized-app.mp4"),poster:require("./assets/products/catalog/mastik-asfalt-optimized-app-poster.jpg"),fit:"cover"},
  stoneMastic:{type:"image",source:require("./assets/products/catalog/tas-mastik-asfalt-app.jpg"),fit:"cover"},
  modified:{type:"image",source:require("./assets/products/catalog/modifiye-asfalt-app.jpg"),fit:"cover"},
  quiet:{type:"video",source:require("./assets/products/catalog/sessiz-asfalt-optimized-app.mp4"),poster:require("./assets/products/catalog/sessiz-asfalt-optimized-app-poster.jpg"),fit:"cover"},
};
const PRODUCT_SHOWCASE_ITEMS: {
  key:string;
  target:TekProductId|ProductId;
  detailKind:"tek"|"togo";
  title:string;
  meta:string;
  intro:string;
  source:any;
  fit:"cover"|"contain";
  background:string;
  translateX?:number;
  scale?:number;
}[] = [
  {key:"togo-ready",target:"asphalt",detailKind:"togo",title:"Hazır Asfalt",meta:"ASFALT TO GO · 25 KG",intro:"Kullanıma hazır, dört mevsim uygulanabilen profesyonel soğuk asfalt çözümü.",source:require("./assets/products/catalog/hazir-asfalt.png"),fit:"contain",background:"#101B34",scale:.78},
  {key:"togo-emulsion",target:"emulsion",detailKind:"togo",title:"Emülsiyon",meta:"ASFALT TO GO · ASTAR",intro:"Yol malzemeleri, derzler ve membranlar için hızlı kuruyan yüksek aderanslı bitüm astarı.",source:require("./assets/products/catalog/emulsiyon.png"),fit:"contain",background:"#E9E8E3",scale:.72},
  {key:"togo-insulation",target:"insulation",detailKind:"togo",title:"Asfalt Yalıtımı",meta:"ASFALT TO GO · 20 KG",intro:"Zayıf bölgeleri koruyan, erken deformasyonu azaltan polimer güçlendirmeli bitüm esaslı çözüm.",source:require("./assets/products/yalitim-detail.png"),fit:"contain",background:"#ECEBE7",scale:.8},
  ...TEK_PRODUCTS.filter(item=>!["ready","emulsion","joint"].includes(item.id)).map(item=>{
    const media=TEK_PRODUCT_MEDIA[item.id];
    return {
      key:`tek-${item.id}`,
      target:item.id,
      detailKind:"tek",
      title:item.title,
      meta:item.meta,
      intro:item.intro,
      source:media.type==="video" ? media.poster : media.source,
      fit:media.fit || "cover",
      background:"#0B1222",
      translateX:item.id==="colored" ? -42 : 0,
      scale:item.id==="colored" ? 1.14 : 1,
    } as const;
  }),
];
const PRODUCT_PACDORA_URLS: Record<ProductId, string> = {
  asphalt: "https://www.pacdora.com/de/share?filter_url=ps7pfw74r4",
  emulsion: "https://www.pacdora.com/de/share?filter_url=psslkf5dca",
  insulation: "https://www.pacdora.com/de/share?filter_url=psoydoa0wo",
};
const TEK_PRODUCT_PACDORA_URLS: Partial<Record<TekProductId, string>> = {
  ready: "https://www.pacdora.com/de/share?filter_url=ps7pfw74r4",
  emulsion: "https://www.pacdora.com/de/share?filter_url=psk19fqhyk",
  joint: "https://www.pacdora.com/de/share?filter_url=psoydoa0wo",
};
const ASPHALT_TO_GO_DOCUMENTS: Record<string, number> = {
  "asphalt-tech": require("./assets/documents/asfalt-to-go-teknik-bilgi-formu.pdf"),
  "asphalt-sds": require("./assets/documents/asfalt-to-go-guvenlik-bilgi-formu.pdf"),
  "asphalt-ce": require("./assets/documents/asfalt-to-go-ce-2025.pdf"),
};
const TOGO_READY_SECTIONS = [
  {
    id:"application",
    title:"Uygulama",
    icon:"construct-outline",
    items:[
      "Beton ve asfalt yüzeylerdeki çukur ve bozulmalar için kullanıma hazır soğuk asfalt karışımıdır.",
      "Uzman ekip, ağır makine, ısıtma veya ek katkı maddesi gerektirmeden doğrudan uygulanır.",
      "Soğuk, sıcak ve yağmurlu hava koşullarında uygulanabilir; sıcaklık değişimlerine karşı esnektir.",
      "Şehir içi yollar, otoparklar ve sanayi alanlarındaki ağır yük trafiğine dayanıklıdır.",
    ],
  },
  {
    id:"coverage",
    title:"Uygulama ve sarfiyat",
    icon:"calculator-outline",
    items:[
      "Önerilen uygulama derinliği 3–5 cm’dir.",
      "25 kg bir kova, zemine bağlı olarak yaklaşık 0,5–0,7 m² alan kaplar.",
      "Kürek, mala, silindir veya el tokmağıyla yayılıp sıkıştırılır.",
      "Yoğun trafikli alanlar uygulamadan yaklaşık 1 saat sonra kullanıma açılabilir.",
    ],
  },
  {
    id:"areas",
    title:"Kullanım alanları",
    icon:"map-outline",
    items:[
      "Şehir içi ve şehirlerarası yollar, ara sokaklar, otoparklar, yaya ve bisiklet yolları.",
      "Hastane, okul, AVM, sanayi bölgesi ve sosyal tesis giriş-çıkışları.",
      "Kavşaklar, menhol kapakları çevresi, asfalt ve beton yüzeylerdeki kırık alanlar.",
      "Havaalanı apronları, liman sahaları ve askerî tesislerde küçük ölçekli tamiratlar.",
    ],
  },
  {
    id:"storage",
    title:"Depolama",
    icon:"archive-outline",
    items:[
      "Kapalı orijinal ambalajında 12 aya kadar saklanabilir.",
      "Güneş ışığı, yağmur ve aşırı sıcaklıktan korunmalıdır.",
      "Açılan kova sıkıca kapatılmalı ve kalan malzeme kısa sürede kullanılmalıdır.",
      "En iyi sonuç için uygulama öncesinde oda sıcaklığında bekletilmesi önerilir.",
    ],
  },
  {
    id:"environment",
    title:"Çevre ve sağlık",
    icon:"leaf-outline",
    items:[
      "Solvent ve uçucu organik bileşen (VOC) içermez.",
      "Geri dönüştürülebilir malzemelerle üretilmiştir.",
      "Profesyonel ve bireysel kullanıcılar için güvenli, sürdürülebilir bir altyapı çözümüdür.",
    ],
  },
  {
    id:"advantages",
    title:"Ek avantajlar",
    icon:"shield-checkmark-outline",
    items:[
      "Hemen kullanıma hazırdır ve uygulama sonrası bakım gerektirmez.",
      "Trafiğin etkisiyle zaman içinde daha güçlü sıkışma sağlar.",
      "TSE K-50 ve CE standartlarına uygun olarak üretilir.",
    ],
  },
] as const;
const TOGO_APPLICATION_STEPS = [
  {no:"01",title:"Süpürme",text:"Uygulamadan önce yüzeyi kir, gevşek agrega ve sudan arındırın.",image:require("./assets/togo/steps/step-1.png")},
  {no:"02",title:"Emülsiyon",text:"Maksimum dayanıklılık için yüzeye bitümlü astar uygulayın. Bu adım önerilir, zorunlu değildir.",image:require("./assets/togo/steps/step-2.png")},
  {no:"03",title:"Yayma",text:"Gerekli miktarda ASFALT TO GO® malzemesini yüzeyden hafifçe yüksek kalacak şekilde dağıtın.",image:require("./assets/togo/steps/step-3.png")},
  {no:"04",title:"Sıkıştırma",text:"Silindir, kompaktör veya el tokmağıyla yüzeyi kontrollü biçimde sıkıştırın.",image:require("./assets/togo/steps/step-4.png")},
] as const;
const PRODUCT_CERTIFICATIONS = [
  {title:"TSE",meta:"Türk Standardlarına uygun",source:require("./assets/brand/tse-logo.png")},
  {title:"ISO 9001",meta:"Kalite yönetim sistemi",source:require("./assets/certifications/iso-ccpl.png")},
  {title:"Yerli Üretim",meta:"Türkiye'de üretilir",source:require("./assets/brand/yerli-uretim.png")},
  {title:"CE",meta:"Uygunluk standardı",source:require("./assets/brand/ce-logo.png")},
];
const TOGO_LOGO = "local-togo-logo";
const PRODUCT_DETAILS: Record<
  ProductId,
  {
    index: string;
    title: string;
    slogan: string;
    image: string;
    video: string;
    detailImage: number;
    stats: { value: string; label: string; icon: string }[];
    intro: string;
    sections: { id: string; title: string; icon: string; items: string[] }[];
    notice: { title: string; text: string; icon: string };
    docs: string[];
  }
> = {
  asphalt: {
    index: "01",
    title: "Hazır Asfalt",
    slogan: "Kullanıma hazır, dayanıklı ve çözücü içermez.",
    image:
      "https://asfalttogo.com/wp-content/uploads/2025/12/kova-4-scaled.png",
    video:
      "https://asfalttogo.com/wp-content/uploads/2026/07/Export_Video_2026-07-18-2.mp4",
    detailImage: require("./assets/products/emulsiyon-detail.png"),
    stats: [
      {value:"Hazır",label:"Doğrudan uygulama",icon:"flash-outline"},
      {value:"4 Mevsim",label:"Her hava koşulu",icon:"rainy-outline"},
      {value:"VOC 0",label:"Çözücü içermez",icon:"leaf-outline"},
    ],
    intro:
      "Beton ve asfalt yüzeylerdeki çukur ve bozulmalar için geliştirilmiş, ısıtma ya da ağır makine gerektirmeyen kullanıma hazır soğuk asfalt karışımıdır.",
    sections: [
      {
        id: "application",
        title: "Uygulama ve sarfiyat",
        icon: "construct-outline",
        items: [
          "Her hava koşulunda doğrudan yüzeye uygulanabilir.",
          "25 kg kova yaklaşık 0,5–0,7 m² alan kaplar.",
          "Kürek, mala, silindir veya el tokmağıyla yayılıp sıkıştırılır.",
          "Yoğun trafikli alanlar yaklaşık 1 saat içinde kullanıma açılabilir.",
        ],
      },
      {
        id: "areas",
        title: "Kullanım alanları",
        icon: "map-outline",
        items: [
          "Şehir içi yollar, otoparklar ve yaya yolları",
          "Menhol çevreleri, kavşaklar ve sanayi sahaları",
          "Havaalanı apronları, limanlar ve küçük ölçekli tamiratlar",
        ],
      },
      {
        id: "storage",
        title: "Depolama ve çevre",
        icon: "archive-outline",
        items: [
          "Kapalı orijinal ambalajında 12 aya kadar saklanır.",
          "Güneş, yağmur ve aşırı sıcaktan korunmalıdır.",
          "Solvent ve VOC içermez; geri dönüştürülebilir malzemelerle üretilir.",
        ],
      },
    ],
    notice: {title:"TSE K-50 ve CE belgeli",text:"Profesyonel ve bireysel kullanıma uygun, güvenli ve sürdürülebilir soğuk asfalt çözümü.",icon:"shield-checkmark-outline"},
    docs: ["Güvenlik Bilgi Formu", "Teknik Bilgi Formu", "CE Sertifikası"],
  },
  emulsion: {
    index: "02",
    title: "Emülsiyon",
    slogan: "Optimal yapışma, derin nüfuz ve hızlı kuruma.",
    image:
      "https://asfalttogo.com/wp-content/uploads/2025/02/Render_Mockup_4000_4000_2025-02-15-2.png",
    video:
      "https://asfalttogo.com/wp-content/uploads/2026/07/Export_Video_2026-07-18-1.mp4",
    detailImage: require("./assets/products/hazir-asfalt-detail.png"),
    stats: [
      {value:"≈ 1 m²",label:"Kutu başına",icon:"resize-outline"},
      {value:"+5–35°C",label:"Uygulama aralığı",icon:"thermometer-outline"},
      {value:"12 Ay",label:"Raf ömrü",icon:"time-outline"},
    ],
    intro:
      "Bitüm bazlı yol malzemeleri, derz ve çatlak bantları, bitüm dolgular, yapıştırıcılar, boyalar ve membran uygulamaları için yüksek performanslı astardır.",
    sections: [
      {
        id: "purpose",
        title: "Kullanım amacı",
        icon: "layers-outline",
        items: [
          "Bitüm bazlı yol yapım malzemeleri için yüksek aderanslı astar olarak kullanılır.",
          "Derz ve çatlak bantları, bitüm dolgular, yapıştırıcılar ve bitüm boyalar için yüzeyi hazırlar.",
          "Çatı kaplama ve membran malzemelerinin yüzeye güçlü biçimde bağlanmasını destekler.",
        ],
      },
      {
        id: "application",
        title: "Uygulama ve sarfiyat",
        icon: "brush-outline",
        items: [
          "Zemin kuru, temiz ve yağdan arındırılmış olmalıdır.",
          "Uygulama sıcaklığı +5°C ile +35°C arasında olmalıdır.",
          "Kutu uygulamadan önce yaklaşık 1 dakika çalkalanır ve yüzeye eşit biçimde uygulanır.",
          "Yüzeye eşit uygulanır; tamamen kurumadan sonraki katmana geçilmez.",
          "Bir kutu zemine bağlı olarak yaklaşık 1 m² alan kaplar.",
          "Plastik ve solvente dayanıksız yüzeylerde kullanılmamalıdır.",
        ],
      },
      {
        id: "areas",
        title: "Kullanım alanları",
        icon: "map-outline",
        items: [
          "Sıcak karışım asfalt ve yüzey kaplamaları",
          "Derz ve çatlak bantları",
          "Bitüm dolgular, yapıştırıcılar ve boyalar",
          "Çatı kaplama ve membran malzemeleri",
        ],
      },
      {
        id: "storage",
        title: "Depolama",
        icon: "archive-outline",
        items: [
          "Donmaya karşı dayanıklıdır; doğrudan güneşten ve aşırı sıcaklıktan korunmalıdır.",
          "Orijinal kapalı ambalajında yaklaşık 12 ay saklanabilir.",
          "Ateş ve tutuşturucu kaynaklardan uzakta muhafaza edilmelidir.",
        ],
      },
      {
        id: "environment",
        title: "Çevre ve güvenlik",
        icon: "leaf-outline",
        items: [
          "Kapalı alanlarda kullanılmamalı, uygulama sırasında alan iyi havalandırılmalıdır.",
          "Tamamen boşaltılmış ambalajlar geri dönüşüme gönderilebilir.",
          "Ürün kalıntıları tehlikeli atık kurallarına uygun biçimde bertaraf edilmelidir.",
        ],
      },
    ],
    notice: {title:"Açık alanda uygulayın",text:"Ürünü ateş kaynaklarından uzak tutun; eldiven ve gözlük kullanın, kuruma tamamlanmadan sonraki katmana geçmeyin.",icon:"warning-outline"},
    docs: ["Güvenlik Bilgi Formu", "Teknik Bilgi Formu"],
  },
  insulation: {
    index: "03",
    title: "Yalıtım",
    slogan: "Su sızmasına karşı dayanıklı, kalıcı koruma.",
    image:
      "https://asfalttogo.com/wp-content/uploads/2026/07/Render_Mockup_4000_4000_2026-07-17-scaled.png",
    video:
      "https://asfalttogo.com/wp-content/uploads/2026/07/Export_Video_2026-07-18.mp4",
    detailImage: require("./assets/products/yalitim-detail.png"),
    stats: [
      {value:"180–210°C",label:"Uygulama ısısı",icon:"flame-outline"},
      {value:"Su Geçirmez",label:"Elastik koruma",icon:"water-outline"},
      {value:"12 Ay",label:"Raf ömrü",icon:"time-outline"},
    ],
    intro:
      "Eski ve yeni asfalt tabakalarının birleşimlerinde ve yama bölgelerinde su sızmasını engellemek için geliştirilmiş modifiye bitüm esaslı yalıtım malzemesidir.",
    sections: [
      {
        id: "application",
        title: "Uygulama",
        icon: "flame-outline",
        items: [
          "Eski ve yeni asfalt birleşimleriyle onarım bölgeleri için geliştirilmiş modifiye bitüm esaslı sıcak uygulama ürünüdür.",
          "Çatlakları doldurur, yüzeye uyum sağlar ve su geçirmeyen elastik bir koruma tabakası oluşturur.",
          "Sıcak ve soğuk hava değişimlerine dayanır; uygulama sonrasında hızlıca sertleşir ve kaymaz.",
        ],
      },
      {
        id: "coverage",
        title: "Uygulama ve sarfiyat",
        icon: "thermometer-outline",
        items: [
          "Malzeme 180–210°C aralığında kontrollü biçimde ısıtılır.",
          "Dökme yöntemiyle veya özel uygulama makinesi kullanılarak yüzeye aktarılır.",
          "Asfalt ve beton yüzeylere güçlü biçimde tutunur.",
          "Uygulama sonrası hızlıca sertleşerek su geçirmez bir katman oluşturur.",
        ],
      },
      {
        id: "areas",
        title: "Kullanım alanları",
        icon: "map-outline",
        items: [
          "Karayolları, şehir içi yol birleşimleri ve onarım derzleri",
          "Köprü genleşme derzleri ve viyadükler",
          "Otoparklar, havaalanı pistleri ve yükleme sahaları",
          "Endüstriyel tesisler, limanlar ve yoğun trafik alanları",
        ],
      },
      {
        id: "storage",
        title: "Depolama",
        icon: "archive-outline",
        items: [
          "Orijinal ambalajında, kuru ve serin ortamda 12 aya kadar saklanabilir.",
          "Doğrudan güneş ışığından ve aşırı ısıdan korunmalıdır.",
          "Uygulamadan önce yalnızca belirtilen çalışma sıcaklığına kadar ısıtılmalıdır.",
        ],
      },
      {
        id: "environment",
        title: "Çevre ve sağlık",
        icon: "leaf-outline",
        items: [
          "Solvent içermez; asfalt ve beton yüzeylere zarar vermez.",
          "Su girişini azaltarak yol katmanlarının servis ömrünü uzatır.",
          "Uzun ömürlü altyapı onarımını destekleyen sürdürülebilir bir çözümdür.",
        ],
      },
      {
        id: "advantages",
        title: "Ek avantajlar",
        icon: "shield-checkmark-outline",
        items: [
          "Tüm iklim koşullarında yüksek performans sağlar.",
          "Su sızıntısını ve erken deformasyonu engellemeye yardımcı olur.",
          "Tek bileşenli yapısıyla ekip ve ekipman ihtiyacını azaltır.",
          "Mevsimsel sıcaklık değişimlerinde esnekliğini ve dayanımını korur.",
        ],
      },
    ],
    notice: {title:"Sıcak uygulama güvenliği",text:"180–210°C çalışma sıcaklığı nedeniyle ısıya dayanıklı eldiven, gözlük, koruyucu giysi ve iş ayakkabısı kullanılmalıdır.",icon:"flame-outline"},
    docs: ["Güvenlik Bilgi Formu", "Teknik Bilgi Formu"],
  },
};

const weatherName = (code: number) =>
  code === 0
    ? "Açık"
    : code <= 2
      ? "Parçalı bulutlu"
      : code === 3
        ? "Kapalı"
        : code === 45 || code === 48
          ? "Sisli"
          : code >= 95
            ? "Fırtınalı"
            : (code >= 71 && code <= 77) || (code >= 85 && code <= 86)
              ? "Karlı"
              : code >= 51 && code <= 82
                ? "Yağışlı"
                : "Değişken";
type WeatherKind = "clear" | "partlyCloudy" | "cloudy" | "fog" | "rain" | "showers" | "snow" | "thunderstorm";
const weatherKind = (code: number): WeatherKind => {
  if (code === 0) return "clear";
  if (code <= 2) return "partlyCloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunderstorm";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 51 && code <= 67) return "rain";
  return "partlyCloudy";
};
const weatherIonicon = (code: number, isDay: boolean) => {
  const kind = weatherKind(code);
  if (kind === "clear") return isDay ? "sunny-outline" : "moon-outline";
  if (kind === "partlyCloudy") return isDay ? "partly-sunny-outline" : "cloudy-night-outline";
  if (kind === "cloudy") return "cloudy-outline";
  if (kind === "fog") return "reorder-three-outline";
  if (kind === "snow") return "snow-outline";
  if (kind === "thunderstorm") return "thunderstorm-outline";
  return "rainy-outline";
};
const plantDetails = (index: number) =>
  index === 2
    ? [
        { icon: "speedometer-outline", value: "300 t/s", label: "ÜRETİM" },
        {
          icon: "layers-outline",
          value: "Stok silosu",
          label: "PLENT MİX TEMEL",
        },
        {
          icon: "settings-outline",
          value: "Otomasyon",
          label: "KUMANDA KABİNİ",
        },
      ]
    : [
        {
          icon: require("./assets/plant-production.png"),
          value: index === 0 ? "340 t/s" : "200 t/s",
          label: "NOMİNAL ÜRETİM",
        },
        { icon: require("./assets/plant-moisture.png"), value: "%4 nem", label: "TEMEL PARAMETRE" },
        { icon: require("./assets/plant-burner.png"), value: "Brülör", label: "İLERİ TEKNOLOJİ" },
        { icon: require("./assets/plant-screening.png"), value: "4 / 5 / 6 kat", label: "ELEME" },
        {
          icon: require("./assets/plant-hot-silo.png"),
          value: index === 0 ? "80 t" : "50 t",
          label: "SICAK SİLO",
        },
        {
          icon: require("./assets/plant-filter.png"),
          value: "Etkili filtre",
          label: "EMİSYON AZALTIMI",
        },
      ];

function Field({
  label,
  unit,
  value,
  onChange,
  autoFocus = false,
  dark = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  dark?: boolean;
}) {
  return (
    <View style={[s.field, dark && s.fieldDark]}>
      <View>
        <Text style={[s.fieldLabel, dark && s.fieldLabelDark]}>{label}</Text>
        <Text style={[s.fieldUnit, dark && s.fieldUnitDark]}>{unit}</Text>
      </View>
      <TextInput
        autoFocus={autoFocus}
        inputMode="decimal"
        keyboardType="decimal-pad"
        value={value}
        maxLength={10}
        onChangeText={(v) => {
          const cleaned = v.replace(",", ".").replace(/[^0-9.]/g, "");
          const [whole = "", ...decimalParts] = cleaned.split(".");
          const decimal = decimalParts.join("").slice(0, 2);
          onChange(`${whole.slice(0, 7)}${decimalParts.length ? `.${decimal}` : ""}`);
        }}
        placeholder="0"
        placeholderTextColor="#A9AFBA"
        style={[s.input, dark && s.inputDark]}
      />
    </View>
  );
}

function IconButton({
  name,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.iconButton}>
      <Ionicons name={name} size={21} color={C.white} />
    </Pressable>
  );
}

function SvgUri({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  if (uri === TOGO_LOGO)
    return (
      <Image
        source={require("./assets/togo-logo.png")}
        resizeMode="contain"
        style={{ width, height }}
      />
    );
  return (
    <Ionicons
      name={uri as keyof typeof Ionicons.glyphMap}
      size={Math.min(width, height)}
      color={C.navy}
    />
  );
}

function ProductVideo({ source, style, fit="cover", blackKey=false }: { source: any; style?: any; fit?: "cover"|"contain"; blackKey?: boolean }) {
  const reveal = useRef(new Animated.Value(0)).current;
  const mediaScale = reveal.interpolate({ inputRange:[0,1], outputRange:[1.045,1] });
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    player.loop = true;
    player.muted = true;
    const statusSubscription = player.addListener(
      "statusChange",
      ({ status }) => {
        if (status === "readyToPlay") {
          player.play();
          Animated.timing(reveal, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        }
      },
    );
    const startTimer = setTimeout(() => {
      player.play();
      Animated.timing(reveal, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, 120);
    return () => {
      clearTimeout(startTimer);
      statusSubscription.remove();
    };
  }, [player, reveal]);

  return (
    <Animated.View style={[style || s.productVideo, { opacity: reveal, overflow:"hidden" }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill,{transform:[{scale:mediaScale}]}]}>
        <VideoView player={player} style={[StyleSheet.absoluteFill, { width:"100%", height:"100%" }, blackKey && { mixBlendMode:"screen" }]} contentFit={fit} nativeControls={false} pointerEvents="none"/>
      </Animated.View>
    </Animated.View>
  );
}

function LaunchAnimation({ onFinish }: { onFinish: () => void }) {
  const player = useVideoPlayer(require("./assets/launch/alogo2026.mov"), (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.play();
  });
  useEffect(() => {
    const ended = player.addListener("playToEnd", onFinish);
    const fallback = setTimeout(onFinish, 4200);
    return () => { ended.remove(); clearTimeout(fallback); };
  }, [player, onFinish]);
  return <View style={s.launchScreen}><VideoView player={player} style={s.launchVideo} contentFit="cover" nativeControls={false} pointerEvents="none"/></View>;
}

function ReferenceLogoMarquee({ logos }: { logos: any[] }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const travel = logos.length * 138;
  useEffect(() => {
    translateX.setValue(0);
    const animation = Animated.loop(Animated.timing(translateX, { toValue: -travel, duration: Math.max(13_000, logos.length * 700), easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [logos, travel, translateX]);
  return <View style={s.referenceMarqueeMask}>
    <Animated.View style={[s.referenceMarqueeTrack,{transform:[{translateX}]}]}>
      {[...logos,...logos].map((logo,index)=><View key={`marquee-${index}`} style={s.referenceMarqueeLogo}><Image source={logo} resizeMode="contain" style={s.referenceLogo}/></View>)}
    </Animated.View>
  </View>;
}

function PosterVideo({ source, poster, style, fit="cover" }: { source:any; poster:any; style?:any; fit?:"cover"|"contain" }) {
  const posterOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const timer = setTimeout(() => Animated.timing(posterOpacity, { toValue:0, duration:700, useNativeDriver:true }).start(), 1700);
    return () => clearTimeout(timer);
  }, [posterOpacity]);
  return <View style={[style,{overflow:"hidden",backgroundColor:"#0A1731"}]}>
    <ProductVideo source={source} style={StyleSheet.absoluteFill} fit={fit}/>
    <Animated.View style={[StyleSheet.absoluteFill,{opacity:posterOpacity}]} pointerEvents="none">
      <Image source={poster} style={{width:"100%",height:"100%"}} resizeMode={fit}/>
    </Animated.View>
  </View>;
}

function ManagedMedia({
  setting,
  defaultSource,
  defaultType = "video",
  defaultX = 0,
  defaultY = 0,
  defaultScale = 1,
  useSettingTransform = true,
  fit = "cover",
  style,
}: {
  setting?: DesignSetting;
  defaultSource: any;
  defaultType?: "image" | "video";
  defaultX?: number;
  defaultY?: number;
  defaultScale?: number;
  useSettingTransform?: boolean;
  fit?: "cover" | "contain";
  style?: any;
}) {
  const imageReveal = useRef(new Animated.Value(0)).current;
  const remoteEnabled = Boolean(setting?.enabled && setting?.media_url);
  const mediaType = remoteEnabled ? setting?.media_type || defaultType : defaultType;
  const source = remoteEnabled ? { uri: setting!.media_url! } : defaultSource;
  useEffect(() => {
    imageReveal.setValue(0);
    Animated.timing(imageReveal,{toValue:1,duration:760,useNativeDriver:true}).start();
  }, [imageReveal, source]);
  const transform = [
    { scale: (useSettingTransform ? setting?.zoom ?? 1 : 1) * defaultScale },
    { translateX: (useSettingTransform ? setting?.x ?? 0 : 0) + defaultX },
    { translateY: (useSettingTransform ? setting?.y ?? 0 : 0) + defaultY },
  ];
  const mediaStyle = [StyleSheet.absoluteFill, style, { transform }];
  if (mediaType === "video") return <ProductVideo source={source} style={mediaStyle} fit={fit} />;
  return <View style={[mediaStyle,{overflow:"hidden"}]}>
    <Animated.Image
      source={source}
      style={[StyleSheet.absoluteFill,{
        opacity:imageReveal,
        transform:[{scale:imageReveal.interpolate({inputRange:[0,1],outputRange:[1.045,1]})}],
      }]}
      resizeMode={fit}
    />
  </View>;
}

function TekProductMedia({id, style}: {id:TekProductId; style?:any}) {
  const media = TEK_PRODUCT_MEDIA[id];
  if (media.type === "video") return <PosterVideo source={media.source} poster={media.poster} style={style} fit={media.fit}/>
  return <Image source={media.source} style={style} resizeMode={media.fit || "cover"}/>;
}

function TekProductPoster({id, style}: {id:TekProductId; style?:any}) {
  const media = TEK_PRODUCT_MEDIA[id];
  return <Image source={media.type==="video" ? media.poster : media.source} style={style} resizeMode={media.fit || "cover"}/>;
}

function CertificationMark({source}: {source:any}) {
  return <Image source={source} style={{width:"100%",height:"100%"}} resizeMode="contain"/>;
}

function HomeHeroVideo() {
  return (
    <View pointerEvents="none" style={s.homeHeroMediaFrame}>
      <ProductVideo
        source={require("./assets/home/30years-intro-v2-mobile.mp4")}
        fit="cover"
        style={[StyleSheet.absoluteFill,s.centeredHeroMedia,s.homeHeroMedia]}
      />
    </View>
  );
}

function StackedSolutionCarousel({onSelect}:{onSelect:()=>void}) {
  const {width}=useWindowDimensions();
  const scrollX=useRef(new Animated.Value(0)).current;
  const cardWidth=Math.min(252,width-108);
  const step=cardWidth*.62;
  const items=[
    ["Sessiz asfalt","Yerleşim alanlarında düşük yol-lastik gürültüsü","volume-mute-outline",require("./assets/products/catalog/sessiz-asfalt-optimized-app-poster.jpg")],
    ["Taş mastik asfalt","Yoğun trafik için yüksek dayanım","layers-outline",require("./assets/products/catalog/tas-mastik-asfalt-app.jpg")],
    ["Poröz asfalt","Suyu yüzeyden uzaklaştıran geçirgen yapı","water-outline",require("./assets/products/catalog/poroz-asfalt-optimized-app-poster.jpg")],
    ["Modifiye asfalt","Zorlu koşullarda yüksek performans","shield-checkmark-outline",require("./assets/products/catalog/modifiye-asfalt-app.jpg")],
  ] as const;
  return <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={step} decelerationRate="fast" contentContainerStyle={[s.stackedRail,{paddingHorizontal:(width-cardWidth)/2}]} onScroll={Animated.event([{nativeEvent:{contentOffset:{x:scrollX}}}],{useNativeDriver:true})} scrollEventThrottle={16}>
    {items.map(([title,text,icon,image],index)=>{
      const input=[(index-1)*step,index*step,(index+1)*step];
      const scale=scrollX.interpolate({inputRange:input,outputRange:[.78,1,.78],extrapolate:"clamp"});
      const translateY=scrollX.interpolate({inputRange:input,outputRange:[28,0,28],extrapolate:"clamp"});
      const rotate=scrollX.interpolate({inputRange:input,outputRange:["-9deg","0deg","9deg"],extrapolate:"clamp"});
      const opacity=scrollX.interpolate({inputRange:input,outputRange:[.52,1,.52],extrapolate:"clamp"});
      return <Animated.View key={title} style={[s.stackedCard,{width:cardWidth,opacity,transform:[{translateY},{scale},{rotate}]}]}><Pressable onPress={onSelect} style={s.stackedCardPress}><Image source={image} style={s.stackedMedia} resizeMode="cover"/><LinearGradient colors={["rgba(7,19,44,.02)","rgba(7,19,44,.92)"]} style={StyleSheet.absoluteFill}/><View style={s.stackedBadge}><Text style={s.stackedBadgeText}>ÇÖZÜM 0{index+1}</Text></View><View style={s.stackedCopy}><View style={s.stackedIcon}><Ionicons name={icon as any} size={18} color={C.orange}/></View><Text style={s.stackedTitle}>{title}</Text><Text style={s.stackedText}>{text}</Text></View></Pressable></Animated.View>;
    })}
  </Animated.ScrollView>;
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const {height:windowHeight,width:windowWidth}=useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const appTheme = isDarkMode ? D.themes.dark : D.themes.light;
  const [tab, setTab] = useState<Tab>("home");
  const [infoSection, setInfoSection] = useState<InfoSection>("about");
  const [market, setMarket] = useState<Market>({
    weather: "30°",
    condition: "Açık",
    weatherCode: 0,
    isDay: true,
    usd: "47,05",
    eur: "53,96",
    bitumen: "24.763",
    bitumenGross: "25.010,63",
    bitumenDate: "30.07.2026",
    bitumenTrend: "down",
    bitumenPrevious: "25.311",
    bitumenLive: false,
    bitumenVat: 1,
  });
  const [marketDetail, setMarketDetail] = useState<"bitumen"|"weather"|"currency"|null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecastDay[]>([
    {date:"2026-08-15",code:0,high:31,low:22,rain:2}, {date:"2026-08-16",code:1,high:30,low:22,rain:4}, {date:"2026-08-17",code:2,high:29,low:21,rain:10}, {date:"2026-08-18",code:3,high:28,low:21,rain:18}, {date:"2026-08-19",code:61,high:27,low:20,rain:45}, {date:"2026-08-20",code:80,high:26,low:20,rain:55}, {date:"2026-08-21",code:2,high:28,low:21,rain:12}, {date:"2026-08-22",code:0,high:30,low:22,rain:3}, {date:"2026-08-23",code:1,high:29,low:22,rain:5}, {date:"2026-08-24",code:61,high:27,low:20,rain:38},
  ]);
  const [weatherHourly, setWeatherHourly] = useState<WeatherHourly[]>([]);
  const [weatherDetails, setWeatherDetails] = useState({ wind: "—", pressure: "—", humidity: "—" });
  const [bitumenVatIncluded, setBitumenVatIncluded] = useState(true);
  const [designSettings, setDesignSettings] = useState<DesignSettings>({});
  const [length, setLength] = useState(""),
    [width, setWidth] = useState(""),
    [height, setHeight] = useState("");
  const [calcProduct, setCalcProduct] = useState("Binder Tabakası");
  const [calcCity, setCalcCity] = useState("İstanbul Avrupa");
  const [calcServices, setCalcServices] = useState<string[]>([]);
  const [calcTruckCapacity, setCalcTruckCapacity] = useState("25");
  const [togoLength, setTogoLength] = useState(""),
    [togoWidth, setTogoWidth] = useState(""),
    [togoDepth, setTogoDepth] = useState("");
  const [togoCalculated, setTogoCalculated] = useState(false);
  const [togoScanPhoto, setTogoScanPhoto] = useState<string | null>(null);
  const [togoNativeScan, setTogoNativeScan] = useState<TekArScanResult | null>(null);
  const [stockpileCapture, setStockpileCapture] = useState<TekStockpileCapture | null>(null);
  const [stockpileScanBusy, setStockpileScanBusy] = useState(false);
  const [togoArSupport, setTogoArSupport] = useState<{supported:boolean;lidarSupported:boolean}>({supported:false,lidarSupported:false});
  const [togoScanBusy, setTogoScanBusy] = useState(false);
  const [togoSafetyAccepted, setTogoSafetyAccepted] = useState(false);
  const [togoScanStage, setTogoScanStage] = useState<"idle" | "measure" | "result">("idle");
  const [togoManualOpen, setTogoManualOpen] = useState(false);
  const [modelInteracting, setModelInteracting] = useState(false);
  const [modelHintDismissed, setModelHintDismissed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductId | null>(
    null,
  );
  const [selectedTekProduct, setSelectedTekProduct] = useState<TekProductId | null>(null);
  const [showcaseActive, setShowcaseActive] = useState(0);
  useEffect(() => {
    setModelHintDismissed(false);
  }, [selectedProduct, selectedTekProduct]);
  const [tabHistory, setTabHistory] = useState<Tab[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productionTarget, setProductionTarget] = useState<number | null>(null);
  const [capacityDisplay, setCapacityDisplay] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [launchAnimationOpen, setLaunchAnimationOpen] = useState(true);
  const systemLanguage = (Intl.DateTimeFormat().resolvedOptions().locale || "tr-TR").toLowerCase();
  const systemAppLanguage = systemLanguage.startsWith("de") ? "de" : systemLanguage.startsWith("en") ? "en" : systemLanguage.startsWith("ar") ? "ar" : "tr";
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(systemAppLanguage);
  const [languageChoiceOpen, setLanguageChoiceOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "otp">("login");
  const [authName, setAuthName] = useState("");
  const [authCompany, setAuthCompany] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [customerToken, setCustomerToken] = useState("");
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerDocuments, setCustomerDocuments] = useState<CustomerDocument[]>([]);
  const [customerQuotes, setCustomerQuotes] = useState<CustomerQuote[]>([]);
  const [quoteReferenceQuery, setQuoteReferenceQuery] = useState("");
  const [openCustomerQuoteId, setOpenCustomerQuoteId] = useState<number | null>(null);
  const [pendingQuoteReference, setPendingQuoteReference] = useState<string | null>(null);
  const [quotesBusy, setQuotesBusy] = useState(false);
  const [quoteArchiveBusyId, setQuoteArchiveBusyId] = useState<number | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [portalView, setPortalView] = useState<PortalView>("dashboard");
  const [portalViewHistory, setPortalViewHistory] = useState<PortalView[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState({quotes:true,prices:true,shipments:true,campaigns:false});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationPrefsReady, setNotificationPrefsReady] = useState(false);
  const [helpQuery, setHelpQuery] = useState("");
  const [openHelpQuestion, setOpenHelpQuestion] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({name:"",company:"",phone:"",address:"",tax_office:"",tax_number:""});
  const [otpCode, setOtpCode] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const otpInputRef = useRef<RNTextInput>(null);
  const [otpSeconds, setOtpSeconds] = useState(600);
  const [otpPurpose, setOtpPurpose] = useState<"register" | "login">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminNotice, setAdminNotice] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushCategory, setPushCategory] = useState<"quotes"|"prices"|"shipments"|"campaigns">("campaigns");
  const [quoteForm, setQuoteForm] = useState({name:"",company:"",phone:"",email:"",city:"",deliveryArea:"",deliveryDistrict:"",product:"Binder Tabakası",tonnage:"",note:""});
  const [quotePlant, setQuotePlant] = useState<"sultangazi"|"silivri">("sultangazi");
  const [quoteProductTonnages, setQuoteProductTonnages] = useState<Record<string,string>>({"Binder Tabakası":""});
  const [quoteStep, setQuoteStep] = useState(1);
  const [tekDetailTab,setTekDetailTab]=useState<"description"|"usage">("description");
  const [readySection,setReadySection]=useState<string>("application");
  const [togoDetailSections,setTogoDetailSections]=useState<string[]>(["application"]);
  const [deliveryMenu, setDeliveryMenu] = useState<"area"|"district"|null>(null);
  const [drawerSectionOpen, setDrawerSectionOpen] = useState<"corporate"|"plants"|"togo"|null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [pricePlant, setPricePlant] = useState<"sultangazi" | "silivri">("sultangazi");
  const [priceBasket, setPriceBasket] = useState<Record<string, string>>({});
  const [truckCapacity, setTruckCapacity] = useState("25");
  const [quoteSuccess, setQuoteSuccess] = useState("");
  const [quotePhotos, setQuotePhotos] = useState<QuotePhoto[]>([]);
  const [locationBusy, setLocationBusy] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const pageProgress = useRef(new Animated.Value(1)).current;
  const pageDirection = useRef(1);
  const bitumenPulse = useRef(new Animated.Value(0)).current;
  const weatherFloat = useRef(new Animated.Value(0)).current;
  const currencyShift = useRef(new Animated.Value(0)).current;
  const notificationBell = useRef(new Animated.Value(0)).current;
  const drawerQuotePulse = useRef(new Animated.Value(0)).current;
  const lidarSweep = useRef(new Animated.Value(0)).current;
  const capacityCounter = useRef(new Animated.Value(0)).current;
  const productionScroll = useRef<ScrollView>(null);
  const productCollectionScroll = useRef<ScrollView>(null);
  const tekProductDetailScroll = useRef<ScrollView>(null);
  const togoProductDetailScroll = useRef<ScrollView>(null);
  const lastProductSelection = useRef<{kind:"togo";id:ProductId}|{kind:"tek";id:TekProductId}|null>(null);
  const productCollectionScrollY = useRef(0);
  const productDetailScrollY = useRef<Record<string,number>>({});
  const pendingProductScrollRestore = useRef(false);
  const plantOffsets = useRef<number[]>([]);

  const auditAppEvent = async (event: string, status = "", metadata: Record<string, string | number | boolean> = {}) => {
    if (!customerToken || !isLoggedIn) return;
    try {
      await customerPost("/events", {
        event,
        status,
        screen: tab,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version || "",
        device: [Device.manufacturer, Device.modelName].filter(Boolean).join(" "),
        metadata,
      }, customerToken);
    } catch {
      // Denetim kaydı ana kullanıcı akışını engellemez.
    }
  };

  useEffect(() => {
    trackScreen(tab);
  }, [tab]);

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.timing(lidarSweep, { toValue: 1, duration: 1850, easing: Easing.linear, useNativeDriver: true }),
    );
    scanAnimation.start();
    return () => scanAnimation.stop();
  }, [lidarSweep]);

  useEffect(() => {
    pageProgress.setValue(0);
    Animated.timing(pageProgress, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tab, selectedProduct, selectedTekProduct, pageProgress]);

  useEffect(() => {
    const loadPreferences = async () => {
      const saved = Platform.OS === "web" ? globalThis.localStorage?.getItem("tek_notification_preferences") : await SecureStore.getItemAsync("tek_notification_preferences");
      if (saved) setNotificationPrefs(current=>({...current,...JSON.parse(saved)}));
      setNotificationPrefsReady(true);
    };
    void loadPreferences().catch(()=>setNotificationPrefsReady(true));
  }, []);

  useEffect(() => {
    if (!notificationPrefsReady) return;
    const serialized=JSON.stringify(notificationPrefs);
    if (Platform.OS === "web") globalThis.localStorage?.setItem("tek_notification_preferences",serialized);
    else void SecureStore.setItemAsync("tek_notification_preferences",serialized);
    if (customerToken) void customerPost("/notification-preferences", notificationPrefs, customerToken).catch(()=>undefined);
  }, [notificationPrefs,notificationPrefsReady,customerToken]);

  useEffect(() => {
    const bitumenAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bitumenPulse, { toValue: 1, duration: 1250, useNativeDriver: true }),
        Animated.timing(bitumenPulse, { toValue: 0, duration: 1250, useNativeDriver: true }),
      ]),
    );
    const weatherAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(weatherFloat, { toValue: 1, duration: 1700, useNativeDriver: true }),
        Animated.timing(weatherFloat, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ]),
    );
    const currencyAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(currencyShift, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(currencyShift, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    bitumenAnimation.start();
    weatherAnimation.start();
    currencyAnimation.start();
    return () => {
      bitumenAnimation.stop();
      weatherAnimation.stop();
      currencyAnimation.stop();
    };
  }, [bitumenPulse, currencyShift, weatherFloat]);

  useEffect(() => {
    if (Platform.OS !== "ios" || !TekArScanner.available) return;
    void TekArScanner.isSupported().then((support) => {
      setTogoArSupport(support);
      trackEvent("togo_ar_capability", {
        supported: support.supported ? 1 : 0,
        lidar_supported: support.lidarSupported ? 1 : 0,
        device: Device.modelName || "unknown",
      });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(6000),
        Animated.timing(notificationBell, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(notificationBell, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(notificationBell, { toValue: .7, duration: 80, useNativeDriver: true }),
        Animated.timing(notificationBell, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [notificationBell]);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drawerQuotePulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(drawerQuotePulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drawerQuotePulse]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const protectionKey = "tek-asfalt-screen-protection";
    if (customerProfile?.is_admin) {
      void ScreenCapture.allowScreenCaptureAsync(protectionKey).catch(() => undefined);
      return;
    }
    void ScreenCapture.preventScreenCaptureAsync(protectionKey).catch(() => undefined);
    return () => {
      void ScreenCapture.allowScreenCaptureAsync(protectionKey).catch(() => undefined);
    };
  }, [customerProfile?.is_admin]);

  useEffect(() => {
    drawerProgress.stopAnimation();
    Animated.timing(drawerProgress, {
      toValue: drawerOpen ? 1 : 0,
      duration: 600,
      easing: Easing.bezier(.4, 0, .2, 1),
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, drawerProgress]);

  useEffect(() => {
    readCustomerToken().then(async (token) => {
      if (!token) return;
      try {
        const result = await customerGet("/me", token);
        setCustomerToken(token);
        setCustomerProfile(result.user);
        setAuthName(result.user.name || "");
        setAuthCompany(result.user.company || "");
        setAuthPhone(result.user.phone || "");
        setAuthEmail(result.user.email || "");
        setProfileDraft({name:result.user.name||"",company:result.user.company||"",phone:result.user.phone||"",address:result.user.address||"",tax_office:result.user.tax_office||"",tax_number:result.user.tax_number||""});
        setIsLoggedIn(true);
        identifyAnalyticsUser(result.user.id);
      } catch {
        await clearCustomerToken();
      }
    });
  }, []);

  useEffect(() => {
    const receiveUrl = (url: string | null) => {
      if (!url) return;
      const match = url.match(/(?:quote\/|reference=)(TA-[A-Z0-9-]+)/i);
      if (match?.[1]) setPendingQuoteReference(match[1].toUpperCase());
    };
    void Linking.getInitialURL().then(receiveUrl);
    const subscription = Linking.addEventListener("url", event => receiveUrl(event.url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pendingQuoteReference || !isLoggedIn) return;
    setTab("portal");
    setPortalView("orders");
    setQuoteReferenceQuery(pendingQuoteReference);
  }, [pendingQuoteReference, isLoggedIn]);

  useEffect(() => {
    if (!pendingQuoteReference || !customerQuotes.length) return;
    const quote = customerQuotes.find(item => item.reference.toUpperCase() === pendingQuoteReference);
    if (quote) setOpenCustomerQuoteId(quote.id);
  }, [pendingQuoteReference, customerQuotes]);

  useEffect(() => {
    if (!customerToken || !isLoggedIn) { setCustomerDocuments([]); return; }
    let active = true;
    void customerGet("/documents", customerToken)
      .then(result => { if (active) setCustomerDocuments(Array.isArray(result.documents) ? result.documents : []); })
      .catch(() => { if (active) setCustomerDocuments([]); });
    return () => { active = false; };
  }, [customerToken, isLoggedIn]);

  const refreshCustomerQuotes = async () => {
    if (!customerToken || !isLoggedIn) { setCustomerQuotes([]); return; }
    setQuotesBusy(true);
    try {
      const result = await customerGet("/quotes", customerToken);
      setCustomerQuotes(Array.isArray(result.quotes) ? result.quotes : []);
    } catch {
      setCustomerQuotes([]);
    } finally {
      setQuotesBusy(false);
    }
  };

  const archiveCustomerQuote = (quote: CustomerQuote) => {
    if (!customerToken || quoteArchiveBusyId !== null) return;
    Alert.alert(
      "Teklifi arşivle",
      `${quote.reference} referanslı talep aktif listenizden kaldırılır. Kayıt silinmez; arşiv işlemi ve uygulamaya dönüş bağlantısı kayıtlı e-posta adresinize gönderilir.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Arşive al",
          style: "destructive",
          onPress: async () => {
            setQuoteArchiveBusyId(quote.id);
            try {
              await customerPost(`/quotes/${quote.id}/archive`, {
                reference: quote.reference,
                notify_by_email: true,
                deep_link: `tekasfalt://quote/${quote.reference}`,
              }, customerToken);
              await refreshCustomerQuotes();
              Alert.alert("Arşive alındı", "Teklif kaydı korundu. Arşiv kaydı ve uygulamaya dönüş bağlantısı e-posta adresinize gönderildi.");
            } catch (error) {
              Alert.alert("Arşivlenemedi", error instanceof Error ? error.message : "Teklif arşivlenemedi. Kayıt korunmuştur.");
            } finally {
              setQuoteArchiveBusyId(null);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!customerToken || !isLoggedIn) { setCustomerQuotes([]); return; }
    void refreshCustomerQuotes();
  }, [customerToken, isLoggedIn]);

  useEffect(() => {
    const key = "tek_app_language";
    const loadLanguage = async () => {
      const saved = Platform.OS === "web" ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
      if (saved === "tr" || saved === "en" || saved === "de" || saved === "ar") {
        setAppLanguage(saved);
      }
      // Do not present two native controllers during launch. The language
      // picker remains available from menu/profile/settings after the app is
      // interactive, while the single welcome controller is shown here.
      setWelcomeOpen(true);
    };
    void loadLanguage();
  }, []);
  const chooseLanguage = (choice:"tr"|"en"|"de"|"ar") => {
    setAppLanguage(choice); setLanguageChoiceOpen(false);
    const key = "tek_app_language";
    if (Platform.OS === "web") globalThis.localStorage?.setItem(key,choice);
    else void SecureStore.setItemAsync(key,choice);
  };
  const languageLabel = ({tr:"Türkçe",en:"English",de:"Deutsch",ar:"العربية"} as const)[appLanguage];
  const ui = {
    tr:{explore:"Keşfet",solutions:"Çözümler",quote:"Teklif",calculator:"Hesaplama",language:"Dil tercihi"},
    en:{explore:"Explore",solutions:"Solutions",quote:"Quote",calculator:"Calculator",language:"Language"},
    de:{explore:"Entdecken",solutions:"Lösungen",quote:"Angebot",calculator:"Rechner",language:"Sprache"},
    ar:{explore:"استكشاف",solutions:"الحلول",quote:"عرض سعر",calculator:"الحساب",language:"اللغة"},
  }[appLanguage];
  setRuntimeLanguage(appLanguage);
  useEffect(() => {
    // RTL takes effect immediately for explicit direction-aware rows; iOS will
    // fully mirror the native layout after the next application restart.
    I18nManager.allowRTL(appLanguage === "ar");
  }, [appLanguage]);

  useEffect(() => {
    if (tab !== "quote" || !isLoggedIn) return;
    setQuoteForm((current) => {
      const next = {
        ...current,
        name: current.name || customerProfile?.name || authName,
        company: current.company || customerProfile?.company || authCompany,
        phone: current.phone || customerProfile?.phone || authPhone,
        email: current.email || customerProfile?.email || authEmail,
      };
      if (
        next.name === current.name &&
        next.company === current.company &&
        next.phone === current.phone &&
        next.email === current.email
      ) return current;
      return next;
    });
  }, [tab, isLoggedIn, customerProfile?.name, customerProfile?.company, customerProfile?.phone, customerProfile?.email, authName, authCompany, authPhone, authEmail]);

  useEffect(() => {
    if (!customerToken || !isLoggedIn || Platform.OS === "web" || !Device.isDevice) return;
    let active = true;
    void (async () => {
      try {
        if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", { name: "Tek Asfalt", importance: Notifications.AndroidImportance.HIGH });
        let permission = await Notifications.getPermissionsAsync();
        if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
        await auditAppEvent("permission_notifications", permission.status);
        if (permission.status !== "granted" || !active) return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        if (active) {
          await customerPost("/push-token", { token: pushToken.data }, customerToken);
          await auditAppEvent("push_token_registered", "success");
        }
      } catch {
        // Bildirim kaydı uygulamanın diğer işlevlerini engellememeli.
      }
    })();
    return () => { active = false; };
  }, [customerToken, isLoggedIn]);

  useEffect(() => {
    if (!REMOTE_DESIGN_SETTINGS_ENABLED) {
      setDesignSettings({});
      return;
    }
    fetch(`${CUSTOMER_API}/design-settings`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        if (payload?.settings && typeof payload.settings === "object") setDesignSettings(payload.settings);
      })
      .catch(() => undefined);
  }, []);

  const sendEmailCode = async (purpose: "register" | "login") => {
    if (!authEmail.includes("@")) {
      setAuthError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (purpose === "register" && !/^5\d{9}$/.test(formatTurkishMobile(authPhone).replace(/\D/g,""))) {
      setAuthError("Cep telefonu 5XX XXX XX XX biçiminde olmalıdır.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    // Doğrulama ekranını e-posta sağlayıcısının yanıtını bekletmeden aç.
    // Gönderim arka planda tamamlanır; böylece kullanıcı hemen kodu girebilir.
    setOtpPurpose(purpose);
    setOtpCode("");
    setOtpSeconds(600);
    setAuthMode("otp");
    try {
      if (purpose === "register") {
        await customerPost("/register", {
          name: authName.trim(),
          company: authCompany.trim(),
          phone: normalizeTurkishMobile(authPhone),
          email: authEmail.trim().toLowerCase(),
        });
      } else {
        await customerPost("/request-otp", {
          email: authEmail.trim().toLowerCase(),
          purpose,
        });
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Kod gönderilemedi.");
    } finally {
      setAuthBusy(false);
    }
  };

  useEffect(() => {
    if (authMode !== "otp" || otpSeconds <= 0) return;
    const timer = setInterval(() => setOtpSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [authMode, otpSeconds > 0]);

  const otpTime = `${String(Math.floor(otpSeconds / 60)).padStart(2, "0")}:${String(otpSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (authMode === "otp") {
      const timer = setTimeout(() => otpInputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [authMode]);

  const verifyEmailCode = async () => {
    if (otpCode.length !== 6 || otpSeconds <= 0) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const result = await customerPost("/verify-otp", {
        email: authEmail.trim().toLowerCase(),
        code: otpCode,
        purpose: otpPurpose,
      });
      await saveCustomerToken(result.token);
      setCustomerToken(result.token);
      setCustomerProfile(result.user);
      setProfileDraft({name:result.user.name||"",company:result.user.company||"",phone:result.user.phone||"",address:result.user.address||"",tax_office:result.user.tax_office||"",tax_number:result.user.tax_number||""});
      setAuthName(result.user.name || authName);
      setAuthCompany(result.user.company || authCompany);
      setAuthPhone(result.user.phone || authPhone);
      setIsLoggedIn(true);
      identifyAnalyticsUser(result.user.id);
      trackEvent(otpPurpose === "register" ? "sign_up" : "login", {
        method: "email_otp",
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Kod doğrulanamadı.");
    } finally {
      setAuthBusy(false);
    }
  };

  const pickProfileImage = async () => {
    if (!customerToken) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthError("Profil fotoğrafı seçmek için fotoğraf izni gereklidir.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.65, base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setProfileBusy(true);
    try {
      const updated = await customerPost("/profile", {
        name: customerProfile?.name || authName,
        company: customerProfile?.company || authCompany,
        phone: customerProfile?.phone || authPhone,
        avatar_base64: result.assets[0].base64,
        avatar_mime: result.assets[0].mimeType || "image/jpeg",
      }, customerToken);
      setCustomerProfile(updated.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Profil resmi yüklenemedi.");
    } finally {
      setProfileBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!customerToken) return;
    setProfileBusy(true); setAuthError("");
    try {
      const updated = await customerPost("/profile", profileDraft, customerToken);
      setCustomerProfile(updated.user); setProfileEditing(false);
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Profil güncellenemedi."); }
    finally { setProfileBusy(false); }
  };

  const uploadAdminPricePdf = async () => {
    if (!customerToken || !customerProfile?.is_admin) return;
    setAdminNotice(""); setAuthError("");
    const picked = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    if ((asset.size || 0) > 8 * 1024 * 1024) { setAuthError("Fiyat listesi PDF’i en fazla 8 MB olabilir."); return; }
    setAdminBusy(true);
    try {
      const pdfBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const response = await customerPost("/admin/upload-price", { pdf_base64: pdfBase64, filename: asset.name || `fiyat-listesi-${Date.now()}.pdf` }, customerToken);
      setAdminNotice(`Fiyat listesi yayınlandı${response.updated_at ? ` · ${response.updated_at}` : ""}.`);
      trackEvent("admin_price_upload");
    } catch (error) { setAuthError(error instanceof Error ? error.message : "PDF yüklenemedi."); }
    finally { setAdminBusy(false); }
  };

  const sendAdminPush = async () => {
    if (!customerToken || !customerProfile?.is_admin) return;
    if (pushTitle.trim().length < 3 || pushMessage.trim().length < 3) { setAuthError("Bildirim başlığı ve mesajı en az 3 karakter olmalıdır."); return; }
    setAdminBusy(true); setAdminNotice(""); setAuthError("");
    try {
      const response = await customerPost("/admin/push", { title: pushTitle.trim(), message: pushMessage.trim(), category: pushCategory }, customerToken);
      setAdminNotice(`Bildirim ${response.sent || 0} kayıtlı cihaza gönderildi.`);
      setPushTitle(""); setPushMessage("");
      trackEvent("admin_push_sent", { recipients: Number(response.sent || 0) });
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Bildirim gönderilemedi."); }
    finally { setAdminBusy(false); }
  };

  const logoutCustomer = async () => {
    await clearCustomerToken();
    setCustomerToken("");
    setCustomerProfile(null);
    setIsLoggedIn(false);
    setAuthMode("login");
    identifyAnalyticsUser(null);
    trackEvent("logout");
  };
  const submitQuote = async () => {
    const requiredFields = [[quoteForm.name,"Ad Soyad"],[quoteForm.company,"Firma adı"],[quoteForm.phone,"Telefon"],[quoteForm.email,"E-posta"]];
    const missing = requiredFields.find(([value])=>!value.trim());
    if (missing) { setAuthError(`${missing[1]} zorunludur.`); return; }
    if (!quoteForm.email.includes("@")) { setAuthError("Geçerli bir e-posta adresi girin."); return; }
    if (quoteForm.phone.replace(/\D/g,"").length < 10) { setAuthError("Geçerli bir telefon numarası girin."); return; }
    setQuoteBusy(true); setQuoteSuccess(""); setAuthError("");
    const serviceSummary = PROJECT_SERVICES.filter((service) => calcServices.includes(service.id)).map((service) => service.title).join(", ");
    const preliminaryItems = Object.entries(quoteProductTonnages).map(([product, rawTonnage])=>{
      const tonnage=Number(rawTonnage.replace(",", "."))||0;
      const unitPrice=preliminaryUnitPrice(product,quotePlant);
      return {product,tonnage,unitPrice,lineTotal:tonnage*unitPrice};
    });
    const preliminarySubtotal=preliminaryItems.reduce((sum,item)=>sum+item.lineTotal,0);
    try {
      const preparedPhotos = await Promise.all(quotePhotos.map(async (photo) => {
        const optimized = await prepareWebQuoteImage(photo.uri);
        return optimized ? {...photo,...optimized,name:photo.name.replace(/\.[^.]+$/, ".jpg")} : photo;
      }));
      const totalPhotoBytes = preparedPhotos.reduce((total, photo)=>total + Math.ceil(photo.base64.length * .75), 0);
      if (totalPhotoBytes > 7 * 1024 * 1024) throw new Error("Eklenen görsellerin toplam boyutu çok yüksek. Lütfen daha küçük görseller seçin.");
      const photoPayload = preparedPhotos.reduce<Record<string,string>>((payload, photo, index) => ({...payload,[`photo_${index+1}_base64`]:photo.base64,[`photo_${index+1}_mime`]:photo.mime,[`photo_${index+1}_name`]:photo.name}),{});
      const response = await customerPost("/quote-request", {
        ...quoteForm,
        tonnage:preliminaryItems.reduce((sum,item)=>sum+item.tonnage,0).toFixed(2),
        plant:quotePlant,
        preliminaryItems,
        preliminarySubtotal,
        ...photoPayload,
        note:[quoteForm.note,serviceSummary?`Opsiyonel saha işleri: ${serviceSummary}.`:""].filter(Boolean).join("\n")
      }, customerToken || undefined);
      setQuoteSuccess(response.message || "Teklif talebiniz başarıyla alındı.");
      // Keep the confirmed state visible briefly before returning to a new form.
      await new Promise<void>((resolve) => setTimeout(resolve, 900));
      setQuotePhotos([]);
      setQuoteStep(1);
      setCalcServices([]);
      setQuotePlant("sultangazi");
      setQuoteProductTonnages({"Binder Tabakası":""});
      setDeliveryMenu(null);
      setQuoteForm({
        name: customerProfile?.name || authName || "",
        company: customerProfile?.company || authCompany || "",
        phone: customerProfile?.phone || authPhone || "",
        email: customerProfile?.email || authEmail || "",
        city:"", deliveryArea:"", deliveryDistrict:"", product:"Binder Tabakası", tonnage:"", note:"",
      });
      await auditAppEvent("quote_submitted", "success", {reference:response.reference||"",photo_count:quotePhotos.length}); await refreshCustomerQuotes(); trackEvent("generate_lead", {product:quoteForm.product,tonnage:Number(quoteForm.tonnage)||0,services_count:calcServices.length,photo_count:quotePhotos.length});
    }
    catch (error) { setAuthError(error instanceof Error ? error.message : "Teklif talebi gönderilemedi."); }
    finally { setQuoteBusy(false); }
  };
  const explainPermission = (title: string, message: string) => new Promise<boolean>((resolve) => {
    if (Platform.OS === "web") { resolve(globalThis.confirm ? globalThis.confirm(`${title}\n\n${message}`) : true); return; }
    Alert.alert(title, message, [
      { text: "Şimdi değil", style: "cancel", onPress: () => resolve(false) },
      { text: "Devam et", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
  const addQuotePhoto = async (camera: boolean) => {
    if (quotePhotos.length >= 3) { setAuthError("En fazla 3 saha görseli ekleyebilirsiniz."); return; }
    const approved = await explainPermission(camera ? "Kamera erişimi" : "Fotoğraf erişimi", camera ? "Saha durumunu teklif talebine eklemek için kamerayı yalnızca siz bu düğmeye dokunduğunuzda kullanacağız." : "Seçtiğiniz saha fotoğraflarını teklif talebine eklemek için fotoğraf arşivine erişeceğiz.");
    if (!approved) { await auditAppEvent(camera ? "permission_camera" : "permission_photos", "not_requested"); return; }
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    await auditAppEvent(camera ? "permission_camera" : "permission_photos", permission.status);
    if (!permission.granted) { setAuthError(camera ? "Fotoğraf çekmek için kamera izni gereklidir." : "Görsel eklemek için fotoğraf izni gereklidir."); return; }
    const picker = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({mediaTypes:["images"],allowsEditing:false,quality:.48,base64:true});
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    try {
      const webImage = await prepareWebQuoteImage(asset.uri);
      const base64 = webImage?.base64 || asset.base64!;
      const estimatedBytes = Math.ceil(base64.length * .75);
      if (estimatedBytes > 3 * 1024 * 1024) { setAuthError("Seçilen görsel 3 MB sınırını aşıyor. Lütfen daha küçük bir görsel seçin."); return; }
      setAuthError("");
      setQuotePhotos((current)=>[...current,{uri:webImage?.uri||asset.uri,base64,mime:webImage?.mime||asset.mimeType||"image/jpeg",name:asset.fileName?.replace(/\.[^.]+$/, ".jpg")||`saha-${Date.now()}.jpg`}]);
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Görsel hazırlanamadı."); }
  };
  const startTogoScan = async () => {
    if (!togoSafetyAccepted) {
      Alert.alert("Güvenlik onayı gerekli", "Aktif trafikten uzakta olduğunuzu ve çevrenizi kontrol ettiğinizi onaylayın.");
      return;
    }
    const approved = await explainPermission(
      "Kamera ile çukur tarama",
      "Çukurun yaklaşık metrajını çıkarmak için kamerayı açacağız. Fotoğraf yalnızca bu hesaplama ekranında kullanılır; siz teklif oluşturmadıkça gönderilmez.",
    );
    if (!approved) return;
    setTogoScanBusy(true);
    await auditAppEvent("togo_ar_scan", "starting", { device: Device.modelName || "unknown", os: String(Device.osVersion || "unknown") });
    try {
      if (Platform.OS !== "ios") {
        throw new Error(
          Platform.OS === "web"
            ? "Profesyonel çukur algılama yalnızca LiDAR destekli iPhone/iPad üzerindeki uygulamada çalışır."
            : "AR ölçümü şu anda iPhone ve iPad uygulamasında kullanılabilir.",
        );
      }
      if (!TekArScanner.available) {
        throw new Error("AR tarayıcı bu kurulumun içinde bulunmuyor. Yeni TestFlight sürümünü yükledikten sonra yeniden deneyin.");
      }
      // İlk ekran açılışındaki varsayılan `false` değerine güvenmeyiz. Kullanıcı
      // düğmeye bastığı anda ARKit kabiliyetini yeniden sorgulamak, yeni cihazlarda
      // oluşan yarış durumunu ve yanlış “desteklenmiyor” uyarısını önler.
      const currentSupport = await TekArScanner.isSupported();
      setTogoArSupport(currentSupport);
      if (!currentSupport.supported) {
        throw new Error("Bu cihaz ARKit dünya takibini başlatamıyor. Kamera iznini ve iOS ayarlarını kontrol edin.");
      }
      const permission = await TekArScanner.requestCameraPermission();
      await auditAppEvent("permission_camera", permission.status, { feature: "togo_scan", source: "native_avfoundation" });
      if (!permission.granted) {
        Alert.alert(
          "Kamera erişimi gerekli",
          "AR ölçümü için iPhone Ayarları’nda Tek Asfalt uygulamasının kamera erişimini açın.",
          [
            { text: "Vazgeç", style: "cancel" },
            { text: "Ayarları aç", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (Platform.OS === "ios" && TekArScanner.available && currentSupport.supported) {
        trackEvent("togo_ar_scan_started", {
          method: currentSupport.lidarSupported ? "arkit_lidar" : "arkit_world_tracking",
          device: Device.modelName || "unknown",
        });
        const scan = await TekArScanner.scanPothole();
        setTogoNativeScan(scan);
        setTogoLength(scan.lengthCm.toFixed(0));
        setTogoWidth(scan.widthCm.toFixed(0));
        setTogoDepth(scan.depthCm.toFixed(1));
        setTogoCalculated(true);
        setTogoScanStage("result");
        trackEvent("togo_ar_scan_completed", {
          method: scan.method,
          buckets: scan.buckets,
          confidence: scan.confidence,
          duration_ms: scan.durationMs,
        });
        await auditAppEvent("togo_ar_scan", "success", {
          method: scan.method,
          buckets: scan.buckets,
          confidence: scan.confidence,
          device: Device.modelName || "unknown",
        });
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kamera açılamadı.";
      await auditAppEvent("togo_ar_scan", "failed", { reason: message.slice(0,180), device: Device.modelName || "unknown", os: String(Device.osVersion || "unknown") });
      if (!message.toLocaleLowerCase("tr").includes("iptal")) {
        trackEvent("togo_ar_scan_failed", { reason: message.slice(0, 80) });
        Alert.alert("Tarama başlatılamadı", message);
      }
    } finally {
      setTogoScanBusy(false);
    }
  };

  const startStockpileScan = async () => {
    if (!togoSafetyAccepted) {
      Alert.alert("Güvenlik onayı gerekli", "Stok taramasını yalnızca yaya olarak, sabit zemin üzerinde ve hareket eden makinelerden uzakta başlatın.");
      return;
    }
    setStockpileScanBusy(true);
    try {
      if (Platform.OS !== "ios" || !TekArScanner.available) {
        throw new Error("Stok taraması yalnızca build 34 ve ARKit destekli iPhone/iPad uygulamasında kullanılabilir.");
      }
      const diagnostics = await TekArScanner.diagnostics();
      if (!diagnostics.supported) throw new Error(diagnostics.reason || "Bu cihaz ARKit dünya takibini desteklemiyor.");
      if (!diagnostics.meshSupported) throw new Error(diagnostics.reason || "Stok taraması LiDAR mesh destekli bir iPhone veya iPad gerektirir.");
      const permission = await TekArScanner.requestCameraPermission();
      if (!permission.granted) {
        Alert.alert("Kamera erişimi gerekli", "Stok taraması için iPhone Ayarları’ndan Tek Asfalt uygulamasının kamera erişimini açın.", [
          { text: "Vazgeç", style: "cancel" },
          { text: "Ayarları aç", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      const capture = await TekArScanner.scanStockpile();
      setStockpileCapture(capture);
      await auditAppEvent("stockpile_ar_capture", "success", {
        coverage: capture.coverageScore,
        mesh_anchors: capture.meshAnchorCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stok taraması başlatılamadı.";
      if (!message.toLocaleLowerCase("tr").includes("iptal")) Alert.alert("Stok taraması başlatılamadı", message);
      await auditAppEvent("stockpile_ar_capture", "failed", { reason: message.slice(0, 180) });
    } finally {
      setStockpileScanBusy(false);
    }
  };
  const applyTogoPreset = (preset: "small" | "medium" | "large") => {
    const values = preset === "small" ? [40, 40, 4] : preset === "medium" ? [80, 60, 5] : [120, 90, 7];
    setTogoLength(String(values[0]));
    setTogoWidth(String(values[1]));
    setTogoDepth(String(values[2]));
    setTogoCalculated(true);
    setTogoNativeScan(null);
    setTogoScanStage("result");
    trackEvent("togo_scan_estimated", { preset, buckets: Math.ceil((values[0] * values[1] / 10000) * (values[2] / 100) * 2200 * 1.15 / 25) });
  };
  const useCurrentProjectLocation = async () => {
    const approved = await explainPermission("Konum erişimi", "Proje adresini hızlı doldurmak için konumunuz yalnızca bu işlem sırasında kullanılacak. Koordinatlar analiz kayıtlarına eklenmez.");
    if (!approved) { await auditAppEvent("permission_location", "not_requested"); return; }
    setLocationBusy(true); setAuthError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      await auditAppEvent("permission_location", permission.status);
      if (permission.status !== "granted") { setAuthError("Konum izni verilmedi. Adresi elle girebilirsiniz."); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const addresses = await Location.reverseGeocodeAsync(position.coords);
      const address = addresses[0];
      const formatted = [address?.district, address?.subregion, address?.city, address?.region].filter(Boolean).filter((item,index,array)=>array.indexOf(item)===index).join(" / ");
      if (formatted) setQuoteForm(current=>({...current,city:formatted}));
      else setAuthError("Konum alındı ancak adres çözümlenemedi. Adresi elle girebilirsiniz.");
    } catch { setAuthError("Konum şu anda alınamadı. Adresi elle girebilirsiniz."); }
    finally { setLocationBusy(false); }
  };
  const toggleCalcService = (id: string) =>
    setCalcServices((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const toggleQuoteProduct = (product: string) => {
    setQuoteForm(current=>{
      const selected=current.product.split(", ").filter(Boolean);
      const next=selected.includes(product)?selected.filter(item=>item!==product):[...selected,product];
      return {...current,product:next.join(", ")};
    });
    setQuoteProductTonnages(current=>{
      const next={...current};
      if (product in next) delete next[product];
      else next[product]="";
      return next;
    });
  };
  const moveCalculationToQuote = () => {
    const services = PROJECT_SERVICES.filter((service) => calcServices.includes(service.id)).map((service) => service.title);
    const capacity = Math.max(1, Number(calcTruckCapacity.replace(",", ".")) || 25);
    const requiredTrucks = result ? Math.ceil(result / capacity) : 0;
    setQuoteForm((current) => ({
      ...current,
      name: current.name || customerProfile?.name || authName,
      company: current.company || customerProfile?.company || authCompany,
      phone: current.phone || customerProfile?.phone || authPhone,
      email: current.email || customerProfile?.email || authEmail,
      city: current.city,
      product: calcProduct,
      tonnage: result ? result.toFixed(2) : "",
      note: [
        result ? `${length} m x ${width} m x ${height} cm proje metrajı.` : "",
        result ? `Ortalama araç yükü ${capacity.toLocaleString("tr-TR")} ton; tahmini ${requiredTrucks.toLocaleString("tr-TR")} araç gerekir.` : "",
        services.length ? `Talep edilen opsiyonlar: ${services.join(", ")}.` : "Yalnızca asfalt malzemesi talebi.",
      ].filter(Boolean).join(" "),
    }));
    trackEvent("asphalt_calculation", {
      product: calcProduct,
      tonnage: Number(result?.toFixed(2) || 0),
      area_m2: Number(calculatedArea.toFixed(2)),
      services_count: calcServices.length,
      estimated_trucks: requiredTrucks,
    });
    navigateTab("quote");
  };

  useEffect(() => {
    if (tab !== "production" || productionTarget === null) return;
    const timer = setTimeout(() => {
      productionScroll.current?.scrollTo({ y: 0, animated: false });
    }, 40);
    return () => clearTimeout(timer);
  }, [tab, productionTarget]);

  useEffect(() => {
    if (tab !== "production") return;
    const target = Number.parseInt(PLANTS[productionTarget ?? 0].capacity, 10) || 0;
    capacityCounter.stopAnimation();
    capacityCounter.setValue(0);
    setCapacityDisplay(0);
    const listener = capacityCounter.addListener(({value}) => setCapacityDisplay(Math.round(value)));
    Animated.timing(capacityCounter, {toValue:target,duration:1050,useNativeDriver:false}).start();
    return () => capacityCounter.removeListener(listener);
  }, [capacityCounter, productionTarget, tab]);

  const navigateTab = (next: Tab) => {
    if (!isLoggedIn && ["calculator", "quote", "togo"].includes(next)) {
      setAuthMode("login");
      setPortalView("dashboard");
      setWelcomeOpen(false);
      Alert.alert("Müşteri girişi gerekli", "Hesaplama, AR ölçüm ve teklif işlemleri kayıtlı müşterilere özeldir.");
      next = "portal";
    }
    if (next === tab) return;
    pageDirection.current = SWIPE_TABS.indexOf(next) >= SWIPE_TABS.indexOf(tab) ? 1 : -1;
    setTabHistory((history) => [...history.slice(-8), tab]);
    if (next === "products" && lastProductSelection.current) {
      pendingProductScrollRestore.current = true;
      if (lastProductSelection.current.kind === "togo") {
        setSelectedTekProduct(null);
        setSelectedProduct(lastProductSelection.current.id);
      } else {
        setSelectedProduct(null);
        setSelectedTekProduct(lastProductSelection.current.id);
      }
    } else {
      setSelectedProduct(null);
      setSelectedTekProduct(null);
    }
    setTab(next);
  };
  const openPortalView = (view: PortalView) => {
    setPortalViewHistory([]);
    setPortalView(view);
    navigateTab("portal");
    setDrawerOpen(false);
  };
  const navigatePortalView = (view: PortalView) => {
    if (view === portalView) return;
    setPortalViewHistory((history) => [...history.slice(-8), portalView]);
    setPortalView(view);
  };
  const drawerNavigate = (next: Tab) => {
    navigateTab(next);
    setDrawerOpen(false);
  };
  const openInfo = (section: InfoSection) => {
    setInfoSection(section);
    setTab("info");
    setDrawerOpen(false);
  };
  const goBack = () => {
    if (selectedTekProduct) {
      setSelectedTekProduct(null);
      return;
    }
    if (selectedProduct) {
      setSelectedProduct(null);
      return;
    }
    setTabHistory((history) => {
      if (!history.length) { setTab("home"); return history; }
      setTab(history[history.length - 1]);
      return history.slice(0, -1);
    });
  };
  const goBackFromPortalView = () => {
    if (portalViewHistory.length) {
      const previousView = portalViewHistory[portalViewHistory.length - 1];
      setPortalViewHistory((history) => history.slice(0, -1));
      setPortalView(previousView);
      return;
    }
    setPortalView("dashboard");
    goBack();
  };
  const backSwipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 34 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.65,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 84 && gesture.vx > 0.08 && (selectedProduct || selectedTekProduct)) {
            pageDirection.current = -1;
            goBack();
            return;
          }
          const currentIndex = SWIPE_TABS.indexOf(tab);
          if (gesture.dx < -84 && gesture.vx < -0.08 && currentIndex < SWIPE_TABS.length - 1) {
            navigateTab(SWIPE_TABS[currentIndex + 1]);
          } else if (gesture.dx > 84 && gesture.vx > 0.08 && currentIndex > 0) {
            navigateTab(SWIPE_TABS[currentIndex - 1]);
          }
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [selectedProduct, selectedTekProduct, tab, tabHistory],
  );
  const productCarouselSwipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.35,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 42) return;
      setShowcaseActive(current => (current + (gesture.dx < 0 ? 1 : -1) + PRODUCT_SHOWCASE_ITEMS.length) % PRODUCT_SHOWCASE_ITEMS.length);
    },
  }), []);

  useEffect(() => {
    const date = new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Istanbul"});
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,weather_code,is_day,relative_humidity_2m,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&forecast_hours=12&timezone=Europe%2FIstanbul",
    )
      .then((r) => r.json())
      .then((w) => {
        setMarket((current) => ({
          ...current,
          weather: `${Math.round(w.current.temperature_2m)}°`,
          condition: weatherName(w.current.weather_code),
          weatherCode: Number(w.current.weather_code),
          isDay: w.current.is_day === 1,
        }));
        setWeatherForecast((w.daily?.time || []).map((forecastDate: string, index: number) => ({date:forecastDate,code:Number(w.daily.weather_code[index]),high:Math.round(w.daily.temperature_2m_max[index]),low:Math.round(w.daily.temperature_2m_min[index]),rain:Number(w.daily.precipitation_probability_max[index] || 0)})));
        setWeatherHourly((w.hourly?.time || []).slice(0, 8).map((time: string, index: number) => ({ time, temperature: Math.round(w.hourly.temperature_2m[index]), code: Number(w.hourly.weather_code[index]) })));
        setWeatherDetails({ wind: `${Math.round(w.current.wind_speed_10m)} km/sa`, pressure: `${Math.round(w.current.surface_pressure)} hPa`, humidity: `%${Math.round(w.current.relative_humidity_2m)}` });
      })
      .catch(() => undefined);
    Promise.all([
      fetch("https://api.frankfurter.dev/v2/rate/EUR/TRY").then((r) => r.json()),
      fetch("https://api.frankfurter.dev/v2/rate/USD/TRY").then((r) => r.json()),
    ])
      .then(([eurRate, usdRate]) => {
        const eur = Number(eurRate.rate);
        const usd = Number(usdRate.rate);
        setMarket((current) => ({
          ...current,
          eur: eur.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          usd: usd.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        }));
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const date = yesterday.toISOString().slice(0,10);
        return Promise.all([
          fetch(`https://api.frankfurter.dev/v2/rate/EUR/TRY?date=${date}`).then(r=>r.json()),
          fetch(`https://api.frankfurter.dev/v2/rate/USD/TRY?date=${date}`).then(r=>r.json()),
        ]).then(([oldEurRate,oldUsdRate])=>{
          const oldEur=Number(oldEurRate.rate); const oldUsd=Number(oldUsdRate.rate);
          setMarket(current=>({...current,eurChange:oldEur ? ((eur-oldEur)/oldEur)*100 : 0,usdChange:oldUsd ? ((usd-oldUsd)/oldUsd)*100 : 0}));
        });
      })
      .catch(() => undefined);
    const applyBitumen = (rate: number, fromDate?: string, suppliedTrend?: "up" | "down" | "flat", suppliedPrevious?: number, vatRate = 1) => {
      setMarket((current) => {
        const displayedPrevious = Number(current.bitumen.replace(/\./g, "").replace(",", ".")) || rate;
        const previous = suppliedPrevious || displayedPrevious || rate;
        const trend = suppliedTrend || (rate > previous ? "up" : rate < previous ? "down" : "flat");
        return {
          ...current,
          bitumen: Number(rate).toLocaleString("tr-TR", { maximumFractionDigits: 0 }),
          bitumenGross: Number(rate * (1 + vatRate / 100)).toLocaleString("tr-TR", {minimumFractionDigits:2,maximumFractionDigits:2}),
          bitumenDate: fromDate ? new Date(fromDate).toLocaleDateString("tr-TR") : "Tüpraş / İzmit",
          bitumenTrend: trend,
          bitumenPrevious: previous !== rate ? Number(previous).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) : undefined,
          bitumenPreviousDate: previous !== rate ? current.bitumenDate : undefined,
          bitumenLive: true,
          bitumenVat: Number.isFinite(vatRate) ? vatRate : 1,
        };
      });
    };
    fetch(`https://www.tupras.com.tr/getbitum.json?date=${date}`)
      .then((r) => r.json())
      .then((prices) => {
        const bitumen = prices.find(
          (x: { MaterialDesc: string; SalesOrgId: number }) =>
            x.MaterialDesc === "BİTÜM 50/70" && x.SalesOrgId === 1200,
        );
        if (!bitumen) return;
        applyBitumen(Number(bitumen.Rate), bitumen.FromDate, undefined, undefined, Number(String(bitumen.VAT ?? "1").trim()));
      })
      .catch(() => fetch(`${CUSTOMER_API}/market`)
        .then((r) => { if (!r.ok) throw new Error("market proxy unavailable"); return r.json(); })
        .then((data) => {
          if (data.date && new Date(data.date).getTime() < new Date("2026-07-30").getTime()) return;
          applyBitumen(Number(data.rate), data.date, data.trend, Number(data.previous_rate || 0), Number(data.vat ?? 1));
        })
        .catch(() => undefined));
  }, []);

  const result = useMemo(
    () =>
      (Number(length) || 0) *
      (Number(width) || 0) *
      ((Number(height) || 0) / 100) *
      2.4,
    [length, width, height],
  );
  const calculatedArea = (Number(length) || 0) * (Number(width) || 0);
  const calculatedVolume = calculatedArea * ((Number(height) || 0) / 100);
  const priceRates: Record<string, number> = {"Binder Tabakası":2453,"Aşınma Tip-1":2606,"Bitümlü Temel":2362,"Poroz Asfalt":2534};
  const togoResult = useMemo(() => {
    const result = togoNativeScan
      ? calculateAsphaltRequirement({
          surfaceAreaSquareMeters: togoNativeScan.surfaceAreaSquareMeters,
          volumeCubicMeters: togoNativeScan.volumeCubicMeters,
        })
      : calculateManualAsphaltRequirement({
          lengthCentimeters: Number(togoLength) || 0,
          widthCentimeters: Number(togoWidth) || 0,
          averageDepthCentimeters: Number(togoDepth) || 0,
        });
    return { area: result.surfaceAreaSquareMeters, volume: result.volumeCubicMeters, netKg: result.netKilograms, kg: result.kilograms, buckets: result.buckets };
  }, [togoLength, togoWidth, togoDepth, togoNativeScan]);
  const bitumenCurrentValue = Number(market.bitumen.replace(/\./g, "").replace(",", ".")) || 0;
  const bitumenPreviousValue = Number((market.bitumenPrevious || market.bitumen).replace(/\./g, "").replace(",", ".")) || bitumenCurrentValue;
  const bitumenChangePercent = bitumenPreviousValue ? ((bitumenCurrentValue - bitumenPreviousValue) / bitumenPreviousValue) * 100 : 0;

  const homePageHeight = Math.max(720, windowHeight);
  const ModernHome = () => (
    <View style={[s.modernShell, {backgroundColor: appTheme.canvas}]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.modernScroll}
      >
      <View style={[s.modernHero, s.homeSnapPage, {height:homePageHeight}]}>
          <HomeHeroVideo />
          <LinearGradient
            colors={["rgba(5,20,48,.18)", "rgba(5,20,48,.02)", "rgba(5,20,48,.82)"]}
            locations={[0, .43, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["transparent", "rgba(5,20,48,.92)"]}
            style={s.modernHeroBottomFade}
            pointerEvents="none"
          />
          <View pointerEvents="none" style={s.entryModel}><EntryModel style={StyleSheet.absoluteFillObject}/></View>
          <View style={s.modernTopbar}>
            <View style={s.modernTopActions}>
              <Pressable onPress={() => setNotificationsOpen(true)} style={[s.modernRoundButton,s.modernNotificationButton]} accessibilityLabel="Bildirimler">
                <Animated.View style={{transform:[{rotate:notificationBell.interpolate({inputRange:[-1,0,1],outputRange:["-12deg","0deg","12deg"]})}]}}><Ionicons name="notifications-outline" size={22} color="#E74022" /></Animated.View>
                <View style={s.modernNotificationDot} />
              </Pressable>
              <Pressable onPress={() => setDrawerOpen(true)} style={[s.modernRoundButton,s.modernMenuButton]} accessibilityLabel="Menü">
                <HamburgerIcon progress={drawerProgress} open={drawerOpen} color={C.white}/>
              </Pressable>
            </View>
          </View>

          <View style={s.marketGlassWrap}>
            <HorizontalBorderBeam/>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.marketGlassRail}>
              <Pressable onPress={()=>setMarketDetail("bitumen")} style={s.marketGlassCard} accessibilityLabel="Bitüm fiyat ayrıntıları">
                <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill}/>
                <View style={s.marketGlassIcon}><Ionicons name="water-outline" size={20} color={C.orange}/></View>
                <View style={s.marketGlassCopy}><Text style={s.marketGlassLabel}>BİTÜM 50/70</Text><View style={s.marketGlassValueRow}><Text style={s.marketGlassValue}>{bitumenVatIncluded?market.bitumenGross:market.bitumen} ₺</Text><Ionicons name={market.bitumenTrend==="down"?"trending-down":"trending-up"} size={15} color={market.bitumenTrend==="down"?"#7CE0A8":"#FF9B86"}/></View><Text style={s.marketGlassMeta}>{bitumenVatIncluded?"KDV DAHİL":"KDV HARİÇ"} · Dokun, ayrıntıyı gör</Text></View><Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,.72)"/>
              </Pressable>
              <Pressable onPress={()=>setMarketDetail("weather")} style={s.marketGlassCard} accessibilityLabel="On günlük hava durumu">
                <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill}/>
                <View style={s.marketGlassIcon}><Ionicons name={weatherIonicon(market.weatherCode,market.isDay) as any} size={20} color={C.orange}/></View>
                <View style={s.marketGlassCopy}><Text style={s.marketGlassLabel}>İSTANBUL · BUGÜN</Text><Text style={s.marketGlassValue}>{market.weather} <Text style={s.marketGlassCondition}>{market.condition}</Text></Text><Text style={s.marketGlassMeta}>10 günlük tahmin için dokun</Text></View><Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,.72)"/>
              </Pressable>
              <Pressable onPress={()=>setMarketDetail("currency")} style={s.marketGlassCard} accessibilityLabel="Döviz ayrıntıları">
                <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill}/>
                <View style={s.marketGlassIcon}><Ionicons name="swap-horizontal-outline" size={21} color={C.orange}/></View>
                <View style={s.marketGlassCopy}><Text style={s.marketGlassLabel}>DÖVİZ · TRY</Text><Text style={s.marketGlassValue}>€ {market.eur}</Text><Text style={s.marketGlassMeta}>$ {market.usd} · Günlük referans</Text></View><Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,.72)"/>
              </Pressable>
            </ScrollView>
          </View>
        </View>

        <View style={s.homeNewIntro}>
          <View style={s.homeNewIntroTop}><Text style={s.homeNewKicker}>HOŞ GELDİNİZ</Text><Image source={require("./assets/brand/tek-logo-30y.png")} style={s.homeNewAnniversaryLogo} resizeMode="contain"/></View>
          <Text style={s.homeNewTitle}>Güvenilir üretim,{`\n`}kalıcı çözümler.</Text>
          <Text style={s.homeNewBody}>30 yılı aşkın deneyimimizle sektörde güvenilir ve öncü bir firma olarak hizmet veriyoruz. Modern teknoloji ve uzman kadromuzla İstanbul’un Sultangazi ve Silivri bölgelerindeki üretim tesislerimizde yüksek kaliteli çözümler sunuyoruz.</Text>
          <Text style={s.homeNewBodySecondary}>Teknik bilgi birikimimiz ve modern ekipmanlarımızla kamu ve özel sektör projelerinde doğru malzeme seçimi ve uygulama disipliniyle çalışıyoruz. Disiplin, teknik deneyim ve hassasiyetle geliştirdiğimiz altyapımız; projelerinizde güvenilir çözüm ortağınız olmayı sağlar.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.homeNewValues}>{[[require("./assets/brand/tse-logo.png"),"TSE EN 13108-1","Türk Standartlarına uygun"],[require("./assets/certifications/iso-ccpl.png"),"ISO 9001:2015","Kalite yönetim sertifikalı"],[require("./assets/brand/ce-logo.png"),"CE","Avrupa standartlarına uygun"],[require("./assets/brand/yerli-uretim.png"),"Yerli Üretim","Tamamen yerli üretim"],[require("./assets/brand/asfalt-to-go.png"),"ASFALT TO GO®","Tescilli ürün markamız"]].map(([source,title,text])=><Pressable key={title as string} onPress={()=>openInfo("quality")} style={s.homeNewValue}><Image source={source as any} style={s.homeNewValueMark} resizeMode="contain"/><Text style={s.homeNewValueTitle}>{title}</Text><Text style={s.homeNewValueText}>{text}</Text></Pressable>)}</ScrollView>
        </View>

        <View style={s.homeCapacitySection}>
          <ManagedMedia defaultSource={require("./assets/home/production-capacity.mov")} defaultType="video" fit="cover" style={s.homeCapacityImage}/><LinearGradient colors={["rgba(8,20,43,.18)","rgba(8,20,43,.94)"]} style={StyleSheet.absoluteFill}/>
          <View style={s.homeCapacityCopy}><Text style={s.homeNewKicker}>ÜRETİM ALTYAPISI</Text><Text style={s.homeCapacityTitle}>Projenin temposuna{`\n`}uygun kapasite.</Text><Text style={s.homeCapacityBody}>Sultangazi, Silivri ve Plent Miks tesisleriyle planlı üretim ve kesintisiz tedarik.</Text></View>
          <View style={s.homeCapacityGrid}>{[["340","Sultangazi · t/s"],["200","Silivri · t/s"],["300","Plent Miks · t/s"]].map(([value,label])=><View key={label} style={s.homeCapacityMetric}><Text style={s.homeCapacityValue}>{value}</Text><Text style={s.homeCapacityLabel}>{label}</Text></View>)}</View>
          <Pressable onPress={()=>navigateTab("production")} style={s.homeCapacityLink}><Text style={s.homeCapacityLinkText}>Tesisleri incele</Text><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
        </View>

        <View style={s.homeSolutionSection}>
          <Text style={[s.homeNewKicker,{paddingHorizontal:22}]}>PROJEYE ÖZEL ÇÖZÜMLER</Text><Text style={s.homeSolutionTitle}>Doğru karışım,{`\n`}doğru uygulama.</Text><Text style={s.homeSolutionIntro}>Trafik yükü, iklim, drenaj ve kullanım amacına göre ürün ve uygulama yaklaşımını birlikte belirliyoruz.</Text>
          <ScrollView horizontal pagingEnabled snapToInterval={windowWidth-44} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={s.homeSolutionRail}>
            {[["Sessiz asfalt","Yerleşim bölgelerinde düşük yol-lastik gürültüsü","volume-mute-outline",require("./assets/products/catalog/sessiz-asfalt-optimized-app-poster.jpg")],["Taş mastik asfalt","Yoğun trafik için yüksek dayanım","layers-outline",require("./assets/products/catalog/tas-mastik-asfalt-app.jpg")],["Poröz asfalt","Yüzey suyunu uzaklaştıran geçirgen yapı","water-outline",require("./assets/products/catalog/poroz-asfalt-optimized-app-poster.jpg")],["Modifiye asfalt","Zorlu koşullara karşı performans","shield-checkmark-outline",require("./assets/products/catalog/modifiye-asfalt-app.jpg")]].map(([title,text,icon,image],index)=><Pressable key={title} onPress={()=>navigateTab("products")} style={[s.homeSolutionCard,{width:windowWidth-44,minHeight:248}]}><Image source={image as any} style={s.homeSolutionMedia} resizeMode="cover"/><LinearGradient colors={["rgba(7,19,44,.04)","rgba(7,19,44,.92)"]} style={StyleSheet.absoluteFill}/><Text style={s.homeSolutionNo}>0{index+1}</Text><View style={s.homeSolutionIcon}><Ionicons name={icon as any} size={22} color={C.orange}/></View><Text style={s.homeSolutionCardTitle}>{title}</Text><Text style={s.homeSolutionCardText}>{text}</Text><View style={s.homeSolutionLink}><Text style={s.homeSolutionLinkText}>Çözümü incele</Text><Ionicons name="arrow-forward" size={17} color={C.white}/></View></Pressable>)}
          </ScrollView>
        </View>

        <View style={s.homeProcessSection}>
          <Text style={s.homeProcessKicker}>TEKNİK DESTEK</Text><Text style={s.homeProcessTitle}>Keşiften teslimata{`\n`}tek teknik hat.</Text>
          {[['01','Keşif ve metraj','Saha ihtiyacını, miktarı ve uygulama koşullarını netleştiririz.'],['02','Karışım ve planlama','Reçete, üretim programı ve lojistik akışı projeye göre planlanır.'],['03','Üretim ve uygulama','Kontrollü üretim, sevkiyat, serim ve sıkıştırma aynı koordinasyonda yürür.'],['04','Kalite doğrulaması','Laboratuvar ve saha kontrolleriyle süreç kayıt altına alınır.']].map(([no,title,text],index)=><View key={no} style={s.homeProcessRow}><View style={s.homeProcessNo}><Text style={s.homeProcessNoText}>{no}</Text></View><View style={s.homeProcessCopy}><Text style={s.homeProcessRowTitle}>{title}</Text><Text style={s.homeProcessRowText}>{text}</Text></View>{index<3&&<View style={s.homeProcessLine}/>}</View>)}
          <Pressable onPress={()=>navigateTab("quote")} style={s.homeProcessCta}><Text style={s.homeProcessCtaText}>Projeniz için teklif alın</Text><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
        </View>

        <View style={s.homeReferencesSection}><Text style={s.homeNewKicker}>REFERANSLARIMIZ</Text><Text style={s.homeReferencesTitle}>En iyi referans,{`\n`}memnun müşteridir.</Text><Text style={s.homeReferencesText}>Birlikte başarılı şekilde çalıştığımız ve iş birliğini sürdürdüğümüz kamu kurumları ile özel sektör şirketleri, güvene dayalı ilişkilerimizin göstergesidir.</Text><ReferenceLogoMarquee logos={TEK_REFERENCE_ASSETS}/></View>
      </ScrollView>
      <Modal visible={marketDetail!==null} transparent animationType="fade" onRequestClose={()=>setMarketDetail(null)}>
        <View style={s.marketDetailBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setMarketDetail(null)}/><View style={s.marketDetailSheet}>
          <View style={s.marketDetailHandle}/><View style={s.marketDetailHead}><View><Text style={s.marketDetailKicker}>{marketDetail==="bitumen"?"BİTÜM PİYASASI":marketDetail==="weather"?"İSTANBUL HAVA DURUMU":"DÖVİZ TAKİBİ"}</Text><Text style={s.marketDetailTitle}>{marketDetail==="bitumen"?"Fiyat hareketi":marketDetail==="weather"?"10 günlük görünüm":"Günlük kur özeti"}</Text></View><Pressable onPress={()=>setMarketDetail(null)} style={s.marketDetailClose}><Ionicons name="close" size={19} color={C.navy}/></Pressable></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.marketDetailContent}>
          {marketDetail==="bitumen"&&<><View style={s.bitumenFinanceCard}><View style={s.bitumenFinanceHead}><View style={s.bitumenFinanceFlame}><Ionicons name="flame" size={23} color="#FFAB32"/></View><View><Text style={s.bitumenFinanceCode}>BİTÜM 50/70</Text><Text style={s.bitumenFinanceName}>Güncel tesis fiyatı</Text></View><View style={s.bitumenFinanceTrendPill}><Ionicons name={bitumenChangePercent>=0?"trending-up":"trending-down"} size={13} color={bitumenChangePercent>=0?"#FFB09C":"#63E0A4"}/><Text style={s.bitumenFinanceTrendText}>%{Math.abs(bitumenChangePercent).toFixed(2)}</Text></View></View><Text style={s.bitumenFinanceTime}>SON GÜNCELLEME · {market.bitumenDate}</Text><Text style={s.bitumenFinanceValue}>{bitumenVatIncluded?market.bitumenGross:market.bitumen} ₺</Text><Text style={s.bitumenFinanceMeta}>Ton fiyatı · KDV %{market.bitumenVat} {bitumenVatIncluded?"dahil":"hariç"}</Text><View style={s.bitumenFinanceCompare}><View><Text style={s.bitumenFinanceCompareLabel}>ÖNCEKİ KAYIT</Text><Text style={s.bitumenFinanceCompareValue}>{market.bitumenPrevious||market.bitumen} ₺</Text></View><View style={s.bitumenFinanceCompareLine}/><View><Text style={s.bitumenFinanceCompareLabel}>GÜNCEL KAYIT</Text><Text style={s.bitumenFinanceCompareValue}>{market.bitumen} ₺</Text></View></View></View><View style={s.bitumenVatToggle}><Pressable onPress={()=>setBitumenVatIncluded(false)} style={[s.bitumenVatOption,!bitumenVatIncluded&&s.bitumenVatOptionActive]}><Text style={[s.bitumenVatOptionText,!bitumenVatIncluded&&s.bitumenVatOptionTextActive]}>KDV HARİÇ</Text></Pressable><Pressable onPress={()=>setBitumenVatIncluded(true)} style={[s.bitumenVatOption,bitumenVatIncluded&&s.bitumenVatOptionActive]}><Text style={[s.bitumenVatOptionText,bitumenVatIncluded&&s.bitumenVatOptionTextActive]}>KDV DAHİL</Text></Pressable></View></>}
          {marketDetail==="weather"&&<><LinearGradient colors={["#4B83B5","#294D81","#172E59"]} style={s.weatherWidgetHero}><View style={s.weatherWidgetHeroTop}><View style={s.weatherWidgetLocation}><Ionicons name="location-outline" size={13} color="rgba(255,255,255,.88)"/><Text style={s.weatherWidgetLocationText}>İstanbul</Text></View><Text style={s.weatherWidgetUpdated}>Güncel</Text></View><View style={s.weatherWidgetNow}><View><Text style={s.weatherWidgetTemp}>{market.weather}</Text><Text style={s.weatherWidgetCondition}>{market.condition}</Text><Text style={s.weatherWidgetRange}>En yüksek {weatherForecast[0]?.high}° · En düşük {weatherForecast[0]?.low}°</Text></View><Ionicons name={weatherIonicon(market.weatherCode,market.isDay) as any} size={68} color="#FFD451"/></View><View style={s.weatherWidgetStats}>{[["speedometer-outline",weatherDetails.wind,"Rüzgar"],["compass-outline",weatherDetails.pressure,"Basınç"],["water-outline",weatherDetails.humidity,"Nem"]].map(([icon,value,label])=><View key={label} style={s.weatherWidgetStat}><Ionicons name={icon as any} size={15} color="#D9E9FF"/><Text style={s.weatherWidgetStatValue}>{value}</Text><Text style={s.weatherWidgetStatLabel}>{label}</Text></View>)}</View></LinearGradient><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weatherHourlyRail}>{weatherHourly.map((hour,index)=><View key={hour.time} style={[s.weatherHourlyCard,index===0&&s.weatherHourlyCardActive]}><Text style={s.weatherHourlyTime}>{index===0?"Şimdi":new Date(hour.time).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</Text><Ionicons name={weatherIonicon(hour.code,index<6?market.isDay:false) as any} size={25} color="#FFB328"/><Text style={s.weatherHourlyTemp}>{hour.temperature}°</Text></View>)}</ScrollView><View style={s.weatherDailyList}>{weatherForecast.map((day,index)=><View key={day.date} style={s.weatherDailyRow}><View><Text style={s.weatherDailyDate}>{new Date(`${day.date}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"long"})}</Text><Text style={s.weatherDailyDay}>{index===0?"bugün":index===1?"yarın":new Date(`${day.date}T12:00:00`).toLocaleDateString("tr-TR",{weekday:"long"})}</Text></View><Ionicons name={weatherIonicon(day.code,true) as any} size={26} color="#FFB328"/><View style={s.weatherDailyTemps}><Text style={s.weatherDailyHigh}>{day.high}°</Text><Text style={s.weatherDailyLow}>{day.low}°</Text></View></View>)}</View></>}
          {marketDetail==="currency"&&<><View style={s.currencyFinanceGrid}>{[["EUR","Euro",market.eur,market.eurChange||0,"€"],["USD","Amerikan Doları",market.usd,market.usdChange||0,"$"]].map(([code,name,value,change,symbol])=><View key={code as string} style={s.currencyFinanceCard}><View style={s.currencyFinanceHead}><View style={s.currencyFinanceMark}><Text style={s.currencyFinanceSymbol}>{symbol}</Text></View><View style={s.currencyFinanceIdentity}><Text style={s.currencyFinanceCode}>{code}</Text><Text style={s.currencyFinanceName}>{name}</Text></View></View><Text style={s.currencyFinanceTime}>SON GÜNCELLEME · GÜNLÜK REFERANS</Text><Text style={s.currencyFinanceValue}>{value} ₺</Text><Text style={[s.currencyFinanceTrend,Number(change)>=0?s.currencyFinanceTrendUp:s.currencyFinanceTrendDown]}>{Number(change)>=0?"▲":"▼"} %{Math.abs(Number(change)).toFixed(2)} <Text style={s.currencyFinanceChangeAmount}>bugün</Text></Text></View>)}</View><Text style={s.currencyDetailNote}>EUR/TRY ve USD/TRY değerleri, merkez bankalarının yayımladığı günlük referans kur verisinden alınır. Sözleşmelerde teklif tarihindeki resmi kur esas alınmalıdır.</Text></>}</ScrollView>
        </View></View>
      </Modal>

    </View>
  );

  const Home = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.page}
    >
      <View style={s.hero}>
        <Image
          source={require("./assets/hero-plant-mobile-app.jpg")}
          style={s.heroArt}
          resizeMode="contain"
        />
        <LinearGradient
          colors={[
            "rgba(7,18,43,.38)",
            "rgba(7,18,43,.12)",
            "rgba(7,18,43,.96)",
          ]}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.topbar}>
          <TekAsfaltLogo style={s.logo} />
          <IconButton name="menu-outline" onPress={() => setDrawerOpen(true)} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dataTicker} contentContainerStyle={s.dataTickerInner}>
          <View style={s.dataTickerItem}><Ionicons name="water" size={13} color={C.orange} /><Text style={s.dataTickerLabel}>BİTÜM 50/70</Text><Text style={s.dataTickerValue}>{market.bitumen} ₺</Text><View style={[s.bitumenTrendBadge,market.bitumenTrend==="up"?s.bitumenTrendUp:market.bitumenTrend==="down"?s.bitumenTrendDown:s.bitumenTrendFlat]}><Ionicons name={market.bitumenTrend==="up"?"arrow-up":market.bitumenTrend==="down"?"arrow-down":"remove"} size={10} color={C.white}/></View></View>
          <View style={s.dataTickerDivider} />
          <View style={s.dataTickerItem}><Ionicons name={weatherIonicon(market.weatherCode,market.isDay).replace("-outline","") as any} size={13} color={C.orange} /><Text style={s.dataTickerLabel}>İSTANBUL</Text><Text style={s.dataTickerValue}>{market.weather}</Text></View>
          <View style={s.dataTickerDivider} />
          <View style={s.dataTickerItem}><Text style={s.dataTickerSymbol}>$</Text><Text style={s.dataTickerValue}>{market.usd}</Text><Text style={s.dataTickerSymbol}>€</Text><Text style={s.dataTickerValue}>{market.eur}</Text></View>
          <Text style={s.dataTickerUpdated}>{market.bitumenLive?"Tüpraş canlı":"Son doğrulanan"} · {market.bitumenDate}</Text>
        </ScrollView>
        <View style={s.heroCopy}>
          <View style={s.pill}>
            <View style={s.liveDot} />
            <Text style={s.pillText}>30 YILDIR YOLUN ÖNCÜSÜ</Text>
          </View>
          <Text style={s.heroTitle}>
            Geleceğe giden{`\n`}yolu{" "}
            <Text style={s.orange}>biz yapıyoruz.</Text>
          </Text>
          <Text style={s.heroText}>
            Üretimden uygulamaya, İstanbul’un en güçlü asfalt çözüm ortağı.
          </Text>
          <View style={s.heroActions}>
            <Pressable onPress={() => navigateTab("calculator")} style={s.cta}>
              <Text style={s.ctaText}>Proje hesapla</Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </Pressable>
            <Pressable onPress={() => navigateTab("togo")} style={s.heroSecondary}><Ionicons name="cube-outline" size={19} color={C.white} /><Text style={s.heroSecondaryText}>Ürünler</Text></Pressable>
          </View>
          <View style={s.heroUtilityRow}>
            <Pressable onPress={() => Linking.openURL("https://wa.link/292g2p")} style={s.heroUtility}><Ionicons name="logo-whatsapp" size={16} color="#48D985" /><Text style={s.heroUtilityText}>WhatsApp’tan teklif al</Text></Pressable>
            <Pressable onPress={() => navigateTab("portal")} style={s.heroUtility}><Ionicons name="person-circle-outline" size={16} color={C.orange} /><Text style={s.heroUtilityText}>Müşteri portalı</Text></Pressable>
          </View>
        </View>
      </View>

      <View style={s.actionHub}>
        <Text style={s.actionHubKicker}>PROJENİZ İÇİN TEK NOKTA</Text>
        <Text style={s.actionHubTitle}>Metrajı çıkarın,{`\n`}doğrudan teklif alın.</Text>
        <View style={s.actionHubGrid}>
          {[
            {title:"Proje Hesaplama",meta:"Tonaj ve hizmet kapsamı",icon:"calculator-outline",tab:"calculator" as Tab},
            {title:"Asfalt Ürünleri",meta:"Teknik detay ve kullanım",icon:"layers-outline",tab:"togo" as Tab},
            {title:"Üretim Tesisleri",meta:"Kapasite ve lokasyon",icon:"business-outline",tab:"production" as Tab},
            {title:"Müşteri Portalı",meta:"Fiyat, belge ve teklifler",icon:"shield-checkmark-outline",tab:"portal" as Tab},
          ].map(item=><Pressable key={item.title} onPress={()=>navigateTab(item.tab)} style={s.actionHubCard}><View style={s.actionHubIcon}><Ionicons name={item.icon as any} size={22} color={C.orange}/></View><Text style={s.actionHubCardTitle}>{item.title}</Text><Text style={s.actionHubCardMeta}>{item.meta}</Text><Ionicons name="arrow-forward" size={15} color={C.navy}/></Pressable>)}
        </View>
      </View>

      <View style={s.aboutSection}>
        <Text style={s.eyebrowDark}>TEK ASFALT</Text>
        <Text style={s.aboutTitle}>Optimum, kalıcı çözümler.</Text>
        <Text style={s.aboutText}>
          Teknik bilgi birikimimiz ve modern ekipmanlarımız sayesinde kamu ve
          özel sektör projelerinde üstün başarıyla çalışıyor, doğru malzeme
          seçimi ve uygulamaları ile sektörde fark oluşturuyoruz. Kısa sürede
          zenginleşen referans listemizle sektöre yön veren bir firma olarak
          optimum kalıcı çözümler sunmayı hedefliyoruz.
        </Text>
        <Text style={s.aboutText}>
          Disiplin, teknik deneyim ve hassasiyetle geliştirdiğimiz altyapımız,
          projelerinizde güvenilir bir çözüm ortağı olmamızı sağlamaktadır.
          Firmamıza olan güveniniz için teşekkür eder, birlikte başarılı
          projelere imza atmayı dileriz.
        </Text>
        <View style={s.valuesRow}>
          <View style={s.valueCard}>
            <Ionicons name="navigate" size={24} color={C.orange} />
            <Text style={s.valueTitle}>Misyonumuz</Text>
            <Text style={s.valueText}>
              Yüksek kaliteli asfalt çözümleriyle altyapı projelerine değer
              katmak ve çevreye duyarlı hizmetlerle beklentileri aşmak.
            </Text>
          </View>
          <View style={[s.valueCard, s.valueCardOrange]}>
            <Ionicons name="eye" size={24} color={C.white} />
            <Text style={[s.valueTitle, s.valueTitleWhite]}>Vizyonumuz</Text>
            <Text style={[s.valueText, s.valueTextWhite]}>
              Yenilikçi, sürdürülebilir ve çevre dostu üretimle sektörün
              güvenilir lider markası olmak.
            </Text>
          </View>
        </View>
      </View>

      <View style={s.story}>
        <Text style={s.eyebrow}>1996 — 2026</Text>
        <Text style={s.storyTitle}>
          Aynı tutku.{`\n`}Daha güçlü <Text style={s.orange}>yarınlar.</Text>
        </Text>
        <Text style={s.storyBody}>
          İki üretim tesisi, yüksek kapasiteli makine parkı ve 30 yıllık saha
          deneyimiyle yolun her katmanında iz bırakıyoruz.
        </Text>
        <View style={s.numberRow}>
          <View>
            <Text style={s.bigNumber}>30+</Text>
            <Text style={s.numberLabel}>YILLIK DENEYİM</Text>
          </View>
          <View>
            <Text style={s.bigNumber}>02</Text>
            <Text style={s.numberLabel}>ÜRETİM TESİSİ</Text>
          </View>
          <View>
            <Text style={s.bigNumber}>7/24</Text>
            <Text style={s.numberLabel}>ÜRETİM</Text>
          </View>
        </View>
      </View>
      <View style={s.referencesSection}>
        <Text style={[s.eyebrowDark,{paddingHorizontal:22}]}>GÜVENLE TAMAMLANAN PROJELER</Text>
        <Text style={s.referencesTitle}>Referanslarımız.</Text>
        <Text style={s.referencesIntro}>En iyi referans, memnun müşterilerdir.{`\n`}Aşağıda, ortak bir anlayışla ve başarılı şekilde birlikte çalıştığımız bazı şirketleri görebilirsiniz. Ayrıca, halen iş birliği içinde olduğumuz kamu kurumları ve özel sektörle ilgili referanslarımız da yer almaktadır.</Text>
        <View style={s.referenceBrandHead}><TekAsfaltLogo style={s.referenceTekLogo}/><Text style={s.referenceCount}>{String(TEK_REFERENCE_ASSETS.length).padStart(2,"0")} REFERANS</Text></View>
        <ReferenceLogoMarquee logos={TEK_REFERENCE_ASSETS}/>
        <View style={s.referenceDivider}/>
        <View style={s.referenceBrandHead}><Image source={require("./assets/togo-logo.png")} resizeMode="contain" style={s.referenceTogoLogo}/><Text style={s.referenceCount}>{String(TOGO_REFERENCE_ASSETS.length).padStart(2,"0")} REFERANS</Text></View>
        <ReferenceLogoMarquee logos={TOGO_REFERENCE_ASSETS}/>
      </View>
      <View style={s.mediaSection}>
        <Text style={s.eyebrowDark}>30 YILLIK SERÜVEN</Text>
        <Text style={s.heading}>Bir yolun değil,{`\n`}bir dönemin izi.</Text>
        <Text style={s.timelineIntro}>
          Sahadaki ilk günden, İstanbul’un yüksek kapasiteli üretim ağına uzanan
          gelişim hikâyemiz.
        </Text>
        <View style={s.timeline}>
          {[
            {
              year: "1996",
              title: "İlk adım",
              text: "Teknik disiplin ve kalıcı çözüm anlayışıyla asfalt sektöründeki yolculuk başladı.",
              image: MEDIA.before,
            },
            {
              year: "2014",
              title: "Üretim gücü",
              text: "Modern ekipman, güçlü saha kadrosu ve kamu–özel sektör projeleriyle kapasite büyüdü.",
            },
            {
              year: "2020",
              title: "Asfalt To Go",
              text: "Profesyonel yol bakımını pratik ve erişilebilir hale getiren ürün ailesi doğdu.",
            },
            {
              year: "2026",
              title: "30. yıl — geleceğe hazır",
              text: "İki asfalt plenti, Plentmiks tesisi ve 820 ton/saat toplam nominal güç.",
              image: MEDIA.now,
            },
          ].map((milestone, index) => (
            <View key={milestone.year} style={s.timelineItem}>
              <View style={s.timelineRail}>
                <View
                  style={[s.timelineDot, index === 3 && s.timelineDotActive]}
                />
                {index < 3 && <View style={s.timelineLine} />}
              </View>
              <View style={s.timelineCard}>
                <Text style={s.timelineYear}>{milestone.year}</Text>
                <Text style={s.timelineTitle}>{milestone.title}</Text>
                <Text style={s.timelineText}>{milestone.text}</Text>
                {milestone.image && (
                  <Image
                    source={{ uri: milestone.image }}
                    style={s.timelineImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const Corporate = () => {
    const sections: Record<InfoSection,{kicker:string;title:string;intro:string;icon:string;items:Array<{title:string;text:string}>}> = {
      about:{kicker:"1996'DAN BUGÜNE",title:"Güvenilirlik ve deneyimle geleceğe yol açıyoruz.",intro:"1996 yılında kurulan TEK ASFALT®, asfalt sektöründe güvenilirliği ve kalitesiyle tanınan, sektörün öncü firmalarından biridir. 30 yıla yaklaşan tecrübesiyle kamu ve özel sektör projelerine yenilikçi ve sürdürülebilir çözümler sunar.",icon:"business-outline",items:[{title:"Üretim tesislerimiz ve kapasitemiz",text:"Sultangazi 340 ton/saat, Silivri 200 ton/saat ve Plentmiks 300 ton/saat kapasiteyle projeler için hızlı, kontrollü ve yüksek kaliteli üretim."},{title:"Ürün kalitesi ve sertifikalar",text:"TSE belgeli, ISO 9001:2015 sertifikalı, CE standartlarına uygun ve yerli üretim hassasiyetiyle hazırlanan çözümler."},{title:"ASFALT TO GO® ile ekstra çözümler",text:"Soğuk asfalt, emülsiyon ve asfalt yalıtım malzemesiyle saha ihtiyaçlarına pratik ürünler sunuyoruz."},{title:"Neden TEK ASFALT?",text:"Uzman ekip, modern teknoloji, yüksek kapasite, çevreye duyarlı yaklaşım ve müşteri memnuniyetini esas alan hizmet anlayışı."}]},
      activities:{kicker:"ÜRETİM VE TEDARİK",title:"Güçlü tesisler, planlı üretim.",intro:"Sultangazi ve Silivri tesislerimizle, kamu ve özel sektör projeleri için üretim, stoklama ve sevkiyat akışını tek merkezden planlıyoruz.",icon:"business-outline",items:[{title:"Bitümlü sıcak karışım asfalt",text:"Sultangazi tesisimiz 340 ton/saat, Silivri tesisimiz 200 ton/saat kapasiteyle ihtiyacınıza uygun BSK üretimi gerçekleştirir."},{title:"Plentmiks altyapı malzemesi",text:"Silivri Plentmiks tesisimiz, 300 ton/saat kapasitesiyle altyapı projeleri için standartlara uygun temel malzeme üretir."},{title:"Sıcak silo, nakliye ve teslimat",text:"Üretim, stoklama ve sevkiyat projenin zaman planına göre koordine edilir; malzeme sahaya doğru zamanda ulaştırılır."},{title:"ASFALT TO GO® üretimi",text:"25 kg kovalı soğuk asfalt, emülsiyon ve yalıtım ürünleriyle bakım ve onarım projelerine esnek tedarik sağlanır."}]},
      applications:{kicker:"ASFALT UYGULAMALARI",title:"Sahada doğru uygulama.",intro:"Karışım seçimi; trafik yükü, iklim, drenaj, gürültü ve kullanım amacına göre teknik ekibimizle birlikte belirlenir.",icon:"construct-outline",items:[{title:"Yol hazırlığı ve kazıma",text:"Mevcut kaplamanın frezelenmesi, zeminin hazırlanması ve yeni tabaka için doğru altyapının oluşturulması."},{title:"Serim ve sıkıştırma",text:"Finişerle homojen serim, kontrollü sıcaklık ve silindirlerle hedef sıkışma değerine ulaşan uygulama."},{title:"Özel asfalt çözümleri",text:"Sessiz asfalt, poröz asfalt, modifiye asfalt, taş mastik ve renkli asfaltla proje koşullarına göre performans."},{title:"Bakım ve onarım",text:"ASFALT TO GO® ürünleriyle çukur, derz, küçük yüzey hasarı ve yalıtım ihtiyaçlarına pratik saha çözümü."}]},
      laboratory:{kicker:"ASFALT LABORATUVARI",title:"Kalite ölçülür, sonra üretilir.",intro:"Agrega, bitüm, emülsiyon ve sıcak karışım kontrolleri; karışım tasarımından üretim doğrulamasına kadar laboratuvar disipliniyle yürütülür.",icon:"flask-outline",items:[{title:"Karışım tasarımı",text:"Marshall stabilite ve akma, ekstraksiyon, gradasyon, boşluk ve birim ağırlık kontrolleri."},{title:"Hammadde kontrolü",text:"Bitüm penetrasyonu ve yumuşama noktası; agrega özgül ağırlığı, elek analizi ve metilen mavisi deneyleri."},{title:"Ar-Ge ve saha doğrulaması",text:"Renkli, sessiz, poröz, modifiye ve taş mastik karışımların geliştirilmesi; karot ve sıkışma kontrolleri."}]},
      quality:{kicker:"KALİTE · İSG · ÇEVRE",title:"Standartlarla doğrulanan kalite.",intro:"Hammadde kabulünden sevkiyat ve saha sıkıştırmasına kadar ölçülen, kayıt altına alınan ve sürekli iyileştirilen süreç yönetimi.",icon:"shield-checkmark-outline",items:[{title:"Kalite güvencesi",text:"TSE EN 13108-1, ISO 9001:2015, CE uygunluğu ve yerli üretim yaklaşımıyla kontrollü üretim."},{title:"İş sağlığı ve güvenliği",text:"Çalışan, alt yüklenici ve ziyaretçiler için eğitim, risk değerlendirmesi ve mevzuata dayalı güvenli çalışma kültürü."},{title:"Çevresel sorumluluk",text:"Emisyon, atık ve kaynak kullanımının izlenmesi; temiz çalışma ortamı ve sürekli iyileştirme hedefleri."}]},
    };
    const content=sections[infoSection];
    const sectionMedia: Record<InfoSection, {type:"image"|"video";source:any;fit?:"cover"|"contain"}> = {
      // The former anniversary clip opens with a long black sequence.  The
      // asphalt-work film keeps this hero meaningful from its very first frame.
      about: {type:"video",source:require("./assets/corporate/new-30years-mobile.mp4"),fit:"cover"},
      activities: {type:"video",source:require("./assets/corporate/activities-mobile-app.mp4"),fit:"cover"},
      applications: {type:"video",source:require("./assets/corporate/applications-road-mobile-app.mp4"),fit:"cover"},
      laboratory: {type:"image",source:require("./assets/laboratory-app.jpg"),fit:"cover"},
      quality: {type:"video",source:require("./assets/corporate/quality-optimized-app.mp4"),fit:"cover"},
    };
    const heroMedia=sectionMedia[infoSection];
    const designKey = ({about:"about_hero",activities:"activities_hero",applications:"applications_hero",laboratory:"laboratory_hero",quality:"quality_hero"} as const)[infoSection];
    const heroDesign = designSettings[designKey];
    const corporateHeroHeight=Math.max(heroDesign?.height??0,462);
    return <ScrollView style={s.darkPage} contentContainerStyle={s.corporatePage} showsVerticalScrollIndicator={false}>
      <View style={[s.corporateHero,{height:corporateHeroHeight}]}>
        <ManagedMedia setting={heroDesign} defaultSource={heroMedia.source} defaultType={heroMedia.type} useSettingTransform={false} fit="cover" style={s.corporateHeroMedia}/>
        <LinearGradient colors={["rgba(8,18,39,.02)","rgba(8,18,39,.30)",C.navy]} locations={[0,.48,1]} style={StyleSheet.absoluteFill}/>
        <View style={s.corporateHeroCopy}>
          <View style={s.corporateIcon}><Ionicons name={content.icon as any} size={23} color={C.white}/></View>
          <Text style={s.eyebrow}>{content.kicker}</Text>
          <Text style={s.screenTitle}>{content.title}</Text>
          <Text style={s.corporateHeroIntro}>{content.intro}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.corporateTabs}>{(Object.keys(sections) as InfoSection[]).map(section=><Pressable key={section} onPress={()=>setInfoSection(section)} style={[s.corporateTab,infoSection===section&&s.corporateTabActive]}><Ionicons name={sections[section].icon as any} size={16} color={infoSection===section?C.white:"#93A1B8"}/><Text style={[s.corporateTabLabel,infoSection===section&&s.corporateTabLabelActive]}>{section==="about"?"Hakkımızda":section==="activities"?"Üretim":section==="applications"?"Uygulamalar":section==="laboratory"?"Laboratuvar":"Kalite"}</Text></Pressable>)}</ScrollView>
      <View style={s.corporateCards}>{content.items.map((item,index)=><View key={item.title} style={s.corporateCard}><Text style={s.corporateCardNo}>0{index+1}</Text><View style={s.corporateCardCopy}><Text style={s.corporateCardTitle}>{item.title}</Text><Text style={s.corporateCardText}>{item.text}</Text></View></View>)}</View>
      {infoSection==="quality"&&<><View style={s.certificateLedger}><Text style={s.certificateLedgerKicker}>KATALOGTA YER ALAN BELGE VE TESCİLLER</Text>{[["ribbon-outline","ISO 9001:2015","Kalite yönetim sistemi kapsamında üretim yaklaşımı"],["shield-checkmark-outline","CE belgesi","Asfalt üretim ve uygulaması · EUAC/CE/1002-2025"],["document-text-outline","TSE standartları","TS EN 13108-1 ve ASFALT TO GO® için TSE K 50"],["pricetag-outline","Marka tescili","ASFALT TO GO® tescilli ticari marka"]].map(([icon,title,text])=><View key={title} style={s.certificateLedgerRow}><View style={s.certificateLedgerIcon}><Ionicons name={icon as any} size={19} color={C.orange}/></View><View style={s.certificateLedgerCopy}><Text style={s.certificateLedgerTitle}>{title}</Text><Text style={s.certificateLedgerText}>{text}</Text></View></View>)}</View><Text style={s.certificateLedgerNote}>Belge numarası ve geçerlilik bilgileri katalogdaki kayıtlar esas alınarak düzenlenmiştir; güncel teyit için ilgili belge doğrulama kanalı kullanılmalıdır.</Text><View style={s.safetyVisual}><Image source={require("./assets/corporate/safety-helmet-app.jpg")} style={s.safetyVisualImage} resizeMode="cover"/><LinearGradient colors={["transparent","rgba(7,20,48,.92)"]} style={StyleSheet.absoluteFill}/><View style={s.safetyVisualCopy}><Text style={s.eyebrow}>İŞ SAĞLIĞI VE GÜVENLİĞİ</Text><Text style={s.safetyVisualTitle}>Sağlığını koru, işini koru.</Text></View></View></>}
      {infoSection==="laboratory"&&<View style={s.labEquipment}><Text style={s.quoteFieldLabel}>BAŞLICA LABORATUVAR ALTYAPISI</Text><Text style={s.labEquipmentText}>Marshall test cihazları · Bitüm penetrometresi · Ekstraktör · Elek ve etüv · Karot makinesi · Proctor/CBR · Hassas teraziler</Text></View>}
    </ScrollView>;
  };

  const Production = () => (
    <ScrollView
      ref={productionScroll}
      style={s.darkPage}
      contentContainerStyle={s.productionPage}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.productionHeader}>
        <View style={s.productionHeroMedia}>
          <ManagedMedia
            setting={designSettings[["plant_esenler", "plant_silivri", "plant_plentmiks"][productionTarget ?? 0]]}
                defaultSource={PLANTS[productionTarget ?? 0].heroVideo || (typeof PLANTS[productionTarget ?? 0].image === "string" ? {uri:PLANTS[productionTarget ?? 0].image} : PLANTS[productionTarget ?? 0].image)}
                defaultType={PLANTS[productionTarget ?? 0].heroVideo ? "video" : "image"}
                defaultX={0}
                defaultY={0}
                defaultScale={1}
                useSettingTransform={false}
                fit="cover"
                style={(productionTarget ?? 0) === 2
                  ? s.plentmiksHeroImage
                  : PLANTS[productionTarget ?? 0].heroVideo
                    ? [(productionTarget ?? 0) === 0 ? s.esenlerHeroMedia : s.silivriHeroMedia]
                    : undefined}
              />
        </View>
        <LinearGradient colors={["rgba(8,20,46,.12)","rgba(8,20,46,.58)",C.navy]} locations={[0,.58,1]} style={StyleSheet.absoluteFill}/>
        <View style={[s.productionTopControls, {top: insets.top + 86}]}>
          <View style={s.productionSwitcher}>
            {PLANTS.map((plant,index)=><Pressable key={plant.name} onPress={()=>{setProductionTarget(index);productionScroll.current?.scrollTo({y:0,animated:true});}} style={[s.productionSwitch,(productionTarget??0)===index&&s.productionSwitchActive]}><Text numberOfLines={1} style={[s.productionSwitchText,(productionTarget??0)===index&&s.productionSwitchTextActive]}>{plant.name.replace("Silivri Plentmiks","Plentmiks")}</Text></Pressable>)}
          </View>
        </View>
        <Text style={s.eyebrow}>
          ÜRETİM TESİSLERİ / 0{(productionTarget ?? 0) + 1}
        </Text>
        <Text style={s.screenTitle}>
          {PLANTS[productionTarget ?? 0].name}
          {`\n`}üretim tesisi.
        </Text>
        <Text style={s.screenIntro}>
          {PLANTS[productionTarget ?? 0].description}
        </Text>
        <View style={s.totalCapacity}>
          <Text style={s.totalCapacityValue}>
            {capacityDisplay}
          </Text>
          <View>
            <Text style={s.totalCapacityUnit}>TON / SAAT</Text>
            <Text style={s.totalCapacityLabel}>NOMİNAL ÜRETİM PERFORMANSI</Text>
          </View>
        </View>
      </View>
      {PLANTS.map((plant, index) => ({ plant, index }))
        .filter(({ index }) => index === (productionTarget ?? 0))
        .map(({ plant, index }) => (
          <View
            key={plant.name}
            style={s.plantCard}
            onLayout={(event) => {
              plantOffsets.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <View style={s.plantSummary}>
              <View style={s.plantNumber}>
                <Text style={s.plantNumberText}>0{index + 1}</Text>
              </View>
              <View style={s.plantSummaryCopy}>
                <Text style={s.plantSummaryTitle}>TESİS TEKNİK ÖZETİ</Text>
                <Text style={s.plantSummaryText}>{plant.description}</Text>
              </View>
            </View>
            <View style={s.plantSpecs}>
              {plantDetails(index).map((detail) => (
                <View key={detail.label} style={s.plantSpec}>
                  <View style={s.techIconWrap}>
                    {typeof detail.icon === "string" ? (
                      <SvgUri uri={detail.icon} width={34} height={34} />
                    ) : (
                      <Image source={detail.icon} resizeMode="contain" style={s.plantTechIcon} />
                    )}
                  </View>
                  <Text style={s.plantSpecValue}>{detail.value}</Text>
                  <Text style={s.plantSpecLabel}>{detail.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
    </ScrollView>
  );

  const openTekProduct = (id: TekProductId) => {
    if (tab !== "products") setTabHistory(history => [...history.slice(-8), tab]);
    lastProductSelection.current={kind:"tek",id};
    setSelectedTekProduct(id);
    setModelHintDismissed(false);
    setTab("products");
    setDrawerOpen(false);
    trackEvent("view_item", { item_id: id, item_category: "tek_asfalt" });
  };

  const TekProducts = () => {
    if(selectedProduct) return <ProductDetail id={selectedProduct}/>;
    const product = selectedTekProduct ? TEK_PRODUCTS.find(item => item.id === selectedTekProduct) : null;
    const tekModelUrl = product ? TEK_PRODUCT_PACDORA_URLS[product.id] : undefined;
    if(product) return <ScrollView
      ref={tekProductDetailScroll}
      key={`tek-detail-${product.id}`}
      style={s.readyDetailPage}
      contentContainerStyle={s.readyDetailInner}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!modelInteracting}
      pagingEnabled={false}
      scrollEventThrottle={16}
      onScroll={event=>{productDetailScrollY.current[`tek-${product.id}`]=event.nativeEvent.contentOffset.y;}}
      onLayout={()=>{
        if(!pendingProductScrollRestore.current)return;
        pendingProductScrollRestore.current=false;
        requestAnimationFrame(()=>tekProductDetailScroll.current?.scrollTo({y:productDetailScrollY.current[`tek-${product.id}`]||0,animated:false}));
      }}
    >
      <View style={[s.readyModelStage,{height:Math.max(620,windowHeight-86)}]}>
        {tekModelUrl
          ? <PacdoraViewer url={tekModelUrl} title={`${product.title} 3D ürün modeli`} onInteractionChange={active=>{setModelInteracting(active);if(active)setModelHintDismissed(true);}}/>
          : <TekProductMedia id={product.id} style={StyleSheet.absoluteFillObject}/>}
        <LinearGradient pointerEvents="none" colors={["transparent","rgba(244,243,239,.2)","#F4F3EF"]} style={s.modelStageTransition}/>
        {tekModelUrl && !modelHintDismissed&&<View pointerEvents="none" style={s.model360StageCenter}><LottieView source={require("./assets/animations/360-view.json")} autoPlay loop style={s.model360Animation}/></View>}
        {tekModelUrl && <View style={s.modelStageActions}><Pressable accessibilityLabel={`${product.title} detayları`} onPress={()=>tekProductDetailScroll.current?.scrollTo({y:Math.max(0,Math.max(620,windowHeight-86)-appHeaderTopInset-unifiedHeaderHeight),animated:true})} style={s.modelDetailButton}><Ionicons name="chevron-down" size={20} color={C.white}/><Text style={s.modelDetailButtonText}>DETAY</Text></Pressable></View>}
      </View>
      <View style={s.readyDetailSheet}>
        <View style={s.readyTitleRow}><View style={s.readyTitleCopy}><Text style={s.readyDetailKicker}>{product.id==="ready"?"ASFALT TO GO · 3D ÜRÜN":"TEK ASFALT · 3D ÜRÜN"}</Text><Text style={s.readyDetailTitle}>{product.title}</Text><Text style={s.readyDetailMeta}>{product.meta}</Text></View>{product.id==="ready"&&<View style={s.readyPackBadge}><Text style={s.readyPackBadgeValue}>25</Text><Text style={s.readyPackBadgeLabel}>KG</Text></View>}</View>
        <View style={s.readyBenefitGrid}>
          {(product.id==="ready"?[
            {icon:"flash-outline",value:"Hazır",label:"Doğrudan uygulama"},
            {icon:"rainy-outline",value:"4 Mevsim",label:"Her hava koşulu"},
            {icon:"leaf-outline",value:"VOC 0",label:"Çözücü içermez"},
          ]:product.id==="emulsion"?[
            {icon:"cube-outline",value:"230 kg",label:"Profesyonel varil"},
            {icon:"link-outline",value:"Güçlü",label:"Tabaka aderansı"},
            {icon:"construct-outline",value:"Kontrollü",label:"Yüzey hazırlığı"},
          ]:[
            {icon:"shield-checkmark-outline",value:"Polimer",label:"Güçlendirilmiş yapı"},
            {icon:"water-outline",value:"Yalıtım",label:"Suya karşı koruma"},
            {icon:"git-merge-outline",value:"Esnek",label:"Çatlak köprüleme"},
          ]).map(item=><View key={item.value} style={s.readyBenefitCard}><View style={s.readyBenefitIcon}><Ionicons name={item.icon as any} size={18} color={C.orange}/></View><Text style={s.readyBenefitValue}>{item.value}</Text><Text style={s.readyBenefitLabel}>{item.label}</Text></View>)}
        </View>
        <View style={s.readyTabs}><Pressable onPress={()=>setTekDetailTab("description")} style={[s.readyTab,tekDetailTab==="description"&&s.readyTabActive]}><Text style={[s.readyTabText,tekDetailTab==="description"&&s.readyTabTextActive]}>Açıklama</Text></Pressable><Pressable onPress={()=>setTekDetailTab("usage")} style={[s.readyTab,tekDetailTab==="usage"&&s.readyTabActive]}><Text style={[s.readyTabText,tekDetailTab==="usage"&&s.readyTabTextActive]}>Kullanım</Text></Pressable></View>
        {tekDetailTab==="description"?<Text style={s.readyDescription}>{product.id==="ready"?"Trafik alanlarının ekonomik ve hızlı onarımı için geliştirilmiş; kullanıma hazır, dayanıklı ve çözücü içermeyen profesyonel soğuk asfalt çözümü. Düşük trafik yüküne sahip yollar, ara sokaklar ve yaya yollarındaki geçici onarımlarda güvenle kullanılabilir.":product.intro}</Text>:<View style={s.readyUsageList}>{product.uses.map((use,index)=><View key={use} style={s.readyUsageRow}><Text style={s.readyUsageNo}>{String(index+1).padStart(2,"0")}</Text><Text style={s.readyUsageText}>{use}</Text></View>)}</View>}
        {product.id==="ready"&&<>
          <View style={s.readyTechnicalHead}><View><Text style={s.readyDetailKicker}>TEKNİK REHBER</Text><Text style={s.readyTechnicalTitle}>Ürünü doğru uygulayın.</Text></View><View style={s.readyTechnicalCount}><Text style={s.readyTechnicalCountText}>6 BÖLÜM</Text></View></View>
          <View style={s.readyAccordion}>
            {TOGO_READY_SECTIONS.map(section=>{
              const open=readySection===section.id;
              return <View key={section.id} style={[s.readyAccordionItem,open&&s.readyAccordionItemOpen]}>
                <Pressable onPress={()=>setReadySection(open?"":section.id)} style={s.readyAccordionButton}>
                  <View style={[s.readyAccordionIcon,open&&s.readyAccordionIconOpen]}><Ionicons name={section.icon as any} size={19} color={open?C.white:C.navy}/></View>
                  <Text style={s.readyAccordionTitle}>{section.title}</Text>
                  <Ionicons name={open?"remove":"add"} size={20} color={open?C.orange:"#7B8595"}/>
                </Pressable>
                {open&&<View style={s.readyAccordionBody}>{section.items.map(item=><View key={item} style={s.readyAccordionBullet}><View style={s.readyAccordionDot}/><Text style={s.readyAccordionText}>{item}</Text></View>)}</View>}
              </View>;
            })}
          </View>
          <View style={s.readyStepsHead}><Text style={s.readyDetailKicker}>4 ADIMDA UYGULAMA</Text><Text style={s.readyStepsTitle}>Hazırla, uygula, sıkıştır.</Text><Text style={s.readyStepsIntro}>Sahada hızlı ve doğru sonuç için adımları sırayla takip edin.</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={274} decelerationRate="fast" contentContainerStyle={s.readyStepsRail}>
            {TOGO_APPLICATION_STEPS.map(step=><View key={step.no} style={s.readyStepCard}>
              <Image source={step.image} resizeMode="cover" style={s.readyStepImage}/>
              <View style={s.readyStepCopy}><View style={s.readyStepNo}><Text style={s.readyStepNoText}>{step.no}</Text></View><View style={{flex:1}}><Text style={s.readyStepTitle}>{step.title}</Text><Text style={s.readyStepText}>{step.text}</Text></View></View>
            </View>)}
          </ScrollView>
          <View style={s.readyStandardCard}><View style={s.readyStandardIcon}><Ionicons name="shield-checkmark-outline" size={23} color={C.white}/></View><View style={{flex:1}}><Text style={s.readyStandardKicker}>KALİTE STANDARDI</Text><Text style={s.readyStandardTitle}>TSE K-50 ve CE belgeli üretim</Text><Text style={s.readyStandardText}>Profesyonel ve bireysel kullanıma uygun, güvenli ve sürdürülebilir çözüm.</Text></View></View>
        </>}
        <Pressable onPress={()=>{setQuoteForm(current=>({...current,product:product.title}));navigateTab("quote")}} style={s.readyQuoteButton}><Ionicons name="bag-handle-outline" size={19} color={C.white}/><Text style={s.readyQuoteButtonText}>Teklif iste</Text><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
      </View>
    </ScrollView>;
    return <ScrollView
      ref={productCollectionScroll}
      style={s.tekProductsPage}
      contentContainerStyle={[s.productCollectionInner,{paddingTop:appHeaderTopInset+unifiedHeaderHeight+22}]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={event=>{productCollectionScrollY.current=event.nativeEvent.contentOffset.y;}}
      onLayout={()=>requestAnimationFrame(()=>productCollectionScroll.current?.scrollTo({y:productCollectionScrollY.current,animated:false}))}
    >
      <View style={s.productCollectionHeader}>
        <Text style={s.productCollectionKicker}>TEK ASFALT / ÇÖZÜMLER</Text>
        <Text style={s.productCollectionHero}>Ürünü seç,{`\n`}detayı keşfet.</Text>
        <Text style={s.productCollectionIntro}>Kartları sağa–sola kaydırın. Ortadaki kart seçili üründür.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={windowWidth-36} disableIntervalMomentum contentContainerStyle={s.productSwipeRail} onMomentumScrollEnd={event=>setShowcaseActive(Math.round(event.nativeEvent.contentOffset.x/(windowWidth-36)))}>
        {PRODUCT_SHOWCASE_ITEMS.map((item,index)=>{
          return <Pressable key={item.key} onPress={()=>{
            setModelHintDismissed(false);
            if(item.detailKind==="togo"){
              const id=item.target as ProductId;
              lastProductSelection.current={kind:"togo",id};
              setSelectedTekProduct(null);
              setTogoDetailSections([PRODUCT_DETAILS[id].sections[0]?.id ?? ""]);
              setSelectedProduct(id);
              trackEvent("view_item",{item_id:id,item_category:"asfalt_to_go"});
            }else{
              setSelectedProduct(null);
              openTekProduct(item.target as TekProductId);
            }
          }} style={({pressed})=>[s.productSwipeCard,{width:windowWidth-48,height:Math.max(350,windowHeight*.46)},pressed&&s.productCardPressed]}>
            <View style={[s.productShowcaseMedia,{backgroundColor:item.background}]}> 
              <Image source={item.source} resizeMode={item.fit} style={[s.productShowcaseImage,{transform:[{translateX:item.translateX||0},{scale:item.scale||1}]}]}/>
              <View style={s.productShowcaseWash}/>
              <LinearGradient colors={["rgba(4,8,15,.02)","rgba(5,9,16,.10)","rgba(8,9,12,.94)"]} locations={[0,.44,1]} style={StyleSheet.absoluteFill}/>
              <View style={s.productShowcaseCopy}><Text style={s.productShowcaseMeta}>{item.meta}</Text><Text style={s.productShowcaseTitle}>{item.title}</Text><Text numberOfLines={2} style={s.productShowcaseSummary}>{item.intro}</Text><View style={s.productShowcaseAction}><Text style={s.productShowcaseActionText}>Ürünü incele</Text>{(item.detailKind==="togo" ? PRODUCT_PACDORA_URLS[item.target as ProductId] : TEK_PRODUCT_PACDORA_URLS[item.target as TekProductId])&&<Ionicons name="cube-outline" size={16} color={C.orange}/>}<Ionicons name="arrow-forward" size={16} color={C.white}/></View></View>
              <View style={s.productShowcaseNumber}><Text style={s.productShowcaseNumberText}>{String(index+1).padStart(2,"0")}</Text></View>
            </View>
          </Pressable>;
        })}
      </ScrollView>
      <View style={s.radialSwipeHint}><Ionicons name="swap-horizontal" size={18} color={C.orange}/><Text style={s.radialSwipeHintText}>Ürünler arasında kaydırın</Text><View style={s.radialDots}>{PRODUCT_SHOWCASE_ITEMS.map((item,index)=><View key={item.key} style={[s.radialDot,index===showcaseActive&&s.radialDotActive]}/>)}</View></View>
    </ScrollView>;
  };

  const ProductDetail = ({ id }: { id: ProductId }) => {
    const product = PRODUCT_DETAILS[id];
    const productStageHeight=Math.max(620,windowHeight-86);
    const toggleDetailSection = (sectionId:string,open:boolean) => {
      const scrollKey=`togo-${id}`;
      const currentY=productDetailScrollY.current[scrollKey]||0;
      setTogoDetailSections(open?[]:[sectionId]);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        productDetailScrollY.current[scrollKey]=currentY;
        togoProductDetailScroll.current?.scrollTo({y:currentY,animated:false});
      }));
    };
    const documentId = (title: string) => {
      const kind = title.includes("Güvenlik")
        ? "sds"
        : title.includes("CE")
          ? "ce"
          : "tech";
      return `${id}-${kind}`;
    };
    const downloadDocument = async (title: string) => {
      if (!customerToken) {
        drawerNavigate("portal");
        return;
      }
      const id = documentId(title);
      const bundled = ASPHALT_TO_GO_DOCUMENTS[id];
      const url = bundled
        ? Image.resolveAssetSource(bundled).uri
        : `${CUSTOMER_API}/documents/${id}/download?token=${encodeURIComponent(customerToken)}`;
      await Linking.openURL(url);
    };
    const documentStatus = (title: string) => {
      const id = documentId(title);
      return ASPHALT_TO_GO_DOCUMENTS[id] ? {id,available:true} : customerDocuments.find(item => item.id === id);
    };
    return (
      <ScrollView
        ref={togoProductDetailScroll}
        key={`togo-detail-${id}`}
        style={s.productDetailPage}
        contentContainerStyle={s.productDetailInner}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!modelInteracting}
        scrollEventThrottle={16}
        onScroll={event=>{productDetailScrollY.current[`togo-${id}`]=event.nativeEvent.contentOffset.y;}}
        onLayout={()=>{
          if(!pendingProductScrollRestore.current)return;
          pendingProductScrollRestore.current=false;
          requestAnimationFrame(()=>togoProductDetailScroll.current?.scrollTo({y:productDetailScrollY.current[`togo-${id}`]||0,animated:false}));
        }}
      >
        <View style={[s.detailVisual,{height:productStageHeight}]}>
          <PacdoraViewer url={PRODUCT_PACDORA_URLS[id]} title={`${product.title} 3D ürün modeli`} onInteractionChange={active=>{setModelInteracting(active);if(active)setModelHintDismissed(true);}}/>
          <LinearGradient pointerEvents="none" colors={["transparent","rgba(255,255,255,.18)",C.white]} style={s.modelStageTransition}/>
          {!modelHintDismissed&&<View pointerEvents="none" style={s.model360StageCenter}><LottieView source={require("./assets/animations/360-view.json")} autoPlay loop style={s.model360Animation}/></View>}
          <View style={s.modelStageActions}><Pressable accessibilityLabel={`${product.title} detayları`} onPress={()=>{
            const detailY=Math.max(0,productStageHeight-appHeaderTopInset-unifiedHeaderHeight);
            productDetailScrollY.current[`togo-${id}`]=detailY;
            togoProductDetailScroll.current?.scrollTo({y:detailY,animated:true});
          }} style={s.modelDetailButton}><Ionicons name="chevron-down" size={20} color={C.white}/><Text style={s.modelDetailButtonText}>DETAY</Text></Pressable></View>
        </View>
        <View style={s.detailCopy}>
          <Text style={s.detailTitle}>{product.title}</Text>
          <Text style={s.detailSlogan}>{product.slogan}</Text>
          <View style={s.detailStats}>
            {product.stats.map((stat) => (
              <View key={stat.value} style={s.detailStat}>
                <View style={s.detailStatIcon}><Ionicons name={stat.icon as any} size={18} color={C.orange}/></View>
                <Text style={s.detailStatValue}>{stat.value}</Text>
                <Text style={s.detailStatText}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <View style={s.detailIntroCard}>
            <Text style={s.detailIntroKicker}>ÜRÜN PROFİLİ</Text>
            <Text style={s.detailIntro}>{product.intro}</Text>
          </View>
          <View style={s.detailGuideHead}>
            <View>
              <Text style={s.detailIntroKicker}>TEKNİK REHBER</Text>
              <Text style={s.detailGuideTitle}>Bilmeniz gerekenler.</Text>
            </View>
            <View style={s.detailGuideCount}><Text style={s.detailGuideCountText}>{product.sections.length} BÖLÜM</Text></View>
          </View>
          <View style={s.detailAccordion}>
            {product.sections.map((section) => {
              const open=togoDetailSections.includes(section.id);
              return <View key={section.id} style={[s.detailAccordionItem,open&&s.detailAccordionItemOpen]}>
                <Pressable onPress={()=>toggleDetailSection(section.id,open)} style={s.detailAccordionButton}>
                  <View style={[s.detailAccordionIcon,open&&s.detailAccordionIconOpen]}><Ionicons name={section.icon as any} size={19} color={open?C.white:C.navy}/></View>
                  <Text style={s.detailAccordionTitle}>{section.title}</Text>
                  <Ionicons name={open?"remove":"add"} size={20} color={open?C.orange:"#7B8595"}/>
                </Pressable>
                {open&&<View style={s.detailAccordionBody}>{section.items.map(item=><View key={item} style={s.detailBullet}><View style={s.detailBulletDot}/><Text style={s.detailBulletText}>{item}</Text></View>)}</View>}
              </View>;
            })}
          </View>
          <View style={s.detailNoticeCard}>
            <View style={s.detailNoticeIcon}><Ionicons name={product.notice.icon as any} size={23} color={C.white}/></View>
            <View style={{flex:1}}><Text style={s.detailNoticeKicker}>{id==="asphalt"?"KALİTE VE GÜVEN":"SAHADA GÜVENLİK"}</Text><Text style={s.detailNoticeTitle}>{product.notice.title}</Text><Text style={s.detailNoticeText}>{product.notice.text}</Text></View>
          </View>
          <View style={s.docsSection}>
            <Text style={s.detailSectionTitle}>Bilgi ve belgeler</Text>
            <Text style={s.docsIntro}>
              {id === "asphalt"
                ? "Hazır asfalt için güncel teknik, güvenlik ve CE belgeleri."
                : isLoggedIn
                ? "Doğrulanmış hesabınızla teknik belgelere erişebilirsiniz."
                : "Güvenlik bilgi formları ve teknik belgeler yalnızca kayıtlı müşterilere açıktır."}
            </Text>
            {!isLoggedIn && (
              <Pressable
                onPress={() => drawerNavigate("portal")}
                style={s.lockedDocsCard}
              >
                <View style={s.lockedDocsIcon}>
                  <Ionicons name="lock-closed" size={21} color={C.white} />
                </View>
                <View style={s.docCopy}>
                  <Text style={s.lockedDocsTitle}>Müşteri girişi gerekli</Text>
                  <Text style={s.docMeta}>
                    Belgelere güvenli erişim için giriş yapın
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={19} color={C.orange} />
              </Pressable>
            )}
            {isLoggedIn &&
              product.docs.filter(doc => documentStatus(doc)?.available === true).map((doc) => {
                const available = true;
                return (
                <Pressable
                  key={doc}
                  style={[s.docRow, !available && s.docRowDisabled]}
                  disabled={!available}
                  accessibilityState={{ disabled: !available }}
                  onPress={() => available && downloadDocument(doc)}
                >
                  <View style={s.docIcon}>
                    <Ionicons
                      name="document-attach-outline"
                      size={20}
                      color={C.orange}
                    />
                  </View>
                  <View style={s.docCopy}>
                    <Text style={s.docTitle}>{doc}</Text>
                    <Text style={s.docMeta}>{available ? "PDF · Güvenli indirme" : "Belge henüz yayınlanmadı"}</Text>
                  </View>
                  <View style={[s.docDownloadBadge, !available && s.docDownloadBadgeDisabled]}>
                    <Text style={[s.docDownloadText, !available && s.docDownloadTextDisabled]}>{available ? "İndir" : "Bekliyor"}</Text>
                    <Ionicons name={available ? "download-outline" : "time-outline"} size={18} color={available ? C.white : "#8792A4"} />
                  </View>
                </Pressable>
              )})}
          </View>
        </View>
      </ScrollView>
    );
  };

  const TogoCalculator = () => (
        <View style={s.togoCalc}>
      {!togoCalculated && <>
      <View style={s.arPageIntro}>
        <LinearGradient colors={["rgba(11,28,62,.06)","rgba(11,28,62,.84)"]} style={StyleSheet.absoluteFill}/>
        <Image source={require("./assets/products/hazir-asfalt-detail.png")} style={s.arIntroProductImage} resizeMode="contain" />
        <View style={s.arPageIntroContent}>
          <Image source={require("./assets/togo-logo.png")} style={s.arIntroBrand} resizeMode="contain" />
          <View style={s.arEyebrow}><View style={s.arEyebrowDot}/><Text style={s.arEyebrowText}>AR HASAR TARAMA</Text></View>
          <Text style={s.arPageTitle}>Hasarı görün.{`\n`}İhtiyacı hesaplayın.</Text>
          <Text style={s.arPageSubtitle}>LiDAR, algılanan hasar alanının derinliğini doğrular; yaklaşık hazır asfalt ihtiyacını otomatik hesaplar.</Text>
        </View>
      </View>

        <View style={s.arScanCard}>
        <View style={s.arScanVisual}>
          <View style={s.lidarGrid}/>
          <Animated.View style={[s.lidarSweepLine,{transform:[{translateY:lidarSweep.interpolate({inputRange:[0,1],outputRange:[-74,74]})}]}]}/>
          <View style={s.lidarLivePill}><View style={s.lidarLiveDot}/><Text style={s.lidarLiveText}>ÖLÇÜME HAZIR</Text></View>
          <View style={s.arScanRingOuter}>
            <View style={s.arScanRingInner}><Ionicons name="scan-outline" size={52} color={C.orange}/></View>
          </View>
          <View style={[s.arScanCorner,s.arScanCornerTopLeft]}/><View style={[s.arScanCorner,s.arScanCornerTopRight]}/>
          <View style={[s.arScanCorner,s.arScanCornerBottomLeft]}/><View style={[s.arScanCorner,s.arScanCornerBottomRight]}/>
          <View style={s.lidarScanFooter}><Text style={s.lidarScanFooterTitle}>ÇUKURU ÇERÇEVEYE ALIN</Text><Text style={s.lidarScanFooterMeta}>yavaşça hareket ederek yüzeyi tarayın</Text></View>
        </View>
        <Pressable
          onPress={() => setTogoSafetyAccepted(value => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{checked:togoSafetyAccepted}}
          accessibilityLabel="Güvenli ve trafikten uzak bir alandayım"
          style={[s.arSafetyCompact, togoSafetyAccepted && s.arSafetyCompactActive]}
        >
          <View style={[s.arSafetyCompactCheck, togoSafetyAccepted && s.arSafetyCompactCheckActive]}>
            {togoSafetyAccepted && <Ionicons name="checkmark" size={18} color={C.white}/>}
          </View>
          <Text style={s.arSafetyCompactText}>Güvenli ve trafikten uzak bir alandayım.</Text>
        </Pressable>
        <SlideToStart
          enabled={togoSafetyAccepted}
          busy={togoScanBusy}
          onComplete={startTogoScan}
        />
      </View>

      {togoScanPhoto && <View style={s.scanPreview}>
        <Image source={{uri:togoScanPhoto}} style={StyleSheet.absoluteFill} resizeMode="cover"/>
        <LinearGradient colors={["rgba(5,14,32,.08)","rgba(5,14,32,.8)"]} style={StyleSheet.absoluteFill}/>
        <View style={s.scanCorners}><View style={s.scanCornerTL}/><View style={s.scanCornerTR}/><View style={s.scanCornerBL}/><View style={s.scanCornerBR}/></View>
        <View style={s.scanPreviewCopy}><Ionicons name="checkmark-circle" size={20} color="#42D995"/><Text style={s.scanPreviewText}>Görüntü alındı · ölçüyü doğrulayın</Text></View>
      </View>}

      {togoNativeScan && <View style={s.nativeScanSummary}>
        <View style={s.nativeScanIcon}><Ionicons name="scan-circle-outline" size={25} color="#42D995"/></View>
        <View style={{flex:1}}><Text style={s.nativeScanTitle}>Doğrulanmış saha ölçümü tamamlandı</Text><Text style={s.nativeScanMeta}>{togoNativeScan.technology === "ios-lidar" ? "iOS LiDAR" : "AR"} · 4 kenar ve {togoNativeScan.validDepthPointCount} taban noktası ile ölçüldü</Text></View>
      </View>}

      <Pressable onPress={()=>{setTogoManualOpen(open=>!open);setTogoScanStage("measure");}} style={s.arManualToggle}>
        <View style={s.arManualToggleIcon}><Ionicons name="create-outline" size={20} color={C.navy}/></View>
        <View style={{flex:1}}><Text style={s.arManualToggleTitle}>Manuel ölçü gir</Text><Text style={s.arManualToggleMeta}>Uzunluk, genişlik ve derinlik yeterli</Text></View>
        <Ionicons name={togoManualOpen ? "chevron-up" : "chevron-down"} size={20} color="#71809A"/>
      </Pressable>

      {togoManualOpen && <View style={s.arManualPanel}>
        <View style={s.manualMeasureHeader}><Text style={s.scanPresetLabel}>ÖLÇÜLER</Text><Text style={s.manualMeasureHint}>Santimetre</Text></View>
      <View style={s.togoFields}>
        <Field
          dark
          label="Uzunluk"
          unit="cm"
          value={togoLength}
          onChange={(v) => {
            setTogoLength(v);
            setTogoCalculated(false);
          }}
        />
        <Field
          dark
          label="Genişlik"
          unit="cm"
          value={togoWidth}
          onChange={(v) => {
            setTogoWidth(v);
            setTogoCalculated(false);
          }}
        />
        <Field
          dark
          label="Kalınlık"
          unit="cm"
          value={togoDepth}
          onChange={(v) => {
            setTogoDepth(v);
            setTogoCalculated(false);
          }}
        />
      </View>
      <View style={s.togoActions}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setTogoCalculated(Boolean(togoLength && togoWidth && togoDepth));
          }}
          style={s.togoButton}
        >
          <Text style={s.togoButtonText}>İhtiyacı hesapla</Text>
          <Ionicons name="arrow-forward" size={19} color={C.white} />
        </Pressable>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setTogoLength("");
            setTogoWidth("");
            setTogoDepth("");
            setTogoCalculated(false);
          }}
          style={s.clearButton}
        >
          <Ionicons name="refresh" size={20} color={C.white} />
        </Pressable>
      </View>
      </View>}
      </>}
      {togoCalculated && (
        <View style={s.togoResult}>
          <View style={s.resultCompletePill}><Ionicons name="checkmark-circle" size={16} color="#58E6A3"/><Text style={s.resultCompleteText}>{togoNativeScan ? "LİDAR TARAMASI TAMAMLANDI" : "MANUEL HESAP TAMAMLANDI"}</Text></View>
          <View style={s.resultHeroRow}>
            <View style={s.resultHeroCopy}>
              <Text style={s.togoResultLabel}>TAHMİNİ İHTİYAÇ</Text>
              <View style={s.resultNumberRow}><Text style={s.bucketCountValue}>{togoResult.buckets}</Text><Text style={s.resultBucketWord}>KOVA</Text></View>
              <Text style={s.togoResultMeta}>{togoResult.kg.toLocaleString("tr-TR",{maximumFractionDigits:1})} kg · {togoResult.area.toLocaleString("tr-TR",{maximumFractionDigits:2})} m²</Text>
            </View>
            <ProductVideo source={require("./assets/ar-results/emulsion-500ml.mov")} style={s.resultBucketVideo} fit="contain" />
          </View>
          {togoNativeScan && <View style={s.scanDimensions}>
            <Text style={s.scanDimensionsTitle}>LİDAR NOKTA ÖLÇÜM ÖZETİ</Text>
            <View style={s.scanDimensionsGrid}>
              {[
                ["Uzunluk", `${togoNativeScan.lengthCm.toLocaleString("tr-TR",{maximumFractionDigits:1})} cm`, "resize-outline"],
                ["Genişlik", `${togoNativeScan.widthCm.toLocaleString("tr-TR",{maximumFractionDigits:1})} cm`, "expand-outline"],
                ["Derinlik", `${togoNativeScan.depthCm.toLocaleString("tr-TR",{maximumFractionDigits:1})} cm`, "arrow-down-outline"],
                ["Yüzey alanı", `${togoNativeScan.surfaceAreaSquareMeters.toLocaleString("tr-TR",{maximumFractionDigits:2})} m²`, "scan-outline"],
                ["Hacim", `${togoNativeScan.volumeCubicMeters.toLocaleString("tr-TR",{maximumFractionDigits:3})} m³`, "cube-outline"],
                ["KG", `${togoResult.kg.toLocaleString("tr-TR",{maximumFractionDigits:1})} kg`, "scale-outline"],
              ].map(([label,value,icon]) => <View key={label} style={s.scanDimensionCell}>
                <Ionicons name={icon as any} size={15} color="#58E6A3"/>
                <View style={s.scanDimensionCopy}><Text style={s.scanDimensionLabel}>{label}</Text><Text style={s.scanDimensionValue}>{value}</Text></View>
              </View>)}
            </View>
          </View>}
          <View style={s.resultAssurance}><Ionicons name="information-circle-outline" size={17} color="#AEB8CC"/><Text style={s.resultAssuranceText}>Yaklaşık sonuçtur; %15 uygulama ve sıkıştırma payı dahildir. Kesin sipariş öncesi saha ölçüsünü doğrulayın.</Text></View>
          <Pressable onPress={()=>{lastProductSelection.current={kind:"togo",id:"emulsion"};setSelectedProduct("emulsion");}} style={s.resultPrimerRecommendation}>
            <ProductVideo source={require("./assets/ar-results/asfalt-to-go.mov")} style={s.resultPrimerVideo} fit="contain" />
            <View style={s.resultPrimerCopy}><Text style={s.resultPrimerKicker}>UYGULAMA ÖNERİSİ</Text><Text style={s.resultPrimerTitle}>1 adet 500 ml Emülsiyon To Go</Text><Text style={s.resultPrimerText}>Onarım öncesi yüzey aderansını güçlendirmek için bitüm astarı önerilir.</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#BFD1ED"/>
          </Pressable>
          <Pressable onPress={()=>{setQuoteForm(current=>({...current,product:"Hazır Asfalt",tonnage:(togoResult.buckets*.025).toFixed(3),note:`Asfalt To Go AR metrajı: ${togoResult.buckets} kova (yaklaşık).`}));navigateTab("quote");}} style={s.resultQuoteButton}>
            <Text style={s.resultQuoteButtonText}>Sonucu teklife ekle</Text><Ionicons name="arrow-forward" size={19} color={C.white}/>
          </Pressable>
          <Pressable onPress={()=>Linking.openURL(`https://wa.me/905339571294?text=${encodeURIComponent(`Merhaba, AR metraj sonucuma göre yaklaşık ${togoResult.buckets} kova (${togoResult.kg.toLocaleString("tr-TR",{maximumFractionDigits:1})} kg) Asfalt To Go ihtiyacım var. Teklif rica ederim.`)}`)} style={s.resultWhatsappButton}>
            <Ionicons name="logo-whatsapp" size={20} color={C.white}/><Text style={s.resultWhatsappButtonText}>WhatsApp’tan teklif iste</Text><Ionicons name="arrow-forward" size={18} color={C.white}/>
          </Pressable>
          <Text style={s.resultBuyLabel}>VEYA SATIN ALACAĞINIZ PLATFORMU SEÇİN</Text>
          <View style={s.resultMarketRow}>
            {TOGO_MARKETPLACES.map(market=><Pressable key={market.name} onPress={()=>Linking.openURL(market.url)} style={s.resultMarketButton}><Text numberOfLines={1} style={s.resultMarketButtonText}>{market.name}</Text><Ionicons name="open-outline" size={14} color={C.navy}/></Pressable>)}
          </View>
          <Pressable onPress={()=>{setTogoCalculated(false);setTogoNativeScan(null);setTogoManualOpen(false);setTogoSafetyAccepted(false);}} style={s.resultRestartButton}><Ionicons name="scan-outline" size={18} color="#BFD1ED"/><Text style={s.resultRestartText}>Yeni ölçüm başlat</Text></Pressable>
        </View>
      )}
    </View>
  );

  const Togo = () =>
    selectedProduct ? (
      ProductDetail({ id: selectedProduct })
    ) : (
      <ScrollView
        style={s.arPage}
        contentContainerStyle={s.arPageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {TogoCalculator()}
        <View style={s.arPrivacyNote}>
          <Ionicons name="lock-closed-outline" size={18} color="#71809A"/>
          <Text style={s.arPrivacyNoteText}>Tarama verileri hesaplama için cihazda işlenir. Teklif oluşturmadığınız sürece gönderilmez.</Text>
        </View>
      </ScrollView>
    );

  const Calculator = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.flex}
    >
      <ScrollView
        style={{backgroundColor:appTheme.canvas}}
        contentContainerStyle={[s.inner, s.calcPage, {backgroundColor:appTheme.canvas}]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.eyebrowDark}>PROJE METRAJI</Text>
        <Text style={[s.calcTitle,{color:appTheme.text}]}>Tek kalemde{`\n`}hesaplayın.</Text>
        <Text style={[s.calcIntro,{color:appTheme.textMuted}]}>
          Ölçüleri girin, ihtiyacınız olan saha işlerini işaretleyin. Tonajı hesaplayıp tek talepte teklif alın.
        </Text>
        <View style={[s.calcCard,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>
          <Text style={s.calcStep}>01</Text>
          <Text style={[s.calcSectionTitle,{color:appTheme.text}]}>Uygulama ölçüsü</Text>
          <Field
            dark={isDarkMode}
            label="Uzunluk"
            unit="metre"
            value={length}
            onChange={setLength}
          />
          <Field
            dark={isDarkMode}
            label="Genişlik"
            unit="metre"
            value={width}
            onChange={setWidth}
          />
          <Field
            dark={isDarkMode}
            label="Kalınlık"
            unit="santimetre"
            value={height}
            onChange={setHeight}
          />
          <LinearGradient colors={[C.navy, "#17284D"]} style={s.result}>
            <View style={s.resultCopy}>
              <Text style={s.resultLabel}>TAHMİNİ ASFALT İHTİYACI</Text>
              <Text style={s.resultValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                {result.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}{" "}<Text style={s.resultUnit}>TON</Text>
              </Text>
            </View>
            <View style={s.resultIcon}>
              <Ionicons name="calculator" size={25} color={C.white} />
            </View>
          </LinearGradient>
          <View style={[s.calcMeasureSummary,{backgroundColor:appTheme.surfaceRaised,borderColor:appTheme.line}]}>
            <View style={s.calcMeasureItem}>
              <Text style={[s.calcMeasureValue,{color:appTheme.text}]} numberOfLines={1} adjustsFontSizeToFit>
                {calculatedArea.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </Text>
              <Text style={[s.calcMeasureUnit,{color:appTheme.textMuted}]}>m² · UYGULAMA ALANI</Text>
            </View>
            <View style={[s.calcMeasureDivider,{backgroundColor:appTheme.line}]} />
            <View style={s.calcMeasureItem}>
              <Text style={[s.calcMeasureValue,{color:appTheme.text}]} numberOfLines={1} adjustsFontSizeToFit>
                {calculatedVolume.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </Text>
              <Text style={[s.calcMeasureUnit,{color:appTheme.textMuted}]}>m³ · ASFALT HACMİ</Text>
            </View>
            <View style={s.calcDensityPill}>
              <Text style={s.calcDensityText}>2,40 t/m³</Text>
            </View>
          </View>
          <View style={[s.calcTruckPlanner,{backgroundColor:appTheme.surfaceRaised,borderColor:appTheme.line}]}>
            <View style={s.calcTruckCopy}>
              <View style={s.calcTruckIcon}><MaterialCommunityIcons name="truck-fast-outline" size={20} color={C.orange} /></View>
              <View>
                <Text style={[s.calcTruckLabel,{color:appTheme.text}]}>ORTALAMA ARAÇ YÜKÜ</Text>
                <Text style={[s.calcTruckHint,{color:appTheme.textMuted}]}>Sevkiyat planlaması için</Text>
              </View>
            </View>
            <View style={[s.calcTruckInputWrap,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>
              <TextInput
                value={calcTruckCapacity}
                maxLength={6}
                onChangeText={(value) => setCalcTruckCapacity(value.replace(/[^0-9.,]/g, "").replace(",", ".").slice(0, 6))}
                inputMode="decimal"
                keyboardType="decimal-pad"
                selectTextOnFocus
                style={[s.calcTruckInput,{color:appTheme.text}]}
              />
              <Text style={[s.calcTruckUnit,{color:appTheme.textMuted}]}>ton</Text>
            </View>
          </View>
          <View style={[s.calcTruckResult,{backgroundColor:isDarkMode?"#202A42":"#FFF4EA",borderWidth:1,borderColor:isDarkMode?appTheme.line:"#FFE2C9"}]}>
            <View>
              <Text style={s.calcTruckResultLabel}>TAHMİNİ ARAÇ İHTİYACI</Text>
              <Text style={[s.calcTruckResultMeta,{color:appTheme.textMuted}]}>Toplam tonaj ÷ ortalama araç yükü</Text>
            </View>
            <View style={s.calcTruckResultNumberWrap}>
              <Text style={[s.calcTruckResultNumber,{color:appTheme.text}]}>{result > 0 ? Math.ceil(result / Math.max(1, Number(calcTruckCapacity.replace(",", ".")) || 25)).toLocaleString("tr-TR") : "0"}</Text>
              <Text style={s.calcTruckResultUnit}>ARAÇ</Text>
            </View>
          </View>
        </View>
        <Text style={[s.calcStepOutside,{color:C.orange}]}>02 · ASFALT TÜRÜ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.calcChips}>
          {ASPHALT_PRODUCTS.map(product=>{
            const active=calcProduct===product;
            return <Pressable key={product} onPress={()=>setCalcProduct(product)} style={[s.calcChip,{backgroundColor:active?C.orange:appTheme.surface,borderColor:active?C.orange:appTheme.line}]}><Text style={[s.calcChipText,{color:active?C.white:appTheme.text}]}>{product}</Text></Pressable>;
          })}
        </ScrollView>
        <View style={[s.calcScopeCard,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>
          <Text style={s.calcStep}>03</Text><Text style={[s.calcSectionTitle,{color:appTheme.text}]}>Proje kapsamı</Text>
          <Text style={[s.calcScopeIntro,{color:appTheme.textMuted}]}>Opsiyoneldir. Gereken saha işlerini tek dokunuşla seçin.</Text>
          <View style={s.calcServiceGrid}>
            {PROJECT_SERVICES.map(service=>{
              const active=calcServices.includes(service.id);
              return <Pressable key={service.id} onPress={()=>toggleCalcService(service.id)} style={[s.calcService,{backgroundColor:active?(isDarkMode?"#33271F":"#FFF5ED"):appTheme.surfaceRaised,borderColor:active?"#F5B483":appTheme.line}]}>
                <View style={[s.calcServiceIcon,active&&s.calcServiceIconActive]}>
                  {service.family === "image" && "image" in service ? (
                    <Image source={Platform.OS==="web"&&"webImage" in service?{uri:service.webImage}:service.image} resizeMode="contain" style={[s.calcServiceMachineIcon,{tintColor:active?C.white:C.orange}]}/>
                  ) : (
                    <MaterialCommunityIcons name={service.icon as any} size={25} color={active?C.white:C.orange}/>
                  )}
                </View>
                <View style={s.calcServiceCopy}><Text style={[s.calcServiceTitle,{color:appTheme.text}]}>{service.title}</Text><Text style={[s.calcServiceMeta,{color:active&&isDarkMode?"#F2B98F":appTheme.textMuted}]}>{service.meta}</Text></View>
                <Ionicons name={active?"checkmark-circle":"add-circle-outline"} size={20} color={active?C.orange:"#A5ADBA"}/>
              </Pressable>;
            })}
          </View>
          {calcServices.includes("shipping")&&<View style={[s.calcDeliveryCard,{backgroundColor:appTheme.surfaceRaised,borderColor:appTheme.line}]}>
            <View style={s.calcDeliveryHead}><View style={s.calcDeliveryIcon}><Ionicons name="location" size={18} color={C.white}/></View><View><Text style={[s.calcDeliveryTitle,{color:appTheme.text}]}>TESLİMAT BÖLGESİ</Text><Text style={[s.calcDeliveryHint,{color:appTheme.textMuted}]}>Önce üretim bölgesini, ardından teslimat noktasını seçin.</Text></View></View>
            <Pressable onPress={()=>setDeliveryMenu(deliveryMenu==='area'?null:'area')} style={[s.quoteSelect,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}><View><Text style={[s.quoteSelectLabel,{color:appTheme.textMuted}]}>ÜRETİM BÖLGESİ</Text><Text style={[s.quoteSelectValue,{color:appTheme.text},!quoteForm.deliveryArea&&{color:appTheme.textMuted}]}>{quoteForm.deliveryArea||"İstanbul veya Silivri seçin"}</Text></View><Ionicons name={deliveryMenu==='area'?"chevron-up":"chevron-down"} size={18} color={C.orange}/></Pressable>
            {deliveryMenu==='area'&&<View style={[s.quoteSelectMenu,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>{Object.keys(DELIVERY_AREAS).map(area=><Pressable key={area} onPress={()=>{setQuoteForm(current=>({...current,deliveryArea:area,deliveryDistrict:""}));setCalcCity(area);setDeliveryMenu(null)}} style={[s.quoteSelectOption,{borderBottomColor:appTheme.line}]}><Ionicons name="business-outline" size={17} color={C.orange}/><Text style={[s.quoteSelectOptionText,{color:appTheme.text}]}>{area}</Text></Pressable>)}</View>}
            {!!quoteForm.deliveryArea&&<><Pressable onPress={()=>setDeliveryMenu(deliveryMenu==='district'?null:'district')} style={[s.quoteSelect,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}><View><Text style={[s.quoteSelectLabel,{color:appTheme.textMuted}]}>{quoteForm.deliveryArea==='Silivri'?'SİLİVRİ MAHALLE / KÖY':'İSTANBUL AVRUPA YAKASI'}</Text><Text style={[s.quoteSelectValue,{color:appTheme.text},!quoteForm.deliveryDistrict&&{color:appTheme.textMuted}]}>{quoteForm.deliveryDistrict||"Teslimat noktasını seçin"}</Text></View><Ionicons name={deliveryMenu==='district'?"chevron-up":"chevron-down"} size={18} color={C.orange}/></Pressable>
            {deliveryMenu==='district'&&<ScrollView style={s.quoteDistrictMenu} nestedScrollEnabled><View style={[s.quoteSelectMenu,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>{DELIVERY_AREAS[quoteForm.deliveryArea as keyof typeof DELIVERY_AREAS].map(district=><Pressable key={district} onPress={()=>{setQuoteForm(current=>({...current,deliveryDistrict:district}));setDeliveryMenu(null)}} style={[s.quoteSelectOption,{borderBottomColor:appTheme.line}]}><Ionicons name="navigate-outline" size={16} color={C.orange}/><Text style={[s.quoteSelectOptionText,{color:appTheme.text}]}>{district}</Text></Pressable>)}</View></ScrollView>}</>}
          </View>}
        </View>
        <Pressable onPress={moveCalculationToQuote} disabled={!result} style={[s.calcQuoteButton,!result&&s.portalPrimaryButtonDisabled]}><View><Text style={s.calcQuoteKicker}>FİYAT, NAKLİYE VE UYGULAMA</Text><Text style={s.calcQuoteTitle}>Teklif formuna aktar</Text></View><Ionicons name="arrow-forward" size={22} color={C.white}/></Pressable>
        <Text style={[s.note,{color:appTheme.textMuted}]}>
          Tonaj 2,40 ton/m³ ortalama yoğunlukla hesaplanır. Nakliye, uygulama, freze ve diğer saha işleri konum ile proje koşullarına göre tekliflendirilir.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const chooseQuoteDelivery = (kind:"area"|"district", value:string) => {
    if (kind === "area") setQuoteForm(current=>({...current,deliveryArea:value,deliveryDistrict:""}));
    else setQuoteForm(current=>({...current,deliveryDistrict:value}));
    setDeliveryMenu(null);
  };

  const openQuoteDeliveryPicker = (kind:"area"|"district") => {
    const options = kind === "area"
      ? Object.keys(DELIVERY_AREAS)
      : DELIVERY_AREAS[quoteForm.deliveryArea as keyof typeof DELIVERY_AREAS] || [];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions({
        title: kind === "area" ? "Teslimat bölgesini seçin" : "Teslimat noktasını seçin",
        options:["İptal",...options],
        cancelButtonIndex:0,
        userInterfaceStyle:isDarkMode?"dark":"light",
      }, index=>{if(index>0) chooseQuoteDelivery(kind,options[index-1])});
      return;
    }
    setDeliveryMenu(kind);
  };

  const Quote = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
      <ScrollView style={s.darkPage} contentContainerStyle={[s.inner, s.quotePage]} keyboardShouldPersistTaps="handled">
        <View style={s.quoteHeroRow}>
          <View style={s.quoteHeroIcon}><Ionicons name="document-text-outline" size={24} color={C.white}/></View>
          <View style={s.quoteHeroCopy}><Text style={s.eyebrow}>PROJE TEKLİFİ</Text><Text style={s.quotePageTitle}>3 adımda teklif.</Text></View>
        </View>
        <Text style={s.quotePageIntro}>Yalnızca gerekli bilgileri isteyeceğiz. Yaklaşık iki dakikada tamamlayabilirsiniz.</Text>
        <View style={s.quoteProgress}>{[
          {step:1,title:"İletişim",meta:"Size ulaşalım"},
          {step:2,title:"Proje",meta:"İhtiyacı belirtin"},
          {step:3,title:"Tamamla",meta:"Son kontrol"},
        ].map(item=>{const completed=item.step<quoteStep;const current=item.step===quoteStep;return <Pressable key={item.step} onPress={()=>{setDeliveryMenu(null);setQuoteStep(item.step)}} accessibilityRole="button" accessibilityLabel={`${item.step}. adıma git`} style={({pressed})=>[s.quoteProgressItem,pressed&&s.quoteProgressItemPressed]}>
          <View style={[s.quoteProgressLine,(completed||current)&&s.quoteProgressLineActive,completed&&s.quoteProgressLineComplete]}/>
          <View style={s.quoteProgressRow}>
            <View style={[s.quoteProgressState,current&&s.quoteProgressStateCurrent,completed&&s.quoteProgressStateComplete]}>
              {completed?<Ionicons name="checkmark" size={14} color={C.white}/>:current?<Text style={s.quoteProgressNoActive}>{item.step}</Text>:<Ionicons name="ellipsis-horizontal" size={14} color="#8F9DB2"/>}
            </View>
            <View style={{flex:1}}><Text style={[s.quoteProgressLabel,(current||completed)&&s.quoteProgressLabelActive]}>{item.title}</Text><Text style={[s.quoteProgressMeta,current&&s.quoteProgressMetaActive]}>{completed?"Tamamlandı":item.meta}</Text></View>
          </View>
        </Pressable>})}</View>
        <View style={[s.quoteFormCardStandalone,{backgroundColor:appTheme.surface,borderColor:appTheme.line}]}>
          <Text style={[s.quoteStepTitle,{color:appTheme.text}]}>{quoteStep===1?"İletişim bilgileriniz":quoteStep===2?"Proje bilgileri":"Son ayrıntılar"}</Text>
          <Text style={[s.quoteStepIntro,{color:appTheme.textMuted}]}>{quoteStep===1?"Teklif hazır olduğunda size ulaşabilmemiz için.":quoteStep===2?"Ürün ve teslimat ihtiyacınızı belirtin.":"Fotoğraf ve saha işleri isteğe bağlıdır."}</Text>
          {quoteStep===1&&isLoggedIn && <View style={s.quoteAccountPrefill}><Ionicons name="checkmark-circle" size={19} color="#43D18B"/><Text style={s.quoteAccountPrefillText}>Hesap bilgileriniz otomatik dolduruldu.</Text></View>}
          {(quoteStep===1?[['Ad Soyad *','name'],['Firma adı *','company'],['Telefon *','phone'],['E-posta *','email']]:quoteStep===2?[['Saha adresi / proje tarifi','city']]:[]).map(([placeholder,key])=><TextInput key={key} value={(quoteForm as any)[key]} onChangeText={value=>setQuoteForm(current=>({...current,[key]:value}))} placeholder={placeholder} placeholderTextColor={appTheme.textMuted} keyboardType={key==='phone'?'phone-pad':key==='email'?'email-address':'default'} autoCapitalize={key==='email'?'none':'sentences'} style={[s.quoteInput,{backgroundColor:appTheme.surfaceRaised,borderColor:appTheme.line,color:appTheme.text}]}/>) }
          {quoteStep===2&&<>
          <Pressable onPress={useCurrentProjectLocation} disabled={locationBusy} style={s.quoteLocationButton}><Ionicons name="location-outline" size={18} color={C.orange}/><View style={s.quoteLocationCopy}><Text style={s.quoteLocationTitle}>{locationBusy?"Konum alınıyor…":"Konumumu kullan"}</Text><Text style={s.quoteLocationMeta}>Yalnızca proje adresini doldurur; koordinat kaydedilmez</Text></View><Ionicons name="chevron-forward" size={16} color="#71809A"/></Pressable>
          <Text style={s.quoteFieldLabel}>TESLİMAT BÖLGESİ</Text>
          <Pressable onPress={()=>openQuoteDeliveryPicker("area")} style={s.quoteSelect}><View><Text style={s.quoteSelectLabel}>BÖLGE</Text><Text style={[s.quoteSelectValue,!quoteForm.deliveryArea&&s.quoteSelectPlaceholder]}>{quoteForm.deliveryArea||"Bölge seçin"}</Text></View><Ionicons name="chevron-down" size={18} color={C.orange}/></Pressable>
          {!!quoteForm.deliveryArea&&<Pressable onPress={()=>openQuoteDeliveryPicker("district")} style={s.quoteSelect}><View><Text style={s.quoteSelectLabel}>{quoteForm.deliveryArea==='Silivri'?'SİLİVRİ MAHALLE / KÖY':'İSTANBUL AVRUPA İLÇESİ'}</Text><Text style={[s.quoteSelectValue,!quoteForm.deliveryDistrict&&s.quoteSelectPlaceholder]}>{quoteForm.deliveryDistrict||"Teslimat noktasını seçin"}</Text></View><Ionicons name="chevron-down" size={18} color={C.orange}/></Pressable>}
          <Text style={s.quoteFieldLabel}>ÜRETİM TESİSİ</Text>
          <View style={s.quotePlantRow}>{([["sultangazi","Esenler / Sultangazi"],["silivri","Silivri"]] as const).map(([key,label])=><Pressable key={key} onPress={()=>setQuotePlant(key)} style={[s.quotePlantChoice,quotePlant===key&&s.quotePlantChoiceActive]}><Ionicons name="business-outline" size={17} color={quotePlant===key?C.white:C.orange}/><View><Text style={[s.quotePlantChoiceText,quotePlant===key&&s.quotePlantChoiceTextActive]}>{label}</Text><Text style={[s.quotePlantChoiceMeta,quotePlant===key&&s.quotePlantChoiceMetaActive]}>Plent teslim</Text></View></Pressable>)}</View>
          <Text style={s.quoteFieldLabel}>ASFALT TÜRLERİ · BİRDEN FAZLA SEÇEBİLİRSİNİZ</Text><View style={s.quoteProductWrap}>{ASPHALT_PRODUCTS.map(product=>{const active=product in quoteProductTonnages;return <Pressable key={product} onPress={()=>toggleQuoteProduct(product)} style={[s.quoteProductChip,active&&s.quoteProductChipActive]}><Ionicons name={active?"checkmark-circle":"add-circle-outline"} size={14} color={active?C.white:"#91A0B8"}/><Text style={[s.quoteProductText,active&&s.quoteProductTextActive]}>{product}</Text></Pressable>})}</View>
          <View style={s.quoteEstimateCard}>
            <View style={s.quoteEstimateHead}><View><Text style={s.quoteEstimateKicker}>24 SAATLİK DİJİTAL ÖN FİYAT</Text><Text style={s.quoteEstimateTitle}>Ürün ve tonaj dağılımı</Text></View><Ionicons name="document-text-outline" size={25} color={C.orange}/></View>
            {Object.entries(quoteProductTonnages).map(([product,tonnage])=>{const unit=preliminaryUnitPrice(product,quotePlant);const quantity=Number(tonnage.replace(",","."))||0;return <View key={product} style={s.quoteEstimateRow}><View style={s.quoteEstimateCopy}><Text style={s.quoteEstimateName}>{product}</Text><Text style={s.quoteEstimateUnit}>{unit?`${unit.toLocaleString("tr-TR")} ₺ / ton`:"Satış ekibi fiyatlandıracak"}</Text></View><View style={s.quoteEstimateInputWrap}><TextInput value={tonnage} onChangeText={value=>setQuoteProductTonnages(current=>({...current,[product]:value.replace(/[^0-9.,]/g,"").replace(",",".")}))} placeholder="0" keyboardType="decimal-pad" inputMode="decimal" style={s.quoteEstimateInput}/><Text style={s.quoteEstimateTon}>ton</Text></View><Text style={s.quoteEstimateLine}>{unit&&quantity?(unit*quantity).toLocaleString("tr-TR",{maximumFractionDigits:0})+" ₺":"—"}</Text></View>})}
            <View style={s.quoteEstimateTotal}><Text style={s.quoteEstimateTotalLabel}>KDV HARİÇ PLENT ALTI TAHMİNİ TOPLAM</Text><Text style={s.quoteEstimateTotalValue}>{Object.entries(quoteProductTonnages).reduce((sum,[product,value])=>sum+(Number(value)||0)*preliminaryUnitPrice(product,quotePlant),0).toLocaleString("tr-TR",{maximumFractionDigits:0})} ₺</Text></View>
            <Text style={s.quoteEstimateDisclaimer}>Bu otomatik ön fiyat yalnızca bilgilendirme amaçlıdır; bağlayıcı satış teklifi değildir. Nakliye, uygulama, saha koşulları ve KDV dahil değildir. Nihai bedel satış ekibinin yazılı kurumsal teklifiyle kesinleşir ve bu ön fiyat 24 saat sonra pasif olur.</Text>
          </View>
          </>}
          {quoteStep===3&&<>
          <Text style={s.quoteFieldLabel}>OPSİYONEL SAHA İŞLERİ</Text><View style={s.quoteServiceGrid}>{PROJECT_SERVICES.map(service=>{const active=calcServices.includes(service.id);return <Pressable key={service.id} onPress={()=>toggleCalcService(service.id)} style={[s.quoteServiceChip,active&&s.quoteServiceChipActive]}><Ionicons name={active?'checkmark-circle':'add-circle-outline'} size={15} color={active?C.white:'#91A0B8'}/><Text style={[s.quoteServiceText,active&&s.quoteServiceTextActive]}>{service.title}</Text></Pressable>})}</View>
          <Text style={s.quoteFieldLabel}>SAHA GÖRSELLERİ · EN FAZLA 3</Text>
          <View style={s.quoteUploadActions}>
            <Pressable onPress={()=>addQuotePhoto(true)} style={s.quoteUploadButton}><Ionicons name="camera-outline" size={21} color={C.orange}/><View><Text style={s.quoteUploadTitle}>Fotoğraf çek</Text><Text style={s.quoteUploadMeta}>Sahayı şimdi görüntüleyin</Text></View></Pressable>
            <Pressable onPress={()=>addQuotePhoto(false)} style={s.quoteUploadButton}><Ionicons name="cloud-upload-outline" size={21} color={C.orange}/><View><Text style={s.quoteUploadTitle}>Dosya ekle</Text><Text style={s.quoteUploadMeta}>Galeriden görsel seçin</Text></View></Pressable>
          </View>
          <View style={s.quoteAttachmentStatus}><Ionicons name={quotePhotos.length?"checkmark-circle":"images-outline"} size={18} color={quotePhotos.length?"#43D18B":"#7F8DA5"}/><Text style={s.quoteAttachmentStatusText}>{quotePhotos.length?`${quotePhotos.length} görsel teklife eklendi. Gönderimde e-posta eki olarak iletilecek.`:"Henüz saha görseli eklenmedi."}</Text></View>
          {!!quotePhotos.length&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quotePhotoRow}>{quotePhotos.map((photo,index)=><View key={`${photo.uri}-${index}`} style={s.quotePhotoCard}><Image source={{uri:photo.uri}} style={s.quotePhotoImage} resizeMode="cover"/><View style={s.quotePhotoBadge}><Text style={s.quotePhotoBadgeText}>EK {index+1}</Text></View><Pressable onPress={()=>setQuotePhotos(current=>current.filter((_,photoIndex)=>photoIndex!==index))} style={s.quotePhotoRemove}><Ionicons name="close" size={14} color={C.white}/></Pressable><Text numberOfLines={1} style={s.quotePhotoName}>{photo.name}</Text></View>)}</ScrollView>}
          <TextInput value={quoteForm.note} onChangeText={note=>setQuoteForm(current=>({...current,note}))} placeholder="Proje açıklaması, teslimat tarihi ve diğer notlar" placeholderTextColor="#71809A" multiline style={[s.quoteInput,s.quoteNote]}/>
          {!!authError&&<Text style={s.quoteError}>{authError}</Text>}{!!quoteSuccess&&<View style={s.quoteSuccess}><Ionicons name="checkmark-circle" size={20} color="#19A66A"/><Text style={s.quoteSuccessText}>{quoteSuccess}</Text></View>}
          </>}
          <View style={s.quoteStepActions}>{quoteStep>1&&<Pressable onPress={()=>setQuoteStep(step=>step-1)} style={s.quoteBack}><Ionicons name="arrow-back" size={19} color={appTheme.text}/><Text style={[s.quoteBackText,{color:appTheme.text}]}>Geri</Text></Pressable>}{quoteStep<3?<Pressable onPress={()=>setQuoteStep(step=>step+1)} style={[s.quoteSubmit,{flex:1}]}><Text style={s.quoteSubmitText}>Devam et</Text><Ionicons name="arrow-forward" size={20} color={C.white}/></Pressable>:<Pressable onPress={submitQuote} disabled={quoteBusy||!!quoteSuccess} style={[s.quoteSubmit,{flex:1},quoteBusy&&s.quoteSubmitBusy,!!quoteSuccess&&s.quoteSubmitSuccess]}>{quoteBusy?<><ActivityIndicator size="small" color={C.white}/><Text style={s.quoteSubmitText}>Gönderiliyor…</Text></>:quoteSuccess?<><Ionicons name="checkmark-circle" size={20} color={C.white}/><Text style={s.quoteSubmitText}>Talep iletildi</Text></>:<><Ionicons name="paper-plane-outline" size={20} color={C.white}/><Text style={s.quoteSubmitText}>Talebi gönder</Text></>}</Pressable>}</View>
        </View>
        <View style={s.quotePrivacy}><Ionicons name="shield-checkmark-outline" size={18} color={C.orange}/><Text style={s.quotePrivacyText}>Bilgileriniz yalnızca teklif hazırlama ve sizinle iletişim kurma amacıyla kullanılır.</Text></View>
      </ScrollView>
      <Modal visible={Platform.OS!=="ios"&&!!deliveryMenu} transparent animationType="slide" onRequestClose={()=>setDeliveryMenu(null)}>
        <View style={s.deliveryPickerLayer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={()=>setDeliveryMenu(null)}/>
          <View style={[s.deliveryPickerSheet,{paddingBottom:Math.max(insets.bottom,18)}]}>
            <View style={s.deliveryPickerHandle}/>
            <View style={s.deliveryPickerHead}><View><Text style={s.deliveryPickerKicker}>TESLİMAT</Text><Text style={s.deliveryPickerTitle}>{deliveryMenu==="area"?"Bölge seçin":"Teslimat noktasını seçin"}</Text></View><Pressable onPress={()=>setDeliveryMenu(null)} style={s.deliveryPickerClose}><Ionicons name="close" size={20} color={C.navy}/></Pressable></View>
            <ScrollView style={s.deliveryPickerScroll} showsVerticalScrollIndicator>
              {(deliveryMenu==="area"?Object.keys(DELIVERY_AREAS):(DELIVERY_AREAS[quoteForm.deliveryArea as keyof typeof DELIVERY_AREAS]||[])).map(option=><Pressable key={option} onPress={()=>chooseQuoteDelivery(deliveryMenu as "area"|"district",option)} style={s.deliveryPickerOption}><View style={s.deliveryPickerOptionIcon}><Ionicons name={deliveryMenu==="area"?"location-outline":"navigate-outline"} size={18} color={C.orange}/></View><Text style={s.deliveryPickerOptionText}>{option}</Text>{(deliveryMenu==="area"?quoteForm.deliveryArea:quoteForm.deliveryDistrict)===option&&<Ionicons name="checkmark-circle" size={20} color={C.orange}/>}</Pressable>)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );

  const Contact = () => (
    <ScrollView style={s.darkPage} contentContainerStyle={[s.inner, s.contact]}>
          <View style={[s.contactHero,{height:Math.max(470,windowHeight*.56)}]}>
        <ManagedMedia
        setting={designSettings.contact_hero}
        defaultSource={require("./assets/corporate/contact-drone.mp4")}
        defaultType="video"
        defaultX={0}
        defaultY={0}
        defaultScale={1}
        useSettingTransform={false}
        fit="cover"
        style={[s.centeredHeroMedia, s.contactHeroMedia]}
      />
      <LinearGradient
        colors={["rgba(8,20,46,.08)", "rgba(8,20,46,.45)", "rgba(8,20,46,.88)", C.navy]}
        locations={[0, 0.48, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
        <TekAsfaltLogo style={s.contactLogo} />
        <View>
          <Text style={s.eyebrow}>DOĞRUDAN İLETİŞİM</Text>
          <Text style={s.screenTitle}>Projeniz için{`\n`}doğru hatta ulaşın.</Text>
          <Text style={s.screenIntro}>
            Teklif, teknik danışmanlık, sevkiyat ve üretim planlaması için tek iletişim noktası.
          </Text>
        </View>
      </View>
      <View style={s.quickContact}>
        <Pressable
          onPress={() => Linking.openURL("tel:+902126192012")}
          style={s.quickContactItem}
        >
          <Ionicons name="call" size={21} color={C.orange} />
          <Text style={s.quickContactLabel}>TELEFON</Text>
          <Text style={s.quickContactValue}>+90 212 619 20 12</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("mailto:info@tekasfalt.com")}
          style={s.quickContactItem}
        >
          <Ionicons name="mail" size={21} color={C.orange} />
          <Text style={s.quickContactLabel}>E-POSTA</Text>
          <Text style={s.quickContactValue}>info@tekasfalt.com</Text>
        </Pressable>
      </View>
      <View style={s.contactActionRail}><Pressable onPress={() => Linking.openURL("https://wa.link/292g2p")} style={s.contactActionPrimary}><Ionicons name="logo-whatsapp" size={21} color={C.white}/><View><Text style={s.contactActionKicker}>HIZLI YANIT</Text><Text style={s.contactActionTitle}>WhatsApp satış desteği</Text></View><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable><Pressable onPress={() => navigateTab("quote")} style={s.contactActionSecondary}><Ionicons name="document-text-outline" size={20} color={C.orange}/><Text style={s.contactActionSecondaryText}>Proje teklifi oluştur</Text><Ionicons name="arrow-forward" size={17} color={C.navy}/></Pressable></View>
      {false && <View style={s.quoteFormCard}>
        <Text style={s.eyebrow}>PROJE TEKLİFİ</Text><Text style={s.quoteFormTitle}>Tek talep, tam kapsam.</Text><Text style={s.quoteFormIntro}>Metraj, ürün ve opsiyonel saha işlerini birlikte iletin. Satış ekibimiz projeye özel teklif hazırlasın.</Text>
        {[["Ad Soyad","name"],["Firma adı","company"],["Telefon","phone"],["E-posta","email"],["Şehir / Proje konumu","city"],["Tahmini tonaj","tonnage"]].map(([placeholder,key])=><TextInput key={key} value={(quoteForm as any)[key]} onChangeText={value=>setQuoteForm(current=>({...current,[key]:value}))} placeholder={placeholder} placeholderTextColor="#71809A" keyboardType={key==="phone"||key==="tonnage"?"phone-pad":key==="email"?"email-address":"default"} autoCapitalize={key==="email"?"none":"sentences"} style={s.quoteInput}/>)}
        <Text style={s.quoteFieldLabel}>ASFALT TÜRÜ</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quoteProductRow}>{ASPHALT_PRODUCTS.map(product=><Pressable key={product} onPress={()=>setQuoteForm(current=>({...current,product}))} style={[s.quoteProductChip,quoteForm.product===product&&s.quoteProductChipActive]}><Text style={[s.quoteProductText,quoteForm.product===product&&s.quoteProductTextActive]}>{product}</Text></Pressable>)}</ScrollView>
        <Text style={s.quoteFieldLabel}>OPSİYONEL SAHA İŞLERİ</Text><View style={s.quoteServiceGrid}>{PROJECT_SERVICES.map(service=>{const active=calcServices.includes(service.id);return <Pressable key={service.id} onPress={()=>toggleCalcService(service.id)} style={[s.quoteServiceChip,active&&s.quoteServiceChipActive]}><Ionicons name={active?"checkmark-circle":"add-circle-outline"} size={15} color={active?C.white:"#91A0B8"}/><Text style={[s.quoteServiceText,active&&s.quoteServiceTextActive]}>{service.title}</Text></Pressable>})}</View>
        <TextInput value={quoteForm.note} onChangeText={note=>setQuoteForm(current=>({...current,note}))} placeholder="Proje açıklaması, teslimat tarihi ve diğer notlar" placeholderTextColor="#71809A" multiline style={[s.quoteInput,s.quoteNote]}/>
        {!!authError&&<Text style={s.quoteError}>{authError}</Text>}{!!quoteSuccess&&<View style={s.quoteSuccess}><Ionicons name="checkmark-circle" size={20} color="#19A66A"/><Text style={s.quoteSuccessText}>{quoteSuccess}</Text></View>}
        <Pressable onPress={submitQuote} disabled={quoteBusy} style={s.quoteSubmit}><Text style={s.quoteSubmitText}>{quoteBusy?"Gönderiliyor…":"Teklif talebi gönder"}</Text><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
      </View>}
      <Text style={s.locationsTitle}>LOKASYONLARIMIZ</Text>
      {[
        {
          title: "MERKEZ OFİS",
          name: "Esenler",
          address: "Tekstilkent Koza Plaza, B Block Hat 28 No:105 · 34235 Esenler, İstanbul",
          hours: "Pzt–Cum 10:00–15:00",
          route: "Tekstilkent Koza Plaza B Block Hat 28 No 105 Esenler İstanbul",
        },
        {
          title: "ÜRETİM TESİSİ",
          name: "Sultangazi",
          address: "Cebeci Mahallesi, 2806. Sokak No:30 · 34265 Sultangazi, İstanbul",
          hours: "Pzt–Cum 08:00–17:15",
          route: "Cebeci Mahallesi 2806 Sokak No 30 Sultangazi İstanbul",
        },
        {
          title: "ÜRETİM TESİSİ",
          name: "Silivri",
          address: "Kadıköy Mahallesi Asaf Sokak No:30-32 · 34570 Silivri, İstanbul",
          hours: "Pzt–Cum 08:00–17:15",
          route: "Kadıköy Mahallesi Asaf Sokak No 30 Silivri İstanbul",
        },
      ].map((location) => (
        <View key={location.name} style={s.locationCard}>
          <View style={s.locationIcon}>
            <Ionicons name="location" size={20} color={C.orange} />
          </View>
          <View style={s.locationCopy}>
            <Text style={s.locationType}>{location.title}</Text>
            <Text style={s.locationName}>{location.name}</Text>
            <Text style={s.locationAddress}>{location.address}</Text>
            <Text style={s.locationHours}>{location.hours}</Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.route)}`)}
            style={s.locationRoute}
          >
            <Ionicons name="navigate" size={18} color={C.white} />
            <Text style={s.locationRouteText}>Rota</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );

  const Portal = () => {
    const prices = [
      ["Aşınma Tabakası Tip-1", 2606, 2916],
      ["Aşınma Tabakası Tip-2", 2697, 3039],
      ["Aşınma Tabakası Tip-3", 2850, 3161],
      ["Sıfır Asfalt", 3125, 3436],
      ["Binder Tabakası", 2453, 2764],
      ["Bitümlü Temel", 2362, 2672],
      ["Poroz Asfalt", 2534, 3170],
      ["Plentmiks", 0, 800],
    ] as const;
    const selectedPrices = prices.filter(([name]) => priceBasket[name] !== undefined);
    const totalTonnage = selectedPrices.reduce((sum, [name]) => sum + (Number(priceBasket[name]) || 0), 0);
    const subtotal = selectedPrices.reduce((sum, [name, sultangazi, silivri]) => sum + (Number(priceBasket[name]) || 0) * (pricePlant === "sultangazi" ? sultangazi : silivri), 0);
    const vat = subtotal * 0.2;
    const liveBitumenRate = Number(market.bitumen.replace(/\./g, "").replace(",", ".")) || 0;
    const liveBitumenVatAmount = liveBitumenRate * (market.bitumenVat / 100);
    const liveBitumenVatIncluded = liveBitumenRate + liveBitumenVatAmount;
    const truckCount = totalTonnage > 0 ? Math.ceil(totalTonnage / Math.max(1, Number(truckCapacity) || 25)) : 0;
    if (!isLoggedIn) {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.portalAuthPage}
        >
          <ScrollView
            contentContainerStyle={s.portalAuthInner}
            keyboardShouldPersistTaps="handled"
          >
            <TekAsfaltLogo style={s.portalLogo} />
            <View style={s.portalSecurityRow}>
              <View style={s.portalLockIcon}>
                <Ionicons
                  name={authMode === "otp" ? "shield-checkmark" : "lock-closed"}
                  size={24}
                  color={C.white}
                />
              </View>
              <View style={s.securePill}>
                <View style={s.secureDot} />
                <Text style={s.securePillText}>GÜVENLİ ERİŞİM</Text>
              </View>
            </View>
            <Text style={s.portalEyebrow}>TEK ASFALT MÜŞTERİ PORTALI</Text>
            <Text style={s.portalAuthTitle}>
              {authMode === "login"
                ? "E-posta koduyla güvenli giriş."
                : authMode === "register"
                  ? "Müşteri hesabı oluşturun."
                  : authMode === "otp"
                    ? "E-postanızı doğrulayın."
                    : "E-postanızı doğrulayın."}
            </Text>
            <Text style={s.portalAuthText}>
              {authMode === "otp"
                ? `${authEmail} adresine gönderilen 6 haneli kodu girin. iPhone kodu klavyenin üzerinde önerebilir.`
                : "Güncel fiyatlar, teknik belgeler ve güvenlik bilgi formları kayıtlı müşterilere özeldir."}
            </Text>
            {authMode === "otp" ? (
              <>
                <RNTextInput
                  ref={otpInputRef}
                  value={otpCode}
                  onChangeText={(value) => {
                    setAuthError("");
                    setOtpCode(value.replace(/\D/g, "").slice(0, 6));
                  }}
                  onFocus={() => setOtpFocused(true)}
                  onBlur={() => setOtpFocused(false)}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={6}
                  style={s.otpInput}
                />
                <Pressable onPress={() => otpInputRef.current?.focus()} style={s.otpBoxes}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        s.otpBox,
                        otpCode[index] && s.otpBoxFilled,
                        otpFocused && index === otpCode.length && s.otpBoxActive,
                        !!authError && s.otpBoxError,
                      ]}
                    >
                      {otpCode[index] ? <Text style={s.otpDigit}>{otpCode[index]}</Text> : otpFocused && index === otpCode.length ? <View style={s.otpCaret} /> : null}
                    </View>
                  ))}
                </Pressable>
                <View style={s.otpMetaRow}>
                  <Text style={[s.otpMeta, otpSeconds <= 0 && s.otpMetaExpired]}>
                    {authBusy ? "Kod gönderiliyor…" : otpSeconds > 0
                      ? `Kod ${otpTime} dakika geçerli`
                      : "Kodun süresi doldu"}
                  </Text>
                  <Pressable onPress={() => sendEmailCode(otpPurpose)} disabled={authBusy}>
                    <Text style={s.otpResend}>Kodu tekrar gönder</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {authMode === "register" && (
                  <>
                    <View style={s.portalInputRow}>
                      <Ionicons name="person-outline" size={19} color="#9EABC0" />
                      <TextInput value={authName} onChangeText={setAuthName} placeholder="Ad Soyad" placeholderTextColor="#758198" style={s.portalInputWithIcon} />
                    </View>
                    <View style={s.portalInputRow}>
                      <Ionicons name="business-outline" size={19} color="#9EABC0" />
                      <TextInput value={authCompany} onChangeText={setAuthCompany} placeholder="Firma adı" placeholderTextColor="#758198" style={s.portalInputWithIcon} />
                    </View>
                    <View style={s.phoneField}>
                      <Ionicons name="call-outline" size={19} color="#9EABC0" />
                      <Text style={s.phonePrefix}>+90</Text>
                      <TextInput
                        value={formatTurkishMobile(authPhone)}
                        onChangeText={value=>setAuthPhone(formatTurkishMobile(value))}
                        placeholder="5XX XXX XX XX"
                        placeholderTextColor="#758198"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        maxLength={13}
                        style={s.phoneInput}
                      />
                    </View>
                  </>
                )}
                <View style={s.portalInputRow}>
                  <Ionicons name="mail-outline" size={19} color="#9EABC0" />
                  <TextInput value={authEmail} onChangeText={setAuthEmail} placeholder="Kurumsal e-posta" placeholderTextColor="#758198" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" style={s.portalInputWithIcon} />
                </View>
              </>
            )}
            {!!authError && <Text style={s.authError}>{authError}</Text>}
            <Pressable
              onPress={() =>
                authMode === "otp"
                  ? verifyEmailCode()
                  : sendEmailCode(authMode === "register" ? "register" : "login")
              }
              disabled={authBusy || (authMode === "otp" && otpSeconds <= 0)}
              style={[
                s.portalPrimaryButton,
                authMode === "otp" && otpSeconds <= 0 && s.portalPrimaryButtonDisabled,
              ]}
            >
              <Ionicons
                name={authMode === "register" ? "person-add-outline" : authMode === "otp" ? "shield-checkmark-outline" : "mail-outline"}
                size={19}
                color={C.white}
                style={s.portalPrimaryIcon}
              />
              <Text style={s.portalPrimaryText}>
                {authMode === "login"
                  ? authBusy ? "Gönderiliyor…" : "E-posta kodu gönder"
                  : authMode === "register"
                    ? authBusy ? "Hesap oluşturuluyor…" : "E-posta doğrulama kodu gönder"
                    : authMode === "otp"
                      ? otpSeconds <= 0
                        ? "Yeni kod isteyin"
                        : otpPurpose === "register"
                          ? "Hesabı doğrula"
                          : "E-posta koduyla giriş yap"
                      : "Tek kullanımlık kod gönder"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </Pressable>
            <View style={s.portalAuthLinks}>
              <Pressable
                onPress={() => {
                  setAuthMode(
                    authMode === "register" || authMode === "otp"
                      ? "login"
                      : "register",
                  );
                  setAuthError("");
                }}
              >
                <View style={s.portalAuthLinkInner}>
                  <Ionicons name={authMode === "login" ? "person-add-outline" : "arrow-back-outline"} size={16} color="#AAB5C9" />
                  <Text style={s.portalAuthLink}>
                  {authMode === "register"
                    ? "Zaten hesabım var"
                    : authMode === "otp"
                      ? "Giriş ekranına dön"
                      : "Yeni müşteri kaydı"}
                  </Text>
                </View>
              </Pressable>
              <View style={s.portalAuthHintInner}><Ionicons name="lock-open-outline" size={14} color="#758198"/><Text style={s.portalAuthHint}>Şifre gerekmez</Text></View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }
    if (portalView !== "dashboard") {
      const pageTitle = {orders:"Teklif ve siparişler",profile:"Profilim",notifications:"Bildirimler",settings:"Ayarlar",help:"Yardım Merkezi",security:"Giriş ve güvenlik",privacy:"Veriler ve gizlilik"}[portalView];
      const preferenceRows = [
        ["quotes","Teklif güncellemeleri","Teklifiniz hazırlandığında veya durumu değiştiğinde","document-text-outline"],
        ["prices","Fiyat listesi","Yeni fiyat listesi yayınlandığında","pricetag-outline"],
        ["shipments","Üretim ve sevkiyat","Planlama ve sevkiyat bilgilendirmeleri","truck-outline"],
        ["campaigns","Ürün duyuruları","Yeni ürün ve kampanya haberleri","megaphone-outline"],
      ] as const;
      const helpItems = [
        {q:"Nasıl teklif talebi oluştururum?",a:"Alt menüden “Teklif”e dokunun. Proje konumu, ürün, tahmini tonaj ve iletişim bilgilerinizi girin. Gerekirse saha fotoğraflarını ekleyip talebi gönderin. Talebiniz satış ekibimize ulaştığında kayıtlı e-posta adresinize bilgi gönderilir."},
        {q:"Güncel fiyat listesini nerede bulurum?",a:"Müşteri Portalı ana ekranındaki “Fiyat Merkezi” bölümünde güncel plent altı fiyatlarını görebilirsiniz. “Müşteriye özel belgeler” alanından güncel fiyat listesini PDF olarak da açabilirsiniz. Fiyatlar KDV ve nakliye hariçtir; kesin fiyat proje koşullarına göre teklif üzerinde bildirilir."},
        {q:"Sipariş ve sevkiyat durumumu nasıl takip ederim?",a:"Müşteri Portalı içindeki “Teklif ve siparişler” bölümünü açın. Onaylanan siparişlerde üretim tesisi, planlanan üretim zamanı ve sevkiyat durumu burada görüntülenir. Acil değişiklikler için canlı destek üzerinden satış ekibine ulaşabilirsiniz."},
        {q:"Hesap bilgilerimi nasıl güncellerim?",a:"Profilim > İletişim bilgileri yolunu izleyin. Ad soyad, firma, telefon, adres ve vergi bilgilerinizi düzenleyip “Bilgileri kaydet” butonuna dokunun. Güvenlik nedeniyle doğrulanmış e-posta adresi bu ekrandan değiştirilemez; değişiklik için destek ekibiyle iletişime geçin."},
        {q:"Bildirimleri nasıl yönetebilirim?",a:"Profilim > Bildirim tercihlerim bölümünden teklif, fiyat listesi, üretim-sevkiyat ve kampanya bildirimlerini ayrı ayrı açıp kapatabilirsiniz. Bildirim alabilmek için iPhone veya Android cihaz ayarlarında TEK ASFALT uygulamasının bildirim izninin de açık olması gerekir."},
        {q:"Tonaj hesabı kesin miktarı gösterir mi?",a:"Tonaj hesaplama aracı girilen uzunluk, genişlik, kalınlık ve yoğunluk değerlerine göre tahmini sonuç üretir. Zemin kaybı, sıkışma, kot farkı ve saha koşulları gerçek ihtiyacı değiştirebilir. Sipariş öncesinde teknik ekibimizin saha kontrolü önerilir."},
        {q:"Fiyatlara nakliye ve KDV dahil mi?",a:"Uygulamadaki liste fiyatları aksi belirtilmedikçe plent teslim, KDV ve nakliye hariçtir. Nakliye; mesafe, araç kapasitesi, bekleme süresi ve saha koşullarına göre ayrıca hesaplanır. Bağlayıcı toplam bedel resmi teklifte yer alır."},
      ];
      const visibleHelpItems = helpItems.filter(item=>`${item.q} ${item.a}`.toLocaleLowerCase("tr-TR").includes(helpQuery.trim().toLocaleLowerCase("tr-TR")));
      return <ScrollView style={[s.portalPage,portalView==="settings"&&s.portalSettingsPage]} contentContainerStyle={[s.portalSubInner,portalView==="profile"&&s.portalProfileInner,portalView==="settings"&&s.portalSettingsInner,portalView==="profile"?{paddingTop:0}:{paddingTop:appHeaderTopInset}]}> 
        <View style={[s.portalSubHeader,portalView==="profile"&&s.portalSubHeaderProfile,portalView==="settings"&&s.portalSettingsHeader,portalView==="profile"&&{minHeight:appHeaderTopInset+64,paddingTop:appHeaderTopInset}]}>
          <AppBackButton onPress={goBackFromPortalView} light={portalView!=="profile"&&portalView!=="settings"} style={portalView==="settings"&&s.portalSettingsBack}/>
          <Text style={[s.portalSubTitle,portalView==="profile"&&s.portalSubTitleDark,portalView==="settings"&&s.portalSettingsTitle]}>{pageTitle}</Text><View style={s.portalSubHeaderSpacer}/>
        </View>
        {portalView === "orders" && <>
          <Text style={s.portalSubIntro}>Talebinizin satış incelemesinden üretim ve sevkiyata kadar güncel durumunu burada takip edebilirsiniz.</Text>
          <View style={s.quoteOverview}>
            <View style={s.quoteOverviewHead}><View><Text style={s.quoteOverviewKicker}>MÜŞTERİ PORTALI</Text><Text style={s.quoteOverviewTitle}>Tekliflerim</Text></View><View style={s.quoteOverviewIcon}><Ionicons name="document-text-outline" size={22} color={C.orange}/></View></View>
            <Text style={s.quoteOverviewText}>Gönderdiğiniz talepleri, hazırlanmış teklifleri ve sevkiyat durumunu tek yerden takip edin.</Text>
            <View style={s.quoteMetricRow}>
              <View style={s.quoteMetric}><Text style={s.quoteMetricValue}>{customerQuotes.length}</Text><Text style={s.quoteMetricLabel}>TOPLAM TALEP</Text></View>
              <View style={s.quoteMetricDivider}/>
              <View style={s.quoteMetric}><Text style={s.quoteMetricValue}>{customerQuotes.filter(quote=>["received","reviewing","quoted"].includes(quote.status)).length}</Text><Text style={s.quoteMetricLabel}>AÇIK İNCELEME</Text></View>
              <View style={s.quoteMetricDivider}/>
              <View style={s.quoteMetric}><Text style={[s.quoteMetricValue,{color:"#198A58"}]}>{customerQuotes.filter(quote=>["approved","production","shipping","completed"].includes(quote.status)).length}</Text><Text style={s.quoteMetricLabel}>İŞLEMDE</Text></View>
            </View>
          </View>
          <View style={s.orderToolbar}><View style={s.orderSearch}><Ionicons name="search-outline" size={18} color="#758198"/><TextInput value={quoteReferenceQuery} onChangeText={setQuoteReferenceQuery} autoCapitalize="characters" placeholder="Referans ara · TA-260722-PPRF2" placeholderTextColor="#8B95A6" style={s.orderSearchInput}/>{quoteReferenceQuery?<Pressable onPress={()=>setQuoteReferenceQuery("")}><Ionicons name="close-circle" size={18} color="#8B95A6"/></Pressable>:null}</View><Pressable onPress={refreshCustomerQuotes} style={s.orderRefresh}><Ionicons name="refresh" size={17} color={C.navy}/><Text style={s.orderRefreshText}>{quotesBusy?"Güncelleniyor…":"Yenile"}</Text></Pressable></View>
          <Text style={s.orderPrivacyHint}>Yalnızca hesabınıza veya doğrulanmış e-posta adresinize bağlı referanslar gösterilir.</Text>
          <View style={s.orderList}>{customerQuotes.filter(quote=>!quoteReferenceQuery.trim()||quote.reference.toLocaleUpperCase("tr-TR").includes(quoteReferenceQuery.trim().toLocaleUpperCase("tr-TR"))).map((quote)=>{
            const statusMap:Record<string,[string,string,string]>={received:["Talep alındı","checkmark-circle-outline","#198A58"],reviewing:["İnceleniyor","search-outline",C.orange],quoted:["Teklif hazır","document-text-outline",C.orange],approved:["Onaylandı","checkmark-done-outline","#198A58"],production:["Üretimde","business-outline",C.navy],shipping:["Sevkiyatta","truck-outline",C.navy],completed:["Tamamlandı","flag-outline","#198A58"],cancelled:["İptal edildi","close-circle-outline","#B42318"],archived:["Arşivde","archive-outline","#64748B"],mail_failed:["Kayıt alındı","alert-circle-outline",C.orange]};
            const [label,icon,color]=statusMap[quote.status]||[quote.status,"time-outline",C.navy];
            const amount=Number(quote.offer_amount||0);
            const preliminaryAmount=Number(quote.preliminary_subtotal||0);
            const preliminaryExpiresAt=quote.preliminary_valid_until?new Date(quote.preliminary_valid_until.replace(" ","T")+"Z"):null;
            const preliminaryExpired=!!preliminaryExpiresAt&&preliminaryExpiresAt.getTime()<=Date.now();
            const open=openCustomerQuoteId===quote.id;
            return <View key={quote.id} style={[s.orderCard,open&&s.orderCardOpen]}>
              <Pressable onPress={()=>setOpenCustomerQuoteId(open?null:quote.id)} style={s.orderAccordionHead}>
                <View style={s.orderAccordionIcon}><Ionicons name="document-text-outline" size={21} color={C.orange}/></View>
                <View style={s.orderAccordionCopy}><Text style={s.orderReference}>{quote.reference}</Text><Text style={s.orderProductCompact}>{quote.product}</Text><Text style={s.orderDate}>{quote.created_at?.slice(0,16).replace("T"," ")}</Text></View>
                <View style={[s.orderStatus,{backgroundColor:`${color}18`}]}><Ionicons name={icon as any} size={15} color={color}/><Text style={[s.orderStatusText,{color}]}>{label}</Text></View>
                <Ionicons name={open?"chevron-up":"chevron-down"} size={19} color="#7A879B"/>
              </Pressable>
              {open&&<View style={s.orderAccordionBody}>
                {quote.tonnage?<View style={s.orderDetailRow}><Ionicons name="speedometer-outline" size={17} color={C.orange}/><Text style={s.orderMeta}>{quote.tonnage} ton</Text></View>:null}
                {quote.project_location?<View style={s.orderDetailRow}><Ionicons name="location-outline" size={17} color={C.orange}/><Text style={s.orderMeta}>{quote.project_location}</Text></View>:null}
                {quote.plant?<View style={s.orderDetailRow}><Ionicons name="business-outline" size={17} color={C.orange}/><Text style={s.orderMeta}>{quote.plant==="silivri"?"Silivri tesisi":"Esenler / Sultangazi tesisi"}</Text></View>:null}
                {preliminaryAmount>0?<View style={[s.orderOffer,preliminaryExpired&&{opacity:.52}]}><View><Text style={s.orderOfferLabel}>{preliminaryExpired?"SÜRESİ DOLAN DİJİTAL ÖN FİYAT":"24 SAATLİK DİJİTAL ÖN FİYAT"}</Text><Text style={s.orderOfferAmount}>{preliminaryAmount.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})} TRY</Text><Text style={s.orderOfferValidity}>KDV, nakliye ve uygulama hariç · bağlayıcı değildir</Text></View><Ionicons name={preliminaryExpired?"lock-closed-outline":"document-text-outline"} size={25} color={preliminaryExpired?"#8D98A9":C.orange}/></View>:null}
                {quote.preliminary_pdf_url&&!preliminaryExpired?<Pressable onPress={()=>Linking.openURL(quote.preliminary_pdf_url!)} style={s.orderPdfButton}><Ionicons name="document-attach-outline" size={17} color={C.white}/><Text style={s.orderPdfButtonText}>Dijital ön fiyat PDF’ini aç</Text></Pressable>:null}
                {amount>0?<View style={s.orderOffer}><View><Text style={s.orderOfferLabel}>KURUMSAL TEKLİF</Text><Text style={s.orderOfferAmount}>{amount.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})} {quote.offer_currency||"TRY"}</Text></View><Ionicons name="document-text-outline" size={25} color={C.orange}/>{quote.offer_valid_until?<Text style={s.orderOfferValidity}>Son geçerlilik{`\n`}{quote.offer_valid_until}</Text>:null}</View>:null}
                {quote.offer_message?<Text style={s.orderOfferMessage}>{quote.offer_message}</Text>:null}
                <View style={s.orderNote}><View style={[s.orderTimelineDot,{backgroundColor:color}]}/><Text style={s.orderNoteText}>{quote.status_note||"Durum güncellemesi bekleniyor."}</Text></View>
                {quote.offer_sent_at?<View style={s.orderMailSent}><Ionicons name="mail-open-outline" size={15} color="#198A58"/><Text style={s.orderMailSentText}>Kurumsal teklif PDF’i kayıtlı e-posta adresinize gönderildi.</Text></View>:null}
                {quote.offer_pdf_url?<Pressable onPress={()=>Linking.openURL(quote.offer_pdf_url!)} style={s.orderPdfButton}><Ionicons name="download-outline" size={17} color={C.white}/><Text style={s.orderPdfButtonText}>Teklif dosyasını aç</Text></Pressable>:null}
                {quote.status === "archived" ? <View style={s.orderArchivedNotice}><Ionicons name="archive-outline" size={17} color="#64748B"/><Text style={s.orderArchivedNoticeText}>Bu teklif arşivde tutuluyor; kayıt silinmedi.</Text></View> : <Pressable onPress={()=>archiveCustomerQuote(quote)} disabled={quoteArchiveBusyId===quote.id} style={[s.orderArchiveButton,quoteArchiveBusyId===quote.id&&{opacity:.55}]}><Ionicons name={quoteArchiveBusyId===quote.id?"hourglass-outline":"trash-outline"} size={17} color="#B42318"/><Text style={s.orderArchiveButtonText}>{quoteArchiveBusyId===quote.id?"Arşivleniyor…":"Teklifi arşive al"}</Text></Pressable>}
              </View>}
            </View>;
          })}{!quotesBusy&&customerQuotes.length===0?<View style={s.orderEmpty}><Ionicons name="document-text-outline" size={30} color="#96A1B2"/><Text style={s.orderEmptyTitle}>Henüz teklif talebiniz yok</Text><Text style={s.orderEmptyText}>Yeni talep oluşturduğunuzda referans ve durum geçmişi burada görünecek.</Text><Pressable onPress={()=>navigateTab("quote")} style={s.orderEmptyButton}><Text style={s.orderEmptyButtonText}>Teklif talebi oluştur</Text></Pressable></View>:null}{!quotesBusy&&customerQuotes.length>0&&customerQuotes.filter(quote=>!quoteReferenceQuery.trim()||quote.reference.toLocaleUpperCase("tr-TR").includes(quoteReferenceQuery.trim().toLocaleUpperCase("tr-TR"))).length===0?<View style={s.orderEmpty}><Ionicons name="search-outline" size={28} color="#96A1B2"/><Text style={s.orderEmptyTitle}>Referans bulunamadı</Text><Text style={s.orderEmptyText}>Bu hesapla eşleşen referans numarasını kontrol edin.</Text></View>:null}</View>
        </>}
        {portalView === "profile" && <>
          <LinearGradient colors={["#14264E","#203B70","#101E3E"]} style={s.paypalProfileCard}>
            <Pressable onPress={pickProfileImage} style={s.paypalAvatarWrap}>
              {customerProfile?.avatar?<Image source={{uri:customerProfile.avatar}} style={s.paypalAvatar}/>:<Text style={s.paypalAvatarText}>{(customerProfile?.name||"TA").split(" ").map(x=>x[0]).join("").slice(0,2)}</Text>}
              <View style={s.paypalAvatarEdit}><Ionicons name="pencil" size={13} color={C.navy}/></View>
            </Pressable>
            <View style={s.paypalProfileNameRow}>
              <Text style={s.paypalProfileName}>{customerProfile?.name||authName}</Text>
              <VerifiedBadge size={19} color={C.white}/>
            </View>
            <Text style={s.paypalProfileMail}>{customerProfile?.email||authEmail}</Text>
            <Text style={s.paypalProfileCompany}>{customerProfile?.company||"Bireysel müşteri"}</Text>
            <View style={s.paypalProfileActions}>
              <Pressable onPress={()=>setProfileEditing(true)} style={s.paypalOutlineButton}><Ionicons name="person-outline" size={18} color={C.white}/><Text style={s.paypalOutlineText}>İletişim bilgileri</Text></Pressable>
              <Pressable onPress={()=>navigatePortalView("security")} style={s.paypalOutlineButton}><Ionicons name="shield-checkmark-outline" size={18} color={C.white}/><Text style={s.paypalOutlineText}>Güvenlik</Text></Pressable>
            </View>
          </LinearGradient>
          {profileEditing && <View style={s.portalInlineEditor}>
            <View style={s.portalInlineEditorHead}><View><Text style={s.portalEyebrow}>FİRMA BİLGİLERİ</Text><Text style={s.portalInlineEditorTitle}>Bilgilerinizi düzenleyin</Text></View><Pressable onPress={()=>setProfileEditing(false)} style={s.portalInlineEditorClose}><Ionicons name="close" size={18} color={C.navy}/></Pressable></View>
            {[["Ad Soyad","name","person-outline"],["Firma adı","company","business-outline"],["Telefon","phone","call-outline"],["Adres","address","location-outline"],["Vergi dairesi","tax_office","receipt-outline"],["Vergi no","tax_number","keypad-outline"]].map(([placeholder,key,icon])=><View key={key} style={s.profileEditInputRow}><Ionicons name={icon as any} size={17} color="#8593AA"/><TextInput value={(profileDraft as any)[key]} onChangeText={value=>setProfileDraft(current=>({...current,[key]:value}))} placeholder={placeholder} placeholderTextColor="#76849A" keyboardType={key==='phone'||key==='tax_number'?'phone-pad':'default'} style={s.profileEditInput}/></View>)}
            <Pressable onPress={saveProfile} disabled={profileBusy} style={s.profileSaveButton}><Text style={s.profileSaveButtonText}>{profileBusy?"Kaydediliyor…":"Bilgileri kaydet"}</Text><Ionicons name="checkmark" size={18} color={C.white}/></Pressable>
          </View>}
          <Text style={s.portalGroupTitle}>Profil ve destek</Text>
          <View style={s.portalMenuGroup}>
            {[["Firma bilgilerim","Firma, telefon ve teslimat bilgileri","business-outline",()=>setProfileEditing(true)],["Tekliflerim","Gönderdiğiniz talepler ve güncel durumları","document-text-outline",()=>navigatePortalView("orders")],["Dil tercihi",languageLabel,"language-outline",()=>setLanguageChoiceOpen(true)],["Bildirim tercihlerim","Teklif ve sevkiyat güncellemeleri","notifications-outline",()=>navigatePortalView("notifications")],["Giriş ve güvenlik","Doğrulanmış e-posta ve erişim","shield-checkmark-outline",()=>navigatePortalView("security")],["Veriler ve gizlilik","Hesap verileriniz ve izinler","eye-outline",()=>navigatePortalView("privacy")],["Yardım Merkezi","Sık sorulan sorular ve canlı destek","help-circle-outline",()=>navigatePortalView("help")]] .map(([label,meta,icon,action]:any)=><Pressable key={label} onPress={action} style={s.portalProfileMenuRow}><View style={s.portalProfileMenuIcon}><Ionicons name={icon} size={19} color={C.orange}/></View><View style={s.portalProfileMenuCopy}><Text style={s.portalProfileMenuTitle}>{label}</Text><Text style={s.portalPlainRowMeta}>{meta}</Text></View><Ionicons name="chevron-forward" size={17} color="#8B95A6"/></Pressable>)}
          </View>
          <Pressable onPress={logoutCustomer} style={s.portalLogoutWide}><Ionicons name="log-out-outline" size={20} color="#B42318"/><Text style={s.portalLogoutWideText}>Çıkış yap</Text></Pressable>
        </>}
        {portalView === "notifications" && <>
          <View style={s.portalNotificationHero}><View style={s.portalNotificationHeroIcon}><Ionicons name="notifications-outline" size={24} color={C.orange}/></View><View style={s.portalNotificationHeroCopy}><Text style={s.portalNotificationHeroTitle}>Bildirimlerinizi yönetin</Text><Text style={s.portalNotificationHeroText}>Teklif, fiyat ve sevkiyat güncellemelerini seçin.</Text></View></View>
          <View style={s.portalMenuGroup}>{preferenceRows.map(([key,title,meta,icon])=>{
            const active=notificationPrefs[key];
            return <Pressable key={key} onPress={()=>setNotificationPrefs(current=>({...current,[key]:!current[key]}))} style={s.portalPreferenceRow}>
              <View style={s.portalPreferenceIcon}><Ionicons name={icon as any} size={21} color={C.navy}/></View><View style={s.portalPreferenceCopy}><Text style={s.portalPlainRowText}>{title}</Text><Text style={s.portalPlainRowMeta}>{meta}</Text></View>
              <View style={[s.portalNotificationSwitch,active&&s.portalNotificationSwitchActive]}><View style={[s.portalNotificationSwitchKnob,active&&s.portalNotificationSwitchKnobActive]}/></View>
            </Pressable>})}</View>
          <View style={s.portalInfoNote}><Ionicons name="shield-checkmark-outline" size={20} color="#19856A"/><Text style={s.portalInfoNoteText}>Bildirim izinleri cihaz ayarlarından da açık olmalıdır. Pazarlama tercihini dilediğiniz zaman kapatabilirsiniz.</Text></View>
        </>}
        {portalView === "settings" && <>
          <Text style={s.portalSettingsGroupTitle}>HESAP AYARLARI</Text>
          <View style={s.portalSettingsGroup}>
            {[
              ["Firma ve iletişim bilgilerim","business-outline",()=>{navigatePortalView("profile");setProfileEditing(true)}],
              ["Giriş ve güvenlik","shield-checkmark-outline",()=>navigatePortalView("security")],
              ["Konum ve teslimat adresleri","location-outline",()=>navigatePortalView("profile")],
            ].map(([label,icon,action]:any)=><Pressable key={label} onPress={action} style={s.portalSettingsRow}><Ionicons name={icon} size={21} color="#858585"/><Text style={s.portalSettingsRowText}>{label}</Text><Ionicons name="chevron-forward" size={18} color="#858585"/></Pressable>)}
          </View>
          <Text style={s.portalSettingsGroupTitle}>UYGULAMA</Text>
          <View style={s.portalSettingsGroup}>
            <Pressable onPress={()=>navigatePortalView("notifications")} style={s.portalSettingsRow}><Ionicons name="notifications-outline" size={21} color="#858585"/><Text style={s.portalSettingsRowText}>Mobil bildirimler</Text><View style={s.portalSettingsToggle}><View style={s.portalSettingsToggleKnob}/></View></Pressable>
            <Pressable onPress={()=>setLanguageChoiceOpen(true)} style={s.portalSettingsRow}><Ionicons name="language-outline" size={21} color="#858585"/><Text style={s.portalSettingsRowText}>Dil</Text><Text style={s.portalSettingsValue}>{languageLabel}</Text><Ionicons name="chevron-forward" size={18} color="#858585"/></Pressable>
            <Pressable onPress={()=>navigatePortalView("help")} style={s.portalSettingsRow}><Ionicons name="information-circle-outline" size={21} color="#858585"/><Text style={s.portalSettingsRowText}>Tek Asfalt hakkında</Text><Ionicons name="chevron-forward" size={18} color="#858585"/></Pressable>
            <Pressable onPress={()=>navigatePortalView("privacy")} style={s.portalSettingsRow}><Ionicons name="eye-outline" size={21} color="#858585"/><Text style={s.portalSettingsRowText}>Veriler ve gizlilik</Text><Ionicons name="chevron-forward" size={18} color="#858585"/></Pressable>
          </View>
          <Pressable onPress={logoutCustomer} style={s.portalSettingsLogout}><Ionicons name="log-out-outline" size={21} color="#A0A0A0"/><Text style={s.portalSettingsLogoutText}>Çıkış yap</Text><Ionicons name="chevron-forward" size={18} color="#858585"/></Pressable>
        </>}
        {portalView === "security" && <><Text style={s.portalSubIntro}>Hesabınız parola yerine e-posta adresinize gönderilen tek kullanımlık kodla korunur.</Text><View style={s.portalMenuGroup}><View style={s.portalPreferenceRow}><Ionicons name="mail-outline" size={22} color={C.navy}/><View style={s.portalPreferenceCopy}><Text style={s.portalPlainRowText}>Doğrulanmış e-posta</Text><Text style={s.portalPlainRowMeta}>{customerProfile?.email||authEmail}</Text></View><Ionicons name="checkmark-circle" size={23} color="#19A66A"/></View><View style={s.portalPreferenceRow}><Ionicons name="shield-checkmark-outline" size={22} color={C.navy}/><View style={s.portalPreferenceCopy}><Text style={s.portalPlainRowText}>Tek kullanımlık kod</Text><Text style={s.portalPlainRowMeta}>Her girişte 10 dakika geçerli güvenlik kodu</Text></View></View></View></>}
        {portalView === "privacy" && <><Text style={s.portalSubIntro}>Kişisel bilgileriniz teklif, sipariş, sevkiyat ve müşteri desteği süreçlerinin yürütülmesi için güvenli biçimde işlenir.</Text><View style={s.portalMenuGroup}><View style={s.portalPreferenceRow}><Ionicons name="eye-off-outline" size={22} color={C.navy}/><View style={s.portalPreferenceCopy}><Text style={s.portalPlainRowText}>Veri gizliliği</Text><Text style={s.portalPlainRowMeta}>Bilgileriniz yetkisiz üçüncü kişilerle paylaşılmaz.</Text></View></View><View style={s.portalPreferenceRow}><Ionicons name="trash-outline" size={22} color={C.navy}/><View style={s.portalPreferenceCopy}><Text style={s.portalPlainRowText}>Hesap ve veri talebi</Text><Text style={s.portalPlainRowMeta}>Silme veya bilgi talebi için uygulamadaki İletişim bölümünü kullanın.</Text></View></View></View></>}
        {portalView === "help" && <>
          <View style={s.portalFaqHero}><Text style={s.portalFaqHeroTitle}>Sık sorulan{`\n`}sorular</Text><Text style={s.portalFaqHeroText}>Tek Asfalt hakkında en çok merak edilenlerin yanıtları.</Text></View>
          <View style={s.portalSearchFake}><Ionicons name="search" size={20} color="#788496"/><TextInput value={helpQuery} onChangeText={setHelpQuery} placeholder="Sık sorulan sorularda ara" placeholderTextColor="#788496" style={s.portalSearchInput}/>{helpQuery?<Pressable onPress={()=>setHelpQuery("")}><Ionicons name="close-circle" size={19} color="#8B95A6"/></Pressable>:null}</View>
          <Text style={s.portalFaqSectionTitle}>KONULAR</Text>
          <View style={s.portalFaqList}>{visibleHelpItems.map(item=>{
            const expanded=openHelpQuestion===item.q;
            return <View key={item.q} style={s.portalFaqItem}><Pressable onPress={()=>setOpenHelpQuestion(expanded?null:item.q)} style={s.portalFaqQuestion}><Text style={s.portalFaqQuestionText}>{item.q}</Text><Ionicons name={expanded?"remove":"add"} size={20} color={expanded?C.orange:"#748097"}/></Pressable>{expanded?<View style={s.portalFaqAnswer}><Text style={s.portalFaqAnswerText}>{item.a}</Text></View>:null}</View>})}{visibleHelpItems.length===0?<View style={s.portalFaqEmpty}><Ionicons name="search-outline" size={25} color="#9AA5B5"/><Text style={s.portalFaqEmptyText}>Aramanızla eşleşen bir yardım konusu bulunamadı.</Text></View>:null}</View>
          <Pressable onPress={()=>Linking.openURL("https://wa.link/292g2p")} style={s.portalHelpCta}><Ionicons name="logo-whatsapp" size={22} color={C.white}/><View><Text style={s.portalHelpCtaTitle}>Canlı destek</Text><Text style={s.portalHelpCtaMeta}>Satış ekibimize WhatsApp'tan ulaşın</Text></View></Pressable>
        </>}
      </ScrollView>;
    }
    return (
      <ScrollView style={s.portalPage} contentContainerStyle={[s.portalInner,{paddingTop:appHeaderTopInset}]}>
        <View style={s.portalHeader}>
          <AppBackButton onPress={goBack} light/>
          <Text style={s.portalTitle}>Müşteri Portalı</Text>
          <Pressable
            onPress={logoutCustomer}
            style={s.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color={C.navy} />
          </Pressable>
        </View>
        <LinearGradient colors={["#14264E", "#203B70", "#0C172E"]} style={s.profileHero}>
          <View style={s.profileHeroTop}>
            <Pressable onPress={pickProfileImage} style={s.profileAvatarWrap} disabled={profileBusy}>
              {customerProfile?.avatar ? (
                <Image source={{ uri: customerProfile.avatar }} style={s.profileAvatar} />
              ) : (
                <Text style={s.profileInitials}>{(customerProfile?.name || "TA").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()}</Text>
              )}
              <View style={s.profileCamera}><Ionicons name="camera" size={13} color={C.white} /></View>
            </Pressable>
            <View style={s.profileIdentity}>
              <Text style={s.profileWelcome}>HOŞ GELDİNİZ</Text>
              <View style={s.profileNameRow}>
                <Text style={s.profileName}>{customerProfile?.name || authName || "Tek Asfalt Müşterisi"}</Text>
                <VerifiedBadge size={18}/>
              </View>
              <Text style={s.profileCompany}>{customerProfile?.company || authCompany}</Text>
            </View>
            <View style={s.profileVerified}><Ionicons name="checkmark" size={14} color={C.white} /></View>
          </View>
          <View style={s.profileContactRow}>
            <View style={s.profileContact}><Ionicons name="mail-outline" size={15} color="#AFC0DE" /><Text style={s.profileContactText}>{customerProfile?.email || authEmail}</Text></View>
            <View style={s.profileContact}><Ionicons name="call-outline" size={15} color="#AFC0DE" /><Text style={s.profileContactText}>{customerProfile?.phone || authPhone}</Text></View>
          </View>
        </LinearGradient>
        {customerProfile?.is_admin && (
          <View style={s.mobileAdminPanel}>
            <View style={s.mobileAdminHead}><View style={s.mobileAdminBadge}><Ionicons name="shield-checkmark" size={18} color={C.white}/></View><View style={s.mobileAdminHeadCopy}><Text style={s.mobileAdminKicker}>YETKİLİ YÖNETİCİ</Text><Text style={s.mobileAdminTitle}>Yayın ve bildirim merkezi</Text></View></View>
            <Text style={s.mobileAdminIntro}>Bu alan yalnızca cihat@tekasfalt.com hesabına açıktır. Güncel fiyat PDF’ini yayınlayabilir ve kayıtlı müşterilere bildirim gönderebilirsiniz.</Text>
            {!!adminNotice && <View style={s.mobileAdminSuccess}><Ionicons name="checkmark-circle" size={17} color="#138A55"/><Text style={s.mobileAdminSuccessText}>{adminNotice}</Text></View>}
            <Pressable onPress={uploadAdminPricePdf} disabled={adminBusy} style={s.mobileAdminUpload}><Ionicons name="cloud-upload-outline" size={22} color={C.orange}/><View style={s.mobileAdminUploadCopy}><Text style={s.mobileAdminUploadTitle}>{adminBusy ? "İşleniyor…" : "Güncel fiyat listesini yükle"}</Text><Text style={s.mobileAdminUploadMeta}>PDF · En fazla 8 MB · Önceki belgenin yerini alır</Text></View><Ionicons name="chevron-forward" size={17} color="#7B8799"/></Pressable>
            <View style={s.mobileAdminDivider}/>
            <Text style={s.mobileAdminFieldLabel}>PUSH BİLDİRİMİ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 10 }}>
              {([['quotes','Teklif'],['prices','Fiyat'],['shipments','Sevkiyat'],['campaigns','Duyuru']] as const).map(([key,label])=><Pressable key={key} onPress={()=>setPushCategory(key)} style={{ paddingHorizontal: 13, height: 34, borderRadius: 17, alignItems:'center', justifyContent:'center', backgroundColor:pushCategory===key?C.navy:'#EEF1F5' }}><Text style={{ color:pushCategory===key?C.white:C.navy, fontFamily:VODAFONE_BOLD, fontSize:10 }}>{label}</Text></Pressable>)}
            </ScrollView>
            <TextInput value={pushTitle} onChangeText={setPushTitle} maxLength={80} placeholder="Bildirim başlığı" placeholderTextColor="#8490A2" style={s.mobileAdminInput}/>
            <TextInput value={pushMessage} onChangeText={setPushMessage} maxLength={600} multiline placeholder="Müşterilere gönderilecek mesaj" placeholderTextColor="#8490A2" style={[s.mobileAdminInput,s.mobileAdminMessage]}/>
            <Pressable onPress={sendAdminPush} disabled={adminBusy} style={s.mobileAdminSend}><Text style={s.mobileAdminSendText}>{adminBusy ? "Gönderiliyor…" : "Bildirimi gönder"}</Text><Ionicons name="paper-plane" size={17} color={C.white}/></Pressable>
          </View>
        )}
        {!!authError && <Text style={s.profileError}>{authError}</Text>}
        <View style={s.profileEditorCard}>
          <View style={s.profileEditorHead}><View><Text style={s.portalEyebrow}>HESAP BİLGİLERİ</Text><Text style={s.profileEditorTitle}>Firma profiliniz</Text></View><Pressable onPress={()=>setProfileEditing(current=>!current)} style={s.profileEditButton}><Ionicons name={profileEditing?"close":"create-outline"} size={17} color={C.orange}/><Text style={s.profileEditButtonText}>{profileEditing?"Vazgeç":"Düzenle"}</Text></Pressable></View>
          {profileEditing ? <>
            {[['Ad Soyad','name','person-outline'],['Firma adı (isteğe bağlı)','company','business-outline'],['Telefon (isteğe bağlı)','phone','call-outline'],['Adres (isteğe bağlı)','address','location-outline'],['Vergi dairesi (isteğe bağlı)','tax_office','receipt-outline'],['Vergi no (isteğe bağlı)','tax_number','keypad-outline']].map(([placeholder,key,icon])=><View key={key} style={s.profileEditInputRow}><Ionicons name={icon as any} size={17} color="#8593AA"/><TextInput value={(profileDraft as any)[key]} onChangeText={value=>setProfileDraft(current=>({...current,[key]:value}))} placeholder={placeholder} placeholderTextColor="#76849A" keyboardType={key==='phone'||key==='tax_number'?'phone-pad':'default'} style={s.profileEditInput}/></View>)}
            <View style={s.profileEmailLocked}><Ionicons name="lock-closed-outline" size={15} color="#8593AA"/><View><Text style={s.profileEmailLabel}>DOĞRULANMIŞ E-POSTA</Text><Text style={s.profileEmailValue}>{customerProfile?.email||authEmail}</Text></View></View>
            <Pressable onPress={saveProfile} disabled={profileBusy} style={s.profileSaveButton}><Text style={s.profileSaveButtonText}>{profileBusy?"Kaydediliyor…":"Bilgileri kaydet"}</Text><Ionicons name="checkmark" size={18} color={C.white}/></Pressable>
          </> : <View style={s.profileSummaryGrid}>
            {[['Firma',customerProfile?.company,'business-outline'],['Telefon',customerProfile?.phone,'call-outline'],['Adres',customerProfile?.address,'location-outline'],['Vergi bilgisi',[customerProfile?.tax_office,customerProfile?.tax_number].filter(Boolean).join(' · '),'receipt-outline']].map(([label,value,icon])=><View key={label as string} style={s.profileSummaryItem}><Ionicons name={icon as any} size={17} color={C.orange}/><View style={s.profileSummaryCopy}><Text style={s.profileSummaryLabel}>{label}</Text><Text style={s.profileSummaryValue}>{value||'Eklenmedi'}</Text></View></View>)}
          </View>}
        </View>
        <View style={s.portalStatsRow}>
          <View style={s.portalStatCard}><Ionicons name="finger-print-outline" size={22} color={C.orange} /><Text style={s.portalStatValue}>{customerProfile?.login_count || 0}</Text><Text style={s.portalStatLabel}>GÜVENLİ GİRİŞ</Text></View>
          <View style={s.portalStatCard}><Ionicons name="shield-checkmark-outline" size={22} color="#19A66A" /><Text style={s.portalStatValue}>Aktif</Text><Text style={s.portalStatLabel}>HESAP DURUMU</Text></View>
          <View style={s.portalStatCard}><Ionicons name="calendar-outline" size={22} color={C.navy} /><Text style={s.portalStatValueSmall}>{customerProfile?.last_login ? customerProfile.last_login.slice(5, 10).replace("-", ".") : "İlk giriş"}</Text><Text style={s.portalStatLabel}>SON ERİŞİM</Text></View>
        </View>
        <View style={s.portalQuickGrid}>
          <Pressable onPress={()=>navigateTab("calculator")} style={s.portalQuickPrimary}><Ionicons name="add" size={22} color={C.white}/><View><Text style={s.portalQuickKicker}>HIZLI İŞLEM</Text><Text style={s.portalQuickTitle}>Yeni teklif oluştur</Text></View><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
          <Pressable onPress={()=>Linking.openURL("https://wa.link/292g2p")} style={s.portalSupport}><Ionicons name="logo-whatsapp" size={21} color="#1EAD61"/><Text style={s.portalSupportText}>Satış desteği</Text></Pressable>
        </View>
        <Pressable onPress={()=>navigatePortalView("orders")} style={s.portalActivityCard}>
          <View style={s.portalActivityHead}><View><Text style={s.portalEyebrow}>İŞLEM MERKEZİ</Text><Text style={s.portalActivityTitle}>Teklif ve siparişler</Text></View><Text style={s.portalActivityAll}>Tümünü gör</Text></View>
          {[{label:"Aktif teklif talepleri",value:String(customerQuotes.filter(q=>!["completed","cancelled"].includes(q.status)).length),icon:"document-text-outline"},{label:"Hazır ve onaylanan teklifler",value:String(customerQuotes.filter(q=>["quoted","approved"].includes(q.status)).length),icon:"time-outline"},{label:"Devam eden sevkiyat",value:String(customerQuotes.filter(q=>q.status==="shipping").length),icon:"navigate-circle-outline"},{label:"Belgeler",value:String(customerDocuments.filter(d=>d.available).length),icon:"folder-open-outline"}].map(item=><View key={item.label} style={s.portalActivityRow}><View style={s.portalActivityIcon}><Ionicons name={item.icon as any} size={18} color={C.orange}/></View><Text style={s.portalActivityLabel}>{item.label}</Text><Text style={s.portalActivityValue}>{item.value}</Text><Ionicons name="chevron-forward" size={15} color="#9AA5B5"/></View>)}
        </Pressable>
        <Text style={s.portalGroupTitle}>Profil ve destek</Text>
        <View style={s.portalMenuGroup}>
          {[
            ["Profilim","person-outline","profile"],
            ["Bildirim tercihlerim","notifications-outline","notifications"],
            ["Veriler ve gizlilik","eye-outline","privacy"],
            ["Yardım Merkezi","help-circle-outline","help"],
          ].map(([label,icon,view])=><Pressable key={label} onPress={()=>navigatePortalView(view as PortalView)} style={s.portalPlainRow}><Ionicons name={icon as any} size={22} color={C.navy}/><Text style={s.portalPlainRowText}>{label}</Text><Ionicons name="chevron-forward" size={17} color="#8B95A6"/></Pressable>)}
        </View>
        <View style={s.portalSectionHead}>
          <View><Text style={s.portalEyebrow}>FİYAT MERKEZİ</Text><Text style={s.portalSectionTitle}>{market.bitumenDate}</Text></View>
          <View style={s.portalLivePill}><View style={s.portalLiveDot} /><Text style={s.portalLiveText}>{market.bitumenLive ? "CANLI" : "GÜNCEL"}</Text></View>
        </View>
        <View style={s.priceSummary}>
          <View>
            <Text style={s.priceSummaryLabel}>BİTÜM 50/70</Text>
            <Text style={s.priceSummaryValue}>{market.bitumen} ₺</Text>
            <Text style={s.priceSummaryMeta}>KDV %{market.bitumenVat.toLocaleString("tr-TR")} · {liveBitumenVatAmount.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</Text>
            <Text style={s.priceSummaryVat}>{liveBitumenVatIncluded.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})} ₺ KDV dahil</Text>
          </View>
          <Ionicons name="trending-up" size={30} color={C.orange} />
        </View>
        <View style={s.plantCalculator}>
          <Text style={s.portalEyebrow}>PLENT ALTI HESAPLAMA</Text>
          <Text style={s.plantCalculatorTitle}>Ürünlerinizi tek kalemde hesaplayın.</Text>
          <Text style={s.plantCalculatorIntro}>Tesisi seçin, istediğiniz karışımları ekleyin ve her ürün için tonaj girin.</Text>
          <View style={s.plantSelector}>
            {([['sultangazi','Sultangazi'],['silivri','Silivri']] as const).map(([key,label])=><Pressable key={key} onPress={()=>setPricePlant(key)} style={[s.plantSelectorButton,pricePlant===key&&s.plantSelectorButtonActive]}><Ionicons name="business-outline" size={16} color={pricePlant===key?C.white:C.navy}/><Text style={[s.plantSelectorText,pricePlant===key&&s.plantSelectorTextActive]}>{label}</Text></Pressable>)}
          </View>
          <View style={s.pricePickerList}>
            {prices.map(([name,sultangazi,silivri])=>{
              const selected=priceBasket[name]!==undefined;
              const unit=pricePlant==='sultangazi'?sultangazi:silivri;
              return <View key={name} style={[s.pricePickerRow,selected&&s.pricePickerRowActive]}>
                <Pressable onPress={()=>setPriceBasket(current=>{const next={...current};if(selected)delete next[name];else next[name]='';return next})} style={[s.priceCheck,selected&&s.priceCheckActive]}><Ionicons name={selected?'checkmark':'add'} size={16} color={selected?C.white:C.orange}/></Pressable>
                <View style={s.pricePickerCopy}><Text style={s.pricePickerName}>{name}</Text><Text style={s.pricePickerUnit}>{unit?`${unit.toLocaleString('tr-TR')} ₺ / ton`:'Teklif ile'}</Text></View>
                {selected&&<View style={s.tonnageInputWrap}><TextInput value={priceBasket[name]} onChangeText={value=>setPriceBasket(current=>({...current,[name]:value.replace(/[^0-9.,]/g,'').replace(',','.')}))} placeholder="0" placeholderTextColor="#8A96A8" keyboardType="decimal-pad" style={s.tonnageInput}/><Text style={s.tonnageUnit}>ton</Text></View>}
              </View>})}
          </View>
          <View style={s.transportRow}><View><Text style={s.priceLocationLabel}>ORTALAMA ARAÇ YÜKÜ</Text><Text style={s.transportHint}>Sevkiyat planı için</Text></View><View style={s.truckInputWrap}><TextInput value={truckCapacity} onChangeText={setTruckCapacity} keyboardType="decimal-pad" style={s.truckInput}/><Text style={s.tonnageUnit}>ton</Text></View></View>
          <LinearGradient colors={[C.navy,"#203B70"]} style={s.priceResultCard}>
            <View style={s.priceResultTop}><View><Text style={s.priceResultLabel}>TOPLAM METRAJ</Text><Text style={s.priceResultValue}>{totalTonnage.toLocaleString('tr-TR')} ton</Text></View><View style={s.truckResult}><Ionicons name="car-outline" size={20} color={C.orange}/><Text style={s.truckResultValue}>{truckCount}</Text><Text style={s.truckResultLabel}>ARAÇ</Text></View></View>
            <View style={s.priceResultDivider}/>
            <View style={s.priceResultLine}><Text style={s.priceResultLineLabel}>Plent altı ara toplam</Text><Text style={s.priceResultLineValue}>{subtotal.toLocaleString('tr-TR',{maximumFractionDigits:0})} ₺</Text></View>
            <View style={s.priceResultLine}><Text style={s.priceResultLineLabel}>KDV %20</Text><Text style={s.priceResultLineValue}>{vat.toLocaleString('tr-TR',{maximumFractionDigits:0})} ₺</Text></View>
            <View style={s.priceResultTotal}><Text style={s.priceResultTotalLabel}>KDV DAHİL BİLGİ AMAÇLI TOPLAM</Text><Text style={s.priceResultTotalValue}>{(subtotal+vat).toLocaleString('tr-TR',{maximumFractionDigits:0})} ₺</Text></View>
          </LinearGradient>
          <Pressable onPress={()=>navigateTab('quote')} style={s.priceQuoteButton}><Text style={s.priceQuoteButtonText}>Projeye özel teklif oluştur</Text><Ionicons name="arrow-forward" size={18} color={C.white}/></Pressable>
        </View>
        <View style={s.priceNote}>
          <Ionicons name="information-circle" size={20} color={C.orange} />
          <Text style={s.priceNoteText}>
            Gösterilen fiyatlar tahmini bilgilendirme amaçlıdır ve bağlayıcı değildir. Bitüm, döviz, konum, nakliye ve sipariş miktarına göre değişebilir.
          </Text>
        </View>
        {customerDocuments.some(doc => doc.available) && <View style={s.privateDocs}>
          <Text style={s.portalEyebrow}>MÜŞTERİYE ÖZEL BELGELER</Text>
          <Text style={s.privateDocsTitle}>Teknik doküman merkezi</Text>
          {customerDocuments.filter(doc => doc.available).map((doc) => (
            <Pressable
              key={doc.id}
              disabled={!doc.available}
              accessibilityState={{disabled: !doc.available}}
              onPress={() => doc.available && Linking.openURL(`${CUSTOMER_API}/documents/${doc.id}/download?token=${encodeURIComponent(customerToken)}`)}
              style={[s.privateDocRow, !doc.available && s.docRowDisabled]}
            >
              <Ionicons
                name="document-text-outline"
                size={21}
                color={C.orange}
              />
              <View style={{flex:1}}><Text style={s.privateDocText}>{doc.title}</Text><Text style={s.docMeta}>{doc.available ? "PDF · Güvenli indirme" : "Belge henüz yayınlanmadı"}</Text></View>
              <Ionicons name={doc.available ? "download-outline" : "time-outline"} size={17} color="#7E8BA4" />
            </Pressable>
          ))}
        </View>
        }
      </ScrollView>
    );
  };

  const unifiedHeaderHeight = 64;
  // Tek bir üst-menü ekseni: Dynamic Island, web önizlemesi ve çekmece
  // başlığı her ekranda aynı 80 px merkez çizgisinde buluşur.
  // Island'ın altında sabit güvenli boşluk; logo sensör alanına girmez.
  const appHeaderTopInset = insets.top + 8;
  const showUnifiedHeader = tab !== "portal" && tab !== "home" && !drawerOpen;
  const contentRunsUnderHeader = tab === "home" || tab === "info" || tab === "production" || tab === "products" || tab === "contact" || selectedProduct !== null;

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[s.safe, {backgroundColor: C.navy, direction: appLanguage === "ar" ? "rtl" : "ltr"}, s.safeDesktop]}
    >
      <StatusBar
        style={isDarkMode || contentRunsUnderHeader ? "light" : "dark"}
        backgroundColor="transparent"
        translucent
      />
      {showUnifiedHeader && (
        <View pointerEvents="box-none" style={[s.unifiedHeader, s.unifiedHeaderFixed, {top: 0, height: appHeaderTopInset + unifiedHeaderHeight, paddingTop: appHeaderTopInset}]}>
          <AppBackButton onPress={goBack} light={tab==="togo"} style={tab==="togo"&&s.arPlainBack}/>
          <TekAsfaltLogo style={[s.unifiedHeaderLogo, { top: appHeaderTopInset + 9, marginTop: 0 }]}/>
          <View style={s.unifiedHeaderActions}>
            <Pressable onPress={() => openPortalView("notifications")} style={s.unifiedHeaderAction} accessibilityLabel="Bildirim merkezi">
              <Ionicons name="notifications-outline" size={21} color={C.white}/><View style={s.unifiedHeaderNotificationDot}/>
            </Pressable>
            <Pressable onPress={() => setDrawerOpen(true)} style={[s.unifiedHeaderAction,s.unifiedHeaderMenuAction]} accessibilityLabel="Menü">
              <HamburgerIcon progress={drawerProgress} open={drawerOpen} color={C.white}/>
            </Pressable>
          </View>
        </View>
      )}
      <Animated.View key={`${tab}-${selectedProduct ?? selectedTekProduct ?? "root"}`} style={[
        s.flex,
        {paddingBottom: 76 + insets.bottom},
        showUnifiedHeader && !contentRunsUnderHeader && {paddingTop: appHeaderTopInset + unifiedHeaderHeight},
        {
          opacity: pageProgress,
          transform: [{translateX: pageProgress.interpolate({inputRange:[0,1], outputRange:[pageDirection.current * 28,0]})}],
        },
      ]}>
        {tab === "home"
          ? ModernHome()
          : tab === "info"
            ? Corporate()
          : tab === "products"
            ? TekProducts()
          : tab === "production"
            ? Production()
            : tab === "togo"
              ? Togo()
              : tab === "calculator"
                ? Calculator()
                : tab === "quote"
                  ? Quote()
                  : tab === "contact"
                    ? Contact()
                    : Portal()}
      </Animated.View>
      {!drawerOpen && (
        <View style={[s.bottomNavWrap, {height: 76 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: "#1B2E53"}]}> 
          <View style={[s.bottomNav, {backgroundColor: "#1B2E53", borderColor: "rgba(255,255,255,.13)"}]}> 
            <Pressable onPress={() => navigateTab("home")} style={[s.bottomNavItem, tab === "home" && s.bottomNavItemActive]}>
              <Ionicons name={tab === "home" ? "compass" : "compass-outline"} size={22} color={tab === "home" ? "#E74022" : "#C6D0E0"} />
              <Text style={[s.bottomNavLabel,{color:"#C6D0E0"},tab === "home" && {color:"#E74022"}]}>{ui.explore}</Text>
            </Pressable>
            <Pressable onPress={() => {
              if(tab==="products"&&(selectedProduct||selectedTekProduct)){setSelectedProduct(null);setSelectedTekProduct(null);}
              else navigateTab("products");
            }} style={[s.bottomNavItem, tab === "products" && s.bottomNavItemActive]}>
              <Ionicons name={tab === "products" ? "grid" : "grid-outline"} size={22} color={tab === "products" ? "#E74022" : "#C6D0E0"} />
              <Text style={[s.bottomNavLabel,{color:"#C6D0E0"},tab === "products" && {color:"#E74022"}]}>{ui.solutions}</Text>
            </Pressable>
            <View style={s.bottomNavCenterSlot}>
              <BlurView pointerEvents="none" intensity={22} tint="light" style={s.bottomArHalo}/>
              <Pressable
                accessibilityLabel="AR ile çukur tara"
                onPress={() => {
                  setSelectedProduct(null);
                  navigateTab("togo");
                  setTogoScanPhoto(null);
                  setTogoNativeScan(null);
                  setTogoCalculated(false);
                  setTogoScanStage("idle");
                }}
                style={[s.bottomAr,tab==="togo"&&s.bottomArActive]}
              >
                <View style={s.bottomArContent}><AnimatedArIcon/></View>
              </Pressable>
            </View>
            <Pressable onPress={() => navigateTab("quote")} style={[s.bottomNavItem, tab === "quote" && s.bottomNavItemActive]}>
              <Ionicons name={tab === "quote" ? "receipt" : "receipt-outline"} size={22} color={tab === "quote" ? "#E74022" : "#C6D0E0"} />
              <Text style={[s.bottomNavLabel,{color:"#C6D0E0"},tab === "quote" && {color:"#E74022"}]}>{ui.quote}</Text>
            </Pressable>
            <Pressable onPress={() => navigateTab("calculator")} style={[s.bottomNavItem, tab === "calculator" && s.bottomNavItemActive]}>
              <Ionicons name={tab === "calculator" ? "calculator" : "calculator-outline"} size={22} color={tab === "calculator" ? "#E74022" : "#C6D0E0"}/>
              <Text style={[s.bottomNavLabel,{color:"#C6D0E0"},tab === "calculator" && {color:"#E74022"}]}>{ui.calculator}</Text>
            </Pressable>
          </View>
        </View>
      )}
      <Modal visible={notificationsOpen} transparent animationType="fade" onRequestClose={()=>setNotificationsOpen(false)}>
        <View style={s.notificationOverlay}><Pressable style={StyleSheet.absoluteFillObject} onPress={()=>setNotificationsOpen(false)}/><View style={s.notificationPanel}><View style={s.notificationPanelHead}><View><Text style={s.notificationPanelTitle}>Bildirimler</Text><Text style={s.notificationPanelMeta}>3 yeni güncelleme</Text></View><Pressable onPress={()=>setNotificationsOpen(false)} style={s.notificationPanelClose}><Ionicons name="close" size={18} color={C.navy}/></Pressable></View>{[["pricetag-outline","Fiyat listesi güncellendi","Bitüm 50/70 için yeni kayıt yayınlandı.","Şimdi",C.orange],["document-text-outline","Teklifiniz hazır","TA-260814-CKCZV referanslı teklifinizi inceleyin.","12 dk","#2C72C7"],["cube-outline","Asfalt To Go","Ürün ve teknik rehber güncellendi.","Dün","#178A50"]].map(([icon,title,description,time,color])=><Pressable key={title as string} onPress={()=>{setNotificationsOpen(false);openPortalView("notifications");}} style={s.notificationItem}><View style={[s.notificationItemIcon,{backgroundColor:`${color}18`}] }><Ionicons name={icon as any} size={19} color={color as string}/></View><View style={s.notificationItemCopy}><Text style={s.notificationItemTitle}>{title}</Text><Text numberOfLines={1} style={s.notificationItemText}>{description}</Text></View><Text style={s.notificationItemTime}>{time}</Text></Pressable>)}<Pressable onPress={()=>{setNotificationsOpen(false);openPortalView("notifications");}} style={s.notificationAllButton}><Text style={s.notificationAllText}>Tüm bildirim tercihleri</Text><Ionicons name="arrow-forward" size={17} color={C.white}/></Pressable></View></View>
      </Modal>
      <Modal visible={languageChoiceOpen} transparent animationType="fade" onRequestClose={()=>setLanguageChoiceOpen(false)}>
        <View style={s.welcomeBackdrop}><Pressable accessibilityLabel="Dil penceresini kapat" style={StyleSheet.absoluteFillObject} onPress={()=>setLanguageChoiceOpen(false)}/><View style={s.languageCard}><View style={s.languageIcon}><Ionicons name="language-outline" size={25} color={C.orange}/></View><Text style={s.languageTitle}>Uygulama dili</Text><Text style={s.languageText}>Telefon dili destekleniyorsa ilk açılışta otomatik uygulanır. Dili burada istediğiniz zaman değiştirebilirsiniz.</Text>{[["tr","TR","Türkçe"],["en","EN","English"],["de","DE","Deutsch"],["ar","AR","العربية"]].map(([code,flag,label])=><Pressable key={code} onPress={()=>chooseLanguage(code as "tr"|"en"|"de"|"ar")} style={[s.languageOption,appLanguage===code&&s.languageOptionActive]}><Text style={s.languageFlag}>{flag}</Text><Text style={[s.languageOptionText,appLanguage===code&&s.languageOptionTextActive]}>{label}</Text>{appLanguage===code&&<Ionicons name="checkmark-circle" size={19} color={C.orange}/>}</Pressable>)}</View></View>
      </Modal>
      <Modal visible={welcomeOpen && !isLoggedIn && !languageChoiceOpen} transparent animationType="fade" onRequestClose={()=>setWelcomeOpen(false)}>
        <View style={s.welcomeBackdrop}><View style={s.welcomeCard}><View style={s.welcomeLogoPlate}><TekAsfaltLogo style={s.welcomeLogo}/></View><Text style={s.welcomeKicker}>TEK ASFALT MÜŞTERİ PORTALI</Text><Text style={s.welcomeTitle}>Projenizi{`\n`}tek yerden yönetin.</Text><Text style={s.welcomeText}>Hesaplama, AR ölçüm, teklif ve belge erişimi kayıtlı müşteri hesabınızla açılır.</Text><Pressable onPress={()=>{setAuthMode("login");setWelcomeOpen(false);navigateTab("portal");}} style={s.welcomePrimary}><Ionicons name="log-in-outline" size={19} color={C.white}/><Text style={s.welcomePrimaryText}>Giriş yap</Text></Pressable><Pressable onPress={()=>{setAuthMode("register");setWelcomeOpen(false);navigateTab("portal");}} style={s.welcomeSecondary}><Ionicons name="person-add-outline" size={18} color={C.navy}/><Text style={s.welcomeSecondaryText}>Müşteri hesabı oluştur</Text></Pressable><Pressable onPress={()=>setWelcomeOpen(false)} style={s.welcomeGuest}><Text style={s.welcomeGuestText}>Misafir olarak devam et</Text><Ionicons name="arrow-forward" size={16} color="#71809A"/></Pressable><Text style={s.welcomeLegal}>Devam ederek Gizlilik Politikası ve Kullanım Koşulları’nı kabul etmiş olursunuz.</Text></View></View>
      </Modal>
      <Modal visible={launchAnimationOpen} animationType="fade" statusBarTranslucent presentationStyle="fullScreen">
        <LaunchAnimation onFinish={()=>setLaunchAnimationOpen(false)}/>
      </Modal>
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID="tek-number-keyboard">
          <View style={s.keyboardDoneBar}>
            <Pressable onPress={Keyboard.dismiss} style={s.keyboardDoneButton}>
              <Ionicons name="chevron-down" size={19} color={C.navy}/>
              <Text style={s.keyboardDoneText}>Klavyeyi kapat</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
      {drawerOpen && (
        <Animated.View style={[s.drawerBackdrop,{opacity:drawerProgress.interpolate({inputRange:[0,1],outputRange:[0,.72]})}]}>
          <Pressable onPress={() => setDrawerOpen(false)} style={StyleSheet.absoluteFillObject}/>
        </Animated.View>
      )}
      <Animated.View
        pointerEvents={drawerOpen ? "auto" : "none"}
        style={[
          s.drawer,
          {
            opacity: drawerProgress.interpolate({inputRange:[0,.08,1],outputRange:[0,1,1]}),
            transform:[
              {translateX:drawerProgress.interpolate({inputRange:[0,1],outputRange:[-440,0]})},
              {scale:drawerProgress.interpolate({inputRange:[0,1],outputRange:[.96,1]})},
            ],
          },
        ]}
      >
        <View style={[s.drawerHeader,{minHeight:appHeaderTopInset+unifiedHeaderHeight,paddingTop:appHeaderTopInset}]}>
          <View style={s.drawerBrand}>
            <Image source={require("./assets/TEKLOGO_V3.png")} resizeMode="contain" style={s.drawerLogo} accessibilityLabel="Tek Asfalt"/>
          </View>
          <View style={s.drawerHeaderActions}>
            <Pressable onPress={() => setLanguageChoiceOpen(true)} style={[s.drawerHeaderAction,s.drawerLanguageAction]} accessibilityLabel="Dil tercihi">
              <View pointerEvents="none" style={s.drawerLanguageHalo}/><View pointerEvents="none" style={s.drawerLanguageHaloInner}/><Ionicons name="language-outline" size={21} color={C.white} />
            </Pressable>
            <Pressable onPress={() => openPortalView("notifications")} style={s.drawerHeaderAction}>
              <Ionicons name="notifications-outline" size={22} color={C.white} />
              <View style={s.drawerNotificationDot}/>
            </Pressable>
            <Pressable onPress={() => setDrawerOpen(false)} style={s.drawerClose}>
              <HamburgerIcon progress={drawerProgress} open={drawerOpen} color={C.white} />
            </Pressable>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.drawerScroll}>
          <Pressable onPress={() => openPortalView("profile")} style={s.drawerAccountRow}>
            <View style={s.drawerAccountAvatar}>
              {customerProfile?.avatar ? <Image source={{uri: customerProfile.avatar}} style={s.drawerAvatarImage}/> : <Ionicons name="person-outline" size={25} color={C.orange}/>} 
            </View>
            <View style={s.drawerAccountCopy}>
              <View style={s.drawerAccountNameRow}><Text style={s.drawerAccountName}>{customerProfile?.name || (isLoggedIn ? authName || "Tek Asfalt müşterisi" : "Tek Asfalt")}</Text><VerifiedBadge size={16}/></View>
              <Text style={s.drawerAccountEmail}>{customerProfile?.email || (isLoggedIn ? authEmail : "Hesabınızı yönetin")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8B96A8" />
          </Pressable>
          <View style={s.drawerListGroup}>
            <Pressable onPress={() => drawerNavigate("home")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="home-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>Ana Sayfa</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => drawerNavigate("products")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="layers-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>Ürünler</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => drawerNavigate("togo")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="scan-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>AR Ölçüm</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => drawerNavigate("quote")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="document-text-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>Teklif Talebi</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => drawerNavigate("calculator")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="calculator-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>Hesaplama</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
          </View>
          <Text style={s.drawerNavKicker}>TEK ASFALT</Text>
          <View style={s.drawerSection}>
            <Pressable onPress={()=>setDrawerSectionOpen(current=>current==='corporate'?null:'corporate')} style={s.drawerSectionHead}>
              <View style={s.drawerListIcon}><Ionicons name="grid-outline" size={20} color={C.orange} /></View>
              <View style={s.drawerSectionCopy}><Text style={s.drawerSectionTitle}>Kurumsal</Text><Text style={s.drawerSectionMeta}>Hakkımızda, faaliyetler ve kalite</Text></View>
              <Ionicons name={drawerSectionOpen==='corporate'?"chevron-up":"chevron-down"} size={18} color="#64708A" />
            </Pressable>
            {drawerSectionOpen==='corporate' && [
              ["about", "Hakkımızda", "1996'dan bugüne Tek Asfalt", "business-outline"],
              ["activities", "Faaliyetler", "Üretim · kazıma · serim · sıkıştırma", "construct-outline"],
              ["applications", "Asfalt Uygulamaları", "9 özel asfalt çözümü", "layers-outline"],
              ["laboratory", "Asfalt Laboratuvarı", "Karışım tasarımı ve kalite kontrol", "flask-outline"],
              ["quality", "Kalite · İSG · Çevre", "TSE · ISO · CE · yerli üretim", "shield-checkmark-outline"],
            ].map(([section, title, meta, icon]) => (
              <Pressable key={section} onPress={() => openInfo(section as InfoSection)} style={s.drawerCorporateRow}>
                <View style={s.drawerCorporateIcon}><Ionicons name={icon as any} size={17} color={C.orange}/></View>
                <View style={s.drawerSubCopy}>
                  <Text style={s.drawerSubText}>{title}</Text>
                  <Text style={s.drawerSubMeta}>{meta}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#738099" />
              </Pressable>
            ))}
          </View>
          <View style={s.drawerSection}>
            <Pressable onPress={()=>setDrawerSectionOpen(current=>current==='plants'?null:'plants')} style={s.drawerSectionHead}>
              <View style={s.drawerListIcon}><Ionicons name="business-outline" size={20} color={C.orange} /></View>
              <View style={s.drawerSectionCopy}><Text style={s.drawerSectionTitle}>Üretim tesisleri</Text><Text style={s.drawerSectionMeta}>Kapasite ve tesis lokasyonları</Text></View>
              <Ionicons name={drawerSectionOpen==='plants'?"chevron-up":"chevron-down"} size={18} color="#64708A" />
            </Pressable>
            {drawerSectionOpen==='plants' && PLANTS.map((plant, index) => (
              <Pressable
                key={plant.name}
                onPress={() => {
                  setProductionTarget(index);
                  setTab("production");
                  setDrawerOpen(false);
                }}
                style={s.drawerSubRow}
              >
                <Text style={s.drawerSubNo}>0{index + 1}</Text>
                <View style={s.drawerSubCopy}>
                  <Text style={s.drawerSubText}>{plant.name}</Text>
                  <Text style={s.drawerSubMeta}>{plant.capacity} kapasite</Text>
                </View>
                <Ionicons name="arrow-forward" size={15} color={C.orange} />
              </Pressable>
            ))}
          </View>
          <View style={s.drawerSection}>
            <Pressable onPress={()=>setDrawerSectionOpen(current=>current==='togo'?null:'togo')} style={s.drawerSectionHead}>
              <View style={s.drawerListIcon}><Ionicons name="cube-outline" size={20} color={C.orange} /></View>
              <View style={s.drawerSectionCopy}><Text style={s.drawerSectionTitle}>Asfalt To Go</Text><Text style={s.drawerSectionMeta}>Hazır onarım ürünleri</Text></View>
              <Ionicons name={drawerSectionOpen==='togo'?"chevron-up":"chevron-down"} size={18} color="#64708A" />
            </Pressable>
            {drawerSectionOpen==='togo' && [
              ["asphalt", "Hazır Asfalt", "25 kg profesyonel onarım"],
              ["emulsion", "Emülsiyon", "Güçlü yüzey hazırlığı"],
              ["insulation", "Asfalt Yalıtım", "Kalıcı su koruması"],
            ].map(([id, title, meta], index) => (
              <Pressable
                key={id}
                onPress={() => {
                  lastProductSelection.current={kind:"togo",id:id as ProductId};
                  setTogoDetailSections([PRODUCT_DETAILS[id as ProductId].sections[0]?.id ?? ""]);
                  setSelectedProduct(id as ProductId);
                  setTab("togo");
                  setDrawerOpen(false);
                }}
                style={s.drawerSubRow}
              >
                <Text style={s.drawerSubNo}>0{index + 1}</Text>
                <View style={s.drawerSubCopy}>
                  <Text style={s.drawerSubText}>{title}</Text>
                  <Text style={s.drawerSubMeta}>{meta}</Text>
                </View>
                <Ionicons name="arrow-forward" size={15} color={C.orange} />
              </Pressable>
            ))}
            {drawerSectionOpen==='togo' && <Pressable
              onPress={() => drawerNavigate("togo")}
              style={s.drawerToolRow}
            >
              <Ionicons name="flash" size={18} color={C.white} />
              <Text style={s.drawerToolText}>To Go hesaplama aracını aç</Text>
            </Pressable>}
          </View>
          <Text style={s.drawerNavKicker}>DESTEK</Text>
          <View style={s.drawerListGroup}>
            <Pressable onPress={() => setLanguageChoiceOpen(true)} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="language-outline" size={20} color={C.orange}/></View><View style={s.drawerListCopy}><Text style={s.drawerListText}>Dil tercihi</Text><Text style={s.drawerListMeta}>{languageLabel}</Text></View><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => drawerNavigate("contact")} style={s.drawerListRow}>
              <View style={s.drawerListIcon}><Ionicons name="chatbubble-ellipses-outline" size={20} color={C.orange}/></View><Text style={s.drawerListText}>İletişim</Text><Ionicons name="chevron-forward" size={18} color="#8B96A8"/>
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://wa.link/292g2p")} style={s.drawerListRow}>
              <View style={s.drawerWhatsappIcon}><Ionicons name="logo-whatsapp" size={20} color="#178A50"/></View><View style={s.drawerListCopy}><Text style={s.drawerListText}>WhatsApp satış desteği</Text><Text style={s.drawerListMeta}>Hızlı teklif ve ürün desteği için yazın</Text></View><Ionicons name="open-outline" size={17} color="#8B96A8"/>
            </Pressable>
          </View>
          <View style={s.drawerSocialBlock}>
            <Text style={s.drawerSocialLabel}>BİZİ TAKİP EDİN</Text>
            <View style={s.drawerSocialRow}>
              {[
                ["logo-facebook","https://www.facebook.com/tekasfalt/","Facebook"],
                ["logo-instagram","https://www.instagram.com/tek.asfalt/","Instagram"],
                ["logo-youtube","https://www.youtube.com/@tekasfalt4564","YouTube"],
                ["logo-whatsapp","https://wa.link/292g2p","WhatsApp"],
              ].map(([icon,url,label])=><Pressable key={label} accessibilityLabel={label} onPress={()=>Linking.openURL(url)} style={s.drawerSocialButton}><Ionicons name={icon as any} size={19} color={C.navy}/></Pressable>)}
            </View>
          </View>
          <Text style={s.drawerCopyright}>© 2026  <Text style={s.drawerCopyrightBrand}>TEK ASFALT</Text>  |  Tüm Hakları Saklıdır</Text>
          <View style={s.drawerDesignCreditRow}><Text style={s.drawerDesignCredit}>KONSEPT & TASARIM:</Text><Image source={require("./assets/brand/cihat-logo-original.png")} style={s.drawerDesignLogo} resizeMode="contain"/></View>
          <View style={s.drawerVersionRow}>
            <View style={s.drawerVersionIcon}><Ionicons name="phone-portrait-outline" size={15} color={C.navy}/></View>
            <View style={s.drawerVersionCopy}>
              <Text style={s.drawerVersionLabel}>MEVCUT SÜRÜM</Text>
              <Text style={s.drawerVersionValue}>{Constants.expoConfig?.version || "1.0.1"}{Constants.expoConfig?.ios?.buildNumber ? `  ·  ${Constants.expoConfig.ios.buildNumber}` : ""}</Text>
            </View>
            <View style={s.drawerVersionStatus}><View style={s.drawerVersionDot}/><Text style={s.drawerVersionStatusText}>Güncel</Text></View>
          </View>
          <View style={s.drawerBottomSpace} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; message?: string }
> {
  state: { failed: boolean; message?: string } = { failed: false };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    trackEvent("app_render_error", {
      message: error.message.slice(0, 100),
      component: info.componentStack?.split("\n")[1]?.trim().slice(0, 100) || "unknown",
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.navy, justifyContent: "center", padding: 28 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 24, padding: 24 }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFF1E7", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="construct-outline" size={24} color={C.orange} />
          </View>
          <Text style={{ color: C.navy, fontFamily: VODAFONE_BOLD, fontSize: 24, marginTop: 18 }}>Bir şey ters gitti.</Text>
          <Text style={{ color: C.muted, fontFamily: VODAFONE, fontSize: 14, lineHeight: 21, marginTop: 8 }}>Verileriniz korunuyor. Hata kaydı tanılama sistemine eklendi; ekranı güvenli biçimde yeniden yükleyebilirsiniz.</Text>
          {this.state.message ? <Text style={{ color: "#B34B18", fontFamily: VODAFONE, fontSize: 11, lineHeight: 16, marginTop: 10 }}>{this.state.message}</Text> : null}
          <Pressable onPress={() => this.setState({ failed: false })} style={{ height: 52, borderRadius: 16, backgroundColor: C.orange, alignItems: "center", justifyContent: "center", marginTop: 20 }}>
            <Text style={{ color: C.white, fontFamily: VODAFONE_BOLD, fontSize: 14 }}>Uygulamaya dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Vodafone: require("./assets/fonts/Vodafone.ttf"),
    VodafoneLight: require("./assets/fonts/Vodafone-Light.ttf"),
    VodafoneBold: require("./assets/fonts/Vodafone-Bold.ttf"),
    VodafoneExtraBold: require("./assets/fonts/Vodafone-ExtraBold.ttf"),
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    overflow: "hidden",
    backgroundColor: C.navy,
  },
  safeDark: { backgroundColor: C.navy },
  safeLight: { backgroundColor: "#F7F8FA" },
  welcomeBackdrop:{flex:1,backgroundColor:"rgba(7,18,42,.72)",justifyContent:"center",padding:22},
  launchScreen:{flex:1,backgroundColor:"#050B17",alignItems:"center",justifyContent:"center"},
  launchVideo:{width:"100%",height:"100%"},
  welcomeCard:{borderRadius:30,backgroundColor:C.white,padding:24,alignItems:"center"},
  welcomeLogoPlate:{width:226,height:70,borderRadius:18,backgroundColor:C.navy,alignItems:"center",justifyContent:"center",marginBottom:22,overflow:"hidden"},
  welcomeLogo:{width:198,height:54},
  welcomeKicker:{color:C.orange,fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.25},
  welcomeTitle:{color:C.navy,fontSize:30,lineHeight:34,fontFamily:D.fonts.extraBold,textAlign:"center",marginTop:8},
  welcomeText:{color:"#68768B",fontSize:12,lineHeight:18,textAlign:"center",marginTop:11,maxWidth:290},
  welcomePrimary:{width:"100%",height:54,borderRadius:18,backgroundColor:C.orange,marginTop:23,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},
  welcomePrimaryText:{color:C.white,fontSize:13,fontFamily:D.fonts.bold},
  welcomeSecondary:{width:"100%",height:52,borderRadius:18,backgroundColor:"#EEF2F7",marginTop:9,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
  welcomeSecondaryText:{color:C.navy,fontSize:12,fontFamily:D.fonts.bold},
  welcomeGuest:{minHeight:43,marginTop:9,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6},
  welcomeGuestText:{color:"#71809A",fontSize:11,fontFamily:D.fonts.bold},
  welcomeLegal:{color:"#8B96A6",fontSize:9,lineHeight:13,textAlign:"center",marginTop:8,maxWidth:290},
  languageCard:{borderRadius:30,backgroundColor:C.white,padding:24,alignItems:"center"},
  languageIcon:{width:56,height:56,borderRadius:20,backgroundColor:"rgba(231,64,34,.10)",alignItems:"center",justifyContent:"center"},
  languageTitle:{color:C.navy,fontSize:26,fontFamily:D.fonts.extraBold,marginTop:15},
  languageText:{color:"#68768B",fontSize:12,lineHeight:18,textAlign:"center",marginTop:8,maxWidth:286},
  languagePrimary:{width:"100%",height:52,borderRadius:17,backgroundColor:C.orange,marginTop:21,alignItems:"center",justifyContent:"center"},
  languagePrimaryText:{color:C.white,fontSize:13,fontFamily:D.fonts.bold},
  languageSecondary:{width:"100%",minHeight:50,paddingHorizontal:10,borderRadius:17,backgroundColor:"#EEF2F7",marginTop:9,alignItems:"center",justifyContent:"center"},
  languageSecondaryText:{color:C.navy,fontSize:11,fontFamily:D.fonts.bold,textAlign:"center"},
  languageOption:{width:"100%",minHeight:48,borderRadius:15,backgroundColor:"#F1F3F6",paddingHorizontal:13,marginTop:8,flexDirection:"row",alignItems:"center",gap:11},
  languageOptionActive:{backgroundColor:"#FFF0E6",borderWidth:1,borderColor:"#F6B183"},
  languageFlag:{width:28,height:28,borderRadius:14,backgroundColor:C.navy,color:C.white,textAlign:"center",fontSize:9,lineHeight:28,fontFamily:D.fonts.bold,includeFontPadding:false},
  languageOptionText:{flex:1,color:C.navy,fontSize:13,fontFamily:D.fonts.bold},
  languageOptionTextActive:{color:C.orange},
  safeDesktop: { width: "100%", maxWidth: 520, alignSelf: "center" },
  page: { backgroundColor: C.cream, paddingBottom: 20 },
  modernShell: { flex: 1, backgroundColor: C.navy },
  modernScroll: { backgroundColor: "#F7F8FA", paddingBottom: 0 },
  homeSnapPage: Platform.select({
    web: { scrollSnapAlign: "start", scrollSnapStop: "always" } as any,
    default: {},
  }),
  modernHero: { minHeight: 680, width: "100%", paddingTop: 0, paddingBottom: 52, overflow: "hidden", backgroundColor: C.navy },
  homeHeroMediaFrame: { ...StyleSheet.absoluteFillObject, overflow: "hidden", backgroundColor: C.navy },
  centeredHeroMedia: { ...StyleSheet.absoluteFillObject },
  homeHeroMedia: Platform.select({
    web: { opacity: .9, width: "100%", height: "100%", top: 0, left: 0 },
    default: { opacity: .9, width: "100%", height: "100%", top: 0, left: 0 },
  }),
  modernHeroImage: { opacity: .82 },
  modernHeroBottomFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 116 },
  modernTopbar: { position:"absolute",right:18,top:58,zIndex:8 },
  entryModel:{position:"absolute",left:18,right:18,top:104,height:370,zIndex:2},
  modernLogo: { width: 176, height: 48 },
  modernHello: { marginTop: 10, color: C.white, fontSize: 16, lineHeight:20, fontFamily: D.fonts.bold },
  modernTopActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  modernRoundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(9,27,59,.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modernMenuButton: { borderRadius: 22, backgroundColor: "rgba(231,64,34,.94)" },
  globalTopMenu:{position:"absolute",right:18,zIndex:34,width:44,height:44,borderRadius:22,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  modernNotificationButton: { backgroundColor: C.white },
  modernProfileButton: { backgroundColor: C.white, overflow:"hidden" },
  modernProfileImage:{width:"100%",height:"100%",resizeMode:"cover"},
  modernNotificationDot: { position: "absolute", right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: "#E74022", borderWidth: 1, borderColor: C.white },
  notificationOverlay:{flex:1,backgroundColor:"rgba(5,14,32,.42)",paddingHorizontal:12,paddingTop:82,alignItems:"center"},
  notificationPanel:{width:"100%",maxWidth:430,borderRadius:24,backgroundColor:C.white,padding:8,shadowColor:"#07142B",shadowOpacity:.24,shadowRadius:24,shadowOffset:{width:0,height:12},elevation:12},
  notificationPanelHead:{minHeight:64,paddingHorizontal:10,paddingTop:6,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  notificationPanelTitle:{fontSize:18,fontFamily:D.fonts.extraBold,color:C.navy},
  notificationPanelMeta:{fontSize:11,color:C.orange,fontFamily:D.fonts.bold,marginTop:3},
  notificationPanelClose:{width:34,height:34,borderRadius:17,backgroundColor:"#F0F3F7",alignItems:"center",justifyContent:"center"},
  notificationItem:{minHeight:68,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:10,paddingVertical:8,borderRadius:16},
  notificationItemIcon:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center"},
  notificationItemCopy:{flex:1,minWidth:0},
  notificationItemTitle:{fontSize:13,fontFamily:D.fonts.bold,color:C.navy},
  notificationItemText:{fontSize:10,lineHeight:14,color:"#738097",marginTop:3},
  notificationItemTime:{fontSize:10,color:"#8793A7",alignSelf:"flex-start",marginTop:9},
  notificationAllButton:{height:44,borderRadius:14,backgroundColor:C.navy,marginTop:5,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  notificationAllText:{fontSize:12,fontFamily:D.fonts.bold,color:C.white},
  homeHeroTools: { position:"absolute", left:18, right:18, bottom:198, zIndex:3, flexDirection:"row", gap:10 },
  homeHeroTool: { flex:1, minHeight:68, borderRadius:22, paddingHorizontal:12, flexDirection:"row", alignItems:"center", gap:9, borderWidth:1 },
  homeHeroToolPrimary: { backgroundColor:"rgba(238,62,29,.94)", borderColor:"rgba(255,255,255,.22)" },
  homeHeroToolSecondary: { backgroundColor:"rgba(255,255,255,.92)", borderColor:"rgba(255,255,255,.72)" },
  homeHeroToolIcon: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center", backgroundColor:"rgba(5,20,48,.22)" },
  homeHeroToolIconLight: { backgroundColor:"#EEF1F5" },
  homeHeroToolKicker: { color:"rgba(255,255,255,.72)", fontFamily:D.fonts.bold, fontSize:8, lineHeight:10, letterSpacing:.8 },
  homeHeroToolKickerDark: { color:"#6C788C" },
  homeHeroToolTitle: { color:C.white, fontFamily:D.fonts.bold, fontSize:13, lineHeight:17 },
  homeHeroToolTitleDark: { color:C.navy },
  homeHeroCopy: { position:"absolute", left:D.space.lg, right:D.space.lg, bottom:200, zIndex:3, maxWidth:430 },
  homeHeroEyebrow: { ...D.type.label, color:"#FFD2B5", fontFamily:D.fonts.bold, letterSpacing:1.1 },
  homeProductionPill: { alignSelf:"flex-start", minHeight:32, borderRadius:16, paddingHorizontal:12, flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"rgba(255,255,255,.92)", marginBottom:12 },
  homeProductionDot: { width:7, height:7, borderRadius:4, backgroundColor:"#21A179" },
  homeProductionText: { color:C.navy, fontSize:10, fontFamily:D.fonts.bold, letterSpacing:.8 },
  homeHeroTitle: { color:C.white, fontFamily:D.fonts.extraBold, fontSize:42, lineHeight:44, letterSpacing:-1.25, maxWidth:410 },
  homeHeroBody: { color:"#E0E6EF", fontSize:17, lineHeight:24, fontFamily:D.fonts.regular, marginTop:D.space.sm, maxWidth:365 },
  homeHeroCta: { alignSelf:"flex-start", width:230, minHeight:50, borderRadius:25, backgroundColor:"#111315", flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingLeft:18,paddingRight:6, marginTop:18 },
  homeHeroCtaText: { ...D.type.body, color:C.white, fontFamily:D.fonts.bold },
  homeHeroCtaArrow:{width:38,height:38,borderRadius:19,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  modernGreetingRow: { marginTop: 28, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modernGreeting: { color: "#AAB6CD", fontSize: 12 },
  modernGreetingStrong: { color: C.white, fontSize: 20, fontWeight: "800", marginTop: 3 },
  modernAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.orange, borderWidth: 3, borderColor: "rgba(255,255,255,.25)", alignItems: "center", justifyContent: "center" },
  modernProjectCard: { marginHorizontal: 18, marginTop: 22, borderRadius: 24, backgroundColor: "rgba(51,72,110,.82)", borderWidth: 1, borderColor: "rgba(255,255,255,.22)", padding: 18, overflow: "hidden" },
  modernProjectHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  modernCardKicker: { color: "#AFC0DC", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  modernCardTitle: { color: C.white, fontSize: 18, fontWeight: "800", marginTop: 5 },
  modernStatusPill: { height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,.1)", flexDirection: "row", alignItems: "center", gap: 5 },
  modernStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#42D79B" },
  modernStatusText: { color: C.white, fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  modernRouteRow: { marginTop: 25, flexDirection: "row", alignItems: "center" },
  modernRoutePoint: { width: 74 },
  modernRouteCode: { color: C.white, fontSize: 25, fontWeight: "900", letterSpacing: -.8 },
  modernRouteName: { color: "#BFCAE0", fontSize: 11, marginTop: 1 },
  modernRouteTrack: { flex: 1, flexDirection: "row", alignItems: "center", marginHorizontal: 4 },
  modernRouteLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,.55)" },
  modernTruckCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginHorizontal: 6 },
  modernPlantSummary: { marginTop: 20, borderRadius: 18, backgroundColor: "rgba(5,20,48,.34)", padding: 13 },
  modernPlantTotal: { flexDirection: "row", alignItems: "center", gap: 11, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.13)" },
  modernPlantTotalValue: { color: C.white, fontSize: 21, lineHeight: 23, fontWeight: "900" },
  modernPlantTotalLabel: { color: "#AFC0D3", fontSize: 10, fontWeight: "900", letterSpacing: .8, marginTop: 2 },
  modernPlantChips: { flexDirection: "row", gap: 7 },
  modernPlantChip: { flex: 1, minHeight: 45, borderRadius: 13, paddingHorizontal: 9, justifyContent: "center", backgroundColor: "rgba(255,255,255,.08)" },
  modernPlantChipName: { color: "#BFCBE0", fontSize: 10, fontWeight: "800" },
  modernPlantChipValue: { color: C.white, fontSize: 13, fontWeight: "900", marginTop: 2 },
  modernMetrics: { marginTop: 22, borderRadius: 18, backgroundColor: "rgba(5,20,48,.38)", paddingVertical: 14, paddingHorizontal: 10, flexDirection: "row", alignItems: "center" },
  modernMarketStrip: { position: "absolute", left: 18, right: 18, bottom: 230, minHeight: 68, borderRadius:18, borderWidth: 1, borderColor: "rgba(255,255,255,.25)", backgroundColor: "rgba(5,20,48,.54)", flexDirection: "row", alignItems: "center", paddingHorizontal: 4, overflow:"hidden" },
  marketGlassWrap:{position:"absolute",left:14,right:14,bottom:212,height:98,borderRadius:25,overflow:"hidden",backgroundColor:"rgba(10,27,59,.30)"},
  marketGlassRail:{paddingHorizontal:9,gap:9,alignItems:"center",minHeight:98},
  marketGlassCard:{width:248,height:78,borderRadius:20,overflow:"hidden",backgroundColor:"rgba(27,46,83,.30)",paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:10},
  marketGlassIcon:{width:38,height:38,borderRadius:19,backgroundColor:"rgba(231,64,34,.13)",alignItems:"center",justifyContent:"center"},
  marketGlassCopy:{flex:1,minWidth:0},
  marketGlassLabel:{color:"#D8E2F1",fontSize:9,fontFamily:D.fonts.bold,letterSpacing:.8},
  marketGlassValueRow:{flexDirection:"row",alignItems:"center",gap:4,marginTop:2},
  marketGlassValue:{color:C.white,fontSize:16,lineHeight:20,fontFamily:D.fonts.extraBold},
  marketGlassCondition:{color:"#C4D0E2",fontSize:10,fontFamily:D.fonts.regular},
  marketGlassMeta:{color:"#B7C4D8",fontSize:8.5,lineHeight:12,marginTop:2},
  marketDetailBackdrop:{flex:1,backgroundColor:"rgba(5,14,31,.56)",justifyContent:"flex-end"},
  marketDetailSheet:{backgroundColor:"#F7F9FC",borderTopLeftRadius:30,borderTopRightRadius:30,paddingHorizontal:20,paddingTop:10,paddingBottom:24,minHeight:290,maxHeight:"90%"},
  marketDetailContent:{paddingBottom:6},
  marketDetailHandle:{width:40,height:4,borderRadius:2,backgroundColor:"#CDD5E0",alignSelf:"center",marginBottom:14},
  marketDetailHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:18},
  marketDetailKicker:{color:C.orange,fontSize:9,fontFamily:D.fonts.bold,letterSpacing:1.15},
  marketDetailTitle:{color:C.navy,fontSize:23,fontFamily:D.fonts.extraBold,marginTop:4},
  marketDetailClose:{width:38,height:38,borderRadius:19,backgroundColor:"#E9EDF3",alignItems:"center",justifyContent:"center"},
  bitumenHero:{borderRadius:19,backgroundColor:C.navy,padding:17},
  bitumenHeroValue:{color:C.white,fontSize:27,fontFamily:D.fonts.extraBold},
  bitumenHeroMeta:{color:"#C9D6E9",fontSize:10,fontFamily:D.fonts.bold,marginTop:5,letterSpacing:.45},
  bitumenFinanceCard:{borderRadius:22,backgroundColor:"#1D2737",padding:16,overflow:"hidden"},
  bitumenFinanceHead:{flexDirection:"row",alignItems:"center",gap:10},
  bitumenFinanceFlame:{width:42,height:42,borderRadius:21,backgroundColor:"rgba(255,171,50,.13)",alignItems:"center",justifyContent:"center"},
  bitumenFinanceCode:{color:C.white,fontSize:16,lineHeight:20,fontFamily:D.fonts.extraBold},
  bitumenFinanceName:{color:"#C7D4E7",fontSize:10,lineHeight:14,fontFamily:D.fonts.regular},
  bitumenFinanceTrendPill:{marginLeft:"auto",flexDirection:"row",alignItems:"center",gap:4,borderRadius:13,paddingHorizontal:9,paddingVertical:5,backgroundColor:"rgba(255,123,98,.16)"},
  bitumenFinanceTrendText:{color:"#FFAE9D",fontSize:10,fontFamily:D.fonts.extraBold},
  bitumenFinanceTime:{color:"#B9C6D9",fontSize:8,lineHeight:12,fontFamily:D.fonts.bold,letterSpacing:.4,marginTop:16},
  bitumenFinanceValue:{color:C.white,fontSize:33,lineHeight:39,fontFamily:D.fonts.extraBold,letterSpacing:-.8,marginTop:3},
  bitumenFinanceMeta:{color:"#C0CBDA",fontSize:10,lineHeight:14,marginTop:1},
  bitumenFinanceCompare:{flexDirection:"row",alignItems:"center",marginTop:15,paddingTop:13,borderTopWidth:1,borderTopColor:"rgba(255,255,255,.13)",gap:14},
  bitumenFinanceCompareLabel:{color:"#AEBBD0",fontSize:8,lineHeight:12,fontFamily:D.fonts.bold,letterSpacing:.45},
  bitumenFinanceCompareValue:{color:C.white,fontSize:13,lineHeight:18,fontFamily:D.fonts.extraBold,marginTop:2},
  bitumenFinanceCompareLine:{width:1,height:28,backgroundColor:"rgba(255,255,255,.18)"},
  bitumenUpdateRow:{marginTop:14,paddingVertical:10,paddingHorizontal:4,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  marketDetailSmall:{color:"#78869A",fontSize:9,fontFamily:D.fonts.bold,letterSpacing:.7},
  bitumenUpdateValue:{color:C.navy,fontSize:16,fontFamily:D.fonts.extraBold,marginTop:4},
  marketDetailDate:{color:"#748197",fontSize:9,marginTop:3},
  marketDetailChange:{marginTop:11,paddingVertical:11,paddingHorizontal:4,flexDirection:"row",alignItems:"center",gap:8},
  marketDetailChangeText:{color:C.navy,fontSize:11,fontFamily:D.fonts.bold},
  weatherForecastRow:{gap:16,paddingHorizontal:2},
  weatherDay:{width:55,minHeight:124,alignItems:"center",paddingVertical:10,gap:6},
  weatherDayActive:{},
  weatherDayName:{color:"#718096",fontSize:9,fontFamily:D.fonts.bold,textTransform:"capitalize"},
  weatherDayNameActive:{color:C.orange},
  weatherDayHigh:{color:C.navy,fontSize:17,fontFamily:D.fonts.extraBold,marginTop:2},
  weatherDayHighActive:{color:C.navy},
  weatherDayLow:{color:"#8390A2",fontSize:10},
  weatherDayLowActive:{color:"#8390A2"},
  weatherDayRain:{color:C.orange,fontSize:9,fontFamily:D.fonts.bold},
  weatherDayRainActive:{color:C.orange},
  weatherFinanceHero:{borderRadius:22,backgroundColor:"#273B69",padding:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between",overflow:"hidden"},
  weatherFinanceCity:{color:C.white,fontSize:21,lineHeight:25,fontFamily:D.fonts.extraBold},
  weatherFinanceCondition:{color:"#E4EBF8",fontSize:11,lineHeight:16,fontFamily:D.fonts.bold,marginTop:3},
  weatherFinanceMeta:{color:"#B6C4DC",fontSize:9,lineHeight:14,marginTop:5},
  weatherFinanceTempWrap:{alignItems:"flex-end"},
  weatherFinanceTemp:{color:C.white,fontSize:42,lineHeight:46,fontFamily:D.fonts.regular,letterSpacing:-1.5},
  weatherForecastPanel:{marginTop:12,borderRadius:22,backgroundColor:"#536FA7",paddingHorizontal:15,paddingVertical:12},
  weatherForecastPanelTitle:{color:"#DCE7FA",fontSize:9,lineHeight:15,fontFamily:D.fonts.bold,letterSpacing:.75,paddingBottom:8,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.26)"},
  weatherFinanceRow:{height:39,flexDirection:"row",alignItems:"center",gap:8,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.19)"},
  weatherFinanceDay:{width:43,color:C.white,fontSize:12,lineHeight:16,fontFamily:D.fonts.bold,textTransform:"capitalize"},
  weatherFinanceDayToday:{fontFamily:D.fonts.extraBold},
  weatherFinanceLow:{width:25,color:"#C7D6F1",fontSize:12,textAlign:"right",fontFamily:D.fonts.bold},
  weatherFinanceTrack:{flex:1,height:5,borderRadius:4,backgroundColor:"rgba(24,43,81,.40)",overflow:"hidden",position:"relative"},
  weatherFinanceRange:{height:5,borderRadius:4,position:"absolute",top:0,backgroundColor:"#FFAD18"},
  weatherFinanceHigh:{width:27,color:C.white,fontSize:12,fontFamily:D.fonts.extraBold},
  weatherWidgetHero:{borderRadius:23,padding:17,overflow:"hidden"},
  weatherWidgetHeroTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  weatherWidgetLocation:{flexDirection:"row",alignItems:"center",gap:4},
  weatherWidgetLocationText:{color:C.white,fontSize:13,fontFamily:D.fonts.bold},
  weatherWidgetUpdated:{color:"rgba(255,255,255,.72)",fontSize:9,fontFamily:D.fonts.bold},
  weatherWidgetNow:{marginTop:9,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  weatherWidgetTemp:{color:C.white,fontSize:47,lineHeight:51,fontFamily:D.fonts.regular,letterSpacing:-1.5},
  weatherWidgetCondition:{color:C.white,fontSize:14,lineHeight:19,fontFamily:D.fonts.extraBold},
  weatherWidgetRange:{color:"#DDEAFF",fontSize:10,lineHeight:15,marginTop:2},
  weatherWidgetStats:{marginTop:13,paddingTop:12,borderTopWidth:1,borderTopColor:"rgba(255,255,255,.26)",flexDirection:"row"},
  weatherWidgetStat:{flex:1,alignItems:"center",gap:2},
  weatherWidgetStatValue:{color:C.white,fontSize:10,lineHeight:14,fontFamily:D.fonts.extraBold},
  weatherWidgetStatLabel:{color:"#D7E6FA",fontSize:8,lineHeight:11,fontFamily:D.fonts.regular},
  weatherHourlyRail:{gap:8,paddingVertical:13,paddingRight:8},
  weatherHourlyCard:{width:55,height:85,borderRadius:15,backgroundColor:"#EEF3FA",alignItems:"center",justifyContent:"center",gap:5},
  weatherHourlyCardActive:{backgroundColor:"#E6EDF8"},
  weatherHourlyTime:{color:"#697A93",fontSize:9,lineHeight:12,fontFamily:D.fonts.bold},
  weatherHourlyTemp:{color:C.navy,fontSize:14,lineHeight:18,fontFamily:D.fonts.extraBold},
  weatherDailyList:{maxHeight:247,borderTopWidth:1,borderTopColor:"#E0E7F0",paddingTop:3},
  weatherDailyRow:{minHeight:46,borderBottomWidth:1,borderBottomColor:"#E4EAF2",flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:4},
  weatherDailyDate:{color:C.navy,fontSize:11,lineHeight:15,fontFamily:D.fonts.extraBold},
  weatherDailyDay:{color:"#77879D",fontSize:9,lineHeight:13,fontFamily:D.fonts.regular,textTransform:"capitalize"},
  weatherDailyTemps:{flexDirection:"row",alignItems:"baseline",gap:7,minWidth:70,justifyContent:"flex-end"},
  weatherDailyHigh:{color:C.navy,fontSize:14,fontFamily:D.fonts.extraBold},
  weatherDailyLow:{color:"#8190A5",fontSize:12,fontFamily:D.fonts.bold},
  currencyDetailGrid:{flexDirection:"row",gap:10},
  currencyDetailCard:{flex:1,minHeight:122,padding:10},
  currencyDetailIcon:{width:34,height:34,borderRadius:17,backgroundColor:"rgba(231,64,34,.10)",alignItems:"center",justifyContent:"center",marginBottom:13},
  currencyDetailValue:{color:C.navy,fontSize:23,fontFamily:D.fonts.extraBold,marginTop:6},
  currencyDetailPair:{color:"#778499",fontSize:10,marginTop:4},
  currencyDetailTrend:{fontSize:10,fontFamily:D.fonts.bold,marginTop:8},
  currencyDetailTrendUp:{color:"#178A50"},
  currencyDetailTrendDown:{color:"#D54A38"},
  currencyFinanceGrid:{flexDirection:"row",gap:10,marginTop:2},
  currencyFinanceCard:{flex:1,minHeight:202,borderRadius:21,backgroundColor:"#1D2737",padding:14,justifyContent:"space-between",overflow:"hidden"},
  currencyFinanceHead:{flexDirection:"row",alignItems:"center",gap:9},
  currencyFinanceMark:{width:39,height:39,borderRadius:20,backgroundColor:"#1C4FA4",alignItems:"center",justifyContent:"center"},
  currencyFinanceSymbol:{color:C.white,fontSize:22,lineHeight:26,fontFamily:D.fonts.extraBold},
  currencyFinanceIdentity:{flex:1,minWidth:0},
  currencyFinanceCode:{color:C.white,fontSize:17,lineHeight:20,fontFamily:D.fonts.extraBold},
  currencyFinanceName:{color:"#C9D5E7",fontSize:10,lineHeight:14,fontFamily:D.fonts.regular},
  currencyFinanceTime:{color:"#B8C5D9",fontSize:8,lineHeight:12,fontFamily:D.fonts.bold,letterSpacing:.35,marginTop:13},
  currencyFinanceValue:{color:C.white,fontSize:26,lineHeight:31,fontFamily:D.fonts.extraBold,letterSpacing:-.7,marginTop:3},
  currencyFinanceTrend:{fontSize:11,lineHeight:15,fontFamily:D.fonts.extraBold,marginTop:4},
  currencyFinanceTrendUp:{color:"#32CF61"},
  currencyFinanceTrendDown:{color:"#FF806D"},
  currencyFinanceChangeAmount:{color:"#B5BFCD",fontFamily:D.fonts.bold},
  currencyDetailNote:{color:"#6D7A8D",fontSize:10,lineHeight:15,marginTop:14},
  horizontalBeam:{position:"absolute",left:0,width:92,height:1,zIndex:3,overflow:"hidden"},
  horizontalBeamTop:{top:0},
  horizontalBeamBottom:{bottom:0},
  modernMetric: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 5 },
  modernMetricIcon: { width: 20, height: 22, alignItems: "center", justifyContent: "center" },
  modernMetricValue: { color: C.white, fontSize: 12, lineHeight: 16, fontFamily: VODAFONE_BOLD, marginTop: 2 },
  modernMetricValueRow:{flexDirection:"row",alignItems:"center",gap:4},
  modernMetricHistory:{color:"#B8C5D9",fontSize:8.5,lineHeight:11,marginTop:2,maxWidth:108},
  modernBitumenValue:{fontSize:10.5},
  modernTrendArrow:{width:15,height:15,borderRadius:8,alignItems:"center",justifyContent:"center",marginTop:2},
  modernTrendUp:{backgroundColor:"#E5484D"},
  modernTrendDown:{backgroundColor:"#20B879"},
  modernMetricLabel: { color: "#E0E6EF", fontSize: 11, lineHeight: 12, fontFamily: VODAFONE_BOLD, letterSpacing: .45 },
  modernMetricDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,.28)" },
  modernSheet: { flex:1, marginTop:0, paddingTop:42, paddingBottom:104, backgroundColor: "#F7F8FA", overflow: "hidden" },
  homeStorySheet:{backgroundColor:C.navy,paddingTop:32},
  modernSheetHandle: { display: "none" },
  modernSectionHead: { paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 17 },
  modernSectionHeadingCopy: { flex: 1, paddingRight: 12 },
  modernQuickGreeting: {
    color: C.white,
    fontSize: 20,
    lineHeight: 25,
    fontFamily: D.fonts.bold,
  },
  modernQuickGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  modernQuickGreetingStrong: {
    color: C.white,
    fontFamily: D.fonts.extraBold,
  },
  modernKicker: { color: C.orange, fontSize: 11, fontFamily: VODAFONE_BOLD, letterSpacing: 1.2 },
  modernSectionTitle: { color: C.navy, ...D.type.section, fontFamily: D.fonts.extraBold, letterSpacing: -.4, marginTop: D.space.xs },
  modernSectionSubtitle: { color: C.muted, ...D.type.caption, marginTop: D.space.xs },
  modernSeeAll: { color: "#294F8B", fontSize: 13, fontFamily: VODAFONE_BOLD, paddingBottom: 3 },
  homeQuickBody:{flex:1,paddingHorizontal:D.space.md,gap:D.space.sm,minHeight:0},
  homeQuickFeature:{flex:1.05,minHeight:156,borderRadius:26,overflow:"hidden",padding:18,justifyContent:"space-between"},
  homeQuickFeatureGlow:{position:"absolute",right:-42,top:-68,width:220,height:220,borderRadius:110,backgroundColor:"rgba(255,122,24,.22)"},
  homeQuickFeatureTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeQuickLive:{height:29,borderRadius:15,backgroundColor:"rgba(255,255,255,.12)",paddingHorizontal:11,flexDirection:"row",alignItems:"center",gap:7},
  homeQuickLiveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#42D995"},
  homeQuickLiveText:{fontSize:9,color:C.white,fontFamily:D.fonts.bold,letterSpacing:1},
  homeQuickFeatureNo:{fontSize:11,color:"rgba(255,255,255,.66)",fontFamily:D.fonts.bold,letterSpacing:1},
  homeQuickFeatureBottom:{flexDirection:"row",alignItems:"center",gap:13},
  homeQuickFeatureIcon:{width:62,height:62,borderRadius:21,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  homeQuickFeatureTitle:{fontSize:22,lineHeight:25,color:C.white,fontFamily:D.fonts.extraBold,letterSpacing:-.45},
  homeQuickFeatureMeta:{fontSize:12,lineHeight:17,color:"#CCD5E3",marginTop:5,maxWidth:360},
  homeQuickFeatureArrow:{width:42,height:42,borderRadius:21,backgroundColor:C.white,alignItems:"center",justifyContent:"center"},
  modernQuickGrid: { flex:1.25,minHeight:250, flexDirection: "row", flexWrap: "wrap", gap: D.space.sm },
  modernQuickCard: { width: "48.5%", height:"48.3%", minHeight:112, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: D.colors.line, padding: 14, flexDirection:"column", alignItems:"flex-start", justifyContent:"space-between",gap:8, overflow:"hidden", shadowColor:"#15213A",shadowOpacity:.05,shadowRadius:13,shadowOffset:{width:0,height:5} },
  modernQuickCardWide: { width:"100%", minHeight:132, flexDirection:"row", alignItems:"center", padding:20 },
  homeActionPressed:{opacity:.72,transform:[{scale:.98}]},
  modernQuickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modernQuickCopy: { flex:1, minWidth:0 },
  modernQuickTitleRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", gap:4 },
  modernQuickArrow: { width:30, height:30, borderRadius:15, alignItems:"center", justifyContent:"center", backgroundColor:"#F0F2F5" },
  motionArrowHit:{minWidth:28,minHeight:28,alignItems:"center",justifyContent:"center"},
  modernQuickArrowWide: { backgroundColor:C.white },
  modernQuickTitle: { flexShrink:1, color: C.navy, fontSize:15, lineHeight:18, fontFamily: D.fonts.bold },
  modernQuickMeta: { color: C.muted, fontSize:12, lineHeight:15, marginTop: 3 },
  homeSupportRow:{minHeight:72,borderRadius:21,borderWidth:1,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:12},
  homeSupportIcon:{width:44,height:44,borderRadius:15,backgroundColor:"#E8F7EF",alignItems:"center",justifyContent:"center"},
  homeSupportTitle:{fontSize:15,fontFamily:D.fonts.bold},
  homeSupportMeta:{fontSize:11,marginTop:3},
  modernBanner: { marginHorizontal: 16, marginTop: 22, marginBottom: 30, borderRadius: 23, backgroundColor: C.navy, padding: 17, flexDirection: "row", alignItems: "center" },
  modernBannerIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  modernBannerCopy: { flex: 1, marginLeft: 13 },
  modernBannerKicker: { color: "#91A2BF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  modernBannerTitle: { color: C.white, fontSize: 14, fontWeight: "900", marginTop: 4 },
  modernBannerText: { color: "#B7C2D5", fontSize: 11, lineHeight: 12, marginTop: 4 },
  modernBannerArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,.1)", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  homeArBanner: { marginHorizontal:D.space.md, marginTop:16, marginBottom:0, minHeight:104, borderRadius:D.radius.lg, backgroundColor:C.navy, padding:14, flexDirection:"row", alignItems:"center", gap:12 },
  homeArIcon: { width:56, height:56, borderRadius:28, backgroundColor:C.orange, alignItems:"center", justifyContent:"center" },
  homeArKicker: { ...D.type.label, color:"#FFB27D", fontFamily:D.fonts.bold, letterSpacing:.8 },
  homeArTitle: { ...D.type.card, color:C.white, fontFamily:D.fonts.bold, marginTop:4 },
  homeArBody: { ...D.type.caption, color:"#C4CEDD", marginTop:4 },
  homeActivityDeck:{flex:1,minHeight:0,marginTop:8},
  homeActivityViewport:{flex:1,minHeight:0},
  homeActivityRail: { paddingHorizontal:16, paddingBottom:16, gap:0 },
  homeActivityCard: { borderRadius:24, overflow:"hidden", backgroundColor:C.navy },
  homeActivityCinematicTop:{position:"absolute",left:22,right:22,top:22,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeActivityEyebrow:{fontSize:11,color:"#FFC39D",fontFamily:D.fonts.bold,letterSpacing:1.15},
  homeActivityCounter:{fontSize:27,lineHeight:30,color:C.white,fontFamily:D.fonts.extraBold},
  homeActivityCounterTotal:{fontSize:13,color:"rgba(255,255,255,.58)",fontFamily:D.fonts.bold},
  homeActivityPlay:{width:46,height:46,borderRadius:23,backgroundColor:"rgba(7,20,45,.58)",borderWidth:1,borderColor:"rgba(255,255,255,.34)",alignItems:"center",justifyContent:"center"},
  homeActivityCinematicCopy:{position:"absolute",left:22,right:22,bottom:22},
  homeActivityRule:{width:42,height:3,borderRadius:2,backgroundColor:C.orange,marginBottom:13},
  homeActivityTitle: { fontSize:31,lineHeight:34,color:C.white, fontFamily:D.fonts.extraBold,letterSpacing:-.7 },
  homeActivityMeta: { fontSize:14,lineHeight:20,color:"#D3DCE9", marginTop:7,maxWidth:390 },
  homeActivityCinematicBottom:{marginTop:17,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeActivitySwipeHint:{color:"rgba(255,255,255,.68)",fontSize:11,fontFamily:D.fonts.regular},
  homeActivityAction: { minHeight:44,borderRadius:22, backgroundColor:C.orange, flexDirection:"row", alignItems:"center", gap:D.space.sm, paddingHorizontal:D.space.md },
  homeActivityActionText: { ...D.type.caption, color:C.white, fontFamily:D.fonts.bold },
  homeActivityDots:{height:22,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:6},
  homeActivityDot:{width:7,height:3,borderRadius:2,backgroundColor:"rgba(255,255,255,.38)"},
  homeActivityDotActive:{width:28,backgroundColor:C.orange},
  homeFieldSheet:{backgroundColor:C.navy,paddingTop:26,paddingHorizontal:18,paddingBottom:112},
  homeFieldHeader:{paddingHorizontal:4},
  homeFieldKicker:{color:C.orange,fontSize:11,fontFamily:D.fonts.bold,letterSpacing:1.25},
  homeFieldTitle:{color:C.white,fontSize:32,lineHeight:35,fontFamily:D.fonts.extraBold,letterSpacing:-.65,marginTop:7},
  homeFieldStats:{flexDirection:"row",alignItems:"center",gap:8,marginTop:14},
  homeFieldStat:{height:32,borderRadius:16,paddingHorizontal:11,flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"rgba(255,255,255,.08)",borderWidth:1,borderColor:"rgba(255,255,255,.1)"},
  homeFieldLiveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#36D493"},
  homeFieldStatText:{color:"#D6DFED",fontSize:10,fontFamily:D.fonts.bold},
  homeFieldFlow:{flex:1,minHeight:0,gap:11},
  homeFieldLead:{flex:1.42,minHeight:0,borderRadius:27,overflow:"hidden",backgroundColor:"#101D37"},
  homeFieldLeadTop:{position:"absolute",left:16,right:16,top:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeFieldStep:{height:30,borderRadius:15,paddingHorizontal:11,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(5,15,34,.62)",borderWidth:1,borderColor:"rgba(255,255,255,.2)"},
  homeFieldStepText:{color:C.white,fontSize:9,fontFamily:D.fonts.bold,letterSpacing:.8},
  homeFieldPlay:{width:42,height:42,borderRadius:21,backgroundColor:"rgba(255,255,255,.94)",alignItems:"center",justifyContent:"center"},
  homeFieldLeadCopy:{position:"absolute",left:18,right:18,bottom:17},
  homeFieldLeadTitle:{color:C.white,fontSize:26,lineHeight:29,fontFamily:D.fonts.extraBold,letterSpacing:-.45},
  homeFieldLeadMeta:{color:"#D5DDEA",fontSize:12,lineHeight:16,marginTop:5,maxWidth:"90%"},
  homeFieldLink:{height:32,alignSelf:"flex-start",marginTop:11,paddingLeft:12,paddingRight:7,borderRadius:16,flexDirection:"row",alignItems:"center",gap:7,backgroundColor:C.orange},
  homeFieldLinkText:{color:C.white,fontSize:10,fontFamily:D.fonts.bold},
  homeFieldMiniRow:{flex:.72,minHeight:142,flexDirection:"row",gap:11},
  homeFieldMini:{flex:1,minWidth:0,borderRadius:22,overflow:"hidden",backgroundColor:"#101D37"},
  homeFieldMiniIndex:{position:"absolute",left:13,top:13,width:30,height:25,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(5,15,34,.58)",borderWidth:1,borderColor:"rgba(255,255,255,.18)"},
  homeFieldMiniIndexText:{color:C.white,fontSize:9,fontFamily:D.fonts.bold},
  homeFieldMiniCopy:{position:"absolute",left:13,right:12,bottom:13,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",gap:7},
  homeFieldMiniTitle:{flex:1,color:C.white,fontSize:16,lineHeight:18,fontFamily:D.fonts.extraBold,letterSpacing:-.25},
  homeFieldMiniArrow:{width:30,height:30,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.18)"},
  homeSimpleFooter:{minHeight:76,marginHorizontal:18,marginTop:10,marginBottom:0,borderRadius:22,borderWidth:1,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeSimpleFooterText:{fontSize:16,lineHeight:20,fontFamily:VODAFONE_BOLD,marginTop:5},
  homeSimpleFooterArrow:{width:42,height:42,borderRadius:21,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  homeProductRail:{paddingHorizontal:16,gap:11,paddingBottom:30},
  homeProductCard:{width:190,height:150,borderRadius:22,overflow:"hidden",backgroundColor:C.navy},
  homeProductMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%",backgroundColor:"#E9ECF1"},
  homeProductNo:{position:"absolute",left:13,top:12,fontSize: 11,fontWeight:"900",letterSpacing:1.4,color:C.white},
  homeProductCopy:{position:"absolute",left:14,right:14,bottom:14},
  homeProductTitle:{color:C.white,fontSize:16,fontWeight:"900"},
  homeProductMeta:{color:"#D7DEEA",fontSize: 11,marginTop:4},
  homeNewIntro:{paddingHorizontal:22,paddingTop:42,paddingBottom:38,backgroundColor:"#F5F6F8"},
  homeNewIntroTop:{alignItems:"flex-start"},
  homeNewKicker:{fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.65,color:C.orange},
  homeNewAnniversaryLogo:{width:150,height:44,marginTop:9,alignSelf:"flex-start"},
  homeNewTitle:{fontSize:34,lineHeight:38,fontFamily:D.fonts.extraBold,color:C.navy,letterSpacing:-1,marginTop:7},
  homeNewBody:{fontSize:14,lineHeight:22,color:"#627086",marginTop:15,maxWidth:390},
  homeNewBodySecondary:{fontSize:14,lineHeight:22,color:"#627086",marginTop:12,maxWidth:390},
  homeNewValues:{gap:0,marginTop:25,paddingRight:8},
  homeNewValue:{width:132,minHeight:116,paddingHorizontal:10,paddingVertical:5,marginRight:3,justifyContent:"flex-start"},
  homeNewValueMark:{width:56,height:33,alignSelf:"flex-start"},
  homeNewValueTitle:{fontSize:11,lineHeight:15,fontFamily:D.fonts.bold,color:C.navy,marginTop:11},
  homeNewValueText:{fontSize:9,lineHeight:13,color:"#66758B",marginTop:3},
  homeCapacitySection:{height:516,backgroundColor:C.navy,overflow:"hidden",paddingHorizontal:22,paddingTop:35,paddingBottom:22},
  homeCapacityImage:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  homeCapacityCopy:{maxWidth:330},
  homeCapacityTitle:{fontSize:31,lineHeight:35,fontFamily:D.fonts.extraBold,color:C.white,letterSpacing:-.8,marginTop:8},
  homeCapacityBody:{fontSize:13,lineHeight:20,color:"#D1DBEA",marginTop:11},
  homeCapacityGrid:{marginTop:"auto",flexDirection:"row",borderTopWidth:1,borderTopColor:"rgba(255,255,255,.22)",paddingTop:17},
  homeCapacityMetric:{flex:1,paddingRight:8},
  homeCapacityValue:{fontSize:25,fontFamily:D.fonts.extraBold,color:C.white,letterSpacing:-.6},
  homeCapacityLabel:{fontSize:9,lineHeight:13,color:"#C8D3E2",marginTop:3},
  homeCapacityLink:{height:48,borderRadius:16,backgroundColor:C.orange,paddingHorizontal:16,marginTop:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeCapacityLinkText:{fontSize:12,fontFamily:D.fonts.bold,color:C.white},
  homeSolutionSection:{paddingTop:39,paddingBottom:39,backgroundColor:C.white},
  homeSolutionTitle:{fontSize:31,lineHeight:35,fontFamily:D.fonts.extraBold,color:C.navy,letterSpacing:-.8,marginTop:7,paddingHorizontal:22},
  homeSolutionIntro:{fontSize:13,lineHeight:20,color:"#667389",paddingHorizontal:22,marginTop:11,maxWidth:390},
  homeSolutionRail:{gap:11,paddingHorizontal:22,paddingTop:23,paddingRight:32},
  stackedRail:{height:300,paddingTop:24,paddingBottom:20},
  stackedCard:{height:242,marginRight:-96,borderRadius:25,overflow:"hidden",backgroundColor:C.navy},
  stackedCardPress:{flex:1},
  stackedMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  stackedBadge:{position:"absolute",top:15,right:15,paddingHorizontal:10,height:25,borderRadius:13,backgroundColor:"rgba(255,255,255,.93)",justifyContent:"center"},
  stackedBadgeText:{fontSize:8,fontFamily:D.fonts.bold,letterSpacing:1,color:C.navy},
  stackedCopy:{position:"absolute",left:17,right:17,bottom:17},
  stackedIcon:{width:35,height:35,borderRadius:12,backgroundColor:"rgba(255,255,255,.92)",alignItems:"center",justifyContent:"center",marginBottom:10},
  stackedTitle:{color:C.white,fontSize:21,lineHeight:24,fontFamily:D.fonts.extraBold},
  stackedText:{color:"rgba(255,255,255,.78)",fontSize:10,lineHeight:14,marginTop:5,maxWidth:"90%"},
  homeSolutionCard:{width:226,minHeight:218,borderRadius:22,backgroundColor:C.navy,padding:16,overflow:"hidden"},
  homeSolutionMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  homeSolutionNo:{fontSize:10,fontFamily:D.fonts.bold,color:"rgba(255,255,255,.76)",letterSpacing:1},
  homeSolutionIcon:{width:42,height:42,borderRadius:14,backgroundColor:"rgba(255,255,255,.92)",alignItems:"center",justifyContent:"center",marginTop:20},
  homeSolutionCardTitle:{fontSize:18,lineHeight:22,fontFamily:D.fonts.extraBold,color:C.white,marginTop:17},
  homeSolutionCardText:{fontSize:11,lineHeight:16,color:"rgba(255,255,255,.82)",marginTop:6,flex:1},
  homeSolutionLink:{alignSelf:"flex-start",height:34,paddingHorizontal:12,borderRadius:17,backgroundColor:C.orange,flexDirection:"row",alignItems:"center",gap:7,marginTop:12},
  homeSolutionLinkText:{fontSize:10,fontFamily:D.fonts.bold,color:C.white},
  homeProcessSection:{paddingHorizontal:22,paddingTop:39,paddingBottom:40,backgroundColor:"#EDF0F4"},
  homeProcessKicker:{fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.65,color:C.orange},
  homeProcessTitle:{fontSize:31,lineHeight:35,fontFamily:D.fonts.extraBold,color:C.navy,letterSpacing:-.8,marginTop:7,marginBottom:25},
  homeProcessRow:{minHeight:84,flexDirection:"row",gap:14,position:"relative"},
  homeProcessNo:{width:38,height:38,borderRadius:19,backgroundColor:C.navy,alignItems:"center",justifyContent:"center",zIndex:2},
  homeProcessNoText:{fontSize:10,fontFamily:D.fonts.bold,color:C.white},
  homeProcessCopy:{flex:1,paddingBottom:19},
  homeProcessRowTitle:{fontSize:15,fontFamily:D.fonts.bold,color:C.navy,marginTop:2},
  homeProcessRowText:{fontSize:11,lineHeight:16,color:"#68758A",marginTop:5},
  homeProcessLine:{position:"absolute",left:18.5,top:38,bottom:0,width:1,backgroundColor:"#B8C2D0"},
  homeProcessCta:{height:54,borderRadius:18,backgroundColor:C.orange,paddingHorizontal:17,marginTop:4,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeProcessCtaText:{fontSize:13,fontFamily:D.fonts.bold,color:C.white},
  homeNewFooter:{paddingHorizontal:22,paddingTop:43,paddingBottom:48,backgroundColor:C.navy},
  homeNewFooterKicker:{fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.55,color:"#FFB485"},
  homeNewFooterTitle:{fontSize:31,lineHeight:35,fontFamily:D.fonts.extraBold,color:C.white,letterSpacing:-.8,marginTop:8},
  homeNewFooterText:{fontSize:13,lineHeight:20,color:"#C5D0E1",marginTop:12,maxWidth:380},
  homeMissionGrid:{gap:10,marginTop:20},
  homeMissionCard:{borderRadius:20,padding:16,backgroundColor:"rgba(255,255,255,.08)",borderWidth:1,borderColor:"rgba(255,255,255,.12)"},
  homeMissionTitle:{fontSize:16,fontFamily:D.fonts.extraBold,color:C.white,marginTop:10},
  homeMissionText:{fontSize:12,lineHeight:18,color:"#C5D0E1",marginTop:6},
  homeNewFooterButton:{height:50,borderRadius:16,borderWidth:1,borderColor:"rgba(255,255,255,.24)",paddingHorizontal:16,marginTop:23,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  homeNewFooterButtonText:{fontSize:12,fontFamily:D.fonts.bold,color:C.white},
  homeReferencesSection:{backgroundColor:C.white,paddingTop:42,paddingBottom:46,paddingHorizontal:22},
  homeReferencesTitle:{fontSize:30,lineHeight:34,fontFamily:D.fonts.extraBold,color:C.navy,letterSpacing:-.7,marginTop:8},
  homeReferencesText:{fontSize:13,lineHeight:20,color:"#68758A",marginTop:12,maxWidth:380},
  homeLogoRail:{gap:7,paddingTop:22,paddingRight:8},
  homeLogoCard:{width:190,height:84,padding:1,alignItems:"center",justifyContent:"center"},
  homeLogoImage:{width:"100%",height:"100%"},
  tekProductsPage:{flex:1,backgroundColor:C.navy},
  tekProductsInner:{paddingBottom:130},
  productFullscreenInner:{paddingBottom:0},
  productCollectionInner:{paddingTop:92,paddingBottom:132,backgroundColor:"#F5F6F8"},
  productCollectionHeader:{paddingHorizontal:20,paddingBottom:22},
  productCollectionKicker:{fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.55,color:C.orange},
  productCollectionHero:{fontSize:33,lineHeight:37,fontFamily:D.fonts.extraBold,color:C.navy,letterSpacing:-.9,marginTop:7},
  productCollectionIntro:{fontSize:13,lineHeight:19,color:"#66738A",marginTop:9,maxWidth:350},
  productSimpleHeader:{paddingHorizontal:20,paddingBottom:22},
  productSimpleKicker:{fontSize:11,lineHeight:14,fontFamily:D.fonts.bold,letterSpacing:1.8,color:C.orange},
  productSimpleTitle:{fontSize:34,lineHeight:39,fontFamily:D.fonts.extraBold,letterSpacing:-.7,marginTop:7},
  productSimpleIntro:{fontSize:16,lineHeight:23,maxWidth:370,marginTop:8},
  productOverview:{paddingHorizontal:16,gap:14},
  radialCarousel:{height:330,position:"relative",alignItems:"center",justifyContent:"center",marginTop:8},
  radialProductCard:{position:"absolute",height:274,borderRadius:25,overflow:"hidden",backgroundColor:C.navy},
  productSwipeRail:{gap:12,paddingHorizontal:24,paddingTop:5,paddingBottom:8},
  productSwipeCard:{borderRadius:28,overflow:"hidden",backgroundColor:C.navy},
  radialCarouselControls:{height:48,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:21,marginTop:5},
  radialSwipeHint:{minHeight:42,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,marginTop:2},
  radialSwipeHintText:{color:"#6D7B90",fontSize:10,fontFamily:D.fonts.bold},
  radialCarouselArrow:{width:46,height:46,borderRadius:23,backgroundColor:"#EEF2F7",alignItems:"center",justifyContent:"center"},
  radialDots:{flexDirection:"row",gap:5,alignItems:"center",maxWidth:130,flexWrap:"wrap",justifyContent:"center"},
  radialDot:{width:5,height:5,borderRadius:3,backgroundColor:"#C7D0DD"},
  radialDotActive:{width:18,backgroundColor:C.orange},
  productSnapPage: Platform.select({
    web: { scrollSnapAlign:"start", scrollSnapStop:"always" } as any,
    default: {},
  }),
  productShowcaseCard:{width:"100%",height:250,borderRadius:25,overflow:"hidden",backgroundColor:"#EDEDE8",borderWidth:1,borderColor:"rgba(13,29,57,.08)"},
  productShowcaseMedia:{flex:1,overflow:"hidden",backgroundColor:"#0B0C0F"},
  productShowcaseImage:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  productShowcaseWash:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(4,7,12,.08)"},
  productShowcaseGhost:{display:"none"},
  productShowcaseTop:{position:"absolute",left:18,right:18,top:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  productShowcaseNo:{fontSize:11,fontFamily:D.fonts.bold,color:C.white,letterSpacing:1.2},
  productShowcaseTag:{height:30,borderRadius:15,paddingHorizontal:12,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  productShowcaseTagText:{fontSize:9,fontFamily:D.fonts.bold,color:C.white,letterSpacing:1},
  productShowcaseCopy:{position:"absolute",left:18,right:18,bottom:17},
  productShowcaseMeta:{fontSize:12,lineHeight:16,fontFamily:D.fonts.bold,color:C.orange,letterSpacing:.7,textTransform:"uppercase"},
  productShowcaseTitle:{fontSize:28,lineHeight:31,fontFamily:D.fonts.extraBold,color:C.white,letterSpacing:-.6,marginTop:3},
  productShowcaseSummary:{fontSize:12,lineHeight:16,color:"#E0E4EB",marginTop:4,maxWidth:310},
  productShowcaseAction:{alignSelf:"flex-start",height:34,borderRadius:17,backgroundColor:"rgba(255,255,255,.12)",borderWidth:1,borderColor:"rgba(255,255,255,.22)",paddingHorizontal:12,marginTop:10,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7},
  productShowcaseActionText:{fontSize:10,fontFamily:D.fonts.bold,color:C.white},
  productShowcaseIndex:{position:"absolute",right:20,bottom:126,flexDirection:"row",alignItems:"center",gap:5},
  productShowcaseIndexActive:{width:26,height:3,borderRadius:2,backgroundColor:C.orange},
  productShowcaseIndexDot:{width:5,height:5,borderRadius:3,backgroundColor:"rgba(255,255,255,.4)"},
  productShowcaseNumber:{position:"absolute",right:16,top:15,width:32,height:28,borderRadius:14,backgroundColor:"rgba(255,255,255,.16)",borderWidth:1,borderColor:"rgba(255,255,255,.24)",alignItems:"center",justifyContent:"center"},
  productShowcaseNumberText:{fontSize:10,fontFamily:D.fonts.bold,color:C.white,letterSpacing:.6},
  productShowcaseArrow:{width:40,height:40,borderRadius:20,backgroundColor:"#F0F2F5",alignItems:"center",justifyContent:"center"},
  productFeatured:{height:420,borderRadius:30,overflow:"hidden",backgroundColor:C.navy,shadowColor:C.navy,shadowOpacity:.2,shadowRadius:20,shadowOffset:{width:0,height:10}},
  productFeaturedMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  productFeaturedBadge:{position:"absolute",left:18,top:18,minHeight:32,borderRadius:16,paddingHorizontal:12,backgroundColor:"rgba(255,255,255,.92)",flexDirection:"row",alignItems:"center",gap:7},
  productFeaturedDot:{width:7,height:7,borderRadius:4,backgroundColor:C.orange},
  productFeaturedBadgeText:{fontSize:10,fontFamily:D.fonts.bold,color:C.navy,letterSpacing:.8},
  productFeaturedCopy:{position:"absolute",left:20,right:20,bottom:20},
  productFeaturedNo:{fontSize:11,fontFamily:D.fonts.bold,color:"#FFC19B",letterSpacing:1.2},
  productFeaturedTitle:{fontSize:34,lineHeight:38,fontFamily:D.fonts.extraBold,color:C.white,marginTop:7},
  productFeaturedMeta:{fontSize:15,lineHeight:20,color:"#D6DEEA",marginTop:5},
  productFeaturedAction:{height:48,borderRadius:24,backgroundColor:C.orange,paddingHorizontal:18,marginTop:17,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  productFeaturedActionText:{fontSize:14,fontFamily:D.fonts.bold,color:C.white},
  productCollectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:30,marginBottom:13,paddingHorizontal:2},
  productCollectionTitle:{fontSize:23,lineHeight:28,fontFamily:D.fonts.extraBold},
  productCollectionCount:{fontSize:13,fontFamily:D.fonts.bold},
  productOverviewList:{gap:11},
  productOverviewRow:{minHeight:132,borderRadius:22,borderWidth:1,overflow:"hidden",flexDirection:"row",padding:8},
  productOverviewThumb:{width:116,minHeight:116,borderRadius:16,overflow:"hidden",backgroundColor:"#DCE2E9"},
  productOverviewImage:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  productOverviewNo:{position:"absolute",left:10,bottom:8,fontSize:10,fontFamily:D.fonts.bold,color:C.white,letterSpacing:1},
  productOverviewCopy:{flex:1,paddingHorizontal:14,paddingVertical:8,justifyContent:"center"},
  productOverviewTitle:{fontSize:19,lineHeight:23,fontFamily:D.fonts.extraBold},
  productOverviewMeta:{fontSize:13,lineHeight:17,marginTop:4},
  productOverviewLink:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12},
  productOverviewLinkText:{fontSize:10,fontFamily:D.fonts.bold,color:C.orange,letterSpacing:1},
  productCardPressed:{opacity:.78,transform:[{scale:.985}]},
  readyDetailPage:{flex:1,backgroundColor:C.white},
  readyDetailInner:{paddingBottom:135},
  readyModelStage:{height:510,backgroundColor:C.white},
  modelStageTransition:{position:"absolute",left:0,right:0,bottom:0,height:92,zIndex:2},
  modelFullscreenBadge:{position:"absolute",top:104,left:20,zIndex:4,height:30,borderRadius:15,paddingHorizontal:11,backgroundColor:"rgba(8,20,43,.72)",borderWidth:1,borderColor:"rgba(255,255,255,.2)",alignItems:"center",justifyContent:"center"},
  modelFullscreenBadgeText:{fontSize:9,fontFamily:D.fonts.bold,color:C.white,letterSpacing:1},
  modelFullscreenPanel:{position:"absolute",left:18,right:18,bottom:104,zIndex:4,minHeight:88,borderRadius:24,paddingHorizontal:18,paddingVertical:14,backgroundColor:"rgba(7,20,45,.78)",borderWidth:1,borderColor:"rgba(255,255,255,.24)",flexDirection:"row",alignItems:"center",gap:12},
  modelFullscreenKicker:{fontSize:9,fontFamily:D.fonts.bold,color:"#FFB98A",letterSpacing:1.1},
  modelFullscreenTitle:{fontSize:24,lineHeight:27,fontFamily:D.fonts.extraBold,color:C.white,marginTop:3},
  modelFullscreenMeta:{fontSize:12,lineHeight:15,color:"#D6DEEA",marginTop:3},
  modelFullscreenSections:{fontSize:8,lineHeight:11,fontFamily:D.fonts.bold,color:"rgba(255,255,255,.64)",letterSpacing:.7,marginTop:6},
  modelFullscreenRotate:{width:52,height:52,borderRadius:26,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  modelFullscreenRotatePressed:{transform:[{translateY:4},{scale:.96}],opacity:.88},
  modelFullscreenRotateText:{fontSize:8,fontFamily:D.fonts.bold,color:C.white,marginTop:-2},
  readyModelHint:{position:"absolute",alignSelf:"center",bottom:14,width:58,height:58,zIndex:4},
  modelStageActions:{position:"absolute",right:18,bottom:32,zIndex:7,flexDirection:"row",alignItems:"center"},
  model360Left:{width:58,height:58},
  model360Center:{position:"absolute",left:"50%",marginLeft:-29,width:58,height:58},
  model360StageCenter:{position:"absolute",left:"50%",top:"50%",marginLeft:-29,marginTop:-29,width:58,height:58,zIndex:7},
  model360Animation:{width:"100%",height:"100%"},
  modelDetailButton:{width:66,height:66,borderRadius:33,backgroundColor:C.orange,flexDirection:"column",gap:0,alignItems:"center",justifyContent:"center"},
  modelDetailButtonText:{fontSize:9,fontFamily:D.fonts.bold,color:C.white,letterSpacing:.7},
  bitumenVatToggle:{height:42,marginTop:12,padding:3,borderRadius:14,backgroundColor:"#E7ECF2",flexDirection:"row"},
  bitumenVatOption:{flex:1,borderRadius:11,alignItems:"center",justifyContent:"center"},
  bitumenVatOptionActive:{backgroundColor:C.orange},
  bitumenVatOptionText:{fontSize:10,fontFamily:D.fonts.bold,color:"#66758A",letterSpacing:.45},
  bitumenVatOptionTextActive:{color:C.white},
  homeRegistered:{fontSize:8,lineHeight:9,color:C.orange,fontFamily:D.fonts.bold},
  readyModelHintText:{fontSize:11,fontFamily:D.fonts.bold,color:C.navy},
  rotate3dIcon:{width:30,height:30,alignItems:"center",justifyContent:"center"},
  rotate3dArrow:{position:"absolute",left:3,top:3},
  readyDetailSheet:{marginTop:-2,paddingHorizontal:20,paddingTop:22,paddingBottom:28,backgroundColor:C.white,borderTopLeftRadius:0,borderTopRightRadius:0},
  readyTitleRow:{flexDirection:"row",alignItems:"flex-start",gap:14},
  readyTitleCopy:{flex:1},
  readyDetailKicker:{fontSize:10,fontFamily:D.fonts.bold,color:C.orange,letterSpacing:1.2},
  readyDetailTitle:{fontSize:31,lineHeight:35,fontFamily:D.fonts.extraBold,color:C.navy,marginTop:6},
  readyDetailMeta:{fontSize:14,lineHeight:19,color:C.muted,marginTop:5},
  readyPackBadge:{width:58,height:58,borderRadius:19,backgroundColor:"#F2F3F5",alignItems:"center",justifyContent:"center"},
  readyPackBadgeValue:{fontSize:20,lineHeight:22,fontFamily:D.fonts.extraBold,color:C.navy},
  readyPackBadgeLabel:{fontSize:9,fontFamily:D.fonts.bold,color:C.orange,letterSpacing:.8},
  readyBenefitGrid:{flexDirection:"row",gap:8,marginTop:20},
  readyBenefitCard:{flex:1,minHeight:108,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:"#E2E4E8",padding:11},
  readyBenefitIcon:{width:34,height:34,borderRadius:11,backgroundColor:"#FFF0E6",alignItems:"center",justifyContent:"center"},
  readyBenefitValue:{fontSize:13,lineHeight:16,fontFamily:D.fonts.extraBold,color:C.navy,marginTop:9},
  readyBenefitLabel:{fontSize:10,lineHeight:13,color:"#6D7788",marginTop:2},
  readyTabs:{height:52,borderRadius:18,backgroundColor:"#F2F3F5",padding:4,flexDirection:"row",marginTop:22},
  readyTab:{flex:1,borderRadius:15,alignItems:"center",justifyContent:"center"},
  readyTabActive:{backgroundColor:C.orange},
  readyTabText:{fontSize:13,fontFamily:D.fonts.bold,color:"#7A8596"},
  readyTabTextActive:{color:C.white},
  readyDescription:{fontSize:15,lineHeight:23,color:"#596578",marginTop:19},
  readyUsageList:{marginTop:12},
  readyUsageRow:{minHeight:52,borderBottomWidth:1,borderBottomColor:"#E7E9ED",flexDirection:"row",alignItems:"center",gap:13},
  readyUsageNo:{fontSize:10,fontFamily:D.fonts.bold,color:C.orange},
  readyUsageText:{flex:1,fontSize:14,lineHeight:19,color:C.navy},
  readyTechnicalHead:{marginTop:32,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between"},
  readyTechnicalTitle:{fontSize:24,lineHeight:28,fontFamily:D.fonts.extraBold,color:C.navy,marginTop:5},
  readyTechnicalCount:{height:30,borderRadius:15,backgroundColor:"#E8EAEF",paddingHorizontal:11,alignItems:"center",justifyContent:"center"},
  readyTechnicalCountText:{fontSize:9,fontFamily:D.fonts.bold,color:"#687386",letterSpacing:.8},
  readyAccordion:{marginTop:15,borderRadius:22,backgroundColor:C.white,borderWidth:1,borderColor:"#E1E4E8",overflow:"hidden"},
  readyAccordionItem:{borderBottomWidth:1,borderBottomColor:"#E7E9EC"},
  readyAccordionItemOpen:{backgroundColor:"#FFF9F5"},
  readyAccordionButton:{minHeight:66,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:11},
  readyAccordionIcon:{width:38,height:38,borderRadius:13,backgroundColor:"#EEF0F3",alignItems:"center",justifyContent:"center"},
  readyAccordionIconOpen:{backgroundColor:C.orange},
  readyAccordionTitle:{flex:1,fontSize:14,fontFamily:D.fonts.bold,color:C.navy},
  readyAccordionBody:{paddingHorizontal:16,paddingBottom:17,gap:10},
  readyAccordionBullet:{flexDirection:"row",alignItems:"flex-start",gap:10},
  readyAccordionDot:{width:6,height:6,borderRadius:3,backgroundColor:C.orange,marginTop:7},
  readyAccordionText:{flex:1,fontSize:13,lineHeight:20,color:"#596578"},
  readyStepsHead:{marginTop:34},
  readyStepsTitle:{fontSize:27,lineHeight:31,fontFamily:D.fonts.extraBold,color:C.navy,marginTop:5},
  readyStepsIntro:{fontSize:13,lineHeight:19,color:"#667185",marginTop:6},
  readyStepsRail:{gap:12,paddingTop:16,paddingRight:20,paddingBottom:6},
  readyStepCard:{width:262,minHeight:310,borderRadius:22,backgroundColor:C.white,borderWidth:1,borderColor:"#E1E4E8",overflow:"hidden"},
  readyStepImage:{width:"100%",height:160,backgroundColor:"#E8E8E5"},
  readyStepCopy:{padding:15,flexDirection:"row",alignItems:"flex-start",gap:11},
  readyStepNo:{width:34,height:34,borderRadius:12,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  readyStepNoText:{fontSize:10,fontFamily:D.fonts.bold,color:C.white},
  readyStepTitle:{fontSize:17,lineHeight:20,fontFamily:D.fonts.extraBold,color:C.navy},
  readyStepText:{fontSize:12,lineHeight:18,color:"#657185",marginTop:5},
  readyStandardCard:{marginTop:22,minHeight:104,borderRadius:22,backgroundColor:C.navy,padding:16,flexDirection:"row",alignItems:"center",gap:13},
  readyStandardIcon:{width:46,height:46,borderRadius:15,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  readyStandardKicker:{fontSize:9,fontFamily:D.fonts.bold,color:"#FFB888",letterSpacing:1.1},
  readyStandardTitle:{fontSize:16,lineHeight:20,fontFamily:D.fonts.extraBold,color:C.white,marginTop:4},
  readyStandardText:{fontSize:11,lineHeight:16,color:"#BFC9D8",marginTop:4},
  readyQuoteButton:{height:58,borderRadius:18,backgroundColor:C.orange,paddingHorizontal:18,marginTop:22,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  readyQuoteButtonText:{fontSize:15,fontFamily:D.fonts.bold,color:C.white},
  productSimpleGrid:{paddingHorizontal:16,gap:16},
  productSimpleCard:{width:"100%",minHeight:348,borderRadius:28,overflow:"hidden",borderWidth:1},
  productSimpleMediaWrap:{height:224,overflow:"hidden",backgroundColor:"#DCE2E9"},
  productSimpleMediaDark:{backgroundColor:C.navy},
  productSimpleMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  productSimpleNo:{position:"absolute",left:18,bottom:14,color:C.white,fontSize:12,fontFamily:D.fonts.bold,letterSpacing:1.2},
  productSimpleCopy:{minHeight:124,paddingHorizontal:18,paddingVertical:16,flexDirection:"row",alignItems:"center",gap:12},
  productSimpleText:{flex:1},
  productSimpleCardTitle:{fontSize:23,lineHeight:27,fontFamily:D.fonts.extraBold},
  productSimpleMeta:{fontSize:14,lineHeight:18,marginTop:4},
  productSimpleSummary:{fontSize:13,lineHeight:18,marginTop:8},
  productSimpleArrow:{width:44,height:44,borderRadius:22,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  tekProductsHeader:{paddingHorizontal:D.space.lg,paddingTop:92,paddingBottom:D.space.xl},
  tekProductsHeaderTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:22},
  productCountPill:{minWidth:76,height:44,borderRadius:22,borderWidth:1,borderColor:"rgba(255,255,255,.25)",backgroundColor:"rgba(255,255,255,.1)",paddingHorizontal:14,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6},
  productCountValue:{...D.type.card,color:C.white,fontFamily:D.fonts.extraBold},
  productCountLabel:{...D.type.label,color:"#C9D3E2",fontFamily:D.fonts.bold},
  tekProductsEyebrow:{fontSize:10,fontWeight:"900",letterSpacing:2.2,color:C.orange},
  productHeroWordRow:{flexDirection:"row",alignItems:"baseline",marginTop:D.space.md},
  productHeroWord:{fontSize:52,lineHeight:56,color:C.white,fontFamily:D.fonts.extraBold,letterSpacing:-2},
  productHeroSlash:{fontSize:58,lineHeight:60,color:C.orange,fontFamily:D.fonts.light,marginHorizontal:7},
  productHeroNumber:{fontSize:34,lineHeight:40,color:"#8FA1BF",fontFamily:D.fonts.bold},
  tekProductsIntro:{...D.type.body,color:"#D4DCE8",marginTop:D.space.sm,maxWidth:390},
  productAttributeRow:{flexDirection:"row",alignItems:"center",gap:10,marginTop:D.space.lg},
  productAttribute:{...D.type.label,color:"#9FB0CA",fontFamily:D.fonts.bold,letterSpacing:1},
  productAttributeDot:{width:4,height:4,borderRadius:2,backgroundColor:C.orange},
  swipeHint:{marginTop:16,flexDirection:"row",alignItems:"center",gap:7},
  swipeHintText:{fontSize: 11,fontWeight:"800",letterSpacing:.4,color:"#738097"},
  productDeckHeader:{paddingHorizontal:D.space.lg,paddingTop:D.space.lg,flexDirection:"row",alignItems:"center",gap:D.space.sm},
  productDeckKicker:{...D.type.label,color:"#AFC0D8",fontFamily:D.fonts.bold,letterSpacing:1},
  productDeckRule:{flex:1,height:1,backgroundColor:"rgba(255,255,255,.16)"},
  tekProductsRail:{paddingHorizontal:D.space.md,paddingTop:D.space.md,paddingBottom:D.space.xl,gap:D.space.sm},
  productRouteLine:{position:"absolute",left:33,top:0,bottom:0,width:2,backgroundColor:"rgba(243,111,33,.28)"},
  productRouteItem:{position:"relative",paddingLeft:38},
  productRouteNode:{position:"absolute",left:0,top:30,width:34,height:34,borderRadius:17,backgroundColor:C.orange,borderWidth:4,borderColor:C.navy,alignItems:"center",justifyContent:"center",zIndex:4},
  productRouteNodeText:{fontSize:10,color:C.white,fontFamily:D.fonts.bold},
  tekProductsCard:{width:318,minHeight:550,borderRadius:32,backgroundColor:C.navy,overflow:"hidden",borderWidth:1,borderColor:"rgba(255,255,255,.16)"},
  productCardRightCut:{borderTopLeftRadius:28,borderTopRightRadius:76,borderBottomLeftRadius:28,borderBottomRightRadius:28},
  productCardLeftCut:{borderTopLeftRadius:76,borderTopRightRadius:28,borderBottomLeftRadius:28,borderBottomRightRadius:28},
  tekProductsCardMediaWrap:{height:290,overflow:"hidden",backgroundColor:"#E9ECF1"},
  tekProductsCardMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%",backgroundColor:"#E9ECF1"},
  productGhostNumber:{position:"absolute",right:16,bottom:-20,fontSize:88,lineHeight:96,color:"rgba(255,255,255,.17)",fontFamily:D.fonts.extraBold,letterSpacing:-4},
  productCardSignal:{position:"absolute",left:16,top:16,minHeight:30,borderRadius:15,backgroundColor:"rgba(5,20,48,.72)",paddingHorizontal:11,flexDirection:"row",alignItems:"center",gap:7},
  productSignalDot:{width:7,height:7,borderRadius:4,backgroundColor:C.orange},
  productSignalText:{fontSize:10,color:C.white,fontFamily:D.fonts.bold,letterSpacing:.8},
  tekProductsCardCopy:{padding:D.space.lg},
  tekProductsCardCategory:{...D.type.label,color:C.orange,fontFamily:D.fonts.bold,letterSpacing:.7,textTransform:"uppercase"},
  tekProductsCardTitle:{fontSize:29,lineHeight:34,fontFamily:D.fonts.extraBold,color:C.white,marginTop:D.space.xs},
  productDeckSummary:{fontSize:14,lineHeight:21,color:"#C9D2E1",marginTop:D.space.sm},
  productUseGrid:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:D.space.md},
  productUseChip:{...D.type.label,color:"#D4DCE8",backgroundColor:"rgba(255,255,255,.08)",borderRadius:D.radius.round,paddingHorizontal:11,paddingVertical:8,overflow:"hidden"},
  productCardFooter:{borderTopWidth:1,borderTopColor:"rgba(255,255,255,.12)",marginTop:D.space.lg,paddingTop:D.space.md,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  productExploreText:{...D.type.label,color:"#FFB98B",fontFamily:D.fonts.bold,letterSpacing:1.2},
  productArrowOrb:{width:46,height:46,borderRadius:23,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  certSection:{marginHorizontal:D.space.md,marginBottom:D.space.xl,paddingHorizontal:D.space.md,paddingTop:D.space.lg,paddingBottom:D.space.lg,borderRadius:D.radius.lg,backgroundColor:C.white},
  certKicker:{fontSize: 11,fontWeight:"900",letterSpacing:1.8,color:C.orange},
  certTitle:{fontSize:22,lineHeight:27,fontWeight:"900",color:C.navy,marginTop:7,marginBottom:15},
  certGrid:{flexDirection:"row",alignItems:"stretch",marginTop:2},
  certItem:{flex:1,position:"relative"},
  certItemInner:{flex:1,paddingHorizontal:13,paddingVertical:8,alignItems:"center"},
  certDivider:{position:"absolute",left:0,top:9,bottom:9,width:1,backgroundColor:"#D7DCE4"},
  certLogo:{height:42,width:"100%",alignItems:"center",marginBottom:11},
  certCardTitle:{fontSize:10,fontWeight:"900",color:C.navy,textAlign:"center"},
  certCardMeta:{fontSize: 10,lineHeight:11,color:"#7A8699",marginTop:4,textAlign:"center"},
  tekProductDetail:{flex:1,backgroundColor:"#F4F3EF"},
  tekProductDetailInner:{paddingBottom:160},
  tekProductHero:{height:520,justifyContent:"flex-end",overflow:"hidden",backgroundColor:"#0E0E0F"},
  tekProductHeroMedia:{...StyleSheet.absoluteFillObject,width:"100%",height:"100%"},
  tekProductSwitcher:{position:"absolute",top:86,left:18,right:0,zIndex:4},
  tekProductSwitcherInner:{paddingRight:18,gap:7},
  tekProductSwitch:{height:48,minWidth:128,maxWidth:165,borderRadius:24,paddingHorizontal:14,backgroundColor:"rgba(10,25,55,.72)",borderWidth:1,borderColor:"rgba(255,255,255,.18)",flexDirection:"row",alignItems:"center",gap:8},
  tekProductSwitchActive:{backgroundColor:C.orange,borderColor:C.orange},
  tekProductSwitchNo:{color:"rgba(255,255,255,.55)",fontSize: 10,fontFamily:VODAFONE_BOLD},
  tekProductSwitchText:{color:"rgba(255,255,255,.9)",fontSize: 14,fontFamily:VODAFONE_BOLD,flexShrink:1},
  tekProductSwitchTextActive:{color:C.white},
  tekProductHeroCopy:{padding:22,paddingBottom:46},
  tekProductEyebrow:{fontSize: 11,fontWeight:"900",letterSpacing:2.2,color:C.orange},
  tekProductTitle:{fontSize:37,lineHeight:40,fontWeight:"900",color:C.white,marginTop:8},
  tekProductMeta:{fontSize:14,color:"#CED6E5",marginTop:8},
  tekProductSheet:{paddingHorizontal:D.space.lg,paddingTop:D.space.lg,paddingBottom:D.space.xl,marginTop:-28,marginHorizontal:D.space.md,borderRadius:32,backgroundColor:C.white,borderWidth:1,borderColor:"#E4E6E9",zIndex:4},
  tekProductSheetHandle:{alignSelf:"center",width:48,height:5,borderRadius:3,backgroundColor:"#D9DCE2",marginBottom:D.space.lg},
  tekProductSheetKicker:{...D.type.label,color:C.orange,fontFamily:D.fonts.bold,letterSpacing:1.2},
  tekProductLead:{fontSize:17,lineHeight:26,color:"#596578",marginTop:D.space.sm},
  tekProductSectionTitle:{...D.type.card,fontFamily:D.fonts.extraBold,color:C.navy,marginTop:D.space.xl,marginBottom:D.space.sm},
  tekProductBullet:{minHeight:64,flexDirection:"row",alignItems:"center",gap:D.space.md,paddingVertical:D.space.sm,borderBottomWidth:1,borderBottomColor:"#E6E8EC"},
  tekProductBulletNo:{width:34,height:34,borderRadius:17,backgroundColor:C.orange,color:C.white,textAlign:"center",textAlignVertical:"center",lineHeight:34,fontSize:11,fontFamily:D.fonts.bold,overflow:"hidden"},
  tekProductBulletText:{flex:1,fontSize:15,lineHeight:22,color:C.navy},
  tekProductFeatureRow:{flexDirection:"row",gap:10,marginTop:22},
  tekProductFeature:{flex:1,minHeight:104,borderRadius:D.radius.md,backgroundColor:"#F3F5F8",borderWidth:1,borderColor:D.colors.line,padding:D.space.md,justifyContent:"space-between"},
  tekProductFeatureText:{...D.type.caption,fontFamily:D.fonts.bold,color:C.navy,marginTop:D.space.sm},
  tekProductQuote:{height:58,borderRadius:18,backgroundColor:C.orange,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20,marginTop:22},
  tekProductQuoteText:{fontSize:14,fontWeight:"900",color:C.white},
  modernPlantRail: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  modernPlantCard: { width: 265, height: 174, borderRadius: 23, overflow: "hidden", backgroundColor: C.navy },
  modernPlantImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  modernPlantNo: { position: "absolute", left: 15, top: 14, color: C.white, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  modernPlantCopy: { position: "absolute", left: 16, right: 16, bottom: 15 },
  modernPlantTitle: { color: C.white, fontSize: 20, fontWeight: "900" },
  modernPlantMeta: { color: "#D3DAE7", fontSize: 11, marginTop: 5 },
  modernBottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 82, paddingTop: 10, paddingBottom: 8, paddingHorizontal: 12, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: "#E7E9ED", flexDirection: "row", shadowColor: C.navy, shadowOpacity: .12, shadowRadius: 18, shadowOffset: {width:0,height:-5} },
  modernNavItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  modernNavLabel: { color: "#A0A7B2", fontSize: 11, fontWeight: "700" },
  modernNavLabelActive: { color: C.navy, fontWeight: "900" },
  hero: { height: 720, overflow: "hidden", backgroundColor: "#62B1DE" },
  heroArt: { position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: "100%" },
  topbar: {
    paddingHorizontal: 22,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 180, height: 54 },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { position: "absolute", left: 22, right: 22, bottom: 35 },
  dataTicker: { position: "absolute", top: 83, left: 0, right: 0, maxHeight: 38, backgroundColor: "rgba(7,18,43,.84)" },
  dataTickerInner: { paddingHorizontal: 18, minHeight: 38, alignItems: "center", gap: 9 },
  dataTickerItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dataTickerDivider: { width: 1, height: 16, backgroundColor: "rgba(255,255,255,.18)" },
  dataTickerLabel: { color: "#AFC0DC", fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  dataTickerValue: { color: C.white, fontSize: 11, fontWeight: "900" },
  bitumenTrendBadge:{width:16,height:16,borderRadius:8,alignItems:"center",justifyContent:"center",marginLeft:2},
  bitumenTrendUp:{backgroundColor:"#16A36A"},
  bitumenTrendDown:{backgroundColor:"#DC3F45"},
  bitumenTrendFlat:{backgroundColor:"#738099"},
  dataTickerSymbol: { color: C.orange, fontSize: 10, fontWeight: "900" },
  dataTickerUpdated: { color: "#7687A5", fontSize: 10, marginLeft: 5 },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange },
  pillText: {
    fontSize: 11,
    color: C.white,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontSize: 43,
    lineHeight: 45,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 20,
  },
  orange: { color: C.orange },
  heroText: {
    color: "#D7DCE8",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 320,
    marginTop: 16,
  },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 25 },
  cta: {
    height: 55,
    flex: 1,
    borderRadius: 28,
    backgroundColor: C.orange,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaText: { color: C.white, fontSize: 14, fontWeight: "800" },
  heroSecondary: { height: 55, width: 108, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,.34)", backgroundColor: "rgba(255,255,255,.09)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  heroSecondaryText: { color: C.white, fontSize: 11, fontWeight: "800" },
  heroUtilityRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  heroUtility: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, backgroundColor: "rgba(7,18,43,.62)" },
  heroUtilityText: { color: "#E7ECF5", fontSize: 11, fontWeight: "700" },
  actionHub: { backgroundColor: "#F3F5F8", paddingHorizontal: 18, paddingVertical: 30 },
  actionHubKicker: { color: C.orange, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  actionHubTitle: { color: C.navy, fontSize: 26, lineHeight: 30, fontWeight: "900", letterSpacing: -1, marginTop: 7, marginBottom: 18 },
  actionHubGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionHubCard: { width: "48.5%", minHeight: 158, borderRadius: 22, backgroundColor: C.white, padding: 15, borderWidth: 1, borderColor: "#E2E7ED" },
  actionHubIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFF2E8", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  actionHubCardTitle: { color: C.navy, fontSize: 13, fontWeight: "900" },
  actionHubCardMeta: { color: "#758196", fontSize: 11, lineHeight: 14, marginTop: 5, marginBottom: 12, flex: 1 },
  storyStripSection: { backgroundColor: C.white, paddingTop: 22, paddingBottom: 19 },
  storyStripHead: { paddingHorizontal: 18, marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storyStripKicker: { color: C.orange, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  storyStripTitle: { color: C.navy, fontSize: 18, fontWeight: "900", letterSpacing: -.5, marginTop: 4 },
  storyStrip: { paddingHorizontal: 14, gap: 13 },
  storyBubbleItem: { width: 76, alignItems: "center" },
  storyBubbleRing: { width: 72, height: 72, borderRadius: 36, padding: 3 },
  storyBubbleInner: { flex: 1, borderRadius: 33, backgroundColor: C.navy, borderWidth: 3, borderColor: C.white, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  storyBubbleImage: { width: "100%", height: "100%" },
  storyBubbleShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,38,78,.28)" },
  storyBubbleNo: { position: "absolute", right: 7, bottom: 5, color: C.orange, fontSize: 10, fontWeight: "900" },
  storyBubbleLabel: { color: C.navy, fontSize: 10, fontWeight: "800", textAlign: "center", marginTop: 8 },
  play: {
    width: 55,
    height: 55,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.42)",
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  marketWrap: { backgroundColor: C.cream, paddingTop: 16, paddingBottom: 30 },
  sectionHead: {
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrowDark: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  heading: {
    color: C.navy,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 7,
  },
  updated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
  },
  updatedText: { fontSize: 11, color: C.muted, fontWeight: "800" },
  marketRow: {
    paddingHorizontal: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  marketCard: {
    width: "48.5%",
    height: 134,
    borderRadius: 17,
    backgroundColor: C.white,
    padding: 14,
    shadowColor: C.navy,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  bitumenCard: { backgroundColor: C.navy },
  marketIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "rgba(231,64,34,.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  currencyIcon: { fontSize: 17, color: C.orange, fontWeight: "900" },
  marketLabel: {
    fontSize: 10,
    color: "#969DAB",
    fontWeight: "900",
    letterSpacing: 1,
  },
  marketValue: {
    fontSize: 21,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 3,
  },
  marketSub: { fontSize: 11, color: "#969DAB", marginTop: 3 },
  aboutSection: {
    backgroundColor: C.white,
    paddingHorizontal: 22,
    paddingVertical: 48,
  },
  aboutTitle: {
    fontSize: 35,
    lineHeight: 38,
    color: C.navy,
    fontWeight: "900",
    letterSpacing: -1.4,
    marginTop: 12,
  },
  aboutText: { fontSize: 14, lineHeight: 23, color: C.muted, marginTop: 18 },
  valuesRow: { gap: 12, marginTop: 28 },
  valueCard: { borderRadius: 20, backgroundColor: C.cream, padding: 22 },
  valueCardOrange: { backgroundColor: C.orange },
  valueTitle: { fontSize: 21, color: C.navy, fontWeight: "900", marginTop: 18 },
  valueTitleWhite: { color: C.white },
  valueText: { fontSize: 13, lineHeight: 21, color: C.muted, marginTop: 9 },
  valueTextWhite: { color: "rgba(255,255,255,.84)" },
  story: {
    backgroundColor: C.navy,
    paddingHorizontal: 22,
    paddingVertical: 52,
  },
  eyebrow: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  storyTitle: {
    fontSize: 36,
    lineHeight: 39,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 13,
  },
  storyBody: { color: "#ADB7CD", fontSize: 14, lineHeight: 23, marginTop: 20 },
  numberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#344468",
    marginTop: 35,
    paddingTop: 25,
  },
  bigNumber: { fontSize: 27, color: C.white, fontWeight: "900" },
  numberLabel: {
    fontSize: 10,
    color: "#8E9AB4",
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 5,
  },
  mediaSection: { padding: 22, paddingVertical: 42, backgroundColor: C.cream },
  referencesSection: { paddingVertical: 38, backgroundColor: "#ECEFF3" },
  referencesTitle: { color: C.navy, fontSize: 34, fontWeight: "900", letterSpacing: -1.2, paddingHorizontal: 22, marginTop: 8 },
  referencesIntro: { color: C.muted, fontSize: 11, lineHeight: 18, paddingHorizontal: 22, marginTop: 8, marginBottom: 22 },
  referenceBrandHead: { height: 44, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  referenceTekLogo: { width: 176, height: 46 },
  referenceTogoLogo: { width: 118, height: 34 },
  referenceCount: { color: "#7D8797", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  referenceRail: { paddingHorizontal: 12, paddingVertical: 8 },
  referenceCard: { width: 111, height: 94, paddingHorizontal: 7, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  referenceItemWrap: { flexDirection: "row", alignItems: "center" },
  shortReferenceDivider: { width: 1, height: 32, backgroundColor: "#CDD3DC" },
  referenceLogo: { width: "100%", height: "100%" },
  referenceMarqueeMask:{overflow:"hidden",marginTop:16,width:"100%"},
  referenceMarqueeTrack:{flexDirection:"row",alignItems:"center"},
  referenceMarqueeLogo:{width:134,height:60,marginRight:4,alignItems:"center",justifyContent:"center"},
  referenceDivider: { height: 1, backgroundColor: "#D6DBE3", marginHorizontal: 22, marginVertical: 12 },
  timelineIntro: {
    fontSize: 13,
    lineHeight: 21,
    color: C.muted,
    marginTop: 13,
  },
  timeline: { marginTop: 28 },
  timelineItem: { flexDirection: "row", alignItems: "stretch" },
  timelineRail: { width: 32, alignItems: "center" },
  timelineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: C.white,
    borderWidth: 3,
    borderColor: C.orange,
    zIndex: 2,
  },
  timelineDotActive: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.orange,
    shadowColor: C.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 112,
    backgroundColor: "#D8DCE4",
  },
  timelineCard: { flex: 1, paddingLeft: 8, paddingBottom: 29 },
  timelineYear: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  timelineTitle: {
    color: C.navy,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 5,
  },
  timelineText: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  timelineImage: {
    width: "100%",
    height: 145,
    borderRadius: 18,
    marginTop: 14,
    backgroundColor: "#D9DDE4",
  },
  photoGrid: { flexDirection: "row", gap: 12, marginTop: 20 },
  photo: {
    height: 230,
    flex: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  photoImage: { borderRadius: 17 },
  photoLabel: { padding: 15 },
  photoYear: { color: C.orange, fontSize: 24, fontWeight: "900" },
  photoCaption: {
    color: C.white,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  darkPage: { flex: 1, backgroundColor: C.navy },
  inner: { padding: 22, paddingTop: 42, paddingBottom: 42 },
  screenTitle: {
    fontSize: 39,
    lineHeight: 42,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -1.7,
    marginTop: 14,
  },
  screenIntro: {
    fontSize: 14,
    lineHeight: 22,
    color: "#ABB6CE",
    marginTop: 14,
    marginBottom: 20,
  },
  workCard: {
    height: 235,
    marginTop: 15,
    justifyContent: "space-between",
    padding: 18,
    overflow: "hidden",
  },
  workImage: { borderRadius: 20 },
  workIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(16,34,73,.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  workCopy: { flexDirection: "row", alignItems: "center", gap: 10 },
  workNo: { color: C.orange, fontSize: 10, fontWeight: "900" },
  workTitle: { flex: 1, color: C.white, fontSize: 22, fontWeight: "900" },
  corporatePage: { paddingBottom: 72 },
  corporateHero: { height: 390, marginTop: -1, backgroundColor: C.navy, justifyContent: "flex-end", overflow: "hidden" },
  corporateHeroMedia: { width: "100%", height: "100%" },
  corporateHeroImage: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
  corporateHeroCopy: { padding: 22, paddingBottom: 24 },
  corporateIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.orange, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  corporateHeroIntro: { color: "#D7DEEA", fontSize: 14, lineHeight: 22, marginTop: 14, maxWidth: 760 },
  corporateIntro: { color: "#B1BDD1", fontSize: 14, lineHeight: 22, paddingHorizontal: 22, paddingTop: 22 },
  corporateTabs: { flexDirection: "row", gap: 8, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 },
  corporateTab: { height: 44, minWidth: 108, paddingHorizontal: 13, gap: 7, flexDirection: "row", borderRadius: 14, borderWidth: 1, borderColor: "#354562", alignItems: "center", justifyContent: "center", backgroundColor: "#111E35" },
  corporateTabActive: { backgroundColor: C.orange, borderColor: C.orange },
  corporateTabLabel: { color: "#93A1B8", fontSize: 10, fontWeight: "800" },
  corporateTabLabelActive: { color: C.white },
  corporateCards: { paddingHorizontal: 22, gap: 10 },
  certificateLedger:{marginHorizontal:22,marginTop:20,borderRadius:22,backgroundColor:C.white,padding:16,borderWidth:1,borderColor:"#E1E6EC"},
  certificateLedgerKicker:{color:C.orange,fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.1,marginBottom:8},
  certificateLedgerRow:{minHeight:61,flexDirection:"row",alignItems:"center",gap:11,borderTopWidth:1,borderTopColor:"#EDF0F4",paddingVertical:9},
  certificateLedgerIcon:{width:36,height:36,borderRadius:18,backgroundColor:"rgba(231,64,34,.10)",alignItems:"center",justifyContent:"center"},
  certificateLedgerCopy:{flex:1},
  certificateLedgerTitle:{color:C.navy,fontSize:12,fontFamily:D.fonts.bold},
  certificateLedgerText:{color:"#6D7A8E",fontSize:10,lineHeight:14,marginTop:2},
  certificateLedgerNote:{marginHorizontal:28,marginTop:11,color:"#708095",fontSize:10,lineHeight:15},
  corporateCard: { flexDirection: "row", gap: 13, padding: 17, borderRadius: 19, backgroundColor: "#14223C", borderWidth: 1, borderColor: "#293A58" },
  corporateCardNo: { color: C.orange, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  corporateCardCopy: { flex: 1 },
  corporateCardTitle: { color: C.white, fontSize: 17, fontWeight: "900" },
  corporateCardText: { color: "#98A6BC", fontSize: 11, lineHeight: 18, marginTop: 6 },
  safetyVisual: { height: 240, marginHorizontal: 22, marginTop: 18, borderRadius: 24, overflow: "hidden", backgroundColor: "#111E35" },
  safetyVisualImage: { width: "100%", height: "100%" },
  safetyVisualCopy: { position: "absolute", left: 20, right: 20, bottom: 20 },
  safetyVisualTitle: { color: C.white, fontSize: 23, lineHeight: 28, fontWeight: "900", marginTop: 7 },
  labEquipment: { marginHorizontal: 22, marginTop: 16, padding: 17, borderRadius: 19, backgroundColor: "#F4F0EA" },
  labEquipmentText: { color: C.navy, fontSize: 11, lineHeight: 19, fontWeight: "700" },
  productionPage: { paddingBottom: 72, backgroundColor: C.navy },
  productionHeader: { minHeight: 650, paddingHorizontal: 22, paddingTop: 126, paddingBottom: 28, justifyContent: "flex-end", overflow: "hidden", backgroundColor: C.navy },
  productionHeroMedia: { ...StyleSheet.absoluteFillObject, overflow: "hidden", backgroundColor: C.navy },
  productionTopControls: { position:"absolute", top:86, left:16, right:16, zIndex:6, flexDirection:"row", alignItems:"center" },
  productionSwitcher: { flex:1, height:44, borderRadius:22, padding:4, backgroundColor:"rgba(10,25,55,.72)", borderWidth:1, borderColor:"rgba(255,255,255,.18)", flexDirection:"row" },
  productionSwitch: { flex:1, borderRadius:18, alignItems:"center", justifyContent:"center", paddingHorizontal:5 },
  productionSwitchActive: { backgroundColor:C.orange },
  productionSwitchText: { color:"rgba(255,255,255,.88)", ...D.type.label, fontFamily:D.fonts.bold },
  productionSwitchTextActive: { color:C.white },
  esenlerHeroMedia: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  silivriHeroMedia: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  plentmiksHeroImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    ...(Platform.OS === "web" ? ({ objectPosition: "right top" } as any) : {}),
  },
  totalCapacity: {
    borderTopWidth: 1,
    borderTopColor: "#35466B",
    marginTop: 18,
    paddingTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  totalCapacityValue: {
    fontSize: 55,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: -2,
  },
  totalCapacityUnit: { fontSize: 12, color: C.white, fontWeight: "900" },
  totalCapacityLabel: {
    fontSize: 10,
    color: "#B8C2D4",
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.8,
  },
  plantCard: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 28,
    borderRadius: 22,
    backgroundColor: C.white,
    overflow: "hidden",
  },
  plantSummary: {
    minHeight: 104,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
    backgroundColor: "#F7F8FA",
  },
  plantSummaryCopy: { flex: 1 },
  plantSummaryTitle: { color: C.orange, fontSize: 11, fontFamily: VODAFONE_BOLD, letterSpacing: 1.1 },
  plantSummaryText: { color: C.navy, fontSize: 15, lineHeight: 22, fontFamily: VODAFONE_BOLD, marginTop: 7 },
  plantImage: {
    height: 340,
    padding: 18,
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  plantImageRadius: { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  plantMediaScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,20,46,.34)" },
  plantNumber: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  plantNumberText: { fontSize: 10, color: C.white, fontWeight: "900" },
  plantImageCopy: { paddingRight: 5 },
  plantName: {
    fontSize: 30,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -1,
  },
  plantDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#D2D8E5",
    marginTop: 8,
  },
  plantSpecs: { flexDirection: "row", flexWrap: "wrap", paddingVertical: 10 },
  plantSpec: {
    width: "33.333%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: "#ECEEF2",
    borderBottomColor: "#ECEEF2",
  },
  techIconWrap: { height: 38, alignItems: "center", justifyContent: "center" },
  plantTechIcon: { width: 44, height: 38 },
  plantSpecValue: {
    fontSize: 11,
    color: C.navy,
    fontWeight: "900",
    marginTop: 7,
    textAlign: "center",
  },
  plantSpecLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: 0.7,
    textAlign: "center",
  },
  togoPage: { flex: 1, backgroundColor: "#0F172A" },
  togoInner: { paddingBottom: 44 },
  togoHero: {
    minHeight: 355,
    overflow: "hidden",
    padding: 22,
    paddingTop: 38,
    backgroundColor: "#111B32",
  },
  togoHeroCopy: { zIndex: 2 },
  togoLogoPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  togoLogo: {
    fontSize: 12,
    color: C.white,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  togoTitle: {
    fontSize: 41,
    lineHeight: 43,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 25,
  },
  togoIntro: {
    fontSize: 14,
    lineHeight: 22,
    color: "#A6B0C4",
    maxWidth: 280,
    marginTop: 14,
  },
  togoFeatureRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  togoFeature: {
    fontSize: 11,
    color: C.white,
    fontWeight: "900",
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  togoGallery: {
    flexDirection: "row",
    gap: 10,
    padding: 18,
    backgroundColor: "#0F172A",
  },
  togoGalleryImage: {
    height: 170,
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,.06)",
  },
  productsSection: { padding: 18, paddingTop: 42 },
  productsTitle: {
    fontSize: 31,
    lineHeight: 34,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 8,
    marginBottom: 18,
  },
  productCard: {
    borderRadius: 22,
    backgroundColor: C.white,
    overflow: "hidden",
    marginBottom: 16,
  },
  productImageWrap: {
    height: 240,
    backgroundColor: "#F1F3F6",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: { width: "88%", height: "88%" },
  productCopy: { padding: 20 },
  productIndex: {
    fontSize: 11,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  productTitle: {
    fontSize: 25,
    color: C.navy,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 8,
  },
  productText: { fontSize: 12, lineHeight: 19, color: C.muted, marginTop: 9 },
  productTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 15,
  },
  productTag: {
    fontSize: 11,
    color: C.navy,
    fontWeight: "800",
    backgroundColor: C.cream,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  steps: {
    marginHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.12)",
    paddingTop: 28,
    paddingBottom: 24,
  },
  stepRow: { flexDirection: "row", marginTop: 16 },
  step: { flex: 1 },
  stepNo: { fontSize: 11, color: C.orange, fontWeight: "900" },
  stepText: { fontSize: 10, color: C.white, fontWeight: "800", marginTop: 5 },
  togoBrandFooter: {
    marginHorizontal: 18,
    marginTop: 18,
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.12)",
    alignItems: "center",
  },
  togoBrandFooterImage: { width: "92%", height: 34 },
  arPage: { flex:1, backgroundColor:C.navy },
  arPageContent: { paddingBottom:128, backgroundColor:C.navy },
  togoCalc: {
    paddingHorizontal:18,
    paddingTop:18,
    backgroundColor:C.navy,
  },
  arPlainBack:{backgroundColor:"transparent",borderWidth:0},
  arPageIntro:{minHeight:240,marginBottom:8,overflow:"hidden",backgroundColor:C.navy},
  arPageIntroContent:{zIndex:2,paddingHorizontal:4,paddingTop:18,paddingBottom:16,maxWidth:"94%"},
  arIntroProductImage:{position:"absolute",right:-15,bottom:-6,width:186,height:190},
  arIntroBrand:{width:154,height:34,alignSelf:"flex-start",marginBottom:15},
  arEyebrow:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:10,paddingVertical:7,borderRadius:20,backgroundColor:"rgba(231,64,34,.12)",borderWidth:1,borderColor:"rgba(231,64,34,.32)"},
  arEyebrowDot:{width:7,height:7,borderRadius:4,backgroundColor:"#42D995"},
  arEyebrowText:{color:"#FFD1C7",fontSize:10,fontFamily:VODAFONE_BOLD,letterSpacing:.8},
  arPageTitle:{color:C.white,fontSize:34,lineHeight:38,fontFamily:VODAFONE_BOLD,letterSpacing:-1.05,marginTop:14},
  arPageSubtitle:{color:"#D4E0F4",fontSize:14,lineHeight:21,marginTop:10,maxWidth:430},
  arLidarBackdrop:{...StyleSheet.absoluteFillObject,overflow:"hidden"},
  arLidarDotField:{...StyleSheet.absoluteFillObject},
  arLidarDot:{position:"absolute",backgroundColor:"#39D7DE"},
  arLidarDotOrange:{backgroundColor:C.orange},
  arScanCard:{borderRadius:26,overflow:"hidden",padding:14,paddingTop:14,backgroundColor:"rgba(255,255,255,.055)",borderWidth:1,borderColor:"rgba(255,255,255,.12)"},
  arScanVisual:{height:184,alignItems:"center",justifyContent:"center",overflow:"hidden",borderRadius:20,backgroundColor:"rgba(255,255,255,.045)",borderWidth:1,borderColor:"rgba(231,64,34,.32)"},
  lidarGrid:{...StyleSheet.absoluteFillObject,opacity:.22,backgroundColor:C.navy},
  lidarSweepLine:{position:"absolute",left:16,right:16,height:2,backgroundColor:C.orange,shadowColor:C.orange,shadowOpacity:1,shadowRadius:12,elevation:6},
  lidarLivePill:{position:"absolute",top:13,left:13,flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:9,paddingVertical:6,borderRadius:20,backgroundColor:"rgba(7,18,42,.84)",borderWidth:1,borderColor:"rgba(231,64,34,.44)"},
  lidarLiveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#42D995"},
  lidarLiveText:{color:"#FFD1C7",fontSize:10,fontFamily:VODAFONE_BOLD,letterSpacing:.6},
  lidarScanFooter:{position:"absolute",bottom:13,alignItems:"center"},
  lidarScanFooterTitle:{color:C.white,fontSize:12,fontFamily:VODAFONE_BOLD,letterSpacing:.7},
  lidarScanFooterMeta:{color:"#9AB0D6",fontSize:10,marginTop:4},
  arScanRingOuter:{width:126,height:126,borderRadius:63,borderWidth:1,borderColor:"rgba(255,255,255,.34)",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(4,13,31,.34)"},
  arScanRingInner:{width:92,height:92,borderRadius:46,backgroundColor:"rgba(17,37,75,.76)",alignItems:"center",justifyContent:"center"},
  arScanCorner:{position:"absolute",width:28,height:28,borderColor:C.orange},
  arScanCornerTopLeft:{left:12,top:12,borderLeftWidth:3,borderTopWidth:3,borderTopLeftRadius:7},
  arScanCornerTopRight:{right:12,top:12,borderRightWidth:3,borderTopWidth:3,borderTopRightRadius:7},
  arScanCornerBottomLeft:{left:12,bottom:12,borderLeftWidth:3,borderBottomWidth:3,borderBottomLeftRadius:7},
  arScanCornerBottomRight:{right:12,bottom:12,borderRightWidth:3,borderBottomWidth:3,borderBottomRightRadius:7},
  arCapabilityRow:{height:48,marginTop:10,borderRadius:16,backgroundColor:"rgba(255,255,255,.055)",borderWidth:1,borderColor:"rgba(255,255,255,.10)",flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:8},
  arCapability:{flexDirection:"row",alignItems:"center",gap:6},
  arCapabilityText:{color:"#D8E1F1",fontSize:11,fontFamily:VODAFONE_BOLD},
  arCapabilityDivider:{width:1,height:20,backgroundColor:"rgba(255,255,255,.12)"},
  arSafetyCompact:{minHeight:58,marginTop:8,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:4,paddingVertical:10},
  arSafetyCompactActive:{},
  arSafetyCompactCheck:{width:28,height:28,borderRadius:7,borderWidth:2,borderColor:C.orange,backgroundColor:"rgba(255,255,255,.08)",alignItems:"center",justifyContent:"center"},
  arSafetyCompactCheckActive:{backgroundColor:"#1B9863",borderColor:"#1B9863"},
  arSafetyCompactText:{flex:1,color:C.white,fontSize:13,lineHeight:18,fontFamily:VODAFONE_BOLD},
  arPrimaryButton:{height:58,borderRadius:18,backgroundColor:C.orange,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingLeft:20,paddingRight:7},
  arPrimaryButtonDisabled:{opacity:.48},
  arPrimaryButtonText:{color:C.white,fontSize:16,fontFamily:VODAFONE_BOLD},
  arPrimaryButtonIcon:{width:44,height:44,borderRadius:15,backgroundColor:"rgba(255,255,255,.16)",alignItems:"center",justifyContent:"center"},
  arSlideTrack:{height:60,marginTop:8,borderRadius:20,backgroundColor:C.orange,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8,paddingRight:20,overflow:"hidden"},
  arSlideTrackDisabled:{backgroundColor:"rgba(255,122,24,.26)",opacity:.78},
  arSlideTrackPressed:{opacity:.82,transform:[{scale:.99}]},
  arSlideIcon:{width:46,height:46,borderRadius:15,backgroundColor:C.white,alignItems:"center",justifyContent:"center"},
  arSlideText:{flex:1,textAlign:"left",paddingLeft:15,color:C.white,fontSize:16,fontFamily:VODAFONE_BOLD},
  arStepsRow:{height:98,flexDirection:"row",alignItems:"center",justifyContent:"center",paddingHorizontal:8},
  arStepItem:{alignItems:"center",gap:7,minWidth:58},
  arStepIcon:{width:44,height:44,borderRadius:15,backgroundColor:"#18375F",borderWidth:1,borderColor:"rgba(68,225,230,.52)",alignItems:"center",justifyContent:"center"},
  arStepText:{color:"#F0F6FF",fontSize:12,fontFamily:VODAFONE_BOLD},
  arStepLine:{width:36,height:2,backgroundColor:"rgba(68,225,230,.52)",marginHorizontal:5,marginBottom:20},
  arManualToggle:{minHeight:76,borderRadius:20,backgroundColor:"rgba(255,255,255,.055)",borderWidth:1,borderColor:"rgba(180,207,245,.18)",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:14},
  arManualToggleIcon:{width:42,height:42,borderRadius:15,backgroundColor:"rgba(255,255,255,.08)",alignItems:"center",justifyContent:"center"},
  arManualToggleTitle:{color:C.white,fontSize:15,fontFamily:VODAFONE_BOLD},
  arManualToggleMeta:{color:"#AFC0DD",fontSize:11,marginTop:3},
  arManualPanel:{marginTop:10,borderRadius:22,backgroundColor:"rgba(255,255,255,.055)",padding:16},
  arPrivacyNote:{marginHorizontal:18,marginTop:18,borderRadius:18,backgroundColor:"rgba(255,255,255,.055)",borderWidth:1,borderColor:"rgba(180,207,245,.14)",padding:14,flexDirection:"row",alignItems:"flex-start",gap:10},
  arPrivacyNoteText:{flex:1,color:"#B5C6E2",fontSize:12,lineHeight:18},
  scanBadgeRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  scanLiveBadge: { flexDirection:"row", alignItems:"center", gap:7, paddingHorizontal:10, paddingVertical:7, borderRadius:20, backgroundColor:"rgba(66,217,149,.1)", borderWidth:1, borderColor:"rgba(66,217,149,.24)" },
  scanLiveDot: { width:7, height:7, borderRadius:4, backgroundColor:"#42D995" },
  scanLiveText: { fontSize:10, color:"#A4F0CB", fontFamily:VODAFONE_BOLD, letterSpacing:.8 },
  scanApprox: { fontSize:10, color:"#B4BED0", fontFamily:VODAFONE_BOLD, letterSpacing:.7 },
  scanLaunchButton: { height:82, marginTop:18, borderRadius:21, overflow:"hidden", flexDirection:"row", alignItems:"center", paddingHorizontal:16 },
  arSafetyCard: { marginTop:18, minHeight:88, borderRadius:20, borderWidth:1, borderColor:"rgba(255,255,255,.14)", backgroundColor:"rgba(255,255,255,.06)", padding:14, flexDirection:"row", alignItems:"center", gap:12 },
  arSafetyCardActive: { borderColor:"rgba(66,217,149,.55)", backgroundColor:"rgba(66,217,149,.10)" },
  arSafetyCheck: { width:42, height:42, borderRadius:21, borderWidth:1, borderColor:"rgba(255,122,24,.5)", alignItems:"center", justifyContent:"center" },
  arSafetyCheckActive: { backgroundColor:"#198A58", borderColor:"#198A58" },
  arSafetyTitle: { color:C.white, fontSize:16, fontFamily:VODAFONE_BOLD },
  arSafetyBody: { color:"#D0D7E4", fontSize:13, lineHeight:19, marginTop:4 },
  scanLaunchIcon: { width:48, height:48, borderRadius:17, backgroundColor:"rgba(255,255,255,.16)", alignItems:"center", justifyContent:"center" },
  scanLaunchCopy: { flex:1, paddingHorizontal:13 },
  scanLaunchTitle: { color:C.white, fontSize:16, fontWeight:"900" },
  scanLaunchMeta: { color:"rgba(255,255,255,.88)", fontSize:12, marginTop:4 },
  scanPreview: { height:228, marginTop:14, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:"rgba(255,255,255,.16)" },
  scanCorners: { ...StyleSheet.absoluteFillObject },
  scanCornerTL: { position:"absolute", left:16, top:16, width:30, height:30, borderLeftWidth:3, borderTopWidth:3, borderColor:C.orange },
  scanCornerTR: { position:"absolute", right:16, top:16, width:30, height:30, borderRightWidth:3, borderTopWidth:3, borderColor:C.orange },
  scanCornerBL: { position:"absolute", left:16, bottom:16, width:30, height:30, borderLeftWidth:3, borderBottomWidth:3, borderColor:C.orange },
  scanCornerBR: { position:"absolute", right:16, bottom:16, width:30, height:30, borderRightWidth:3, borderBottomWidth:3, borderColor:C.orange },
  scanPreviewCopy: { position:"absolute", left:16, right:16, bottom:13, flexDirection:"row", alignItems:"center", gap:7 },
  scanPreviewText: { color:C.white, fontSize:11, fontWeight:"800" },
  scanPresetBlock: { marginTop:18 },
  scanPresetLabel: { color:"#CED6E4", fontSize:11, fontFamily:VODAFONE_BOLD, letterSpacing:1 },
  scanPresetRow: { flexDirection:"row", gap:7, marginTop:9 },
  scanPreset: { flex:1, minHeight:60, borderRadius:15, backgroundColor:"rgba(255,255,255,.06)", borderWidth:1, borderColor:"rgba(255,255,255,.12)", alignItems:"center", justifyContent:"center" },
  scanPresetName: { color:C.white, fontSize:14, fontFamily:VODAFONE_BOLD },
  scanPresetMeta: { color:"#B4BED0", fontSize:11, marginTop:4 },
  manualMeasureHeader: { marginTop:20, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  manualMeasureHint: { color:"#B4BED0", fontSize:11 },
  calcHookRow: { flexDirection: "row", alignItems: "center" },
  calcHookIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  calcHookCopy: { flex: 1, marginLeft: 12 },
  togoCalcTitle: {
    ...D.type.title,
    color: C.white,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 8,
  },
  togoCalcSub: { ...D.type.body, color: "#D3DAE6", marginTop: D.space.sm },
  togoFields: { marginTop: 18 },
  togoActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  togoButton: {
    height: 54,
    flex: 1,
    borderRadius: 16,
    backgroundColor: C.orange,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  togoButtonText: { fontSize: 15, color: C.white, fontWeight: "900" },
  clearButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(255,255,255,.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  togoResult: { marginTop:14, marginHorizontal:-18, paddingHorizontal:18, paddingTop:20, paddingBottom:8, backgroundColor:C.navy },
  resultCompletePill:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:7,paddingVertical:7,paddingHorizontal:10,borderRadius:999,backgroundColor:"rgba(88,230,163,.10)"},
  resultCompleteText:{color:"#BDF6D6",fontSize:10,fontFamily:VODAFONE_BOLD,letterSpacing:.6},
  resultHeroRow: { flexDirection:"row", alignItems:"center", minHeight:248, marginTop:2 },
  resultHeroCopy: { flex:1 },
  resultNumberRow: { flexDirection:"row", alignItems:"baseline", gap:7, marginTop:3 },
  resultBucketWord: { color:C.orange, fontSize:14, fontWeight:"900", letterSpacing:1 },
  resultBucketImage: { width:292, height:292, marginRight:-53 },
  resultBucketVideo: { width:278, height:278, marginRight:-44, backgroundColor:"transparent", isolation:"isolate" },
  scanDimensions: { marginTop:-4, paddingTop:19, paddingBottom:3, borderTopWidth:1, borderTopColor:"rgba(121,169,229,.20)" },
  scanDimensionsTitle: { color:"#BBD0F8", fontSize:10, fontFamily:VODAFONE_BOLD, letterSpacing:1.15, marginBottom:13 },
  scanDimensionsGrid: { flexDirection:"row", flexWrap:"wrap", columnGap:10, rowGap:14 },
  scanDimensionCell: { width:"30.8%", minHeight:55, gap:5, paddingLeft:9, borderLeftWidth:1, borderLeftColor:"rgba(88,230,163,.30)" },
  scanDimensionCopy: { minWidth:0 },
  scanDimensionLabel: { color:"#9FB3D3", fontSize:9, fontFamily:VODAFONE, lineHeight:11 },
  scanDimensionValue: { color:C.white, fontSize:14, lineHeight:17, fontFamily:VODAFONE_BOLD, marginTop:1 },
  bucketRail: { minHeight:54, flexDirection:"row", alignItems:"flex-end", gap:2, borderTopWidth:1, borderTopColor:"rgba(255,255,255,.1)", paddingTop:10 },
  bucketMini: { width:38, height:42 },
  bucketMore: { width:38, height:38, borderRadius:19, backgroundColor:C.orange, alignItems:"center", justifyContent:"center", marginBottom:2 },
  bucketMoreText: { color:C.white, fontSize:10, fontWeight:"900" },
  resultAssurance: { flexDirection:"row", alignItems:"flex-start", gap:8, marginTop:17,paddingVertical:3 },
  resultAssuranceText: { flex:1, color:"#B8C8DF", fontSize:12, lineHeight:18 },
  resultPrimerRecommendation: { marginTop:16, minHeight:94, paddingVertical:8, paddingRight:2, borderTopWidth:1, borderBottomWidth:1, borderColor:"rgba(121,169,229,.20)", flexDirection:"row", alignItems:"center", gap:7 },
  resultPrimerIcon: { width:42, height:42, borderRadius:14, backgroundColor:"rgba(231,64,34,.14)", alignItems:"center", justifyContent:"center" },
  resultPrimerVideo: { width:88, height:88, marginLeft:-12, backgroundColor:"transparent", isolation:"isolate" },
  resultPrimerCopy: { flex:1, minWidth:0 },
  resultPrimerKicker: { color:"#BBD0F8", fontSize:9, fontFamily:VODAFONE_BOLD, letterSpacing:1 },
  resultPrimerTitle: { color:C.white, fontSize:14, fontFamily:VODAFONE_BOLD, marginTop:3 },
  resultPrimerText: { color:"#B5C6E2", fontSize:11, lineHeight:15, marginTop:3 },
  resultQuoteButton: { height:58, marginTop:14, borderRadius:17, backgroundColor:C.orange, flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:17 },
  resultQuoteButtonText: { color:C.white, fontSize:16, fontWeight:"900" },
  resultWhatsappButton: { height:58, marginTop:10, borderRadius:17, backgroundColor:"#20B963", flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:17 },
  resultWhatsappButtonText: { flex:1, color:C.white, fontSize:15, fontWeight:"900" },
  resultBuyLabel: { color:"#B9C8E2", fontSize: 11, fontWeight:"900", letterSpacing:1.15, marginTop:18, marginBottom:10 },
  resultMarketRow: { flexDirection:"row", gap:7 },
  resultMarketButton: { flex:1, minWidth:0, height:42, borderRadius:12, backgroundColor:"#F5F7FA", flexDirection:"row", alignItems:"center", justifyContent:"center", gap:4, paddingHorizontal:6 },
  resultMarketButtonText: { color:C.navy, fontSize: 11, fontWeight:"900" },
  resultRestartButton:{height:48,marginTop:14,borderRadius:15,borderWidth:1,borderColor:"rgba(191,209,237,.26)",backgroundColor:"rgba(255,255,255,.06)",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
  resultRestartText:{color:"#D6E4F8",fontSize:13,fontFamily:VODAFONE_BOLD},
  togoResultLabel: {
    fontSize: 11,
    color: "#BBD0F8",
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  togoResultKg: {
    fontSize: 28,
    color: C.white,
    fontWeight: "900",
    marginTop: 5,
  },
  togoResultMeta: { fontSize: 14, color: "#E4ECFA", marginTop: 5 },
  arVolumeMeta: { fontSize:13, color:"#58E6A3", marginTop:6, fontWeight:"800" },
  bucketCount: {
    borderRadius: 16,
    backgroundColor: C.orange,
    paddingHorizontal: 15,
    paddingVertical: 11,
    alignItems: "center",
  },
  bucketCountValue: { fontSize: 50, lineHeight:54, color: C.white, fontWeight: "900" },
  bucketCountLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,.8)",
    fontWeight: "900",
    marginTop: 2,
  },
  marketQuickSection: { marginHorizontal:18, marginTop:2, padding:18, borderRadius:23, backgroundColor:C.white },
  marketQuickHead: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  marketQuickTitle: { color:C.navy, fontSize:20, fontWeight:"900", marginTop:5 },
  marketQuickRail: { flexDirection:"row", gap:8, marginTop:15 },
  marketQuickCard: { flex:1, height:68, borderRadius:16, backgroundColor:"#F4F5F7", paddingHorizontal:10, flexDirection:"row", alignItems:"center", justifyContent:"space-between", borderWidth:1, borderColor:"#E7E9EE" },
  marketQuickLogo: { width:"72%", height:31 },
  productDetailPage: { flex: 1, backgroundColor: "#F4F3EF" },
  productDetailInner: { paddingBottom: 132 },
  detailTopbar: {
    minHeight: 72,
    left: 12,
    right: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(244,243,239,.94)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(15,34,70,.08)",
  },
  detailTopbarSpacer: { width: 40 },
  detailProductSwitcher: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 4,
    backgroundColor: "#E9E8E3",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DEDDD8",
  },
  detailProductSwitch: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 20,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor:C.navy,
  },
  detailProductSwitchActive: {
    backgroundColor: C.orange,
  },
  detailProductSwitchNo: {
    color: "#788296",
    fontSize: 10,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  detailProductSwitchNoActive: { color: C.white },
  detailProductSwitchLabel: {
    color: C.navy,
    fontSize: 11,
    lineHeight: 13,
    fontFamily: VODAFONE_BOLD,
    marginTop: 2,
  },
  detailProductSwitchLabelActive: { color: C.white },
  detailProductSwitchDot: { display:"none" },
  detailVisual: {
    height: 460,
    backgroundColor: C.white,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  detailModelBadge:{position:"absolute",left:16,top:154,zIndex:3,minHeight:30,borderRadius:15,backgroundColor:"rgba(255,255,255,.94)",paddingHorizontal:11,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"rgba(15,34,70,.08)"},
  detailIndex: {
    fontSize: 11,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  detailRotateHint:{position:"absolute",alignSelf:"center",bottom:14,zIndex:3,width:58,height:58},
  detailRotateHintText:{fontSize:11,fontFamily:D.fonts.bold,color:C.navy},
  productVideo: { width: "100%", height: "100%", backgroundColor: "#F4F3EF" },
  detailImage: { width: "86%", height: 215, alignSelf: "center" },
  detailCopy: { marginTop:-2,paddingHorizontal:20,paddingTop:25,paddingBottom:30,backgroundColor:C.white,borderTopLeftRadius:0,borderTopRightRadius:0 },
  detailTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: C.navy,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  detailSlogan: {
    fontSize: 14,
    lineHeight: 21,
    color: "#657185",
    marginTop: 8,
  },
  detailStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  detailStat: {
    flex:1,
    minHeight:120,
    borderRadius: 20,
    backgroundColor: "#F7F7F5",
    borderWidth: 1,
    borderColor: "#E7E8EB",
    paddingHorizontal: 11,
    paddingVertical: 13,
    justifyContent:"center",
  },
  detailStatIcon:{width:34,height:34,borderRadius:12,backgroundColor:"#FFF0E6",alignItems:"center",justifyContent:"center",marginBottom:10},
  detailStatValue:{fontSize:14,lineHeight:17,color:C.navy,fontFamily:VODAFONE_BOLD},
  detailStatText: { fontSize: 10, lineHeight:14,color: "#6D788A", marginTop:3, minHeight:28 },
  detailIntroCard:{marginTop:22,padding:18,borderRadius:22,backgroundColor:"#F7F7F5",borderWidth:1,borderColor:"#E7E8EB"},
  detailIntroKicker:{fontSize:10,color:C.orange,fontFamily:VODAFONE_BOLD,letterSpacing:1.25},
  detailIntro: {
    fontSize: 15,
    lineHeight: 24,
    color: "#596578",
    marginTop: 9,
  },
  detailGuideHead:{marginTop:30,marginBottom:14,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between"},
  detailGuideTitle:{fontSize:25,lineHeight:29,color:C.navy,fontFamily:VODAFONE_BOLD,letterSpacing:-.7,marginTop:5},
  detailGuideCount:{height:27,borderRadius:14,backgroundColor:"#FFF0E6",paddingHorizontal:10,alignItems:"center",justifyContent:"center"},
  detailGuideCountText:{fontSize:9,color:C.orange,fontFamily:VODAFONE_BOLD,letterSpacing:.8},
  detailAccordion:{borderRadius:22,backgroundColor:"#F7F7F5",borderWidth:1,borderColor:"#E4E6EA",overflow:"hidden"},
  detailAccordionItem:{borderBottomWidth:1,borderBottomColor:"#E4E6EA"},
  detailAccordionItemOpen:{backgroundColor:C.white},
  detailAccordionButton:{minHeight:68,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:11},
  detailAccordionIcon:{width:38,height:38,borderRadius:13,backgroundColor:"#E8ECF2",alignItems:"center",justifyContent:"center"},
  detailAccordionIconOpen:{backgroundColor:C.orange},
  detailAccordionTitle:{flex:1,fontSize:15,color:C.navy,fontFamily:VODAFONE_BOLD},
  detailAccordionBody:{paddingHorizontal:16,paddingBottom:17,paddingTop:2},
  detailSection: {
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E6E8EC",
  },
  detailSectionTitle: {
    fontSize: 21,
    color: C.navy,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  detailBullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 11,
    paddingRight: 4,
  },
  detailBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.orange,
    marginTop: 7,
    marginRight: 10,
  },
  detailBulletText: { flex: 1, fontSize: 13, lineHeight: 21, color: "#596578" },
  detailNoticeCard:{marginTop:20,padding:17,borderRadius:22,backgroundColor:C.navy,flexDirection:"row",alignItems:"flex-start",gap:13},
  detailNoticeIcon:{width:44,height:44,borderRadius:15,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  detailNoticeKicker:{fontSize:9,color:"#FFB888",fontFamily:VODAFONE_BOLD,letterSpacing:1.1},
  detailNoticeTitle:{fontSize:16,lineHeight:20,color:C.white,fontFamily:VODAFONE_BOLD,marginTop:4},
  detailNoticeText:{fontSize:12,lineHeight:18,color:"#D3DAE6",marginTop:5},
  docsSection: {
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E6E8EC",
  },
  docsIntro: {
    color: "#657185",
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 14,
  },
  docRow: {
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: "#F7F7F5",
    borderWidth: 1,
    borderColor: "#E3E5E9",
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  docRowSelected: {
    borderColor: C.orange,
    backgroundColor: "rgba(231,64,34,.1)",
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(231,64,34,.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  docCopy: { flex: 1 },
  docTitle: { fontSize: 12, color: C.navy, fontWeight: "900" },
  docMeta: { fontSize: 11, color: "#7C879D", marginTop: 4 },
  docDownloadBadge: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 11,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  docDownloadText: { color: C.white, fontSize: 11, fontWeight: "900" },
  docRowDisabled: { opacity: .62 },
  docDownloadBadgeDisabled: { backgroundColor: "#E6E9EE" },
  docDownloadTextDisabled: { color: "#8792A4" },
  documentForm: {
    marginTop: 10,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  documentFormTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
  },
  documentInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    color: C.white,
    paddingHorizontal: 14,
    marginBottom: 9,
    fontSize: 13,
  },
  documentButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 3,
  },
  documentButtonDisabled: { opacity: 0.38 },
  documentButtonText: { color: C.white, fontSize: 13, fontWeight: "900" },
  showcaseSection: { padding: 18, paddingTop: 24, backgroundColor: "#0A1120" },
  showcaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  showcaseEyebrow: {
    fontSize: 11,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  showcaseTitle: {
    fontSize: 20,
    color: C.white,
    fontWeight: "900",
    marginTop: 5,
  },
  productDetailImageFrame: {
    height: 230,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  productDetailShowcaseImage: {
    width: "88%",
    height: "88%",
    alignSelf: "center",
  },
  calcPage: { backgroundColor: C.cream, flexGrow: 1, width: "100%", maxWidth: "100%", overflow: "hidden" },
  calcTitle: {
    fontSize: 38,
    lineHeight: 41,
    color: C.navy,
    fontWeight: "900",
    letterSpacing: -1.6,
    marginTop: 13,
  },
  calcIntro: { color: C.muted, fontSize: 14, marginTop: 13 },
  calcGroupLabel: { color: C.navy, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 22, marginBottom: 9 },
  calcChips: { gap: 8, paddingRight: 20 },
  calcChip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#DDE3EA" },
  calcChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  calcChipText: { color: C.navy, fontSize: 10, fontWeight: "800" },
  calcChipTextActive: { color: C.white },
  calcCard: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 20,
    marginTop: 26,
    shadowColor: C.navy,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  calcStep: { color: C.orange, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  calcStepOutside: { color: C.navy, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 24, marginBottom: 10 },
  calcSectionTitle: { color: C.navy, fontSize: 20, fontWeight: "900", marginTop: 4, marginBottom: 4 },
  calcTruckPlanner: { width: "100%", minHeight: 70, marginTop: 14, borderRadius: 17, backgroundColor: "#F4F6F9", borderWidth: 1, borderColor: "#E0E5EB", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, overflow: "hidden" },
  calcTruckCopy: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 },
  calcTruckIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFF0E4", alignItems: "center", justifyContent: "center" },
  calcTruckLabel: { color: C.navy, fontSize: 11, fontWeight: "900", letterSpacing: .8 },
  calcTruckHint: { color: C.muted, fontSize: 11, marginTop: 3 },
  calcTruckInputWrap: { width: 86, maxWidth: "34%", height: 42, borderRadius: 13, backgroundColor: C.white, borderWidth: 1, borderColor: "#DCE2E9", paddingHorizontal: 9, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  calcTruckInput: { minWidth: 0, flex: 1, color: C.navy, fontSize: 15, fontWeight: "900", textAlign: "right", paddingVertical: 0, outlineStyle: "none" } as any,
  calcTruckUnit: { color: C.muted, fontSize: 11, fontWeight: "800", marginLeft: 4 },
  calcTruckResult: { minHeight: 68, marginTop: 8, borderRadius: 17, backgroundColor: "#FFF4EA", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  calcTruckResultLabel: { color: C.orange, fontSize: 11, fontWeight: "900", letterSpacing: .9 },
  calcTruckResultMeta: { color: C.muted, fontSize: 11, marginTop: 4 },
  calcTruckResultNumberWrap: { alignItems: "flex-end" },
  calcTruckResultNumber: { color: C.navy, fontSize: 24, fontWeight: "900", lineHeight: 26 },
  calcTruckResultUnit: { color: C.orange, fontSize: 10, fontWeight: "900", letterSpacing: .7, marginTop: 2 },
  calcScopeCard: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginTop: 20, borderWidth: 1, borderColor: "#E0E5EB" },
  calcScopeIntro: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 3, marginBottom: 12 },
  calcServiceGrid: { gap: 8 },
  calcService: { minHeight: 66, borderRadius: 16, borderWidth: 1, borderColor: "#E1E5EA", backgroundColor: "#F7F8FA", paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  calcServiceActive: { backgroundColor: "#FFF5ED", borderColor: "#F5B483" },
  calcServiceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#FFF0E4", alignItems: "center", justifyContent: "center" },
  calcServiceMachineIcon: { width: 27, height: 27 },
  calcServiceIconActive: { backgroundColor: C.orange },
  calcServiceCopy: { flex: 1 },
  calcServiceTitle: { color: C.navy, fontSize: 11, fontWeight: "900" },
  calcServiceTitleActive: { color: C.navy },
  calcServiceMeta: { color: C.muted, fontSize: 11, marginTop: 3 },
  calcServiceMetaActive: { color: "#8C5A36" },
  calcDeliveryCard: { marginTop: 18, borderRadius: 18, backgroundColor: "#F7F8FA", borderWidth: 1, borderColor: "#E1E5EA", padding: 12 },
  calcDeliveryHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  calcDeliveryIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  calcDeliveryTitle: { color: C.navy, fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  calcDeliveryHint: { color: C.muted, fontSize: 11, marginTop: 3 },
  calcChoiceRow: { flexDirection: "row", gap: 8 },
  calcChoice: { flex: 1, minHeight: 56, borderRadius: 16, backgroundColor: "#F3F5F8", borderWidth: 1, borderColor: "#E0E5EB", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, paddingHorizontal: 8 },
  calcChoiceActive: { backgroundColor: C.navy, borderColor: C.navy },
  calcChoiceText: { color: C.navy, fontSize: 11, fontWeight: "800" },
  calcChoiceTextActive: { color: C.white },
  calcToggleRow: { minHeight: 67, borderBottomWidth: 1, borderBottomColor: "#E7E9ED", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calcToggleTitle: { color: C.navy, fontSize: 12, fontWeight: "900" },
  calcToggleMeta: { color: C.muted, fontSize: 11, marginTop: 3 },
  calcToggle: { width: 43, height: 25, borderRadius: 13, backgroundColor: "#CDD3DD", padding: 3 },
  calcToggleOn: { backgroundColor: C.orange },
  calcToggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: C.white },
  calcToggleKnobOn: { marginLeft: 18 },
  field: {
    minHeight: 76,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E9ED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldDark: {
    minHeight: 72,
    borderBottomWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 9,
    backgroundColor: "rgba(255,255,255,.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  fieldLabel: { fontSize: 13, color: C.navy, fontWeight: "800" },
  fieldLabelDark: { color: C.white },
  fieldUnit: { fontSize: 10, color: C.muted, marginTop: 4 },
  fieldUnitDark: { color: "#AEB7C8" },
  input: {
    fontSize: 29,
    color: C.navy,
    fontWeight: "900",
    minWidth: 110,
    textAlign: "right",
  },
  inputDark: { color: C.white },
  result: {
    borderRadius: 16,
    minHeight: 92,
    marginTop: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
  resultLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,.75)",
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  resultValue: {
    fontSize: 30,
    color: C.white,
    fontWeight: "900",
    marginTop: 4,
  },
  resultUnit: { fontSize: 10 },
  resultMeta: { fontSize: 11, color: "#AAB5CA", marginTop: 6 },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  calcMeasureSummary: {
    width: "100%",
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E5ED",
    backgroundColor: "#F7F8FA",
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  calcMeasureItem: { flex: 1, minWidth: 0, paddingHorizontal: 7 },
  calcMeasureValue: { color: C.navy, fontSize: 18, fontWeight: "900" },
  calcMeasureUnit: { color: "#727D90", fontSize: 10, fontWeight: "900", letterSpacing: .65, marginTop: 3 },
  calcMeasureDivider: { width: 1, height: 32, backgroundColor: "#D8DEE8" },
  calcDensityPill: { position: "absolute", right: 8, top: 7, borderRadius: 8, backgroundColor: "#FFF0E5", paddingHorizontal: 7, paddingVertical: 4 },
  calcDensityText: { color: C.orange, fontSize: 10, fontWeight: "900" },
  costBreakdown: { paddingTop: 13 },
  costLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  costLineLabel: { color: C.muted, fontSize: 10 },
  costLineValue: { color: C.navy, fontSize: 10, fontWeight: "900" },
  calcWhatsapp: { minHeight: 54, borderRadius: 18, backgroundColor: "#1EAD61", marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  calcWhatsappText: { color: C.white, fontSize: 12, fontWeight: "900" },
  calcQuoteButton: { minHeight: 72, borderRadius: 20, backgroundColor: C.orange, marginTop: 15, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calcQuoteKicker: { color: "rgba(255,255,255,.72)", fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  calcQuoteTitle: { color: C.white, fontSize: 16, fontWeight: "900", marginTop: 4 },
  note: { fontSize: 10, lineHeight: 16, color: "#9298A5", marginTop: 16 },
  quoteFormCard: { borderRadius: 24, backgroundColor: "#17243E", borderWidth: 1, borderColor: "#30415F", padding: 18, marginTop: 18 },
  quoteFormTitle: { color: C.white, fontSize: 25, fontWeight: "900", letterSpacing: -.8, marginTop: 6 },
  quoteFormIntro: { color: "#9BA9C0", fontSize: 11, lineHeight: 18, marginTop: 8, marginBottom: 15 },
  quoteInput: { minHeight: 60, borderRadius: 16, backgroundColor: "#0F1A2F", borderWidth: 1, borderColor: "#2B3B59", color: C.white, paddingHorizontal: 16, marginBottom: 11, fontSize: 15 },
  quoteNote: { minHeight: 105, paddingTop: 15, textAlignVertical: "top" },
  quoteFieldLabel: { color: C.orange, fontSize: 12, fontWeight: "900", letterSpacing: .8, marginTop: 12, marginBottom: 10 },
  quoteProductRow: { gap: 7, paddingBottom: 12 },
  quoteProductWrap:{flexDirection:"row",flexWrap:"wrap",gap:7,paddingBottom:12},
  quoteProductChip: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: "#40506B",flexDirection:"row",alignItems:"center",gap:7 },
  quotePlantRow:{flexDirection:"row",gap:9,marginBottom:14},
  quotePlantChoice:{flex:1,minHeight:64,borderRadius:17,borderWidth:1,borderColor:"#DCE2EA",backgroundColor:"#F6F8FA",paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:9},
  quotePlantChoiceActive:{backgroundColor:C.navy,borderColor:C.navy},
  quotePlantChoiceText:{color:C.navy,fontSize:11,fontFamily:VODAFONE_BOLD},
  quotePlantChoiceTextActive:{color:C.white},
  quotePlantChoiceMeta:{color:"#7F8A9C",fontSize:9,marginTop:3},
  quotePlantChoiceMetaActive:{color:"#BFC9DA"},
  quoteEstimateCard:{borderRadius:20,backgroundColor:"#F4F6F9",borderWidth:1,borderColor:"#DCE2EA",padding:14,marginTop:4,marginBottom:10},
  quoteEstimateHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:8},
  quoteEstimateKicker:{color:C.orange,fontSize:9,fontFamily:VODAFONE_BOLD,letterSpacing:1},
  quoteEstimateTitle:{color:C.navy,fontSize:17,fontFamily:VODAFONE_BOLD,marginTop:3},
  quoteEstimateRow:{minHeight:68,borderTopWidth:1,borderTopColor:"#DFE4EA",flexDirection:"row",alignItems:"center",gap:8},
  quoteEstimateCopy:{flex:1,minWidth:0},
  quoteEstimateName:{color:C.navy,fontSize:10,fontFamily:VODAFONE_BOLD},
  quoteEstimateUnit:{color:"#788497",fontSize:9,marginTop:3},
  quoteEstimateInputWrap:{width:78,height:40,borderRadius:12,borderWidth:1,borderColor:"#D6DDE7",backgroundColor:C.white,flexDirection:"row",alignItems:"center",paddingHorizontal:8},
  quoteEstimateInput:{flex:1,color:C.navy,fontSize:12,fontFamily:VODAFONE_BOLD,paddingVertical:0},
  quoteEstimateTon:{color:"#7C8798",fontSize:9},
  quoteEstimateLine:{width:72,color:C.navy,fontSize:10,fontFamily:VODAFONE_BOLD,textAlign:"right"},
  quoteEstimateTotal:{borderTopWidth:1,borderTopColor:"#CFD6E1",paddingTop:13,marginTop:3},
  quoteEstimateTotalLabel:{color:"#758198",fontSize:9,fontFamily:VODAFONE_BOLD,letterSpacing:.6},
  quoteEstimateTotalValue:{color:C.navy,fontSize:22,fontFamily:VODAFONE_BOLD,marginTop:4},
  quoteEstimateDisclaimer:{color:"#6C788B",fontSize:9,lineHeight:14,marginTop:10},
  quoteProductChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  quoteProductText: { color: "#AAB6CA", fontSize: 13, fontWeight: "800" },
  quoteProductTextActive: { color: C.white },
  quoteServiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  quoteServiceChip: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: "#40506B", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  quoteServiceChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  quoteServiceText: { color: "#AAB6CA", fontSize: 13, fontWeight: "800" },
  quoteServiceTextActive: { color: C.white },
  quoteUploadActions: { flexDirection: "row", gap: 8, marginBottom: 10 },
  quoteUploadButton: { flex: 1, minHeight: 72, borderRadius: 16, borderWidth: 1, borderColor: "#40506B", backgroundColor: "#0F1A2F", padding: 11, gap: 7 },
  quoteUploadTitle: { color: C.white, fontSize: 10, fontWeight: "900" },
  quoteUploadMeta: { color: "#7F8DA5", fontSize: 10, lineHeight: 11, marginTop: 2 },
  quotePhotoRow: { gap: 9, paddingVertical: 4, paddingBottom: 13 },
  quotePhotoCard: { width: 106, height: 102, borderRadius: 15, overflow: "hidden", backgroundColor: "#0F1A2F", borderWidth: 1, borderColor: "#40506B" },
  quotePhotoImage: { width: "100%", height: 75 },
  quotePhotoRemove: { position: "absolute", right: 6, top: 6, width: 25, height: 25, borderRadius: 13, backgroundColor: "rgba(9,18,36,.82)", alignItems: "center", justifyContent: "center" },
  quotePhotoName: { color: "#AAB6CA", fontSize: 10, paddingHorizontal: 7, paddingTop: 5 },
  quotePhotoBadge: { position: "absolute", left: 6, top: 6, borderRadius: 8, backgroundColor: C.orange, paddingHorizontal: 7, paddingVertical: 4 },
  quotePhotoBadgeText: { color: C.white, fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  quoteAttachmentStatus: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 13, backgroundColor: "#0F1A2F", paddingHorizontal: 12, marginBottom: 5 },
  quoteAttachmentStatusText: { flex: 1, color: "#9EACC1", fontSize: 11, lineHeight: 12 },
  quoteSelect: { minHeight: 58, borderRadius: 15, borderWidth: 1, borderColor: "#40506B", backgroundColor: "#0F1A2F", paddingHorizontal: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quoteSelectLabel: { color: "#71809A", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 4 },
  quoteSelectValue: { color: C.white, fontSize: 11, fontWeight: "800" },
  quoteSelectPlaceholder: { color: "#71809A" },
  quoteSelectMenu: { borderRadius: 15, borderWidth: 1, borderColor: "#40506B", backgroundColor: "#14223B", overflow: "hidden", marginBottom: 9 },
  quoteDistrictMenu: { maxHeight: 245, marginBottom: 9 },
  quoteSelectOption: { minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.06)" },
  deliveryPickerLayer:{flex:1,backgroundColor:"rgba(5,14,32,.58)",justifyContent:"flex-end"},
  deliveryPickerSheet:{maxHeight:"68%",backgroundColor:C.white,borderTopLeftRadius:30,borderTopRightRadius:30,paddingTop:10,paddingHorizontal:18},
  deliveryPickerHandle:{alignSelf:"center",width:46,height:5,borderRadius:3,backgroundColor:"#D8DDE5",marginBottom:15},
  deliveryPickerHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:3,paddingBottom:13},
  deliveryPickerKicker:{color:C.orange,fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.3},
  deliveryPickerTitle:{color:C.navy,fontSize:22,fontFamily:D.fonts.bold,marginTop:3},
  deliveryPickerClose:{width:40,height:40,borderRadius:20,backgroundColor:"#F0F2F5",alignItems:"center",justifyContent:"center"},
  deliveryPickerScroll:{maxHeight:420},
  deliveryPickerOption:{minHeight:58,borderTopWidth:1,borderTopColor:"#E8EBF0",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:3},
  deliveryPickerOptionIcon:{width:36,height:36,borderRadius:12,backgroundColor:"#FFF0E6",alignItems:"center",justifyContent:"center"},
  deliveryPickerOptionText:{flex:1,color:C.navy,fontSize:15,fontFamily:D.fonts.bold},
  quoteSelectOptionText: { color: "#E7ECF5", fontSize: 10, fontWeight: "800" },
  quoteError: { color: "#FF9B91", fontSize: 11, marginBottom: 8 },
  quoteSuccess: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E9F8F0", borderRadius: 13, padding: 11, marginBottom: 9 },
  quoteSuccessText: { flex: 1, color: "#147847", fontSize: 11, fontWeight: "800" },
  quoteSubmit: { minHeight: 58, borderRadius: 18, backgroundColor: C.orange, flexDirection: "row", alignItems: "center", justifyContent: "center", gap:10, paddingHorizontal: 20 },
  quoteSubmitBusy:{backgroundColor:"#C94E32"},
  quoteSubmitSuccess:{backgroundColor:"#159A67"},
  quoteSubmitText: { color: C.white, fontSize: 15, fontWeight: "900" },
  quotePage: { minHeight: 760, paddingTop: 38, paddingBottom: 90 },
  quoteHeroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  quoteHeroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  quoteHeroCopy: { flex: 1 },
  quotePageTitle: { color: C.white, fontSize: 35, lineHeight: 37, fontWeight: "900", letterSpacing: -1.4, marginTop: 5 },
  quotePageIntro: { color: "#AAB6CA", fontSize: 16, lineHeight: 23, marginTop: 16, marginBottom: 5 },
  quoteFormCardStandalone: { borderRadius: 24, backgroundColor: "#17243E", borderWidth: 1, borderColor: "#30415F", padding: 18, marginTop: 18 },
  quoteProgress:{flexDirection:"row",alignItems:"flex-start",gap:9,marginTop:24,paddingHorizontal:2},
  quoteProgressItem:{flex:1,minWidth:0},
  quoteProgressItemPressed:{opacity:.65,transform:[{scale:.97}]},
  quoteProgressLine:{width:"100%",height:3,borderRadius:2,backgroundColor:"#31415D",marginBottom:11},
  quoteProgressLineActive:{backgroundColor:C.orange},
  quoteProgressLineComplete:{backgroundColor:"#32B978"},
  quoteProgressRow:{flexDirection:"row",alignItems:"center",gap:8},
  quoteProgressState:{width:25,height:25,borderRadius:13,borderWidth:1,borderColor:"#53617A",alignItems:"center",justifyContent:"center"},
  quoteProgressStateCurrent:{backgroundColor:C.orange,borderColor:"#FFB27D"},
  quoteProgressStateComplete:{backgroundColor:"#32B978",borderColor:"#72D9A6"},
  quoteProgressNoActive:{color:C.white,fontSize:12,fontFamily:D.fonts.bold},
  quoteProgressLabel:{color:"#7F8DA5",fontSize:11,fontFamily:D.fonts.bold},
  quoteProgressLabelActive:{color:C.white},
  quoteProgressMeta:{color:"#65738B",fontSize:8,lineHeight:10,fontFamily:D.fonts.bold,marginTop:2},
  quoteProgressMetaActive:{color:"#AEB9CC"},
  quoteStepTitle:{fontSize:24,lineHeight:29,fontFamily:D.fonts.extraBold},
  quoteStepIntro:{fontSize:15,lineHeight:21,marginTop:5,marginBottom:18},
  quoteStepActions:{flexDirection:"row",alignItems:"center",gap:10,marginTop:8},
  quoteBack:{height:58,minWidth:94,borderRadius:18,borderWidth:1,borderColor:"#40506B",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,paddingHorizontal:15},
  quoteBackText:{fontSize:14,fontFamily:D.fonts.bold},
  quoteAccountPrefill: { minHeight: 42, borderRadius: 13, backgroundColor: "rgba(67,209,139,.10)", borderWidth: 1, borderColor: "rgba(67,209,139,.24)", paddingHorizontal: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  quoteAccountPrefillText: { flex: 1, color: "#BFEBD3", fontSize: 11, lineHeight: 12, fontWeight: "800" },
  quoteLocationButton: { minHeight: 58, borderRadius: 15, borderWidth: 1, borderColor: "#40506B", backgroundColor: "#0F1A2F", paddingHorizontal: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  quoteLocationCopy: { flex: 1 },
  quoteLocationTitle: { color: C.white, fontSize: 10, fontWeight: "900" },
  quoteLocationMeta: { color: "#71809A", fontSize: 10, lineHeight: 11, marginTop: 3 },
  quotePrivacy: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14, paddingHorizontal: 8 },
  quotePrivacyText: { flex: 1, color: "#7F8DA5", fontSize: 11, lineHeight: 13 },
  contact: { minHeight: 700 },
  contactHero: {
    height: 500,
    backgroundColor: C.navy,
    marginHorizontal: -22,
    marginTop: -42,
    paddingHorizontal: 22,
    paddingTop: 76,
    paddingBottom: 48,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  contactHeroImage: { resizeMode: "contain" },
  contactHeroMedia: { ...StyleSheet.absoluteFillObject },
  contactLogo: { width: 220, height: 68 },
  contactOnline: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  contactOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#36D27D",
  },
  contactOnlineText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  quickContact: { flexDirection: "row", gap: 10, marginTop: 16 },
  quickContactItem: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.12)",
    padding: 15,
  },
  quickContactLabel: {
    fontSize: 10,
    color: "#8794AF",
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 13,
  },
  quickContactValue: {
    fontSize: 11,
    color: C.white,
    fontWeight: "800",
    marginTop: 5,
  },
  contactActionRail:{gap:10,marginTop:12},
  contactActionPrimary:{minHeight:66,borderRadius:20,backgroundColor:C.orange,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:11},
  contactActionKicker:{fontSize:9,fontFamily:D.fonts.bold,letterSpacing:1.1,color:"rgba(255,255,255,.76)"},
  contactActionTitle:{fontSize:14,fontFamily:D.fonts.bold,color:C.white,marginTop:3,flex:1},
  contactActionSecondary:{height:52,borderRadius:17,backgroundColor:"rgba(255,255,255,.09)",borderWidth:1,borderColor:"rgba(255,255,255,.16)",paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10},
  contactActionSecondaryText:{flex:1,fontSize:12,fontFamily:D.fonts.bold,color:C.white},
  contactButton: {
    borderRadius: 19,
    backgroundColor: C.orange,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  contactButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.17)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonCopy: { flex: 1, marginLeft: 13 },
  contactButtonLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,.75)",
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  contactButtonTitle: {
    fontSize: 16,
    color: C.white,
    fontWeight: "900",
    marginTop: 3,
  },
  locationsTitle: {
    fontSize: 11,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: 45,
    marginBottom: 4,
  },
  locationCard: {
    flexDirection: "row",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,.06)",
    padding: 17,
    marginTop: 11,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(231,64,34,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationCopy: { flex: 1, marginLeft: 14 },
  locationType: {
    fontSize: 11,
    color: C.orange,
    fontWeight: "900",
    letterSpacing: 1,
  },
  locationName: {
    fontSize: 18,
    color: C.white,
    fontWeight: "900",
    marginTop: 5,
  },
  locationAddress: {
    fontSize: 11,
    lineHeight: 18,
    color: "#AEB8CD",
    marginTop: 6,
  },
  locationHours: { fontSize: 11, color: "#7F8BA5", marginTop: 6 },
  locationRoute: { alignSelf: "center", width: 52, height: 52, borderRadius: 26, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  locationRouteText: { color: C.white, fontSize: 9, fontWeight: "900", letterSpacing: .5, marginTop: 1 },
  address: {
    flexDirection: "row",
    gap: 13,
    borderTopWidth: 1,
    borderTopColor: "#35466C",
    marginTop: 45,
    paddingTop: 25,
  },
  addressText: { color: "#B7C0D5", fontSize: 13, lineHeight: 21 },
  lockedDocsCard: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(231,64,34,.35)",
    backgroundColor: "rgba(231,64,34,.08)",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  lockedDocsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  lockedDocsTitle: { color: C.navy, fontSize: 13, fontWeight: "900" },
  portalAuthPage: { flex: 1, backgroundColor: "#101A2F" },
  portalAuthInner: { padding: 24, paddingTop: 34, paddingBottom: 50 },
  portalLogo: { width: 232, height: 72, marginBottom: 38 },
  portalLockIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  portalSecurityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  securePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secureDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#42D886",
  },
  securePillText: {
    color: "#AEB8CA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  portalEyebrow: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  portalAuthTitle: {
    color: C.white,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 10,
  },
  portalAuthText: {
    color: "#9DA9BF",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 22,
  },
  portalInput: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.11)",
    color: C.white,
    paddingHorizontal: 16,
    marginBottom: 10,
    fontSize: 13,
  },
  portalInputRow: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.11)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    marginBottom: 10,
  },
  portalInputWithIcon: {
    flex: 1,
    height: "100%",
    color: C.white,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  phoneField: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.11)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    marginBottom: 10,
  },
  phonePrefix: {
    color: C.white,
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,.12)",
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    color: C.white,
    paddingHorizontal: 14,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  otpInput: {
    width: "100%",
    height: 64,
    opacity: 0.01,
    marginBottom: -64,
    zIndex: 3,
  },
  otpBoxes: { flexDirection: "row", gap: 8, marginBottom: 16 },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E7EC",
    backgroundColor: "#F4F4F9",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: C.orange,
    backgroundColor: "#FFF7F0",
  },
  otpBoxActive: { borderColor: C.orange, borderWidth: 2, backgroundColor: C.white },
  otpBoxError: { borderColor: "#FF3B30", backgroundColor: "#FFF2F1" },
  otpDigit: { color: C.navy, fontSize: 22, fontWeight: "800" },
  otpCaret: { width: 2, height: 23, backgroundColor: C.orange, borderRadius: 2 },
  otpMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  otpMeta: { color: "#77849B", fontSize: 8 },
  otpMetaExpired: { color: "#FF9B91" },
  otpResend: { color: C.orange, fontSize: 11, fontWeight: "900" },
  portalPrimaryButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: C.orange,
    paddingHorizontal: 18,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  portalPrimaryButtonDisabled: { opacity: 0.45 },
  portalPrimaryIcon: { marginRight: 10 },
  portalPrimaryText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  verificationNotice: {
    borderRadius: 16,
    backgroundColor: "rgba(231,64,34,.1)",
    borderWidth: 1,
    borderColor: "rgba(231,64,34,.3)",
    padding: 13,
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  verificationText: { flex: 1, color: "#BAC3D2", fontSize: 10, lineHeight: 16 },
  portalAuthLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 19,
  },
  portalAuthLink: { color: "#AAB5C9", fontSize: 11, fontWeight: "800" },
  portalAuthHint: { color: "#758198", fontSize: 11, fontWeight: "700" },
  portalAuthLinkInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  portalAuthHintInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  authError: {
    color: "#FFB4AB",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  portalPage: { flex: 1, backgroundColor: "#EEF0F4" },
  portalSettingsPage:{backgroundColor:"#0E0E0F"},
  portalInner: { padding: 18, paddingTop: 18, paddingBottom: 50 },
  portalSubInner: { padding: 18, paddingTop: 18, paddingBottom: 70 },
  portalSettingsInner:{paddingHorizontal:24,paddingTop:8,paddingBottom:100},
  portalProfileInner: { paddingTop: 0 },
  portalSubHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 2, marginBottom: 18 },
  portalSettingsHeader:{minHeight:78,marginBottom:26},
  appBackButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appBackButtonLight: { backgroundColor: "rgba(255,255,255,.92)", borderWidth: 1, borderColor: "rgba(15,34,70,.10)" },
  appBackButtonDark: { backgroundColor: "rgba(7,20,45,.68)", borderWidth: 1, borderColor: "rgba(255,255,255,.22)" },
  portalSubBack: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,.78)", alignItems: "center", justifyContent: "center" },
  portalSettingsBack:{backgroundColor:"transparent"},
  portalSubTitle: { color: C.navy, fontSize: 19, fontFamily: VODAFONE_BOLD },
  portalSettingsTitle:{color:C.white,fontSize:28,fontFamily:D.fonts.extraBold},
  portalSubHeaderSpacer: { width: 44 },
  portalSubHeaderProfile: { position: "absolute", top: 0, left: -18, right: -18, zIndex: 5, minHeight: 96, marginHorizontal: 0, marginBottom: 0, paddingHorizontal: 20, backgroundColor: "transparent" },
  portalSubBackDark: { backgroundColor: "rgba(255,255,255,.12)" },
  portalSubTitleDark: { color: C.white },
  portalSubIntro: { color: "#657186", fontSize: 11, lineHeight: 18, marginBottom: 17 },
  portalGroupTitle: { color: C.navy, fontSize: 15, fontFamily: VODAFONE_BOLD, marginTop: 22, marginBottom: 9 },
  portalMenuGroup: { backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 15, overflow: "hidden" },
  portalPlainRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 13, borderBottomWidth: 1, borderBottomColor: "#EDF0F4" },
  portalPlainRowText: { flex: 1, color: C.navy, fontSize: 14, lineHeight:18, fontFamily: VODAFONE_BOLD, includeFontPadding:false },
  portalPlainRowMeta: { color: "#788497", fontSize: 11, lineHeight:16, marginTop:3, includeFontPadding:false },
  portalProfileMenuRow:{minHeight:76,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:"#EDF0F4",paddingVertical:8},
  portalProfileMenuIcon:{width:46,height:46,borderRadius:23,backgroundColor:"rgba(231,64,34,.10)",alignItems:"center",justifyContent:"center",flexShrink:0},
  portalProfileMenuCopy:{flex:1,minWidth:0,justifyContent:"center",alignSelf:"stretch"},
  portalProfileMenuTitle:{color:C.navy,fontSize:14,lineHeight:18,fontFamily:VODAFONE_BOLD,flexGrow:0,flexShrink:1,includeFontPadding:false},
  portalPreferenceRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#EDF0F4", paddingVertical:12 },
  portalPreferenceIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  portalPreferenceCopy: { flex: 1, justifyContent:"center", alignSelf:"center", minWidth:0 },
  portalSettingsGroupTitle:{color:"#747477",fontSize:13,fontFamily:D.fonts.bold,letterSpacing:1.1,marginTop:20,marginBottom:9},
  portalSettingsGroup:{backgroundColor:"transparent"},
  portalSettingsRow:{minHeight:68,flexDirection:"row",alignItems:"center",gap:13,borderBottomWidth:1,borderBottomColor:"#242528"},
  portalSettingsRowText:{flex:1,color:"#F4F4F5",fontSize:17,fontFamily:D.fonts.regular},
  portalSettingsValue:{color:"#77777A",fontSize:15,fontFamily:D.fonts.regular},
  portalSettingsToggle:{width:54,height:32,borderRadius:16,backgroundColor:"#2CCD63",padding:3,alignItems:"flex-end",justifyContent:"center"},
  portalSettingsToggleKnob:{width:26,height:26,borderRadius:13,backgroundColor:C.white},
  portalSettingsLogout:{minHeight:68,marginTop:20,flexDirection:"row",alignItems:"center",gap:13,borderBottomWidth:1,borderBottomColor:"#242528"},
  portalSettingsLogoutText:{flex:1,color:"#F4F4F5",fontSize:17,fontFamily:D.fonts.regular},
  portalInfoNote: { marginTop: 14, borderRadius: 17, backgroundColor: "#EAF6F0", padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  portalInfoNoteText: { flex: 1, color: "#4F6E60", fontSize: 11, lineHeight: 15 },
  portalNotificationHero:{minHeight:92,borderRadius:22,backgroundColor:"#14264E",padding:16,marginBottom:14,flexDirection:"row",alignItems:"center",gap:13},
  portalNotificationHeroIcon:{width:48,height:48,borderRadius:16,backgroundColor:"rgba(255,255,255,.1)",alignItems:"center",justifyContent:"center"},
  portalNotificationHeroCopy:{flex:1},
  portalNotificationHeroTitle:{color:C.white,fontSize:17,fontFamily:D.fonts.extraBold},
  portalNotificationHeroText:{color:"#C9D6E9",fontSize:10,lineHeight:15,marginTop:4},
  portalNotificationSwitch:{width:42,height:25,borderRadius:13,backgroundColor:"#D9DEE6",padding:3,justifyContent:"center"},
  portalNotificationSwitchActive:{backgroundColor:C.orange,alignItems:"flex-end"},
  portalNotificationSwitchKnob:{width:19,height:19,borderRadius:10,backgroundColor:C.white},
  portalNotificationSwitchKnobActive:{},
  paypalProfileCard: { marginHorizontal: -18, borderRadius: 0, overflow: "hidden", padding: 24, paddingTop: 104, alignItems:"center" },
  paypalProfileBackdrop: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "cover", opacity: 0.46 },
  paypalProfileBackdropShade: { ...StyleSheet.absoluteFillObject },
  paypalCover: { height: 0 },
  paypalAvatarWrap: { width: 108, height: 108, borderRadius: 54, backgroundColor: C.orange, borderWidth: 3, borderColor: "rgba(255,255,255,.82)", alignItems: "center", justifyContent: "center" },
  paypalAvatar: { width: 96, height: 96, borderRadius: 48 },
  paypalAvatarText: { color: C.white, fontSize: 20, fontWeight: "900" },
  paypalAvatarEdit: { position: "absolute", right: -3, bottom: -2, width: 25, height: 25, borderRadius: 13, backgroundColor: C.white, borderWidth: 1, borderColor: "#D9DEE7", alignItems: "center", justifyContent: "center" },
  paypalProfileNameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 13 },
  paypalProfileName: { color: C.white, fontSize: 20, fontFamily: VODAFONE_BOLD },
  paypalProfileMail: { color: "#DDE6F5", fontSize: 10, marginTop: 5 },
  paypalProfileCompany: { color: C.orange, fontSize: 10, fontFamily: VODAFONE_BOLD, marginTop: 6 },
  paypalProfileActions: { width:"100%", flexDirection: "row", gap: 8, marginTop: 18 },
  paypalOutlineButton: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor:"rgba(255,255,255,.1)", borderWidth: 1, borderColor: "rgba(255,255,255,.22)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  paypalOutlineText: { color: C.white, fontSize: 11, fontFamily: VODAFONE_BOLD },
  portalInlineEditor:{marginTop:14,backgroundColor:C.white,borderRadius:22,padding:16,borderWidth:1,borderColor:"#E1E5EB"},
  portalInlineEditorHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:13},
  portalInlineEditorTitle:{color:C.navy,fontSize:19,fontFamily:D.fonts.extraBold,marginTop:4},
  portalInlineEditorClose:{width:36,height:36,borderRadius:18,backgroundColor:"#F0F2F5",alignItems:"center",justifyContent:"center"},
  portalLogoutWide: { minHeight: 54, borderRadius: 27, marginTop: 16, backgroundColor: C.white, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  portalLogoutWideText: { color: "#B42318", fontSize: 11, fontWeight: "900" },
  portalSearchFake: { minHeight: 54, borderRadius: 27, backgroundColor: C.white, borderWidth: 1, borderColor: "#D9DEE7", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  portalSearchText: { color: "#788496", fontSize: 11 },
  portalSearchInput: { flex: 1, color: C.navy, fontSize: 11, paddingVertical: 13 },
  portalFaqHero:{paddingVertical:9,alignItems:"center",marginBottom:18},
  portalFaqHeroTitle:{color:C.navy,fontSize:30,lineHeight:34,fontFamily:D.fonts.extraBold,textAlign:"center",letterSpacing:-.6},
  portalFaqHeroText:{color:"#6F7B8E",fontSize:12,lineHeight:18,textAlign:"center",marginTop:9,maxWidth:290},
  portalFaqSectionTitle:{color:"#7A8698",fontSize:10,fontFamily:D.fonts.bold,letterSpacing:1.25,marginTop:19,marginBottom:7},
  portalFaqList:{backgroundColor:"#F1F3F6",paddingHorizontal:15},
  portalFaqItem: { borderBottomWidth: 1, borderBottomColor: "#E7EBF0" },
  portalFaqQuestion: { minHeight:66,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:15,paddingHorizontal:2 },
  portalFaqQuestionText:{flex:1,color:C.navy,fontSize:13,lineHeight:18,fontFamily:D.fonts.bold},
  portalFaqAnswer: { paddingRight:8,paddingBottom:18 },
  portalFaqAnswerText: { color: "#667287", fontSize:11,lineHeight:18 },
  portalFaqEmpty: { minHeight: 130, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 10 },
  portalFaqEmptyText: { color: "#7E899A", fontSize: 10, lineHeight: 16, textAlign: "center" },
  portalHelpCta: { marginTop: 16, minHeight: 66, borderRadius: 20, backgroundColor: "#1EAD61", paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 12 },
  orderToolbar: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 },
  quoteOverview:{backgroundColor:C.navy,borderRadius:24,padding:17,marginBottom:13,overflow:"hidden"},
  quoteOverviewHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  quoteOverviewKicker:{color:"#AAB8CF",fontSize:9,fontFamily:D.fonts.bold,letterSpacing:1.1},
  quoteOverviewTitle:{color:C.white,fontSize:24,lineHeight:28,fontFamily:D.fonts.extraBold,marginTop:3},
  quoteOverviewIcon:{width:42,height:42,borderRadius:15,backgroundColor:"rgba(255,255,255,.10)",alignItems:"center",justifyContent:"center"},
  quoteOverviewText:{color:"#C9D6E8",fontSize:11,lineHeight:16,marginTop:10,maxWidth:310},
  quoteMetricRow:{marginTop:15,paddingTop:13,borderTopWidth:1,borderTopColor:"rgba(255,255,255,.14)",flexDirection:"row",alignItems:"stretch"},
  quoteMetric:{flex:1,alignItems:"center"},
  quoteMetricValue:{color:C.white,fontSize:19,lineHeight:22,fontFamily:D.fonts.extraBold},
  quoteMetricLabel:{color:"#AAB8CF",fontSize:8,lineHeight:11,fontFamily:D.fonts.bold,letterSpacing:.45,marginTop:2,textAlign:"center"},
  quoteMetricDivider:{width:1,backgroundColor:"rgba(255,255,255,.16)"},
  orderSearch: { flex:1, minHeight:44, borderRadius:16, backgroundColor:C.white, borderWidth:1, borderColor:"#E3E7ED", paddingHorizontal:13, flexDirection:"row", alignItems:"center", gap:8 },
  orderSearchInput: { flex:1, color:C.navy, fontSize:10, fontWeight:"800", paddingVertical:0 },
  orderRefresh: { minHeight:44, paddingHorizontal:13, borderRadius:16, backgroundColor:C.white, borderWidth:1, borderColor:"#E3E7ED", flexDirection:"row", alignItems:"center", gap:6 },
  orderRefreshText: { color:C.navy, fontSize: 11, fontWeight:"900" },
  orderPrivacyHint: { color:"#7B8799", fontSize: 11, lineHeight:12, marginBottom:12 },
  orderList: { gap:12 },
  orderCard: { backgroundColor:C.white, borderRadius:20, padding:16, borderWidth:1, borderColor:"#E3E7ED" },
  orderCardOpen: { borderColor:"#F7B27F", shadowColor:C.orange, shadowOpacity:.08, shadowRadius:16, shadowOffset:{width:0,height:7} },
  orderAccordionHead: { minHeight:66, flexDirection:"row", alignItems:"center", gap:10 },
  orderAccordionIcon: { width:42, height:42, borderRadius:14, backgroundColor:"#FFF2E8", alignItems:"center", justifyContent:"center" },
  orderAccordionCopy: { flex:1 },
  orderProductCompact: { color:C.navy, fontSize:13, fontWeight:"900", marginTop:3 },
  orderAccordionBody: { borderTopWidth:1, borderTopColor:"#EDF0F4", marginTop:10, paddingTop:12 },
  orderDetailRow: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:6 },
  orderPdfButton: { marginTop:13, minHeight:44, borderRadius:14, backgroundColor:C.navy, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  orderPdfButtonText: { color:C.white, fontSize:12, fontWeight:"900" },
  orderArchiveButton: { marginTop:12, minHeight:42, borderRadius:13, backgroundColor:"#FFF4F2", borderWidth:1, borderColor:"#F5C5BE", flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  orderArchiveButtonText: { color:"#B42318", fontSize:12, fontWeight:"900" },
  orderArchivedNotice: { marginTop:12, minHeight:42, paddingHorizontal:12, borderRadius:13, backgroundColor:"#F2F4F7", flexDirection:"row", alignItems:"center", gap:8 },
  orderArchivedNoticeText: { flex:1, color:"#64748B", fontSize:11, lineHeight:15, fontWeight:"700" },
  orderHead: { flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", gap:10 },
  orderReference: { color:C.orange, fontSize:10, fontWeight:"900", letterSpacing:.7 },
  orderDate: { color:"#8A95A6", fontSize: 10, marginTop:3 },
  orderStatus: { minHeight:30, borderRadius:15, paddingHorizontal:10, flexDirection:"row", alignItems:"center", gap:5 },
  orderStatusText: { fontSize: 11, fontWeight:"900" },
  orderProduct: { color:C.navy, fontSize:15, fontWeight:"900", marginTop:14 },
  orderMeta: { color:"#6F7B8E", fontSize: 11, lineHeight:14, marginTop:4 },
  orderOffer: { marginTop:13, borderRadius:16, padding:14, backgroundColor:"#FFF4EA", borderWidth:1, borderColor:"#FFD5B7", flexDirection:"row", alignItems:"center", gap:12 },
  orderOfferLabel: { color:C.orange, fontSize: 11, fontWeight:"900", letterSpacing:1.1 },
  orderOfferAmount: { color:C.navy, fontSize:18, fontWeight:"900", marginTop:3 },
  orderOfferValidity: { marginLeft:"auto", color:"#68758A", fontSize: 11, lineHeight:12, textAlign:"right", fontWeight:"700" },
  orderOfferMessage: { color:"#526071", fontSize: 11, lineHeight:14, marginTop:10 },
  orderNote: { marginTop:13, paddingTop:12, borderTopWidth:1, borderTopColor:"#EDF0F4", flexDirection:"row", alignItems:"flex-start", gap:8 },
  orderTimelineDot: { width:7, height:7, borderRadius:4, marginTop:4 },
  orderNoteText: { flex:1, color:"#526071", fontSize: 11, lineHeight:14 },
  orderMailSent: { marginTop:10, flexDirection:"row", alignItems:"center", gap:7 },
  orderMailSentText: { flex:1, color:"#198A58", fontSize: 11, lineHeight:12, fontWeight:"800" },
  orderEmpty: { backgroundColor:C.white, borderRadius:22, padding:24, alignItems:"center" },
  orderEmptyTitle: { color:C.navy, fontSize:16, fontWeight:"900", marginTop:10 },
  orderEmptyText: { color:"#738095", fontSize: 11, lineHeight:14, textAlign:"center", marginTop:6 },
  orderEmptyButton: { marginTop:16, minHeight:44, paddingHorizontal:18, borderRadius:15, backgroundColor:C.orange, alignItems:"center", justifyContent:"center" },
  orderEmptyButtonText: { color:C.white, fontSize:10, fontWeight:"900" },
  portalHelpCtaTitle: { color: C.white, fontSize: 12, fontWeight: "900" },
  portalHelpCtaMeta: { color: "rgba(255,255,255,.78)", fontSize: 11, marginTop: 3 },
  portalHeader: {
    minHeight:64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal:2,
    marginBottom:18,
  },
  portalTitle: {
    color: C.navy,
    fontSize: 19,
    fontFamily: VODAFONE_BOLD,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20,38,78,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileHero: { borderRadius: 26, padding: 19, marginTop: 20, overflow: "hidden" },
  profileHeroTop: { flexDirection: "row", alignItems: "center" },
  profileAvatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#314873", borderWidth: 2, borderColor: "rgba(255,255,255,.35)", alignItems: "center", justifyContent: "center" },
  profileAvatar: { width: 76, height: 76, borderRadius: 38 },
  profileInitials: { color: C.white, fontSize: 20, fontWeight: "900" },
  profileCamera: { position: "absolute", right: -2, bottom: -2, width: 25, height: 25, borderRadius: 13, backgroundColor: C.orange, borderWidth: 2, borderColor: C.navy, alignItems: "center", justifyContent: "center" },
  profileIdentity: { flex: 1, marginLeft: 14 },
  profileWelcome: { color: C.orange, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  profileNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  profileName: { color: C.white, fontSize: 19, fontWeight: "900" },
  profileCompany: { color: "#AFC0DE", fontSize: 10, marginTop: 3 },
  profileVerified: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#19A66A", alignItems: "center", justifyContent: "center" },
  profileContactRow: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.12)", marginTop: 17, paddingTop: 14, gap: 8 },
  profileContact: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileContactText: { color: "#DCE4F2", fontSize: 10 },
  profileEditorCard: { borderRadius: 23, backgroundColor: C.white, borderWidth: 1, borderColor: "#E1E5EB", padding: 16, marginTop: 12 },
  profileEditorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  profileEditorTitle: { color: C.navy, fontSize: 20, fontWeight: "900", marginTop: 4 },
  profileEditButton: { height: 37, borderRadius: 12, backgroundColor: "#FFF3E9", paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6 },
  profileEditButtonText: { color: C.orange, fontSize: 11, fontWeight: "900" },
  profileEditInputRow: { minHeight: 53, borderRadius: 14, backgroundColor: "#F3F5F8", borderWidth: 1, borderColor: "#E2E6EC", paddingHorizontal: 13, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 9 },
  profileEditInput: { flex: 1, color: C.navy, fontSize: 11, paddingVertical: 12 },
  profileEmailLocked: { minHeight: 55, borderRadius: 14, backgroundColor: "#EEF1F5", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 9 },
  profileEmailLabel: { color: "#8490A2", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  profileEmailValue: { color: C.navy, fontSize: 10, fontWeight: "800", marginTop: 4 },
  profileSaveButton: { minHeight: 51, borderRadius: 15, backgroundColor: C.orange, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileSaveButtonText: { color: C.white, fontSize: 10, fontWeight: "900" },
  profileSummaryGrid: { gap: 2 },
  profileSummaryItem: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: "#ECEFF3" },
  profileSummaryCopy: { flex: 1 },
  profileSummaryLabel: { color: "#8792A2", fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  profileSummaryValue: { color: C.navy, fontSize: 10, fontWeight: "800", marginTop: 4 },
  profileError: { color: "#B42318", fontSize: 10, marginTop: 10 },
  portalStatsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  portalStatCard: { flex: 1, minHeight: 105, borderRadius: 19, backgroundColor: C.white, padding: 12, justifyContent: "space-between" },
  portalStatValue: { color: C.navy, fontSize: 20, fontWeight: "900" },
  portalStatValueSmall: { color: C.navy, fontSize: 14, fontWeight: "900" },
  portalStatLabel: { color: "#7B879A", fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  portalQuickGrid: { marginTop: 10, gap: 8 },
  portalQuickPrimary: { minHeight: 70, borderRadius: 20, backgroundColor: C.orange, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 12 },
  portalQuickKicker: { color: "rgba(255,255,255,.72)", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  portalQuickTitle: { color: C.white, fontSize: 14, fontWeight: "900", marginTop: 3, flex: 1 },
  portalSupport: { minHeight: 52, borderRadius: 17, backgroundColor: "#F2FBF6", borderWidth: 1, borderColor: "#D4EBDD", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  portalSupportText: { color: "#178A50", fontSize: 10, fontWeight: "900" },
  portalActivityCard: { backgroundColor: C.white, borderRadius: 22, padding: 15, marginTop: 12 },
  portalActivityHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  portalActivityTitle: { color: C.navy, fontSize: 18, fontWeight: "900", marginTop: 3 },
  portalActivityAll: { color: C.orange, fontSize: 11, fontWeight: "900" },
  portalActivityRow: { minHeight: 57, borderTopWidth: 1, borderTopColor: "#E8EBEF", flexDirection: "row", alignItems: "center", gap: 9 },
  portalActivityIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#FFF3EA", alignItems: "center", justifyContent: "center" },
  portalActivityLabel: { flex: 1, color: C.navy, fontSize: 10, fontWeight: "800" },
  portalActivityValue: { color: C.navy, fontSize: 13, fontWeight: "900" },
  portalSectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 30 },
  portalSectionTitle: { color: C.navy, fontSize: 22, fontWeight: "900", marginTop: 4 },
  portalLivePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E5F5EC", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  portalLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#19A66A" },
  portalLiveText: { color: "#178A50", fontSize: 10, fontWeight: "900" },
  portalUserCard: {
    minHeight: 70,
    borderRadius: 20,
    padding: 14,
    marginTop: 20,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  portalUserName: { color: C.navy, fontSize: 13, fontWeight: "900" },
  portalUserMail: { color: C.muted, fontSize: 11, marginTop: 3 },
  verifiedPill: {
    marginLeft: "auto",
    borderRadius: 10,
    backgroundColor: "#E8F7EF",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  verifiedText: { color: "#178A50", fontSize: 10, fontWeight: "900" },
  priceSummary: {
    minHeight: 112,
    borderRadius: 22,
    marginTop: 14,
    padding: 18,
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceSummaryLabel: {
    color: "#A7B2C8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  priceSummaryValue: {
    color: C.white,
    fontSize: 29,
    fontWeight: "900",
    marginTop: 5,
  },
  priceSummaryMeta: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  priceSummaryVat: { color: "#D7E0F1", fontSize: 10, fontWeight: "800", marginTop: 7 },
  plantCalculator: { marginTop: 14, padding: 17, borderRadius: 24, backgroundColor: C.white, borderWidth: 1, borderColor: "#DFE4EA" },
  plantCalculatorTitle: { color: C.navy, fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 7 },
  plantCalculatorIntro: { color: "#748096", fontSize: 11, lineHeight: 15, marginTop: 6 },
  plantSelector: { flexDirection: "row", backgroundColor: "#EEF1F5", borderRadius: 15, padding: 4, marginTop: 15, gap: 4 },
  plantSelectorButton: { flex: 1, height: 43, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  plantSelectorButtonActive: { backgroundColor: C.navy },
  plantSelectorText: { color: C.navy, fontSize: 10, fontWeight: "900" },
  plantSelectorTextActive: { color: C.white },
  pricePickerList: { marginTop: 14, gap: 7 },
  pricePickerRow: { width: "100%", maxWidth: "100%", minHeight: 62, borderRadius: 15, borderWidth: 1, borderColor: "#E1E5EA", backgroundColor: "#FAFBFC", padding: 10, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  pricePickerRowActive: { borderColor: "rgba(231,64,34,.55)", backgroundColor: "#FFF8F2" },
  priceCheck: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: "#F5B98E", backgroundColor: "#FFF1E7", alignItems: "center", justifyContent: "center" },
  priceCheckActive: { backgroundColor: C.orange, borderColor: C.orange },
  pricePickerCopy: { flex: 1, minWidth: 0, marginLeft: 10, paddingRight: 6 },
  pricePickerName: { color: C.navy, fontSize: 10, fontWeight: "900" },
  pricePickerUnit: { color: "#7D899C", fontSize: 11, marginTop: 4 },
  tonnageInputWrap: { width: 86, maxWidth: "32%", height: 40, borderRadius: 11, backgroundColor: C.white, borderWidth: 1, borderColor: "#D8DEE7", flexDirection: "row", alignItems: "center", paddingHorizontal: 9, overflow: "hidden" },
  tonnageInput: { width: 1, minWidth: 0, flex: 1, color: C.navy, fontSize: 13, fontWeight: "900", textAlign: "right", paddingHorizontal: 0, paddingVertical: 0, outlineStyle: "none" } as any,
  tonnageUnit: { color: "#7C8799", fontSize: 11, fontWeight: "800", marginLeft: 4 },
  transportRow: { width: "100%", maxWidth: "100%", marginTop: 13, borderRadius: 15, padding: 12, backgroundColor: "#F1F4F7", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, overflow: "hidden" },
  transportHint: { color: "#8490A2", fontSize: 11, marginTop: 3 },
  truckInputWrap: { width: 94, maxWidth: "36%", height: 40, borderRadius: 11, backgroundColor: C.white, flexDirection: "row", alignItems: "center", paddingHorizontal: 9, overflow: "hidden" },
  truckInput: { width: 1, minWidth: 0, flex: 1, color: C.navy, fontSize: 13, fontWeight: "900", textAlign: "right", paddingHorizontal: 0, paddingVertical: 0, outlineStyle: "none" } as any,
  priceResultCard: { marginTop: 14, borderRadius: 19, padding: 16 },
  priceResultTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceResultLabel: { color: "#9DABC3", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  priceResultValue: { color: C.white, fontSize: 24, fontWeight: "900", marginTop: 4 },
  truckResult: { minWidth: 82, height: 54, borderRadius: 14, backgroundColor: "rgba(255,255,255,.09)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  truckResultValue: { color: C.white, fontSize: 19, fontWeight: "900" },
  truckResultLabel: { color: "#9DABC3", fontSize: 10, fontWeight: "900" },
  priceResultDivider: { height: 1, backgroundColor: "rgba(255,255,255,.13)", marginVertical: 13 },
  priceResultLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceResultLineLabel: { color: "#AAB5C8", fontSize: 8 },
  priceResultLineValue: { color: C.white, fontSize: 11, fontWeight: "800" },
  priceResultTotal: { marginTop: 5, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.13)" },
  priceResultTotalLabel: { color: C.orange, fontSize: 10, fontWeight: "900", letterSpacing: .6 },
  priceResultTotalValue: { color: C.white, fontSize: 22, fontWeight: "900", marginTop: 5 },
  priceQuoteButton: { height: 52, marginTop: 12, borderRadius: 16, backgroundColor: C.orange, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  priceQuoteButtonText: { color: C.white, fontSize: 11, fontWeight: "900" },
  priceProductCard: { borderRadius: 21, backgroundColor: C.white, borderWidth: 1, borderColor: "#DFE4EA", padding: 15, marginTop: 10 },
  priceProductTop: { flexDirection: "row", alignItems: "center" },
  priceProductIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFF2E8", alignItems: "center", justifyContent: "center" },
  priceProductCopy: { flex: 1, marginLeft: 11 },
  priceProductName: { color: C.navy, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  priceProductMeta: { color: "#7A8597", fontSize: 10, lineHeight: 11, marginTop: 3 },
  priceLocations: { flexDirection: "row", alignItems: "flex-end", gap: 22, backgroundColor: "#F4F6F8", borderRadius: 15, padding: 12, marginTop: 13 },
  priceLocationLabel: { color: "#7C8799", fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  priceLocationValue: { color: C.navy, fontSize: 17, fontWeight: "900", marginTop: 3 },
  priceUnit: { color: C.orange, fontSize: 10, fontWeight: "900", marginLeft: "auto", marginBottom: 3 },
  priceActions: { flexDirection: "row", gap: 8, marginTop: 11 },
  pricePrimaryAction: { flex: 1, height: 42, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  pricePrimaryActionText: { color: C.white, fontSize: 11, fontWeight: "900" },
  priceWhatsappAction: { flex: 1, height: 42, borderRadius: 14, borderWidth: 1, borderColor: "#CFE8DA", backgroundColor: "#F2FBF6", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  priceWhatsappActionText: { color: "#178A50", fontSize: 11, fontWeight: "900" },
  priceTableHead: {
    height: 45,
    marginTop: 20,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: "#D8DCE4",
    flexDirection: "row",
    alignItems: "center",
  },
  priceProductHead: {
    width: "48%",
    color: C.navy,
    fontSize: 11,
    fontWeight: "900",
  },
  priceCityHead: {
    width: "26%",
    color: C.navy,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
  },
  priceRow: {
    minHeight: 57,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D8DCE3",
    flexDirection: "row",
    alignItems: "center",
  },
  priceName: {
    width: "48%",
    color: C.navy,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  priceValue: {
    width: "26%",
    color: C.ink,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
  },
  priceNote: {
    marginTop: 16,
    borderRadius: 17,
    backgroundColor: C.white,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  priceNoteText: { flex: 1, color: C.muted, fontSize: 11, lineHeight: 15 },
  privateDocs: { marginTop: 30 },
  privateDocsTitle: {
    color: C.navy,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 7,
    marginBottom: 13,
  },
  privateDocRow: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: C.white,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  privateDocText: { flex: 1, color: C.navy, fontSize: 11, fontWeight: "800" },
  mobileAdminPanel: { marginTop:14, padding:16, backgroundColor:C.white, borderWidth:1, borderColor:"#DDE3EB", borderRadius:18 },
  mobileAdminHead: { flexDirection:"row", alignItems:"center" },
  mobileAdminBadge: { width:38, height:38, borderRadius:12, backgroundColor:C.orange, alignItems:"center", justifyContent:"center" },
  mobileAdminHeadCopy: { flex:1, marginLeft:11 },
  mobileAdminKicker: { color:C.orange, fontSize: 11, fontWeight:"900", letterSpacing:1.4 },
  mobileAdminTitle: { color:C.navy, fontSize:17, fontWeight:"900", marginTop:3 },
  mobileAdminIntro: { color:"#66748A", fontSize:10, lineHeight:16, marginTop:12 },
  mobileAdminSuccess: { flexDirection:"row", alignItems:"center", gap:7, padding:10, marginTop:12, backgroundColor:"#EAF8F1", borderRadius:10 },
  mobileAdminSuccessText: { flex:1, color:"#137349", fontSize: 11, fontWeight:"800" },
  mobileAdminUpload: { minHeight:66, marginTop:14, paddingHorizontal:12, flexDirection:"row", alignItems:"center", backgroundColor:"#F6F8FB", borderWidth:1, borderColor:"#E1E6ED", borderRadius:13 },
  mobileAdminUploadCopy: { flex:1, marginHorizontal:10 },
  mobileAdminUploadTitle: { color:C.navy, fontSize:12, fontWeight:"900" },
  mobileAdminUploadMeta: { color:"#7B8799", fontSize: 11, marginTop:4 },
  mobileAdminDivider: { height:1, backgroundColor:"#E5E9EF", marginVertical:16 },
  mobileAdminFieldLabel: { color:C.navy, fontSize: 11, fontWeight:"900", letterSpacing:1.4, marginBottom:8 },
  mobileAdminInput: { minHeight:46, borderWidth:1, borderColor:"#DDE3EB", borderRadius:11, backgroundColor:"#F9FAFC", color:C.navy, fontSize:11, paddingHorizontal:12, marginBottom:9 },
  mobileAdminMessage: { minHeight:92, textAlignVertical:"top", paddingTop:12 },
  mobileAdminSend: { height:48, borderRadius:12, backgroundColor:C.orange, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  mobileAdminSendText: { color:C.white, fontSize:12, fontWeight:"900" },
  bottomNavWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "transparent",
    zIndex: 30,
  },
  keyboardDoneBar: { minHeight:48, backgroundColor:"#F4F5F7", borderTopWidth:1, borderTopColor:"#D9DDE4", alignItems:"flex-end", justifyContent:"center", paddingHorizontal:14 },
  keyboardDoneButton: { minHeight:38, paddingHorizontal:12, flexDirection:"row", alignItems:"center", gap:7 },
  keyboardDoneText: { color:C.navy, fontSize:13, fontWeight:"900" },
  bottomNav: {
    flex: 1,
    paddingHorizontal: 7,
    paddingTop: 10,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: C.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderColor: "#E2E6EC",
    shadowOpacity:0,
    shadowRadius:0,
    shadowOffset:{width:0,height:0},
    elevation:0,
  },
  bottomNavItem: {
    flex: 1,
    height: 54,
    marginHorizontal: 2,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  bottomNavItemActive: { backgroundColor: "transparent" },
  bottomNavLabel: { color: C.muted, fontSize:10,lineHeight:12,fontFamily: D.fonts.bold },
  bottomNavLabelActive: { color: C.navy, fontWeight: "900" },
  hamburgerIcon: { width:29, height:29, alignItems:"center", justifyContent:"center" },
  hamburgerSwapLayer:{position:"absolute",width:29,height:29,alignItems:"center",justifyContent:"center"},
  bottomNavCenterSlot: {
    flex: 1,
    height: 54,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 0,
  },
  bottomNavNotch: {
    position:"absolute",
    top:-37,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth:1,
    borderColor:"#DCE2EA",
  },
  bottomArHalo:{position:"absolute",top:-41,width:78,height:78,borderRadius:39,backgroundColor:"rgba(255,255,255,.24)",borderWidth:1,borderColor:"rgba(15,34,70,.16)",overflow:"hidden"},
  bottomAr: {
    position: "absolute",
    top: -34,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0,
    shadowColor:"#07142D",
    shadowOpacity:.22,
    shadowRadius:10,
    shadowOffset:{width:0,height:5},
    elevation:6,
  },
  bottomArActive:{backgroundColor:"#F4F6F9",borderColor:C.orange},
  bottomArContent: { alignItems:"center", justifyContent:"center" },
  bottomArNavLabel: { position:"absolute", top:37, width:78, textAlign:"center", fontSize:10, lineHeight:12, fontFamily:D.fonts.bold },
  bottomArAnimation:{width:52,height:52},
  nativeScanSummary: { marginTop:12, minHeight:66, paddingHorizontal:14, paddingVertical:12, borderRadius:16, borderWidth:1, borderColor:"rgba(66,217,149,.32)", backgroundColor:"rgba(66,217,149,.09)", flexDirection:"row", alignItems:"center", gap:11 },
  nativeScanIcon: { width:42, height:42, borderRadius:21, backgroundColor:"rgba(66,217,149,.13)", alignItems:"center", justifyContent:"center" },
  nativeScanTitle: { color:C.white, fontSize:12, fontFamily:VODAFONE_BOLD },
  nativeScanMeta: { color:"#A9B8CE", fontSize: 11, lineHeight:13, fontFamily:VODAFONE, marginTop:3 },
  bottomArLabel: { color:"#FFFFFF", fontSize:8, lineHeight:9, fontFamily:VODAFONE_BOLD, letterSpacing:1, marginTop:-4 },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,.58)",
    zIndex: 40,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "92%",
    maxWidth: 440,
    backgroundColor: "#F6F7FA",
    zIndex: 50,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  drawerHidden: {
    display: "none",
  },
  drawerHeader: {
    minHeight: 118,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.navy,
    zIndex: 2,
  },
  drawerBrand: { flex:1, minWidth:0 },
  drawerLogo: { width: 166, height: 44 },
  drawerBrandTitle:{ color:C.white, fontSize:22, lineHeight:24, fontFamily:VODAFONE_BOLD, letterSpacing:-.7 },
  drawerBrandTitleAccent:{ color:C.orange },
  drawerBrandMeta: { color:"rgba(255,255,255,.58)", fontSize:9, fontFamily:VODAFONE_BOLD, letterSpacing:1.55, marginTop:2 },
  drawerHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  drawerHeaderAction: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,.10)", borderWidth:1, borderColor:"rgba(255,255,255,.14)", alignItems: "center", justifyContent: "center", position: "relative" },
  drawerLanguageAction:{backgroundColor:"rgba(231,64,34,.18)",borderColor:"rgba(255,194,163,.52)"},
  drawerLanguageHalo:{position:"absolute",width:52,height:52,borderRadius:26,borderWidth:1,borderColor:"rgba(231,64,34,.72)"},
  drawerLanguageHaloInner:{position:"absolute",width:46,height:46,borderRadius:23,borderWidth:1,borderColor:"rgba(255,255,255,.22)"},
  drawerNotificationDot: { position: "absolute", right: 8, top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange },
  drawerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerVersionRow: { marginHorizontal:20, marginTop:18, paddingTop:17, paddingBottom:8, borderTopWidth:1, borderTopColor:"#DCE2EA", flexDirection:"row", alignItems:"center" },
  drawerSocialBlock: { marginHorizontal:20, marginTop:18 },
  drawerSocialLabel: { color:"#8A94A7", fontSize: 10, fontFamily:VODAFONE_BOLD, letterSpacing:1.25, marginBottom:10 },
  drawerSocialRow: { flexDirection:"row", alignItems:"center", gap:10 },
  drawerSocialButton: { width:40, height:40, borderRadius:20, backgroundColor:"#E8EDF3", alignItems:"center", justifyContent:"center" },
  drawerCopyright: { marginHorizontal:20, marginTop:17, color:"#8A94A7", fontSize: 10, fontFamily:VODAFONE, letterSpacing:.45 },
  drawerCopyrightBrand: { color:C.navy, fontFamily:VODAFONE_BOLD },
  drawerDesignCredit: { marginHorizontal:20, marginTop:9, color:"#9AA3B2", fontSize:8, fontFamily:VODAFONE, letterSpacing:1.2 },
  drawerDesignCreditName: { color:C.orange, fontFamily:VODAFONE_BOLD, letterSpacing:.4 },
  drawerDesignCreditRow:{marginHorizontal:20,marginTop:10,flexDirection:"row",alignItems:"center",gap:7},
  drawerDesignLogo:{width:104,height:24},
  drawerVersionIcon: { width:34, height:34, borderRadius:17, backgroundColor:"#E8EDF3", alignItems:"center", justifyContent:"center" },
  drawerVersionCopy: { flex:1, marginLeft:11 },
  drawerVersionLabel: { color:"#8A94A7", fontSize: 10, fontFamily:VODAFONE_BOLD, letterSpacing:1.25 },
  drawerVersionValue: { color:C.navy, fontSize:10, fontFamily:VODAFONE_BOLD, marginTop:3 },
  drawerVersionStatus: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#E7F6EE", paddingHorizontal:9, height:25, borderRadius:13 },
  drawerVersionDot: { width:6, height:6, borderRadius:3, backgroundColor:"#15955F" },
  drawerVersionStatusText: { color:"#15784F", fontSize: 10, fontFamily:VODAFONE_BOLD },
  drawerScroll: { paddingTop: 20, paddingBottom: 34 },
  drawerAccountRow: { minHeight: 76, marginHorizontal:20, marginBottom:14, paddingBottom:14, borderBottomWidth:1, borderBottomColor:"#DCE2EA", flexDirection:"row", alignItems:"center", gap:12 },
  drawerAccountAvatar: { width:46, height:46, borderRadius:23, backgroundColor:"#FFF0E5", alignItems:"center", justifyContent:"center", overflow:"hidden", borderWidth:1, borderColor:"#FFD9C0" },
  drawerAccountCopy: { flex:1, minWidth:0 },
  drawerAccountNameRow:{flexDirection:"row",alignItems:"center",gap:5},
  drawerAccountName: { color:C.navy, fontSize:16, fontFamily:VODAFONE_BOLD },
  drawerAccountEmail: { color:"#718097", fontSize:11, fontFamily:VODAFONE, marginTop:3 },
  drawerListGroup: { marginHorizontal:20, marginBottom:14 },
  drawerListRow: { minHeight:56, flexDirection:"row", alignItems:"center", gap:12, borderBottomWidth:1, borderBottomColor:"#DCE2EA" },
  drawerListIcon: { width:38, height:38, borderRadius:19, backgroundColor:"#FFF1E7", alignItems:"center", justifyContent:"center" },
  drawerListCopy: { flex:1, minWidth:0 },
  drawerListText: { flex:1, color:C.navy, fontSize:16, fontFamily:VODAFONE_BOLD },
  drawerListMeta: { color:"#718097", fontSize:11, fontFamily:VODAFONE, marginTop:2 },
  drawerNavKicker: {
    marginTop: 8,
    marginBottom: 9,
    marginHorizontal: 20,
    color: "#66738A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.55,
  },
  drawerWelcome: {
    margin: 14,
    padding: 18,
    paddingVertical: 18,
    backgroundColor: "#FFF0E4",
    borderRadius: 22,
  },
  drawerProfileRow: { flexDirection: "row", alignItems: "center" },
  drawerProfileCopy: { flex: 1, marginLeft: 13 },
  drawerAvatar: { width: 53, height: 53, borderRadius: 27, backgroundColor: C.navy, borderWidth: 2, borderColor: "rgba(255,255,255,.55)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  drawerAvatarImage: { width: "100%", height: "100%" },
  drawerAvatarText: { color: C.white, fontSize: 15, fontWeight: "900" },
  drawerChangePill: { height: 34, borderRadius: 17, backgroundColor: "#FFF7F0", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  drawerChangeText: { color: C.orange, fontSize: 10, fontWeight: "900" },
  drawerKicker: {
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  drawerWelcomeTitle: {
    color: C.navy,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 7,
  },
  drawerWelcomeText: {
    color: "#68758A",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 285,
  },
  drawerMainRow: {
    minHeight: 64,
    marginHorizontal: 16,
    marginBottom: 9,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#E0E6EE",
  },
  drawerBrandIcon: { width: 24, height: 26 },
  drawerMainText: { flex: 1, color: C.navy, fontSize: 17, fontFamily: VODAFONE_BOLD, letterSpacing: .05 },
  drawerMainGrid:{ flexDirection:"row", gap:10, marginHorizontal:16, marginBottom:12 },
  drawerTopRow:{ flex:1, minHeight:88, borderRadius:21, backgroundColor:C.white, borderWidth:1, borderColor:"#E0E5ED", padding:12, alignItems:"flex-start", justifyContent:"space-between", shadowColor:C.navy, shadowOpacity:.06, shadowRadius:12, shadowOffset:{width:0,height:5} },
  drawerTopIcon:{ width:36, height:36, borderRadius:13, backgroundColor:"#FFF0E5", alignItems:"center", justifyContent:"center" },
  drawerTopTitleRow:{flexDirection:"row",alignItems:"center",gap:7},
  drawerTopText:{ color:C.navy, fontSize:16, fontFamily:VODAFONE_BOLD, letterSpacing:-.1 },
  drawerPortalRow: {
    minHeight: 76,
    margin: 12,
    padding: 13,
    borderRadius: 18,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  drawerPortalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerPortalTitle: { color: C.white, fontSize: 14, fontWeight: "900" },
  drawerPortalMeta: {
    color: "rgba(255,255,255,.72)",
    fontSize: 12,
    marginTop: 4,
  },
  drawerQuickGrid:{flexDirection:"row",gap:10,marginHorizontal:16,marginBottom:11},
  drawerQuickCard:{flex:1,minWidth:0,height:112,padding:13,borderRadius:22,overflow:"hidden",alignItems:"flex-start",justifyContent:"space-between"},
  drawerQuickInnerGlow:{...StyleSheet.absoluteFillObject,borderRadius:20,borderWidth:2,borderColor:"rgba(255,255,255,.72)",margin:3},
  drawerQuickTitleRow:{flexDirection:"row",alignItems:"center",gap:6},
  drawerQuoteRow: { backgroundColor: C.orange },
  drawerQuoteAnimated: { position:"relative" },
  drawerQuotePulseBorder: { position:"absolute", left:12, right:12, top:-4, bottom:6, borderRadius:25, borderWidth:2, borderColor:"#FFC99E" },
  drawerWhatsappRow: { backgroundColor:"#20B963" },
  drawerWhatsappIcon: { width:36, height:36, borderRadius:13, backgroundColor:"rgba(255,255,255,.16)", alignItems:"center", justifyContent:"center" },
  drawerWhatsappPulseBorder: { position:"absolute", left:12, right:12, top:-4, bottom:6, borderRadius:25, borderWidth:2, borderColor:"#65E6A1" },
  drawerQuoteIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: "rgba(255,255,255,.16)", alignItems: "center", justifyContent: "center" },
  drawerQuoteTitle: { color: C.white, fontSize: 15, fontFamily: VODAFONE_BOLD },
  drawerQuoteMeta: { color: "rgba(255,255,255,.88)", fontSize: 11, lineHeight:14, fontFamily: VODAFONE },
  drawerSection: { marginHorizontal:20, marginBottom:10, borderBottomWidth:1, borderBottomColor:"#DCE2EA" },
  drawerCorporateRow: { minHeight: 62, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 11, borderTopWidth: 1, borderTopColor: "#ECEFF3" },
  drawerCorporateIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "rgba(255,126,31,.10)", alignItems: "center", justifyContent: "center" },
  drawerSectionHead: {
    minHeight: 68,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 0,
  },
  drawerSectionIcon: { width: 24, height: 24 },
  drawerSectionCopy:{flex:1},
  drawerSectionTitle: { color: C.navy, fontSize: 17, fontFamily: VODAFONE_BOLD, letterSpacing: 0, textTransform: "none" },
  drawerSectionMeta:{color:"#718097",fontSize:10,lineHeight:14,fontFamily:VODAFONE,marginTop:2},
  drawerSubRow: {
    minHeight: 58,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ECEFF3",
  },
  drawerSubNo: {
    width: 28,
    color: C.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  drawerSubCopy: { flex: 1 },
  drawerSubText: { color: C.navy, fontSize: 16, fontFamily: VODAFONE_BOLD },
  drawerSubMeta: { color: "#67758C", fontSize: 13, lineHeight:17, fontFamily: VODAFONE, marginTop: 4 },
  drawerToolRow: {
    height: 50,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.orange,
  },
  drawerToolText: { color: C.white, fontSize: 12, fontWeight: "900" },
  drawerBottomSpace: { height: 24 },
  tabs: {
    height: 78,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: "#E8E9ED",
    flexDirection: "row",
    paddingHorizontal: 6,
  },
  trustHeader: { marginTop: 30, paddingHorizontal:20, width:"100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap:12 },
  showcaseCount: { color: C.orange, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  trustIntro: { color: "#697489", fontSize: 10, lineHeight: 16, paddingHorizontal: 20, marginTop: 10 },
  showcaseRail: { paddingTop: 15, paddingHorizontal:20, paddingBottom: 8 },
  showcaseCard: { width: 148, height: 100, paddingHorizontal: 18, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  unifiedHeader: { position:"absolute", left:0, right:0, zIndex:80, paddingHorizontal:20, flexDirection:"row", alignItems:"center", backgroundColor:"transparent" },
  unifiedHeaderFixed: { justifyContent:"space-between", backgroundColor:"rgba(27,46,82,.98)", borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,.10)" },
  unifiedHeaderLogo: { position:"absolute", left:"50%", marginLeft:-86, width:172, height:46, top:"50%", marginTop:-23 },
  unifiedHeaderActions: { marginLeft:"auto", flexDirection:"row", alignItems:"center", gap:10, transform:[{translateY:-4}] },
  unifiedHeaderAction: { width:44, height:44, borderRadius:22, alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,255,255,.10)", position:"relative" },
  unifiedHeaderMenuAction: { backgroundColor:C.orange },
  unifiedHeaderNotificationDot: { position:"absolute", top:7, right:7, width:6, height:6, borderRadius:3, backgroundColor:C.orange, borderWidth:1, borderColor:C.navy },
  unifiedHeaderBackOnly:{backgroundColor:"rgba(7,20,45,.68)",borderWidth:1,borderColor:"rgba(255,255,255,.22)"},
  unifiedHeaderLightGlass:{backgroundColor:"rgba(244,243,239,.9)",borderBottomWidth:1,borderBottomColor:"rgba(15,34,70,.08)"},
  unifiedHeaderDarkGlass:{backgroundColor:"rgba(7,20,45,.92)",borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.1)"},
  unifiedHeaderButton: { width:44, height:44, borderRadius:22,alignItems:"center", justifyContent:"center" },
  collectionHeaderMark:{width:44,height:44,borderRadius:16,backgroundColor:C.orange,alignItems:"center",justifyContent:"center"},
  collectionHeaderCount:{width:44,height:44,borderRadius:22,backgroundColor:"rgba(255,255,255,.14)",borderWidth:1,borderColor:"rgba(255,255,255,.22)",alignItems:"center",justifyContent:"center",marginRight:4},
  collectionHeaderCountText:{fontSize:13,fontFamily:D.fonts.bold,color:C.white},
  unifiedHeaderCopy: { flex:1, minWidth:0, paddingHorizontal:12 },
  unifiedHeaderMode:{height:32,borderRadius:16,paddingHorizontal:9,backgroundColor:"rgba(255,255,255,.13)",borderWidth:1,borderColor:"rgba(255,255,255,.2)",flexDirection:"row",alignItems:"center",gap:4},
  unifiedHeaderModeLight:{backgroundColor:C.white,borderColor:"#E1E4E8"},
  unifiedHeaderModeDot:{width:6,height:6,borderRadius:3,backgroundColor:"#25B982"},
  unifiedHeaderModeText:{fontSize:8,fontFamily:D.fonts.bold,color:C.white,letterSpacing:.5},
  unifiedHeaderKicker: { color:C.orange, fontSize:10, lineHeight:12, letterSpacing:1.7, fontFamily:VODAFONE_BOLD, textShadowColor:"rgba(0,0,0,.55)", textShadowRadius:5, textShadowOffset:{width:0,height:1} },
  unifiedHeaderTitle: { color:C.white, fontSize:19,lineHeight:22,fontFamily:VODAFONE_BOLD,marginTop:2,textShadowColor:"rgba(0,0,0,.65)",textShadowRadius:6,textShadowOffset:{width:0,height:1} },
  showcaseLogo: { width: "100%", height: "100%" },
  showcaseName: { color: "#69758A", fontSize: 11, fontWeight: "800", textAlign: "center" },
  marketplaceSection: { marginHorizontal: 18, marginTop: 26, padding: 20, borderRadius: 28, backgroundColor: "#111C34" },
  marketplaceKicker: { color: C.orange, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  marketplaceTitle: { color: C.white, fontSize: 28, lineHeight: 32, fontWeight: "900", letterSpacing: -.8, marginTop: 7 },
  marketplaceIntro: { color: "#AEB9CD", fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  marketplaceGrid: { gap: 10 },
  marketplaceCard: { minHeight: 78, borderRadius: 19, backgroundColor: C.white, flexDirection: "row", alignItems: "center", padding: 12 },
  marketplaceLogoWrap: { width: 76, height: 48, borderRadius: 14, backgroundColor: "#F5F6F8", alignItems: "center", justifyContent: "center" },
  marketplaceLogo: { width: 62, height: 30 },
  marketplaceCopy: { flex: 1, paddingHorizontal: 12 },
  marketplaceName: { color: C.navy, fontSize: 15, fontWeight: "900" },
  marketplaceMeta: { color: "#7D8798", fontSize: 10, marginTop: 3 },
  marketplaceArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  togoReferencesSection: { marginTop: 32, paddingLeft: 18 },
  togoReferenceRail: { gap: 10, paddingTop: 16, paddingRight: 18, paddingBottom: 6 },
  togoReferenceCard: { width: 145, height: 105, borderRadius: 21, backgroundColor: C.white, borderWidth: 1, borderColor: "rgba(255,255,255,.08)", padding: 13, justifyContent: "space-between" },
  togoReferenceLogo: { width: "100%", height: 58 },
  togoReferenceName: { color: "#667188", fontSize: 11, fontWeight: "800", textAlign: "center" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIcon: {
    width: 34,
    height: 31,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: { backgroundColor: C.orange },
  tabIconBrandActive: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.orange,
  },
  brandMenuIcon: { width: 24, height: 24 },
  homeMenuIcon: { width: 22, height: 25 },
  tabText: { fontSize: 11, color: "#8C94A3", fontWeight: "700", marginTop: 4 },
  tabTextActive: { color: C.navy, fontWeight: "900" },
});
