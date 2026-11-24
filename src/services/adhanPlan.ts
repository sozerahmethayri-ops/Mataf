// Ezan hatırlatmaları: hangi bildirimin ne zaman kurulacağını hesaplayan saf mantık.
// React Native'e bağlı değil — scripts/check-logic.ts doğrudan test eder.
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
    body: { tr: `${n} namazının vakti girdi — ${time}.${fajrNote}`, en: `It is time for ${n} prayer — ${time}.${fajrNote}`, ar: `دخل وقت صلاة ${n} — ${time}.${fajrNote}` }[lang],
  };
}

/** Android'de kanal sesi kanal oluşturulduktan sonra değiştirilemez; her ses için ayrı kanal. */
export const channelId = (s: SoundId) => `ezan-${s}-v1`;
