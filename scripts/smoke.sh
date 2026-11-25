#!/usr/bin/env bash
# Emülatörde APK'yı kurar, açar ve günlükleri toplar (android-smoke.yml).
set -u
APK="$1"
PKG=app.mataf.navigator
mkdir -p smoke
adb install -r -g "$APK" || { echo "kurulamadı" > smoke/crash.txt; exit 0; }
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
for t in 10 25 45; do
  sleep $(( t == 10 ? 10 : 15 ))
  adb exec-out screencap -p > "smoke/screen-${t}s.png" || true
done
if adb shell pidof "$PKG" >/dev/null; then echo "running" > smoke/status.txt; else echo "NOT RUNNING" > smoke/status.txt; fi
# Sekmeleri gez: alt sekme çubuğuna dokun (Ulaşım, Kur'an, Vakitler, Hadis), sonra Harita
for x in 324 540 756 972 108; do adb shell input tap $x 2300; sleep 5; done
adb exec-out screencap -p > smoke/screen-tabs.png || true
if ! adb shell pidof "$PKG" >/dev/null; then echo "NOT RUNNING after tabs" >> smoke/status.txt; fi
adb logcat -d > smoke/logcat.txt
grep -n -A40 -E "FATAL EXCEPTION|ReactNativeJS.*(Error|Exception)|JavascriptException" smoke/logcat.txt > smoke/crash.txt || echo "çökme kaydı yok ($(cat smoke/status.txt))" > smoke/crash.txt
cat smoke/status.txt >> smoke/crash.txt
