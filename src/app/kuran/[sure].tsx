import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Btn, Header, IconBtn, T } from '@/components/ui';
import { C, shadow } from '@/constants/theme';
import { MEAL_AUDIO, RECITERS, TRANSLIT } from '@/data/quranEditions';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { getSurahAudio, getSurahText, surahName, type FullAyah } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useAsync } from '@/services/useAsync';
import { stopVoice } from '@/services/voice';

const L = {
  play: { tr: 'Dinle', en: 'Play', ar: 'استمع' },
  tafsir: { tr: 'Tefsir', en: 'Tafsir', ar: 'التفسير' },
  settings: { tr: 'Okuma ayarları', en: 'Reading settings', ar: 'إعدادات القراءة' },
  playAll: { tr: 'Sûreyi dinle', en: 'Play surah', ar: 'استمع إلى السورة' },
  meal: { tr: 'meal', en: 'translation', ar: 'الترجمة' },
  audioErr: { tr: 'Ses yüklenemedi; bağlantınızı kontrol edin.', en: 'Audio could not be loaded; check your connection.', ar: 'تعذّر تحميل الصوت؛ تحقق من الاتصال.' },
  surah: { tr: '. sûre', en: '', ar: '' },
} satisfies Record<string, ML>;

type Phase = 'ar' | 'meal';

export default function SurahReader() {
  const { sure } = useLocalSearchParams<{ sure: string }>();
  const n = Number(sure) || 1;
  const { t, lang } = useI18n();
  const { prefs } = useQuranPrefs();
  const [attempt, setAttempt] = useState(0);
  const translit = prefs.translit ? TRANSLIT[lang === 'en' ? 'en' : 'tr'] : null;
  const res = useAsync(() => getSurahText(n, prefs.translation, translit), [n, prefs.translation, translit, attempt]);
  const ayahs = res.data?.ayahs ?? null;

  // ── Ses: ayet ayet Arapça tilavet ve/veya sesli meal ──
  const player = useAudioPlayer(null);
  const [now, setNow] = useState<{ idx: number; phase: Phase } | null>(null);
  const [audioErr, setAudioErr] = useState(false);
  const queue = useRef<{ ar: string[]; meal: string[]; idx: number; phase: Phase; mode: typeof prefs.mode } | null>(null);
  const list = useRef<FlatList<FullAyah>>(null);

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
          right={<IconBtn name="settings" label={pick(L.settings, lang)} onPress={() => router.push('/kuran-ayarlar')} />} />
      </View>
      {res.error ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{t('hadith.error')}</Text>
          <Btn title={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </View>
      ) : !ayahs ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          ref={list}
          data={ayahs}
          keyExtractor={(a) => String(a.n)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          onScrollToIndexFailed={(e) => list.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: true })}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 8 }}>
              <Btn title={pick(L.playAll, lang)} icon="play" kind="secondary" onPress={() => start(0)} />
              {n !== 1 && n !== 9 ? <Text style={[T.arabic, { textAlign: 'center', fontSize: 26 }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text> : null}
            </View>
          }
          renderItem={({ item: a, index }) => {
            const active = now?.idx === index;
            return (
              <View style={{ paddingVertical: 14, paddingHorizontal: active ? 10 : 0, marginHorizontal: active ? -10 : 0, borderRadius: 14, backgroundColor: active ? C.accentSoft : 'transparent', borderBottomWidth: active ? 0 : 1, borderBottomColor: '#F1EFEB', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center', marginTop: 6, backgroundColor: active ? C.route : 'transparent' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#FFFFFF' : C.accent }}>{a.n}</Text>
                  </View>
                  <Text style={[T.arabic, { flex: 1 }]}>{a.ar}</Text>
                </View>
                {a.translit ? <Text style={{ fontSize: 14, fontStyle: 'italic', color: C.muted, lineHeight: 20 }}>{a.translit}</Text> : null}
                {a.meal ? <Text style={T.body}>{a.meal}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Chipish icon="play" label={pick(L.play, lang)} onPress={() => start(index)} />
                  <Chipish icon="tafsir" label={pick(L.tafsir, lang)} onPress={() => router.push({ pathname: '/tefsir', params: { s: String(n), a: String(a.n) } })} />
                  <Chipish icon="share" label="" onPress={() => Share.share({ message: `${a.ar}\n${a.meal ?? ''}\n— ${surahName(n, lang)} ${a.n}` })} />
                </View>
              </View>
            );
          }}
          ListFooterComponent={<Text style={[T.small, { marginTop: 12 }]}>{t('quran.source')}</Text>}
        />
      )}

      {(now || audioErr) && (
        <View style={[{ position: 'absolute', left: 12, right: 12, bottom: 16, borderRadius: 20, backgroundColor: C.ink, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, shadow]}>
          <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Oynat/Duraklat" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={player.playing ? 'pause' : 'play'} size={18} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            {audioErr ? <Text style={{ color: '#FFFFFF', fontSize: 13 }}>{pick(L.audioErr, lang)}</Text> : (
              <>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{surahName(n, lang)} · {now ? (ayahs?.[now.idx]?.n ?? now.idx + 1) : ''}</Text>
                <Text style={{ color: '#C9CCD3', fontSize: 12 }} numberOfLines={1}>{now?.phase === 'meal' ? `${pick(L.meal, lang)} · ${mealName ?? ''}` : reciterName}</Text>
              </>
            )}
          </View>
          <Pressable onPress={() => now && playAt(now.idx + 1, queue.current?.mode === 'meal' ? 'meal' : 'ar')} accessibilityLabel="Sonraki" hitSlop={8}><Icon name="next" size={18} color="#FFFFFF" fill="#FFFFFF" /></Pressable>
          <Pressable onPress={() => { stop(); setAudioErr(false); }} accessibilityLabel="Durdur" hitSlop={8}><Icon name="close" size={18} color="#FFFFFF" /></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function Chipish({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label || icon}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: label ? 12 : 9, borderRadius: 16, backgroundColor: C.surface }}>
      <Icon name={icon} size={14} color={C.accent} fill={icon === 'play' ? C.accent : 'none'} />
      {label ? <Text style={{ fontSize: 12.5, fontWeight: '600', color: C.ink }}>{label}</Text> : null}
    </Pressable>
  );
}
