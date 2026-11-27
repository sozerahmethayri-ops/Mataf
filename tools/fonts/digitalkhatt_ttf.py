# Kullanım: python3 tools/fonts/digitalkhatt_ttf.py madina.otf assets/fonts/MatafMadina.ttf 2.6  (fonttools gerekir)
# DigitalKhatt New Madina (OFL-1.1, CFF2 değişken) → sabit TrueType: varsayılan örnek, ikinci dereceden eğriler,
# boşluk biraz genişletilmiş (sade dizgide kelimeler birbirine yapışıyordu). Aile adı değiştirilir (değiştirilmiş sürüm).
import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.varLib import instancer
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

src, dst, space_scale = sys.argv[1], sys.argv[2], float(sys.argv[3])
f = TTFont(src)
f = instancer.instantiateVariableFont(f, {'LTAT': 0, 'RTAT': 0})
order = f.getGlyphOrder()
gs = f.getGlyphSet()
glyf = newTable('glyf'); glyf.glyphOrder = order; glyf.glyphs = {}
for name in order:
    pen = TTGlyphPen(gs)
    gs[name].draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
    glyf[name] = pen.glyph()
f['glyf'] = glyf
f['loca'] = newTable('loca')
for t in ('CFF2', 'CFF ', 'VORG', 'HVAR', 'MVAR', 'STAT', 'fvar', 'avar', 'gvar', 'DSIG'):
    if t in f: del f[t]
f['head'].glyphDataFormat = 0
maxp = f['maxp']; maxp.tableVersion = 0x00010000
for k, v in dict(maxZones=1, maxTwilightPoints=0, maxStorage=0, maxFunctionDefs=0, maxInstructionDefs=0, maxStackElements=0, maxSizeOfInstructions=0, maxComponentElements=0).items():
    setattr(maxp, k, v)
post = f['post']; post.formatType = 2.0; post.extraNames = []; post.mapping = {}; post.glyphOrder = order
f.sfntVersion = '\x00\x01\x00\x00'
# Kelime arası
cmap = f.getBestCmap()
sp = cmap.get(0x20)
if sp:
    w, lsb = f['hmtx'][sp]
    f['hmtx'][sp] = (int(round(w * space_scale)), lsb)
    print('boşluk', sp, w, '→', f['hmtx'][sp][0])
# Ad: değiştirilmiş sürüm olduğu belli olsun
for rec in f['name'].names:
    if rec.nameID in (1, 4, 16):
        rec.string = 'MATAF Madina'
    elif rec.nameID == 6:
        rec.string = 'MATAFMadina'
    elif rec.nameID == 2:
        rec.string = 'Regular'
f.save(dst)
print('yazıldı', dst)
