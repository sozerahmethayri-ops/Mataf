// Alt sekmeler (0.25.0, proje sahibinin isteği): 1., 2. ve 4. sekmeye istenen bölüm konur (ör. Harita yerine Hac-Umre);
// ortadaki Ana sayfa ve sondaki Menü sabittir. Sekme rotaları "yuva"dır (/s1, /s2, /s4): yuvada hangi bölümün çizileceği
// theme:prefs.tabs'tan okunur. /harita, /kuran, /ulasim ve diğerleri her zaman kendi bölümünü açan yığın ekranlarıdır;
// bu yüzden uygulamanın içindeki eski bağlantılar kırılmaz. routeFor bölüm sekmedeyse sekmeye, değilse yığın ekranına götürür.
// React'sız; scripts/check-logic.ts'te test edilir.

export type TabId = 'harita' | 'kuran' | 'ulasim' | 'hac' | 'vakitler' | 'kible' | 'zikir' | 'hadis';
export const TAB_IDS: TabId[] = ['harita', 'kuran', 'ulasim', 'hac', 'vakitler', 'kible', 'zikir', 'hadis'];
/** Yuva rotaları: alt çubuğun 1., 2. ve 4. sekmesi */
export const SLOT_ROUTES = ['s1', 's2', 's4'] as const;
export const DEFAULT_TABS: TabId[] = ['harita', 'kuran', 'ulasim'];
/** Bölüm sekmede değilse açılacağı yığın ekranı */
export const STACK_ROUTE: Record<TabId, string> = {
  harita: '/harita', kuran: '/kuran', ulasim: '/ulasim', hac: '/hac-umre', vakitler: '/vakitler', kible: '/kible', zikir: '/zikir', hadis: '/hadis-dua',
};
/** Kaydırınca sekme değişmesin (haritayı sürüklemek, pusula) */
export const NO_SWIPE: TabId[] = ['harita', 'ulasim', 'kible'];

/** Kayıttaki seçimi doğrular: 3 yuva, bilinen ve farklı bölümler; değilse varsayılan */
export function normTabs(t?: readonly string[] | null): TabId[] {
  if (!t || t.length !== 3) return DEFAULT_TABS;
  const ok = t.every((x) => (TAB_IDS as string[]).includes(x)) && new Set(t).size === 3;
  return ok ? (t as TabId[]) : DEFAULT_TABS;
}

/** Yuvaya bölüm koyar; bölüm başka yuvadaysa ikisi yer değiştirir (aynı bölüm iki sekmede olmaz) */
export function setSlot(tabs: readonly string[] | null | undefined, slot: number, id: TabId): TabId[] {
  const cur = [...normTabs(tabs)];
  const other = cur.indexOf(id);
  if (other >= 0 && other !== slot) cur[other] = cur[slot];
  cur[slot] = id;
  return cur;
}

/** Bölümün açılacağı yol: sekmedeyse o yuvanın rotası, değilse kendi yığın ekranı */
export function routeFor(id: TabId, tabs?: readonly string[] | null): string {
  const i = normTabs(tabs).indexOf(id);
  return i >= 0 ? `/${SLOT_ROUTES[i]}` : STACK_ROUTE[id];
}

/** Eski sabit sekme yolları (/harita, /kuran, /ulasim; sorgu dahil) bugünkü yere çevrilir; diğerleri olduğu gibi */
export function resolveTabPath(path: string, tabs?: readonly string[] | null): string {
  const q = path.indexOf('?');
  const base = q >= 0 ? path.slice(0, q) : path;
  const rest = q >= 0 ? path.slice(q) : '';
  const id = (['/harita', '/kuran', '/ulasim'] as const).indexOf(base as '/harita');
  return id >= 0 ? routeFor(DEFAULT_TABS[id], tabs) + rest : path;
}
