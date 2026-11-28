// Uygulama içi navigasyon (0.25.0, proje sahibinin isteği: Google Haritalar'a/Yandex'e yönlendirme yok): rotadaki
// ilerleme, sıradaki manevra ve uzaklığı, talimat metni (tr/en/ar), rotadan çıkma. Yürüme ve araç rotası OSRM'den
// (adımlarıyla), toplu taşıma Transitous/çevrimdışı tariften. React'sız; scripts/check-logic.ts'te test edilir.
import { meters, type LatLng, type NavStep, type StreetRoute, type TransitLeg } from './transport';

type Lang = 'tr' | 'en' | 'ar';

/** Noktanın rotaya izdüşümü: segment, segmentteki oran ve rotaya uzaklık (m) */
export function project(coords: LatLng[], p: LatLng): { seg: number; t: number; off: number } {
  if (coords.length < 2) return { seg: 0, t: 0, off: coords.length ? meters(coords[0], p) : 0 };
  const kx = Math.cos((p.lat * Math.PI) / 180) * 111320;
  const ky = 110540;
  let best = { seg: 0, t: 0, off: Infinity };
  for (let i = 0; i < coords.length - 1; i++) {
    const ax = (coords[i].lng - p.lng) * kx, ay = (coords[i].lat - p.lat) * ky;
    const bx = (coords[i + 1].lng - p.lng) * kx, by = (coords[i + 1].lat - p.lat) * ky;
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy;
    const t = L2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
    const off = Math.hypot(ax + t * dx, ay + t * dy);
    if (off < best.off) best = { seg: i, t, off };
  }
  return best;
}

/** Rota boyunca birikimli uzaklık (m): cum[i] = başlangıçtan i. noktaya */
export function cumulative(coords: LatLng[]): number[] {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + meters(coords[i - 1], coords[i]));
  return cum;
}

export type NavProgress = {
  /** Rotaya uzaklık (m); büyükse rotadan çıkılmıştır */
  off: number;
  /** Kalan yol (m) ve süre (sn, rotanın ortalama hızıyla) */
  leftM: number;
  leftS: number;
  /** Şu anki adım (son geçilen manevra) ve sıradaki manevra; sıradakine uzaklık (m) */
  step: number;
  next: NavStep | null;
  toNext: number;
  arrived: boolean;
};

/** Konuma göre rotadaki ilerleme. `cum` verilmezse hesaplanır. */
export function progress(route: StreetRoute, p: LatLng, cum = cumulative(route.coords)): NavProgress {
  const pr = project(route.coords, p);
  const seg = Math.min(pr.seg, Math.max(0, route.coords.length - 2));
  const done = cum[seg] + (cum[seg + 1] - cum[seg]) * pr.t;
  const total = cum[cum.length - 1] ?? 0;
  const leftM = Math.max(0, total - done);
  const speed = route.seconds > 0 && route.meters > 0 ? route.meters / route.seconds : 1.25;
  const steps = route.steps ?? [];
  // Sıradaki manevra: rotada bulunduğumuz yerden sonra gelen ilk adım (başlangıç "depart" atlanır)
  let nextI = steps.findIndex((s, i) => i > 0 && cum[s.idx] > done + 3);
  if (nextI < 0) nextI = steps.length - 1;
  const next = steps.length ? steps[Math.max(0, nextI)] : null;
  const toNext = next ? Math.max(0, cum[next.idx] - done) : leftM;
  const arrived = leftM < 15 || (!!next && next.type === 'arrive' && toNext < 15);
  return { off: pr.off, leftM, leftS: leftM / speed, step: Math.max(0, nextI - 1), next, toNext, arrived };
}

/** Rotadan çıkıldı mı (yürürken 40 m, araçta 70 m; GPS sapması payı) */
export const offRoute = (off: number, mode: 'walk' | 'car', accuracy?: number | null) =>
  off > (mode === 'walk' ? 40 : 70) + Math.min(40, Math.max(0, (accuracy ?? 0) - 10));

const DIR: Record<string, { tr: string; en: string; ar: string }> = {
  left: { tr: 'sola dönün', en: 'turn left', ar: 'انعطف يسارًا' },
  right: { tr: 'sağa dönün', en: 'turn right', ar: 'انعطف يمينًا' },
  'slight left': { tr: 'hafif sola dönün', en: 'bear left', ar: 'انعطف قليلًا إلى اليسار' },
  'slight right': { tr: 'hafif sağa dönün', en: 'bear right', ar: 'انعطف قليلًا إلى اليمين' },
  'sharp left': { tr: 'keskin sola dönün', en: 'turn sharp left', ar: 'انعطف بحدة إلى اليسار' },
  'sharp right': { tr: 'keskin sağa dönün', en: 'turn sharp right', ar: 'انعطف بحدة إلى اليمين' },
  straight: { tr: 'düz devam edin', en: 'continue straight', ar: 'استمر مباشرة' },
  uturn: { tr: 'geri dönün', en: 'make a U-turn', ar: 'استدر للخلف' },
};
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/** Manevranın talimatı: "Sağa dönün · Ibrahim Al Khalil" */
export function stepText(s: NavStep, lang: Lang): string {
  const dir = DIR[s.modifier ?? 'straight'] ?? DIR.straight;
  const name = s.name ? ` · ${s.name}` : '';
  let t: string;
  switch (s.type) {
    case 'depart': t = { tr: 'Yola çıkın', en: 'Head out', ar: 'ابدأ السير' }[lang]; break;
    case 'arrive': return { tr: 'Hedefe vardınız', en: 'You have arrived', ar: 'وصلت إلى وجهتك' }[lang];
    case 'roundabout': case 'rotary': case 'roundabout turn': case 'exit roundabout': case 'exit rotary':
      t = s.exit
        ? { tr: `Dönel kavşaktan ${s.exit}. çıkışa`, en: `At the roundabout take exit ${s.exit}`, ar: `في الدوار اسلك المخرج ${s.exit}` }[lang]
        : { tr: 'Dönel kavşağa girin', en: 'Enter the roundabout', ar: 'ادخل الدوار' }[lang];
      break;
    case 'continue': case 'new name':
      t = s.modifier && s.modifier !== 'straight' ? dir[lang] : DIR.straight[lang];
      break;
    case 'fork': t = (s.modifier?.includes('left') ? { tr: 'Çatalda soldan gidin', en: 'Keep left at the fork', ar: 'التزم اليسار عند التفرع' } : { tr: 'Çatalda sağdan gidin', en: 'Keep right at the fork', ar: 'التزم اليمين عند التفرع' })[lang]; break;
    case 'end of road': t = { tr: `Yolun sonunda ${dir.tr}`, en: `At the end of the road ${dir.en}`, ar: `في نهاية الطريق ${dir.ar}` }[lang]; break;
    case 'merge': case 'on ramp': case 'off ramp': default:
      t = dir[lang];
  }
  return cap(t) + name;
}

/** Kısa uzaklık: "120 m", "1,2 km" */
export function distText(m: number, lang: Lang): string {
  if (m < 1000) return `${m < 100 ? Math.max(5, Math.round(m / 5) * 5) : Math.round(m / 10) * 10} m`;
  const k = (m / 1000).toFixed(m < 10000 ? 1 : 0);
  return `${lang === 'tr' ? k.replace('.', ',') : k} km`;
}

/** Sesli yönlendirme cümlesi: "120 metre sonra sağa dönün" */
export function spokenText(s: NavStep, toNext: number, lang: Lang): string {
  const what = stepText(s, lang).split(' · ')[0];
  if (s.type === 'arrive' && toNext < 30) return what;
  if (toNext < 25) return what;
  const d = toNext < 1000 ? `${Math.round(toNext / 10) * 10}` : (toNext / 1000).toFixed(1).replace('.', lang === 'tr' ? ',' : '.');
  const unit = toNext < 1000 ? { tr: 'metre', en: 'metres', ar: 'متر' }[lang] : { tr: 'kilometre', en: 'kilometres', ar: 'كيلومتر' }[lang];
  return { tr: `${d} ${unit} sonra ${what.toLocaleLowerCase('tr')}`, en: `In ${d} ${unit}, ${what.toLowerCase()}`, ar: `بعد ${d} ${unit} ${what}` }[lang];
}

const VEHICLE: Record<Exclude<TransitLeg['kind'], 'walk'>, { tr: string; en: string; ar: string }> = {
  bus: { tr: 'otobüsüne', en: 'bus', ar: 'الحافلة' }, metro: { tr: 'metrosuna', en: 'metro', ar: 'المترو' }, tram: { tr: 'tramvayına', en: 'tram', ar: 'الترام' },
  train: { tr: 'trenine', en: 'train', ar: 'القطار' }, ferry: { tr: 'vapuruna', en: 'ferry', ar: 'العبّارة' }, other: { tr: 'aracına', en: 'service', ar: 'الوسيلة' },
};

/** Toplu taşımada bacağın talimatı: yürüme ya da "Ecyad: 7A otobüsüne binin (Harem yönü)" / "5 durak · Harem durağında inin (10:20)" */
export function legText(g: TransitLeg, lang: Lang, clock: (iso: string) => string): { head: string; sub: string } {
  if (g.kind === 'walk') {
    return {
      head: { tr: `${g.to.name} yönüne yürüyün`, en: `Walk to ${g.to.name}`, ar: `امشِ إلى ${g.to.name}` }[lang],
      sub: `${g.meters ? distText(g.meters, lang) : ''}${g.meters ? ' · ' : ''}${{ tr: `≈ ${g.minutes} dk`, en: `≈ ${g.minutes} min`, ar: `≈ ${g.minutes} د` }[lang]}`,
    };
  }
  const vehicle = VEHICLE[g.kind];
  const dir = g.headsign ? { tr: ` (${g.headsign} yönü)`, en: ` (towards ${g.headsign})`, ar: ` (باتجاه ${g.headsign})` }[lang] : '';
  const stops = g.stops + 1;
  return {
    head: { tr: `${g.from.name}: ${g.line} ${vehicle.tr} binin${dir}`, en: `${g.from.name}: take the ${g.line} ${vehicle.en}${dir}`, ar: `${g.from.name}: اركب ${vehicle.ar} ${g.line}${dir}` }[lang],
    sub: { tr: `${stops} durak · ${g.to.name} durağında inin (${clock(g.to.time)})`, en: `${stops} stops · get off at ${g.to.name} (${clock(g.to.time)})`, ar: `${stops} محطات · انزل في ${g.to.name} (${clock(g.to.time)})` }[lang],
  };
}

/** Toplu taşımada şu anki bacak: konuma en yakın bacak (yürüyüş ve araç), sıraya göre ilerler */
export function currentLeg(legs: TransitLeg[], p: LatLng, from = 0): number {
  let best = from;
  let bd = Infinity;
  for (let i = from; i < legs.length; i++) {
    const d = project(legs[i].coords, p).off;
    if (d < bd - 5) { bd = d; best = i; }
  }
  return best;
}
