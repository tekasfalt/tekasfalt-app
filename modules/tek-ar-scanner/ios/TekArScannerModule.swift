import ExpoModulesCore
import ARKit
import AVFoundation
import CoreVideo
import CoreML
import RealityKit
import UIKit
import simd
import Vision

public final class TekArScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TekArScanner")

    AsyncFunction("isSupported") { () -> [String: Any] in
      [
        "supported": ARWorldTrackingConfiguration.isSupported,
        "lidarSupported": ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth),
        "cameraPermission": Self.cameraPermissionValue()
      ]
    }

    AsyncFunction("diagnostics") { () -> [String: Any] in
      let supported = ARWorldTrackingConfiguration.isSupported
      let lidarSupported = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)
      let meshSupported = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
      let permission = Self.cameraPermissionValue()
      let reason: String?
      if !supported {
        reason = "Bu cihaz ARKit dünya takibini desteklemiyor."
      } else if permission == "denied" || permission == "restricted" {
        reason = "Kamera izni kapalı. iPhone Ayarları'ndan Tek Asfalt için kamerayı açın."
      } else if !meshSupported {
        reason = "Bu cihazda LiDAR mesh taraması yok. Çukur ölçümü ve manuel metraj kullanılabilir."
      } else {
        reason = nil
      }
      return [
        "supported": supported,
        "lidarSupported": lidarSupported,
        "meshSupported": meshSupported,
        "cameraPermission": permission,
        "reason": reason as Any
      ]
    }

    AsyncFunction("requestCameraPermission") { (promise: Promise) in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized:
        promise.resolve(["granted": true, "status": "authorized"])
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
          promise.resolve(["granted": granted, "status": granted ? "authorized" : "denied"])
        }
      case .denied:
        promise.resolve(["granted": false, "status": "denied"])
      case .restricted:
        promise.resolve(["granted": false, "status": "restricted"])
      @unknown default:
        promise.resolve(["granted": false, "status": "unknown"])
      }
    }

    AsyncFunction("scanPothole") { (promise: Promise) in
      guard ARWorldTrackingConfiguration.isSupported else {
        promise.reject("ERR_AR_UNSUPPORTED", "Bu cihaz ARKit dünya takibini desteklemiyor.")
        return
      }
      guard ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) else {
        promise.reject("ERR_LIDAR_REQUIRED", "Otomatik çukur ölçümü LiDAR destekli bir iPhone veya iPad gerektirir. Bu cihazda manuel ölçüm kullanın.")
        return
      }
      guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
        promise.reject("ERR_CAMERA_PERMISSION", "AR ölçümü için kamera izni verilmedi.")
        return
      }
      DispatchQueue.main.async {
        // Expo async functions may run off the main queue. Resolving and
        // presenting UIKit controllers must both happen on the main queue;
        // otherwise the JS side remains in its "camera preparing" state.
        guard let presenter = self.appContext?.utilities?.currentViewController() else {
          promise.reject("ERR_NO_VIEW", "Ölçüm ekranı açılamadı.")
          return
        }
        // First detect a pothole with the bundled Core ML segmentation model;
        // only then measure the detected area with LiDAR depth data.
        let scanner = AutoPotholeScanViewController()
        scanner.onComplete = { result in
          presenter.dismiss(animated: true) { promise.resolve(result) }
        }
        scanner.onCancel = {
          presenter.dismiss(animated: true) {
            promise.reject("ERR_AR_CANCELLED", "Ölçüm iptal edildi.")
          }
        }
        scanner.onError = { message in
          presenter.dismiss(animated: true) {
            promise.reject("ERR_AR_SESSION", message)
          }
        }
        scanner.modalPresentationStyle = .fullScreen
        presenter.present(scanner, animated: true)
      }
    }

    AsyncFunction("scanStockpile") { (promise: Promise) in
      guard ARWorldTrackingConfiguration.isSupported else {
        promise.reject("ERR_AR_UNSUPPORTED", "Bu cihaz ARKit dünya takibini desteklemiyor.")
        return
      }
      guard ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) else {
        promise.reject("ERR_LIDAR_REQUIRED", "Stok taraması için LiDAR mesh destekli bir iPhone veya iPad gerekir.")
        return
      }
      guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
        promise.reject("ERR_CAMERA_PERMISSION", "Stok taraması için kamera izni verilmedi.")
        return
      }
      DispatchQueue.main.async {
        // See scanPothole: UIKit access must remain on the main queue.
        guard let presenter = self.appContext?.utilities?.currentViewController() else {
          promise.reject("ERR_NO_VIEW", "Stok tarama ekranı açılamadı.")
          return
        }
        let scanner = StockpileCaptureViewController()
        scanner.onComplete = { result in
          presenter.dismiss(animated: true) { promise.resolve(result) }
        }
        scanner.onCancel = {
          presenter.dismiss(animated: true) {
            promise.reject("ERR_AR_CANCELLED", "Stok taraması iptal edildi.")
          }
        }
        scanner.onError = { message in
          presenter.dismiss(animated: true) {
            promise.reject("ERR_AR_SESSION", message)
          }
        }
        scanner.modalPresentationStyle = .fullScreen
        presenter.present(scanner, animated: true)
      }
    }
  }

  private static func cameraPermissionValue() -> String {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized: return "authorized"
    case .notDetermined: return "notDetermined"
    case .denied: return "denied"
    case .restricted: return "restricted"
    @unknown default: return "unknown"
    }
  }
}

private struct AutomaticPotholeCandidate {
  let length: Float
  let width: Float
  let depth: Float
  let surfaceArea: Float
  let volume: Float
  let averageDepth: Float
  let pixelCount: Int
  let quality: Int
  let normalizedBounds: CGRect
}

/**
 * Direct field measurement: the operator taps the four rim corners and at
 * least three points on the base. ARKit raycasts each tap into the LiDAR mesh,
 * so the reported dimensions come from explicit, reviewable geometry rather
 * than an image/depth-map contour guess.
 */
private final class CornerPotholeMeasureViewController: UIViewController, ARSessionDelegate {
  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?
  var onError: ((String) -> Void)?

  private let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
  private let titleLabel = UILabel()
  private let statusLabel = UILabel()
  private let countLabel = UILabel()
  private let hudCard = UIView()
  private let liveDimensionsLabel = UILabel()
  private let liveMaterialLabel = UILabel()
  private let cancelButton = UIButton(type: .system)
  private let undoButton = UIButton(type: .system)
  private let finishButton = UIButton(type: .system)
  private var rimPoints: [SIMD3<Float>] = []
  private var basePoints: [SIMD3<Float>] = []
  private var markerViews: [UIView] = []
  private let outlineLayer = CAShapeLayer()
  private var dimensionLabels: [UILabel] = []
  private var phase: Phase = .rim
  private var finished = false
  private let startedAt = Date()

  private enum Phase { case rim, base }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    arView.translatesAutoresizingMaskIntoConstraints = false
    arView.session.delegate = self
    view.addSubview(arView)
    NSLayoutConstraint.activate([
      arView.leadingAnchor.constraint(equalTo: view.leadingAnchor), arView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      arView.topAnchor.constraint(equalTo: view.topAnchor), arView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])
    let tap = UITapGestureRecognizer(target: self, action: #selector(placePoint(_:)))
    arView.addGestureRecognizer(tap)
    outlineLayer.strokeColor = UIColor.white.cgColor; outlineLayer.lineWidth = 3; outlineLayer.fillColor = UIColor.white.withAlphaComponent(0.08).cgColor
    arView.layer.addSublayer(outlineLayer)
    setupOverlay()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal]
    configuration.environmentTexturing = .automatic
    configuration.frameSemantics.insert(.sceneDepth)
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.smoothedSceneDepth) { configuration.frameSemantics.insert(.smoothedSceneDepth) }
    if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) { configuration.sceneReconstruction = .mesh }
    arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
  }

  override func viewWillDisappear(_ animated: Bool) { arView.session.pause(); super.viewWillDisappear(animated) }

  private func setupOverlay() {
    titleLabel.text = "Asfalt To Go · Net ölçüm"
    titleLabel.textColor = .white; titleLabel.font = .systemFont(ofSize: 21, weight: .bold); titleLabel.translatesAutoresizingMaskIntoConstraints = false
    countLabel.textColor = UIColor(red: 0.25, green: 0.92, blue: 0.93, alpha: 1); countLabel.font = .monospacedSystemFont(ofSize: 12, weight: .bold); countLabel.translatesAutoresizingMaskIntoConstraints = false
    statusLabel.textColor = .white; statusLabel.textAlignment = .center; statusLabel.numberOfLines = 3; statusLabel.font = .systemFont(ofSize: 15, weight: .semibold); statusLabel.backgroundColor = UIColor.black.withAlphaComponent(0.65); statusLabel.layer.cornerRadius = 18; statusLabel.clipsToBounds = true; statusLabel.translatesAutoresizingMaskIntoConstraints = false
    hudCard.backgroundColor = UIColor(red: 0.05, green: 0.11, blue: 0.22, alpha: 0.92); hudCard.layer.cornerRadius = 18; hudCard.layer.borderColor = UIColor.white.withAlphaComponent(0.18).cgColor; hudCard.layer.borderWidth = 1; hudCard.translatesAutoresizingMaskIntoConstraints = false
    liveDimensionsLabel.text = "Ölçüm için 4 köşe seçin"; liveDimensionsLabel.textColor = .white; liveDimensionsLabel.font = .monospacedSystemFont(ofSize: 14, weight: .bold); liveDimensionsLabel.translatesAutoresizingMaskIntoConstraints = false
    liveMaterialLabel.text = ""; liveMaterialLabel.textColor = UIColor(red: 0.25, green: 0.92, blue: 0.93, alpha: 1); liveMaterialLabel.font = .systemFont(ofSize: 12, weight: .semibold); liveMaterialLabel.translatesAutoresizingMaskIntoConstraints = false
    cancelButton.setImage(UIImage(systemName: "xmark"), for: .normal); cancelButton.tintColor = .white; cancelButton.backgroundColor = UIColor.black.withAlphaComponent(0.65); cancelButton.layer.cornerRadius = 22; cancelButton.addTarget(self, action: #selector(cancel), for: .touchUpInside); cancelButton.translatesAutoresizingMaskIntoConstraints = false
    undoButton.setTitle("Son noktayı geri al", for: .normal); undoButton.setTitleColor(.white, for: .normal); undoButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .bold); undoButton.backgroundColor = UIColor.black.withAlphaComponent(0.65); undoButton.layer.cornerRadius = 22; undoButton.addTarget(self, action: #selector(undo), for: .touchUpInside); undoButton.translatesAutoresizingMaskIntoConstraints = false
    finishButton.setTitle("Derinlik noktalarını doğrula", for: .normal); finishButton.setTitleColor(.white, for: .normal); finishButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .bold); finishButton.backgroundColor = UIColor(red: 1, green: 0.42, blue: 0.08, alpha: 1); finishButton.layer.cornerRadius = 24; finishButton.alpha = 0.45; finishButton.isEnabled = false; finishButton.addTarget(self, action: #selector(finish), for: .touchUpInside); finishButton.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(titleLabel); view.addSubview(countLabel); view.addSubview(hudCard); hudCard.addSubview(liveDimensionsLabel); hudCard.addSubview(liveMaterialLabel); view.addSubview(statusLabel); view.addSubview(cancelButton); view.addSubview(undoButton); view.addSubview(finishButton)
    NSLayoutConstraint.activate([
      titleLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 22), titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 18),
      countLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor), countLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 5),
      cancelButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20), cancelButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor), cancelButton.widthAnchor.constraint(equalToConstant: 44), cancelButton.heightAnchor.constraint(equalToConstant: 44),
      undoButton.trailingAnchor.constraint(equalTo: cancelButton.leadingAnchor, constant: -8), undoButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor), undoButton.widthAnchor.constraint(equalToConstant: 154), undoButton.heightAnchor.constraint(equalToConstant: 44),
      finishButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 18), finishButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -18), finishButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -18), finishButton.heightAnchor.constraint(equalToConstant: 54),
      statusLabel.leadingAnchor.constraint(equalTo: finishButton.leadingAnchor), statusLabel.trailingAnchor.constraint(equalTo: finishButton.trailingAnchor), statusLabel.bottomAnchor.constraint(equalTo: finishButton.topAnchor, constant: -10), statusLabel.heightAnchor.constraint(greaterThanOrEqualToConstant: 64),
      hudCard.leadingAnchor.constraint(equalTo: finishButton.leadingAnchor), hudCard.trailingAnchor.constraint(equalTo: finishButton.trailingAnchor), hudCard.bottomAnchor.constraint(equalTo: statusLabel.topAnchor, constant: -10), hudCard.heightAnchor.constraint(equalToConstant: 68),
      liveDimensionsLabel.leadingAnchor.constraint(equalTo: hudCard.leadingAnchor, constant: 14), liveDimensionsLabel.topAnchor.constraint(equalTo: hudCard.topAnchor, constant: 12),
      liveMaterialLabel.leadingAnchor.constraint(equalTo: liveDimensionsLabel.leadingAnchor), liveMaterialLabel.topAnchor.constraint(equalTo: liveDimensionsLabel.bottomAnchor, constant: 5)
    ])
    updateInstructions()
  }

  private func updateInstructions() {
    switch phase {
    case .rim:
      countLabel.text = "KENAR NOKTALARI · \(rimPoints.count) / 4"
      statusLabel.text = "Açıklığın üst kenarındaki dört köşeye sırayla dokunun. Noktaları zemine değil, çukurun çerçevesine yerleştirin."
    case .base:
      countLabel.text = "TABAN NOKTALARI · \(basePoints.count) / 3"
      statusLabel.text = "Şimdi çukurun tabanında üç farklı noktaya dokunun. Bu noktalar gerçek derinliği hesaplar."
    }
    updateLiveHUD()
  }

  @objc private func placePoint(_ gesture: UITapGestureRecognizer) {
    guard !finished else { return }
    let location = gesture.location(in: arView)
    let hits = arView.raycast(from: location, allowing: .existingPlaneGeometry, alignment: .any)
    let fallback = hits.isEmpty ? arView.raycast(from: location, allowing: .estimatedPlane, alignment: .any) : hits
    guard let hit = fallback.first else { statusLabel.text = "Yüzey henüz algılanmadı. Telefonu yavaşça hareket ettirin ve noktayı tekrar seçin."; return }
    let point = SIMD3<Float>(hit.worldTransform.columns.3.x, hit.worldTransform.columns.3.y, hit.worldTransform.columns.3.z)
    if phase == .rim { rimPoints.append(point) } else { basePoints.append(point) }
    addMarker(at: location, color: phase == .rim ? .systemOrange : UIColor(red: 0.25, green: 0.92, blue: 0.93, alpha: 1))
    if rimPoints.count == 4 { phase = .base; drawRimOverlay() }
    if basePoints.count >= 3 { finishButton.isEnabled = true; finishButton.alpha = 1 }
    updateInstructions()
  }

  private func addMarker(at point: CGPoint, color: UIColor) {
    let marker = UIView(frame: CGRect(x: point.x - 10, y: point.y - 10, width: 20, height: 20))
    marker.layer.cornerRadius = 10; marker.backgroundColor = color; marker.layer.borderColor = UIColor.white.cgColor; marker.layer.borderWidth = 2; marker.isUserInteractionEnabled = false
    arView.addSubview(marker); markerViews.append(marker)
  }

  private func drawRimOverlay() {
    guard rimPoints.count == 4, markerViews.count >= 4 else { return }
    if dimensionLabels.count != 4 {
      dimensionLabels.forEach { $0.removeFromSuperview() }; dimensionLabels.removeAll()
      for _ in 0..<4 {
        let label = UILabel(); label.textColor = .black; label.backgroundColor = .white; label.font = .systemFont(ofSize: 14, weight: .bold); label.textAlignment = .center; label.layer.cornerRadius = 15; label.clipsToBounds = true; label.isUserInteractionEnabled = false
        arView.addSubview(label); dimensionLabels.append(label)
      }
    }
    let points = markerViews.prefix(4).map { $0.center }
    let path = UIBezierPath(); path.move(to: points[0]); path.addLine(to: points[1]); path.addLine(to: points[2]); path.addLine(to: points[3]); path.close()
    outlineLayer.path = path.cgPath
    for index in 0..<4 {
      let next = (index + 1) % 4
      let meters = simd_distance(rimPoints[index], rimPoints[next])
      let midpoint = CGPoint(x: (points[index].x + points[next].x) / 2, y: (points[index].y + points[next].y) / 2)
      let label = dimensionLabels[index]; label.text = String(format: "%.1f cm", meters * 100); label.frame = CGRect(x: midpoint.x - 38, y: midpoint.y - 15, width: 76, height: 30)
    }
  }

  private func updateLiveHUD() {
    guard rimPoints.count == 4 else { liveDimensionsLabel.text = "Ölçüm için 4 köşe seçin"; liveMaterialLabel.text = ""; return }
    let sides = [simd_distance(rimPoints[0], rimPoints[1]), simd_distance(rimPoints[1], rimPoints[2]), simd_distance(rimPoints[2], rimPoints[3]), simd_distance(rimPoints[3], rimPoints[0])]
    let length = max((sides[0] + sides[2]) / 2, (sides[1] + sides[3]) / 2)
    let width = min((sides[0] + sides[2]) / 2, (sides[1] + sides[3]) / 2)
    liveDimensionsLabel.text = String(format: "%.1f cm × %.1f cm", length * 100, width * 100)
    guard basePoints.count >= 3 else { liveMaterialLabel.text = "Derinlik için \(basePoints.count) / 3 taban noktası seçin"; return }
    let normal = simd_normalize(simd_cross(rimPoints[1] - rimPoints[0], rimPoints[3] - rimPoints[0]))
    let depth = basePoints.map { abs(simd_dot($0 - rimPoints[0], normal)) }.reduce(0, +) / Float(basePoints.count)
    let volume = length * width * depth; let kilograms = volume * 2_200; let buckets = Int(ceil(Double(kilograms) / 25))
    liveMaterialLabel.text = String(format: "Derinlik %.1f cm · %.1f kg · %d kova", depth * 100, kilograms, buckets)
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard !finished, rimPoints.count == 4 else { return }
    let orientation = view.window?.windowScene?.interfaceOrientation ?? .portrait
    let points = rimPoints + basePoints
    DispatchQueue.main.async {
      for (index, worldPoint) in points.enumerated() where index < self.markerViews.count {
        let projected = frame.camera.projectPoint(worldPoint, orientation: orientation, viewportSize: self.arView.bounds.size)
        if projected.x.isFinite && projected.y.isFinite { self.markerViews[index].center = projected }
      }
      self.drawRimOverlay()
    }
  }

  @objc private func undo() {
    if phase == .base, !basePoints.isEmpty { basePoints.removeLast() }
    else if phase == .base { phase = .rim; if !rimPoints.isEmpty { rimPoints.removeLast() } }
    else if !rimPoints.isEmpty { rimPoints.removeLast() }
    markerViews.popLast()?.removeFromSuperview()
    if rimPoints.count < 4 { outlineLayer.path = nil; dimensionLabels.forEach { $0.removeFromSuperview() }; dimensionLabels.removeAll() }
    finishButton.isEnabled = basePoints.count >= 3; finishButton.alpha = finishButton.isEnabled ? 1 : 0.45; updateInstructions()
  }

  @objc private func cancel() { guard !finished else { return }; finished = true; arView.session.pause(); onCancel?() }

  @objc private func finish() {
    guard rimPoints.count == 4, basePoints.count >= 3 else { return }
    let sideA = simd_distance(rimPoints[0], rimPoints[1]); let sideB = simd_distance(rimPoints[1], rimPoints[2]); let sideC = simd_distance(rimPoints[2], rimPoints[3]); let sideD = simd_distance(rimPoints[3], rimPoints[0])
    let length = max((sideA + sideC) / 2, (sideB + sideD) / 2); let width = min((sideA + sideC) / 2, (sideB + sideD) / 2)
    let normal = simd_normalize(simd_cross(rimPoints[1] - rimPoints[0], rimPoints[3] - rimPoints[0]))
    let depths = basePoints.map { abs(simd_dot($0 - rimPoints[0], normal)) }.sorted()
    let averageDepth = depths.reduce(0, +) / Float(depths.count); let maximumDepth = depths.last ?? averageDepth
    guard length >= 0.05, width >= 0.05, averageDepth >= 0.005 else { statusLabel.text = "Ölçü geçersiz. Kenar ve taban noktalarını tekrar seçin."; return }
    finished = true; arView.session.pause()
    let volume = length * width * averageDepth; let buckets = Int(ceil((Double(volume) * 2_200.0) / 25.0))
    onComplete?(["id": UUID().uuidString.lowercased(), "createdAt": ISO8601DateFormatter().string(from: Date()), "technology": "ios-lidar", "method": "arkit_lidar", "measurementMode": "operator-verified", "lengthCm": Double(length * 100), "widthCm": Double(width * 100), "depthCm": Double(averageDepth * 100), "buckets": buckets, "confidence": "high", "pointCount": rimPoints.count + basePoints.count, "lengthMeters": Double(length), "widthMeters": Double(width), "surfaceAreaSquareMeters": Double(length * width), "maximumDepthMeters": Double(maximumDepth), "averageDepthMeters": Double(averageDepth), "volumeCubicMeters": Double(volume), "qualityScore": 100, "validDepthPointCount": basePoints.count, "durationMs": Int(Date().timeIntervalSince(startedAt) * 1000)])
  }

  func session(_ session: ARSession, didFailWithError error: Error) { guard !finished else { return }; finished = true; onError?("LiDAR oturumu başlatılamadı: \(error.localizedDescription)") }
}

/**
 * LiDAR depth maps are sampled continuously while the camera is held over a
 * pothole. The user does not add points: a result is produced only after the
 * same detected region remains stable long enough for automatic validation.
 */
private final class AutoPotholeScanViewController: UIViewController, ARSessionDelegate {
  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?
  var onError: ((String) -> Void)?

  private let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
  private let titleLabel = UILabel()
  private let statusLabel = UILabel()
  private let progressLabel = UILabel()
  private let scanFrame = UIView()
  private let detectedRegion = UIView()
  private let scanLine = UIView()
  private let depthBadge = UILabel()
  private let cancelButton = UIButton(type: .system)
  private let confirmButton = UIButton(type: .system)
  private let brandImageView = UIImageView()
  // PNG has a real alpha channel. Do not use a non-alpha MOV here: AVPlayer
  // renders its black pixels as video pixels, which produces a black box over
  // the live camera view.
  private let productImageView = UIImageView()
  private var startedAt = Date()
  private var bestCandidate: AutomaticPotholeCandidate?
  private var stableFrames = 0
  private var lastCandidate: AutomaticPotholeCandidate?
  private var hasFinished = false
  private let modelQueue = DispatchQueue(label: "com.tekasfalt.pothole-inference", qos: .userInitiated)
  private var model: VNCoreMLModel?
  private var modelInferenceInFlight = false
  private var frameCounter = 0
  private var modelRegion: CGRect?
  private var modelScore: Float = 0
  private var lastModelRegion: CGRect?
  private var modelStableFrames = 0

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    arView.translatesAutoresizingMaskIntoConstraints = false
    arView.session.delegate = self
    view.addSubview(arView)
    NSLayoutConstraint.activate([
      arView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      arView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      arView.topAnchor.constraint(equalTo: view.topAnchor),
      arView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])
    setupOverlay()
    model = loadPotholeModel()
    if model == nil {
      statusLabel.text = "Çukur algılama modeli yüklenemedi. Uygulamayı yeniden yükleyin."
    }
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    startedAt = Date()
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal]
    configuration.environmentTexturing = .automatic
    configuration.frameSemantics.insert(.sceneDepth)
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.smoothedSceneDepth) {
      configuration.frameSemantics.insert(.smoothedSceneDepth)
    }
    arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
  }

  override func viewWillDisappear(_ animated: Bool) {
    arView.session.pause()
    super.viewWillDisappear(animated)
  }

  private func setupOverlay() {
    brandImageView.contentMode = .scaleAspectFit
    brandImageView.translatesAutoresizingMaskIntoConstraints = false
    brandImageView.image = scannerResource(named: "asfalt-to-go-logo", extension: "png")
    view.addSubview(brandImageView)

    titleLabel.text = "AR HASAR TARAMA"
    titleLabel.textColor = .white
    titleLabel.font = .monospacedSystemFont(ofSize: 11, weight: .bold)
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(titleLabel)

    progressLabel.text = "KAMERA + LiDAR DOĞRULAMA"
    progressLabel.textColor = UIColor(red: 0.91, green: 0.25, blue: 0.13, alpha: 1)
    progressLabel.font = .monospacedSystemFont(ofSize: 11, weight: .bold)
    progressLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(progressLabel)

    scanFrame.layer.borderColor = UIColor.clear.cgColor
    scanFrame.layer.borderWidth = 0
    scanFrame.layer.cornerRadius = 28
    scanFrame.backgroundColor = .clear
    scanFrame.isUserInteractionEnabled = false
    scanFrame.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(scanFrame)

    detectedRegion.layer.borderColor = UIColor(red: 0.91, green: 0.25, blue: 0.13, alpha: 0.98).cgColor
    detectedRegion.layer.borderWidth = 2.5
    detectedRegion.layer.cornerRadius = 16
    detectedRegion.backgroundColor = UIColor(red: 0.91, green: 0.25, blue: 0.13, alpha: 0.10)
    detectedRegion.isHidden = true
    detectedRegion.isUserInteractionEnabled = false
    scanFrame.addSubview(detectedRegion)

    scanLine.backgroundColor = UIColor.white.withAlphaComponent(0.28)
    scanLine.layer.shadowColor = UIColor.white.cgColor
    scanLine.layer.shadowOpacity = 0.9
    scanLine.layer.shadowRadius = 10
    scanLine.translatesAutoresizingMaskIntoConstraints = false
    scanFrame.addSubview(scanLine)

    depthBadge.text = "HASAR ALANI ARANIYOR"
    depthBadge.textColor = .white
    depthBadge.font = .monospacedSystemFont(ofSize: 11, weight: .bold)
    depthBadge.textAlignment = .center
    depthBadge.backgroundColor = UIColor(red: 0.06, green: 0.11, blue: 0.20, alpha: 0.86)
    depthBadge.layer.cornerRadius = 14
    depthBadge.clipsToBounds = true
    depthBadge.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(depthBadge)

    statusLabel.text = "Hasarı kadrajın ortasında ve net tutun."
    statusLabel.textColor = .white
    statusLabel.textAlignment = .center
    statusLabel.numberOfLines = 3
    statusLabel.font = .systemFont(ofSize: 14, weight: .semibold)
    statusLabel.backgroundColor = UIColor(red: 0.06, green: 0.11, blue: 0.20, alpha: 0.80)
    statusLabel.layer.cornerRadius = 20
    statusLabel.clipsToBounds = true
    statusLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(statusLabel)

    cancelButton.setImage(UIImage(systemName: "xmark"), for: .normal)
    cancelButton.tintColor = .white
    cancelButton.backgroundColor = UIColor.black.withAlphaComponent(0.62)
    cancelButton.layer.cornerRadius = 25
    cancelButton.addTarget(self, action: #selector(cancel), for: .touchUpInside)
    cancelButton.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(cancelButton)

    confirmButton.setTitle("Tarama devam ediyor", for: .normal)
    confirmButton.setTitleColor(.white, for: .normal)
    confirmButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
    confirmButton.backgroundColor = UIColor(red: 0.91, green: 0.25, blue: 0.13, alpha: 1)
    confirmButton.layer.cornerRadius = 25
    confirmButton.alpha = 0.72
    confirmButton.isEnabled = false
    confirmButton.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(confirmButton)

    productImageView.image = scannerResource(named: "ready-asphalt-product", extension: "png")
    productImageView.contentMode = .scaleAspectFit
    productImageView.isUserInteractionEnabled = false
    productImageView.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(productImageView)

    NSLayoutConstraint.activate([
      brandImageView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 22),
      brandImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
      brandImageView.widthAnchor.constraint(equalToConstant: 162), brandImageView.heightAnchor.constraint(equalToConstant: 38),
      titleLabel.leadingAnchor.constraint(equalTo: brandImageView.leadingAnchor),
      titleLabel.topAnchor.constraint(equalTo: brandImageView.bottomAnchor, constant: 4),
      progressLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
      progressLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 5),
      cancelButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
      cancelButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor),
      cancelButton.widthAnchor.constraint(equalToConstant: 50),
      cancelButton.heightAnchor.constraint(equalToConstant: 50),
      scanFrame.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 18),
      scanFrame.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -18),
      scanFrame.topAnchor.constraint(equalTo: progressLabel.bottomAnchor, constant: 10),
      scanFrame.bottomAnchor.constraint(equalTo: statusLabel.topAnchor, constant: -18),
      scanLine.leadingAnchor.constraint(equalTo: scanFrame.leadingAnchor, constant: 14),
      scanLine.trailingAnchor.constraint(equalTo: scanFrame.trailingAnchor, constant: -14),
      scanLine.centerYAnchor.constraint(equalTo: scanFrame.centerYAnchor),
      scanLine.heightAnchor.constraint(equalToConstant: 2),
      depthBadge.centerXAnchor.constraint(equalTo: scanFrame.centerXAnchor),
      depthBadge.bottomAnchor.constraint(equalTo: scanFrame.bottomAnchor, constant: -14),
      depthBadge.widthAnchor.constraint(equalToConstant: 238),
      depthBadge.heightAnchor.constraint(equalToConstant: 32),
      confirmButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 18),
      confirmButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -18),
      confirmButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
      confirmButton.heightAnchor.constraint(equalToConstant: 54),
      productImageView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
      productImageView.bottomAnchor.constraint(equalTo: confirmButton.topAnchor, constant: 0),
      productImageView.widthAnchor.constraint(equalToConstant: 106), productImageView.heightAnchor.constraint(equalToConstant: 128),
      statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 18),
      statusLabel.trailingAnchor.constraint(equalTo: productImageView.leadingAnchor, constant: -10),
      statusLabel.bottomAnchor.constraint(equalTo: confirmButton.topAnchor, constant: -22),
      statusLabel.heightAnchor.constraint(greaterThanOrEqualToConstant: 72)
    ])
    let sweep = CABasicAnimation(keyPath: "position.y")
    sweep.fromValue = 24
    sweep.toValue = 180
    sweep.duration = 2.2
    sweep.autoreverses = true
    sweep.repeatCount = .infinity
    scanLine.layer.add(sweep, forKey: "lidarSweep")
  }

  private func scannerResourceURL(named name: String, extension fileExtension: String) -> URL? {
    let bundles = [Bundle.main] + Bundle.allBundles + Bundle.allFrameworks
    return bundles.lazy.compactMap { $0.url(forResource: name, withExtension: fileExtension) }.first
  }

  private func scannerResource(named name: String, extension fileExtension: String) -> UIImage? {
    guard let url = scannerResourceURL(named: name, extension: fileExtension) else { return nil }
    return UIImage(contentsOfFile: url.path)
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard !hasFinished else { return }
    frameCounter += 1
    if frameCounter % 8 == 0 { runPotholeModel(on: frame.capturedImage) }
    guard let depthData = frame.smoothedSceneDepth ?? frame.sceneDepth else { return }
    // LiDAR never proposes a target on its own. It is limited to the region
    // classified as a pothole by the on-device vision model.
    if let region = modelRegion,
       let candidate = detectPothole(depthData: depthData, frame: frame, within: region) {
      if let previous = lastCandidate,
         abs(candidate.length - previous.length) / max(previous.length, 0.01) < 0.08,
         abs(candidate.width - previous.width) / max(previous.width, 0.01) < 0.08,
         abs(candidate.depth - previous.depth) / max(previous.depth, 0.01) < 0.12 {
        stableFrames += 1
      } else {
        stableFrames = 1
      }
      lastCandidate = candidate
      // Keep the most recent stable geometry rather than the largest historic
      // component; this prevents a previously seen object from becoming the
      // final measurement after the camera is moved back to the target.
      if bestCandidate == nil || stableFrames >= 30 {
        bestCandidate = candidate
      }
    } else {
      stableFrames = max(0, stableFrames - 2)
    }
    let elapsed = Date().timeIntervalSince(startedAt)
    DispatchQueue.main.async {
      let percent = min(100, Int((Double(self.stableFrames) / 120.0) * 100))
      self.progressLabel.text = self.modelRegion == nil ? "HASAR TESPİTİ" : "LİDAR DOĞRULAMA · %\(percent)"
      if let region = self.modelRegion {
        // The outline belongs to the vision model and is shown immediately;
        // it must not wait for the separate LiDAR measurement to stabilise.
        self.renderModelRegion(region)
      } else {
        self.detectedRegion.isHidden = true
      }
      if let best = self.bestCandidate, self.stableFrames >= 30 {
        self.renderDetectedRegion(best)
        self.depthBadge.text = String(format: "%.0f × %.0f CM · DERİNLİK ~%.1f CM", best.length * 100, best.width * 100, best.depth * 100)
        if self.stableFrames >= 120 && elapsed >= 12 {
          self.confirmButton.alpha = 1
          self.confirmButton.setTitle("Ölçüm tamamlanıyor…", for: .normal)
          self.statusLabel.text = "Algılanan alan doğrulandı · kararlılık %\(percent)\nÖlçüm verileri otomatik hazırlanıyor."
          self.confirmCapture()
        } else {
          self.statusLabel.text = "İşaretlenen hasar alanı LiDAR ile ölçülüyor.\nTelefonu sabit tutun."
        }
      } else {
      self.statusLabel.text = self.modelRegion == nil
        ? "Çukur aranıyor… Alanı kadrajın ortasında ve net tutun."
        : "Çukur bulundu; LiDAR derinliği doğrulanıyor. Telefonu sabit tutun."
      }
    }
  }

  private func loadPotholeModel() -> VNCoreMLModel? {
    let bundles = [Bundle.main] + Bundle.allBundles + Bundle.allFrameworks
    guard let url = bundles.lazy.compactMap({ $0.url(forResource: "pothole-yolov8n", withExtension: "mlmodelc") }).first else {
      return nil
    }
    return try? VNCoreMLModel(for: MLModel(contentsOf: url))
  }

  private func runPotholeModel(on pixelBuffer: CVPixelBuffer) {
    guard let model, !modelInferenceInFlight else { return }
    modelInferenceInFlight = true
    modelQueue.async { [weak self] in
      guard let self else { return }
      let request = VNCoreMLRequest(model: model) { [weak self] request, _ in
        guard let self else { return }
        let detection = self.decodePotholeDetection(request.results)
        DispatchQueue.main.async {
          self.modelInferenceInFlight = false
          guard let detection else {
            self.modelStableFrames = 0
            self.lastModelRegion = nil
            self.modelRegion = nil
            self.modelScore = 0
            self.depthBadge.text = "HASAR ALANI ARANIYOR"
            return
          }
          // A single neural-network frame is not evidence. The same outline
          // must be visible on three consecutive inference passes before the
          // LiDAR pipeline is allowed to measure it. This rejects cables,
          // drain covers and momentary false positives.
          if let previous = self.lastModelRegion, self.overlap(previous, detection.region) >= 0.55 {
            self.modelStableFrames += 1
          } else {
            self.modelStableFrames = 1
          }
          self.lastModelRegion = detection.region
          self.modelScore = detection.score
          self.modelRegion = self.modelStableFrames >= 3 ? detection.region : nil
          self.depthBadge.text = self.modelRegion == nil ? "HASAR DOĞRULANIYOR" : "HASAR BULUNDU · LİDAR ÖLÇÜMÜ"
        }
      }
      request.imageCropAndScaleOption = .scaleFill
      let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .right, options: [:])
      try? handler.perform([request])
      // Vision may not invoke the completion after a failed request.
      DispatchQueue.main.async { self.modelInferenceInFlight = false }
    }
  }

  private func decodePotholeDetection(_ results: [Any]?) -> (region: CGRect, score: Float)? {
    guard let observations = results as? [VNCoreMLFeatureValueObservation],
          let prediction = observations.first(where: { $0.featureName == "var_1011" })?.featureValue.multiArrayValue else { return nil }
    // YOLOv8-seg output: [1, 37, 8400] = x, y, w, h, pothole score, 32 mask coefficients.
    // This is a recall-first field tool: show the candidate outline early,
    // then let LiDAR temporal stability decide whether a measurement is valid.
    // A high classification threshold was hiding obvious deep defects.
    // Do not draw a target from weak YOLO guesses. These are the guesses that
    // previously caused electrical covers and cables to be measured as pits.
    var bestScore: Float = 0.40
    var bestRegion: CGRect?
    for index in 0..<8400 {
      func value(_ channel: Int) -> Float {
        let key: [NSNumber] = [NSNumber(value: 0), NSNumber(value: channel), NSNumber(value: index)]
        return (prediction[key] as? NSNumber)?.floatValue ?? 0
      }
      let score = value(4)
      guard score > bestScore else { continue }
      let x = value(0)
      let y = value(1)
      let width = value(2)
      let height = value(3)
      let scale: Float = max(abs(x), abs(y), abs(width), abs(height)) > 2 ? 640 : 1
      let rect = CGRect(x: CGFloat((x - width / 2) / scale), y: CGFloat((y - height / 2) / scale), width: CGFloat(width / scale), height: CGFloat(height / scale)).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
      guard rect.width > 0.08, rect.height > 0.06 else { continue }
      bestScore = score
      bestRegion = rect
    }
    guard let bestRegion else { return nil }
    return (bestRegion, bestScore)
  }

  private func overlap(_ lhs: CGRect, _ rhs: CGRect) -> CGFloat {
    let intersection = lhs.intersection(rhs)
    guard !intersection.isNull else { return 0 }
    let union = lhs.width * lhs.height + rhs.width * rhs.height - intersection.width * intersection.height
    return union > 0 ? (intersection.width * intersection.height) / union : 0
  }

  private func detectPothole(depthData: ARDepthData, frame: ARFrame, within modelRegion: CGRect) -> AutomaticPotholeCandidate? {
    let depthMap = depthData.depthMap
    let mapWidth = CVPixelBufferGetWidth(depthMap)
    let mapHeight = CVPixelBufferGetHeight(depthMap)
    guard mapWidth > 20, mapHeight > 20 else { return nil }
    let step = 4
    let padding: CGFloat = 0.08
    let expanded = modelRegion.insetBy(dx: -padding, dy: -padding).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
    let startX = max(mapWidth / 5, Int(expanded.minX * CGFloat(mapWidth)))
    let endX = min(mapWidth * 4 / 5, Int(expanded.maxX * CGFloat(mapWidth)))
    let startY = max(mapHeight * 3 / 10, Int(expanded.minY * CGFloat(mapHeight)))
    let endY = min(mapHeight * 4 / 5, Int(expanded.maxY * CGFloat(mapHeight)))
    guard endX - startX > 20, endY - startY > 20 else { return nil }
    let columns = max(1, (endX - startX) / step)
    let rows = max(1, (endY - startY) / step)
    var samples = Array(repeating: Float.zero, count: rows * columns)
    var validDepths: [Float] = []

    CVPixelBufferLockBaseAddress(depthMap, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }
    guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else { return nil }
    let rowStride = CVPixelBufferGetBytesPerRow(depthMap) / MemoryLayout<Float32>.size
    let values = baseAddress.assumingMemoryBound(to: Float32.self)
    for row in 0..<rows {
      for column in 0..<columns {
        let x = min(endX - 1, startX + column * step)
        let y = min(endY - 1, startY + row * step)
        let depth = values[y * rowStride + x]
        if depth.isFinite && depth > 0.15 && depth < 5.0 {
          samples[row * columns + column] = depth
          validDepths.append(depth)
        }
      }
    }
    guard validDepths.count > 60 else { return nil }
    validDepths.sort()
    let baseDepth = validDepths[validDepths.count / 2]
    // A shallow depth discontinuity around cable, cover or paving joints is
    // not a pothole. Require a meaningful recessed area before exposing it.
    let threshold = max(0.035, min(0.14, baseDepth * 0.055))
    var mask = Array(repeating: false, count: rows * columns)
    for index in samples.indices {
      mask[index] = samples[index] > baseDepth + threshold
    }

    var visited = Array(repeating: false, count: mask.count)
    var best: (score: Int, count: Int, minRow: Int, maxRow: Int, minCol: Int, maxCol: Int, averageDepth: Float, indices: [Int])?
    let middleRow = rows / 2
    let middleCol = columns / 2
    for index in mask.indices where mask[index] && !visited[index] {
      var queue = [index]
      var cursor = 0
      visited[index] = true
      var count = 0
      var sum: Float = 0
      var componentIndices: [Int] = []
      var minRow = rows, maxRow = 0, minCol = columns, maxCol = 0
      while cursor < queue.count {
        let current = queue[cursor]
        cursor += 1
        let row = current / columns
        let col = current % columns
        count += 1
        sum += samples[current]
        componentIndices.append(current)
        minRow = min(minRow, row); maxRow = max(maxRow, row)
        minCol = min(minCol, col); maxCol = max(maxCol, col)
        for (nextRow, nextCol) in [(row - 1, col), (row + 1, col), (row, col - 1), (row, col + 1)] {
          guard nextRow >= 0, nextRow < rows, nextCol >= 0, nextCol < columns else { continue }
          let next = nextRow * columns + nextCol
          if mask[next] && !visited[next] { visited[next] = true; queue.append(next) }
        }
      }
      // Prefer a reasonably sized component close to the center reticle.
      let componentCenterRow = (minRow + maxRow) / 2
      let componentCenterCol = (minCol + maxCol) / 2
      let distancePenalty = abs(componentCenterRow - middleRow) + abs(componentCenterCol - middleCol)
      let adjustedCount = count - distancePenalty
      if count >= 14 && (best == nil || adjustedCount > best!.score) {
        best = (adjustedCount, count, minRow, maxRow, minCol, maxCol, sum / Float(count), componentIndices)
      }
    }
    guard let component = best else { return nil }
    let imageSize = frame.camera.imageResolution
    let scaleX = Float(mapWidth) / Float(imageSize.width)
    let scaleY = Float(mapHeight) / Float(imageSize.height)
    let intrinsics = frame.camera.intrinsics
    let fx = intrinsics.columns.0.x * scaleX
    let fy = intrinsics.columns.1.y * scaleY
    guard fx > 0, fy > 0 else { return nil }
    let componentWidthPixels = Float((component.maxCol - component.minCol + 1) * step)
    let componentHeightPixels = Float((component.maxRow - component.minRow + 1) * step)
    let horizontal = component.averageDepth * componentWidthPixels / fx
    let vertical = component.averageDepth * componentHeightPixels / fy
    let length = max(horizontal, vertical)
    let width = min(horizontal, vertical)

    // Calculate the detected depression cell-by-cell. This replaces the old
    // bounding-rectangle × fixed-depth coefficient estimate, which was a
    // major source of systematic error for irregular pothole shapes.
    var depthDeltas: [Float] = []
    var surfaceArea: Float = 0
    var volume: Float = 0
    for index in component.indices {
      let cellDepth = samples[index]
      let delta = max(0, cellDepth - baseDepth)
      guard delta.isFinite, cellDepth.isFinite, delta > 0 else { continue }
      let cellWidth = cellDepth * Float(step) / fx
      let cellHeight = cellDepth * Float(step) / fy
      let cellArea = cellWidth * cellHeight
      guard cellArea.isFinite, cellArea > 0 else { continue }
      depthDeltas.append(delta)
      surfaceArea += cellArea
      volume += delta * cellArea
    }
    guard surfaceArea > 0, volume > 0, !depthDeltas.isEmpty else { return nil }
    depthDeltas.sort()
    // A 90th-percentile depth rejects isolated LiDAR spikes while still
    // reporting a useful maximum-depth proxy to the result screen.
    let depth = depthDeltas[min(depthDeltas.count - 1, Int(Float(depthDeltas.count - 1) * 0.90))]
    let averageDepth = volume / surfaceArea
    guard length >= 0.12, width >= 0.10, averageDepth >= 0.03, length <= 5, width <= 5, depth <= 0.45 else { return nil }
    // Geometry quality is combined with temporal stability at completion.
    let quality = min(90, max(45, 42 + component.count * 2))
    let normalizedBounds = CGRect(
      x: CGFloat(startX + component.minCol * step) / CGFloat(mapWidth),
      y: CGFloat(startY + component.minRow * step) / CGFloat(mapHeight),
      width: CGFloat((component.maxCol - component.minCol + 1) * step) / CGFloat(mapWidth),
      height: CGFloat((component.maxRow - component.minRow + 1) * step) / CGFloat(mapHeight)
    ).insetBy(dx: -0.015, dy: -0.015)
    return AutomaticPotholeCandidate(length: length, width: width, depth: depth, surfaceArea: surfaceArea, volume: volume, averageDepth: averageDepth, pixelCount: max(0, component.count), quality: quality, normalizedBounds: normalizedBounds)
  }

  private func renderDetectedRegion(_ candidate: AutomaticPotholeCandidate) {
    let container = scanFrame.bounds.insetBy(dx: 8, dy: 8)
    guard container.width > 0, container.height > 0 else { return }
    let normalized = candidate.normalizedBounds
    let originX = max(0, min(1, normalized.minX))
    let originY = max(0, min(1, normalized.minY))
    let width = min(1 - originX, normalized.width)
    let height = min(1 - originY, normalized.height)
    detectedRegion.frame = CGRect(
      x: container.minX + originX * container.width,
      y: container.minY + originY * container.height,
      width: max(38, width * container.width),
      height: max(38, height * container.height)
    )
    detectedRegion.isHidden = false
  }

  private func renderModelRegion(_ region: CGRect) {
    let container = scanFrame.bounds.insetBy(dx: 8, dy: 8)
    guard container.width > 0, container.height > 0 else { return }
    let rect = region.intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
    detectedRegion.frame = CGRect(
      x: container.minX + rect.minX * container.width,
      y: container.minY + rect.minY * container.height,
      width: max(44, rect.width * container.width),
      height: max(44, rect.height * container.height)
    )
    detectedRegion.isHidden = false
  }

  @objc private func confirmCapture() {
    guard !hasFinished else { return }
    guard let result = bestCandidate, stableFrames >= 120, Date().timeIntervalSince(startedAt) >= 12 else {
      statusLabel.text = "Tarama henüz yeterli kararlılığa ulaşmadı. Çukuru çerçevenin içinde tutun."
      return
    }
    hasFinished = true
    arView.session.pause()
    let stabilityQuality = min(94, max(45, Int((Double(stableFrames) / 120.0) * 94.0)))
    let volume = result.volume
    let buckets = Int(ceil((Double(volume) * 2_200.0) / 25.0))
    onComplete?([
      "id": UUID().uuidString.lowercased(),
      "createdAt": ISO8601DateFormatter().string(from: Date()),
      "technology": "ios-lidar",
      "method": "arkit_lidar",
      "lengthCm": Double(result.length * 100),
      "widthCm": Double(result.width * 100),
      "depthCm": Double(result.depth * 100),
      "buckets": buckets,
      "confidence": stabilityQuality >= 75 ? "high" : "medium",
      "pointCount": result.pixelCount,
      "lengthMeters": Double(result.length),
      "widthMeters": Double(result.width),
      "surfaceAreaSquareMeters": Double(result.surfaceArea),
      "maximumDepthMeters": Double(result.depth),
      "averageDepthMeters": Double(result.averageDepth),
      "volumeCubicMeters": Double(volume),
      "qualityScore": stabilityQuality,
      "validDepthPointCount": result.pixelCount,
      "durationMs": Int(Date().timeIntervalSince(startedAt) * 1000)
    ])
  }

  @objc private func cancel() {
    guard !hasFinished else { return }
    hasFinished = true
    arView.session.pause()
    onCancel?()
  }

  func session(_ session: ARSession, didFailWithError error: Error) {
    guard !hasFinished else { return }
    hasFinished = true
    session.pause()
    onError?("LiDAR oturumu başlatılamadı: \(error.localizedDescription)")
  }
}

/**
 * Collects real AR mesh coverage but intentionally does not invent a volume.
 * A future calibrated processing stage will turn a validated mesh into m³.
 */
private final class StockpileCaptureViewController: UIViewController, ARSessionDelegate {
  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?
  var onError: ((String) -> Void)?

  private let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
  private let titleLabel = UILabel()
  private let statusLabel = UILabel()
  private let completeButton = UIButton(type: .system)
  private let closeButton = UIButton(type: .system)
  private var meshAnchors: [UUID: Int] = [:]
  private var finished = false
  private let startedAt = Date()

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    arView.translatesAutoresizingMaskIntoConstraints = false
    arView.session.delegate = self
    view.addSubview(arView)
    NSLayoutConstraint.activate([
      arView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      arView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      arView.topAnchor.constraint(equalTo: view.topAnchor),
      arView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])
    setupOverlay()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    configuration.environmentTexturing = .automatic
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
      configuration.frameSemantics.insert(.sceneDepth)
    }
    if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
      configuration.sceneReconstruction = .mesh
    }
    arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
  }

  override func viewWillDisappear(_ animated: Bool) {
    arView.session.pause()
    super.viewWillDisappear(animated)
  }

  private func setupOverlay() {
    titleLabel.text = "Stok yığını taraması · Beta"
    titleLabel.textColor = .white
    titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(titleLabel)

    statusLabel.text = "Yığının çevresinde yavaşça yürüyün · kapsama hazırlanıyor"
    statusLabel.textColor = UIColor.white.withAlphaComponent(0.88)
    statusLabel.numberOfLines = 3
    statusLabel.font = .systemFont(ofSize: 15, weight: .semibold)
    statusLabel.backgroundColor = UIColor.black.withAlphaComponent(0.62)
    statusLabel.layer.cornerRadius = 14
    statusLabel.clipsToBounds = true
    statusLabel.textAlignment = .center
    statusLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(statusLabel)

    closeButton.setImage(UIImage(systemName: "xmark"), for: .normal)
    closeButton.tintColor = .white
    closeButton.backgroundColor = UIColor.black.withAlphaComponent(0.62)
    closeButton.layer.cornerRadius = 24
    closeButton.addTarget(self, action: #selector(cancel), for: .touchUpInside)
    closeButton.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(closeButton)

    completeButton.setTitle("Taramayı kaydet", for: .normal)
    completeButton.setTitleColor(.white, for: .normal)
    completeButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
    completeButton.backgroundColor = UIColor(red: 1, green: 0.42, blue: 0.08, alpha: 1)
    completeButton.layer.cornerRadius = 26
    completeButton.addTarget(self, action: #selector(finish), for: .touchUpInside)
    completeButton.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(completeButton)

    NSLayoutConstraint.activate([
      titleLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 22),
      titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
      closeButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
      closeButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor),
      closeButton.widthAnchor.constraint(equalToConstant: 48),
      closeButton.heightAnchor.constraint(equalToConstant: 48),
      statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 18),
      statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -18),
      statusLabel.bottomAnchor.constraint(equalTo: completeButton.topAnchor, constant: -12),
      statusLabel.heightAnchor.constraint(greaterThanOrEqualToConstant: 70),
      completeButton.leadingAnchor.constraint(equalTo: statusLabel.leadingAnchor),
      completeButton.trailingAnchor.constraint(equalTo: statusLabel.trailingAnchor),
      completeButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -18),
      completeButton.heightAnchor.constraint(equalToConstant: 54)
    ])
  }

  private func updateCoverage() {
    let anchorCount = meshAnchors.count
    let vertexCount = meshAnchors.values.reduce(0, +)
    let score = min(100, Int(Double(vertexCount) / 220.0))
    let quality = score >= 60 ? "Yeterli kapsama" : "Tarama sürüyor"
    statusLabel.text = "(quality) · (anchorCount) yüzey alanı · kalite %(score)\nYığının görünmeyen taraflarını ve taban çevresini de tarayın."
    completeButton.alpha = score >= 25 ? 1 : 0.62
  }

  func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    updateMeshAnchors(anchors)
  }

  func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    updateMeshAnchors(anchors)
  }

  private func updateMeshAnchors(_ anchors: [ARAnchor]) {
    var changed = false
    for case let anchor as ARMeshAnchor in anchors {
      meshAnchors[anchor.identifier] = anchor.geometry.vertices.count
      changed = true
    }
    if changed { DispatchQueue.main.async { self.updateCoverage() } }
  }

  @objc private func cancel() {
    guard !finished else { return }
    finished = true
    arView.session.pause()
    onCancel?()
  }

  @objc private func finish() {
    guard !finished else { return }
    let vertexCount = meshAnchors.values.reduce(0, +)
    guard vertexCount > 0 else {
      statusLabel.text = "Henüz yeterli yüzey verisi yok. Yığının çevresinde yürüyerek taramayı sürdürün."
      return
    }
    finished = true
    arView.session.pause()
    let score = min(100, Int(Double(vertexCount) / 220.0))
    onComplete?([
      "id": UUID().uuidString.lowercased(),
      "createdAt": ISO8601DateFormatter().string(from: Date()),
      "captureState": "captured",
      "technology": "ios-lidar-mesh",
      "meshAnchorCount": meshAnchors.count,
      "meshVertexCount": vertexCount,
      "coverageScore": score,
      "quality": score >= 60 ? "ready" : "needs-more-coverage",
      "durationMs": Int(Date().timeIntervalSince(startedAt) * 1000),
      "requiresVolumeProcessing": true
    ])
  }

  func session(_ session: ARSession, didFailWithError error: Error) {
    guard !finished else { return }
    finished = true
    session.pause()
    onError?("ARKit stok tarama oturumu başlatılamadı: \(error.localizedDescription)")
  }
}

private enum MeasureAxis: Int, CaseIterable {
  case length, width, depth

  var title: String {
    switch self {
    case .length: return "Uzunluk"
    case .width: return "Genişlik"
    case .depth: return "Derinlik"
    }
  }
}

private final class MeasurementViewController: UIViewController, ARSessionDelegate {
  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?
  var onError: ((String) -> Void)?

  private let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
  private let instruction = UILabel()
  private let status = UILabel()
  private let valueLabel = UILabel()
  private let reticle = UIImageView(image: UIImage(systemName: "scope"))
  private let captureButton = UIButton(type: .system)
  private let finishButton = UIButton(type: .system)
  private let axisControl = UISegmentedControl(items: MeasureAxis.allCases.map(\.title))
  private var measurements: [MeasureAxis: Float] = [:]
  private var firstPoint: SIMD3<Float>?
  private var anchors: [AnchorEntity] = []
  private var hasFinished = false
  private let startedAt = Date()

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    setupAR()
    setupUI()
    updateUI()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    startSession()
  }

  override func viewWillDisappear(_ animated: Bool) {
    arView.session.pause()
    super.viewWillDisappear(animated)
  }

  private func setupAR() {
    arView.translatesAutoresizingMaskIntoConstraints = false
    arView.session.delegate = self
    view.addSubview(arView)
    NSLayoutConstraint.activate([
      arView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      arView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      arView.topAnchor.constraint(equalTo: view.topAnchor),
      arView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])
  }

  private func startSession() {
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    configuration.environmentTexturing = .automatic
    arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
    status.text = "Yüzey aranıyor · telefonu yavaşça hareket ettirin"
  }

  private func setupUI() {
    let close = circleButton(symbol: "xmark")
    close.addTarget(self, action: #selector(cancel), for: .touchUpInside)
    view.addSubview(close)

    let undoButton = circleButton(symbol: "arrow.uturn.backward")
    undoButton.addTarget(self, action: #selector(undoLastPoint), for: .touchUpInside)
    view.addSubview(undoButton)

    reticle.tintColor = .white
    reticle.contentMode = .scaleAspectFit
    reticle.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(reticle)

    valueLabel.textColor = .black
    valueLabel.backgroundColor = .white
    valueLabel.font = .monospacedDigitSystemFont(ofSize: 24, weight: .bold)
    valueLabel.textAlignment = .center
    valueLabel.layer.cornerRadius = 22
    valueLabel.clipsToBounds = true
    valueLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(valueLabel)

    let panel = UIVisualEffectView(effect: UIBlurEffect(style: .systemChromeMaterialDark))
    panel.layer.cornerRadius = 26
    panel.clipsToBounds = true
    panel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(panel)

    instruction.textColor = .white
    instruction.font = .systemFont(ofSize: 18, weight: .bold)
    instruction.numberOfLines = 2
    instruction.translatesAutoresizingMaskIntoConstraints = false
    status.textColor = UIColor.white.withAlphaComponent(0.72)
    status.font = .systemFont(ofSize: 12, weight: .semibold)
    status.numberOfLines = 2
    status.translatesAutoresizingMaskIntoConstraints = false
    axisControl.selectedSegmentIndex = 0
    axisControl.selectedSegmentTintColor = UIColor(red: 1, green: 0.42, blue: 0.08, alpha: 1)
    axisControl.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
    axisControl.setTitleTextAttributes([.foregroundColor: UIColor.white.withAlphaComponent(0.72)], for: .normal)
    axisControl.addTarget(self, action: #selector(axisChanged), for: .valueChanged)
    axisControl.translatesAutoresizingMaskIntoConstraints = false

    captureButton.setTitle("Noktayı işaretle", for: .normal)
    captureButton.setTitleColor(.white, for: .normal)
    captureButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
    captureButton.backgroundColor = UIColor(red: 1, green: 0.42, blue: 0.08, alpha: 1)
    captureButton.layer.cornerRadius = 26
    captureButton.addTarget(self, action: #selector(capturePoint), for: .touchUpInside)
    captureButton.translatesAutoresizingMaskIntoConstraints = false

    finishButton.setTitle("Ölçümü kullan", for: .normal)
    finishButton.setTitleColor(.white, for: .normal)
    finishButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .bold)
    finishButton.backgroundColor = UIColor(red: 0.08, green: 0.15, blue: 0.30, alpha: 1)
    finishButton.layer.cornerRadius = 22
    finishButton.addTarget(self, action: #selector(finish), for: .touchUpInside)
    finishButton.translatesAutoresizingMaskIntoConstraints = false

    [instruction, status, axisControl, captureButton, finishButton].forEach(panel.contentView.addSubview)

    NSLayoutConstraint.activate([
      close.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 18),
      close.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
      close.widthAnchor.constraint(equalToConstant: 50),
      close.heightAnchor.constraint(equalToConstant: 50),
      undoButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -18),
      undoButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
      undoButton.widthAnchor.constraint(equalToConstant: 50),
      undoButton.heightAnchor.constraint(equalToConstant: 50),
      reticle.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      reticle.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -42),
      reticle.widthAnchor.constraint(equalToConstant: 74),
      reticle.heightAnchor.constraint(equalToConstant: 74),
      valueLabel.centerXAnchor.constraint(equalTo: reticle.centerXAnchor),
      valueLabel.topAnchor.constraint(equalTo: reticle.bottomAnchor, constant: 9),
      valueLabel.widthAnchor.constraint(equalToConstant: 142),
      valueLabel.heightAnchor.constraint(equalToConstant: 44),
      panel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 14),
      panel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -14),
      panel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12),
      instruction.leadingAnchor.constraint(equalTo: panel.contentView.leadingAnchor, constant: 18),
      instruction.trailingAnchor.constraint(equalTo: panel.contentView.trailingAnchor, constant: -18),
      instruction.topAnchor.constraint(equalTo: panel.contentView.topAnchor, constant: 17),
      status.leadingAnchor.constraint(equalTo: instruction.leadingAnchor),
      status.trailingAnchor.constraint(equalTo: instruction.trailingAnchor),
      status.topAnchor.constraint(equalTo: instruction.bottomAnchor, constant: 5),
      axisControl.leadingAnchor.constraint(equalTo: instruction.leadingAnchor),
      axisControl.trailingAnchor.constraint(equalTo: instruction.trailingAnchor),
      axisControl.topAnchor.constraint(equalTo: status.bottomAnchor, constant: 14),
      axisControl.heightAnchor.constraint(equalToConstant: 38),
      captureButton.leadingAnchor.constraint(equalTo: instruction.leadingAnchor),
      captureButton.trailingAnchor.constraint(equalTo: instruction.trailingAnchor),
      captureButton.topAnchor.constraint(equalTo: axisControl.bottomAnchor, constant: 12),
      captureButton.heightAnchor.constraint(equalToConstant: 54),
      finishButton.leadingAnchor.constraint(equalTo: instruction.leadingAnchor),
      finishButton.trailingAnchor.constraint(equalTo: instruction.trailingAnchor),
      finishButton.topAnchor.constraint(equalTo: captureButton.bottomAnchor, constant: 9),
      finishButton.heightAnchor.constraint(equalToConstant: 46),
      finishButton.bottomAnchor.constraint(equalTo: panel.contentView.bottomAnchor, constant: -16)
    ])
  }

  private func circleButton(symbol: String) -> UIButton {
    let button = UIButton(type: .system)
    button.setImage(UIImage(systemName: symbol), for: .normal)
    button.tintColor = .white
    button.backgroundColor = UIColor.black.withAlphaComponent(0.58)
    button.layer.cornerRadius = 25
    button.translatesAutoresizingMaskIntoConstraints = false
    return button
  }

  private var currentAxis: MeasureAxis {
    MeasureAxis(rawValue: axisControl.selectedSegmentIndex) ?? .length
  }

  @objc private func axisChanged() {
    firstPoint = nil
    updateUI()
  }

  @objc private func capturePoint() {
    let center = CGPoint(x: arView.bounds.midX, y: arView.bounds.midY - 42)
    guard let point = measuredWorldPoint(at: center) else {
      status.text = "Nokta bulunamadı · telefonu yüzeye paralel tutup tekrar deneyin"
      UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
      return
    }
    addMarker(at: point)

    if let start = firstPoint {
      let distance = simd_distance(start, point)
      guard distance >= 0.005, distance <= 8 else {
        status.text = "İki nokta çok yakın veya ölçüm aralığı dışında"
        return
      }
      measurements[currentAxis] = distance
      addLine(from: start, to: point)
      firstPoint = nil
      UINotificationFeedbackGenerator().notificationOccurred(.success)
      if currentAxis.rawValue < MeasureAxis.allCases.count - 1 {
        axisControl.selectedSegmentIndex = currentAxis.rawValue + 1
      }
    } else {
      firstPoint = point
      UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    updateUI()
  }

  private func measuredWorldPoint(at screenPoint: CGPoint) -> SIMD3<Float>? {
    if let result = arView.raycast(from: screenPoint, allowing: .estimatedPlane, alignment: .any).first {
      let column = result.worldTransform.columns.3
      return SIMD3<Float>(column.x, column.y, column.z)
    }
    guard let frame = arView.session.currentFrame,
          let featurePoints = frame.rawFeaturePoints?.points else { return nil }
    let cameraColumn = frame.camera.transform.columns.3
    let camera = SIMD3<Float>(cameraColumn.x, cameraColumn.y, cameraColumn.z)
    return featurePoints
      .compactMap { point -> (SIMD3<Float>, CGFloat, Float)? in
        guard let projected = arView.project(point) else { return nil }
        let screenDistance = hypot(projected.x - screenPoint.x, projected.y - screenPoint.y)
        let cameraDistance = simd_distance(camera, point)
        guard screenDistance < 55, cameraDistance > 0.12, cameraDistance < 4 else { return nil }
        return (point, screenDistance, cameraDistance)
      }
      .sorted { left, right in
        left.1 == right.1 ? left.2 < right.2 : left.1 < right.1
      }
      .first?.0
  }

  @objc private func undoLastPoint() {
    if firstPoint != nil {
      firstPoint = nil
    } else {
      measurements[currentAxis] = nil
    }
    if let anchor = anchors.popLast() {
      arView.scene.removeAnchor(anchor)
    }
    updateUI()
  }

  @objc private func cancel() {
    guard !hasFinished else { return }
    hasFinished = true
    arView.session.pause()
    onCancel?()
  }

  @objc private func finish() {
    guard !hasFinished,
          let length = measurements[.length],
          let width = measurements[.width],
          let depth = measurements[.depth] else { return }
    hasFinished = true
    arView.session.pause()
    let area = length * width
    let volume = area * depth * 0.65
    let bucketCount = Int(ceil((Double(volume) * 2_200.0) / 25.0))
    onComplete?([
      "id": UUID().uuidString.lowercased(),
      "createdAt": ISO8601DateFormatter().string(from: Date()),
      "technology": "arkit-point-ruler",
      "method": "arkit_world_tracking",
      "lengthCm": Double(length) * 100,
      "widthCm": Double(width) * 100,
      "depthCm": Double(depth) * 100,
      "buckets": bucketCount,
      "confidence": "medium",
      "pointCount": 6,
      "lengthMeters": Double(length),
      "widthMeters": Double(width),
      "surfaceAreaSquareMeters": Double(area),
      "maximumDepthMeters": Double(depth),
      "averageDepthMeters": Double(depth) * 0.65,
      "volumeCubicMeters": Double(volume),
      "qualityScore": 72,
      "validDepthPointCount": 6,
      "durationMs": Int(Date().timeIntervalSince(startedAt) * 1000)
    ])
  }

  private func updateUI() {
    let axis = currentAxis
    let measured = measurements[axis]
    valueLabel.text = measured.map { String(format: "%.1f cm", $0 * 100) } ?? "0 cm"
    instruction.text = firstPoint == nil
      ? "\(axis.title): ilk noktayı hedefe alın"
      : "\(axis.title): ikinci noktayı hedefe alın"
    let completed = MeasureAxis.allCases.filter { measurements[$0] != nil }.count
    status.text = "\(completed) / 3 ölçü tamamlandı · hedefi ortadaki işarete getirin"
    captureButton.setTitle(firstPoint == nil ? "İlk noktayı işaretle" : "İkinci noktayı işaretle", for: .normal)
    finishButton.isEnabled = completed == 3
    finishButton.alpha = completed == 3 ? 1 : 0.42
  }

  private func addMarker(at point: SIMD3<Float>) {
    let material = SimpleMaterial(color: .white, isMetallic: false)
    let entity = ModelEntity(mesh: .generateSphere(radius: 0.008), materials: [material])
    let anchor = AnchorEntity(world: point)
    anchor.addChild(entity)
    anchors.append(anchor)
    arView.scene.addAnchor(anchor)
  }

  private func addLine(from start: SIMD3<Float>, to end: SIMD3<Float>) {
    let distance = simd_distance(start, end)
    let midpoint = (start + end) / 2
    let material = SimpleMaterial(
      color: UIColor(red: 0.10, green: 0.86, blue: 0.91, alpha: 1),
      isMetallic: false
    )
    let line = ModelEntity(mesh: .generateBox(size: SIMD3<Float>(0.006, 0.006, distance)), materials: [material])
    line.position = midpoint
    line.look(at: end, from: midpoint, relativeTo: nil)
    let anchor = AnchorEntity(world: midpoint)
    anchor.addChild(line)
    anchors.append(anchor)
    arView.scene.addAnchor(anchor)
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard firstPoint == nil else { return }
    switch frame.camera.trackingState {
    case .normal:
      reticle.tintColor = UIColor(red: 0.10, green: 0.86, blue: 0.91, alpha: 1)
    case .limited:
      reticle.tintColor = .systemYellow
    case .notAvailable:
      reticle.tintColor = .systemRed
    }
  }

  func session(_ session: ARSession, didFailWithError error: Error) {
    guard !hasFinished else { return }
    hasFinished = true
    session.pause()
    onError?("ARKit oturumu başlatılamadı: \(error.localizedDescription)")
  }

  func sessionWasInterrupted(_ session: ARSession) {
    status.text = "Kamera oturumu duraklatıldı"
  }

  func sessionInterruptionEnded(_ session: ARSession) {
    startSession()
  }
}
