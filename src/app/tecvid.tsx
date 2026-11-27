// Tecvid kuralları: renkli Kur'an'daki her renk sırayla, tanımı, harfleri ve renkli örneğiyle; renklendirilmeyen kurallar ayrıca.
// Örnekler tecvidli metnin işaretlemesiyle yazılır ve okuma ekranındaki aynı renklerle çizilir.
import { Text, View } from 'react-native';

import { Header, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs, fsAr, isDark } from '@/constants/theme';
import { OTHER_RULES, TAJWEED_RULES, ruleColor } from '@/data/tajweed';
import { pick, useI18n } from '@/i18n';
import { parseTajweed } from '@/services/tajweed';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Tecvid kuralları', en: 'Tajweed rules', ar: 'أحكام التجويد' },
  sub: { tr: 'Renkli Kur’an’daki renkler', en: 'The colours in the tajweed Quran', ar: 'ألوان المصحف الملوّن' },
  intro: {
    tr: 'Tecvid, Kur’an’ı harflerin çıkış yerlerine ve okuma kurallarına uygun okumaktır. Okuma ekranında “Tecvid” seçilince her kural aşağıdaki renkle gösterilir; örneklerde kuralın geçtiği harf renklidir.',
    en: 'Tajweed is reciting the Quran with each letter from its proper place and by the rules of recitation. Choose “Tajweed” in the reader to see each rule in the colour below; in the examples the letter concerned is coloured.',
    ar: 'التجويد هو تلاوة القرآن بإخراج كل حرف من مخرجه مع مراعاة أحكام التلاوة. اختر «تجويد» في شاشة القراءة لترى كل حكم باللون المبين أدناه.',
  },
  letters: { tr: 'Harfler', en: 'Letters', ar: 'الحروف' },
  colored: { tr: 'Renkli kurallar', en: 'Coloured rules', ar: 'الأحكام الملوّنة' },
  other: { tr: 'Renklendirilmeyen kurallar', en: 'Rules without a colour', ar: 'أحكام غير ملوّنة' },
  note: {
    tr: 'Tanımlar klasik tecvidin yaygın tanımlarıdır; renk kategorileri alquran.cloud tecvid baskısınındır. Doğru okuyuş bir hocadan dinlenerek öğrenilir. Bu sayfa henüz bir ilahiyatçı kontrolünden geçmedi.',
    en: 'The definitions are the common ones of classical tajweed; the colour categories are those of the alquran.cloud tajweed edition. Correct recitation is learnt by listening to a teacher. This page has not yet been reviewed by a scholar.',
    ar: 'التعريفات هي المشهورة في علم التجويد، وتصنيف الألوان من نسخة التجويد في alquran.cloud. تُتعلّم التلاوة الصحيحة بالتلقي عن معلم. لم تُراجع هذه الصفحة بعدُ من عالم.',
  },
};

/** Tecvid işaretli örneği renkli çizer */
function Example({ text, dark }: { text: string; dark: boolean }) {
  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
      <Text style={[T.arabic, { fontSize: fsAr(28), lineHeight: fsAr(48), textAlign: 'center' }]}>
        {parseTajweed(text).map((sg, k) => (sg.r ? <Text key={k} style={{ color: ruleColor(sg.r, dark) }}>{sg.t}</Text> : sg.t))}
      </Text>
    </View>
  );
}

export default function Tecvid() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const dark = isDark();
  return (
    <Screen>
      <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      <Text style={T.body}>{pick(L.intro, lg)}</Text>

      <SectionTitle>{pick(L.colored, lg)}</SectionTitle>
      {TAJWEED_RULES.map((r, i) => (
        <View key={r.id} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: dark ? r.dark : r.light }} />
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }} accessibilityRole="header">{i + 1}. {pick(r.name, lg)}</Text>
            {lg !== 'ar' && <Text style={{ fontSize: fsAr(17), color: C.muted }}>{r.name.ar}</Text>}
          </View>
          <Text style={T.body}>{pick(r.desc, lg)}</Text>
          {r.letters ? (
            <Text style={T.muted}>
              {pick(L.letters, lg)}: <Text style={{ fontSize: fsAr(19), color: C.ink }}>{r.letters}</Text>
            </Text>
          ) : null}
          <Example text={r.example} dark={dark} />
        </View>
      ))}

      <SectionTitle>{pick(L.other, lg)}</SectionTitle>
      {OTHER_RULES.map((r) => (
        <View key={r.name.tr} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }} accessibilityRole="header">{pick(r.name, lg)}</Text>
            {lg !== 'ar' && <Text style={{ fontSize: fsAr(17), color: C.muted }}>{r.name.ar}</Text>}
          </View>
          <Text style={T.body}>{pick(r.desc, lg)}</Text>
          <Example text={r.example} dark={dark} />
        </View>
      ))}
      <Text style={T.small}>{pick(L.note, lg)}</Text>
    </Screen>
  );
}
