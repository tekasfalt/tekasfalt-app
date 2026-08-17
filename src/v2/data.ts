export type Product = {
  id: string;
  title: string;
  category: string;
  summary: string;
  image: number;
  video?: number;
  tags: string[];
};

export type Project = {
  id: string;
  title: string;
  location: string;
  category: string;
  image: number;
  metric: string;
};

export const products: Product[] = [
  {
    id: "ready",
    title: "Hazır Asfalt",
    category: "Onarım",
    summary: "Çukur, saha ve yol onarımları için pratik 25 kg çözüm.",
    image: require("../../assets/products/catalog/hazir-asfalt.png"),
    video: require("../../assets/products/catalog/hazir-asfalt.mp4"),
    tags: ["25 kg", "Soğuk uygulama", "Hızlı onarım"],
  },
  {
    id: "porous",
    title: "Poröz Asfalt",
    category: "Drenaj",
    summary: "Yağışlı alanlarda suyu hızla uzaklaştıran açık gözenekli karışım.",
    image: require("../../assets/corporate/applications-road-mobile.mp4"),
    video: require("../../assets/products/catalog/poroz-asfalt-optimized.mp4"),
    tags: ["Drenaj", "Düşük gürültü", "Yol güvenliği"],
  },
  {
    id: "colored",
    title: "Renkli Asfalt",
    category: "Tasarım",
    summary: "Bisiklet yolları ve kentsel alanlar için dayanıklı dekoratif yüzey.",
    image: require("../../assets/products/catalog/renkli-asfalt.jpg"),
    tags: ["Dekoratif", "Dayanıklı", "Projeye özel"],
  },
  {
    id: "joint",
    title: "Derz Dolgu Bitümü",
    category: "Yalıtım",
    summary: "Derz ve birleşim bölgelerinde esnek, kalıcı koruma.",
    image: require("../../assets/products/yalitim-detail.png"),
    video: require("../../assets/products/catalog/derz-dolgu.mp4"),
    tags: ["Su geçirimsiz", "Sıcak uygulama", "Elastik"],
  },
  {
    id: "emulsion",
    title: "Bitüm Emülsiyonu",
    category: "Aderans",
    summary: "Tabakalar arasında güçlü bağ için kontrollü yüzey uygulaması.",
    image: require("../../assets/products/emulsiyon-detail.png"),
    video: require("../../assets/products/catalog/emulsiyon-optimized.mp4"),
    tags: ["Aderans", "Yüzey hazırlığı", "Profesyonel"],
  },
];

export const projects: Project[] = [
  {
    id: "p1",
    title: "Kent içi yol yenileme",
    location: "İstanbul",
    category: "Serim",
    image: require("../../assets/corporate/applications-road.mp4"),
    metric: "28.400 m²",
  },
  {
    id: "p2",
    title: "Endüstriyel saha",
    location: "Silivri",
    category: "Üretim",
    image: require("../../assets/corporate/production-silivri-mobile.mp4"),
    metric: "7.800 ton",
  },
  {
    id: "p3",
    title: "Plentmiks temel",
    location: "Avrupa Yakası",
    category: "Altyapı",
    image: require("../../assets/corporate/production-plentmiks.jpg"),
    metric: "42.000 ton",
  },
];

export const plants = [
  { id: "sultangazi", title: "Sultangazi", capacity: "340 t/s", image: require("../../assets/sultangazi-plant.jpg") },
  { id: "silivri", title: "Silivri", capacity: "200 t/s", image: require("../../assets/hero-plant-mobile.jpg") },
  { id: "plentmiks", title: "Silivri Plentmiks", capacity: "300 t/s", image: require("../../assets/corporate/production-plentmiks.jpg") },
];
