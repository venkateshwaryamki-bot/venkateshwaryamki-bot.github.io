#!/usr/bin/env bash
# Builds the Ember Android APK from ../ember (the web app) without Gradle.
# Needs (Ubuntu/Debian): apt-get install aapt android-sdk-platform-23 dalvik-exchange apksigner zipalign default-jdk
# Usage: KEYSTORE=/path/ember.keystore KS_PASS=... ./build.sh
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=${KEYSTORE:-ember-release.keystore}
KS_PASS=${KS_PASS:?set KS_PASS to the keystore password}
KS_ALIAS=${KS_ALIAS:-ember}
OUT=${OUT:-../ember/Ember.apk}
B=build

rm -rf "$B" && mkdir -p "$B/gen" "$B/classes" "$B/assets/www"

# 1. Web app → assets (no service worker / manifest needed inside the APK)
cp -r ../ember/index.html ../ember/app.css ../ember/app.js ../ember/fonts ../ember/icons "$B/assets/www/"

# 2. Resources → R.java
aapt package -f -m -J "$B/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 3. Java → classes → dex
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$ANDROID_JAR" \
  -d "$B/classes" $(find src "$B/gen" -name '*.java')
dalvik-exchange --dex --min-sdk-version=24 --output="$B/classes.dex" "$B/classes"

# 4. Package, align, sign
aapt package -f -M AndroidManifest.xml -S res -A "$B/assets" -I "$ANDROID_JAR" -F "$B/unsigned.apk"
(cd "$B" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"
apksigner sign --v4-signing-enabled false --ks "$KEYSTORE" --ks-key-alias "$KS_ALIAS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --out "$OUT" "$B/aligned.apk"
apksigner verify --print-certs "$OUT" | head -3
echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
