import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, TextInput, View } from 'react-native';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { Card, Header, IconBtn, ListRow, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs, fsAr } from '@/constants/theme';
import { DUA_LIB, allTextDuas } from '@/data/duas';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { bukhariBooks, dailyHadith } from '@/services/hadith';

const L = {
  tawaf: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' },
  tawafSub: { tr: '3D Kâbe · şavt sayacı · köşelerde dua ve sesli rehber', en: '3D Kaaba · round counter · corner guidance with audio', ar: 'كعبة ثلاثية الأبعاد · عدّاد الأشواط · أدعية صوتية' },
  search: { tr: 'Dua ara (ör. sabah, yolculuk, şifa)', en: 'Search du‘as (e.g. morning, travel, healing)', ar: 'ابحث في الأدعية' },
  none: { tr: 'Sonuç yok', en: 'No results', ar: 'لا نتائج' },
} satisfies Record<string, ML>;

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f’'ʿʾ‘-]/g, '');

export default function HadithDua({ back = false }: { back?: boolean }) {
  const { t, lang } = useI18n();
  const h = dailyHadith();
  const [books, setBooks] = useState<{ no: number; name: string }[] | null>(null);
  const [err, setErr] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return null;
    return allTextDuas().filter(({ cat, d }) => {
      const c = DUA_LIB.find((x) => x.id === cat)!;
      return norm(`${d.tr} ${pick(d.mean, lang)} ${d.when ? pick(d.when, lang) : ''} ${pick(c.title, lang)} ${d.ref}`).includes(n) || d.ar.includes(q.trim());
    }).slice(0, 25);
  }, [q, lang]);

  useEffect(() => { bukhariBooks().then(setBooks).catch(() => setErr(true)); }, []);

  return (
    <Screen>
      <Header back={back} title={t('hadith.title')} />
      <Pressable onPress={() => router.push('/tavaf')} accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: C.ink }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="kaaba" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.onInk, fontSize: fs(16), fontWeight: '700' }}>{pick(L.tawaf, lang)}</Text>
          <Text style={{ color: C.onInk, opacity: 0.75, fontSize: fs(12.5) }}>{pick(L.tawafSub, lang)}</Text>
        </View>
        <Icon name="chevron" size={18} color={C.onInk} />
      </Pressable>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.7 }}>{t('hadith.daily')}</Text>
          <IconBtn name="share" label={t('common.share')} size={36} tint={C.bg} onPress={() => Share.share({ message: `${h.ar}\n\n${lang === 'en' ? h.en : h.tr}\n— ${h.ref}` })} />
        </View>
        <Text style={[T.arabic, { fontSize: fsAr(26) }]}>{h.ar}</Text>
        {lang !== 'ar' && <Text style={{ fontSize: fs(16), lineHeight: fs(23), fontWeight: '500', color: C.ink }}>{lang === 'en' ? h.en : h.tr}</Text>}
        <Text style={T.small}>{h.ref}</Text>
      </Card>

      <SectionTitle>{t('hadith.duas')}</SectionTitle>
      <TextInput value={q} onChangeText={setQ} placeholder={pick(L.search, lang)} placeholderTextColor={C.muted}
        style={{ height: 44, borderRadius: 22, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: fs(15), color: C.ink }} />
      {hits ? (
        hits.length ? hits.map(({ d }) => <DuaBlock key={d.id} d={d} compact />) : <Text style={T.body}>{pick(L.none, lang)}</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DUA_LIB.map((c) => (
            <Pressable key={c.id} onPress={() => router.push({ pathname: '/dua/[kategori]', params: { kategori: c.id } })} accessibilityRole="button"
              style={{ width: '31.5%', minHeight: 88, borderRadius: 16, backgroundColor: c.id === 'tavaf' ? C.accentTint : C.surface, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6 }}>
              <Icon name={c.icon} size={20} color={C.accent} />
              <Text style={{ fontSize: fs(12.5), fontWeight: '600', textAlign: 'center', color: C.ink }} numberOfLines={2}>{pick(c.title, lang)}</Text>
              <Text style={{ fontSize: fs(11), color: C.muted }}>{c.items.length}</Text>
            </Pressable>
          ))}
        </View>
      )}

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
