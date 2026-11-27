// Kur'an okuma ekranlarının (sûre okuma ve mushaf sayfaları) ortak parçaları: Arapça rakam, yazı büyütme basamakları,
// ayraç penceresi, tecvid lejantı ve sayfa işareti.
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Btn, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { TAJWEED_RULES } from '@/data/tajweed';
import { pick } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { surahName } from '@/services/quran';
import type { Bookmark } from '@/services/QuranPrefs';

export const QL = {
  rules: { tr: 'Tecvid kuralları', en: 'Tajweed rules', ar: 'أحكام التجويد' },
  pageMark: { tr: 'Sayfa {p} · {j}. cüz', en: 'Page {p} · Juz {j}', ar: 'صفحة {p} · الجزء {j}' },
  markTitle: { tr: 'Bu ayete ayraç koy', en: 'Bookmark this verse', ar: 'ضع علامة على هذه الآية' },
  newMark: { tr: 'Yeni ayraç adı (ör. Cuma okuması)', en: 'New bookmark name', ar: 'اسم علامة جديدة' },
  add: { tr: 'Ekle', en: 'Add', ar: 'إضافة' },
  cancel: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  zoomIn: { tr: 'Yazıyı büyüt', en: 'Larger text', ar: 'تكبير الخط' },
  zoomOut: { tr: 'Yazıyı küçült', en: 'Smaller text', ar: 'تصغير الخط' },
};

export const AR_DIGITS = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
/** Okuma ekranlarında yazı büyütme basamakları */
export const ZOOMS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];
/** Yazı büyütmede bir basamak ileri ya da geri */
export function nextZoom(z: number, d: 1 | -1) {
  const i = ZOOMS.findIndex((x) => x >= z - 0.001);
  return ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 2 : i) + d))];
}

/** Ayraç seçimi: var olan ayraca bu ayeti kaydet ya da yeni ayraç oluştur. */
export function MarkSheet({ visible, ayah, surah, lang, bookmarks, onPick, onClose }: { visible: boolean; ayah: number; surah: number; lang: Lang; bookmarks: Bookmark[]; onPick: (b: Bookmark) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => undefined} style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 10 }}>
          <Text style={T.h2}>{pick(QL.markTitle, lang)} · {surahName(surah, lang)} {ayah}</Text>
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
            <TextInput value={name} onChangeText={setName} placeholder={pick(QL.newMark, lang)} placeholderTextColor={C.muted}
              style={{ flex: 1, height: 44, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: fs(14), color: C.ink }} />
            <Btn title={pick(QL.add, lang)} kind="secondary" disabled={!name.trim()} onPress={() => { onPick({ id: `b${Math.round(ayah * 1000 + surah)}-${name.length}-${name.trim().slice(0, 12)}`, name: name.trim(), surah, ayah, at: 0 }); setName(''); }} />
          </View>
          <Btn title={pick(QL.cancel, lang)} kind="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Tecvid renklerinin kısa lejantı (yaygın kurallar); sonunda kuralların açıklandığı sayfa. */
export function TajweedLegend({ lang, dark }: { lang: Lang; dark: boolean }) {
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
        <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.onAccent }}>{pick(QL.rules, lang)} ›</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Sayfa başı işareti: Medine Mushafı sayfası ve cüzü */
export function PageMark({ page, juz, lang }: { page: number; juz: number; lang: Lang }) {
  const d = (x: number) => (lang === 'ar' ? AR_DIGITS(x) : String(x));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }} accessibilityRole="header">
      <View style={{ flex: 1, height: 1, backgroundColor: C.accentTint }} />
      <Text style={{ fontSize: fs(12.5), fontWeight: '700', color: C.accent }}>{pick(QL.pageMark, lang).replace('{p}', d(page)).replace('{j}', d(juz))}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.accentTint }} />
    </View>
  );
}
