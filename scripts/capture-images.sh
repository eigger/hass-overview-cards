#!/usr/bin/env bash
# Regenerates images/*.jpg from examples/preview.html and examples/showcase.html with headless Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=8131; BASE="http://127.0.0.1:$PORT/examples"; TMP="$(mktemp -d)"
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -f examples/_wrap.html; rm -rf "$TMP"' EXIT
sleep 1
shot() { # name size url
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$2" --screenshot="$TMP/$1.png" "$3" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 88 "$TMP/$1.png" --out "images/$1.jpg" >/dev/null
}
mobile() { # name url-path (loaded in a 390px iframe: headless Chrome will not render pages narrower than 500px)
  echo "<!doctype html><body style=\"margin:0\"><iframe id=f style=\"border:0;width:390px;height:$3px;margin-left:55px\"></iframe><script>f.src=\"$2\"</script>" > examples/_wrap.html
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=500,"$3" --screenshot="$TMP/$1.png" "$BASE/_wrap.html" >/dev/null 2>&1
  sips --cropToHeightWidth "$3" 390 "$TMP/$1.png" --out "$TMP/$1-c.png" >/dev/null
  sips -s format jpeg -s formatOptions 88 "$TMP/$1-c.png" --out "images/$1.jpg" >/dev/null
}
for lang in en ko; do
  suffix=""; q=""; [ "$lang" = ko ] && suffix="-ko" && q="&lang=ko"
  shot "overview-card$suffix" 1516,710 "$BASE/preview.html?scenario=alert&width=1500&capture=true$q"
  shot "overview-card-clear$suffix" 1516,640 "$BASE/preview.html?scenario=normal&width=1500&capture=true$q"
  shot "overview-card-dark$suffix" 1516,710 "$BASE/preview.html?scenario=alert&width=1500&theme=dark&capture=true$q"
  mobile "overview-card-mobile$suffix" "preview.html?scenario=alert&width=390&capture=true$q" 1700
  shot "overview-tiles$suffix" 422,432 "$BASE/preview.html?variant=tiles&scenario=alert&capture=true$q"
  shot "overview-tiles-clear$suffix" 422,336 "$BASE/preview.html?variant=tiles&scenario=normal&capture=true$q"
  shot "overview-tiles-offline$suffix" 422,336 "$BASE/preview.html?variant=tiles&scenario=offline&capture=true$q"
  [ "$lang" = ko ] && shot "visual-editor" 1300,1020 "$BASE/editor.html?capture=true&open=sections,sections-0,alerts"
  shot "showcase-light$suffix" 1200,1320 "$BASE/showcase.html?capture=true$q"
  shot "showcase-dark$suffix" 1200,1320 "$BASE/showcase.html?theme=dark&capture=true$q"
done
