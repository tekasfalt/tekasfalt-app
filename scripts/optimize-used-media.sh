#!/bin/zsh
set -euo pipefail

FFMPEG="${1:?ffmpeg yolu gerekli}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

videos=(
  "assets/home-asphalt-mobile.mp4"
  "assets/home-img0038-mobile.mp4"
  "assets/corporate/activities-mobile.mp4"
  "assets/corporate/applications-road-mobile.mp4"
  "assets/corporate/contact-drone.mp4"
  "assets/corporate/production-esenler-hero.mp4"
  "assets/corporate/production-esenler-optimized.mp4"
  "assets/corporate/production-plentmiks-mobile.mp4"
  "assets/corporate/production-silivri-mobile.mp4"
  "assets/corporate/quality-optimized.mp4"
  "assets/products/catalog/derz-dolgu.mp4"
  "assets/products/catalog/hazir-asfalt.mp4"
  "assets/products/catalog/mastik-asfalt-optimized.mp4"
  "assets/products/catalog/poroz-asfalt-optimized.mp4"
  "assets/products/catalog/sessiz-asfalt-optimized.mp4"
)

for relative in "${videos[@]}"; do
  input="$ROOT/$relative"
  output="${input%.mp4}-app.mp4"
  "$FFMPEG" -loglevel error -y -i "$input" -an \
    -vf "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))':flags=lanczos,fps=24" \
    -c:v libx264 -preset medium -crf 29 -pix_fmt yuv420p -movflags +faststart "$output"
  echo "$relative -> ${relative%.mp4}-app.mp4"
done
