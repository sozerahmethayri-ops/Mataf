// Harita yerleşimi: kamerayı görünür alana sığdırma ve etiket çakışmalarını önleme.
// Saf fonksiyonlar — React'e bağlı değil, scripts/check-logic.ts ile test edilir.
import type { Pt } from '@/data/sites';
import { Cam } from './oblique';

/** Ekranın arayüzle (arama çubuğu, alt panel, butonlar) kaplanan kenar payları. */
export type Viewport = { top: number; bottom: number; left: number; right: number };
/** `owner`: bu alan kendi etiketine engel sayılmaz (ör. Kâbe → Kâbe etiketi). */
export type Box = { x: number; y: number; w: number; h: number; owner?: string };

export const NO_INSETS: Viewport = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * `points` (yerel metre) kutusunu görünür alana sığdıran kamera.
 * `headroom`: minare/kubbe gibi yükselen yapılar için üstte bırakılan pay (px).
 * `zoom`: sığdırılmış ölçeğin üzerine kullanıcının yakınlaştırması.
 */
export function fitCamera(
  points: Pt[], width: number, height: number, vp: Viewport,
  { pad = 16, headroom = 0, kMin = 0.3, kMax = 2.2, zoom = 1 } = {},
): Cam {
  const unit = new Cam(1, 0, 0);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    const [sx, sy] = unit.P(x, y);
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  const aw = Math.max(40, width - vp.left - vp.right - 2 * pad);
  const ah = Math.max(40, height - vp.top - vp.bottom - 2 * pad - headroom);
  const fitK = Math.min(aw / Math.max(1, x1 - x0), ah / Math.max(1, y1 - y0));
  const k = Math.min(kMax, Math.max(kMin, fitK)) * zoom;
  const sx = vp.left + pad + aw / 2;
  const sy = vp.top + pad + headroom + ah / 2;
  return new Cam(k, sx - k * (x0 + x1) / 2, sy - k * (y0 + y1) / 2);
}

/** Etiket genişliği tahmini (px). */
export const textWidth = (s: string, size: number, bold = true) => s.length * size * (bold ? 0.6 : 0.55);

export const overlaps = (a: Box, b: Box, gap = 2) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

const overlapArea = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

export type LabelReq = {
  id: string;
  /** Etiketin bağlandığı ekran noktası */
  ax: number; ay: number;
  w: number; h: number;
  /** Üst kenardan taşarsa, aynı dikey çizgide görünür alana kaydır (ör. Saat Kulesi tepesi). */
  slideDown?: boolean;
  /** Yer bulunamasa da gizleme — en az çakışan adayı kullan (ör. hedef etiketi). */
  required?: boolean;
  /** Etiketle bağlantı noktası arasındaki boşluk (px, varsayılan 6). */
  gap?: number;
};

/**
 * Etiketleri sırayla yerleştirir: üst, alt, sağ, sol adayları denenir; engellerle,
 * görünür alanın dışıyla ve önceki etiketlerle çakışan aday atlanır. Yer yoksa gizlenir (null).
 */
export function placeLabels(reqs: LabelReq[], obstacles: Box[], width: number, height: number, vp: Viewport): Record<string, Box | null> {
  const taken = [...obstacles];
  const out: Record<string, Box | null> = {};
  const inside = (b: Box) => b.x >= vp.left + 4 && b.x + b.w <= width - vp.right - 4 && b.y >= vp.top + 4 && b.y + b.h <= height - vp.bottom - 4;
  for (const r of reqs) {
    const g = r.gap ?? 6;
    const cands: Box[] = [
      { x: r.ax - r.w / 2, y: r.ay - r.h - g, w: r.w, h: r.h }, // üst
      { x: r.ax - r.w / 2, y: r.ay + g, w: r.w, h: r.h }, // alt
      { x: r.ax + g + 4, y: r.ay - r.h / 2, w: r.w, h: r.h }, // sağ
      { x: r.ax - r.w - g - 4, y: r.ay - r.h / 2, w: r.w, h: r.h }, // sol
      { x: r.ax + g, y: r.ay - r.h - g, w: r.w, h: r.h }, // sağ üst
      { x: r.ax - r.w - g, y: r.ay - r.h - g, w: r.w, h: r.h }, // sol üst
      { x: r.ax + g, y: r.ay + g, w: r.w, h: r.h }, // sağ alt
      { x: r.ax - r.w - g, y: r.ay + g, w: r.w, h: r.h }, // sol alt
    ];
    if (r.slideDown && r.ay < vp.top + 8) {
      for (let y = vp.top + 8; y < height - vp.bottom - r.h; y += r.h + 6)
        cands.push({ x: r.ax - r.w / 2, y, w: r.w, h: r.h });
    }
    const blockers = taken.filter((t) => t.owner !== r.id);
    let hit = cands.find((c) => inside(c) && !blockers.some((t) => overlaps(c, t)));
    if (!hit && r.required) {
      // Yer yoksa en az çakışan adayı seç
      const cost = (c: Box) => blockers.reduce((s, t) => s + overlapArea(c, t), 0) + (inside(c) ? 0 : 1e6);
      hit = cands.reduce((best, c) => (cost(c) < cost(best) ? c : best), cands[0]);
    }
    out[r.id] = hit ?? null;
    if (hit) taken.push(hit);
  }
  return out;
}

/** Ölçek çubuğu: ekranda ~maxPx'i geçmeyen en büyük yuvarlak metre değeri. */
export function niceScale(k: number, maxPx = 96): number {
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
  let best = steps[0];
  for (const m of steps) if (m * k <= maxPx) best = m;
  return best;
}
