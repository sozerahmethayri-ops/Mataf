#!/usr/bin/env bash
# Emülatörde APK'yı kurar, açar, ekranları gezer ve günlükleri toplar (android-smoke.yml).
# Konum Harem'e (Kâbe'nin ~40 m kuzeyi) ayarlanır; ekranlar mataf:// bağlantılarıyla açılır,
# sekmeler arası kaydırma ve alt çubuk da denenir. Her adımdan sonra uygulama hâlâ açık mı bakılır.
set -u
APK="$1"
PKG=app.mataf.navigator
mkdir -p smoke
# Yeni açılan emülatörde Google Play hizmetleri ilk dakikalarda güncellenip yeniden başlıyor; önce otursun
sleep 60
adb install -r -g "$APK" || { echo "kurulamadı" > smoke/crash.txt; exit 0; }
adb emu geo fix 39.82625 21.42295 || true
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 12
adb emu geo fix 39.82625 21.42295 || true
adb exec-out screencap -p > "smoke/screen-01-acilis.png" || true
echo "running" > smoke/status.txt

alive() { adb shell pidof "$PKG" >/dev/null; }
shot() { adb exec-out screencap -p > "smoke/screen-$1.png" || true; }
step() { # $1 ad, $2 bekleme
  sleep "$2"; shot "$1"
  if ! alive; then echo "NOT RUNNING after $1" >> smoke/status.txt; return 1; fi
}
open() { adb shell "am start -W -a android.intent.action.VIEW -d 'mataf://$1' $PKG" >/dev/null 2>&1; }

# İlk açılış ekranı ("Hoş geldiniz") görüntüsü 01'de; derin bağlantıyla kapat ki sekme dokunuşları ana sayfaya düşsün
adb shell "am start -W -a android.intent.action.VIEW -d 'mataf://hosgeldin?bitti=1' $PKG" >/dev/null 2>&1; sleep 4
SIZE=$(adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1)
W=${SIZE%x*}; H=${SIZE#*x}
Y=$(( H * 950 / 1000 ))
tap() { adb shell input tap $(( W * $1 / 1000 )) $(( H * $2 / 1000 )); }

# Önce Ulaşım sekmesi: sekme sayfasındaki online harita ne kadar sürede açılıyor?
adb shell input tap $(( W * 700 / 1000 )) $Y
step "02a-ulasim-10" 10
step "02b-ulasim-25" 15
step "02c-ulasim-45" 20
adb shell input tap $(( W * 500 / 1000 )) $Y
sleep 3

# Alt çubuk: Harita, Kur'an, Ana sayfa (orta), Ulaşım, Menü
n=1
for f in 100 300 700 900 500; do
  n=$((n + 1))
  adb shell input tap $(( W * f / 1000 )) $Y
  step "0$n-sekme-$f" 8 || break
done
# Kaydırarak sekme değiştirme (Ana sayfa → Kur'an → Ana sayfa)
adb shell input swipe $(( W * 15 / 100 )) $(( H / 2 )) $(( W * 85 / 100 )) $(( H / 2 )) 250
step "07-kaydir-kuran" 5
adb shell input swipe $(( W * 85 / 100 )) $(( H / 2 )) $(( W * 15 / 100 )) $(( H / 2 )) 250
step "08-kaydir-ana" 4

i=10
for r in "kuran/18?b=hatim&a=10" zikir vakitler kible cami sehir ulasim tavaf umre hac cemerat "hac-harita?yer=arafat" grup say otel acil kaza cevrimdisi navigasyon ayarlar hadis-dua; do
  i=$((i + 1))
  open "$r"
  name=$(echo "$r" | cut -d'?' -f1 | tr '/' '-')
  case "$r" in cami|sehir|ulasim|otel|acil) wait=14 ;; *) wait=7 ;; esac
  step "$i-$name" $wait || break
  if [ "$r" = ulasim ]; then
    # Haritayı biraz kaydır: içerik ancak dokununca mı beliriyor?
    adb shell input swipe $(( W / 2 )) $(( H * 30 / 100 )) $(( W / 2 - 60 )) $(( H * 25 / 100 )) 300
    step "$i-$name-kaydir" 6 || break
  fi
  case "$r" in cami|sehir|ulasim) step "$i-$name-2" 14 || break ;; esac
done

# Ana ekran küçük uygulaması: Vakitler ekranındaki "ana ekrana ekle" satırına dokun, başlatıcının onayını ver,
# ana ekranın görüntüsünü al (küçük uygulama çiziliyor mu?)
ui() { adb exec-out uiautomator dump /dev/tty 2>/dev/null > smoke/ui.xml; }
tapText() { # $1: metin (grep -E); bulursa ortasına dokunur
  ui
  local b
  b=$(grep -oE "<node [^>]*text=\"($1)\"[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" smoke/ui.xml | head -1 | grep -oE 'bounds="[^"]+"' | grep -oE '[0-9]+' | tr '\n' ' ')
  [ -n "$b" ] || return 1
  set -- $b
  adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
}
widgetAdded() { [ "$(adb shell dumpsys appwidget | grep -c PrayerWidgetProvider)" -ge 2 ]; }
# mataf://vakitler?widget=1 başlatıcının onay penceresini açar. RN ekranı sürekli güncellendiği için
# uiautomator çoğu zaman "idle state" alamıyor; o zaman düğmeyi olası yerlerinde dener.
open "vakitler?widget=1"; sleep 6; shot "40-widget-onay"
added=0
if tapText "Add to home screen|ADD TO HOME SCREEN|Add automatically|ADD AUTOMATICALLY|Add|ADD|Ekle|EKLE|Ana ekrana ekle"; then
  sleep 4; widgetAdded && added=1
fi
if [ $added = 0 ]; then
  for p in "850 930" "750 930" "850 960" "750 960" "850 900" "650 930" "850 870" "700 880"; do
    open "vakitler?widget=1"; sleep 5
    tap $p; sleep 4
    if widgetAdded; then added="dokunma $p"; break; fi
  done
fi
echo "widget eklendi: $added" >> smoke/status.txt
sleep 3
adb shell input keyevent KEYCODE_HOME; sleep 6; shot "41-widget-ana-ekran"
# Başlatıcı yer yoksa küçük uygulamayı sonraki sayfaya koyar: iki sayfa sağa bak
adb shell input swipe $(( W * 85 / 100 )) $(( H * 45 / 100 )) $(( W * 15 / 100 )) $(( H * 45 / 100 )) 300; sleep 4; shot "42-widget-sayfa2"
adb shell dumpsys appwidget > smoke/widget.txt 2>&1 || true
# Dokununca uygulama açılıyor mu? (küçük uygulama sayfanın üst yarısında)
tap 500 300; sleep 5
top=$(adb shell dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity" | head -2 | tr -d '\r')
echo "dokununca öndeki: $top" >> smoke/status.txt
shot "43-widget-dokun"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 6

# Tema değiştirme (koyu/açık) sonrası uygulama açık kalmalı: Ayarlar'da tema satırına dokun
open ayarlar; sleep 5
# Koordinatlar 0.10.0 Ayarlar düzenine göre (Görünüm satırı ~%23, palet ikinci sütun ~%38)
tap 500 230; step "30-tema-koyu" 4
tap 545 380; step "31-palet-zumrut" 4
tap 200 230; step "32-tema-acik" 4
open harita; step "33-harita-tema" 8

adb logcat -d > smoke/logcat.txt
grep -iE "expo.?widgets|glance|PrayerWidget|appwidget" smoke/logcat.txt | head -150 > smoke/widget-log.txt || true
# Yalnız uygulamamızın çökmeleri (Google Play hizmetleri gibi sistem süreçleri hariç) + uygulamanın neden kapatıldığı
{ grep -n -B1 -A40 -E "Process: $PKG" smoke/logcat.txt; grep -n -A20 -E "ReactNativeJS.*(Error|Exception)|JavascriptException" smoke/logcat.txt; grep -n -E "Killing [0-9]+:$PKG|$PKG.*has died|DeadSystemException" smoke/logcat.txt | head -20; } > smoke/crash.txt
[ -s smoke/crash.txt ] || echo "çökme kaydı yok" > smoke/crash.txt
grep -E "ReactNativeJS|chromium" smoke/logcat.txt | grep -iE "maplibre|webgl|harita|map error|ssl" | head -60 > smoke/map-log.txt || true
[ -s smoke/map-log.txt ] || echo "harita günlüğü boş" > smoke/map-log.txt
cat smoke/status.txt >> smoke/crash.txt
