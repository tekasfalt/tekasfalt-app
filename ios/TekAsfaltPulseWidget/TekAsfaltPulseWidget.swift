import SwiftUI
import WidgetKit

struct TekAsfaltPulseEntry: TimelineEntry { let date: Date }

struct TekAsfaltPulseProvider: TimelineProvider {
  func placeholder(in context: Context) -> TekAsfaltPulseEntry { .init(date: .now) }
  func getSnapshot(in context: Context, completion: @escaping (TekAsfaltPulseEntry) -> Void) { completion(.init(date: .now)) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<TekAsfaltPulseEntry>) -> Void) {
    completion(Timeline(entries: [.init(date: .now)], policy: .after(.now.addingTimeInterval(30 * 60))))
  }
}

struct TekAsfaltPulseWidgetView: View {
  let entry: TekAsfaltPulseEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    Group { if family == .systemSmall { compactSummary } else { marketSummary } }
      .containerBackground(Color.canvas, for: .widget)
      .widgetURL(URL(string: "tekasfalt://market"))
  }

  private var compactSummary: some View {
    ZStack(alignment: .bottomTrailing) {
      Color.canvas
      RoundedRectangle(cornerRadius: 20, style: .continuous).fill(.white).padding(8)
      Image("hazir-asfalt-detail").resizable().scaledToFit().frame(width: 106, height: 118).offset(x: 15, y: 10)
      VStack(alignment: .leading, spacing: 6) {
        brand; Spacer()
        Text("ASFALT TO GO®").font(.system(size: 9, weight: .black)).kerning(1).foregroundStyle(.orange)
        Text("Hazır Asfalt").font(.system(size: 20, weight: .bold, design: .rounded)).foregroundStyle(Color.ink)
        Text("Ürün detayını aç").font(.system(size: 9, weight: .medium)).foregroundStyle(Color.muted)
      }.padding(17)
    }
  }

  private var marketSummary: some View {
    ZStack {
      Color.canvas
      RoundedRectangle(cornerRadius: 20, style: .continuous).fill(.white).padding(8)
      HStack(spacing: 0) {
        VStack(alignment: .leading, spacing: 10) {
          brand
          HStack(alignment: .firstTextBaseline, spacing: 7) {
            VStack(alignment: .leading, spacing: 3) {
              Label("BİTÜM 60/70", systemImage: "drop.fill").font(.system(size: 8, weight: .bold)).kerning(0.8).foregroundStyle(.orange)
              Text("25.010 ₺").font(.system(size: 24, weight: .bold, design: .rounded)).foregroundStyle(Color.ink)
            }
            Text("+%1,82").font(.system(size: 9, weight: .bold)).foregroundStyle(.green).padding(.horizontal, 7).padding(.vertical, 5).background(.green.opacity(0.16), in: Capsule())
          }
          Rectangle().fill(Color.line).frame(height: 1)
          HStack(spacing: 6) {
            metric(icon: "cloud.sun.fill", title: "İSTANBUL", value: "23°", color: .orange)
            Rectangle().fill(Color.line).frame(width: 1, height: 28)
            metric(icon: "eurosign.circle.fill", title: "EUR", value: "48,16", color: .cyan)
            Rectangle().fill(Color.line).frame(width: 1, height: 28)
            metric(icon: "dollarsign.circle.fill", title: "USD", value: "41,22", color: .green)
          }
        }.padding(.leading, 18).padding(.vertical, 17).frame(maxWidth: .infinity, alignment: .leading)
        VStack(spacing: 2) {
          Image("hazir-asfalt-detail").resizable().scaledToFit().frame(width: 90, height: 98)
          Text("ASFALT TO GO®").font(.system(size: 7, weight: .black)).kerning(0.6).foregroundStyle(Color.ink.opacity(0.70))
        }.padding(.trailing, 15)
      }.padding(8)
    }
  }

  private var brand: some View {
    HStack(spacing: 6) {
      Image("2026-teklogo").resizable().scaledToFit().frame(width: 42, height: 15)
      Text("PİYASA ÖZETİ").font(.system(size: 8, weight: .bold)).kerning(0.7).foregroundStyle(Color.muted)
    }
  }

  private func metric(icon: String, title: String, value: String, color: Color) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      Image(systemName: icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(color)
      Text(title).font(.system(size: 6, weight: .bold)).foregroundStyle(Color.muted)
      Text(value).font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(Color.ink)
    }.frame(maxWidth: .infinity, alignment: .leading)
  }
}

private extension Color {
  static let canvas = Color(red: 0.93, green: 0.94, blue: 0.96)
  static let ink = Color(red: 0.08, green: 0.12, blue: 0.20)
  static let muted = Color(red: 0.42, green: 0.46, blue: 0.53)
  static let line = Color(red: 0.89, green: 0.90, blue: 0.92)
}

@main
struct TekAsfaltPulseWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TekAsfaltPulseWidget", provider: TekAsfaltPulseProvider()) { entry in TekAsfaltPulseWidgetView(entry: entry) }
      .configurationDisplayName("Tek Asfalt")
      .description("Bitüm, hava, döviz ve Asfalt To Go ürün özeti.")
      .supportedFamilies([.systemSmall, .systemMedium])
  }
}
