// Nüzul sırası (0.25.0): 114 sûre iniş sırasıyla (Mekke 86, Medine 28), vahyin dönemleri ve olay kartları ("İlk vahiy:
// Alak 1–5"). Sûreye dokununca seçili okuma biçiminde açılır. Kartlar proje sahibinin YouTube videolarıyla eşleşir
// (anahtar "96:1-5"); video bağlantısı gelince kartta "Videoyu izle" çıkar. Veri: data/nuzul.ts.
import { Linking, Pressable, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { AR_DIGITS } from '@/components/QuranParts';
import { openReading } from '@/components/QuranModes';
import { Btn, Card, Header, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { MECCAN_COUNT, NUZUL_EPISODES, NUZUL_ORDER, NUZUL_PERIODS } from '@/data/nuzul';
import { AYAH_COUNTS } from '@/data/quranEditions';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { surahName } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';

const L = {
  title: { tr: 'Nüzul sırası', en: 'Order of revelation', ar: 'ترتيب النزول' },
  sub: { tr: 'Sûreler indiği sırayla', en: 'Surahs in the order revealed', ar: 'السور بترتيب نزولها' },
  intro: { tr: 'Kur\'an 23 yılda indi: 13 yıl Mekke\'de, 10 yıl Medine\'de. Sıra, sûrenin ilk âyetlerinin iniş zamanına göredir; bir sûrenin âyetleri farklı yıllarda inmiş olabilir.', en: 'The Quran was revealed over 23 years: 13 in Makkah and 10 in Madinah. The order follows when each surah\'s first verses came; a surah\'s verses may span several years.', ar: 'نزل القرآن في ثلاث وعشرين سنة: ثلاث عشرة في مكة وعشر في المدينة. الترتيب بحسب نزول أوائل السورة، وقد تنزل آيات السورة في سنوات مختلفة.' },
  periods: { tr: 'Dönemler', en: 'Periods', ar: 'المراحل' },
  events: { tr: 'Olaylar', en: 'Events', ar: 'الأحداث' },
  read: { tr: 'Âyetleri oku', en: 'Read the verses', ar: 'اقرأ الآيات' },
  video: { tr: 'Videoyu izle', en: 'Watch the video', ar: 'شاهد الفيديو' },
  meccan: { tr: 'Mekke\'de inenler ({n})', en: 'Revealed in Makkah ({n})', ar: 'المكية ({n})' },
  medinan: { tr: 'Medine\'de inenler ({n})', en: 'Revealed in Madinah ({n})', ar: 'المدنية ({n})' },
  row: { tr: '{s}. sûre · {a} âyet', en: 'Surah {s} · {a} verses', ar: 'السورة {s} · {a} آية' },
  source: { tr: 'Kaynak', en: 'Source', ar: 'المصدر' },
  note: { tr: 'Sıra: Kahire 1924 mushafının geleneksel sırası (Tanzil ile aynı). Ra\'d, Rahmân, İnsân, Zilzâl gibi birkaç sûrenin Mekkî mi Medenî mi olduğu tartışmalıdır. Henüz bir ilahiyatçı kontrolünden geçmedi.', en: 'Order: the traditional order of the 1924 Cairo mushaf (same as Tanzil). Whether a few surahs (e.g. al-Raʿd, al-Rahman, al-Insan, al-Zalzalah) are Makkan or Madinan is debated. Not yet reviewed by a scholar.', ar: 'الترتيب: الترتيب التقليدي لمصحف القاهرة 1924 (كما في تنزيل). في مكية بعض السور ومدنيتها خلاف (كالرعد والرحمن والإنسان والزلزلة). لم يُراجَع بعدُ من عالم.' },
} satisfies Record<string, ML>;

export default function NuzulScreen() {
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { prefs } = useQuranPrefs();
  const d = (x: number) => (lang === 'ar' ? AR_DIGITS(x) : String(x));
  const sections = [
    { key: 'm', title: pick(L.meccan, lang).replace('{n}', d(MECCAN_COUNT)), data: NUZUL_ORDER.slice(0, MECCAN_COUNT).map((s, i) => ({ s, r: i + 1 })) },
    { key: 'd', title: pick(L.medinan, lang).replace('{n}', d(114 - MECCAN_COUNT)), data: NUZUL_ORDER.slice(MECCAN_COUNT).map((s, i) => ({ s, r: MECCAN_COUNT + i + 1 })) },
  ];
  const withCard = new Set(NUZUL_EPISODES.map((e) => e.s));
  const open = (s: number, a = 1) => openReading(prefs.view ?? 'ar+meal', s, a);

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
      sections={sections}
      keyExtractor={(x) => String(x.s)}
      initialNumToRender={16}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Header back title={pick(L.title, lang)} subtitle={pick(L.sub, lang)} />
          <Text style={T.body}>{pick(L.intro, lang)}</Text>
          {NUZUL_EPISODES.map((e) => (
            <Card key={e.key} tint={C.accentSoft} style={{ gap: 8 }}>
              <Text style={T.h2}>{pick(e.title, lang)}</Text>
              <Text style={T.small}>{pick(e.when, lang)} · {pick(e.place, lang)}</Text>
              <Text style={T.body}>{pick(e.story, lang)}</Text>
              <Text style={T.small}>{pick(L.source, lang)}: {e.sources}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Btn title={pick(L.read, lang)} icon="book" style={{ flex: 1 }} onPress={() => open(e.s, e.from)} />
                {e.video ? <Btn title={pick(L.video, lang)} icon="play" kind="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(e.video!)} /> : null}
              </View>
            </Card>
          ))}
          <Text style={[T.h2, { marginTop: 4 }]}>{pick(L.periods, lang)}</Text>
          {NUZUL_PERIODS.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 14 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: i < 3 ? C.accent : C.green }} />
                {i < NUZUL_PERIODS.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: C.border }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 12, gap: 2 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{pick(p.title, lang)} · {p.years}</Text>
                <Text style={T.small}>{pick(p.events, lang)}</Text>
              </View>
            </View>
          ))}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={{ fontSize: fs(13), fontWeight: '800', color: section.key === 'm' ? C.accent : C.green, marginTop: 12, marginBottom: 4 }}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <Pressable onPress={() => open(item.s)} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ width: 34, textAlign: 'center', fontSize: fs(14), fontWeight: '800', color: C.muted }}>{d(item.r)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(16), fontWeight: '600', color: C.ink }}>{surahName(item.s, lang)}</Text>
            <Text style={T.small}>{pick(L.row, lang).replace('{s}', d(item.s)).replace('{a}', d(AYAH_COUNTS[item.s - 1]))}</Text>
          </View>
          {withCard.has(item.s) ? <Icon name="play" size={14} color={C.accent} /> : null}
          <Icon name="chevron" size={16} color={C.muted} />
        </Pressable>
      )}
      ListFooterComponent={<Text style={[T.small, { marginTop: 16 }]}>{pick(L.note, lang)}</Text>}
    />
  );
}
