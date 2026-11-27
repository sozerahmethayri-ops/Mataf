import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Btn, Header, IconBtn, T } from '@/components/ui';
import { C, fs, fsAr, isDark, shadow } from '@/constants/theme';
import { MEAL_AUDIO, RECITERS, TRANSLIT, type QuranView } from '@/data/quranEditions';
import { SAJDAH_NOTE, SAJDAH_SIGN, isSajdah, stripSajdahSign, surahHasSajdah } from '@/data/sajdah';
import { lineFor } from '@/data/quranFonts';
import { TAJWEED_RULES, ruleColor } from '@/data/tajweed';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { getSurahAudio, getSurahTajweed, getSurahText, surahName, type FullAyah } from '@/services/quran';
import { useQuranPrefs, type Bookmark } from '@/services/QuranPrefs';
import { useAsync } from '@/services/useAsync';
import { parseTajweed, stripTajweedBasmala } from '@/services/tajweed';
import { useQuranFont } from '@/services/useQuranFont';
import { stopVoice } from '@/services/voice';

const L = {
  play: { tr: 'Dinle', en: 'Play', ar: 'استمع' },
  tafsir: { tr: 'Tefsir', en: 'Tafsir', ar: 'التفسير' },
  settings: { tr: 'Okuma ayarları', en: 'Reading settings', ar: 'إعدادات القراءة' },
  playAll: { tr: 'Sûreyi dinle', en: 'Play surah', ar: 'استمع إلى السورة' },
  meal: { tr: 'meal', en: 'translation', ar: 'الترجمة' },
  audioErr: { tr: 'Ses yüklenemedi; bağlantınızı kontrol edin.', en: 'Audio could not be loaded; check your connection.', ar: 'تعذّر تحميل الصوت؛ تحقق من الاتصال.' },
  surah: { tr: '. sûre', en: '', ar: '' },
  vBoth: { tr: 'Mealli', en: 'With translation', ar: 'مع الترجمة' },
  vAr: { tr: 'Arapça', en: 'Arabic', ar: 'العربية' },
  vMeal: { tr: 'Meal', en: 'Translation', ar: 'الترجمة' },
  vMushaf: { tr: 'Mushaf', en: 'Mushaf', ar: 'مصحف' },
  vTecvid: { tr: 'Tecvid', en: 'Tajweed', ar: 'تجويد' },
  zoomIn: { tr: 'Yazıyı büyüt', en: 'Larger text', ar: 'تكبير الخط' },
  zoomOut: { tr: 'Yazıyı küçült', en: 'Smaller text', ar: 'تصغير الخط' },
  sajdah: { tr: 'Secde âyeti', en: 'Verse of prostration', ar: 'آية سجدة' },
  rules: { tr: 'Tecvid kuralları', en: 'Tajweed rules', ar: 'أحكام التجويد' },
  tjErr: { tr: 'Tecvidli metin indirilemedi; düz metin gösteriliyor.', en: 'The tajweed text could not be loaded; showing plain text.', ar: 'تعذّر تحميل نص التجويد؛ يُعرض النص العادي.' },
  mark: { tr: 'Ayraç', en: 'Bookmark', ar: 'علامة' },
  markTitle: { tr: 'Bu ayete ayraç koy', en: 'Bookmark this verse', ar: 'ضع علامة على هذه الآية' },
  newMark: { tr: 'Yeni ayraç adı (ör. Cuma okuması)', en: 'New bookmark name', ar: 'اسم علامة جديدة' },
  add: { tr: 'Ekle', en: 'Add', ar: 'إضافة' },
  cancel: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  reading: { tr: 'ayracıyla okuyorsunuz · yeriniz kendiliğinden kaydediliyor', en: 'reading with this bookmark · your place is saved automatically', ar: 'تقرأ بهذه العلامة · يُحفظ موضعك تلقائيًا' },
} satisfies Record<string, ML>;

const AR_DIGITS = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const CHUNK = 8; // mushaf görünümünde bir satır grubu
/** Okuma ekranı yazı büyütme basamakları */
const ZOOMS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

type Phase = 'ar' | 'meal';

export default function SurahReader() {
  const { sure, b, a } = useLocalSearchParams<{ sure: string; b?: string; a?: string }>();
  const n = Number(sure) || 1;
  const { t, lang } = useI18n();
  const { prefs, setPrefs, bookmarks, saveBookmark } = useQuranPrefs();
  const view: QuranView = prefs.view ?? 'ar+meal';
  const active = bookmarks.find((x) => x.id === b);
  const [markFor, setMarkFor] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const translit = prefs.translit ? TRANSLIT[lang === 'en' ? 'en' : 'tr'] : null;
  const res = useAsync(() => getSurahText(n, prefs.translation, translit), [n, prefs.translation, translit, attempt]);
  const ayahs = res.data?.ayahs ?? null;
  // Yazı büyütme: yalnız bu ekranda (genel yazı ölçeği değişince ekran baştan kurulurdu, yer kaybolurdu)
  const z = prefs.zoom ?? 1;
  const zoomBy = (d: 1 | -1) => {
    const i = ZOOMS.findIndex((x) => x >= z - 0.001);
    const j = Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 2 : i) + d));
    setPrefs({ zoom: ZOOMS[j] });
  };
  // Tecvidli görünüm: işaretli metin ayrıca indirilir; gelene ya da inemezse düz metin
  const mushafLike = view === 'mushaf' || view === 'tecvid';
  const tjRes = useAsync(() => (view === 'tecvid' ? getSurahTajweed(n) : Promise.resolve(null)), [n, view, attempt]);
  const tj = useMemo(() => (tjRes.data ? tjRes.data.map((x, i) => stripTajweedBasmala(n, i + 1, parseTajweed(x))) : null), [tjRes.data, n]);
  const dark = isDark();
  // Hat (yazı stili): seçilen Kur'an yazı tipi; boyut ve satır yüksekliği yazıya göre (harekeler kesilmesin)
  const { f: qf, fontFamily: qff } = useQuranFont(prefs.font);
  const arSize = (base: number) => fsAr(base) * z * qf.size;
  const arLine = (size: number, base: number) => lineFor(qf, size, base);

  // ── Ses: ayet ayet Arapça tilavet ve/veya sesli meal ──
  const player = useAudioPlayer(null);
  const [now, setNow] = useState<{ idx: number; phase: Phase } | null>(null);
  const [audioErr, setAudioErr] = useState(false);
  const queue = useRef<{ ar: string[]; meal: string[]; idx: number; phase: Phase; mode: typeof prefs.mode } | null>(null);
  const list = useRef<FlatList<FullAyah>>(null);
  const mlist = useRef<FlatList<FullAyah[]>>(null);
  const chunks = useMemo(() => {
    const out: FullAyah[][] = [];
    for (let i = 0; i < (ayahs?.length ?? 0); i += CHUNK) out.push(ayahs!.slice(i, i + CHUNK));
    return out;
  }, [ayahs]);
  const scrollToAyah = (k: number, animated = true) => {
    if (mushafLike) mlist.current?.scrollToIndex({ index: Math.floor((k - 1) / CHUNK), viewPosition: 0.1, animated });
    else list.current?.scrollToIndex({ index: k - 1, viewPosition: 0.1, animated });
  };
  // Ayraçtan açıldıysa kaldığı ayete git
  const startAyah = Number(a) || 0;
  useEffect(() => {
    if (!ayahs || startAyah < 2) return;
    const id = setTimeout(() => { try { scrollToAyah(Math.min(startAyah, ayahs.length), false); } catch { /* yok say */ } }, 350);
    return () => clearTimeout(id);
  }, [ayahs, startAyah]); // eslint-disable-line react-hooks/exhaustive-deps
  // Ayraçla okunuyorsa görünen ilk ayet yeri olarak kaydedilir (1,5 sn sonra)
  const activeRef = useRef<Bookmark | undefined>(active);
  const saveRef = useRef(saveBookmark);
  const surahRef = useRef(n);
  useEffect(() => { activeRef.current = active; saveRef.current = saveBookmark; surahRef.current = n; });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: { item?: unknown }[] }) => {
    const bm = activeRef.current;
    const first = viewableItems[0]?.item as FullAyah | FullAyah[] | undefined;
    const ay = Array.isArray(first) ? first[0]?.n : first?.n;
    if (!bm || !ay) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRef.current({ ...bm, surah: surahRef.current, ayah: ay }), 1500);
  });
  const [viewCfg] = useState(() => ({ itemVisiblePercentThreshold: 40 }));

  const playAt = (idx: number, phase: Phase) => {
    const q = queue.current;
    if (!q || idx >= q.ar.length) { stop(); return; }
    const uri = phase === 'ar' ? q.ar[idx] : q.meal[idx];
    if (!uri) { advance(idx, phase); return; }
    q.idx = idx; q.phase = phase;
    setNow({ idx, phase });
    try { player.replace({ uri }); player.play(); } catch { setAudioErr(true); }
    list.current?.scrollToIndex({ index: idx, viewPosition: 0.25, animated: true });
  };
  const advance = (idx: number, phase: Phase) => {
    const q = queue.current;
    if (!q) return;
    if (q.mode === 'ar+meal' && phase === 'ar' && q.meal.length) return playAt(idx, 'meal');
    playAt(idx + 1, q.mode === 'meal' ? 'meal' : 'ar');
  };
  const stop = () => { queue.current = null; setNow(null); try { player.pause(); } catch { /* yok say */ } };

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      const q = queue.current;
      if (q && s.didJustFinish) advance(q.idx, q.phase);
    });
    return () => sub.remove();
  });
  useEffect(() => () => { queue.current = null; }, []);

  const start = async (idx: number) => {
    setAudioErr(false);
    stopVoice();
    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => undefined);
      const wantMeal = prefs.mode !== 'ar' && !!prefs.mealAudio;
      const [ar, meal] = await Promise.all([
        prefs.mode === 'meal' && wantMeal ? Promise.resolve([] as string[]) : getSurahAudio(n, prefs.reciter),
        wantMeal ? getSurahAudio(n, prefs.mealAudio!) : Promise.resolve([] as string[]),
      ]);
      const mode = wantMeal ? prefs.mode : 'ar';
      queue.current = { ar: mode === 'meal' ? meal : ar, meal, idx, phase: mode === 'meal' ? 'meal' : 'ar', mode };
      playAt(idx, mode === 'meal' ? 'meal' : 'ar');
    } catch {
      setAudioErr(true);
    }
  };
  const toggle = () => {
    if (!now) return start(0);
    if (player.playing) player.pause(); else player.play();
    setNow({ ...now });
  };

  const reciterName = RECITERS.find((r) => r.id === prefs.reciter)?.name ?? prefs.reciter;
  const mealName = MEAL_AUDIO.find((m) => m.id === prefs.mealAudio)?.name;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ paddingHorizontal: 16 }}>
        <Header back title={surahName(n, lang)} subtitle={lang === 'tr' ? `${n}. sûre` : `Surah ${n}`}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconBtn name="minus" label={pick(L.zoomOut, lang)} onPress={() => zoomBy(-1)} />
              <IconBtn name="plus" label={pick(L.zoomIn, lang)} onPress={() => zoomBy(1)} />
              <IconBtn name="settings" label={pick(L.settings, lang)} onPress={() => router.push('/kuran-ayarlar')} />
            </View>
          } />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        {([['ar+meal', L.vBoth], ['ar', L.vAr], ['meal', L.vMeal], ['mushaf', L.vMushaf], ['tecvid', L.vTecvid]] as [QuranView, ML][]).map(([v, lab]) => {
          const on = v === view;
          return (
            <Pressable key={v} onPress={() => setPrefs({ view: v })} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.accent : C.surface }}>
              <Text style={{ fontSize: fs(12), fontWeight: on ? '700' : '500', color: on ? C.onAccent : C.ink }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{pick(lab, lang)}</Text>
            </Pressable>
          );
        })}
      </View>
      {active && (
        <View style={{ marginHorizontal: 16, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.accentSoft }}>
          <Icon name="bookmark" size={14} color={C.accent} />
          <Text style={{ flex: 1, fontSize: fs(12), color: C.accent, fontWeight: '600' }} numberOfLines={2}>{active.name} {pick(L.reading, lang)}</Text>
        </View>
      )}
      {res.error ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{t('hadith.error')}</Text>
          <Btn title={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </View>
      ) : !ayahs ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
mushafLike ? (
        <FlatList
          ref={mlist}
          data={chunks}
          keyExtractor={(c) => String(c[0].n)}
          style={{ marginHorizontal: 10, marginTop: 6 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: now || audioErr ? 120 : 20, borderWidth: 1.5, borderColor: C.accentTint, borderRadius: 18, backgroundColor: C.surface }}
          onScrollToIndexFailed={(e) => mlist.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: true })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewCfg}
          ListHeaderComponent={
            <View style={{ gap: 8, marginBottom: 10 }}>
              {/* Sûre başlığı: mushaftaki gibi çerçeveli */}
              <View style={{ paddingVertical: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.accentTint, alignItems: 'center' }}>
                <Text style={{ fontFamily: res.data?.name ? qff : undefined, fontSize: arSize(22), lineHeight: arLine(arSize(22), fsAr(36) * z), color: C.accent, fontWeight: '700', textAlign: 'center' }}>{res.data?.name ?? surahName(n, lang)}</Text>
              </View>
              {view === 'tecvid' && <TajweedLegend lang={lang} dark={dark} />}
              {view === 'tecvid' && tjRes.error ? <Text style={T.small}>{pick(L.tjErr, lang)}</Text> : null}
              {n !== 1 && n !== 9 ? <Text style={[T.arabic, { fontFamily: qff, textAlign: 'center', fontSize: arSize(26), lineHeight: arLine(arSize(26), fsAr(46) * z) }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text> : null}
            </View>
          }
          renderItem={({ item: c }) => (
            // direction: web'de paragraf sağdan sola olsun (writingDirection yalnız iOS'ta işler); yoksa satır başına düşen âyet numarası sola kayıyor
            <Text style={{ fontFamily: qff, fontSize: arSize(24), lineHeight: arLine(arSize(24), fsAr(54) * z), color: C.ink, textAlign: 'justify', writingDirection: 'rtl', direction: 'rtl' }}>
              {c.map((ay) => {
                const idx = ay.n - 1;
                const on = now?.idx === idx;
                const sj = isSajdah(n, ay.n);
                const segs = view === 'tecvid' ? tj?.[idx] : undefined;
                return (
                  <Text key={ay.n} onPress={() => setMarkFor(ay.n)} onLongPress={() => start(idx)}
                    style={on ? { backgroundColor: C.accentTint } : sj ? { backgroundColor: C.greenTint } : undefined}>
                    {segs ? segs.map((sg, k) => { const tx = k === segs.length - 1 ? stripSajdahSign(sg.t) : sg.t; return sg.r ? <Text key={k} style={{ color: ruleColor(sg.r, dark) }}>{tx}</Text> : tx; }) : stripSajdahSign(ay.ar)}
                    {sj ? <Text style={{ color: C.green, fontWeight: '700' }} accessibilityLabel={pick(L.sajdah, lang)}>{` ${SAJDAH_SIGN}`}</Text> : null}
                    {/* Âyet sonu: süslü parantez içinde Arapça rakam, palet renginde */}
                    <Text style={{ color: C.accent, fontWeight: '700', fontSize: arSize(21) }}>{` \uFD3F${AR_DIGITS(ay.n)}\uFD3E `}</Text>
                  </Text>
                );
              })}
            </Text>
          )}
          ListFooterComponent={
            <View style={{ gap: 8, marginTop: 14 }}>
              {surahHasSajdah(n) ? <Text style={[T.small, { color: C.green }]}>{pick(SAJDAH_NOTE, lang)}</Text> : null}
              <Text style={T.small}>{t('quran.source')}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          ref={list}
          data={ayahs}
          keyExtractor={(a) => String(a.n)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          onScrollToIndexFailed={(e) => list.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: true })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewCfg}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 8 }}>
              <Btn title={pick(L.playAll, lang)} icon="play" kind="secondary" onPress={() => start(0)} />
              {n !== 1 && n !== 9 ? <Text style={[T.arabic, { fontFamily: qff, textAlign: 'center', fontSize: arSize(26), lineHeight: arLine(arSize(26), fsAr(44) * z) }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text> : null}
            </View>
          }
          renderItem={({ item: a, index }) => {
            const active = now?.idx === index;
            return (
              <View style={{ paddingVertical: 14, paddingHorizontal: active ? 10 : 0, marginHorizontal: active ? -10 : 0, borderRadius: 14, backgroundColor: active ? C.accentSoft : 'transparent', borderBottomWidth: active ? 0 : 1, borderBottomColor: C.border, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: isSajdah(n, a.n) ? C.green : C.route, alignItems: 'center', justifyContent: 'center', marginTop: 6, backgroundColor: active ? C.accent : 'transparent' }}>
                    <Text style={{ fontSize: fs(11), fontWeight: '700', color: active ? C.onAccent : C.accent }}>{a.n}</Text>
                  </View>
                  {view === 'meal' && a.meal ? <Text style={[T.body, { flex: 1, fontSize: fs(17) * z, lineHeight: fs(26) * z, color: C.ink }]}>{a.meal}</Text> : <Text style={[T.arabic, { flex: 1, fontFamily: qff, fontSize: arSize(24), lineHeight: arLine(arSize(24), fsAr(40) * z) }]}>{stripSajdahSign(a.ar)}</Text>}
                </View>
                {isSajdah(n, a.n) && (
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: C.greenTint }}>
                    <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.green }}>{SAJDAH_SIGN} {pick(L.sajdah, lang)}</Text>
                  </View>
                )}
                {view === 'ar+meal' && a.translit ? <Text style={{ fontSize: fs(14) * z, fontStyle: 'italic', color: C.muted, lineHeight: fs(20) * z }}>{a.translit}</Text> : null}
                {view === 'ar+meal' && a.meal ? <Text style={[T.body, { fontSize: fs(15) * z, lineHeight: fs(22) * z }]}>{a.meal}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Chipish icon="play" label={pick(L.play, lang)} onPress={() => start(index)} />
                  <Chipish icon="tafsir" label={pick(L.tafsir, lang)} onPress={() => router.push({ pathname: '/tefsir', params: { s: String(n), a: String(a.n) } })} />
                  <Chipish icon="bookmark" label={pick(L.mark, lang)} onPress={() => setMarkFor(a.n)} />
                  <Chipish icon="share" label="" onPress={() => Share.share({ message: `${a.ar}\n${a.meal ?? ''}\n— ${surahName(n, lang)} ${a.n}` })} />
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View style={{ gap: 8, marginTop: 12 }}>
              {surahHasSajdah(n) ? <Text style={[T.small, { color: C.green }]}>{pick(SAJDAH_NOTE, lang)}</Text> : null}
              <Text style={T.small}>{t('quran.source')}</Text>
            </View>
          }
        />
      )      )}

      {(now || audioErr) && (
        <View style={[{ position: 'absolute', left: 12, right: 12, bottom: 16, borderRadius: 20, backgroundColor: C.ink, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, shadow]}>
          <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Oynat/Duraklat" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={player.playing ? 'pause' : 'play'} size={18} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            {audioErr ? <Text style={{ color: C.onInk, fontSize: fs(13) }}>{pick(L.audioErr, lang)}</Text> : (
              <>
                <Text style={{ color: C.onInk, fontSize: fs(14), fontWeight: '700' }} numberOfLines={1}>{surahName(n, lang)} · {now ? (ayahs?.[now.idx]?.n ?? now.idx + 1) : ''}</Text>
                <Text style={{ color: C.onInk, opacity: 0.75, fontSize: fs(12) }} numberOfLines={1}>{now?.phase === 'meal' ? `${pick(L.meal, lang)} · ${mealName ?? ''}` : reciterName}</Text>
              </>
            )}
          </View>
          <Pressable onPress={() => now && playAt(now.idx + 1, queue.current?.mode === 'meal' ? 'meal' : 'ar')} accessibilityLabel="Sonraki" hitSlop={8}><Icon name="next" size={18} color="#FFFFFF" fill="#FFFFFF" /></Pressable>
          <Pressable onPress={() => { stop(); setAudioErr(false); }} accessibilityLabel="Durdur" hitSlop={8}><Icon name="close" size={18} color="#FFFFFF" /></Pressable>
        </View>
      )}
      <MarkSheet visible={markFor != null} ayah={markFor ?? 1} surah={n} lang={lang} bookmarks={bookmarks}
        onPick={(bm) => { saveBookmark({ ...bm, surah: n, ayah: markFor ?? 1 }); setMarkFor(null); }} onClose={() => setMarkFor(null)} />
    </SafeAreaView>
  );
}

/** Ayraç seçimi: var olan ayraca bu ayeti kaydet ya da yeni ayraç oluştur. */
function MarkSheet({ visible, ayah, surah, lang, bookmarks, onPick, onClose }: { visible: boolean; ayah: number; surah: number; lang: Lang; bookmarks: Bookmark[]; onPick: (b: Bookmark) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => undefined} style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 10 }}>
          <Text style={T.h2}>{pick(L.markTitle, lang)} · {surahName(surah, lang)} {ayah}</Text>
          {bookmarks.map((bm) => (
            <Pressable key={bm.id} onPress={() => onPick(bm)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
              <Icon name="bookmark" size={18} color={bm.hatim ? C.green : C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{bm.name}</Text>
                <Text style={T.small}>{surahName(bm.surah, lang)} {bm.ayah}</Text>
              </View>
            </Pressable>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={name} onChangeText={setName} placeholder={pick(L.newMark, lang)} placeholderTextColor={C.muted}
              style={{ flex: 1, height: 44, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: fs(14), color: C.ink }} />
            <Btn title={pick(L.add, lang)} kind="secondary" disabled={!name.trim()} onPress={() => { onPick({ id: `b${Math.round(ayah * 1000 + surah)}-${name.length}-${name.trim().slice(0, 12)}`, name: name.trim(), surah, ayah, at: 0 }); setName(''); }} />
          </View>
          <Btn title={pick(L.cancel, lang)} kind="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chipish({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label || icon}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: label ? 12 : 9, borderRadius: 16, backgroundColor: C.surface }}>
      <Icon name={icon} size={14} color={C.accent} fill={icon === 'play' ? C.accent : 'none'} />
      {label ? <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: C.ink }}>{label}</Text> : null}
    </Pressable>
  );
}

/** Tecvid renklerinin kısa lejantı (yaygın kurallar); sonunda kuralların açıklandığı sayfa. */
function TajweedLegend({ lang, dark }: { lang: Lang; dark: boolean }) {
  const common = TAJWEED_RULES.filter((r) => ['g', 'f', 'i', 'a', 'u', 'q', 'n', 'o', 'm'].includes(r.id));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
      {common.map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: C.bg }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dark ? r.dark : r.light }} />
          <Text style={{ fontSize: fs(12), color: C.ink }}>{pick(r.name, lang)}</Text>
        </View>
      ))}
      <Pressable onPress={() => router.push('/tecvid')} accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.accent }}>
        <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.onAccent }}>{pick(L.rules, lang)} ›</Text>
      </Pressable>
    </ScrollView>
  );
}
