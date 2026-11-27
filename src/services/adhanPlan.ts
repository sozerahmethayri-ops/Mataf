// Ezan hatırlatmaları: hangi bildirimin ne zaman kurulacağını hesaplayan saf mantık.
// React Native'e bağlı değil — scripts/check-logic.ts doğrudan test eder.
import { specialOn, toHijri } from './hijri';
import type { PrayerKey } from './prayer';

const KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type SoundId = 'zil' | 'can' | 'nagme' | 'damla' | 'default' | 'silent';
type ML = { tr: string; en: string; ar: string };

/** Uygulamayla gelen sesler (assets/sounds, app.json → expo-notifications eklentisi). */
export const SOUNDS: { id: SoundId; file: string | null; ml: ML }[] = [
  { id: 'zil', file: 'zil.wav', ml: { tr: 'Zil', en: 'Chime', ar: 'جرس' } },
  { id: 'can', file: 'can_sesi.wav', ml: { tr: 'Çan', en: 'Bell', ar: 'ناقوس' } },
  { id: 'nagme', file: 'nagme.wav', ml: { tr: 'Nağme (Hicaz)', en: 'Melody (Hijaz)', ar: 'نغمة (حجاز)' } },
  { id: 'damla', file: 'damla.wav', ml: { tr: 'Damla', en: 'Drops', ar: 'قطرات' } },
  { id: 'default', file: null, ml: { tr: 'Telefonun bildirim sesi', en: 'Phone notification sound', ar: 'صوت إشعار الهاتف' } },
  { id: 'silent', file: null, ml: { tr: 'Sessiz (yalnız titreşim)', en: 'Silent (vibrate only)', ar: 'صامت (اهتزاز فقط)' } },
];

export type NotifPrefs = {
  enabled: boolean;
  /** Vakitten kaç dakika önce hatırlatılsın (0 = önceden hatırlatma yok). */
  before: number;
  /** Vakit girdiğinde de bildir. */
  atTime: boolean;
  prayers: Record<PrayerKey, boolean>;
  sound: SoundId;
  place: 'here' | 'makkah' | 'madinah';
  /** Kullanıcının seçtiği tam ezan kaydı (uygulama açıkken / bildirime dokununca çalar). */
  adhanUri: string;
  adhanName: string;
  playAdhan: boolean;
  /** Kandil, bayram ve Ramazan için bir önceki akşam hatırlatma (ezan bildirimleri açıkken). */
  special: boolean;
  /** Hac günlerinde (8–13 Zilhicce) Arafat, Müzdelife ve şeytan taşlama hatırlatmaları (ezan bildirimlerinden bağımsız). */
  hajj: boolean;
  /** Cuma sabahı hatırlatma; dokununca Kehf sûresi açılır (ezan bildirimleri açıkken). */
  friday: boolean;
  /** Hatim planı: her gün yatsıdan 30 dk sonra hatırlatma (ezan bildirimlerinden bağımsız). */
  quran: boolean;
  /** "Bulunduğum yer" için son bilinen konum. */
  lat?: number;
  lng?: number;
};

export const DEFAULT_NOTIF: NotifPrefs = {
  enabled: false,
  before: 10,
  atTime: true,
  prayers: { fajr: true, sunrise: false, dhuhr: true, asr: true, maghrib: true, isha: true },
  sound: 'zil',
  place: 'here',
  adhanUri: '',
  adhanName: '',
  playAdhan: true,
  special: true,
  hajj: false,
  friday: true,
  quran: false,
};

export const BEFORE_CHOICES = [0, 5, 10, 15, 20, 30, 45];

export type Planned = { id: string; at: Date; prayer: PrayerKey; kind: 'before' | 'at'; prayerAt: Date };

const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

/**
 * Önümüzdeki günlerin bildirimlerini sırayla döndürür.
 * iOS bir uygulama için en çok 64 bekleyen bildirim tutar; `max` (60) bunun altında kalır.
 * Uygulama her açıldığında plan yenilenir, böylece pencere ileri kayar.
 */
export function planNotifications(
  timesFor: (day: Date) => Record<PrayerKey, Date>,
  now: Date,
  prefs: NotifPrefs,
  { days = 7, max = 60, minLeadMs = 5000 }: { days?: number; max?: number; minLeadMs?: number } = {},
): Planned[] {
  if (!prefs.enabled) return [];
  const out: Planned[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12);
    const t = timesFor(day);
    for (const k of KEYS) {
      if (!prefs.prayers[k]) continue;
      const at = t[k];
      if (!(at instanceof Date) || Number.isNaN(at.getTime())) continue; // kutup bölgelerinde vakit olmayabilir
      const push = (kind: Planned['kind'], when: Date) => {
        const id = `${k}-${ymd(at)}-${kind}`;
        if (when.getTime() - now.getTime() < minLeadMs || seen.has(id)) return;
        seen.add(id);
        out.push({ id, at: when, prayer: k, kind, prayerAt: at });
      };
      if (prefs.before > 0) push('before', new Date(at.getTime() - prefs.before * 60000));
      // Güneşin doğuşu namaz vakti değildir: yalnız "sabah namazının vakti çıkıyor" uyarısı verilir.
      if (prefs.atTime && k !== 'sunrise') push('at', at);
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, max);
}

const NAMES: Record<PrayerKey, ML> = {
  fajr: { tr: 'Sabah', en: 'Fajr', ar: 'الفجر' },
  sunrise: { tr: 'Güneş', en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { tr: 'Öğle', en: 'Dhuhr', ar: 'الظهر' },
  asr: { tr: 'İkindi', en: 'Asr', ar: 'العصر' },
  maghrib: { tr: 'Akşam', en: 'Maghrib', ar: 'المغرب' },
  isha: { tr: 'Yatsı', en: 'Isha', ar: 'العشاء' },
};
export const prayerName = (k: PrayerKey, lang: 'tr' | 'en' | 'ar') => NAMES[k][lang];

/** Bildirim başlığı ve metni. `time` hazır biçimlenmiş saat (ör. "12:21"). */
export function notifText(p: Planned, lang: 'tr' | 'en' | 'ar', time: string, minutes: number) {
  const tesrik = p.kind === 'at' && isTesrik(p.prayer, p.prayerAt)
    ? { tr: ' Farzdan sonra teşrik tekbiri.', en: ' Takbir al-tashriq after the fard.', ar: ' تكبير التشريق بعد الفريضة.' }[lang]
    : '';
  const n = NAMES[p.prayer][lang];
  if (p.prayer === 'sunrise') {
    return {
      title: { tr: `Güneşin doğmasına ${minutes} dk`, en: `${minutes} min to sunrise`, ar: `${minutes} دقيقة على الشروق` }[lang],
      body: { tr: `Sabah namazının vakti ${time}'de çıkıyor.`, en: `Fajr time ends at ${time}.`, ar: `ينتهي وقت الفجر الساعة ${time}.` }[lang],
    };
  }
  if (p.kind === 'before') {
    return {
      title: { tr: `${n} ezanına ${minutes} dk`, en: `${minutes} min to ${n} adhan`, ar: `${minutes} دقيقة على أذان ${n}` }[lang],
      body: { tr: `${n} namazı ${time}'de. Abdest ve hazırlık için vakit var.`, en: `${n} prayer at ${time}. Time to prepare and make wudu.`, ar: `صلاة ${n} الساعة ${time}. وقت للوضوء والاستعداد.` }[lang],
    };
  }
  const fajrNote = p.prayer === 'fajr'
    ? { tr: ' Namaz uykudan hayırlıdır.', en: ' Prayer is better than sleep.', ar: ' الصلاة خير من النوم.' }[lang]
    : '';
  return {
    title: { tr: `${n} ezanı vakti`, en: `${n} adhan time`, ar: `حان وقت أذان ${n}` }[lang],
    body: { tr: `${n} namazının vakti girdi: ${time}.${fajrNote}${tesrik}`, en: `It is time for ${n} prayer: ${time}.${fajrNote}${tesrik}`, ar: `دخل وقت صلاة ${n}: ${time}.${fajrNote}${tesrik}` }[lang],
  };
}

/** Android'de kanal sesi kanal oluşturulduktan sonra değiştirilemez; her ses için ayrı kanal. */
export const channelId = (s: SoundId) => `ezan-${s}-v1`;

/**
 * Teşrik tekbiri (Hanefî, tercih edilen görüş): Arefe (9 Zilhicce) sabah namazından bayramın 4. günü (13 Zilhicce)
 * ikindi namazına kadar her farzdan sonra; toplam 23 vakit. Hicrî gün Ümmü'l-Kurâ takvimine göredir.
 */
export function isTesrik(k: PrayerKey, at: Date) {
  if (k === 'sunrise') return false;
  const h = toHijri(at);
  if (h.m !== 12 || h.d < 9 || h.d > 13) return false;
  return h.d < 13 || k === 'fajr' || k === 'dhuhr' || k === 'asr';
}

/** Ezan dışındaki hatırlatmalar (mübarek günler, hac günleri). */
export type Extra = { id: string; at: Date; title: string; body: string; url: string };
type L3 = 'tr' | 'en' | 'ar';
type TimesAt = (lat: number, lng: number, day: Date) => Record<PrayerKey, Date>;
const ARAFAT = { lat: 21.3549, lng: 39.9841 };
const MINA = { lat: 21.4133, lng: 39.8933 };
const MAKKAH = { lat: 21.4225, lng: 39.8262 };

const SPECIAL_TEXT: Record<'night' | 'ramadan' | 'eid' | 'arefe' | 'day', { title: Record<L3, string>; body: Record<L3, string> }> = {
  night: { title: { tr: 'Bu gece {n}', en: 'Tonight: {n}', ar: 'الليلة: {n}' }, body: { tr: 'Kandiliniz mübarek olsun. Dua, Kur’an ve namaz için güzel bir gece.', en: 'A blessed night for prayer, du‘a and the Quran.', ar: 'ليلة مباركة للصلاة والدعاء وقراءة القرآن.' } },
  ramadan: { title: { tr: 'Yarın Ramazan başlıyor', en: 'Ramadan starts tomorrow', ar: 'رمضان يبدأ غدًا' }, body: { tr: 'İlk sahur bu gece. Ramazanınız mübarek olsun.', en: 'The first suhur is tonight. Ramadan Mubarak.', ar: 'السحور الأول الليلة. رمضان مبارك.' } },
  eid: { title: { tr: 'Yarın {n}', en: 'Tomorrow: {n}', ar: 'غدًا: {n}' }, body: { tr: 'Bayramınız mübarek olsun.', en: 'Eid Mubarak.', ar: 'عيد مبارك.' } },
  arefe: { title: { tr: 'Yarın Arefe günü', en: 'Tomorrow is the Day of Arafah', ar: 'غدًا يوم عرفة' }, body: { tr: 'Teşrik tekbiri yarın sabah namazından itibaren her farzdan sonra getirilir.', en: 'Takbir al-tashriq starts after tomorrow’s Fajr, after every fard prayer.', ar: 'يبدأ تكبير التشريق بعد فجر الغد عقب كل فريضة.' } },
  day: { title: { tr: 'Yarın {n}', en: 'Tomorrow: {n}', ar: 'غدًا: {n}' }, body: { tr: 'Hayırlı ve mübarek olsun.', en: 'May it be blessed.', ar: 'جعله الله مباركًا.' } },
};

/**
 * `days` gün içindeki mübarek gün ve hac hatırlatmaları. Mübarek günler bir önceki akşam (akşam vakti, kullanıcının
 * yeri), hac anları Arafat/Mina vakitlerine göre (Ümmü'l-Kurâ). Sıralı döner.
 */
const FRIDAY_TEXT = {
  title: { tr: 'Hayırlı cumalar', en: 'Blessed Friday', ar: 'جمعة مباركة' },
  body: { tr: 'Kehf sûresini açmak için dokunun.', en: 'Tap to open Surah al-Kahf.', ar: 'اضغط لفتح سورة الكهف.' },
};
const QURAN_TEXT = {
  title: { tr: 'Hatim planı', en: 'Khatm plan', ar: 'خطة الختمة' },
  body: { tr: 'Bugünkü bölümünüzü okumak için dokunun.', en: 'Tap to read today’s portion.', ar: 'اضغط لقراءة ورد اليوم.' },
};

export function planExtras(opts: {
  now: Date; days: number; lang: L3; special: boolean; hajj: boolean;
  /** Cuma sabahı (güneş doğduktan 1 saat sonra) */
  friday?: boolean;
  /** Hatim planı (yatsıdan 30 dk sonra) */
  quran?: boolean;
  timesFor: (day: Date) => Record<PrayerKey, Date>;
  timesAt: TimesAt;
  minLeadMs?: number;
}): Extra[] {
  const { now, days, lang, timesFor, timesAt } = opts;
  const lead = opts.minLeadMs ?? 5000;
  const out: Extra[] = [];
  const add = (id: string, at: Date | undefined, title: string, body: string, url: string) => {
    if (!(at instanceof Date) || Number.isNaN(at.getTime()) || at.getTime() - now.getTime() < lead) return;
    out.push({ id, at, title, body, url });
  };
  for (let i = 0; i <= days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12);
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 12);
    const tag = `${day.getFullYear()}${day.getMonth() + 1}${day.getDate()}`;
    if (opts.special) {
      const hn = toHijri(next);
      const sp = specialOn(next);
      if (sp) {
        const kind = sp.night ? 'night' : hn.m === 9 && hn.d === 1 ? 'ramadan' : hn.m === 12 && hn.d === 9 ? 'arefe' : (hn.m === 10 && hn.d === 1) || (hn.m === 12 && hn.d === 10) ? 'eid' : 'day';
        const tx = SPECIAL_TEXT[kind];
        add(`ozel-${tag}`, timesFor(day).maghrib, tx.title[lang].replace('{n}', sp.name[lang]), tx.body[lang], '/vakitler');
      }
    }
    if (opts.friday && day.getDay() === 5) {
      add(`cuma-${tag}`, new Date(timesFor(day).sunrise.getTime() + 60 * 60e3), FRIDAY_TEXT.title[lang], FRIDAY_TEXT.body[lang], '/kuran/18');
    }
    if (opts.quran) {
      add(`hatim-${tag}`, new Date(timesFor(day).isha.getTime() + 30 * 60e3), QURAN_TEXT.title[lang], QURAN_TEXT.body[lang], '/hatim');
    }
    if (opts.hajj) {
      const h = toHijri(day);
      if (h.m === 12 && h.d >= 8 && h.d <= 13) {
        const ar = timesAt(ARAFAT.lat, ARAFAT.lng, day);
        const mi = timesAt(MINA.lat, MINA.lng, day);
        const T = (tr: string, en: string, ar2: string) => ({ tr, en, ar: ar2 })[lang];
        if (h.d === 8) {
          const mk = timesAt(MAKKAH.lat, MAKKAH.lng, day);
          add(`hac-8-${tag}`, new Date(mk.fajr.getTime() + 60 * 60e3), T('Bugün Terviye (8 Zilhicce)', 'Today is Tarwiyah (8 Dhu al-Hijjah)', 'اليوم يوم التروية'),
            T('Hac ihramı ve Mina. Çadırınızın yerini Yerlerim’e kaydedin.', 'Hajj ihram and Mina. Save your tent in My places.', 'إحرام الحج ومنى. احفظ موقع خيمتك.'), '/hac');
        }
        if (h.d === 9) {
          add(`hac-9a-${tag}`, ar.dhuhr, T('Arafat vakfesi başladı', 'The standing at Arafat has begun', 'بدأ الوقوف بعرفة'),
            T('Öğle vakti girdi. Güneş batana kadar Arafat sınırları içinde kalın; dua vaktidir.', 'Dhuhr has entered. Stay within Arafat until sunset; it is the time for du‘a.', 'دخل وقت الظهر. ابقَ في حدود عرفة حتى الغروب.'), '/hac-harita?yer=arafat');
          add(`hac-9b-${tag}`, ar.maghrib, T('Güneş battı: Müzdelife’ye hareket', 'Sunset: move to Muzdalifah', 'غربت الشمس: النفرة إلى مزدلفة'),
            T('Akşam ve yatsıyı Müzdelife’de, yatsı vaktinde birlikte kılın; taşları toplayın.', 'Pray Maghrib and Isha together in Muzdalifah at Isha time; collect pebbles.', 'صلِّ المغرب والعشاء جمعًا في مزدلفة واجمع الحصى.'), '/hac-harita?yer=muzdelife');
        }
        if (h.d === 10) {
          add(`hac-10-${tag}`, mi.fajr, T('Bayramın 1. günü: Akabe cemresi', 'Eid day 1: Jamrat al-Aqabah', 'يوم النحر: جمرة العقبة'),
            T('Taş atma vakti girdi. Sıra: taş, kurban, tıraş.', 'Stoning time has begun. Order: stoning, sacrifice, shaving.', 'دخل وقت الرمي. الترتيب: الرمي ثم النحر ثم الحلق.'), '/cemerat');
        }
        if (h.d === 11 || h.d === 12 || h.d === 13) {
          const n = h.d - 9;
          add(`hac-${h.d}-${tag}`, mi.dhuhr, T(`Taşlama vakti girdi (bayramın ${n}. günü)`, `Stoning time (Eid day ${n})`, `دخل وقت الرمي (اليوم ${n})`),
            h.d === 13
              ? T('Mina’da kalanlar: küçük, orta, büyük cemre, yedişer taş. Vakit güneş batınca biter.', 'If you stayed in Mina: small, middle, large jamrah, seven each. Time ends at sunset.', 'لمن بقي في منى: سبع حصيات لكل جمرة؛ ينتهي الوقت بالغروب.')
              : T('Küçük, orta, büyük cemre; yedişer taş. Vakit yarın imsaka kadar.', 'Small, middle, large jamrah; seven each. Time lasts until tomorrow’s Fajr.', 'الصغرى ثم الوسطى ثم الكبرى، سبع حصيات لكل منها.'), '/cemerat');
        }
        if (h.d === 12) {
          add(`hac-12b-${tag}`, mi.maghrib, T('Mina’dan erken ayrılacak mısınız?', 'Leaving Mina early?', 'هل ستتعجل من منى؟'),
            T('Erken ayrılacaksanız (nefr-i evvel) 13’ünün imsakından önce Mina’dan çıkın; yoksa 13’ünde de taş atarsınız.', 'If leaving early, exit Mina before Fajr of the 13th; otherwise you stone on the 13th too.', 'إن تعجلت فاخرج من منى قبل فجر الثالث عشر.'), '/cemerat');
        }
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
