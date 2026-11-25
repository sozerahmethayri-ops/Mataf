// Acil durum: tek dokunuşla arama, konumu gönderme, en yakın hastaneler, Türkiye temsilcilikleri,
// sağlık kartı ve görevliye gösterilecek Arapça/İngilizce cümleler.
// Numaralar: Suudi Arabistan acil numaraları (911 birleşik hat Mekke, Medine, Riyad ve Doğu Bölgesi'nde) ve
// T.C. Cidde Başkonsolosluğu'nun sitesindeki iletişim bilgileri — Kasım 2026'da kontrol edildi (docs/VERI-KAYNAKLARI.md).
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import { Btn, Card, IconBtn, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { getJson } from '@/services/cache';
import { useLocation } from '@/services/location';
import { meters, parsePhoton, type Place } from '@/services/transport';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Acil durum', en: 'Emergency', ar: 'الطوارئ' },
  saudi: { tr: 'Suudi Arabistan acil numaraları', en: 'Saudi emergency numbers', ar: 'أرقام الطوارئ في السعودية' },
  free: { tr: 'Aramalar ücretsizdir. Türkiye’deyseniz: 112.', en: 'Calls are free. In Türkiye: 112.', ar: 'المكالمات مجانية.' },
  sendLoc: { tr: 'Konumumu gönder', en: 'Send my location', ar: 'أرسل موقعي' },
  whatsapp: { tr: 'WhatsApp ile', en: 'Via WhatsApp', ar: 'عبر واتساب' },
  other: { tr: 'Başka uygulama', en: 'Other app', ar: 'تطبيق آخر' },
  locWait: { tr: 'Konum bekleniyor…', en: 'Waiting for location…', ar: 'في انتظار الموقع…' },
  hospitals: { tr: 'En yakın hastaneler', en: 'Nearest hospitals', ar: 'أقرب المستشفيات' },
  noHosp: { tr: 'Yakında hastane bulunamadı ya da internet yok. 997’yi arayın.', en: 'No hospital found nearby or no internet. Call 997.', ar: 'لم يُعثر على مستشفى قريب أو لا يوجد إنترنت. اتصل بـ ٩٩٧.' },
  turkey: { tr: 'Türkiye temsilcilikleri', en: 'Turkish missions', ar: 'البعثات التركية' },
  turkeyNote: { tr: 'Kaynak: T.C. Cidde Başkonsolosluğu sitesi (Kasım 2026). Başkonsolosluk Pazar–Perşembe çalışır.', en: 'Source: Turkish Consulate General in Jeddah website (Nov 2026). Open Sunday–Thursday.', ar: 'المصدر: موقع القنصلية التركية في جدة (نوفمبر ٢٠٢٦).' },
  health: { tr: 'Sağlık kartım', en: 'My medical card', ar: 'بطاقتي الصحية' },
  healthNote: { tr: 'Görevliye ya da sağlık ekibine gösterin. Yalnız bu telefonda saklanır.', en: 'Show it to staff or paramedics. Stored only on this phone.', ar: 'اعرضها على المسعفين. محفوظة على هاتفك فقط.' },
  show: { tr: 'Tam ekran göster', en: 'Show full screen', ar: 'عرض بملء الشاشة' },
  phrases: { tr: 'Görevliye gösterin', en: 'Show to staff', ar: 'اعرضها على الموظف' },
  phrasesNote: { tr: 'Bir cümleye dokunun; Arapçası büyük yazıyla açılır.', en: 'Tap a phrase to show it large in Arabic.', ar: 'المس العبارة لعرضها بخط كبير.' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
  dir: { tr: 'Yol', en: 'Route', ar: 'الطريق' },
} satisfies Record<string, T3>;

const NUMBERS: { n: string; icon: IconName; title: T3; sub: T3; main?: boolean }[] = [
  { n: '911', icon: 'sos', main: true, title: { tr: 'Birleşik acil hat', en: 'Unified emergency', ar: 'الطوارئ الموحد' }, sub: { tr: 'Polis, ambulans, itfaiye · Mekke, Medine, Riyad', en: 'Police, ambulance, fire · Makkah, Madinah, Riyadh', ar: 'الشرطة والإسعاف والدفاع المدني' } },
  { n: '997', icon: 'hospital', title: { tr: 'Ambulans (Kızılay)', en: 'Ambulance (Red Crescent)', ar: 'الإسعاف (الهلال الأحمر)' }, sub: { tr: 'Tıbbi acil durum', en: 'Medical emergency', ar: 'حالة طبية طارئة' } },
  { n: '999', icon: 'alert', title: { tr: 'Polis', en: 'Police', ar: 'الشرطة' }, sub: { tr: 'Hırsızlık, kayıp, güvenlik', en: 'Theft, missing person, security', ar: 'سرقة، مفقود، أمن' } },
  { n: '998', icon: 'alert', title: { tr: 'Sivil savunma', en: 'Civil defence', ar: 'الدفاع المدني' }, sub: { tr: 'Yangın, sel, kurtarma', en: 'Fire, flood, rescue', ar: 'حريق، سيول، إنقاذ' } },
  { n: '993', icon: 'car', title: { tr: 'Trafik kazası', en: 'Traffic accident', ar: 'حوادث المرور' }, sub: { tr: 'Trafik polisi', en: 'Traffic police', ar: 'المرور' } },
];

const MISSIONS: { title: T3; phone: string; show: string; sub: T3 }[] = [
  { title: { tr: 'Cidde Başkonsolosluğu · acil hat', en: 'Consulate General Jeddah · emergency line', ar: 'القنصلية التركية في جدة · خط الطوارئ' }, phone: '+966532079651', show: '+966 53 207 96 51', sub: { tr: 'Mesai dışı ve tatillerde acil durumlar için', en: 'For emergencies outside working hours', ar: 'للحالات الطارئة خارج الدوام' } },
  { title: { tr: 'Cidde Başkonsolosluğu · santral', en: 'Consulate General Jeddah · switchboard', ar: 'القنصلية التركية في جدة' }, phone: '+966126601607', show: '+966 12 660 16 07', sub: { tr: 'Pazar–Perşembe 09.00–17.00', en: 'Sunday–Thursday 09:00–17:00', ar: 'الأحد–الخميس' } },
  { title: { tr: 'Din Hizmetleri Ataşeliği (Mekke)', en: 'Religious Services Attaché (Makkah)', ar: 'ملحقية الشؤون الدينية (مكة)' }, phone: '+966125668273', show: '+966 12 566 82 73', sub: { tr: 'Diyanet İşleri Başkanlığı', en: 'Diyanet', ar: 'رئاسة الشؤون الدينية' } },
  { title: { tr: 'Dışişleri Konsolosluk Çağrı Merkezi', en: 'Foreign Ministry consular call centre', ar: 'مركز الاتصال القنصلي' }, phone: '+903122922929', show: '+90 312 292 29 29', sub: { tr: '7/24, Ankara', en: '24/7, Ankara', ar: 'أنقرة' } },
];

const PHRASES: { tr: string; en: string; ar: string }[] = [
  { tr: 'Yardım edin!', en: 'Help me, please!', ar: 'ساعدوني من فضلكم!' },
  { tr: 'Kayboldum.', en: 'I am lost.', ar: 'لقد ضِعتُ.' },
  { tr: 'Grubumu kaybettim.', en: 'I have lost my group.', ar: 'فقدتُ مجموعتي.' },
  { tr: 'Yakınımı kaybettim.', en: 'I have lost a relative.', ar: 'فقدتُ أحد أقاربي.' },
  { tr: 'Lütfen ambulans çağırın.', en: 'Please call an ambulance.', ar: 'من فضلكم اتصلوا بالإسعاف.' },
  { tr: 'Hastaneye gitmem gerekiyor.', en: 'I need to go to the hospital.', ar: 'أحتاج إلى الذهاب إلى المستشفى.' },
  { tr: 'Lütfen polisi çağırın.', en: 'Please call the police.', ar: 'من فضلكم اتصلوا بالشرطة.' },
  { tr: 'Şeker hastasıyım.', en: 'I am diabetic.', ar: 'أنا مريض بالسكري.' },
  { tr: 'Kalp hastasıyım.', en: 'I have a heart condition.', ar: 'أنا مريض بالقلب.' },
  { tr: 'Bu ilaca alerjim var.', en: 'I am allergic to this medicine.', ar: 'عندي حساسية من هذا الدواء.' },
  { tr: 'Türk vatandaşıyım; lütfen Türk konsolosluğunu arayın.', en: 'I am a Turkish citizen; please call the Turkish consulate.', ar: 'أنا مواطن تركي، من فضلكم اتصلوا بالقنصلية التركية.' },
];

type Health = { blood: string; conditions: string; meds: string; allergies: string; contactName: string; contactPhone: string };
const HEALTH_FIELDS: { key: keyof Health; label: T3; ar: string; phone?: boolean }[] = [
  { key: 'blood', label: { tr: 'Kan grubu', en: 'Blood type' }, ar: 'فصيلة الدم' },
  { key: 'conditions', label: { tr: 'Kronik hastalıklar', en: 'Chronic conditions' }, ar: 'أمراض مزمنة' },
  { key: 'meds', label: { tr: 'Kullandığım ilaçlar', en: 'Medications' }, ar: 'الأدوية' },
  { key: 'allergies', label: { tr: 'Alerjiler', en: 'Allergies' }, ar: 'الحساسية' },
  { key: 'contactName', label: { tr: 'Yakınımın adı', en: 'Emergency contact' }, ar: 'جهة اتصال للطوارئ' },
  { key: 'contactPhone', label: { tr: 'Yakınımın telefonu', en: 'Contact phone' }, ar: 'رقم الهاتف', phone: true },
];

const call = (n: string) => Linking.openURL(`tel:${n}`).catch(() => undefined);
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export default function EmergencyScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { fix } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);
  const [health, setHealth] = usePersisted<Health>('health:card', { blood: '', conditions: '', meds: '', allergies: '', contactName: '', contactPhone: '' });
  const [big, setBig] = useState<{ ar: string; en: string; tr?: string } | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  // En yakın hastaneler (Photon, 6 km); konum ~1 km değişince yenilenir
  const areaKey = here ? `${here.lat.toFixed(2)},${here.lng.toFixed(2)}` : '';
  const [hosp, setHosp] = useState<{ key: string; list: Place[] | 'error' } | null>(null);
  useEffect(() => {
    if (!here) return;
    let alive = true;
    const key = areaKey;
    getJson<{ features?: [] }>(`https://photon.komoot.io/reverse?lat=${here.lat.toFixed(5)}&lon=${here.lng.toFixed(5)}&radius=6&limit=20&osm_tag=amenity:hospital&osm_tag=amenity:clinic`)
      .then((j) => alive && setHosp({ key, list: parsePhoton(j) }))
      .catch(() => alive && setHosp({ key, list: 'error' }));
    return () => { alive = false; };
  }, [areaKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const hospitals = useMemo(() => {
    if (!here || !hosp || hosp.list === 'error') return [];
    return hosp.list.map((p) => ({ ...p, d: meters(here, p) })).sort((a, b) => a.d - b.d).slice(0, 6);
  }, [hosp, here]);
  const [sel, setSel] = useState<string | undefined>(undefined);

  const locMsg = here
    ? `Acil yardıma ihtiyacım var! · أحتاج إلى مساعدة عاجلة · I need urgent help!\nhttps://www.google.com/maps/search/?api=1&query=${here.lat.toFixed(6)},${here.lng.toFixed(6)}${fix?.accuracy ? ` (±${Math.round(fix.accuracy)} m)` : ''}`
    : '';
  const sendWhatsApp = () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(locMsg)}`).catch(() => Share.share({ message: locMsg }));
  const hasHealth = Object.values(health).some((v) => v.trim());

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <Text style={[T.h2, { flex: 1, color: C.closed }]} numberOfLines={1}>{pick(L.title, lg)}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
        <SectionTitle>{pick(L.saudi, lg)}</SectionTitle>
        {NUMBERS.map((x) => (
          <Pressable key={x.n} onPress={() => call(x.n)} accessibilityRole="button" accessibilityLabel={`${pick(x.title, lg)} ${x.n}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: x.main ? 16 : 12, borderRadius: 18, backgroundColor: x.main ? C.closed : C.closedTint, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: fs(x.main ? 34 : 26), fontWeight: '900', color: x.main ? '#FFFFFF' : C.closed, minWidth: x.main ? 80 : 64 }}>{x.n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(16), fontWeight: '800', color: x.main ? '#FFFFFF' : C.ink }}>{pick(x.title, lg)}</Text>
              <Text style={{ fontSize: fs(12.5), color: x.main ? '#FFE4E1' : C.ink2 }}>{pick(x.sub, lg)}</Text>
            </View>
            <Icon name="phone" size={22} color={x.main ? '#FFFFFF' : C.closed} />
          </Pressable>
        ))}
        <Text style={T.small}>{pick(L.free, lg)}</Text>

        <SectionTitle>{pick(L.sendLoc, lg)}</SectionTitle>
        {here ? (
          <>
            <Text style={T.small}>{here.lat.toFixed(5)}, {here.lng.toFixed(5)}{fix?.accuracy ? ` · ±${Math.round(fix.accuracy)} m` : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn title={pick(L.whatsapp, lg)} kind="green" icon="send" style={{ flex: 1 }} onPress={sendWhatsApp} />
              <Btn title={pick(L.other, lg)} kind="secondary" icon="share" style={{ flex: 1 }} onPress={() => Share.share({ message: locMsg })} />
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color={C.muted} /><Text style={T.small}>{pick(L.locWait, lg)}</Text></View>
        )}

        <SectionTitle>{pick(L.hospitals, lg)}</SectionTitle>
        {here && (
          <View style={{ height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: C.mapGround }}>
            <OnlineMap pins={hospitals.map((h) => ({ id: h.id, lat: h.lat, lng: h.lng, color: C.closed, label: h.name, big: h.id === sel }))} user={here} fitUser
              selectedId={sel} onPin={setSel} fitKey={`${hosp?.key ?? ''}:${hospitals.length}`} controls={false} threeD={false} />
          </View>
        )}
        {!here ? null : !hosp ? <ActivityIndicator color={C.muted} /> : hospitals.length === 0 ? <Text style={T.small}>{pick(L.noHosp, lg)}</Text> : hospitals.map((h) => (
          <Pressable key={h.id} onPress={() => setSel(h.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
            <Icon name="hospital" size={20} color={C.closed} />
            <View style={{ flex: 1 }}>
              <Text style={[T.body, { fontWeight: h.id === sel ? '800' : '600' }]} numberOfLines={1}>{h.name}</Text>
              <Text style={T.small} numberOfLines={1}>{fmtDist(h.d)}{h.sub ? ` · ${h.sub}` : ''}</Text>
            </View>
            <Pressable onPress={() => setBig({ ar: `${PHRASES[5].ar}\n${h.name}`, en: `${PHRASES[5].en}\n${h.name}` })} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.surface }}>
              <Icon name="taxi" size={16} color={C.ink} />
            </Pressable>
          </Pressable>
        ))}

        <SectionTitle>{pick(L.turkey, lg)}</SectionTitle>
        {MISSIONS.map((m) => (
          <Pressable key={m.phone} onPress={() => call(m.phone)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color={C.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[T.body, { fontWeight: '600' }]}>{pick(m.title, lg)}</Text>
              <Text style={T.small}>{m.show} · {pick(m.sub, lg)}</Text>
            </View>
          </Pressable>
        ))}
        <Text style={T.small}>{pick(L.turkeyNote, lg)}</Text>

        <SectionTitle>{pick(L.health, lg)}</SectionTitle>
        <Text style={T.small}>{pick(L.healthNote, lg)}</Text>
        {HEALTH_FIELDS.map((f) => (
          <View key={f.key} style={{ gap: 4 }}>
            <Text style={T.small}>{pick(f.label, lg)} · {f.ar}</Text>
            <TextInput value={health[f.key]} onChangeText={(v) => setHealth({ [f.key]: v } as Partial<Health>)} keyboardType={f.phone ? 'phone-pad' : 'default'}
              style={{ minHeight: 44, borderRadius: 12, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: fs(15), color: C.ink }} />
          </View>
        ))}
        {hasHealth && <Btn title={pick(L.show, lg)} kind="secondary" icon="external" onPress={() => setCardOpen(true)} />}

        <SectionTitle>{pick(L.phrases, lg)}</SectionTitle>
        <Text style={T.small}>{pick(L.phrasesNote, lg)}</Text>
        <View style={{ gap: 8 }}>
          {PHRASES.map((p) => (
            <Pressable key={p.en} onPress={() => setBig(p)} style={({ pressed }) => ({ padding: 12, borderRadius: 14, backgroundColor: C.surface, gap: 4, opacity: pressed ? 0.75 : 1 })}>
              <Text style={[T.body, { fontWeight: '600' }]}>{lg === 'en' ? p.en : lg === 'ar' ? p.ar : p.tr}</Text>
              {lg !== 'ar' && <Text style={{ fontSize: fs(16), color: C.ink2, writingDirection: 'rtl', textAlign: 'right' }}>{p.ar}</Text>}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!big} animationType="fade" onRequestClose={() => setBig(null)} supportedOrientations={['portrait', 'landscape']}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <Pressable onPress={() => setBig(null)} style={{ flex: 1, padding: 24, gap: 20, justifyContent: 'center' }}>
            <Text style={{ fontSize: fs(40), fontWeight: '800', color: C.ink, textAlign: 'center', writingDirection: 'rtl', lineHeight: fs(60) }}>{big?.ar}</Text>
            <Text style={{ fontSize: fs(24), color: C.ink2, textAlign: 'center' }}>{big?.en}</Text>
            {big?.tr ? <Text style={{ fontSize: fs(18), color: C.muted, textAlign: 'center' }}>{big.tr}</Text> : null}
            <Btn title={pick(L.close, lg)} kind="secondary" onPress={() => setBig(null)} />
          </Pressable>
        </SafeAreaView>
      </Modal>

      <Modal visible={cardOpen} animationType="slide" onRequestClose={() => setCardOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
            <Text style={{ fontSize: fs(30), fontWeight: '900', color: C.closed, textAlign: 'center' }}>بطاقة طبية · Medical card</Text>
            {HEALTH_FIELDS.filter((f) => health[f.key].trim()).map((f) => (
              <Card key={f.key} style={{ gap: 4 }}>
                <Text style={{ fontSize: fs(16), color: C.ink2, writingDirection: 'rtl', textAlign: 'right' }}>{f.ar} · {f.label.en}</Text>
                <Text style={{ fontSize: fs(26), fontWeight: '800', color: C.ink }}>{health[f.key]}</Text>
              </Card>
            ))}
            {health.contactPhone.trim() ? <Btn title={`☎ ${health.contactPhone}`} icon="phone" onPress={() => call(health.contactPhone.replace(/[^\d+]/g, ''))} /> : null}
            <Btn title={pick(L.close, lg)} kind="secondary" onPress={() => setCardOpen(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
