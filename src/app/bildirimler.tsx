// Ezan bildirimleri ayarları: kaç dakika önce, hangi vakitler, hangi ses, kendi ezan kaydınız.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, Pressable, Text, View } from 'react-native';

import { playAdhan, stopAdhan } from '@/components/AdhanHost';
import { Icon } from '@/components/Icon';
import { Btn, Card, Chip, Header, Screen, SectionTitle, Segmented, T, Toggle } from '@/components/ui';
import { C } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { BEFORE_CHOICES, DEFAULT_NOTIF, SOUNDS, prayerName, type NotifPrefs, type SoundId } from '@/services/adhanPlan';
import { NOTIF_KEY, applySchedule, askExactAlarm, exactAlarmGranted, mergeNotif, notificationsSupported, sendTest, type ApplyResult } from '@/services/adhanNotify';
import type { PrayerKey } from '@/services/prayer';
import { usePersisted } from '@/services/usePersisted';
import { refreshWidgetTicks } from '@/services/widgetSync';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Ezan bildirimleri', en: 'Adhan notifications', ar: 'إشعارات الأذان' },
  enable: { tr: 'Ezan yaklaşınca bildir', en: 'Notify before adhan', ar: 'نبّهني قبل الأذان' },
  enableSub: { tr: 'Telefon kilitliyken de gelir; internet gerekmez.', en: 'Works with the phone locked; no internet needed.', ar: 'يعمل والهاتف مقفل؛ دون حاجة للإنترنت.' },
  place: { tr: 'Vakitler', en: 'Prayer times for', ar: 'المواقيت حسب' },
  here: { tr: 'Bulunduğum yer', en: 'My location', ar: 'موقعي' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
  before: { tr: 'Ne kadar önce?', en: 'How early?', ar: 'قبل كم؟' },
  none: { tr: 'Önceden yok', en: 'None', ar: 'لا' },
  min: { tr: 'dk', en: 'min', ar: 'د' },
  atTime: { tr: 'Vakit girince de bildir', en: 'Also notify at adhan time', ar: 'نبّهني أيضًا عند الأذان' },
  which: { tr: 'Hangi vakitler?', en: 'Which prayers?', ar: 'أي الصلوات؟' },
  sunriseNote: { tr: 'Güneş: sabah namazının vakti çıkmadan önce uyarır.', en: 'Sunrise: warns before Fajr time ends.', ar: 'الشروق: تنبيه قبل خروج وقت الفجر.' },
  sound: { tr: 'Bildirim sesi', en: 'Notification sound', ar: 'صوت الإشعار' },
  test: { tr: 'Deneme bildirimi gönder (5 sn)', en: 'Send a test notification (5 s)', ar: 'أرسل إشعارًا تجريبيًا (٥ ث)' },
  testSent: { tr: 'Deneme bildirimi 5 saniye içinde gelecek.', en: 'Test notification arrives in 5 seconds.', ar: 'سيصل الإشعار التجريبي خلال ٥ ثوانٍ.' },
  adhan: { tr: 'Ezan sesi', en: 'Adhan recording', ar: 'تسجيل الأذان' },
  adhanInfo: {
    tr: 'Bildirim sesi en çok 30 saniye olabildiği için tam ezan bildirimle çalınamaz. Kendi ezan kaydınızı (mp3, m4a) seçerseniz vakit girdiğinde uygulama açıksa ya da bildirime dokunduğunuzda tamamı okunur.',
    en: 'Notification sounds are limited to 30 seconds, so a full adhan cannot play as the alert. Pick your own adhan recording (mp3, m4a) and it plays in full when the time comes while the app is open, or when you tap the notification.',
    ar: 'لا يتجاوز صوت الإشعار ٣٠ ثانية، لذا لا يمكن تشغيل الأذان كاملًا كتنبيه. اختر تسجيل أذان (mp3، m4a) ليُرفع كاملًا عند دخول الوقت والتطبيق مفتوح، أو عند لمس الإشعار.',
  },
  pick: { tr: 'Ezan kaydı seç', en: 'Choose adhan recording', ar: 'اختر تسجيل الأذان' },
  change: { tr: 'Değiştir', en: 'Change', ar: 'تغيير' },
  remove: { tr: 'Kaldır', en: 'Remove', ar: 'إزالة' },
  listen: { tr: 'Dinle', en: 'Listen', ar: 'استمع' },
  stop: { tr: 'Durdur', en: 'Stop', ar: 'إيقاف' },
  special: { tr: 'Mübarek gün hatırlatması', en: 'Holy day reminder', ar: 'تذكير الأيام المباركة' },
  specialSub: { tr: 'Kandil, Ramazan ve bayramlardan bir önceki akşam. Kurban Bayramı’nda vakit bildirimleri teşrik tekbirini de hatırlatır.', en: 'The evening before holy nights, Ramadan and Eids. During Eid al-Adha the prayer alerts also remind the takbir al-tashriq.', ar: 'مساء قبل الليالي المباركة ورمضان والأعياد.' },
  playAdhan: { tr: 'Vakit girince ezanı oku', en: 'Play adhan at prayer time', ar: 'ارفع الأذان عند دخول الوقت' },
  ok: { tr: 'Kuruldu: önümüzdeki günler için {n} bildirim. İlki {t}.', en: 'Set: {n} notifications for the coming days. First at {t}.', ar: 'تم: {n} إشعارًا للأيام القادمة. الأول {t}.' },
  noPerm: { tr: 'Bildirim izni kapalı. Telefon ayarlarından MATAF için bildirimlere izin verin.', en: 'Notifications are not allowed. Enable them for MATAF in phone settings.', ar: 'الإشعارات غير مسموحة. فعّلها لـ MATAF من إعدادات الهاتف.' },
  noLoc: { tr: 'Konum bilinmiyor. Konum izni verin ya da Mekke/Medine seçin.', en: 'Location unknown. Allow location or choose Makkah/Madinah.', ar: 'الموقع غير معروف. اسمح بالموقع أو اختر مكة/المدينة.' },
  openSettings: { tr: 'Ayarları aç', en: 'Open settings', ar: 'افتح الإعدادات' },
  exactNote: { tr: 'Bildirimler birkaç dakika gecikebilir. Ezan bildirimi ve ana ekran kutusu tam vaktinde gelsin diye “Alarmlar ve hatırlatıcılar” iznini açın.', en: 'Alerts may arrive a few minutes late. Allow “Alarms & reminders” so the adhan alert and the home screen widget change exactly on time.', ar: 'قد تتأخر التنبيهات بضع دقائق. فعّل إذن «المنبهات والتذكيرات» ليصل تنبيه الأذان وتتغير أداة الشاشة الرئيسية في الوقت تمامًا.' },
  exactBtn: { tr: 'İzni aç', en: 'Allow', ar: 'السماح' },
  web: { tr: 'Bildirimler telefonda (iOS/Android) çalışır; bu önizlemede sesleri dinleyebilirsiniz.', en: 'Notifications work on the phone (iOS/Android); you can preview the sounds here.', ar: 'تعمل الإشعارات على الهاتف؛ يمكنك معاينة الأصوات هنا.' },
  notes: {
    tr: '• Uygulamaya özel sesler (Zil, Çan, Nağme, Damla) kendi derlemenizde (APK/IPA) çalar; Expo Go’da telefonun varsayılan sesi duyulur.\n• Bildirimler birkaç günlük kurulur ve uygulamayı her açtığınızda yenilenir.\n• Android’de pil tasarrufu bildirimleri geciktirebilir: MATAF için “Alarmlar ve hatırlatıcılar” iznini açın, pil kısıtlamasını kaldırın.',
    en: '• Custom sounds (Chime, Bell, Melody, Drops) play in your own build (APK/IPA); in Expo Go the default sound plays.\n• Notifications are set a few days ahead and refreshed whenever you open the app.\n• On Android, battery saving can delay notifications: allow “Alarms & reminders” for MATAF and remove battery restrictions.',
    ar: '• الأصوات الخاصة (جرس، ناقوس، نغمة، قطرات) تعمل في نسختك المبنية (APK/IPA)؛ في Expo Go يُسمع الصوت الافتراضي.\n• تُضبط الإشعارات لأيام قليلة وتتجدد كلما فتحت التطبيق.\n• في أندرويد قد يؤخر توفير الطاقة الإشعارات: فعّل «المنبهات والتذكيرات» لـ MATAF وأزل قيود البطارية.',
  },
} satisfies Record<string, { tr: string; en: string; ar: string }>;

const PREVIEW: Partial<Record<SoundId, number>> = {
  zil: require('../../assets/sounds/zil.wav'),
  can: require('../../assets/sounds/can_sesi.wav'),
  nagme: require('../../assets/sounds/nagme.wav'),
  damla: require('../../assets/sounds/damla.wav'),
};

const ORDER: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Seçilen kaydı önbellekten kalıcı belgeler klasörüne kopyalar (önbellek sistemce silinebilir). */
function persistAdhan(src: string, name: string, oldUri: string) {
  if (Platform.OS === 'web') return src;
  const dir = new Directory(Paths.document, 'adhan');
  dir.create({ intermediates: true, idempotent: true });
  deleteFile(oldUri);
  const ext = (name.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? '.mp3').toLowerCase();
  const dest = new File(dir, `ezan-${Date.now()}${ext}`);
  new File(src).copySync(dest);
  return dest.uri;
}
function deleteFile(uri: string) {
  if (Platform.OS === 'web' || !uri) return;
  try { const f = new File(uri); if (f.exists) f.delete(); } catch { /* zaten yok */ }
}

export default function NotificationSettings() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const l = (k: keyof typeof L) => pick(L[k], lg);
  const [raw, setPrefs, ready] = usePersisted<NotifPrefs>(NOTIF_KEY, DEFAULT_NOTIF);
  const prefs = mergeNotif(raw);
  const [status, setStatus] = useState<ApplyResult | null>(null);
  const [testMsg, setTestMsg] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const previewPlayer = useRef<AudioPlayer | null>(null);

  // Tercih değişince bildirimleri yeniden kur (kısa gecikmeyle; art arda dokunuşlar tek seferde)
  const first = useRef(true);
  useEffect(() => {
    if (!ready || !notificationsSupported) return;
    if (first.current) { first.current = false; return; }
    let alive = true;
    const timer = setTimeout(() => {
      applySchedule(mergeNotif(raw), lg, { ask: true }).then((r) => alive && setStatus(r)).catch(() => undefined);
    }, 600);
    return () => { alive = false; clearTimeout(timer); };
  }, [raw, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { previewPlayer.current?.remove(); stopAdhan(); }, []);

  // Tam zamanlı alarm izni (Android 12+): ayarlardan dönünce yeniden bakılır
  const [exact, setExact] = useState(true);
  useEffect(() => {
    if (!notificationsSupported) return;
    const check = () => { exactAlarmGranted().then(setExact).catch(() => undefined); };
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);
  const allowExact = async () => {
    const ok = await askExactAlarm();
    setExact(ok);
    // Önceden kurulan bildirimler gecikmeli kuruldu: izinle yeniden kur
    if (ok) {
      applySchedule(mergeNotif(raw), lg).then(setStatus).catch(() => undefined);
      refreshWidgetTicks();
    }
  };

  const stopPreview = () => {
    try { previewPlayer.current?.pause(); previewPlayer.current?.remove(); } catch { /* kapalı */ }
    previewPlayer.current = null;
    setPreview(null);
    stopAdhan();
  };
  const playPreview = async (id: string, src: number | { uri: string }) => {
    stopPreview();
    if (typeof src !== 'number') { if (await playAdhan(src.uri)) setPreview(id); return; }
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    const p = createAudioPlayer(src);
    previewPlayer.current = p;
    const sub = p.addListener('playbackStatusUpdate', (s) => { if (s.didJustFinish) { sub.remove(); setPreview(null); } });
    p.play();
    setPreview(id);
  };

  const pickAdhan = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    const uri = persistAdhan(a.uri, a.name, prefs.adhanUri);
    setPrefs({ adhanUri: uri, adhanName: a.name });
  };
  const removeAdhan = () => {
    stopPreview();
    deleteFile(prefs.adhanUri);
    setPrefs({ adhanUri: '', adhanName: '' });
  };

  const okText = status?.ok && status.count && status.first
    ? l('ok').replace('{n}', String(status.count)).replace('{t}', status.first.toLocaleString(lg === 'ar' ? 'ar-SA' : lg, { weekday: 'short', hour: '2-digit', minute: '2-digit' }))
    : '';

  return (
    <Screen>
      <Header back title={l('title')} />
      {!notificationsSupported && <Card tint={C.limitedTint}><Text style={T.body}>{l('web')}</Text></Card>}

      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="bell" color={prefs.enabled ? C.accent : C.muted} />
          <View style={{ flex: 1 }}>
            <Text style={[T.body, { fontWeight: '700' }]}>{l('enable')}</Text>
            <Text style={T.small}>{l('enableSub')}</Text>
          </View>
          <Toggle value={prefs.enabled} onChange={(v) => setPrefs({ enabled: v })} label={l('enable')} />
        </View>
        {status && !status.ok && status.reason === 'permission' && (
          <View style={{ gap: 8 }}>
            <Text style={[T.small, { color: C.closed }]}>{l('noPerm')}</Text>
            <Btn title={l('openSettings')} kind="secondary" onPress={() => Linking.openSettings()} />
          </View>
        )}
        {status && !status.ok && status.reason === 'location' && <Text style={[T.small, { color: C.closed }]}>{l('noLoc')}</Text>}
        {prefs.enabled && !exact && (
          <View style={{ gap: 8 }}>
            <Text style={[T.small, { color: C.limited }]}>{l('exactNote')}</Text>
            <Btn title={l('exactBtn')} kind="secondary" icon="clock" onPress={allowExact} />
          </View>
        )}
        {okText ? <Text style={[T.small, { color: C.green }]}>{okText}</Text> : null}
      </Card>

      <View style={{ gap: 12, opacity: prefs.enabled ? 1 : 0.55 }}>
        <SectionTitle>{l('place')}</SectionTitle>
        <Segmented value={prefs.place} onChange={(v) => setPrefs({ place: v })}
          options={[{ value: 'here', label: l('here') }, { value: 'makkah', label: l('makkah') }, { value: 'madinah', label: l('madinah') }]} />

        <SectionTitle>{l('before')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BEFORE_CHOICES.map((m) => (
            <Chip key={m} label={m ? `${m} ${l('min')}` : l('none')} active={prefs.before === m} onPress={() => setPrefs({ before: m })} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[T.body, { flex: 1 }]}>{l('atTime')}</Text>
          <Toggle value={prefs.atTime} onChange={(v) => setPrefs({ atTime: v })} label={l('atTime')} />
        </View>

        <SectionTitle>{l('which')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ORDER.map((k) => (
            <Chip key={k} label={prayerName(k, lg)} active={prefs.prayers[k]} onPress={() => setPrefs({ prayers: { ...prefs.prayers, [k]: !prefs.prayers[k] } })} />
          ))}
        </View>
        <Text style={T.small}>{l('sunriseNote')}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={T.body}>{l('special')}</Text>
            <Text style={T.small}>{l('specialSub')}</Text>
          </View>
          <Toggle value={prefs.special} onChange={(v) => setPrefs({ special: v })} label={l('special')} />
        </View>

        <SectionTitle>{l('sound')}</SectionTitle>
        <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' }}>
          {SOUNDS.map((s, i) => {
            const on = prefs.sound === s.id;
            const src = PREVIEW[s.id];
            return (
              <Pressable key={s.id} onPress={() => setPrefs({ sound: s.id })} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 52, borderTopWidth: i ? 1 : 0, borderColor: C.border, backgroundColor: pressed ? C.surface : C.bg })}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? C.accent : C.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.accent }} />}
                </View>
                <Text style={[T.body, { flex: 1, fontWeight: on ? '700' : '400' }]}>{pick(s.ml, lg)}</Text>
                {src != null && (
                  <Pressable onPress={() => (preview === s.id ? stopPreview() : playPreview(s.id, src))} hitSlop={8} accessibilityRole="button"
                    accessibilityLabel={`${preview === s.id ? l('stop') : l('listen')}: ${pick(s.ml, lg)}`}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={preview === s.id ? 'stop' : 'play'} color={C.accent} size={16} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </View>
        {notificationsSupported && (
          <Btn title={l('test')} kind="secondary" icon="bell" onPress={() => sendTest(prefs, lg).then((ok) => { setTestMsg(ok); if (!ok) setStatus({ ok: false, count: 0, reason: 'permission' }); })} />
        )}
        {testMsg && <Text style={T.small}>{l('testSent')}</Text>}

        <SectionTitle>{l('adhan')}</SectionTitle>
        <Card style={{ gap: 10 }}>
          <Text style={T.small}>{l('adhanInfo')}</Text>
          {prefs.adhanUri ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="speaker" color={C.accent} />
                <Text style={[T.body, { flex: 1, fontWeight: '600' }]} numberOfLines={1}>{prefs.adhanName}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn title={preview === 'adhan' ? l('stop') : l('listen')} icon={preview === 'adhan' ? 'stop' : 'play'} kind="secondary" style={{ flex: 1 }}
                  onPress={() => (preview === 'adhan' ? stopPreview() : playPreview('adhan', { uri: prefs.adhanUri }))} />
                <Btn title={l('change')} kind="secondary" style={{ flex: 1 }} onPress={pickAdhan} />
                <Btn title={l('remove')} kind="secondary" style={{ flex: 1 }} onPress={removeAdhan} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={[T.body, { flex: 1 }]}>{l('playAdhan')}</Text>
                <Toggle value={prefs.playAdhan} onChange={(v) => setPrefs({ playAdhan: v })} label={l('playAdhan')} />
              </View>
            </>
          ) : (
            <Btn title={l('pick')} icon="plus" onPress={pickAdhan} />
          )}
        </Card>

        <Text style={T.small}>{l('notes')}</Text>
      </View>
    </Screen>
  );
}
