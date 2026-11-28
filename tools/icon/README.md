# Uygulama simgesi (işlenmiş Kâbe)

Simge, three.js ile ışıklı ve gölgeli bir 3B sahneden işlenir (render); yazı ya da hazır görsel kullanılmaz.
Kuşaktaki süsleme soyuttur (âyet yazısı taklit edilmez).

Yeniden üretmek (depo kökünden):

```bash
cd tools/icon && npm install --no-save three@0.170.0
python3 -m http.server 8765 --bind 127.0.0.1 &
mkdir -p out && node shoot.js "$PWD/out"
cd ../.. && python3 -I tools/icon/compose.py tools/icon assets/images
```

`shoot.js` sahnenin iki görüntüsünü alır: `out/full.png` (renkli, zeminli) ve `out/mono.png` (tek renk siluet).
`compose.py` bunlardan `icon.png`, Android uyarlanabilir simge (ön, arka, tek renk), bildirim simgesi,
açılış görseli ve `favicon.png` üretir. Uyarlanabilir simgede Kâbe güvenli alanın (%61 daire) içinde kalır.
