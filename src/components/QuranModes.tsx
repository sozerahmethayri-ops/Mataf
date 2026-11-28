// Kur'an okuma biçimleri (0.25.0): sayfa sayfa (tecvid renkli, tecvidsiz) ve âyet âyet (mealli, tefsirli, yalnız
// Arapça, yalnız meal). Okuma ekranlarının "Görünüm" penceresi ve Kur'an ayarları aynı listeyi gösterir. Sayfa
// biçimleri mushaf ekranında (/mushaf), âyet âyet biçimler sûre okuma ekranında (/kuran/[sure]) açılır.
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { QL, nextZoom } from '@/components/QuranParts';
import { T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { QuranView } from '@/data/quranEditions';
import { MODES, isPageMode } from '@/data/quranModes';
import { pageOf } from '@/data/quranPages';
import type { ML } from '@/data/sites';
import { pick } from '@/i18n';
import type { Lang } from '@/i18n/strings';

export { MODES, isPageMode };

/** Biçime uygun ekranı açar (sayfa biçimi mushafta, diğerleri sûre okuma ekranında); `replace` okuma ekranları arasında geçişte. */
export function openReading(v: QuranView, s: number, a: number, opts: { b?: string; replace?: boolean } = {}) {
  const go = opts.replace ? router.replace : router.push;
  if (isPageMode(v)) go({ pathname: '/mushaf', params: { p: String(pageOf(s, Math.max(1, a))), ...(opts.b ? { b: opts.b } : null) } });
  else go({ pathname: '/kuran/[sure]', params: { sure: String(s), a: String(Math.max(1, a)), ...(opts.b ? { b: opts.b } : null) } });
}

const L = {
  title: { tr: 'Görünüm', en: 'View', ar: 'طريقة العرض' },
  size: { tr: 'Yazı boyu', en: 'Text size', ar: 'حجم الخط' },
  more: { tr: 'Diğer okuma ayarları (hat, meal, kâri, tefsir)', en: 'More reading settings (script, translation, reciter, tafsir)', ar: 'إعدادات قراءة أخرى' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
} satisfies Record<string, ML>;

/** Okuma biçimleri listesi (ayarlarda ve pencerede ortak) */
export function ModeList({ lang, value, onPick }: { lang: Lang; value: QuranView; onPick: (v: QuranView) => void }) {
  return (
    <View style={{ gap: 6 }}>
      {MODES.map((m) => {
        const on = m.v === value;
        return (
          <Pressable key={m.v} onPress={() => onPick(m.v)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: on ? C.accentSoft : C.surface, opacity: pressed ? 0.8 : 1 })}>
            <Icon name={m.page ? 'book' : 'list'} size={20} color={on ? C.accent : C.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15), fontWeight: on ? '700' : '600', color: on ? C.accent : C.ink }}>{pick(m.title, lang)}</Text>
              <Text style={T.small} numberOfLines={2}>{pick(m.sub, lang)}</Text>
            </View>
            {on ? <Icon name="check" size={18} color={C.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** "Görünüm" penceresi: okuma biçimi ve yazı boyu; altta diğer ayarlar. Biçim seçilince ekran ona göre değişir. */
export function ModeSheet({ visible, lang, value, zoom, onPick, onZoom, onClose }: {
  visible: boolean; lang: Lang; value: QuranView; zoom: number; onPick: (v: QuranView) => void; onZoom: (z: number) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => undefined} style={{ maxHeight: '88%', backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
            <Text style={T.h2}>{pick(L.title, lang)}</Text>
            <ModeList lang={lang} value={value} onPick={onPick} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.surface }}>
              <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(L.size, lang)}</Text>
              <Pressable onPress={() => onZoom(nextZoom(zoom, -1))} accessibilityRole="button" accessibilityLabel={pick(QL.zoomOut, lang)}
                style={{ width: 48, height: 44, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>A−</Text>
              </Pressable>
              <Text style={{ minWidth: 48, textAlign: 'center', fontSize: fs(14), fontWeight: '700', color: C.accent }}>{`${Math.round(zoom * 100)}%`}</Text>
              <Pressable onPress={() => onZoom(nextZoom(zoom, 1))} accessibilityRole="button" accessibilityLabel={pick(QL.zoomIn, lang)}
                style={{ width: 48, height: 44, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(18), fontWeight: '700', color: C.ink }}>A+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => { onClose(); router.push('/kuran-ayarlar'); }} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12 }}>
              <Icon name="settings" size={18} color={C.accent} />
              <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '600', color: C.accent }}>{pick(L.more, lang)}</Text>
              <Icon name="chevron" size={16} color={C.muted} />
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
