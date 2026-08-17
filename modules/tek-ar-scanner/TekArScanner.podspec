Pod::Spec.new do |s|
  s.name           = 'TekArScanner'
  s.version        = '1.0.0'
  s.summary        = 'TEK ASFALT ARKit pothole measurement module'
  s.description    = 'Guided ARKit measurement for approximate Asfalt To Go bucket calculation.'
  s.author         = 'TEK ASFALT'
  s.homepage       = 'https://tekasfalt.com'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ARKit', 'SceneKit'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  # The compiled YOLOv8 Core ML bundle is loaded by the AR scanner at runtime.
  s.resources = ['ios/Resources/**/*']
end
