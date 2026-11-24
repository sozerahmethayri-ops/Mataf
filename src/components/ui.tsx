import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, R, S, shadow } from '@/constants/theme';
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
        <Text style={[T.h1, back && { fontSize: 20 }]} accessibilityRole="header">{title}</Text>
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
  const fg = kind === 'secondary' ? C.ink : '#FFFFFF';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ height: 48, borderRadius: 24, paddingHorizontal: 18, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, kind === 'secondary' && { borderWidth: 1.5, borderColor: C.borderStrong }, style]}>
      {icon && <Icon name={icon} color={fg} size={18} />}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, dot }: { label: string; active?: boolean; onPress?: () => void; dot?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress}
      style={[{ height: 38, paddingHorizontal: 14, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 6 }, active ? { backgroundColor: C.ink } : { backgroundColor: C.bg, borderWidth: 1, borderColor: C.borderStrong }]}>
      {dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? '#FFFFFF' : dot }} />}
      <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? '#FFFFFF' : C.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[{ padding: S.lg, borderRadius: R.lg, backgroundColor: tint ?? C.bg, borderWidth: tint ? 0 : 1, borderColor: C.border, gap: S.sm }, style]}>{children}</View>;
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
            <Text style={{ fontSize: 13, fontWeight: on ? '700' : '500', color: on ? C.ink : C.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const STATUS_TONE: Record<GateStatus, { fg: string; bg: string; key: Key }> = {
  open: { fg: C.open, bg: C.openTint, key: 'status.open' },
  closed: { fg: C.closed, bg: C.closedTint, key: 'status.closed' },
  crowded: { fg: C.limited, bg: C.limitedTint, key: 'status.crowded' },
  exitOnly: { fg: C.limited, bg: C.limitedTint, key: 'status.exitOnly' },
  entryOnly: { fg: C.limited, bg: C.limitedTint, key: 'status.entryOnly' },
  women: { fg: C.limited, bg: C.limitedTint, key: 'status.women' },
  noAccess: { fg: C.limited, bg: C.limitedTint, key: 'status.noAccess' },
};

export function StatusPill({ status }: { status: GateStatus }) {
  const { t } = useI18n();
  const tone = STATUS_TONE[status];
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: tone.bg }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: tone.fg }}>{t(tone.key)}</Text>
    </View>
  );
}

export function ListRow({ title, subtitle, onPress, right, left }: { title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; left?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: S.md, borderBottomWidth: 1, borderBottomColor: '#F1EFEB', paddingVertical: S.sm, opacity: pressed ? 0.7 : 1 }]}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{title}</Text>
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

export const T = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '700', color: C.ink, letterSpacing: -0.3 } as TextStyle,
  h2: { fontSize: 18, fontWeight: '700', color: C.ink } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, color: C.ink2 } as TextStyle,
  muted: { fontSize: 13, color: C.muted } as TextStyle,
  small: { fontSize: 12, color: C.muted } as TextStyle,
  section: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: S.sm } as TextStyle,
  arabic: { fontSize: 24, lineHeight: 40, color: C.ink, textAlign: 'right', writingDirection: 'rtl' } as TextStyle,
});
