import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Switch, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, R, S, fs, fsAr, onThemeChange, shadow } from '@/constants/theme';
import type { GateStatus } from '@/services/reports';
import { useI18n } from '@/i18n';
import type { Key } from '@/i18n/strings';
import { Icon, type IconName } from './Icon';

export function Screen({ children, scroll = true, pad = true, style }: { children: ReactNode; scroll?: boolean; pad?: boolean; style?: StyleProp<ViewStyle> }) {
  const inner = <View style={[pad && { paddingHorizontal: S.lg }, { gap: S.md, paddingBottom: S.xxl }, style]}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, paddingTop: S.sm }}>
      {back && (
        <IconBtn name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[T.h1, back && { fontSize: fs(20) }]} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={T.muted}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function IconBtn({ name, label, onPress, tint = C.surface, color = C.ink, size = 44, elevated }: { name: IconName; label: string; onPress?: () => void; tint?: string; color?: string; size?: number; elevated?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }, elevated && shadow]}>
      <Icon name={name} color={color} size={20} />
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = 'primary', icon, style, disabled }: { title: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'green'; icon?: IconName; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const bg = kind === 'primary' ? C.accent : kind === 'green' ? C.green : C.bg;
  const fg = kind === 'secondary' ? C.ink : kind === 'green' ? '#FFFFFF' : C.onAccent;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ height: 48, borderRadius: 24, paddingHorizontal: 18, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, kind === 'secondary' && { borderWidth: 1.5, borderColor: C.borderStrong }, style]}>
      {icon && <Icon name={icon} color={fg} size={18} />}
      <Text style={{ color: fg, fontSize: fs(15), fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, dot }: { label: string; active?: boolean; onPress?: () => void; dot?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress}
      style={[{ height: 38, paddingHorizontal: 14, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 6 }, active ? { backgroundColor: C.ink } : { backgroundColor: C.bg, borderWidth: 1, borderColor: C.borderStrong }]}>
      {dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? C.onInk : dot }} />}
      <Text style={{ fontSize: fs(13), fontWeight: active ? '700' : '500', color: active ? C.onInk : C.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[{ padding: S.lg, borderRadius: R.lg, backgroundColor: tint ?? C.bg, borderWidth: tint ? 0 : 1, borderColor: C.border, gap: S.sm }, style]}>{children}</View>;
}

/** Açma/kapama düğmesi: telefonda ve web önizlemesinde aynı renkler. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const web = Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF', activeTrackColor: C.accent } as object) : {};
  return (
    <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
      trackColor={{ true: C.accent, false: C.borderStrong }} thumbColor="#FFFFFF" ios_backgroundColor={C.borderStrong} {...web} />
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={T.section}>{children}</Text>;
}

export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: C.surface }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={[{ flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, on && { backgroundColor: C.bg, ...shadow, shadowOpacity: 0.08, elevation: 1 }]}>
            <Text style={{ fontSize: fs(13), fontWeight: on ? '700' : '500', color: on ? C.ink : C.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const statusTone = (): Record<GateStatus, { fg: string; bg: string; key: Key }> => ({
  open: { fg: C.open, bg: C.openTint, key: 'status.open' },
  closed: { fg: C.closed, bg: C.closedTint, key: 'status.closed' },
  crowded: { fg: C.limited, bg: C.limitedTint, key: 'status.crowded' },
  exitOnly: { fg: C.limited, bg: C.limitedTint, key: 'status.exitOnly' },
  entryOnly: { fg: C.limited, bg: C.limitedTint, key: 'status.entryOnly' },
  women: { fg: C.limited, bg: C.limitedTint, key: 'status.women' },
  noAccess: { fg: C.limited, bg: C.limitedTint, key: 'status.noAccess' },
});
export const STATUS_TONE = statusTone();

export function StatusPill({ status }: { status: GateStatus }) {
  const { t } = useI18n();
  const tone = STATUS_TONE[status];
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: tone.bg }}>
      <Text style={{ fontSize: fs(12), fontWeight: '700', color: tone.fg }}>{t(tone.key)}</Text>
    </View>
  );
}

/** Seçim satırı: başlık + seçili değer; dokununca seçenekler açılır, seçince kapanır (uzun listeleri gizler). */
export function SelectRow<V extends string>({ title, value, options, onChange, left }: { title: string; value: V; options: { value: V; label: string; sub?: string }[]; onChange: (v: V) => void; left?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${title}: ${cur?.label ?? value}`}
        style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.sm, opacity: pressed ? 0.7 : 1 })}>
        {left}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{title}</Text>
          <Text style={{ fontSize: fs(13), fontWeight: '600', color: C.accent }} numberOfLines={1}>{cur?.label ?? value}</Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}><Icon name="chevron" color={C.muted} size={16} /></View>
      </Pressable>
      {open && (
        <View style={{ marginBottom: S.sm, borderRadius: R.md, backgroundColor: C.surface, overflow: 'hidden' }}>
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border, opacity: pressed ? 0.7 : 1 })}>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={{ fontSize: fs(14.5), color: on ? C.accent : C.ink, fontWeight: on ? '700' : '500' }}>{o.label}</Text>
                  {o.sub ? <Text style={T.small}>{o.sub}</Text> : null}
                </View>
                {on && <Icon name="check" size={16} color={C.accent} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function ListRow({ title, subtitle, onPress, right, left }: { title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; left?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: S.md, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: S.sm, opacity: pressed ? 0.7 : 1 }]}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{title}</Text>
        {subtitle ? <Text style={T.small}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" color={C.muted} size={18} /> : null)}
    </Pressable>
  );
}

export function ago(ms: number | undefined, t: ReturnType<typeof useI18n>['t']) {
  if (!ms) return '';
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return t('common.now');
  if (m < 60) return t('gates.ago', { t: `${m} ${t('common.min')}` });
  return t('gates.ago', { t: `${Math.round(m / 60)} sa` });
}

const buildT = () => ({
  h1: { fontSize: fs(26), fontWeight: '700', color: C.ink, letterSpacing: -0.3 } as TextStyle,
  h2: { fontSize: fs(18), fontWeight: '700', color: C.ink } as TextStyle,
  h3: { fontSize: fs(16), fontWeight: '700', color: C.ink, lineHeight: fs(22) } as TextStyle,
  body: { fontSize: fs(15), lineHeight: fs(22), color: C.ink2 } as TextStyle,
  muted: { fontSize: fs(13), color: C.muted } as TextStyle,
  small: { fontSize: fs(12), color: C.muted } as TextStyle,
  // Bölüm başlığı cümle düzeninde: büyük harf dönüşümü Türkçe "i"yi "I" yapıyordu ve şablon gibi duruyordu
  section: { fontSize: fs(14), fontWeight: '700', color: C.ink2, marginTop: S.sm } as TextStyle,
  arabic: { fontSize: fsAr(24), lineHeight: fsAr(40), color: C.ink, textAlign: 'right', writingDirection: 'rtl' } as TextStyle,
});
/** Yazı stilleri — tema değişince aynı nesne yeni renklerle güncellenir. */
export const T = buildT();
onThemeChange(() => {
  Object.assign(T, buildT());
  Object.assign(STATUS_TONE, statusTone());
});
