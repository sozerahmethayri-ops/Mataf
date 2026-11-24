// MATAF görsel dili: beyaz ağırlıklı zemin, turuncu rota, erişilebilir kontrast.
export const C = {
  bg: '#FFFFFF',
  surface: '#F5F5F3',
  border: '#ECEAE6',
  borderStrong: '#E2E0DC',
  ink: '#17181C',
  ink2: '#2E3036',
  muted: '#5E636E',
  route: '#F26A1B', // harita üzerindeki turuncu iz
  accent: '#C2410C', // beyaz yazılı düğmeler (WCAG AA)
  accentTint: '#FFF1E8',
  accentSoft: '#FFF6F0',
  closed: '#B42318',
  closedTint: '#FEECEB',
  limited: '#92400E',
  limitedFill: '#F5A524',
  limitedTint: '#FEF3C7',
  open: '#0F766E',
  openTint: '#E6F4F1',
  user: '#2563EB',
  userTint: '#EEF3FE',
  green: '#2F8F57',
  greenDark: '#1E5A38',
  greenTint: '#EEF7F1',
  gold: '#C9A227',
  mapGround: '#EFECE6',
} as const;

export const R = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const shadow = {
  shadowColor: '#17181C',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
} as const;
