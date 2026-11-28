import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { GoToSheet } from '@/components/QuranGoTo';
import { ModeSheet, isPageMode, openReading } from '@/components/QuranModes';
import { AR_DIGITS, MarkSheet, PageMark } from '@/components/QuranParts';
import { Btn, Header, IconBtn, T } from '@/components/ui';
import { C, fs, fsAr, shadow } from '@/constants/theme';
import { MEAL_AUDIO, RECITERS, TAFSIRS, TRANSLIT, type QuranView } from '@/data/quranEditions';
import { SAJDAH_NOTE, SAJDAH_SIGN, isSajdah, stripSajdahSign, surahHasSajdah } from '@/data/sajdah';
import { lineFor } from '@/data/quranFonts';
import { pageAyahs, pageOf } from '@/data/quranPages';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { getSurahAudio, getSurahText, surahName, type FullAyah } from '@/services/quran';
import { useQuranPrefs, type Bookmark } from '@/services/QuranPrefs';
import { JUZ_STARTS, juzOf } from '@/services/hatim';
import { surahLength } from '@/services/quranIndex';
import { getTafsir } from '@/services/tafsir';
import { useAsync } from '@/services/useAsync';
import { useQuranFont } from '@/services/useQuranFont';
import { stopVoice } from '@/services/voice';

const L = {
  play: { tr: 'Dinle', en: 'Play', ar: 'استمع' },
  tafsir: { tr: 'Tefsir', en: 'Tafsir', ar: 'التفسير' },
  goto: { tr: 'Git: sûre, cüz, sayfa, ayraç', en: 'Go to: surah, juz, page, bookmark', ar: 'انتقل إلى: سورة، جزء، صفحة، علامة' },
  view: { tr: 'Görünüm ve yazı boyu', en: 'View and text size', ar: 'طريقة العرض وحجم الخط' },
  tafsirErr: { tr: 'Tefsir yüklenemedi (internet?)', en: 'Could not load the tafsir (internet?)', ar: 'تعذّر تحميل التفسير' },
  playAll: { tr: 'Sûreyi dinle', en: 'Play surah', ar: 'استمع إلى السورة' },
  repeat: { tr: 'Âyet tekrarı (ezber)', en: 'Repeat each verse (memorise)', ar: 'تكرار الآية (للحفظ)' },
  speed: { tr: 'Okuma hızı', en: 'Playback speed', ar: 'سرعة التلاوة' },
  meal: { tr: 'meal', en: 'translation', ar: 'الترجمة' },
  audioErr: { tr: 'Ses yüklenemedi; bağlantınızı kontrol edin.', en: 'Audio could not be loaded; check your connection.', ar: 'تعذّر تحميل الصوت؛ تحقق من الاتصال.' },
  surah: { tr: '. sûre', en: '', ar: '' },
  sajdah: { tr: 'Secde âyeti', en: 'Verse of prostration', ar: 'آية سجدة' },
  sub: { tr: '{n}. sûre · s. {p}', en: 'Surah {n} · p. {p}', ar: 'السورة {n} · ص {p}' },
  mark: { tr: 'Ayraç', en: 'Bookmark', ar: 'علامة' },
  reading: { tr: 'ayracıyla okuyorsunuz · yeriniz kendiliğinden kaydediliyor', en: 'reading with this bookmark · your place is saved automatically', ar: 'تقرأ بهذه العلامة · يُحفظ موضعك تلقائيًا' },
} satisfies Record<string, ML>;


type Phase = 'ar' | 'meal';
/** Ezber için âyet tekrarı (0 = sürekli) ve okuma hızları */
const REPEATS = [1, 3, 5, 10, 0];
const RATES = [1, 1.25, 1.5, 0.75];

export default function SurahReader() {
  useKeepAwake();
  const { sure, b, a } = useLocalSearchParams<{ sure: string; b?: string; a?: string }>();
  const n = Number(sure) || 1;
  const { t, lang } = useI18n();
  const { prefs, setPrefs, bookmarks, saveBookmark } = useQuranPrefs();
  const view: QuranView = prefs.view ?? 'ar+meal';
  const active = bookmarks.find((x) => x.id === b);
  const [markFor, setMarkFor] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'goto' | 'view' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const translit = prefs.translit ? TRANSLIT[lang === 'en' ? 'en' : 'tr'] : null;
  const res = useAsync(() => getSurahText(n, prefs.translation, translit), [n, prefs.translation, translit, attempt]);
  const ayahs = res.data?.ayahs ?? null;
  // Yazı büyütme: yalnız bu ekranda (genel yazı ölçeği değişince ekran baştan kurulurdu, yer kaybolurdu)
  const z = prefs.zoom ?? 1;
  // Mushaf ve tecvid görünümü sayfa sayfa ekranda (sağa sola çevrilir): bu sûrenin (ya da ayracın) sayfasından açılır
  const startAyah = Number(a) || 0;
  const pageView = isPageMode(view);
  useEffect(() => {
    if (!pageView) return;
    router.replace({ pathname: '/mushaf', params: { p: String(pageOf(n, Math.max(1, startAyah))), ...(b ? { b } : null) } });
  }, [pageView]); // eslint-disable-line react-hooks/exhaustive-deps
  // Hat (yazı stili): seçilen Kur'an yazı tipi; boyut ve satır yüksekliği yazıya göre (harekeler kesilmesin)
  const { f: qf, fontFamily: qff } = useQuranFont(prefs.font);
  const arSize = (base: number) => fsAr(base) * z * qf.size;
  const arLine = (size: number, base: number) => lineFor(qf, size, base);

  // ── Ses: ayet ayet Arapça tilavet ve/veya sesli meal ──
  const player = useAudioPlayer(null);
  const [now, setNow] = useState<{ idx: number; phase: Phase } | null>(null);
  const [audioErr, setAudioErr] = useState(false);
  const queue = useRef<{ ar: string[]; meal: string[]; idx: number; phase: Phase; mode: typeof prefs.mode; count?: number } | null>(null);
  // Ezber: her âyet kaç kez çalınsın (0 = sürekli) ve hız
  const [repeat, setRepeat] = useState(1);
  const [rate, setRate] = useState(1);
  const list = useRef<FlatList<FullAyah>>(null);
  const d = (x: number) => (lang === 'ar' ? AR_DIGITS(x) : String(x));
  const p1 = pageOf(n, 1);
  const p2 = pageOf(n, surahLength(n));
  const scrollToAyah = (k: number, animated = true) => list.current?.scrollToIndex({ index: k - 1, viewPosition: 0.1, animated });
  // Ayraçtan açıldıysa kaldığı ayete git
  useEffect(() => {
    if (!ayahs || startAyah < 2) return;
    const id = setTimeout(() => { try { scrollToAyah(Math.min(startAyah, ayahs.length), false); } catch { /* yok say */ } }, 350);
    return () => clearTimeout(id);
  }, [ayahs, startAyah]);
  // Ayraçla okunuyorsa görünen ilk ayet yeri olarak kaydedilir (1,5 sn sonra)
  const activeRef = useRef<Bookmark | undefined>(active);
  const saveRef = useRef(saveBookmark);
  const lastRef = useRef((s: number, a: number) => setPrefs({ last: { s, a, p: pageOf(s, a) } }));
  const surahRef = useRef(n);
  useEffect(() => { activeRef.current = active; saveRef.current = saveBookmark; surahRef.current = n; lastRef.current = (s, a) => setPrefs({ last: { s, a, p: pageOf(s, a) } }); });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  const lastSeen = useRef(Math.max(1, startAyah));
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: { item?: unknown }[] }) => {
    const bm = activeRef.current;
    const first = viewableItems[0]?.item as FullAyah | FullAyah[] | undefined;
    const ay = Array.isArray(first) ? first[0]?.n : first?.n;
    if (!ay) return;
    lastSeen.current = ay;
    // Kaldığınız yer her zaman; ayraçla açıldıysa ayraç da (1,5 sn durunca)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastRef.current(surahRef.current, ay);
      if (bm) saveRef.current({ ...bm, surah: surahRef.current, ayah: ay });
    }, 1500);
  });
  const [viewCfg] = useState(() => ({ itemVisiblePercentThreshold: 40 }));

  const playAt = (idx: number, phase: Phase) => {
    const q = queue.current;
    if (!q || idx >= q.ar.length) { stop(); return; }
    const uri = phase === 'ar' ? q.ar[idx] : q.meal[idx];
    if (!uri) { advance(idx, phase); return; }
    q.idx = idx; q.phase = phase;
    setNow({ idx, phase });
    try { player.replace({ uri }); player.setPlaybackRate(rate, 'high'); player.play(); } catch { setAudioErr(true); }
    list.current?.scrollToIndex({ index: idx, viewPosition: 0.25, animated: true });
  };
  const advance = (idx: number, phase: Phase) => {
    const q = queue.current;
    if (!q) return;
    if (q.mode === 'ar+meal' && phase === 'ar' && q.meal.length) return playAt(idx, 'meal');
    const first: Phase = q.mode === 'meal' ? 'meal' : 'ar';
    // Âyet (mealiyle birlikte) seçilen sayıda tekrarlanır, sonra sıradakine geçilir
    const done = (q.count ?? 0) + 1;
    if (repeat === 0 || done < repeat) { q.count = done; return playAt(idx, first); }
    q.count = 0;
    playAt(idx + 1, first);
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
  // Satır düğmeleri kararlı bir nesneden çağrılır (satırlar hafızalı kalsın); güncel start effect'te yazılır
  const startRef = useRef<(i: number) => void>(() => undefined);
  const [act] = useState<RowActs>(() => ({ play: (i) => startRef.current(i), mark: (k) => setMarkFor(k) }));
  useEffect(() => { startRef.current = (i) => { start(i); }; });
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
        <Header back title={surahName(n, lang)} subtitle={pick(L.sub, lang).replace('{n}', d(n)).replace('{p}', p1 === p2 ? d(p1) : `${d(p1)}–${d(p2)}`)}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconBtn name="search" label={pick(L.goto, lang)} onPress={() => setSheet('goto')} />
              <IconBtn name="book" label={pick(L.view, lang)} onPress={() => setSheet('view')} />
            </View>
          } />
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
          <Btn title={t('common.retry')} onPress={() => setAttempt((x) => x + 1)} />
        </View>
      ) : !ayahs || pageView ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          ref={list}
          data={ayahs}
          keyExtractor={(x) => String(x.n)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          // Yazı büyütünce yalnız yüklü satırlar yeniden dizilir: az sayıda tutulur (önceden ~20 ekranlık satır yüklüydü)
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollToIndexFailed={(e) => list.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: true })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewCfg}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 8 }}>
              <Btn title={pick(L.playAll, lang)} icon="play" kind="secondary" onPress={() => start(0)} />
              {n !== 1 && n !== 9 ? <Text style={[T.arabic, { fontFamily: qff, textAlign: 'center', fontSize: arSize(26), lineHeight: arLine(arSize(26), fsAr(44) * z) }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text> : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <AyahRow a={item} index={index} n={n} view={view} tafsirId={prefs.tafsir} lang={lang} active={now?.idx === index}
              arFont={qff} arSize={arSize(24)} arLine={arLine(arSize(24), fsAr(40) * z)} z={z} act={act} />
          )}
          ListFooterComponent={
            <View style={{ gap: 8, marginTop: 12 }}>
              {surahHasSajdah(n) ? <Text style={[T.small, { color: C.green }]}>{pick(SAJDAH_NOTE, lang)}</Text> : null}
              <Text style={T.small}>{t('quran.source')}</Text>
            </View>
          }
        />
      )}

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
          <Pressable onPress={() => setRepeat((r) => REPEATS[(REPEATS.indexOf(r) + 1) % REPEATS.length])} accessibilityRole="button" accessibilityLabel={pick(L.repeat, lang)} hitSlop={6}
            style={{ minWidth: 40, height: 32, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderColor: repeat === 1 ? 'rgba(255,255,255,0.35)' : C.route, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: fs(12), fontWeight: '700' }}>{repeat === 0 ? '∞' : `×${repeat}`}</Text>
          </Pressable>
          <Pressable onPress={() => { const r = RATES[(RATES.indexOf(rate) + 1) % RATES.length]; setRate(r); try { player.setPlaybackRate(r, 'high'); } catch { /* yok say */ } }} accessibilityRole="button" accessibilityLabel={pick(L.speed, lang)} hitSlop={6}
            style={{ minWidth: 44, height: 32, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderColor: rate === 1 ? 'rgba(255,255,255,0.35)' : C.route, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: fs(12), fontWeight: '700' }}>{`${rate}x`.replace('.', lang === 'tr' ? ',' : '.')}</Text>
          </Pressable>
          <Pressable onPress={() => { if (now && queue.current) queue.current.count = 0; if (now) playAt(now.idx + 1, queue.current?.mode === 'meal' ? 'meal' : 'ar'); }} accessibilityLabel="Sonraki" hitSlop={8}><Icon name="next" size={18} color="#FFFFFF" fill="#FFFFFF" /></Pressable>
          <Pressable onPress={() => { stop(); setAudioErr(false); }} accessibilityLabel="Durdur" hitSlop={8}><Icon name="close" size={18} color="#FFFFFF" /></Pressable>
        </View>
      )}
      <MarkSheet visible={markFor != null} ayah={markFor ?? 1} surah={n} lang={lang} bookmarks={bookmarks}
        onPick={(bm) => { saveBookmark({ ...bm, surah: n, ayah: markFor ?? 1 }); setMarkFor(null); }} onClose={() => setMarkFor(null)} />
      <GoToSheet visible={sheet === 'goto'} lang={lang} bookmarks={bookmarks} onClose={() => setSheet(null)}
        onGo={(t, bId) => {
          setSheet(null);
          const [ts, ta] = t.kind === 'ayah' ? [t.s, t.a] : t.kind === 'page' ? pageAyahs(t.p)[0] : JUZ_STARTS[t.j - 1];
          if (ts === n && !bId) { try { scrollToAyah(Math.min(ta, ayahs?.length ?? ta)); } catch { /* yok say */ } return; }
          router.replace({ pathname: '/kuran/[sure]', params: { sure: String(ts), a: String(ta), ...(bId ? { b: bId } : null) } });
        }} />
      <ModeSheet visible={sheet === 'view'} lang={lang} value={view} zoom={z} onClose={() => setSheet(null)}
        onZoom={(nz) => setPrefs({ zoom: nz })}
        onPick={(v) => {
          setPrefs({ view: v });
          if (isPageMode(v)) { setSheet(null); openReading(v, n, lastSeen.current, { b, replace: true }); }
        }} />
    </SafeAreaView>
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

type RowActs = { play: (i: number) => void; mark: (ayah: number) => void };
type RowProps = { a: FullAyah; index: number; n: number; view: QuranView; tafsirId: string; lang: Lang; active: boolean; arFont?: string; arSize: number; arLine: number; z: number; act: RowActs };

/**
 * Tek âyet satırı (sayfa işareti, Arapça, okunuş, meal, düğmeler). Ayrı ve hafızalı: dinlerken yalnız çalan satır,
 * yazı büyütünce yalnız yüklü satırlar yeniden çizilir (önceden her değişiklikte bütün liste yeniden kuruluyordu).
 */
const AyahRow = memo(function AyahRow({ a, index, n, view, tafsirId, lang, active, arFont, arSize, arLine, z, act }: RowProps) {
  const newPage = index === 0 || pageOf(n, a.n) !== pageOf(n, a.n - 1);
  const sj = isSajdah(n, a.n);
  return (
    <>
      {newPage && <PageMark page={pageOf(n, a.n)} juz={juzOf(n, a.n)} lang={lang} />}
      <View style={{ paddingVertical: 14, paddingHorizontal: active ? 10 : 0, marginHorizontal: active ? -10 : 0, borderRadius: 14, backgroundColor: active ? C.accentSoft : 'transparent', borderBottomWidth: active ? 0 : 1, borderBottomColor: C.border, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: sj ? C.green : C.route, alignItems: 'center', justifyContent: 'center', marginTop: 6, backgroundColor: active ? C.accent : 'transparent' }}>
            <Text style={{ fontSize: fs(11), fontWeight: '700', color: active ? C.onAccent : C.accent }}>{a.n}</Text>
          </View>
          {view === 'meal' && a.meal ? <Text style={[T.body, { flex: 1, fontSize: fs(17) * z, lineHeight: fs(26) * z, color: C.ink }]}>{a.meal}</Text> : <Text style={[T.arabic, { flex: 1, fontFamily: arFont, fontSize: arSize, lineHeight: arLine }]}>{stripSajdahSign(a.ar)}</Text>}
        </View>
        {sj && (
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: C.greenTint }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.green }}>{SAJDAH_SIGN} {pick(L.sajdah, lang)}</Text>
          </View>
        )}
        {view === 'ar+meal' && a.translit ? <Text style={{ fontSize: fs(14) * z, fontStyle: 'italic', color: C.muted, lineHeight: fs(20) * z }}>{a.translit}</Text> : null}
        {(view === 'ar+meal' || view === 'tefsir') && a.meal ? <Text style={[T.body, { fontSize: fs(15) * z, lineHeight: fs(22) * z }]}>{a.meal}</Text> : null}
        {view === 'tefsir' ? <TafsirBlock id={tafsirId} s={n} a={a.n} lang={lang} z={z} /> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chipish icon="play" label={pick(L.play, lang)} onPress={() => act.play(index)} />
          <Chipish icon="tafsir" label={pick(L.tafsir, lang)} onPress={() => router.push({ pathname: '/tefsir', params: { s: String(n), a: String(a.n) } })} />
          <Chipish icon="bookmark" label={pick(L.mark, lang)} onPress={() => act.mark(a.n)} />
          <Chipish icon="share" label="" onPress={() => Share.share({ message: `${a.ar}\n${a.meal ?? ''}\n— ${surahName(n, lang)} ${a.n}` })} />
        </View>
      </View>
    </>
  );
});

/** "Tefsirli" biçimde âyetin altındaki tefsir (seçili tefsir kaynağı; satır göründüğünde yüklenir, cihazda saklanır). */
function TafsirBlock({ id, s, a, lang, z }: { id: string; s: number; a: number; lang: Lang; z: number }) {
  const r = useAsync(() => getTafsir(id, s, a), [id, s, a]);
  const src = TAFSIRS.find((x) => x.id === id);
  const rtl = src?.lang === 'ar' || src?.lang === 'ur' || src?.lang === 'fa' || src?.lang === 'ps' || src?.lang === 'ug';
  return (
    <View style={{ gap: 6, padding: 12, borderRadius: 14, backgroundColor: C.surface }}>
      <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{pick(L.tafsir, lang)}{src ? ` · ${src.name}` : ''}</Text>
      {r.loading ? <ActivityIndicator color={C.accent} /> : r.error ? (
        <Text style={T.small}>{pick(L.tafsirErr, lang)}</Text>
      ) : r.data ? (
        <Text style={[T.body, { fontSize: fs(14.5) * z, lineHeight: fs(22) * z, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}>{r.data}</Text>
      ) : null}
    </View>
  );
}
