import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';

import { Card, Header, IconBtn, ListRow, Screen, SectionTitle, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { DUA_CATS } from '@/data/content';
import { useI18n } from '@/i18n';
import { bukhariBooks, dailyHadith } from '@/services/hadith';

export default function HadithDua() {
  const { t, lang } = useI18n();
  const h = dailyHadith();
  const [books, setBooks] = useState<{ no: number; name: string }[] | null>(null);
  const [err, setErr] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { bukhariBooks().then(setBooks).catch(() => setErr(true)); }, []);

  return (
    <Screen>
      <Header title={t('hadith.title')} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.7 }}>{t('hadith.daily')}</Text>
          <IconBtn name="share" label={t('common.share')} size={36} tint={C.bg} onPress={() => Share.share({ message: `${h.ar}\n\n${lang === 'en' ? h.en : h.tr}\n— ${h.ref}` })} />
        </View>
        <Text style={[T.arabic, { fontSize: 26 }]}>{h.ar}</Text>
        {lang !== 'ar' && <Text style={{ fontSize: 16, lineHeight: 23, fontWeight: '500', color: C.ink }}>{lang === 'en' ? h.en : h.tr}</Text>}
        <Text style={T.small}>{h.ref}</Text>
      </Card>

      <SectionTitle>{t('hadith.duas')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DUA_CATS.map((c) => (
          <Pressable key={c.id} onPress={() => router.push({ pathname: '/dua/[kategori]', params: { kategori: c.id } })} accessibilityRole="button"
            style={{ width: '31.5%', minHeight: 64, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', color: C.ink }}>{c.title}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>{t('hadith.bukhari')} · {t('hadith.books')}</SectionTitle>
      {err && <Text style={T.body}>{t('hadith.error')}</Text>}
      {!books && !err && <ActivityIndicator color={C.accent} />}
      {books && (showAll ? books : books.slice(0, 12)).map((b) => (
        <ListRow key={b.no} title={`${b.no}. ${b.name}`} onPress={() => router.push({ pathname: '/hadis/[kitap]', params: { kitap: String(b.no) } })} />
      ))}
      {books && !showAll && books.length > 12 && (
        <Pressable onPress={() => setShowAll(true)}><Text style={{ color: C.accent, fontWeight: '700', paddingVertical: 8 }}>Tümünü göster ({books.length})</Text></Pressable>
      )}
      <Text style={T.small}>Kaynak: fawazahmed0/hadith-api (açık veri). Çeviriler kaynaktaki gibidir; yayın öncesi bir ilahiyatçıya kontrol ettirin.</Text>
    </Screen>
  );
}
