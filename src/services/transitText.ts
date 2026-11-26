// Toplu taşıma adımlarını gündelik dille yazar: "M1B metrosuna binin (Kirazlı yönü)", "Bağcılar Meydan
// istasyonunda inin". Türkçede özel adın sonuna ek getirilmez (ek hatası olmasın diye "istasyonunda",
// "durağına" gibi genel sözcük çekimlenir). Saf işlevler; testlerde de çalışır.
import type { LegKind, TransitLeg } from './transport';

type Lang = 'tr' | 'en' | 'ar';

/** Hattın adı: Marmaray B1 → "Marmaray" */
export const lineName = (g: Pick<TransitLeg, 'line' | 'kind'>) => (g.line === 'B1' ? 'Marmaray' : g.line);

const BOARD: Record<LegKind, { tr: string; en: string; ar: string }> = {
  metro: { tr: '{l} metrosuna binin', en: 'Take metro {l}', ar: 'اركب المترو {l}' },
  tram: { tr: '{l} tramvayına binin', en: 'Take tram {l}', ar: 'اركب الترام {l}' },
  train: { tr: '{l} trenine binin', en: 'Take train {l}', ar: 'اركب القطار {l}' },
  bus: { tr: '{l} otobüsüne binin', en: 'Take bus {l}', ar: 'اركب الحافلة {l}' },
  ferry: { tr: '{l} vapuruna binin', en: 'Take ferry {l}', ar: 'اركب العبّارة {l}' },
  other: { tr: '{l} hattına binin', en: 'Take line {l}', ar: 'اركب الخط {l}' },
  walk: { tr: 'Yürüyün', en: 'Walk', ar: 'امشِ' },
};
/** İnilen / yürünen yer: metro ve trende istasyon, tramvay ve otobüste durak, vapurda iskele */
const PLACE: Record<LegKind, { at: { tr: string; en: string; ar: string }; to: { tr: string; en: string; ar: string } }> = {
  metro: { at: { tr: '{s} istasyonunda inin', en: 'Get off at {s}', ar: 'انزل في محطة {s}' }, to: { tr: '{s} istasyonuna yürüyün', en: 'Walk to {s} station', ar: 'امشِ إلى محطة {s}' } },
  train: { at: { tr: '{s} istasyonunda inin', en: 'Get off at {s}', ar: 'انزل في محطة {s}' }, to: { tr: '{s} istasyonuna yürüyün', en: 'Walk to {s} station', ar: 'امشِ إلى محطة {s}' } },
  tram: { at: { tr: '{s} durağında inin', en: 'Get off at {s}', ar: 'انزل في محطة {s}' }, to: { tr: '{s} durağına yürüyün', en: 'Walk to {s} stop', ar: 'امشِ إلى محطة {s}' } },
  bus: { at: { tr: '{s} durağında inin', en: 'Get off at {s}', ar: 'انزل في موقف {s}' }, to: { tr: '{s} durağına yürüyün', en: 'Walk to {s} stop', ar: 'امشِ إلى موقف {s}' } },
  ferry: { at: { tr: '{s} iskelesinde inin', en: 'Get off at {s} pier', ar: 'انزل في رصيف {s}' }, to: { tr: '{s} iskelesine yürüyün', en: 'Walk to {s} pier', ar: 'امشِ إلى رصيف {s}' } },
  other: { at: { tr: '{s} durağında inin', en: 'Get off at {s}', ar: 'انزل في {s}' }, to: { tr: '{s} durağına yürüyün', en: 'Walk to {s}', ar: 'امشِ إلى {s}' } },
  walk: { at: { tr: '{s}', en: '{s}', ar: '{s}' }, to: { tr: '{s} yönüne yürüyün', en: 'Walk to {s}', ar: 'امشِ إلى {s}' } },
};
const TOWARDS = { tr: '{h} yönü', en: 'towards {h}', ar: 'باتجاه {h}' };
const TO_DEST = { tr: 'Varış noktasına yürüyün', en: 'Walk to your destination', ar: 'امشِ إلى وجهتك' };
const MIN = { tr: '{n} dk', en: '{n} min', ar: '{n} د' };

/** Büyük harfle yazılmış durak adlarını (İETT: "GÜMÜŞSUYU PERON") okunur yap. */
export function tidyName(s: string, lang: Lang) {
  if (!s || s !== s.toLocaleUpperCase('tr') || !/[A-ZÇĞİÖŞÜ]{3}/.test(s)) return s;
  const loc = lang === 'tr' ? 'tr' : 'en';
  return s.toLocaleLowerCase(loc).replace(/(^|[\s\-/(])(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase(loc));
}

/** "M1B metrosuna binin" + "(Kirazlı yönü)" */
export function boardText(g: TransitLeg, lang: Lang) {
  const head = BOARD[g.kind][lang].replace('{l}', lineName(g)).replace(/\s+/g, ' ').trim();
  const dir = g.headsign ? TOWARDS[lang].replace('{h}', tidyName(g.headsign, lang)) : '';
  return { head, dir };
}

/** "Bağcılar Meydan istasyonunda inin" */
export const alightText = (g: TransitLeg, lang: Lang) => PLACE[g.kind].at[lang].replace('{s}', tidyName(g.to.name, lang));

/** Yürüme adımı: sonraki biniş varsa onun istasyonuna/durağına, yoksa varış noktasına. */
export function walkText(next: TransitLeg | undefined, toName: string, lang: Lang) {
  if (!next || !toName) return TO_DEST[lang];
  return PLACE[next.kind].to[lang].replace('{s}', tidyName(toName, lang));
}

/** "4 durak", "1 stop" / "4 stops", Arapçada sayıya göre: محطة واحدة، محطتان، ٣–١٠ محطات، ١١+ محطة */
export function stopsText(n: number, lang: Lang) {
  if (lang === 'en') return n === 1 ? '1 stop' : `${n} stops`;
  if (lang === 'ar') return n === 1 ? 'محطة واحدة' : n === 2 ? 'محطتان' : n <= 10 ? `${n} محطات` : `${n} محطة`;
  return `${n} durak`;
}
export const minText = (n: number, lang: Lang) => MIN[lang].replace('{n}', String(n));
