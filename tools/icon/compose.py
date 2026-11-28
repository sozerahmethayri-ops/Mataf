import sys
from PIL import Image, ImageDraw, ImageFilter
D, OUT = sys.argv[1], sys.argv[2]
full = Image.open(f'{D}/out/full.png').convert('RGBA')
mono = Image.open(f'{D}/out/mono.png').convert('RGBA')

def kaaba_box(im):
    # Kâbe gövdesinin kutusu: tek renk (zeminsiz) görüntüden
    a = im.split()[3].point(lambda v: 255 if v > 128 else 0)
    return a.getbbox()

kb = kaaba_box(mono)  # (x0, y0, x1, y1)
kw, kh = kb[2] - kb[0], kb[3] - kb[1]
cx, cy = (kb[0] + kb[2]) / 2, (kb[1] + kb[3]) / 2

def background(n):
    # Sıcak gün batımı: üstte kayısı, altta krem; Kâbe'nin arkasında yumuşak ışık
    bg = Image.new('RGBA', (n, n))
    top, bot = (232, 128, 62), (252, 236, 214)
    for y in range(n):
        t = (y / (n - 1)) ** 0.9
        c = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        ImageDraw.Draw(bg).line([(0, y), (n, y)], fill=c + (255,))
    glow = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = int(n * 0.36)
    gd.ellipse([n / 2 - r, n * 0.42 - r, n / 2 + r, n * 0.42 + r], fill=(255, 246, 226, 170))
    glow = glow.filter(ImageFilter.GaussianBlur(n * 0.09))
    bg.alpha_composite(glow)
    return bg

def place(n, width_frac, cy_frac, src=full):
    # Kâbe gövdesinin genişliği n*width_frac olacak biçimde ölçekle, gövde merkezini (n/2, n*cy_frac)'e koy
    s = n * width_frac / kw
    im = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    layer = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    layer.alpha_composite(im, (round(n / 2 - cx * s), round(n * cy_frac - cy * s)))
    return layer

N = 1024
icon = background(N); icon.alpha_composite(place(N, 0.64, 0.53)); icon.convert('RGB').save(f'{OUT}/icon.png')
background(N).convert('RGB').save(f'{OUT}/android-icon-background.png')
place(N, 0.40, 0.52).save(f'{OUT}/android-icon-foreground.png')
# Tek renk: beyaz gövde, kuşak ve kapı boşluk (Android 13 tema simgesi, bildirim simgesi)
m = mono.copy(); px = m.load()
w, h = m.size
alpha = Image.new('L', m.size, 0); ap = alpha.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        ap[x, y] = a if (r + g + b) > 384 else 0
white = Image.new('RGBA', m.size, (255, 255, 255, 255)); white.putalpha(alpha)
place(N, 0.40, 0.52, white).save(f'{OUT}/android-icon-monochrome.png')
nb = place(N, 0.6, 0.5, white).resize((96, 96), Image.LANCZOS); nb.save(f'{OUT}/notification-icon.png')
place(N, 0.62, 0.5).resize((512, 512), Image.LANCZOS).save(f'{OUT}/splash-icon.png')
icon.convert('RGB').resize((48, 48), Image.LANCZOS).save(f'{OUT}/favicon.png')
print('kaaba box', kb)
