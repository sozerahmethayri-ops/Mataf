// Çevrimdışı paket: Kur'an + meal, dua sesleri ve Mekke/Medine haritası telefona indirilir.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Btn, Card, Header, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { TRANSLIT } from '@/data/quranEditions';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import {
  OFFLINE_SUPPORTED, deleteOffline, downloadDuaAudio, downloadMaps, downloadQuran, duaAyahs, getIndex, type Cancel, type OfflineIndex,
} from '@/services/offline';
import { AREAS, tilesFor } from '@/services/offlineMath';
import { useQuranPrefs } from '@/services/QuranPrefs';

type Lang = 'tr' | 'en' | 'ar';
type Part = 'quran' | 'audio' | 'maps';
const L = {
  title: { tr: 'Çevrimdışı paket', en: 'Offline pack', ar: 'الحزمة دون اتصال' },
  intro: { tr: 'Mekke ve Medine’de kalabalıkta mobil internet çökebilir. Burada indirdikleriniz internetsiz çalışır. Wi-Fi’de indirmeniz önerilir.', en: 'Mobile internet can fail in the crowds of Makkah and Madinah. What you download here works without internet. Wi-Fi is recommended.', ar: 'قد ينقطع الإنترنت في الزحام. ما تنزّله هنا يعمل دون اتصال. يُنصح بشبكة Wi-Fi.' },
  already: { tr: 'Zaten internetsiz çalışanlar: Haram/Nebevî 3D haritası, namaz vakitleri, kıble, dua metinleri, tavaf ve sa’y sayaçları, umre rehberi, zikirmatik, kaza takibi.', en: 'Already work offline: the Haram/Nabawi 3D map, prayer times, qibla, du‘a texts, tawaf and sa‘y counters, umrah guide, dhikr counter, missed prayers.', ar: 'تعمل دون اتصال أصلًا: الخريطة ثلاثية الأبعاد، المواقيت، القبلة، نصوص الأدعية، الطواف والسعي، دليل العمرة.' },
  quran: { tr: 'Kur’an-ı Kerîm', en: 'The Quran', ar: 'القرآن الكريم' },
  quranSub: { tr: 'Arapça metin ve seçili meal/okunuş (Kur’an okuma ayarlarınıza göre).', en: 'Arabic text and your selected translation/transliteration.', ar: 'النص العربي والترجمة المختارة.' },
  audio: { tr: 'Dua ayetlerinin kâri sesi', en: 'Recitation of du‘a verses', ar: 'تلاوة آيات الأدعية' },
  audioSub: { tr: 'Tavaf, sa’y ve dua kütüphanesindeki ayetler (Mişârî el-Afâsî). Diğer dualar zaten cihaz sesiyle okunur.', en: 'Verses used in tawaf, sa‘y and the du‘a library (Mishary Alafasy). Other du‘as use the device voice anyway.', ar: 'آيات الطواف والسعي ومكتبة الأدعية (مشاري العفاسي).' },
  maps: { tr: 'Harita (Mekke ve Medine)', en: 'Map (Makkah and Madinah)', ar: 'الخريطة (مكة والمدينة)' },
  mapsSub: { tr: 'Şehir, ulaşım, otel ve cami haritaları internetsiz açılır; paket dışındaki yerler için internet gerekir.', en: 'City, transport, hotel and mosque maps open offline; other places still need internet.', ar: 'تُفتح خرائط المدينة والتنقل دون اتصال.' },
  approx: { tr: 'yaklaşık', en: 'about', ar: 'نحو' },
  download: { tr: 'İndir', en: 'Download', ar: 'تنزيل' },
  update: { tr: 'Güncelle', en: 'Update', ar: 'تحديث' },
  del: { tr: 'Sil', en: 'Delete', ar: 'حذف' },
  cancel: { tr: 'Durdur', en: 'Stop', ar: 'إيقاف' },
  done: { tr: 'İndirildi', en: 'Downloaded', ar: 'تم التنزيل' },
  failed: { tr: 'İndirilemedi', en: 'Download failed', ar: 'تعذّر التنزيل' },
  delAsk: { tr: 'Bu paket telefondan silinsin mi?', en: 'Delete this pack from the phone?', ar: 'حذف هذه الحزمة؟' },
  tiles: { tr: 'karo', en: 'tiles', ar: 'مربع' },
  verses: { tr: 'ayet', en: 'verses', ar: 'آية' },
  web: { tr: 'Web sürümünde çevrimdışı paket yok; telefon uygulamasında kullanılabilir.', en: 'The offline pack is not available on the web version; use the phone app.', ar: 'غير متاح في نسخة الويب.' },
} satisfies Record<string, T3>;

const mb = (b: number) => `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',')} MB`;

export default function OfflineScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const { prefs } = useQuranPrefs();
  const [idx, setIdx] = useState<OfflineIndex>(() => getIndex());
  const [busy, setBusy] = useState<{ part: Part; done: number; total: number } | null>(null);
  const [areas, setAreas] = useState<Record<'makkah' | 'madinah', boolean>>({ makkah: true, madinah: true });
  const cancel = useRef<Cancel>({ cancelled: false });
  useEffect(() => () => { cancel.current.cancelled = true; }, []);

  const editions = [prefs.translation, prefs.translit ? TRANSLIT[lang === 'en' ? 'en' : 'tr'] : null].filter(Boolean) as string[];
  const tileCount = AREAS.filter((a) => areas[a.id]).reduce((n, a) => n + tilesFor(a).length, 0);

  const run = async (part: Part) => {
    cancel.current = { cancelled: false };
    const prog = (done: number, total: number) => setBusy({ part, done, total });
    setBusy({ part, done: 0, total: 1 });
    try {
      if (part === 'quran') await downloadQuran(editions, prog, cancel.current);
      else if (part === 'audio') await downloadDuaAudio('ar.alafasy', prog, cancel.current);
      else await downloadMaps(AREAS.filter((a) => areas[a.id]).map((a) => a.id), prog, cancel.current);
    } catch (e) {
      Alert.alert(pick(L.failed, lg), String((e as Error)?.message ?? e));
    } finally {
      setBusy(null);
      setIdx({ ...getIndex() });
    }
  };
  const remove = (part: Part) => Alert.alert(pick(L[part], lg), pick(L.delAsk, lg), [
    { text: '✕', style: 'cancel' },
    { text: pick(L.del, lg), style: 'destructive', onPress: () => { deleteOffline(part).then(() => setIdx({ ...getIndex() })); } },
  ]);

  const block = (part: Part, icon: IconName, title: T3, sub: T3, size: string, info?: { at: number; bytes: number }, extra?: React.ReactNode) => {
    const mine = busy?.part === part;
    return (
      <Card style={{ gap: 10, borderWidth: 1, borderColor: info ? C.open : C.border }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name={icon} size={22} color={info ? C.open : C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>{pick(title, lg)}</Text>
            <Text style={T.small}>{info ? `${pick(L.done, lg)} · ${mb(info.bytes)} · ${new Date(info.at).toLocaleDateString(lang)}` : `${pick(L.approx, lg)} ${size}`}</Text>
          </View>
        </View>
        <Text style={T.body}>{pick(sub, lg)}</Text>
        {extra}
        {mine ? (
          <View style={{ gap: 6 }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
              <View style={{ width: `${busy!.total ? Math.round((busy!.done / busy!.total) * 100) : 0}%`, height: 8, backgroundColor: C.accent }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={C.accent} />
              <Text style={[T.small, { flex: 1 }]}>{busy!.done}/{busy!.total}</Text>
              <Pressable onPress={() => { cancel.current.cancelled = true; }} hitSlop={8}><Text style={{ fontSize: fs(14), fontWeight: '700', color: C.closed }}>{pick(L.cancel, lg)}</Text></Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn title={pick(info ? L.update : L.download, lg)} icon="data" style={{ flex: 1 }} disabled={!!busy} onPress={() => run(part)} />
            {info && <Btn title={pick(L.del, lg)} kind="secondary" icon="trash" disabled={!!busy} onPress={() => remove(part)} />}
          </View>
        )}
      </Card>
    );
  };

  return (
    <Screen>
      <Header back title={pick(L.title, lg)} />
      <Text style={T.body}>{pick(L.intro, lg)}</Text>
      <Text style={T.small}>{pick(L.already, lg)}</Text>
      {!OFFLINE_SUPPORTED ? (
        <Card tint={C.surface}><Text style={T.body}>{pick(L.web, lg)}</Text></Card>
      ) : (
        <>
          <SectionTitle>{pick(L.quran, lg)}</SectionTitle>
          {block('quran', 'book', L.quran, L.quranSub, `${3 + 2 * editions.length} MB`, idx.quran)}
          <SectionTitle>{pick(L.audio, lg)}</SectionTitle>
          {block('audio', 'speaker', L.audio, L.audioSub, `${duaAyahs().length} ${pick(L.verses, lg)} · ${Math.max(1, Math.round(duaAyahs().length * 0.2))} MB`, idx.audio)}
          <SectionTitle>{pick(L.maps, lg)}</SectionTitle>
          {block('maps', 'map', L.maps, L.mapsSub, `${tileCount} ${pick(L.tiles, lg)} · ${Math.round(tileCount * 0.15 + 3)} MB`, idx.maps,
            <View style={{ gap: 6 }}>
              {AREAS.map((a) => (
                <Pressable key={a.id} onPress={() => setAreas((s) => ({ ...s, [a.id]: !s[a.id] }))} accessibilityRole="checkbox" accessibilityState={{ checked: areas[a.id] }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: areas[a.id] ? C.accent : C.borderStrong, backgroundColor: areas[a.id] ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {areas[a.id] && <Icon name="check" size={14} color={C.onAccent} width={3} />}
                  </View>
                  <Text style={[T.body, { flex: 1 }]}>{pick(a.name, lg)}{idx.maps?.areas.includes(a.id) ? ' ✓' : ''}</Text>
                </Pressable>
              ))}
            </View>)}
        </>
      )}
    </Screen>
  );
}
