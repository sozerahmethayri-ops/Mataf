// Mushaf: Kur'an sayfa sayfa (Medine düzeni, 604 sayfa), kâğıt mushaf gibi sağa sola çevrilir. Sayfa 1 sağda,
// sonraki sayfa solda: parmağı soldan sağa kaydırınca bir sonraki sayfa gelir. Yalnız görünen sayfa ve iki komşusu
// çizilir; yazı büyütme yalnız onları yeniden dizer. Sayfa metni çevrimdışı paketten ya da alquran.cloud /page'den
// gelir ve cihazda saklanır. Son sayfa quran:prefs.page; ayraçla açıldıysa (b) okunan sayfanın ilk âyeti ayraca yazılır.
// Sade okuma (0.25.0, proje sahibinin isteği): sayfa çerçevesiz, ekranın zemininde tek katman; sayfa numarası ekranın en
// altında. Üst çubuk 6 sn dokunulmayınca, uzun basınca ya da boş yere dokununca gizlenir (yalnız Kur'an kalır); bir
// dokunuş geri getirir. Çubuk açıkken âyete dokunmak âyet penceresini (ayraç) açar. Tecvid ve diğer biçimler "Görünüm"de.
import { router, useLocalSearchParams } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, I18nManager, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoToSheet } from '@/components/QuranGoTo';
import { ModeSheet, isPageMode, openReading } from '@/components/QuranModes';
import { AR_DIGITS, MarkSheet, QL, TajweedLegend } from '@/components/QuranParts';
import { Btn, IconBtn, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { C, fs, fsAr } from '@/constants/theme';
import { ayahMark, lineFor } from '@/data/quranFonts';
import { RECITERS } from '@/data/quranEditions';
import { PAGE_COUNT, fromGlobalAyah, pageAyahs, pageGlobalRange, pageOf } from '@/data/quranPages';
import { SAJDAH_SIGN, isSajdah, stripSajdahSign } from '@/data/sajdah';
import { ruleColor } from '@/data/tajweed';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { juzOf } from '@/services/hatim';
import { getPageText, stripBasmala, surahName, type PageAyah } from '@/services/quran';
import { localAyahAudio } from '@/services/offline';
import { ayahAudioUrl } from '@/services/quranIndex';
import { juzStartPage } from '@/services/quranNav';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useTheme } from '@/services/ThemeContext';
import { parseTajweed, stripTajweedBasmala } from '@/services/tajweed';
import { useAsync } from '@/services/useAsync';
import { useQuranFont } from '@/services/useQuranFont';

const L = {
  err: { tr: 'Sayfa yüklenemedi. İnternet bağlantınızı kontrol edin ya da Çevrimdışı paketi indirin.', en: 'The page could not be loaded. Check your connection or download the offline pack.', ar: 'تعذّر تحميل الصفحة. تحقّق من الاتصال أو نزّل الحزمة دون اتصال.' },
  juz: { tr: '{j}. cüz', en: 'Juz {j}', ar: 'الجزء {j}' },
  sajdah: { tr: 'Secde âyeti', en: 'Verse of prostration', ar: 'آية سجدة' },
  listen: { tr: 'Sayfayı dinle', en: 'Listen to the page', ar: 'استمع إلى الصفحة' },
  stop: { tr: 'Durdur', en: 'Stop', ar: 'إيقاف' },
  goto: { tr: 'Git: sûre, cüz, sayfa, ayraç', en: 'Go to: surah, juz, page, bookmark', ar: 'انتقل إلى: سورة، جزء، صفحة، علامة' },
  view: { tr: 'Görünüm ve yazı boyu', en: 'View and text size', ar: 'طريقة العرض وحجم الخط' },
  back: { tr: 'Geri', en: 'Back', ar: 'رجوع' },
  page: { tr: 'Sayfa {p}', en: 'Page {p}', ar: 'صفحة {p}' },
  audioErr: { tr: 'Ses yüklenemedi; bağlantınızı kontrol edin.', en: 'Audio could not be loaded; check your connection.', ar: 'تعذّر تحميل الصوت؛ تحقق من الاتصال.' },
};
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const IDLE_MS = 6000;
const clampPage = (p: number) => Math.max(1, Math.min(PAGE_COUNT, Math.round(p) || 1));

export default function MushafScreen() {
  useKeepAwake();
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
  // Temadan (bağlamdan): sistem teması gece kendiliğinden koyulaşınca da tecvid renkleri koyu takıma geçsin
  const { dark } = useTheme();
  const [mark, setMark] = useState<{ s: number; a: number } | null>(null);
  const [sheet, setSheet] = useState<'goto' | 'view' | null>(null);
  // Sayfa 1 sağda, sonraki solda: soldan sağa düzende liste ters çevrilir (Arapça telefonda düzen zaten sağdan sola)
  const inverted = !(Platform.OS !== 'web' && I18nManager.isRTL);
  const [fs0, fa0] = pageAyahs(page)[0];
  const listRef = useRef<FlatList<number>>(null);
  const toPage = (n: number, animated = true) => {
    const t = clampPage(n);
    setPage(t);
    try { listRef.current?.scrollToIndex({ index: t - 1, animated }); } catch { /* yok say */ }
  };

  // ── Sade okuma: üst çubuk (chrome) boşta, uzun basınca ya da boş yere dokununca gizlenir; dokununca gelir ──
  const [chrome, setChrome] = useState(true);
  const chromeRef = useRef(true);
  useEffect(() => { chromeRef.current = chrome; });
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = () => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setChrome(false), IDLE_MS);
  };
  useEffect(() => {
    if (chrome && !sheet && !mark) arm();
    return () => { if (idle.current) clearTimeout(idle.current); };
  }, [chrome, sheet, mark]);
  // Sayfa bileşenleri hafızalı: dokunuşlar kararlı işlevlerden, güncel davranış effect'te yazılır
  const tapRef = useRef<(sn?: number, an?: number) => void>(() => undefined);
  useEffect(() => {
    tapRef.current = (sn, an) => {
      if (!chromeRef.current) { setChrome(true); return; }
      if (sn && an) setMark({ s: sn, a: an });
      else setChrome(false);
    };
  });
  const [onTap] = useState(() => (sn?: number, an?: number) => tapRef.current(sn, an));
  const [onLong] = useState(() => () => setChrome(false));

  // Sayfayı dinle: sayfanın âyetleri sırayla (seçili kâri); sayfa bitince sonraki sayfaya geçip sürer
  const player = useAudioPlayer(null);
  const [now, setNow] = useState<number | null>(null);
  const [audioErr, setAudioErr] = useState(false);
  const aq = useRef<{ g: number; end: number; page: number } | null>(null);
  const playG = (g: number) => {
    const cur = aq.current;
    if (!cur) return;
    if (g > cur.end) {
      const next = cur.page + 1;
      if (next > PAGE_COUNT) { stopAudio(); return; }
      const [a0, a1] = pageGlobalRange(next);
      aq.current = { g: a0, end: a1, page: next };
      toPage(next);
      playG(a0);
      return;
    }
    cur.g = g;
    setNow(g);
    const uri = localAyahAudio(g, prefs.reciter) ?? ayahAudioUrl(g, prefs.reciter);
    try { player.replace({ uri }); player.play(); } catch { setAudioErr(true); }
  };
  const stopAudio = () => { aq.current = null; setNow(null); try { player.pause(); } catch { /* yok say */ } };
  const startAudio = async () => {
    setAudioErr(false);
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => undefined);
    const [a0, a1] = pageGlobalRange(page);
    aq.current = { g: a0, end: a1, page };
    playG(a0);
  };
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st) => {
      const cur = aq.current;
      if (cur && st.didJustFinish) playG(cur.g + 1);
    });
    return () => sub.remove();
  });
  useEffect(() => () => { aq.current = null; }, []);
  const nowAt = now != null ? fromGlobalAyah(now) : null;
  const reciterName = RECITERS.find((r) => r.id === prefs.reciter)?.name ?? '';
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
      setPrefs({ page, last: { s: fs0, a: fa0, p: page } });
      const bm = b ? bookmarks.find((x) => x.id === b) : undefined;
      if (bm && (bm.surah !== fs0 || bm.ayah !== fa0)) saveBookmark({ ...bm, surah: fs0, ayah: fa0 });
    }, 1200);
    return () => clearTimeout(id);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}
      onTouchStart={() => { if (chromeRef.current && !sheet) arm(); }}>
      <StatusBar hidden={!chrome} style={dark ? 'light' : 'dark'} />
      {chrome && (
        <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconBtn name="back" size={44} label={pick(L.back, lg)} onPress={() => router.back()} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(17), fontWeight: '700', color: C.ink }} numberOfLines={1}>{surahName(fs0, lg)}</Text>
              <Text style={T.small} numberOfLines={1}>{pick(QL.pageMark, lg).replace('{p}', d(page)).replace('{j}', d(juzOf(fs0, fa0)))}</Text>
            </View>
            <IconBtn name={now != null ? 'pause' : 'play'} size={44} label={pick(now != null ? L.stop : L.listen, lg)} onPress={() => (now != null ? stopAudio() : void startAudio())} />
            <IconBtn name="search" size={44} label={pick(L.goto, lg)} onPress={() => setSheet('goto')} />
            <IconBtn name="book" size={44} label={pick(L.view, lg)} onPress={() => setSheet('view')} />
          </View>
          {tajweed && <TajweedLegend lang={lg} dark={dark} />}
        </View>
      )}
      <FlatList
        ref={listRef}
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
        renderItem={({ item }) => <MushafPage page={item} width={width} z={z} font={prefs.font} tajweed={tajweed} dark={dark} lang={lg} onTap={onTap} onLong={onLong} />}
      />
      {(now != null || audioErr) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 18, backgroundColor: C.ink }}>
          <Icon name="speaker" size={18} color={C.onInk} />
          <Text style={{ flex: 1, color: C.onInk, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
            {audioErr ? pick(L.audioErr, lg) : nowAt ? `${surahName(nowAt[0], lg)} ${d(nowAt[1])} · ${reciterName}` : ''}
          </Text>
          <Pressable onPress={() => { stopAudio(); setAudioErr(false); }} accessibilityRole="button" accessibilityLabel={pick(L.stop, lg)} hitSlop={8}>
            <Icon name="close" size={18} color={C.onInk} />
          </Pressable>
        </View>
      )}
      {/* Sayfa numarası her zaman ekranın en altında (son âyetin altında değil) */}
      <View style={{ height: 30, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={pick(L.page, lg).replace('{p}', String(page))}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.muted }}>{d(page)}</Text>
      </View>
      <GoToSheet visible={sheet === 'goto'} lang={lg} bookmarks={bookmarks} onClose={() => setSheet(null)}
        onGo={(t) => {
          setSheet(null);
          toPage(t.kind === 'page' ? t.p : t.kind === 'juz' ? juzStartPage(t.j) : pageOf(t.s, t.a), false);
        }} />
      <ModeSheet visible={sheet === 'view'} lang={lg} value={prefs.view ?? 'mushaf'} zoom={z} onClose={() => setSheet(null)}
        onZoom={(nz) => setPrefs({ zoom: nz })}
        onPick={(v) => {
          setPrefs({ view: v });
          if (!isPageMode(v)) { setSheet(null); openReading(v, fs0, fa0, { b, replace: true }); }
        }} />
      <MarkSheet visible={!!mark} ayah={mark?.a ?? 1} surah={mark?.s ?? 1} lang={lg} bookmarks={bookmarks}
        onPick={(bm) => { if (mark) saveBookmark({ ...bm, surah: mark.s, ayah: mark.a }); setMark(null); }} onClose={() => setMark(null)} />
    </SafeAreaView>
  );
}

type PageProps = { page: number; width: number; z: number; font?: string; tajweed: boolean; dark: boolean; lang: Lang; onTap: (s?: number, a?: number) => void; onLong: () => void };

/** Tek mushaf sayfası, çerçevesiz: üstte ince cüz ve sûre satırı, sûre başlıkları ve besmele, âyetler */
const MushafPage = memo(function MushafPage({ page, width, z, font, tajweed, dark, lang, onTap, onLong }: PageProps) {
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Pressable onPress={() => onTap()} onLongPress={onLong} delayLongPress={450} style={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: fs(11.5), fontWeight: '600', color: C.muted }}>{pick(L.juz, lang).replace('{j}', d(juzOf(s0, a0)))}</Text>
            <Text style={{ flexShrink: 1, fontSize: fs(11.5), fontWeight: '600', color: C.muted, textAlign: 'right' }} numberOfLines={1}>{onPage}</Text>
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
                    <View style={{ marginTop: 6, paddingVertical: 4, alignItems: 'center' }}>
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
                        <Text key={x.a} onPress={() => onTap(x.s, x.a)} onLongPress={onLong} style={sj ? { backgroundColor: C.greenTint } : undefined}>
                          {segs
                            ? segs.map((sg, k) => {
                              const tx = k === segs.length - 1 ? stripSajdahSign(sg.t) : sg.t;
                              return sg.r ? <Text key={k} style={{ color: ruleColor(sg.r, dark) }}>{tx}</Text> : tx;
                            })
                            : stripSajdahSign(stripBasmala(x.s, x.a, x.text))}
                          {sj ? <Text style={{ color: C.green, fontWeight: '700' }} accessibilityLabel={pick(L.sajdah, lang)}>{` ${SAJDAH_SIGN}`}</Text> : null}
                          <Text style={{ color: C.accent, fontWeight: qf.id === 'madina' ? undefined : '700', fontSize: qf.id === 'madina' ? size : size * 0.88 }}>{` ${ayahMark(qf, x.a)} `}</Text>
                        </Text>
                      );
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
});
