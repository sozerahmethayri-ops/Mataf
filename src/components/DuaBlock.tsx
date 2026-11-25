import { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import { C, fs, fsAr } from '@/constants/theme';
import type { DuaText } from '@/data/tawaf';
import { pick, useI18n } from '@/i18n';
import { duaSpeech, playSequence, stopVoice } from '@/services/voice';
import { Icon } from './Icon';
import { T } from './ui';

const L = {
  listen: { tr: 'Dinle', en: 'Listen', ar: 'استمع' },
  stop: { tr: 'Durdur', en: 'Stop', ar: 'إيقاف' },
  reciter: { tr: 'Kâri: Mişârî Alafasy', en: 'Reciter: Mishary Alafasy', ar: 'القارئ: مشاري العفاسي' },
  tts: { tr: 'Cihaz sesi (tilavet değildir)', en: 'Device voice (not a recitation)', ar: 'صوت الجهاز (ليس تلاوة)' },
  times: { tr: 'kez', en: 'times', ar: 'مرات' },
};

/** Arapça metin, okunuş, anlam ve kaynakla tek dua; sesli dinleme ve paylaşma. */
export function DuaBlock({ d, tint = C.accentSoft, compact, right }: { d: DuaText; tint?: string; compact?: boolean; right?: React.ReactNode }) {
  const { lang } = useI18n();
  const [playing, setPlaying] = useState(false);
  const meaning = pick(d.mean, lang);
  const toggle = () => {
    if (playing) { stopVoice(); setPlaying(false); return; }
    setPlaying(true);
    playSequence(duaSpeech(d), () => setPlaying(false)).catch(() => setPlaying(false));
  };
  return (
    <View style={{ backgroundColor: tint, borderRadius: 16, padding: compact ? 12 : 14, gap: 8 }}>
      {d.when ? <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>{pick(d.when, lang)}{d.count ? ` · ${d.count} ${pick(L.times, lang)}` : ''}</Text> : null}
      <Text style={[T.arabic, compact && { fontSize: fsAr(22), lineHeight: fsAr(40) }]}>{d.ar}</Text>
      {lang !== 'ar' ? <Text style={{ fontSize: fs(14), fontStyle: 'italic', color: C.ink2, lineHeight: fs(20) }}>{d.tr}</Text> : null}
      {meaning ? <Text style={T.body}>{meaning}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={pick(playing ? L.stop : L.listen, lang)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: playing ? C.accent : C.bg }}>
          <Icon name={playing ? 'stop' : 'play'} size={14} color={playing ? C.onAccent : C.accent} fill={playing ? C.onAccent : C.accent} />
          <Text style={{ fontSize: fs(13), fontWeight: '700', color: playing ? C.onAccent : C.accent }}>{pick(playing ? L.stop : L.listen, lang)}</Text>
        </Pressable>
        <Text style={[T.small, { flex: 1 }]} numberOfLines={2}>{d.ref}{'\n'}{pick(d.quran ? L.reciter : L.tts, lang)}</Text>
        {right}
        <Pressable onPress={() => Share.share({ message: `${d.ar}\n${d.tr}\n${meaning}\n— ${d.ref}` })} accessibilityRole="button" accessibilityLabel="Paylaş" hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="share" size={16} color={C.ink2} />
        </Pressable>
      </View>
    </View>
  );
}
