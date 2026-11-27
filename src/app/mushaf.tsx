// Mushaf: Kur'an sayfa sayfa (Medine düzeni, 604 sayfa), kâğıt mushaf gibi sağa sola çevrilir. Sayfa 1 sağda,
// sonraki sayfa solda: parmağı soldan sağa kaydırınca bir sonraki sayfa gelir. Yalnız görünen sayfa ve iki komşusu
// çizilir; yazı büyütme yalnız onları yeniden dizer (sûre okuma ekranındaki gibi yüzlerce âyeti değil). Sayfa metni
// çevrimdışı paketten ya da alquran.cloud /page'den gelir ve cihazda saklanır. Tecvid renkleri açılıp kapanır.
// Âyete dokununca ayraç; ayraçla açıldıysa (b) okunan sayfanın ilk âyeti ayraca yazılır. Son sayfa quran:prefs.page.
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, I18nManager, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AR_DIGITS, MarkSheet, QL, TajweedLegend, nextZoom } from '@/components/QuranParts';
import { Btn, Header, IconBtn, T } from '@/components/ui';
import { C, fs, fsAr, isDark } from '@/constants/theme';
import { lineFor } from '@/data/quranFonts';
import { PAGE_COUNT, pageAyahs, pageOf } from '@/data/quranPages';
import { SAJDAH_SIGN, isSajdah, stripSajdahSign } from '@/data/sajdah';
import { ruleColor } from '@/data/tajweed';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { juzOf } from '@/services/hatim';
import { getPageText, stripBasmala, surahName, type PageAyah } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { parseTajweed, stripTajweedBasmala } from '@/services/tajweed';
import { useAsync } from '@/services/useAsync';
import { useQuranFont } from '@/services/useQuranFont';

const L = {
  tajweed: { tr: 'Tecvid renkleri', en: 'Tajweed colours', ar: 'ألوان التجويد' },
  list: { tr: 'Âyet âyet, mealli okuma', en: 'Verse by verse with translation', ar: 'آية آية مع الترجمة' },
  err: { tr: 'Sayfa yüklenemedi. İnternet bağlantınızı kontrol edin ya da Çevrimdışı paketi indirin.', en: 'The page could not be loaded. Check your connection or download the offline pack.', ar: 'تعذّر تحميل الصفحة. تحقّق من الاتصال أو نزّل الحزمة دون اتصال.' },
  juz: { tr: '{j}. cüz', en: 'Juz {j}', ar: 'الجزء {j}' },
  sajdah: { tr: 'Secde âyeti', en: 'Verse of prostration', ar: 'آية سجدة' },
};
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const clampPage = (p: number) => Math.max(1, Math.min(PAGE_COUNT, Math.round(p) || 1));

export default function MushafScreen() {
  const { p, s, a, b } = useLocalSearchParams<{ p?: string; s?: string; a?: string; b?: string }>();
  const { lang } = useI18n();
  const lg = lang as Lang;
  const { prefs, setPrefs, bookmarks, saveBookmark } = useQuranPrefs();
  const { width } = useWindowDimensions();
  const [start] = useState(() => clampPage(p ? Number(p) : s ? pageOf(Number(s) || 1, Number(a) || 1) : 1));
  const [page, setPage] = useState(start);
  const pages = useMemo(() => Array.from({ length: PAGE_COUNT }, (_, i) => i + 1), []);
  const tajweed = prefs.view === 'tecvid';
  const z = prefs.zoom ?? 1;
  const dark = isDark();
  const [mark, setMark] = useState<{ s: number; a: number } | null>(null);
  const [onAyah] = useState(() => (sn: number, an: number) => setMark({ s: sn, a: an }));
  // Sayfa 1 sağda, sonraki solda: soldan sağa düzende liste ters çevrilir (Arapça telefonda düzen zaten sağdan sola)
  const inverted = !(Platform.OS !== 'web' && I18nManager.isRTL);
  const [fs0, fa0] = pageAyahs(page)[0];
  const d = (x: number) => (lg === 'ar' ? AR_DIGITS(x) : String(x));

  // Görünen sayfa (kaydırma bitince)
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: { item?: unknown }[] }) => {
    const it = viewableItems[0]?.item;
    if (typeof it === 'number') setPage(it);
  });
  const [viewCfg] = useState(() => ({ itemVisiblePercentThreshold: 60 }));

  // Son sayfa ve (ayraçla açıldıysa) ayraç yeri, sayfada biraz durunca kaydedilir
  useEffect(() => {
    const id = setTimeout(() => {
      setPrefs({ page });
      const bm = b ? bookmarks.find((x) => x.id === b) : undefined;
      if (bm && (bm.surah !== fs0 || bm.ayah !== fa0)) saveBookmark({ ...bm, surah: fs0, ayah: fa0 });
    }, 1200);
    return () => clearTimeout(id);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ paddingHorizontal: 16 }}>
        <Header back title={surahName(fs0, lg)} subtitle={pick(QL.pageMark, lg).replace('{p}', d(page)).replace('{j}', d(juzOf(fs0, fa0)))}
          right={
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <IconBtn name="minus" size={40} label={pick(QL.zoomOut, lg)} onPress={() => setPrefs({ zoom: nextZoom(z, -1) })} />
              <IconBtn name="plus" size={40} label={pick(QL.zoomIn, lg)} onPress={() => setPrefs({ zoom: nextZoom(z, 1) })} />
              <IconBtn name="palette" size={40} label={pick(L.tajweed, lg)} tint={tajweed ? C.accentTint : C.surface} color={tajweed ? C.accent : C.ink}
                onPress={() => setPrefs({ view: tajweed ? 'mushaf' : 'tecvid' })} />
              <IconBtn name="list" size={40} label={pick(L.list, lg)}
                onPress={() => { setPrefs({ view: 'ar+meal' }); router.replace({ pathname: '/kuran/[sure]', params: { sure: String(fs0), a: String(fa0), ...(b ? { b } : null) } }); }} />
            </View>
          } />
      </View>
      {tajweed && <View style={{ paddingHorizontal: 16, paddingTop: 6 }}><TajweedLegend lang={lg} dark={dark} /></View>}
      <FlatList
        data={pages}
        keyExtractor={(x) => String(x)}
        horizontal
        pagingEnabled
        inverted={inverted}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialScrollIndex={start - 1}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewCfg}
        style={Platform.OS === 'web' ? { flex: 1, direction: 'ltr' } : { flex: 1 }}
        renderItem={({ item }) => <MushafPage page={item} width={width} z={z} font={prefs.font} tajweed={tajweed} dark={dark} lang={lg} onAyah={onAyah} />}
      />
      <MarkSheet visible={!!mark} ayah={mark?.a ?? 1} surah={mark?.s ?? 1} lang={lg} bookmarks={bookmarks}
        onPick={(bm) => { if (mark) saveBookmark({ ...bm, surah: mark.s, ayah: mark.a }); setMark(null); }} onClose={() => setMark(null)} />
    </SafeAreaView>
  );
}

type PageProps = { page: number; width: number; z: number; font?: string; tajweed: boolean; dark: boolean; lang: Lang; onAyah: (s: number, a: number) => void };

/** Tek mushaf sayfası: çerçeve, cüz ve sûre adı, sûre başlıkları ve besmele, âyetler, sayfa numarası */
const MushafPage = memo(function MushafPage({ page, width, z, font, tajweed, dark, lang, onAyah }: PageProps) {
  const { t } = useI18n();
  const { f: qf, fontFamily: qff } = useQuranFont(font);
  const [attempt, setAttempt] = useState(0);
  const res = useAsync(() => getPageText(page, tajweed), [page, tajweed, attempt]);
  const d = (x: number) => (lang === 'ar' ? AR_DIGITS(x) : String(x));
  const [s0, a0] = pageAyahs(page)[0];
  const size = fsAr(23) * z * qf.size;
  const line = lineFor(qf, size, fsAr(50) * z);
  // Sayfadaki sûre parçaları (bir sayfada birden çok sûre olabilir; sûre başında başlık ve besmele)
  const groups = useMemo(() => {
    const out: { s: number; ayahs: PageAyah[] }[] = [];
    for (const x of res.data?.ayahs ?? []) {
      if (!out.length || out[out.length - 1].s !== x.s) out.push({ s: x.s, ayahs: [] });
      out[out.length - 1].ayahs.push(x);
    }
    return out;
  }, [res.data]);
  const names = res.data?.names ?? {};
  const onPage = [...new Set(pageAyahs(page).map(([sn]) => sn))].map((sn) => names[sn] ?? surahName(sn, lang)).join(' · ');

  return (
    <View style={{ width, flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ borderWidth: 2, borderColor: C.accentTint, borderRadius: 16, padding: 3, backgroundColor: C.surface }}>
          <View style={{ borderWidth: 1, borderColor: C.accentTint, borderRadius: 13, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{pick(L.juz, lang).replace('{j}', d(juzOf(s0, a0)))}</Text>
              <Text style={{ flexShrink: 1, fontSize: fs(12), fontWeight: '700', color: C.accent, textAlign: 'right' }} numberOfLines={1}>{onPage}</Text>
            </View>
            {res.error ? (
              <View style={{ gap: 10, paddingVertical: 24 }}>
                <Text style={T.body}>{pick(L.err, lang)}</Text>
                <Btn title={t('common.retry')} kind="secondary" onPress={() => setAttempt((n) => n + 1)} />
              </View>
            ) : !res.data ? (
              <ActivityIndicator style={{ marginVertical: 48 }} color={C.accent} />
            ) : (
              groups.map((g) => {
                const starts = g.ayahs[0]?.a === 1;
                return (
                  <View key={g.s} style={{ gap: 4 }}>
                    {starts && (
                      <View style={{ marginTop: 4, paddingVertical: 6, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.accentTint, alignItems: 'center' }}>
                        <Text style={{ fontFamily: names[g.s] ? qff : undefined, fontSize: size * 0.9, lineHeight: lineFor(qf, size * 0.9, fsAr(40) * z), color: C.accent, fontWeight: '700', textAlign: 'center' }}>
                          {names[g.s] ?? surahName(g.s, lang)}
                        </Text>
                      </View>
                    )}
                    {starts && g.s !== 1 && g.s !== 9 && (
                      <Text style={{ fontFamily: qff, fontSize: size, lineHeight: line, color: C.ink, textAlign: 'center', writingDirection: 'rtl' }}>{BASMALA}</Text>
                    )}
                    {/* direction: web'de paragraf sağdan sola olsun (writingDirection yalnız iOS'ta işler) */}
                    <Text style={{ fontFamily: qff, fontSize: size, lineHeight: line, color: C.ink, textAlign: 'justify', writingDirection: 'rtl', direction: 'rtl' }}>
                      {g.ayahs.map((x) => {
                        const sj = isSajdah(x.s, x.a);
                        const segs = tajweed ? stripTajweedBasmala(x.s, x.a, parseTajweed(x.text)) : null;
                        return (
                          <Text key={x.a} onPress={() => onAyah(x.s, x.a)} style={sj ? { backgroundColor: C.greenTint } : undefined}>
                            {segs
                              ? segs.map((sg, k) => {
                                const tx = k === segs.length - 1 ? stripSajdahSign(sg.t) : sg.t;
                                return sg.r ? <Text key={k} style={{ color: ruleColor(sg.r, dark) }}>{tx}</Text> : tx;
                              })
                              : stripSajdahSign(stripBasmala(x.s, x.a, x.text))}
                            {sj ? <Text style={{ color: C.green, fontWeight: '700' }} accessibilityLabel={pick(L.sajdah, lang)}>{` ${SAJDAH_SIGN}`}</Text> : null}
                            <Text style={{ color: C.accent, fontWeight: '700', fontSize: size * 0.88 }}>{` ﴿${AR_DIGITS(x.a)}﴾ `}</Text>
                          </Text>
                        );
                      })}
                    </Text>
                  </View>
                );
              })
            )}
            <View style={{ alignSelf: 'center', marginTop: 4, minWidth: 40, height: 26, paddingHorizontal: 10, borderRadius: 13, borderWidth: 1, borderColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fs(12.5), fontWeight: '700', color: C.accent }}>{d(page)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
});
