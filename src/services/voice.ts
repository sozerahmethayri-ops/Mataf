// Sesli okuma: Kur'an ayetleri kâri kaydından (alquran.cloud / cdn.islamic.network) çalınır;
// ayet olmayan dua ve yönlendirmeler cihazın metin okuma sesiyle (Arapça: ar-SA) okunur.
// Cihaz sesi bir hafız tilaveti değildir; arayüz bunu belirtir.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { Lang } from '@/i18n/strings';
import { localAyahAudio } from './offline';
import { ayahAudioUrl, globalAyah } from './quranIndex';

const LOCALE: Record<Lang, string> = { tr: 'tr-TR', en: 'en-US', ar: 'ar-SA' };
export type SpeechItem =
  | { kind: 'speak'; text: string; lang: Lang; rate?: number }
  | { kind: 'url'; uri: string; fallback?: { text: string; lang: Lang } };

let player: AudioPlayer | null = null;
let modeReady = false;
let token = 0;

async function ensurePlayer() {
  if (!modeReady) {
    modeReady = true;
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: true });
    } catch { /* web/simülatör: yok say */ }
  }
  if (!player) player = createAudioPlayer(null);
  return player;
}

/** Kuyruğu sırayla okur. Yeni bir çağrı öncekini durdurur. */
export async function playSequence(items: SpeechItem[], onEnd?: () => void) {
  const my = ++token;
  await stopVoice(false);
  const run = async (i: number): Promise<void> => {
    if (my !== token) return;
    if (i >= items.length) { onEnd?.(); return; }
    const it = items[i];
    if (it.kind === 'speak') {
      await new Promise<void>((res) => {
        Speech.speak(it.text, {
          language: LOCALE[it.lang],
          rate: it.rate ?? (it.lang === 'ar' ? 0.8 : 0.95),
          onDone: () => res(), onStopped: () => res(), onError: () => res(),
        });
      });
      return run(i + 1);
    }
    const p = await ensurePlayer();
    const ok = await new Promise<boolean>((res) => {
      let started = false;
      const timer = setTimeout(() => { if (!started) { sub.remove(); res(false); } }, 9000);
      const sub = p.addListener('playbackStatusUpdate', (s) => {
        if (my !== token) { clearTimeout(timer); sub.remove(); res(true); return; }
        if (s.playing) started = true;
        if (s.didJustFinish) { clearTimeout(timer); sub.remove(); res(true); }
      });
      try { p.replace({ uri: it.uri }); p.play(); } catch { clearTimeout(timer); sub.remove(); res(false); }
    });
    if (!ok && it.fallback && my === token) {
      // Bağlantı yoksa cihaz sesiyle oku
      await new Promise<void>((res) => Speech.speak(it.fallback!.text, { language: LOCALE[it.fallback!.lang], rate: 0.8, onDone: () => res(), onStopped: () => res(), onError: () => res() }));
    }
    return run(i + 1);
  };
  await run(0);
}

export async function stopVoice(bump = true) {
  if (bump) token++;
  try { await Speech.stop(); } catch { /* yok say */ }
  try { player?.pause(); } catch { /* yok say */ }
}

/** Dua/ayet için okuma kuyruğu: ayetse kâri kaydı (bağlantı yoksa cihaz sesi), değilse Arapça cihaz sesi. */
export function duaSpeech(d: { ar: string; quran?: [number, number, number?] }, reciter = 'ar.alafasy'): SpeechItem[] {
  if (d.quran) {
    const [s, a, to = a] = d.quran;
    const parts = d.ar.split(' ۝ ');
    return Array.from({ length: to - a + 1 }, (_, i) => ({
      kind: 'url' as const,
      uri: localAyahAudio(globalAyah(s, a + i), reciter) ?? ayahAudioUrl(globalAyah(s, a + i), reciter),
      fallback: { text: parts[i] ?? d.ar, lang: 'ar' as const },
    }));
  }
  return [{ kind: 'speak', text: d.ar, lang: 'ar' }];
}
