"""Ekran görüntülerini yan yana tek resimde toplar.
Kullanım: python3 tools/web-shots/sheet.py çıktı.png genişlik a.png b.png ...
"""
import sys

from PIL import Image

out, width, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
ims = [im.resize((width, int(im.height * width / im.width))) for im in ims]
H = max(im.height for im in ims)
W = width * len(ims) + 8 * (len(ims) - 1)
sh = Image.new('RGB', (W, H), (200, 200, 200))
x = 0
for im in ims:
    sh.paste(im, (x, 0)); x += width + 8
sh.save(out)
