# Tek Asfalt AR ve stok ölçüm altyapısı — build 34

## Neden build 33 açılmıyordu?

`TekArScanner` bir Expo JavaScript paketi değildir; iOS içinde derlenen bir
ARKit modülüdür. Bu nedenle Expo Go veya build 28 gibi eski bir development
client modülü yükleyemez. Modül değiştiğinde iPhone uygulaması Xcode/EAS ile
yeniden derlenmeli ve ardından Metro doğru proje klasöründen açılmalıdır.

Build 33'teki çukur aracı, uzunluk/genişlik/derinlik için iki nokta seçen bir
AR cetvelidir. Otomatik çukur algılama ya da stok yığını 3B hacim hesabı
değildir.

## Build 34 tasarımı

İki ayrı kullanım alanı tutulur:

1. **Onarım metrajı:** küçük çukur/yama için yönlendirmeli AR nokta ölçümü.
2. **Stok taraması (beta):** agrega, freze malzemesi ve benzeri yığınlarda
   yürüyerek AR mesh kapsaması toplama.

Stok taraması ilk aşamada `TekStockpileCapture` kaydı üretir. Bu kayıt mesh
ankor/tepe noktası sayısı, kapsama puanı ve süreyi içerir; **hacim iddiası
yapmaz**. Böylece doğrulanmamış bir tahmin, kantar veya envanter sonucu gibi
gösterilmez.

## Sonraki aşamalar

1. Tarama kapsaması yeterliyse mesh ham verisini yerelde kuyruklamak.
2. Bilinen zemin düzlemi ve kapalı yüzey üzerinden m³ hesaplamak.
3. Tesis ve malzemeye özel yoğunluk katsayısıyla tonaja çevirmek.
4. Kantar karşılaştırmasıyla her malzeme/tesis için hata payını kalibre etmek.
5. Fotoğraf, konum, tarih, kullanıcı ve sonuçla denetlenebilir rapor üretmek.

## Güvenlik ve doğruluk

Tarama yalnızca yaya olarak, sabit zemin üzerinde ve hareket eden araç/iş
makinesinden uzakta başlatılır. Kameranın göremediği yüzey, gölge, ekipman ve
belirsiz zemin düzlemi sonucu etkiler; bu nedenle kapsama puanı düşükse
uygulama hacim hesabına geçmemelidir.
