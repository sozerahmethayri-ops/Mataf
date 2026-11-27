// Temel Arapça ifadeler: büyük yazı, okunuş ve anlam. "Göster" tam ekran açar (karşınızdakine gösterin),
// "Dinlet" cihazın Arapça sesiyle okur (kayıt değil; bazı telefonlarda Arapça ses paketi gerekir).
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Header, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs, fsAr } from '@/constants/theme';
import { PHRASES, type Phrase } from '@/data/phrases';
import { pick, useI18n } from '@/i18n';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Arapça ifadeler', en: 'Arabic phrases', ar: 'عبارات عربية' },
  sub: { tr: 'Gösterin ya da dinletin', en: 'Show or play them', ar: 'اعرضها أو استمع إليها' },
  show: { tr: 'Göster', en: 'Show', ar: 'اعرض' },
  play: { tr: 'Dinlet', en: 'Play', ar: 'استمع' },
  close: { tr: 'Kapatmak için dokunun', en: 'Tap to close', ar: 'اضغط للإغلاق' },
  note: { tr: 'Ses cihazın Arapça sesidir; ses çıkmazsa telefonun ayarlarından Arapça ses paketini indirin.', en: 'The voice is your device’s Arabic voice; if nothing plays, download the Arabic voice in your phone settings.', ar: 'الصوت هو صوت الجهاز العربي؛ إن لم يعمل فنزّل حزمة الصوت العربية من إعدادات الهاتف.' },
};

export default function Arapca() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [show, setShow] = useState<Phrase | null>(null);
  const play = (p: Phrase) => {
    Speech.stop();
    Speech.speak(p.ar, { language: 'ar-SA', rate: 0.85 });
  };
  return (
    <Screen>
      <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      {PHRASES.map((g) => (
        <View key={g.id} style={{ gap: 8 }}>
          <SectionTitle>{pick(g.title, lg)}</SectionTitle>
          {g.items.map((p) => (
            <View key={p.id} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 6 }}>
              <Text style={[T.arabic, { fontSize: fsAr(26), lineHeight: fsAr(42) }]}>{p.ar}</Text>
              {lg !== 'ar' && <Text style={{ fontSize: fs(14), fontStyle: 'italic', color: C.ink2 }}>{p.tr}</Text>}
              {lg !== 'ar' && <Text style={T.body}>{pick(p.mean, lg)}</Text>}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                <Small icon="text" label={pick(L.show, lg)} onPress={() => setShow(p)} />
                <Small icon="speaker" label={pick(L.play, lg)} onPress={() => play(p)} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Text style={T.small}>{pick(L.note, lg)}</Text>
      <Modal visible={!!show} animationType="fade" onRequestClose={() => setShow(null)}>
        <Pressable onPress={() => setShow(null)} accessibilityRole="button" accessibilityLabel={pick(L.close, lg)}
          style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
          <Text style={{ fontSize: fsAr(46), lineHeight: fsAr(74), color: C.ink, textAlign: 'center', writingDirection: 'rtl' }}>{show?.ar}</Text>
          {lg !== 'ar' && show ? <Text style={{ fontSize: fs(19), color: C.ink2, textAlign: 'center' }}>{pick(show.mean, lg)}</Text> : null}
          <Text style={T.muted}>{pick(L.close, lg)}</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Small({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={16} color={C.accent} />
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.ink }}>{label}</Text>
    </Pressable>
  );
}
