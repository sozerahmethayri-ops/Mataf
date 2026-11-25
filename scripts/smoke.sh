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
# Sekmeleri gez: ekran boyutuna göre alt sekme çubuğuna dokun (Ulaşım, Kur'an, Vakitler, Hadis, Harita)
SIZE=$(adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1)
W=${SIZE%x*}; H=${SIZE#*x}
Y=$(( H * 945 / 1000 ))
i=0
for f in 300 500 700 900 100; do
  i=$((i + 1))
  adb shell input tap $(( W * f / 1000 )) $Y
  sleep 8
  adb exec-out screencap -p > "smoke/screen-tab$i.png" || true
  if ! adb shell pidof "$PKG" >/dev/null; then echo "NOT RUNNING after tab $i" >> smoke/status.txt; break; fi
done
adb logcat -d > smoke/logcat.txt
grep -n -A40 -E "FATAL EXCEPTION|ReactNativeJS.*(Error|Exception)|JavascriptException" smoke/logcat.txt > smoke/crash.txt || echo "çökme kaydı yok ($(cat smoke/status.txt))" > smoke/crash.txt
cat smoke/status.txt >> smoke/crash.txt
