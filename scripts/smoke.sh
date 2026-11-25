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
for r in "kuran/18?b=hatim&a=10" zikir vakitler kible cami sehir ulasim tavaf umre say otel acil kaza cevrimdisi navigasyon ayarlar hadis-dua; do
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
open vakitler; sleep 6
found=0
for k in 1 2 3 4 5 6; do
  if tapText "Ana ekrana vakit kutusu ekle|Add prayer times to home screen|أضف المواقيت إلى الشاشة الرئيسية"; then found=1; break; fi
  adb shell input swipe $(( W / 2 )) $(( H * 75 / 100 )) $(( W / 2 )) $(( H * 30 / 100 )) 300; sleep 1
done
echo "widget satırı bulundu: $found" >> smoke/status.txt
sleep 3; shot "40-widget-onay"
added=0
for k in 1 2 3; do
  if tapText "Add to home screen|ADD TO HOME SCREEN|Add automatically|ADD AUTOMATICALLY|Add|ADD|Ekle|EKLE|Ana ekrana ekle"; then added=1; break; fi
  sleep 2
done
echo "widget onayı: $added" >> smoke/status.txt
sleep 4
adb shell input keyevent KEYCODE_HOME; sleep 6; shot "41-widget-ana-ekran"
adb shell dumpsys appwidget > smoke/widget.txt 2>&1 || true
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 6

# Tema değiştirme (koyu/açık) sonrası uygulama açık kalmalı: Ayarlar'da tema satırına dokun
open ayarlar; sleep 5
tap 500 158; step "30-tema-koyu" 4
tap 470 262; step "31-palet-zumrut" 4
tap 200 158; step "32-tema-acik" 4
open harita; step "33-harita-tema" 8

adb logcat -d > smoke/logcat.txt
# Yalnız uygulamamızın çökmeleri (Google Play hizmetleri gibi sistem süreçleri hariç) + uygulamanın neden kapatıldığı
{ grep -n -B1 -A40 -E "Process: $PKG" smoke/logcat.txt; grep -n -A20 -E "ReactNativeJS.*(Error|Exception)|JavascriptException" smoke/logcat.txt; grep -n -E "Killing [0-9]+:$PKG|$PKG.*has died|DeadSystemException" smoke/logcat.txt | head -20; } > smoke/crash.txt
[ -s smoke/crash.txt ] || echo "çökme kaydı yok" > smoke/crash.txt
grep -E "ReactNativeJS|chromium" smoke/logcat.txt | grep -iE "maplibre|webgl|harita|map error|ssl" | head -60 > smoke/map-log.txt || true
[ -s smoke/map-log.txt ] || echo "harita günlüğü boş" > smoke/map-log.txt
cat smoke/status.txt >> smoke/crash.txt
