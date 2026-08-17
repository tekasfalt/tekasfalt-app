import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import TekArScanner, { TekArScanResult } from "tek-ar-scanner";
import {
  calculateAsphaltRequirement,
  calculateManualAsphaltRequirement,
} from "../features/asphalt-calculator/domain/calculateAsphaltRequirement";
import { plants, Product, products, Project } from "./data";
import { colors, radius, shadow, spacing, type } from "./theme";

type RootTab = "home" | "discover" | "ar" | "quotes" | "account";
type Route =
  | { name: RootTab }
  | { name: "menu" }
  | { name: "info"; page: InfoPageKey }
  | { name: "accountDetail"; page: AccountPageKey }
  | { name: "product"; product: Product }
  | { name: "plant"; plant: (typeof plants)[number] };

type InfoPageKey = "about" | "production" | "application" | "contact" | "privacy";
type AccountPageKey = "company" | "notifications" | "security" | "help";

const accountPages: Record<AccountPageKey, { title: string; lead: string; rows: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] }> = {
  company: {
    title: "Firma bilgilerim",
    lead: "Teklif ve proje taleplerinizde kullanılacak kurumsal bilgileri yönetin.",
    rows: [
      { icon: "business-outline", title: "Firma", body: "Firma adı teklif formunda girildiğinde bu alanda saklanır." },
      { icon: "person-outline", title: "Yetkili kişi", body: "Proje sürecinde iletişim kurulacak yetkili bilgisi." },
      { icon: "location-outline", title: "Proje adresleri", body: "Kayıtlı şantiye ve teslimat adreslerinizi yönetin." },
    ],
  },
  notifications: {
    title: "Bildirim tercihleri",
    lead: "Yalnızca sizin seçtiğiniz proje güncellemelerini alın.",
    rows: [
      { icon: "document-text-outline", title: "Teklif güncellemeleri", body: "Talebiniz alındığında ve teklif hazırlandığında bildirim." },
      { icon: "trail-sign-outline", title: "Sevkiyat bilgileri", body: "Planlanan üretim ve sevkiyat zamanı hakkında bildirim." },
      { icon: "megaphone-outline", title: "Kurumsal duyurular", body: "Yeni ürün ve tesis bilgilendirmeleri." },
    ],
  },
  security: {
    title: "Gizlilik ve güvenlik",
    lead: "Verileriniz yalnızca teklif, üretim ve müşteri desteği süreçleri için kullanılır.",
    rows: [
      { icon: "lock-closed-outline", title: "Cihaz içi AR analizi", body: "Kamera derinlik analizi cihaz üzerinde gerçekleştirilir." },
      { icon: "shield-checkmark-outline", title: "Güvenli iletişim", body: "İletişim bilgileriniz yetkisiz üçüncü kişilerle paylaşılmaz." },
      { icon: "trash-outline", title: "Veri talebi", body: "Bilgi veya silme talebinizi uygulama içindeki iletişim formundan iletebilirsiniz." },
    ],
  },
  help: {
    title: "Yardım merkezi",
    lead: "Teklif, hesaplama ve uygulama özellikleri için hızlı yardım.",
    rows: [
      { icon: "calculator-outline", title: "Tonaj nasıl hesaplanır?", body: "Uzunluk, genişlik ve serim kalınlığını girin; sonuç 2,40 t/m³ yoğunlukla hesaplanır." },
      { icon: "scan-outline", title: "AR ölçüm nasıl çalışır?", body: "Güvenlik onayından sonra alanı tarayın veya ölçüleri manuel girin." },
      { icon: "document-text-outline", title: "Nasıl teklif isterim?", body: "Teklif sayfasında proje adresi, ürün, metraj ve iletişim bilgilerini doldurun." },
    ],
  },
};

const infoPages: Record<InfoPageKey, {
  eyebrow: string;
  title: string;
  lead: string;
  sections: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[];
}> = {
  about: {
    eyebrow: "1996'DAN BERİ",
    title: "Yolun her katmanında güven.",
    lead: "Tek Asfalt, 30 yılı aşkın deneyimiyle üretimden uygulamaya kadar asfalt projelerinin tamamında hizmet verir.",
    sections: [
      { icon: "shield-checkmark-outline", title: "30+ yıllık deneyim", body: "İstanbul'un farklı ölçeklerdeki yol, saha ve altyapı projelerinde biriken güçlü saha tecrübesi." },
      { icon: "people-outline", title: "Uzman ekip", body: "Planlama, laboratuvar, üretim, lojistik ve serim ekipleri tek operasyon çatısı altında çalışır." },
      { icon: "analytics-outline", title: "Kontrollü kalite", body: "Hammadde seçiminden saha teslimine kadar her aşama teknik kontrollerle takip edilir." },
    ],
  },
  production: {
    eyebrow: "ASFALT ÜRETİMİ",
    title: "Yüksek kapasite, kesintisiz kalite.",
    lead: "Sultangazi ve Silivri tesislerimizde farklı proje ihtiyaçlarına uygun asfalt karışımları üretiyoruz.",
    sections: [
      { icon: "business-outline", title: "İki modern tesis", body: "İstanbul'un Avrupa yakasında güçlü üretim ve lojistik ağı." },
      { icon: "speedometer-outline", title: "Yüksek kapasite", body: "Yoğun proje programlarında sürdürülebilir ve planlı üretim." },
      { icon: "flask-outline", title: "Laboratuvar kontrolü", body: "Karışım reçeteleri ve üretim kalitesi düzenli testlerle doğrulanır." },
    ],
  },
  application: {
    eyebrow: "ASFALT UYGULAMA",
    title: "Sahada kusursuz uygulama disiplini.",
    lead: "Zemin hazırlığından sıkıştırmaya kadar tüm uygulama adımlarını uzman ekip ve güçlü makine parkıyla yönetiyoruz.",
    sections: [
      { icon: "construct-outline", title: "Zemin hazırlığı", body: "Kot, eğim, drenaj ve taşıma kapasitesi uygulama öncesinde değerlendirilir." },
      { icon: "trail-sign-outline", title: "Serim ve sıkıştırma", body: "Uygun sıcaklık, tabaka kalınlığı ve sıkıştırma değerleri sahada takip edilir." },
      { icon: "checkmark-done-outline", title: "Teslim kontrolü", body: "İş sonunda yüzey, birleşim ve saha detayları kontrol edilerek teslim edilir." },
    ],
  },
  contact: {
    eyebrow: "İLETİŞİM",
    title: "Projenizi birlikte planlayalım.",
    lead: "Teklif, teknik danışmanlık, üretim ve sevkiyat planlaması için satış ekibimize ulaşın.",
    sections: [
      { icon: "location-outline", title: "Merkez Ofis", body: "Tekstilkent Koza Plaza, B Blok Hat 28 No: 105, Esenler / İstanbul" },
      { icon: "business-outline", title: "Sultangazi Tesisi", body: "Cebeci Mahallesi, 2806. Sokak No: 30, Sultangazi / İstanbul" },
      { icon: "location-outline", title: "Silivri Tesisi", body: "Kadıköy Mahallesi, Asfaf Sokak No: 30-32, Silivri / İstanbul" },
      { icon: "call-outline", title: "Telefon", body: "+90 212 619 20 12" },
      { icon: "mail-outline", title: "E-posta", body: "info@tekasfalt.com" },
    ],
  },
  privacy: {
    eyebrow: "GİZLİLİK",
    title: "Verileriniz güvende.",
    lead: "Bilgileriniz yalnızca teklif, sipariş, sevkiyat ve müşteri desteği süreçlerini yürütmek için kullanılır.",
    sections: [
      { icon: "lock-closed-outline", title: "Cihaz içi ölçüm", body: "AR derinlik analizi cihazınızda yapılır; açık izniniz olmadan kamera görüntüsü gönderilmez." },
      { icon: "eye-off-outline", title: "Sınırlı kullanım", body: "İletişim bilgileriniz yetkisiz üçüncü kişilerle paylaşılmaz." },
      { icon: "trash-outline", title: "Veri talebi", body: "Bilgi veya silme talepleriniz için İletişim bölümünden bize ulaşabilirsiniz." },
    ],
  },
};

const screenWidth = Dimensions.get("window").width;
const contentWidth = Math.min(screenWidth, 760);

function getTimeBasedGreeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return "Günaydın";
  if (hour >= 12 && hour < 18) return "İyi günler";
  if (hour >= 18 && hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

function Icon({
  name,
  size = 24,
  color = colors.ink,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

function LoopVideo({ source, style }: { source: any; style?: any }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  useEffect(() => {
    player.loop = true;
    player.muted = true;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") player.play();
    });
    const timer = setTimeout(() => player.play(), 150);
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [player]);
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} pointerEvents="none" />;
}

function AppHeader({
  title,
  onBack,
  onAccount,
  onMenu,
  dark = false,
}: {
  title?: string;
  onBack?: () => void;
  onAccount?: () => void;
  onMenu?: () => void;
  dark?: boolean;
}) {
  const foreground = dark ? colors.surface : colors.ink;
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onBack} style={styles.headerCircle}>
          <Icon name="arrow-back" color={foreground} />
        </Pressable>
      ) : (
        <Image source={require("../../assets/logo.png")} resizeMode="contain" style={styles.headerLogo} />
      )}
      {title ? <Text style={[styles.headerTitle, { color: foreground }]}>{title}</Text> : <View style={styles.headerSpacer} />}
      {onMenu ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Menü" onPress={onMenu} style={styles.headerCircle}>
          <Icon name="menu" color={foreground} />
        </Pressable>
      ) : onAccount ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Profil" onPress={onAccount} style={styles.headerCircle}>
          <Icon name="person-outline" color={foreground} />
        </Pressable>
      ) : (
        <View style={styles.headerCirclePlaceholder} />
      )}
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} style={styles.textAction}>
          <Text style={styles.textActionLabel}>{action}</Text>
          <Icon name="arrow-forward" size={18} color={colors.inkSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}><Icon name={icon} size={22} color={colors.orange} /></View>
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

function HomeScreen({ navigate }: { navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.homeHero, { paddingTop: insets.top + 8 }]}>
        <LoopVideo source={require("../../assets/home-asphalt-mobile.mp4")} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(5,17,42,.18)", "rgba(5,17,42,.28)", colors.inkDeep]} style={StyleSheet.absoluteFill} />
        <AppHeader onMenu={() => navigate({ name: "menu" })} dark />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>TEK ASFALT · 1996'DAN BERİ</Text>
          <Text style={styles.heroTitle}>Yolun geleceğini birlikte inşa ediyoruz.</Text>
          <Text style={styles.heroBody}>Üretimden uygulamaya, projeniz için tek ve güvenilir çözüm.</Text>
          <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Projenizi başlatın</Text>
            <Icon name="arrow-forward" color={colors.surface} />
          </Pressable>
        </View>
      </View>

      <View style={styles.marketPanel}>
        <Metric icon="water-outline" label="BİTÜM 50/70" value="25.311 ₺" />
        <Metric icon="partly-sunny-outline" label="İSTANBUL" value="24°" />
        <Metric icon="swap-horizontal-outline" label="DÖVİZ" value="€ 53,88" />
      </View>

      <View style={styles.content}>
        <View style={styles.greeting}>
          <Text style={styles.greetingSmall}>PROJENİZ İÇİN</Text>
          <Text style={styles.greetingName}>Bugün ne yapmak istersiniz?</Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction icon="scan-outline" color={colors.orange} title="AR ile ölç" body="Çukuru tarayın, ihtiyacı görün" onPress={() => navigate({ name: "ar" })} />
          <QuickAction icon="document-text-outline" color="#2F63A7" title="Teklif iste" body="Proje bilgilerinizi iletin" onPress={() => navigate({ name: "quotes" })} />
          <QuickAction icon="cube-outline" color="#16886C" title="Ürün seç" body="Doğru karışımı keşfedin" onPress={() => navigate({ name: "discover" })} />
          <QuickAction icon="business-outline" color={colors.ink} title="Tesisler" body="Kapasite ve üretim bilgisi" onPress={() => navigate({ name: "discover" })} />
        </View>

        <View style={styles.arFeature}>
          <LinearGradient colors={[colors.inkDeep, colors.inkSoft]} style={StyleSheet.absoluteFill} />
          <View style={styles.arFeatureIcon}><Icon name="scan-outline" size={30} color={colors.surface} /></View>
          <View style={styles.arFeatureCopy}>
            <Text style={styles.arFeatureEyebrow}>YENİ · AKILLI ÖLÇÜM</Text>
            <Text style={styles.arFeatureTitle}>Çukuru tarayın. Kova ihtiyacını saniyeler içinde öğrenin.</Text>
          </View>
          <Pressable onPress={() => navigate({ name: "ar" })} style={styles.roundAction}>
            <Icon name="arrow-forward" color={colors.surface} />
          </Pressable>
        </View>

        <SectionTitle eyebrow="SEÇİLMİŞ ÇÖZÜMLER" title="Projenize uygun ürünler." action="Tümünü gör" onAction={() => navigate({ name: "discover" })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {products.slice(0, 4).map((product) => (
            <CompactProduct key={product.id} product={product} onPress={() => navigate({ name: "product", product })} />
          ))}
        </ScrollView>

        <SectionTitle eyebrow="FAALİYETLERİMİZ" title="Üretimden uygulamaya tam hizmet." />
        <Pressable onPress={() => navigate({ name: "info", page: "application" })} style={styles.projectBanner}>
          <LoopVideo source={require("../../assets/corporate/activities-mobile.mp4")} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["transparent", "rgba(5,17,42,.9)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.projectBannerCopy}>
            <Text style={styles.projectBannerMeta}>PLANLAMA · ÜRETİM · SERİM</Text>
            <Text style={styles.projectBannerTitle}>Asfalt uygulama hizmetleri</Text>
            <Text style={styles.projectBannerBody}>Zemin hazırlığı, nakliye, finişerle serim ve sıkıştırma süreçleri tek ekip tarafından yönetilir.</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  color,
  title,
  body,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}><Icon name={icon} color={color} /></View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickBody}>{body}</Text>
      <Icon name="arrow-forward" size={20} />
    </Pressable>
  );
}

function CompactProduct({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.compactProduct}>
      {product.video ? <LoopVideo source={product.video} style={StyleSheet.absoluteFill} /> : <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      <LinearGradient colors={["rgba(5,17,42,.02)", "rgba(5,17,42,.94)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.compactProductTag}><Text style={styles.compactProductTagText}>{product.category}</Text></View>
      <View style={styles.compactProductCopy}>
        <Text style={styles.compactProductTitle}>{product.title}</Text>
        <Text style={styles.compactProductBody} numberOfLines={2}>{product.summary}</Text>
      </View>
    </Pressable>
  );
}

function DiscoverScreen({ navigate }: { navigate: (route: Route) => void }) {
  const [segment, setSegment] = useState<"products" | "plants">("products");
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.discoverHero, { paddingTop: insets.top + 8 }]}>
        <AppHeader title="Keşfet" onMenu={() => navigate({ name: "menu" })} dark />
        <View style={styles.discoverHeroCopy}>
          <Text style={styles.heroEyebrow}>TEK ASFALT DÜNYASI</Text>
          <Text style={styles.discoverTitle}>İhtiyacınız olan her şey tek yerde.</Text>
        </View>
        <View style={styles.segment}>
          {([
            ["products", "Ürünler"],
            ["plants", "Tesisler"],
          ] as const).map(([value, label]) => (
            <Pressable key={value} onPress={() => setSegment(value)} style={[styles.segmentButton, segment === value && styles.segmentButtonActive]}>
              <Text style={[styles.segmentText, segment === value && styles.segmentTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {segment === "products" ? (
          <>
            <SectionTitle eyebrow="ÜRÜN KATALOĞU" title="Her saha için doğru karışım." />
            <View style={styles.catalogList}>
              {products.map((product, index) => (
                <ProductRow key={product.id} index={index + 1} product={product} onPress={() => navigate({ name: "product", product })} />
              ))}
            </View>
          </>
        ) : null}
        {segment === "plants" ? (
          <>
            <SectionTitle eyebrow="ÜRETİM AĞI" title="İstanbul'a yakın, yüksek kapasite." />
            {plants.map((plant) => (
              <Pressable key={plant.id} onPress={() => navigate({ name: "plant", plant })} style={styles.plantCard}>
                <ImageBackground source={plant.image} style={styles.plantImage} imageStyle={styles.plantImageRadius}>
                  <LinearGradient colors={["transparent", "rgba(5,17,42,.92)"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.plantCopy}>
                    <Text style={styles.plantTitle}>{plant.title}</Text>
                    <Text style={styles.plantCapacity}>{plant.capacity} nominal kapasite</Text>
                  </View>
                  <View style={styles.plantArrow}><Icon name="arrow-forward" color={colors.surface} /></View>
                </ImageBackground>
              </Pressable>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ProductRow({ product, index, onPress }: { product: Product; index: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.productRow}>
      <View style={styles.productRowMedia}>
        {product.video ? <LoopVideo source={product.video} style={StyleSheet.absoluteFill} /> : <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <Text style={styles.productIndex}>{String(index).padStart(2, "0")}</Text>
      </View>
      <View style={styles.productRowCopy}>
        <Text style={styles.productRowCategory}>{product.category.toUpperCase()}</Text>
        <Text style={styles.productRowTitle}>{product.title}</Text>
        <Text style={styles.productRowBody} numberOfLines={2}>{product.summary}</Text>
      </View>
      <View style={styles.productRowArrow}><Icon name="arrow-forward" size={20} color={colors.surface} /></View>
    </Pressable>
  );
}

function ProjectListCard({ project }: { project: Project }) {
  return (
    <View style={styles.projectListCard}>
      <LoopVideo source={project.image} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["transparent", "rgba(5,17,42,.92)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.projectListCopy}>
        <Text style={styles.projectListMeta}>{project.category} · {project.location}</Text>
        <Text style={styles.projectListTitle}>{project.title}</Text>
        <Text style={styles.projectListMetric}>{project.metric}</Text>
      </View>
    </View>
  );
}

function ProductDetail({ product, goBack, navigate }: { product: Product; goBack: () => void; navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.detailHero, { paddingTop: insets.top + 8 }]}>
        {product.video ? <LoopVideo source={product.video} style={StyleSheet.absoluteFill} /> : <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <LinearGradient colors={["rgba(5,17,42,.18)", "rgba(5,17,42,.88)"]} style={StyleSheet.absoluteFill} />
        <AppHeader onBack={goBack} dark />
        <View style={styles.detailHeroCopy}>
          <Text style={styles.heroEyebrow}>{product.category.toUpperCase()}</Text>
          <Text style={styles.detailTitle}>{product.title}</Text>
          <Text style={styles.detailBody}>{product.summary}</Text>
        </View>
      </View>
      <View style={styles.detailSheet}>
        <Text style={styles.detailSectionTitle}>Neden tercih edilir?</Text>
        <View style={styles.tagWrap}>
          {product.tags.map((tag) => <View key={tag} style={styles.tag}><Icon name="checkmark" size={17} color={colors.green} /><Text style={styles.tagText}>{tag}</Text></View>)}
        </View>
        <View style={styles.detailInfoGrid}>
          <InfoCard icon="shield-checkmark-outline" title="Kontrollü kalite" body="Üretim ve uygulama süreçleri teknik ekip tarafından takip edilir." />
          <InfoCard icon="construct-outline" title="Projeye özel" body="Kullanım alanı ve saha koşullarına göre doğru çözüm belirlenir." />
        </View>
        {product.id === "ready" ? (
          <Pressable onPress={() => navigate({ name: "ar" })} style={styles.arProductCta}>
            <View style={styles.arProductIcon}><Icon name="scan-outline" color={colors.surface} /></View>
            <View style={styles.arProductCopy}><Text style={styles.arProductTitle}>AR ile kova ihtiyacını ölçün</Text><Text style={styles.arProductBody}>Çukuru tarayın, yaklaşık hacmi ve 25 kg kova sayısını hesaplayın.</Text></View>
            <Icon name="arrow-forward" color={colors.surface} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Bu ürün için teklif iste</Text><Icon name="arrow-forward" color={colors.surface} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}><Icon name={icon} color={colors.orange} /></View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </View>
  );
}

function ARScreen({ navigate }: { navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const [result, setResult] = useState<TekArScanResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [depthCm, setDepthCm] = useState("");
  const toNumber = (value: string) => Number(value.replace(",", ".")) || 0;
  const manualResult = useMemo(() => {
    const length = toNumber(lengthCm);
    const width = toNumber(widthCm);
    const depth = toNumber(depthCm);
    return length > 0 && width > 0 && depth > 0
      ? calculateManualAsphaltRequirement({
          lengthCentimeters: length,
          widthCentimeters: width,
          averageDepthCentimeters: depth,
        })
      : null;
  }, [lengthCm, widthCm, depthCm]);
  const calculatedResult = useMemo(
    () => result
      ? calculateAsphaltRequirement({
          surfaceAreaSquareMeters: result.surfaceAreaSquareMeters,
          volumeCubicMeters: result.volumeCubicMeters,
        })
      : null,
    [result],
  );
  const scan = async () => {
    if (!safetyAccepted) {
      setError("Ölçüme başlamadan önce güvenlik uyarısını onaylayın.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const value = await TekArScanner.scanPothole();
      setResult(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ölçüm başlatılamadı.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.arPage} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.arHeader, { paddingTop: insets.top + 8 }]}>
        <AppHeader title="Akıllı Ölçüm" onMenu={() => navigate({ name: "menu" })} dark />
        <View style={styles.arHeaderCopy}>
          <Text style={styles.heroEyebrow}>ASFALT TO GO · AKILLI KEŞİF</Text>
          <Text style={styles.arTitle}>Çukuru ölçün, doğru miktarı planlayın.</Text>
          <Text style={styles.arLead}>Desteklenen cihazlarda derinlik verisiyle; diğer cihazlarda yönlendirmeli veya manuel ölçümle yaklaşık ihtiyacı hesaplayın.</Text>
        </View>
      </View>
      <View style={styles.arContent}>
        <View style={styles.measureModeSwitch}>
          <Pressable onPress={() => setMode("camera")} style={[styles.measureMode, mode === "camera" && styles.measureModeActive]}>
            <Icon name="scan-outline" color={mode === "camera" ? colors.surface : colors.inkSoft} size={21} />
            <Text style={[styles.measureModeText, mode === "camera" && styles.measureModeTextActive]}>KAMERA İLE ÖLÇ</Text>
          </Pressable>
          <Pressable onPress={() => setMode("manual")} style={[styles.measureMode, mode === "manual" && styles.measureModeActive]}>
            <Icon name="calculator-outline" color={mode === "manual" ? colors.surface : colors.inkSoft} size={21} />
            <Text style={[styles.measureModeText, mode === "manual" && styles.measureModeTextActive]}>MANUEL HESAP</Text>
          </Pressable>
        </View>
        {mode === "camera" ? (
          <>
            <Pressable onPress={() => setSafetyAccepted((value) => !value)} style={[styles.safetyCard, safetyAccepted && styles.safetyCardActive]}>
              <View style={[styles.safetyCheck, safetyAccepted && styles.safetyCheckActive]}>
                <Icon name={safetyAccepted ? "checkmark" : "shield-checkmark-outline"} size={20} color={safetyAccepted ? colors.surface : colors.orange} />
              </View>
              <View style={styles.safetyCopy}>
                <Text style={styles.safetyTitle}>Önce güvenli alanı doğrulayın</Text>
                <Text style={styles.safetyBody}>Aktif trafikten uzak durduğunuzu ve çevrenizi kontrol ettiğinizi onaylayın.</Text>
              </View>
            </Pressable>
            <View style={styles.arScannerCard}>
              <LinearGradient colors={[colors.inkSoft, colors.inkDeep]} style={StyleSheet.absoluteFill} />
              <View style={styles.scanCorners}>
                <View style={[styles.scanCorner, styles.scanCornerTL]} /><View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} /><View style={[styles.scanCorner, styles.scanCornerBR]} />
              </View>
              <View style={styles.scanCenter}><Icon name="scan-outline" size={54} color={colors.surface} /></View>
              <Text style={styles.scanTitle}>Sağlam asfalt kenarlarını kadraja alın</Text>
              <Text style={styles.scanBody}>Yavaşça hareket edin. Sistem yol düzlemini, çukur sınırını ve derinlik örneklerini birlikte değerlendirir.</Text>
              <Pressable onPress={scan} disabled={loading || !safetyAccepted} style={[styles.scanButton, (!safetyAccepted || loading) && styles.scanButtonDisabled]}>
                <Icon name="camera-outline" color={colors.ink} />
                <Text style={styles.scanButtonText}>{loading ? "Ölçüm hazırlanıyor…" : "Kamera ölçümünü başlat"}</Text>
              </Pressable>
            </View>
            <View style={styles.arSteps}>
              <ARStep number="01" title="Kalibre edin" body="Cihazı yavaşça hareket ettirerek yol yüzeyini tanıtın." />
              <ARStep number="02" title="Sınırı belirleyin" body="Çukuru ve sağlam asfalt çevresini birlikte tarayın." />
              <ARStep number="03" title="Kaliteyi doğrulayın" body="Konturu, derinliği ve güven puanını inceleyin." />
            </View>
          </>
        ) : (
          <View style={styles.manualCard}>
            <Text style={styles.eyebrow}>MANUEL HESAP</Text>
            <Text style={styles.manualTitle}>Ölçüleri santimetre olarak girin.</Text>
            <Text style={styles.manualLead}>Kamera ölçümünün uygun olmadığı cihazlarda aynı hesap motoruyla hızlı tahmin alın.</Text>
            <View style={styles.manualInputs}>
              <MeasureInput label="Uzunluk" value={lengthCm} onChangeText={setLengthCm} />
              <MeasureInput label="Genişlik" value={widthCm} onChangeText={setWidthCm} />
              <MeasureInput label="Ort. derinlik" value={depthCm} onChangeText={setDepthCm} />
            </View>
            {manualResult ? (
              <View style={styles.manualResult}>
                <Text style={styles.resultBuckets}>{manualResult.buckets}</Text>
                <Text style={styles.resultUnit}>ADET 25 KG KOVA</Text>
                <View style={styles.resultMetrics}>
                  <ResultMetric label="Hacim" value={`${manualResult.volumeCubicMeters.toFixed(3)} m³`} />
                  <ResultMetric label="Malzeme" value={`${Math.round(manualResult.kilograms)} kg`} />
                </View>
                <ResultActions navigate={navigate} />
              </View>
            ) : <View style={styles.manualHint}><Icon name="information-circle-outline" color={colors.orange} /><Text style={styles.manualHintText}>Sonucu görmek için üç ölçüyü de girin.</Text></View>}
          </View>
        )}
        {error ? <View style={styles.errorBox}><Icon name="alert-circle-outline" color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}
        {result && calculatedResult && mode === "camera" ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeadingRow}>
              <Text style={styles.eyebrow}>ÖLÇÜM SONUCU</Text>
              <View style={[styles.qualityBadge, result.qualityScore < 0.65 && styles.qualityBadgeWarning]}>
                <Text style={styles.qualityBadgeText}>Kalite %{Math.round(result.qualityScore * 100)}</Text>
              </View>
            </View>
            <Text style={styles.resultBuckets}>{calculatedResult.buckets}</Text>
            <Text style={styles.resultUnit}>ADET 25 KG KOVA</Text>
            <View style={styles.resultMetrics}>
              <ResultMetric label="Hacim" value={`${result.volumeCubicMeters.toFixed(3)} m³`} />
              <ResultMetric label="Malzeme" value={`${Math.round(calculatedResult.kilograms)} kg`} />
            </View>
            <View style={styles.resultDetails}>
              <ResultDetail label="Alan" value={`${result.surfaceAreaSquareMeters.toFixed(2)} m²`} />
              <ResultDetail label="Ort. derinlik" value={`${(result.averageDepthMeters * 100).toFixed(1)} cm`} />
              <ResultDetail label="Teknoloji" value={technologyLabel(result.technology)} />
              <ResultDetail label="Geçerli nokta" value={String(result.validDepthPointCount)} />
            </View>
            <Text style={styles.resultDisclaimer}>Sonuç yaklaşık malzeme planlaması içindir. Saha koşulları ve sıkıştırma oranı gerçek ihtiyacı değiştirebilir.</Text>
            {result.qualityScore < 0.65 ? <Pressable onPress={scan} style={styles.rescanButton}><Icon name="refresh" color={colors.orange} /><Text style={styles.rescanButtonText}>Daha güvenli sonuç için yeniden tara</Text></Pressable> : null}
            <ResultActions navigate={navigate} />
          </View>
        ) : null}
        <View style={styles.localPrivacy}><Icon name="lock-closed-outline" color={colors.inkSoft} /><Text style={styles.localPrivacyText}>Derinlik analizi cihazınızda yapılır. Açık izniniz olmadan kamera görüntüsü sunucuya gönderilmez.</Text></View>
      </View>
    </ScrollView>
  );
}

function technologyLabel(value: TekArScanResult["technology"]) {
  if (value === "ios-lidar") return "iOS LiDAR";
  if (value === "android-depth") return "Android Depth";
  if (value === "manual-ar") return "Yönlendirmeli AR";
  return "Manuel";
}

function MeasureInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.measureInput}>
      <Text style={styles.measureInputLabel}>{label}</Text>
      <View style={styles.measureInputRow}>
        <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.faint} style={styles.measureInputField} />
        <Text style={styles.measureInputUnit}>cm</Text>
      </View>
    </View>
  );
}

function ResultDetail({ label, value }: { label: string; value: string }) {
  return <View style={styles.resultDetail}><Text style={styles.resultDetailLabel}>{label}</Text><Text style={styles.resultDetailValue}>{value}</Text></View>;
}

function ResultActions({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <View style={styles.resultActions}>
      <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Bu ölçümle teklif iste</Text><Icon name="arrow-forward" color={colors.surface} /></Pressable>
      <View style={styles.resultActionGrid}>
        <Pressable onPress={() => navigate({ name: "info", page: "contact" })} style={styles.secondaryAction}><Icon name="call-outline" color={colors.green} /><Text style={styles.secondaryActionText}>İletişim</Text></Pressable>
        <Pressable onPress={() => navigate({ name: "discover" })} style={styles.secondaryAction}><Icon name="cube-outline" color={colors.orange} /><Text style={styles.secondaryActionText}>Ürünler</Text></Pressable>
      </View>
    </View>
  );
}

function ARStep({ number, title, body }: { number: string; title: string; body: string }) {
  return <View style={styles.arStep}><Text style={styles.arStepNumber}>{number}</Text><View><Text style={styles.arStepTitle}>{title}</Text><Text style={styles.arStepBody}>{body}</Text></View></View>;
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.resultMetric}><Text style={styles.resultMetricLabel}>{label}</Text><Text style={styles.resultMetricValue}>{value}</Text></View>;
}

function QuoteScreen({ navigate }: { navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const submit = () => {
    if (!name.trim() || !phone.trim() || !note.trim()) {
      setMessage("Yetkili adı, telefon ve proje detayı zorunludur.");
      return;
    }
    setMessage("Talebiniz kaydedildi. Ekibimiz sizinle iletişime geçecektir.");
  };
  return (
    <ScrollView style={styles.quotePage} contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.quoteHeader, { paddingTop: insets.top + 8 }]}>
        <AppHeader title="Teklif" onMenu={() => navigate({ name: "menu" })} dark />
        <View style={styles.quoteHeaderCopy}>
          <Text style={styles.heroEyebrow}>PROJE TALEBİ</Text>
          <Text style={styles.quoteTitle}>Tek talep, tam kapsam.</Text>
          <Text style={styles.quoteLead}>Proje ve iletişim bilgilerinizi girin; talebinizi uygulama içinde oluşturun.</Text>
        </View>
      </View>
      <View style={styles.quoteSheet}>
        <Text style={styles.inputLabel}>İLETİŞİM BİLGİLERİ</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Yetkili adı *" placeholderTextColor={colors.faint} style={styles.formInput} />
        <TextInput value={company} onChangeText={setCompany} placeholder="Firma adı" placeholderTextColor={colors.faint} style={styles.formInput} />
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Telefon *" placeholderTextColor={colors.faint} style={styles.formInput} />
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="E-posta" placeholderTextColor={colors.faint} style={styles.formInput} />
        <Text style={styles.inputLabel}>PROJE DETAYI</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Saha adresi, metraj, asfalt türü ve ihtiyacınızı anlatın."
          placeholderTextColor={colors.faint}
          style={styles.textArea}
        />
        <Pressable onPress={submit} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Teklif talebini kaydet</Text><Icon name="arrow-forward" color={colors.surface} /></Pressable>
        {message ? <View style={styles.autoFillNotice}><Icon name={message.startsWith("Talebiniz") ? "checkmark-circle" : "alert-circle"} color={message.startsWith("Talebiniz") ? colors.green : colors.danger} /><Text style={styles.autoFillText}>{message}</Text></View> : null}
        <Text style={styles.privacyText}>Bilgileriniz yalnızca teklif hazırlama ve sizinle iletişim kurma amacıyla kullanılır.</Text>
      </View>
    </ScrollView>
  );
}

function AccountScreen({ navigate }: { navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 150 }}>
      <View style={[styles.accountHero, { paddingTop: insets.top + 8 }]}>
        <LinearGradient colors={["rgba(16,37,82,.72)", colors.inkDeep]} style={StyleSheet.absoluteFill} />
        <AppHeader title="Müşteri Merkezi" onMenu={() => navigate({ name: "menu" })} dark />
        <View style={styles.accountIdentity}>
          <Image source={require("../../assets/menulogo-full.png")} resizeMode="contain" style={styles.accountBrandImage} />
          <Text style={styles.accountName}>Projelerinizi tek yerden yönetin.</Text>
          <Text style={styles.accountEmail}>Teklif, ölçüm, tesis ve destek bilgilerine uygulama içinden güvenle ulaşın.</Text>
        </View>
      </View>
      <View style={styles.content}>
        <SectionTitle eyebrow="HESAP" title="Profil ve tercihler" />
        <View style={styles.settingsCard}>
          <SettingRow icon="business-outline" title="Firma bilgilerim" onPress={() => navigate({ name: "accountDetail", page: "company" })} />
          <SettingRow icon="notifications-outline" title="Bildirim tercihlerim" onPress={() => navigate({ name: "accountDetail", page: "notifications" })} />
          <SettingRow icon="shield-checkmark-outline" title="Gizlilik ve güvenlik" onPress={() => navigate({ name: "accountDetail", page: "security" })} />
          <SettingRow icon="help-circle-outline" title="Yardım merkezi" onPress={() => navigate({ name: "accountDetail", page: "help" })} />
        </View>
        <SectionTitle eyebrow="DESTEK" title="Biz buradayız." />
        <Pressable onPress={() => navigate({ name: "info", page: "contact" })} style={styles.whatsappCard}>
          <Icon name="call-outline" size={32} color={colors.surface} />
          <View style={styles.whatsappCopy}><Text style={styles.whatsappTitle}>İletişim merkezi</Text><Text style={styles.whatsappBody}>Telefon, e-posta ve tesis adreslerini görüntüleyin.</Text></View>
          <Icon name="arrow-forward" color={colors.surface} />
        </Pressable>
        <Text style={styles.versionText}>© 2026 TEK ASFALT · Tüm Hakları Saklıdır{`\n`}Konsept & Tasarım Cihat Dönmez · Sürüm 2.0</Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.settingRow}><View style={styles.settingIcon}><Icon name={icon} /></View><Text style={styles.settingTitle}>{title}</Text><Icon name="chevron-forward" color={colors.faint} /></Pressable>;
}

function AccountDetailScreen({ page, goBack }: { page: AccountPageKey; goBack: () => void }) {
  const insets = useSafeAreaInsets();
  const content = accountPages[page];
  return <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 70 }}>
    <View style={[styles.accountDetailHero, { paddingTop: insets.top + 8 }]}>
      <AppHeader title={content.title} onBack={goBack} dark />
      <Text style={styles.accountDetailLead}>{content.lead}</Text>
    </View>
    <View style={styles.infoContent}>{content.rows.map((row) => <View key={row.title} style={styles.infoSection}>
      <View style={styles.infoSectionIcon}><Icon name={row.icon} color={colors.orange} /></View>
      <View style={styles.infoSectionCopy}><Text style={styles.infoSectionTitle}>{row.title}</Text><Text style={styles.infoSectionBody}>{row.body}</Text></View>
    </View>)}</View>
  </ScrollView>;
}

function PlantScreen({ plant, goBack, navigate }: { plant: (typeof plants)[number]; goBack: () => void; navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  const media = plant.id === "sultangazi"
    ? require("../../assets/corporate/production-esenler-hero.mp4")
    : plant.id === "silivri"
      ? require("../../assets/corporate/production-silivri-mobile.mp4")
      : require("../../assets/corporate/production-plentmiks-mobile.mp4");
  const specs: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    { icon: "speedometer-outline", value: plant.capacity, label: "Nominal üretim" },
    { icon: "flame-outline", value: "Modern", label: "Brülör sistemi" },
    { icon: "leaf-outline", value: "Etkili", label: "Filtre sistemi" },
    { icon: "flask-outline", value: "Sürekli", label: "Kalite kontrolü" },
  ];
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 150 }}>
      <View style={[styles.plantHero, { paddingTop: insets.top + 8 }]}>
        <LoopVideo source={media} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(5,17,42,.08)", "rgba(5,17,42,.46)", colors.inkDeep]} locations={[0, .48, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.plantTop}>
          <Pressable accessibilityLabel="Geri" onPress={goBack} style={styles.headerCircle}><Icon name="arrow-back" color={colors.surface} /></Pressable>
          <View style={styles.plantTabs}>{plants.map((item) => (
            <Pressable key={item.id} onPress={() => navigate({ name: "plant", plant: item })} style={[styles.plantTab, item.id === plant.id && styles.plantTabActive]}>
              <Text style={[styles.plantTabText, item.id === plant.id && styles.plantTabTextActive]}>{item.id === "plentmiks" ? "Plentmiks" : item.title}</Text>
            </Pressable>
          ))}</View>
        </View>
        <View style={styles.plantHeroCopy}>
          <Text style={styles.heroEyebrow}>ÜRETİM TESİSLERİ</Text>
          <Text style={styles.detailTitle}>{plant.title} üretim tesisi.</Text>
          <Text style={styles.detailBody}>Yüksek üretim gücü, kontrollü kalite ve İstanbul'a yakın lojistik avantajı.</Text>
          <View style={styles.plantCapacityRow}>
            <Text style={styles.plantHeroCapacity}>{plant.capacity.split(" ")[0]}</Text>
            <View><Text style={styles.plantCapacityUnit}>TON / SAAT</Text><Text style={styles.plantCapacityMeta}>NOMİNAL ÜRETİM PERFORMANSI</Text></View>
          </View>
        </View>
      </View>
      <View style={styles.detailSheet}>
        <SectionTitle eyebrow="TESİS TEKNİK ÖZETİ" title="Kesintisiz üretim, güçlü operasyon." />
        <View style={styles.plantSpecGrid}>{specs.map((spec) => <View key={spec.label} style={styles.plantSpec}>
          <Icon name={spec.icon} size={34} color={colors.inkSoft} /><Text style={styles.plantSpecValue}>{spec.value}</Text><Text style={styles.plantSpecLabel}>{spec.label}</Text>
        </View>)}</View>
      </View>
    </ScrollView>
  );
}

function MenuScreen({ navigate, goBack }: { navigate: (route: Route) => void; goBack: () => void }) {
  const insets = useSafeAreaInsets();
  const menuItems: { title: string; meta: string; icon: keyof typeof Ionicons.glyphMap; route: Route }[] = [
    { title: "Hakkımızda", meta: "30 yılı aşkın deneyim", icon: "information-circle-outline", route: { name: "info", page: "about" } },
    { title: "Asfalt Üretimi", meta: "Tesisler ve kalite sistemi", icon: "business-outline", route: { name: "info", page: "production" } },
    { title: "Asfalt Uygulama", meta: "Saha ve serim hizmetleri", icon: "construct-outline", route: { name: "info", page: "application" } },
    { title: "Ürünler", meta: "Karışımlar ve çözümler", icon: "cube-outline", route: { name: "discover" } },
    { title: "Tesisler", meta: "Sultangazi ve Silivri", icon: "map-outline", route: { name: "discover" } },
    { title: "İletişim", meta: "Satış ve teknik destek", icon: "call-outline", route: { name: "info", page: "contact" } },
    { title: "Gizlilik", meta: "Veri ve kamera güvenliği", icon: "shield-checkmark-outline", route: { name: "info", page: "privacy" } },
  ];
  return (
    <ScrollView style={styles.menuPage} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={[styles.menuHeader, { paddingTop: insets.top + 8 }]}>
        <AppHeader title="Menü" onBack={goBack} dark />
        <View style={styles.menuHeaderCopy}>
          <Text style={styles.heroEyebrow}>TEK ASFALT</Text>
          <Text style={styles.menuTitle}>İhtiyacınız olan her şey.</Text>
        </View>
      </View>
      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <Pressable key={item.title} onPress={() => navigate(item.route)} style={styles.menuRow}>
            <View style={styles.menuRowIcon}><Icon name={item.icon} color={colors.orange} /></View>
            <View style={styles.menuRowCopy}>
              <Text style={styles.menuRowTitle}>{item.title}</Text>
              <Text style={styles.menuRowMeta}>{item.meta}</Text>
            </View>
            <Icon name="chevron-forward" color={colors.faint} />
          </Pressable>
        ))}
        <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.menuQuote}>
          <View><Text style={styles.menuQuoteEyebrow}>PROJENİZ HAZIR MI?</Text><Text style={styles.menuQuoteTitle}>Hemen teklif isteyin.</Text></View>
          <Icon name="arrow-forward" color={colors.surface} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoScreen({ page, goBack, navigate }: { page: InfoPageKey; goBack: () => void; navigate: (route: Route) => void }) {
  const insets = useSafeAreaInsets();
  const content = infoPages[page];
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 70 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.infoHero, { paddingTop: insets.top + 8 }]}>
        <LinearGradient colors={[colors.inkSoft, colors.inkDeep]} style={StyleSheet.absoluteFill} />
        <AppHeader onBack={goBack} dark />
        <View style={styles.infoHeroCopy}>
          <Text style={styles.heroEyebrow}>{content.eyebrow}</Text>
          <Text style={styles.infoHeroTitle}>{content.title}</Text>
          <Text style={styles.infoHeroLead}>{content.lead}</Text>
        </View>
      </View>
      <View style={styles.infoContent}>
        {content.sections.map((section) => (
          <View key={section.title} style={styles.infoSection}>
            <View style={styles.infoSectionIcon}><Icon name={section.icon} color={colors.orange} /></View>
            <View style={styles.infoSectionCopy}>
              <Text style={styles.infoSectionTitle}>{section.title}</Text>
              <Text style={styles.infoSectionBody}>{section.body}</Text>
            </View>
          </View>
        ))}
        {page === "contact" ? (
          <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.whatsappCard}>
            <Icon name="document-text-outline" size={30} color={colors.surface} />
            <View style={styles.whatsappCopy}><Text style={styles.whatsappTitle}>Teklif talebi oluşturun</Text><Text style={styles.whatsappBody}>Proje bilgilerinizi uygulama içinde iletin.</Text></View>
            <Icon name="arrow-forward" color={colors.surface} />
          </Pressable>
        ) : (
          <Pressable onPress={() => navigate({ name: "quotes" })} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Projeniz için teklif isteyin</Text><Icon name="arrow-forward" color={colors.surface} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function BottomNav({ active, onSelect }: { active: RootTab; onSelect: (tab: RootTab) => void }) {
  const insets = useSafeAreaInsets();
  const items: { tab: RootTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { tab: "home", label: "Ana Sayfa", icon: "home-outline" },
    { tab: "discover", label: "Keşfet", icon: "compass-outline" },
    { tab: "ar", label: "AR Ölç", icon: "scan-outline" },
    { tab: "quotes", label: "Teklif", icon: "document-text-outline" },
    { tab: "account", label: "Hesap", icon: "person-outline" },
  ];
  return (
    <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={Platform.OS === "ios" ? 84 : 100} tint="light" style={StyleSheet.absoluteFill} />
      {items.map((item) => {
        const selected = active === item.tab;
        const central = item.tab === "ar";
        return (
          <Pressable key={item.tab} onPress={() => onSelect(item.tab)} style={[styles.navItem, central && styles.navItemCentral]}>
            <View style={[styles.navIcon, selected && styles.navIconActive, central && styles.navIconAR]}>
              <Icon name={selected ? (item.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : item.icon} size={central ? 27 : 24} color={central ? colors.surface : selected ? colors.orange : colors.muted} />
            </View>
            <Text style={[styles.navLabel, selected && styles.navLabelActive, central && styles.navLabelAR]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PremiumAppContent() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const history = useRef<Route[]>([]);
  const navigate = (next: Route) => {
    if (next.name === "home" || next.name === "discover" || next.name === "ar" || next.name === "quotes" || next.name === "account") history.current = [];
    else history.current.push(route);
    setRoute(next);
  };
  const goBack = () => setRoute(history.current.pop() ?? { name: "home" });
  const rootTab: RootTab =
    route.name === "product" || route.name === "plant" ? "discover"
      : route.name === "menu" || route.name === "info" ? "home"
        : route.name === "accountDetail" ? "account"
        : route.name;
  return (
    <View style={styles.app}>
      <StatusBar style={route.name === "home" || route.name === "ar" || route.name === "quotes" ? "light" : "dark"} />
      <View style={styles.desktopFrame}>
        {route.name === "home" ? <HomeScreen navigate={navigate} /> : null}
        {route.name === "discover" ? <DiscoverScreen navigate={navigate} /> : null}
        {route.name === "product" ? <ProductDetail product={route.product} goBack={goBack} navigate={navigate} /> : null}
        {route.name === "ar" ? <ARScreen navigate={navigate} /> : null}
        {route.name === "quotes" ? <QuoteScreen navigate={navigate} /> : null}
        {route.name === "account" ? <AccountScreen navigate={navigate} /> : null}
        {route.name === "accountDetail" ? <AccountDetailScreen page={route.page} goBack={goBack} /> : null}
        {route.name === "plant" ? <PlantScreen plant={route.plant} goBack={goBack} navigate={navigate} /> : null}
        {route.name === "menu" ? <MenuScreen navigate={navigate} goBack={goBack} /> : null}
        {route.name === "info" ? <InfoScreen page={route.page} navigate={navigate} goBack={goBack} /> : null}
        {route.name !== "product" && route.name !== "plant" && route.name !== "menu" && route.name !== "info" && route.name !== "accountDetail" ? (
          <BottomNav active={rootTab} onSelect={(tab) => navigate({ name: tab })} />
        ) : null}
      </View>
    </View>
  );
}

export default function PremiumApp() {
  const [fontsLoaded] = useFonts({
    Vodafone: require("../../assets/fonts/Vodafone.ttf"),
    "Vodafone-Light": require("../../assets/fonts/Vodafone-Light.ttf"),
    "Vodafone-Bold": require("../../assets/fonts/Vodafone-Bold.ttf"),
    "Vodafone-ExtraBold": require("../../assets/fonts/Vodafone-ExtraBold.ttf"),
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  return <SafeAreaProvider><PremiumAppContent /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.canvas, alignItems: "center" },
  desktopFrame: { flex: 1, width: "100%", maxWidth: contentWidth, backgroundColor: colors.canvas, overflow: "hidden" },
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xl },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  header: { minHeight: 64, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md, zIndex: 10 },
  headerCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,.12)", alignItems: "center", justifyContent: "center" },
  headerCirclePlaceholder: { width: 48, height: 48 },
  headerLogo: { width: 176, height: 48 },
  headerTitle: { ...type.h3, flex: 1, textAlign: "center" },
  headerSpacer: { flex: 1 },
  homeHero: { minHeight: 590, backgroundColor: colors.inkDeep, overflow: "hidden" },
  heroContent: { flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: 54, maxWidth: 650 },
  heroEyebrow: { ...type.meta, color: colors.orange, marginBottom: spacing.sm },
  heroTitle: { ...type.display, color: colors.surface, maxWidth: 560 },
  heroBody: { ...type.body, color: "#D4DCE9", maxWidth: 500, marginTop: spacing.md },
  heroButton: { alignSelf: "flex-start", minHeight: 54, borderRadius: radius.round, backgroundColor: colors.orange, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  heroButtonText: { ...type.bodyStrong, color: colors.surface },
  marketPanel: { marginTop: -1, minHeight: 112, paddingHorizontal: spacing.lg, backgroundColor: colors.inkDeep, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  metric: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  metricIcon: { width: 34, alignItems: "center" },
  metricLabel: { ...type.meta, color: "#9BAAC3", fontSize: 11 },
  metricValue: { ...type.bodyStrong, color: colors.surface, marginTop: 2 },
  greeting: { gap: spacing.xs },
  greetingSmall: { ...type.caption, color: colors.muted },
  greetingName: { ...type.h2, color: colors.ink },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickAction: { width: "47.5%", minHeight: 190, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, gap: spacing.sm, ...shadow },
  quickIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  quickTitle: { ...type.h3 },
  quickBody: { ...type.caption, color: colors.muted, flex: 1 },
  arFeature: { borderRadius: radius.xl, minHeight: 190, overflow: "hidden", padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md },
  arFeatureIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,.12)", alignItems: "center", justifyContent: "center" },
  arFeatureCopy: { flex: 1, gap: spacing.xs },
  arFeatureEyebrow: { ...type.meta, color: colors.orange },
  arFeatureTitle: { ...type.h3, color: colors.surface },
  roundAction: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  sectionTitleRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  sectionTitleCopy: { flex: 1 },
  eyebrow: { ...type.meta, color: colors.orange, marginBottom: spacing.xs },
  sectionTitle: { ...type.h2 },
  textAction: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingBottom: 4 },
  textActionLabel: { ...type.caption, fontFamily: type.bold, color: colors.inkSoft },
  horizontalList: { gap: spacing.md, paddingRight: spacing.lg },
  compactProduct: { width: Math.min(screenWidth * 0.72, 330), height: 360, borderRadius: radius.xl, overflow: "hidden", padding: spacing.lg, justifyContent: "space-between" },
  compactProductTag: { alignSelf: "flex-start", backgroundColor: "rgba(7,21,47,.72)", borderRadius: radius.round, paddingVertical: 8, paddingHorizontal: 14 },
  compactProductTagText: { ...type.meta, color: colors.surface, fontSize: 11 },
  compactProductCopy: { gap: spacing.xs },
  compactProductTitle: { ...type.h2, color: colors.surface },
  compactProductBody: { ...type.caption, color: "#D6DEEB" },
  projectBanner: { height: 380, borderRadius: radius.xl, overflow: "hidden", justifyContent: "flex-end" },
  projectBannerCopy: { padding: spacing.lg, gap: spacing.xs },
  projectBannerMeta: { ...type.meta, color: colors.orange },
  projectBannerTitle: { ...type.h2, color: colors.surface },
  projectBannerBody: { ...type.caption, color: "#D6DEEB", maxWidth: 450 },
  discoverHero: { backgroundColor: colors.inkDeep, paddingBottom: spacing.lg },
  discoverHeroCopy: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  discoverTitle: { ...type.h1, color: colors.surface, maxWidth: 560 },
  segment: { marginHorizontal: spacing.lg, flexDirection: "row", backgroundColor: "rgba(255,255,255,.1)", borderRadius: radius.round, padding: 5 },
  segmentButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: radius.round },
  segmentButtonActive: { backgroundColor: colors.surface },
  segmentText: { ...type.caption, fontFamily: type.bold, color: "#AAB6C8" },
  segmentTextActive: { color: colors.ink },
  catalogList: { gap: spacing.md },
  productRow: { minHeight: 180, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", flexDirection: "row", borderWidth: 1, borderColor: colors.line },
  productRowMedia: { width: "38%", minHeight: 180, backgroundColor: colors.inkDeep },
  productIndex: { ...type.meta, color: colors.surface, margin: spacing.md },
  productRowCopy: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: spacing.xs },
  productRowCategory: { ...type.meta, color: colors.orange, fontSize: 11 },
  productRowTitle: { ...type.h3 },
  productRowBody: { ...type.caption, color: colors.muted },
  productRowArrow: { position: "absolute", right: spacing.md, bottom: spacing.md, width: 42, height: 42, borderRadius: 21, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  projectListCard: { height: 310, borderRadius: radius.xl, overflow: "hidden", justifyContent: "flex-end" },
  projectListCopy: { padding: spacing.lg, gap: spacing.xs },
  projectListMeta: { ...type.meta, color: colors.orange },
  projectListTitle: { ...type.h2, color: colors.surface },
  projectListMetric: { ...type.bodyStrong, color: "#D8E1ED" },
  plantCard: { borderRadius: radius.xl, overflow: "hidden" },
  plantImage: { height: 300, justifyContent: "flex-end" },
  plantImageRadius: { borderRadius: radius.xl },
  plantCopy: { padding: spacing.lg },
  plantTitle: { ...type.h2, color: colors.surface },
  plantCapacity: { ...type.caption, color: "#D6DEEB", marginTop: spacing.xs },
  plantArrow: { position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  detailHero: { minHeight: 620, backgroundColor: colors.inkDeep, justifyContent: "space-between", overflow: "hidden" },
  detailHeroCopy: { padding: spacing.lg, paddingBottom: 54 },
  detailTitle: { ...type.display, color: colors.surface },
  detailBody: { ...type.body, color: "#D1DAE7", maxWidth: 560, marginTop: spacing.md },
  detailSheet: { marginTop: -28, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.xl },
  detailSectionTitle: { ...type.h2 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.round, paddingHorizontal: spacing.md, backgroundColor: colors.greenSoft },
  tagText: { ...type.caption, fontFamily: type.bold },
  detailInfoGrid: { flexDirection: "row", gap: spacing.md },
  infoCard: { flex: 1, minHeight: 190, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  infoIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center" },
  infoTitle: { ...type.h3, marginTop: spacing.md },
  infoBody: { ...type.caption, color: colors.muted, marginTop: spacing.xs },
  arProductCta: { minHeight: 130, borderRadius: radius.lg, backgroundColor: colors.ink, flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  arProductIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  arProductCopy: { flex: 1 },
  arProductTitle: { ...type.h3, color: colors.surface },
  arProductBody: { ...type.caption, color: "#BBC7D8", marginTop: spacing.xs },
  primaryButton: { minHeight: 58, borderRadius: radius.round, backgroundColor: colors.orange, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { ...type.bodyStrong, color: colors.surface },
  arPage: { flex: 1, backgroundColor: colors.canvas },
  arHeader: { backgroundColor: colors.inkDeep, paddingBottom: 52 },
  arHeaderCopy: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  arTitle: { ...type.h1, color: colors.surface, maxWidth: 560 },
  arLead: { ...type.body, color: "#BBC6D7", maxWidth: 560, marginTop: spacing.md },
  arContent: { marginTop: -28, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.lg },
  arScannerCard: { minHeight: 430, borderRadius: radius.xl, overflow: "hidden", padding: spacing.lg, alignItems: "center", justifyContent: "center" },
  scanCorners: { width: 160, height: 160, marginBottom: spacing.lg },
  scanCorner: { position: "absolute", width: 50, height: 50, borderColor: colors.orange },
  scanCornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.md },
  scanCornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.md },
  scanCornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.md },
  scanCornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.md },
  scanCenter: { position: "absolute", top: 96 },
  scanTitle: { ...type.h3, color: colors.surface, textAlign: "center" },
  scanBody: { ...type.caption, color: "#ABB8CC", textAlign: "center", maxWidth: 420, marginTop: spacing.sm },
  scanButton: { minHeight: 54, borderRadius: radius.round, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  scanButtonText: { ...type.bodyStrong },
  scanButtonDisabled: { opacity: 0.48 },
  measureModeSwitch: { flexDirection: "row", gap: spacing.xs, borderRadius: radius.round, backgroundColor: colors.surface, padding: 5 },
  measureMode: { flex: 1, minHeight: 46, borderRadius: radius.round, alignItems: "center", justifyContent: "center" },
  measureModeActive: { backgroundColor: colors.inkDeep },
  measureModeText: { ...type.caption, color: colors.muted },
  measureModeTextActive: { color: colors.surface },
  safetyCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.md },
  safetyCardActive: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  safetyCheck: { width: 28, height: 28, borderRadius: radius.round, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  safetyCheckActive: { borderColor: colors.green, backgroundColor: colors.green },
  safetyCopy: { flex: 1, gap: 3 },
  safetyTitle: { ...type.bodyStrong, color: colors.ink },
  safetyBody: { ...type.caption, color: colors.muted },
  manualCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  manualTitle: { ...type.h3, color: colors.ink },
  manualLead: { ...type.body, color: colors.muted },
  manualInputs: { gap: spacing.sm },
  measureInput: { gap: spacing.xs },
  measureInputLabel: { ...type.caption, color: colors.text },
  measureInputRow: { minHeight: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.canvas, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md },
  measureInputField: { flex: 1, ...type.bodyStrong, color: colors.ink, paddingVertical: spacing.sm },
  measureInputUnit: { ...type.caption, color: colors.muted },
  manualResult: { borderRadius: radius.lg, backgroundColor: colors.orangeSoft, padding: spacing.md, gap: spacing.xs },
  manualHint: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  manualHintText: { flex: 1, ...type.caption, color: colors.muted },
  resultHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  qualityBadge: { borderRadius: radius.round, backgroundColor: colors.greenSoft, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  qualityBadgeWarning: { backgroundColor: colors.orangeSoft },
  qualityBadgeText: { ...type.meta, color: colors.ink },
  resultDetails: { gap: spacing.sm },
  resultDetail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.sm },
  resultDetailLabel: { ...type.caption, color: colors.muted },
  resultDetailValue: { ...type.bodyStrong, color: colors.ink, textAlign: "right" },
  rescanButton: { minHeight: 46, borderRadius: radius.round, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
  rescanButtonText: { ...type.caption, color: colors.ink },
  resultActions: { gap: spacing.sm },
  resultActionGrid: { flexDirection: "row", gap: spacing.sm },
  secondaryAction: { flex: 1, minHeight: 52, borderRadius: radius.round, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
  secondaryActionText: { ...type.caption, color: colors.ink },
  localPrivacy: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingHorizontal: spacing.sm },
  localPrivacyText: { flex: 1, ...type.caption, color: colors.muted },
  arSteps: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  arStep: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  arStepNumber: { ...type.meta, color: colors.orange, width: 32 },
  arStepTitle: { ...type.bodyStrong },
  arStepBody: { ...type.caption, color: colors.muted, marginTop: 2 },
  errorBox: { minHeight: 60, borderRadius: radius.md, backgroundColor: "#FFF1EF", flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  errorText: { ...type.caption, color: colors.danger, flex: 1 },
  resultCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  resultBuckets: { fontFamily: type.bold, fontSize: 74, lineHeight: 80, color: colors.ink, marginTop: spacing.md },
  resultUnit: { ...type.meta, color: colors.orange },
  resultMetrics: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.lg },
  resultMetric: { flex: 1, borderRadius: radius.md, backgroundColor: colors.canvas, padding: spacing.md },
  resultMetricLabel: { ...type.caption, color: colors.muted },
  resultMetricValue: { ...type.bodyStrong, marginTop: spacing.xs },
  resultDisclaimer: { ...type.caption, color: colors.muted, marginBottom: spacing.lg },
  quotePage: { flex: 1, backgroundColor: colors.inkDeep },
  quoteHeader: { backgroundColor: colors.inkDeep, paddingBottom: 54 },
  quoteHeaderCopy: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  quoteTitle: { ...type.h1, color: colors.surface },
  quoteLead: { ...type.body, color: "#BBC6D7", marginTop: spacing.md },
  quoteSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md },
  autoFillNotice: { minHeight: 70, borderRadius: radius.md, backgroundColor: colors.greenSoft, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  autoFillText: { ...type.caption, fontFamily: type.bold, flex: 1 },
  labeledValue: { minHeight: 76, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  labeledLabel: { ...type.meta, color: colors.muted, fontSize: 11 },
  labeledText: { ...type.bodyStrong, marginTop: 2 },
  inputLabel: { ...type.meta, marginTop: spacing.sm },
  formInput: { minHeight: 60, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, ...type.body, color: colors.text },
  textArea: { minHeight: 150, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.md, textAlignVertical: "top", ...type.body, color: colors.text },
  uploadRow: { flexDirection: "row", gap: spacing.md },
  uploadButton: { flex: 1, minHeight: 90, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  uploadTitle: { ...type.caption, fontFamily: type.bold },
  privacyText: { ...type.caption, color: colors.muted, textAlign: "center" },
  accountHero: { backgroundColor: colors.inkDeep, paddingBottom: spacing.xl, overflow: "hidden" },
  accountIdentity: { alignItems: "center", paddingTop: spacing.xl },
  accountBrandImage: { width: "78%", maxWidth: 330, height: 90 },
  avatar: { width: 106, height: 106, borderRadius: 53, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,.4)" },
  avatarText: { fontFamily: type.bold, fontSize: 34, color: colors.surface },
  accountName: { ...type.h2, color: colors.surface, marginTop: spacing.md, textAlign: "center", paddingHorizontal: spacing.lg },
  accountEmail: { ...type.body, color: "#C6D0DF", marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl, maxWidth: 560 },
  accountDetailHero: { minHeight: 260, backgroundColor: colors.inkDeep, paddingBottom: spacing.xl },
  accountDetailLead: { ...type.body, color: "#C6D0DF", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, maxWidth: 600 },
  verified: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  verifiedText: { ...type.caption, color: "#C6D0DF" },
  settingsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  settingRow: { minHeight: 78, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  settingIcon: { width: 44 },
  settingTitle: { ...type.bodyStrong, flex: 1 },
  whatsappCard: { minHeight: 100, borderRadius: radius.lg, backgroundColor: colors.green, flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  whatsappCopy: { flex: 1 },
  whatsappTitle: { ...type.h3, color: colors.surface },
  whatsappBody: { ...type.caption, color: "#E4FFF0", marginTop: 2 },
  versionText: { ...type.caption, color: colors.muted, textAlign: "center", lineHeight: 22, marginVertical: spacing.lg },
  plantHero: { minHeight: 760, justifyContent: "space-between", backgroundColor: colors.inkDeep, overflow: "hidden" },
  plantTop: { paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm, zIndex: 3 },
  plantTabs: { flex: 1, minHeight: 52, borderRadius: radius.round, padding: 4, backgroundColor: "rgba(7,21,47,.78)", borderWidth: 1, borderColor: "rgba(255,255,255,.2)", flexDirection: "row" },
  plantTab: { flex: 1, borderRadius: radius.round, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  plantTabActive: { backgroundColor: colors.orange },
  plantTabText: { ...type.caption, fontFamily: type.bold, color: "#C4CEDD", fontSize: 12 },
  plantTabTextActive: { color: colors.surface },
  plantHeroCopy: { padding: spacing.lg, paddingBottom: 48, maxWidth: 620 },
  plantCapacityRow: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.18)", marginTop: spacing.xl, paddingTop: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md },
  plantHeroCapacity: { fontFamily: type.bold, fontSize: 76, lineHeight: 82, color: colors.orange },
  plantCapacityUnit: { ...type.bodyStrong, color: colors.surface },
  plantCapacityMeta: { ...type.meta, color: "#AAB6C8", fontSize: 10, marginTop: 3 },
  plantSpecGrid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface },
  plantSpec: { width: "50%", minHeight: 150, alignItems: "center", justifyContent: "center", gap: spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: spacing.md },
  plantSpecValue: { ...type.h3, color: colors.ink },
  plantSpecLabel: { ...type.meta, color: colors.muted, fontSize: 10, textAlign: "center" },
  menuPage: { flex: 1, backgroundColor: colors.canvas },
  menuHeader: { minHeight: 260, backgroundColor: colors.inkDeep, paddingBottom: spacing.xl },
  menuHeaderCopy: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  menuTitle: { ...type.h1, color: colors.surface, maxWidth: 560 },
  menuList: { padding: spacing.lg, gap: spacing.sm },
  menuRow: { minHeight: 82, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuRowIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center" },
  menuRowCopy: { flex: 1, minWidth: 0 },
  menuRowTitle: { ...type.bodyStrong, color: colors.ink },
  menuRowMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  menuQuote: { minHeight: 112, borderRadius: radius.lg, backgroundColor: colors.orange, padding: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.sm },
  menuQuoteEyebrow: { ...type.meta, color: "#FFE4D0" },
  menuQuoteTitle: { ...type.h3, color: colors.surface, marginTop: spacing.xs },
  infoHero: { minHeight: 430, backgroundColor: colors.inkDeep, overflow: "hidden" },
  infoHeroCopy: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 54, maxWidth: 650 },
  infoHeroTitle: { ...type.h1, color: colors.surface, maxWidth: 590 },
  infoHeroLead: { ...type.body, color: "#D4DCE9", marginTop: spacing.md, maxWidth: 560 },
  infoContent: { padding: spacing.lg, gap: spacing.md },
  infoSection: { minHeight: 130, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.lg, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, ...shadow },
  infoSectionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center" },
  infoSectionCopy: { flex: 1, minWidth: 0 },
  infoSectionTitle: { ...type.h3, color: colors.ink },
  infoSectionBody: { ...type.body, color: colors.muted, marginTop: spacing.xs },
  navWrap: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 82, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(120,130,145,.28)", overflow: "hidden" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 8 },
  navItemCentral: { marginTop: -4 },
  navIcon: { width: 38, height: 34, alignItems: "center", justifyContent: "center" },
  navIconActive: { backgroundColor: colors.orangeSoft, borderRadius: radius.round },
  navIconAR: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.orange, ...shadow },
  navLabel: { ...type.caption, fontFamily: type.bold, fontSize: 12, lineHeight: 16, color: colors.muted, marginTop: 2 },
  navLabelActive: { color: colors.orange },
  navLabelAR: { marginTop: 0, color: colors.orange },
});
