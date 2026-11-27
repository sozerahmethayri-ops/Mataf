import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Btn, Card, Header, ListRow, Screen, SectionTitle, T, ago } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { SOURCES } from '@/data/content';
import { useI18n } from '@/i18n';
import { cacheAge, clearCache } from '@/services/cache';
import { useReports } from '@/services/ReportsContext';

export default function DataSources() {
  const { t } = useI18n();
  const { backend, refresh, loading, lastSync, error } = useReports();
  const [ages, setAges] = useState<Record<string, number | undefined>>({});
  const [busy, setBusy] = useState(false);

  const loadAges = () => Promise.all([cacheAge('quran:list'), cacheAge('hadith:info')]).then(([quran, hadith]) => setAges({ quran, hadith }));
  useEffect(() => {
    let alive = true;
    Promise.all([cacheAge('quran:list'), cacheAge('hadith:info')]).then(([quran, hadith]) => alive && setAges({ quran, hadith }));
    return () => { alive = false; };
  }, []);

  const syncAll = async () => {
    setBusy(true);
    // Sürümlü içerik önbelleğini boşalt; ekranlar açıldığında en güncel sürüm indirilir.
    await clearCache('quran:list');
    await clearCache('hadith:info');
    await refresh();
    await loadAges();
    setBusy(false);
  };

  return (
    <Screen>
      <Header back title={t('data.title')} subtitle={t('data.sub')} />
      <Card tint={busy || loading ? C.accentSoft : C.openTint}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {busy || loading ? <ActivityIndicator color={C.accent} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={T.h2}>{busy || loading ? t('data.syncing') : t('data.ok')}</Text>
            <Text style={T.small}>{lastSync ? t('data.last', { t: ago(lastSync, t) }) : ''}{error ? ` · ${error}` : ''}</Text>
          </View>
        </View>
        <Btn title={t('data.sync')} kind="secondary" onPress={syncAll} disabled={busy} />
      </Card>
      <SectionTitle>Kaynaklar</SectionTitle>
      {SOURCES.map((s) => {
        // "Canlı" yalnız gerçekten canlıyken: kapı bildirimleri Supabase bağlıysa; resmî veri henüz bağlı değil (bekliyor)
        const live = s.id === 'reports' && backend === 'supabase';
        const tag = live ? '● Canlı' : s.id === 'reports' ? 'Demo' : s.id === 'official' ? 'Bekliyor' : 'Sürümlü';
        return (
          <ListRow key={s.id} title={s.title}
            subtitle={`${s.id === 'reports' ? (backend === 'supabase' ? 'Supabase · canlı' : 'Yerel demo · bu cihaz') : s.meta}${ages[s.id] ? ` · ${ago(ages[s.id], t)}` : ''}`}
            right={<View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: live ? C.openTint : C.surface }}>
              <Text style={{ fontSize: fs(11), fontWeight: '700', color: live ? C.open : C.ink2 }}>{tag}</Text>
            </View>} />
        );
      })}
      <Text style={T.small}>Kurallar: resmî kapanma bilgisi ziyaretçi bildirimlerinden önce gelir. Bildirim 3 farklı kişi onaylayınca görünür, 2 saat içinde yeniden onaylanmazsa kalkar.</Text>
    </Screen>
  );
}
