import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export default function PacdoraViewer({
  url = "https://www.pacdora.com/de/share?filter_url=ps5ubjiic1",
  title = "TEK ASFALT 3D ürün modeli",
  onInteractionChange,
}: {
  url?: string;
  title?: string;
  onInteractionChange?: (active: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);
  const revealModel = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    // Pacdora sayfası yüklendikten sonra model motoru birkaç saniye daha kendi
    // Almanca yükleme başlığını gösterebiliyor. Bu süre boyunca marka katmanımız
    // görünür kalır ve model hazır olduğunda tek seferde kaldırılır.
    revealTimer.current = setTimeout(() => setLoading(false), 3200);
  };
  return (
    <View
      style={styles.frame}
      onTouchStart={() => onInteractionChange?.(true)}
      onTouchEnd={() => onInteractionChange?.(false)}
      onTouchCancel={() => onInteractionChange?.(false)}
    >
      <WebView
        key={reloadKey}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        injectedJavaScriptBeforeContentLoaded={`
          window.open = function(url) { window.location.href = url; };
          document.documentElement.style.overscrollBehavior = 'none';
          document.body.style.overscrollBehavior = 'none';
          true;
        `}
        onLoadStart={() => { setLoading(true); setFailed(false); onInteractionChange?.(false); }}
        onLoadEnd={revealModel}
        onError={() => { if (revealTimer.current) clearTimeout(revealTimer.current); setLoading(false); setFailed(true); }}
        onHttpError={() => { if (revealTimer.current) clearTimeout(revealTimer.current); setLoading(false); setFailed(true); }}
      />
      {failed && <View style={styles.error}>
        <Text style={styles.errorTitle}>3D model açılamadı</Text>
        <Text style={styles.errorText}>Bağlantıyı kontrol edip modeli yeniden deneyin.</Text>
        <Pressable onPress={() => { setFailed(false); setLoading(true); setReloadKey((value) => value + 1); }} style={styles.retry}><Text style={styles.retryText}>Yeniden dene</Text></Pressable>
      </View>}
      {loading && <View pointerEvents="none" style={styles.loading}>
        <Image source={require("../../assets/icon-a-white.png")} resizeMode="contain" style={styles.loadingMark}/>
        <Text style={styles.loadingMeta}>{title.replace(" 3D ürün modeli","")} · 3D model yükleniyor…</Text>
        <ActivityIndicator color="#E74022" size="small" style={styles.spinner}/>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame:{flex:1,backgroundColor:"#FFFFFF",overflow:"hidden"},
  webview:{flex:1,backgroundColor:"#FFFFFF"},
  loading:{...StyleSheet.absoluteFillObject,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",padding:24},
  loadingMark:{width:58,height:58,marginBottom:12},
  loadingMeta:{color:"#68758A",fontSize:13,lineHeight:18,textAlign:"center"},
  spinner:{marginTop:18},
  error:{...StyleSheet.absoluteFillObject,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",padding:30},
  errorTitle:{color:"#1B2E53",fontSize:17,fontWeight:"700"},
  errorText:{color:"#68758A",fontSize:13,textAlign:"center",lineHeight:18,marginTop:7},
  retry:{height:42,paddingHorizontal:17,borderRadius:21,backgroundColor:"#E74022",justifyContent:"center",marginTop:18},
  retryText:{color:"#FFFFFF",fontSize:13,fontWeight:"700"},
});
