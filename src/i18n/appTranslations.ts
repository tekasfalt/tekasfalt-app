export type AppLanguage = "tr" | "en" | "de" | "ar";

let runtimeLanguage: AppLanguage = "tr";

// Brand and product names intentionally remain untouched in every language.
const dictionaries: Record<Exclude<AppLanguage,"tr">, Record<string,string>> = {
  en: {
    "Keşfet":"Explore", "Çözümler":"Solutions", "Teklif":"Quote", "Hesaplama":"Calculator", "Dil tercihi":"Language",
    "Ürünler":"Products", "Ana Sayfa":"Home", "İletişim":"Contact", "Bildirimler":"Notifications", "Profilim":"My profile",
    "Müşteri Portalı":"Customer portal", "Giriş yap":"Sign in", "Çıkış yap":"Sign out", "Misafir olarak devam et":"Continue as guest",
    "Teklif Talebi":"Request a quote", "Teklif ve siparişler":"Quotes and orders", "Firma bilgilerim":"Company details",
    "Bildirim tercihlerim":"Notification preferences", "Giriş ve güvenlik":"Sign-in and security", "Veriler ve gizlilik":"Data and privacy",
    "Yardım Merkezi":"Help centre", "Ayarlar":"Settings", "Mobil bildirimler":"Push notifications", "Dil":"Language",
    "İşinize uygun\nçözümü seçin.":"Choose the right\nsolution for your job.", "Ürünü incele":"Explore product",
    "Kartları sağa–sola kaydırın. Ortadaki kart seçili üründür.":"Swipe left or right. The centre card is selected.",
    "Ürünler arasında kaydırın":"Swipe between products", "Doğru karışım,\ndoğru uygulama.":"The right mix,\nthe right application.",
    "PROJEYE ÖZEL ÇÖZÜMLER":"PROJECT SOLUTIONS", "Çözümü incele":"Explore solution",
    "Projeniz için\ndoğru hatta ulaşın.":"Reach the right team\nfor your project.", "Rota":"Directions", "Canlı destek":"Live support",
    "Sık sorulan\nsorular":"Frequently asked\nquestions", "KONULAR":"TOPICS", "Sık sorulan sorularda ara":"Search frequently asked questions",
    "Fiyat hareketi":"Price movement", "10 günlük görünüm":"10-day forecast", "Günlük kur özeti":"Daily exchange summary",
    "KDV HARİÇ":"EXCLUDING VAT", "KDV DAHİL":"INCLUDING VAT", "DETAY":"DETAIL", "Teklif iste":"Request quote"
  },
  de: {
    "Keşfet":"Entdecken", "Çözümler":"Lösungen", "Teklif":"Angebot", "Hesaplama":"Rechner", "Dil tercihi":"Sprache",
    "Ürünler":"Produkte", "Ana Sayfa":"Startseite", "İletişim":"Kontakt", "Bildirimler":"Benachrichtigungen", "Profilim":"Mein Profil",
    "Müşteri Portalı":"Kundenportal", "Giriş yap":"Anmelden", "Çıkış yap":"Abmelden", "Misafir olarak devam et":"Als Gast fortfahren",
    "Teklif Talebi":"Angebot anfordern", "Teklif ve siparişler":"Angebote und Bestellungen", "Firma bilgilerim":"Unternehmensdaten",
    "Bildirim tercihlerim":"Benachrichtigungen", "Giriş ve güvenlik":"Anmeldung und Sicherheit", "Veriler ve gizlilik":"Daten und Datenschutz",
    "Yardım Merkezi":"Hilfezentrum", "Ayarlar":"Einstellungen", "Mobil bildirimler":"Push-Benachrichtigungen", "Dil":"Sprache",
    "Ürünü incele":"Produkt ansehen", "Kartları sağa–sola kaydırın. Ortadaki kart seçili üründür.":"Nach links oder rechts wischen. Die mittlere Karte ist ausgewählt.",
    "Ürünler arasında kaydırın":"Zwischen Produkten wischen", "PROJEYE ÖZEL ÇÖZÜMLER":"PROJEKTLÖSUNGEN", "Çözümü incele":"Lösung ansehen", "Rota":"Route",
    "Canlı destek":"Live-Support", "KONULAR":"THEMEN", "DETAY":"DETAILS", "Teklif iste":"Angebot anfordern"
  },
  ar: {
    "Keşfet":"استكشاف", "Çözümler":"الحلول", "Teklif":"عرض سعر", "Hesaplama":"الحساب", "Dil tercihi":"اللغة",
    "Ürünler":"المنتجات", "Ana Sayfa":"الرئيسية", "İletişim":"التواصل", "Bildirimler":"الإشعارات", "Profilim":"ملفي الشخصي",
    "Müşteri Portalı":"بوابة العملاء", "Giriş yap":"تسجيل الدخول", "Çıkış yap":"تسجيل الخروج", "Misafir olarak devam et":"المتابعة كضيف",
    "Teklif Talebi":"طلب عرض سعر", "Teklif ve siparişler":"العروض والطلبات", "Firma bilgilerim":"بيانات الشركة",
    "Bildirim tercihlerim":"تفضيلات الإشعارات", "Giriş ve güvenlik":"الدخول والأمان", "Veriler ve gizlilik":"البيانات والخصوصية",
    "Yardım Merkezi":"مركز المساعدة", "Ayarlar":"الإعدادات", "Mobil bildirimler":"إشعارات الدفع", "Dil":"اللغة",
    "Ürünü incele":"استعرض المنتج", "Kartları sağa–sola kaydırın. Ortadaki kart seçili üründür.":"اسحب يمينًا أو يسارًا. البطاقة الوسطى هي المحددة.",
    "Ürünler arasında kaydırın":"اسحب بين المنتجات", "PROJEYE ÖZEL ÇÖZÜMLER":"حلول مخصصة للمشاريع", "Çözümü incele":"استعرض الحل", "Rota":"الاتجاهات",
    "Canlı destek":"دعم مباشر", "KONULAR":"المواضيع", "DETAY":"التفاصيل", "Teklif iste":"طلب عرض سعر"
  }
};

export function setRuntimeLanguage(language: AppLanguage) { runtimeLanguage = language; }

export function getRuntimeLanguage() { return runtimeLanguage; }

export function translateText(value: string) {
  if (runtimeLanguage === "tr") return value;
  return dictionaries[runtimeLanguage][value] ?? value;
}
