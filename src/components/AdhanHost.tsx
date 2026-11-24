// Ezan bildirimlerinin uygulama içi tarafı:
//  • açılışta ve uygulama öne gelince bildirim planını yeniler,
//  • vakit bildirimi uygulama açıkken gelirse ya da bildirime dokunulursa kullanıcının seçtiği ezanı çalar,
//  • çalarken üstte "Durdur" çubuğu gösterir.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, shadow } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { initNotifications, loadNotifPrefs, notificationsSupported, refreshSchedule } from '@/services/adhanNotify';

initNotifications();

let player: AudioPlayer | null = null;
const listeners = new Set<(on: boolean) => void>();
const emit = (on: boolean) => listeners.forEach((f) => f(on));

export function stopAdhan() {
  try { player?.pause(); player?.remove(); } catch { /* zaten kapalı */ }
  player = null;
  emit(false);
}

export async function playAdhan(uri: string) {
  stopAdhan();
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: true });
    const p = createAudioPlayer({ uri });
    player = p;
    const sub = p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) { sub.remove(); if (player === p) stopAdhan(); }
    });
    p.play();
    emit(true);
    return true;
  } catch {
    stopAdhan();
    return false;
  }
}

type AdhanData = { kind?: string; type?: string; test?: boolean; url?: string };

export function AdhanHost() {
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const [on, setOn] = useState(false);
  const lastRefresh = useRef(0);

  useEffect(() => {
    listeners.add(setOn);
    return () => { listeners.delete(setOn); };
  }, []);

  // Planı yenile: açılışta ve uygulama öne geldiğinde (en sık 20 dakikada bir)
  useEffect(() => {
    if (!notificationsSupported) return;
    const run = () => {
      if (Date.now() - lastRefresh.current < 20 * 60 * 1000) return;
      lastRefresh.current = Date.now();
      refreshSchedule(lang as 'tr' | 'en' | 'ar');
    };
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => sub.remove();
  }, [lang]);

  useEffect(() => {
    if (!notificationsSupported) return;
    const maybePlay = async (d: AdhanData) => {
      if (d.kind !== 'adhan' || d.type !== 'at') return;
      const p = await loadNotifPrefs();
      if (p.playAdhan && p.adhanUri) playAdhan(p.adhanUri);
    };
    const recv = Notifications.addNotificationReceivedListener((n) => {
      maybePlay(n.request.content.data as AdhanData);
    });
    const resp = Notifications.addNotificationResponseReceivedListener((r) => {
      const d = r.notification.request.content.data as AdhanData;
      if (d.kind !== 'adhan') return;
      // Vakit girdikten 15 dk sonra dokunulursa ezanı yeniden başlatma
      if (Date.now() - r.notification.date < 15 * 60 * 1000) maybePlay(d);
      if (!d.test) router.push('/vakitler');
    });
    return () => { recv.remove(); resp.remove(); };
  }, []);

  if (!on) return null;
  const label = { tr: 'Ezan okunuyor', en: 'Adhan is playing', ar: 'يُرفع الأذان' }[lang as 'tr' | 'en' | 'ar'];
  const stop = { tr: 'Durdur', en: 'Stop', ar: 'إيقاف' }[lang as 'tr' | 'en' | 'ar'];
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8, alignItems: 'center' }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.ink, borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 }, shadow]}>
        <Text style={{ color: C.onInk, fontWeight: '700', fontSize: 15 }}>{label}</Text>
        <Pressable onPress={stopAdhan} accessibilityRole="button" accessibilityLabel={stop}
          style={{ backgroundColor: C.onInk, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: C.ink, fontWeight: '800' }}>{stop}</Text>
        </Pressable>
      </View>
    </View>
  );
}
