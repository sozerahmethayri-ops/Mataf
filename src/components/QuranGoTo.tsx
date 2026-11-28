// Kur'an'da "Git" penceresi (0.25.0): sûreye, cüze, sayfaya ya da ayraca git. Sûre sekmesindeki kutu akıllı aramayı da
// anlar ("2:255", "bakara 255", "s 300", "c 15"; services/quranNav). Mushafta ve sûre okuma ekranında ortak.
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { AR_DIGITS } from '@/components/QuranParts';
import { Btn, Segmented, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { AYAH_COUNTS } from '@/data/quranEditions';
import { PAGE_COUNT, pageOf } from '@/data/quranPages';
import type { ML } from '@/data/sites';
import { pick } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { JUZ_STARTS } from '@/services/hatim';
import { surahName } from '@/services/quran';
import { fold, juzStartPage, parseQuranQuery, type QuranTarget } from '@/services/quranNav';
import type { Bookmark } from '@/services/QuranPrefs';

type Tab = 'surah' | 'juz' | 'page' | 'mark';
const L = {
  title: { tr: 'Git', en: 'Go to', ar: 'انتقل إلى' },
  surah: { tr: 'Sûre', en: 'Surah', ar: 'سورة' },
  juz: { tr: 'Cüz', en: 'Juz', ar: 'جزء' },
  page: { tr: 'Sayfa', en: 'Page', ar: 'صفحة' },
  mark: { tr: 'Ayraç', en: 'Bookmark', ar: 'علامة' },
  find: { tr: 'Sûre adı ya da 2:255, s 300, c 15', en: 'Surah name or 2:255, p 300, j 15', ar: 'اسم السورة أو 2:255' },
  pageHint: { tr: 'Sayfa numarası (1–604)', en: 'Page number (1–604)', ar: 'رقم الصفحة (1–604)' },
  go: { tr: 'Git', en: 'Go', ar: 'اذهب' },
  noMarks: { tr: 'Henüz ayraç yok. Okurken bir âyete dokunup ayraç koyabilirsiniz.', en: 'No bookmarks yet. Tap a verse while reading to add one.', ar: 'لا توجد علامات بعد.' },
  ayahs: { tr: '{n} âyet · s. {p}', en: '{n} verses · p. {p}', ar: '{n} آية · ص {p}' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
} satisfies Record<string, ML>;

const SURAHS = Array.from({ length: 114 }, (_, i) => i + 1);

export function GoToSheet({ visible, lang, bookmarks, onGo, onClose }: {
  visible: boolean; lang: Lang; bookmarks: Bookmark[]; onGo: (t: QuranTarget, bookmarkId?: string) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('surah');
  const [q, setQ] = useState('');
  const [pg, setPg] = useState('');
  const d = (x: number) => (lang === 'ar' ? AR_DIGITS(x) : String(x));
  const names = useMemo(() => (['tr', 'en'] as Lang[]).map((l) => SURAHS.map((n) => surahName(n, l))), []);
  const direct = q.trim() ? parseQuranQuery(q, names) : null;
  const f = fold(q);
  const list = f ? SURAHS.filter((n) => String(n) === f || names.some((ns) => fold(ns[n - 1]).includes(f))) : SURAHS;
  const go = (t: QuranTarget, b?: string) => { onGo(t, b); setQ(''); setPg(''); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => undefined} style={{ height: '82%', backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.h2, { flex: 1 }]}>{pick(L.title, lang)}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={pick(L.close, lang)} hitSlop={8}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={20} color={C.muted} />
            </Pressable>
          </View>
          <Segmented<Tab> value={tab} onChange={setTab}
            options={[{ value: 'surah', label: pick(L.surah, lang) }, { value: 'juz', label: pick(L.juz, lang) }, { value: 'page', label: pick(L.page, lang) }, { value: 'mark', label: pick(L.mark, lang) }]} />

          {tab === 'surah' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.surface }}>
                <Icon name="search" size={18} color={C.muted} />
                <TextInput value={q} onChangeText={setQ} placeholder={pick(L.find, lang)} placeholderTextColor={C.muted} autoCorrect={false}
                  onSubmitEditing={() => { if (direct) go(direct); }} returnKeyType="go"
                  style={{ flex: 1, fontSize: fs(15), color: C.ink }} />
              </View>
              {direct && direct.kind !== 'ayah' ? (
                <Btn title={`${pick(L.go, lang)} · ${direct.kind === 'page' ? `${pick(L.page, lang)} ${d(direct.p)}` : `${pick(L.juz, lang)} ${d(direct.j)}`}`} onPress={() => go(direct)} />
              ) : direct && direct.a > 1 ? (
                <Btn title={`${pick(L.go, lang)} · ${surahName(direct.s, lang)} ${d(direct.a)}`} onPress={() => go(direct)} />
              ) : null}
              <FlatList
                data={list}
                keyExtractor={(n) => String(n)}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={14}
                renderItem={({ item: n }) => (
                  <Pressable onPress={() => go({ kind: 'ayah', s: n, a: 1 })} accessibilityRole="button"
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
                    <Text style={{ width: 34, textAlign: 'center', fontSize: fs(13), fontWeight: '700', color: C.accent }}>{d(n)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fs(16), fontWeight: '600', color: C.ink }}>{surahName(n, lang)}</Text>
                      <Text style={T.small}>{pick(L.ayahs, lang).replace('{n}', d(AYAH_COUNTS[n - 1])).replace('{p}', d(pageOf(n, 1)))}</Text>
                    </View>
                  </Pressable>
                )}
              />
            </>
          )}

          {tab === 'juz' && (
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 }}>
              {JUZ_STARTS.map(([s, a], i) => (
                <Pressable key={i} onPress={() => go({ kind: 'juz', j: i + 1 })} accessibilityRole="button"
                  style={({ pressed }) => ({ width: '31.5%', minHeight: 64, padding: 8, borderRadius: 14, backgroundColor: C.surface, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ fontSize: fs(17), fontWeight: '800', color: C.accent }}>{d(i + 1)}</Text>
                  <Text style={T.small} numberOfLines={1}>{surahName(s, lang)} {d(a)} · s. {d(juzStartPage(i + 1))}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {tab === 'page' && (
            <View style={{ gap: 12 }}>
              <TextInput value={pg} onChangeText={(v) => setPg(v.replace(/[^0-9]/g, '').slice(0, 3))} keyboardType="number-pad" autoFocus
                placeholder={pick(L.pageHint, lang)} placeholderTextColor={C.muted}
                onSubmitEditing={() => { const p = Number(pg); if (p >= 1 && p <= PAGE_COUNT) go({ kind: 'page', p }); }}
                style={{ height: 56, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 14, fontSize: fs(22), color: C.ink, textAlign: 'center' }} />
              <Btn title={pick(L.go, lang)} disabled={!(Number(pg) >= 1 && Number(pg) <= PAGE_COUNT)} onPress={() => go({ kind: 'page', p: Number(pg) })} />
            </View>
          )}

          {tab === 'mark' && (
            bookmarks.length ? (
              <ScrollView contentContainerStyle={{ gap: 6 }}>
                {bookmarks.map((bm) => (
                  <Pressable key={bm.id} onPress={() => go({ kind: 'ayah', s: bm.surah, a: bm.ayah }, bm.id)} accessibilityRole="button"
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 })}>
                    <Icon name="bookmark" size={18} color={bm.hatim ? C.green : C.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{bm.name}</Text>
                      <Text style={T.small}>{surahName(bm.surah, lang)} {d(bm.ayah)} · s. {d(pageOf(bm.surah, bm.ayah))}</Text>
                    </View>
                    <Icon name="chevron" size={16} color={C.muted} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : <Text style={T.body}>{pick(L.noMarks, lang)}</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
