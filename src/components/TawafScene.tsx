import { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { C } from '@/constants/theme';
import type { ML, Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { placeLabels, textWidth, type Box } from '@/scene/layout';
import { buildTawafView } from '@/scene/tawafScene';
import type { ZoneId } from '@/services/tawaf';
import { Prims } from './SvgPrims';

const LABELS: { id: string; text: ML; tone?: 'green' | 'gold' }[] = [
  { id: 'aswad', text: { tr: 'Hacerü’l-Esved', en: 'Black Stone', ar: 'الحجر الأسود' } },
  { id: 'yamani', text: { tr: 'Rükn-i Yemânî', en: 'Yemeni Corner', ar: 'الركن اليماني' } },
  { id: 'iraqi', text: { tr: 'Rükn-i Irâkî', en: 'Iraqi Corner', ar: 'الركن العراقي' } },
  { id: 'shami', text: { tr: 'Rükn-i Şâmî', en: 'Shami Corner', ar: 'الركن الشامي' } },
  { id: 'start', text: { tr: 'Başlangıç', en: 'Start line', ar: 'خط البداية' }, tone: 'green' },
  { id: 'hijr', text: { tr: 'Hatîm', en: 'Hatim', ar: 'الحِجر' } },
  { id: 'door', text: { tr: 'Kapı · Mültezem', en: 'Door · Multazam', ar: 'الباب · الملتزم' } },
  { id: 'maqam', text: { tr: 'Makam-ı İbrâhîm', en: 'Maqam Ibrahim', ar: 'مقام إبراهيم' }, tone: 'gold' },
];

export function TawafScene({
  width, height, viewerBearing, user, acc, radius, progress, zone, demo,
}: {
  width: number; height: number; viewerBearing: number;
  user?: Pt; acc?: number; radius: number; progress?: number; zone?: ZoneId; demo?: boolean;
}) {
  const { lang } = useI18n();
  const userR = user ? Math.hypot(user[0], user[1]) : radius;
  const view = useMemo(
    () => buildTawafView({ width, height, viewerBearing, radius: Math.max(radius, userR), progress, userR: radius, zone }),
    [width, height, viewerBearing, radius, userR, progress, zone],
  );
  const { cam } = view;
  const u = user ? cam.P(user[0], user[1], 0) : undefined;
  // Etiketler kullanıcı noktasına ve Kâbe'nin gövdesine binmesin
  const fixed: Box[] = [view.kaabaBox, ...(u ? [{ x: u[0] - 18, y: u[1] - 18, w: 36, h: 36 }] : [])];
  const placed = placeLabels(
    LABELS.filter((l) => view.anchors[l.id]).map((l) => {
      const [x, y] = view.anchors[l.id];
      return { id: l.id, ax: x, ay: y, w: textWidth(pick(l.text, lang), 10.5) + 14, h: 20, gap: 4 };
    }),
    fixed, width, height, { top: 4, bottom: 4, left: 2, right: 2 },
  );

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: C.mapGround }} accessibilityLabel="3D tavaf görünümü">
      <Svg width={width} height={height}>
        <Prims prims={view.prims} />
        {u && acc ? (
          <Ellipse cx={u[0]} cy={u[1]} rx={Math.min(width, acc * cam.k)} ry={Math.min(height, acc * cam.k * 0.58)} fill="rgba(37,99,235,0.10)" stroke="rgba(37,99,235,0.35)" strokeWidth={1} />
        ) : null}
      </Svg>
      {LABELS.map((l) => {
        const b = placed[l.id];
        if (!b) return null;
        const bg = l.tone === 'green' ? C.green : l.tone === 'gold' ? '#FFF7DB' : C.overlay;
        const fg = l.tone === 'green' ? '#FFFFFF' : l.tone === 'gold' ? '#7A5B00' : C.ink2;
        return (
          <View key={l.id} pointerEvents="none" style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '700', color: fg }}>{pick(l.text, lang)}</Text>
          </View>
        );
      })}
      {u && (
        <View pointerEvents="none" style={{ position: 'absolute', left: u[0] - 18, top: u[1] - 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37,99,235,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: demo ? '#7A8396' : C.user, borderWidth: 3, borderColor: '#FFFFFF' }} />
        </View>
      )}
    </View>
  );
}
