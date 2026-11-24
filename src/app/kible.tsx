import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Header, Screen, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useHeading, useLocation } from '@/services/location';
import { haversine } from '@/services/osm';
import { qiblaDeg } from '@/services/prayer';

export default function Qibla() {
  const { t } = useI18n();
  const { fix, denied } = useLocation();
  const heading = useHeading();
  const q = fix ? qiblaDeg(fix.lat, fix.lng) : null;
  const rel = q != null && heading != null ? (q - heading + 360) % 360 : null;
  const aligned = rel != null && (rel < 5 || rel > 355);
  const km = fix ? Math.round(haversine({ lat: fix.lat, lng: fix.lng }, { lat: 21.42252, lng: 39.82621 }) / 1000) : null;

  return (
    <Screen>
      <Header back title={t('qibla.title')} subtitle={q != null ? t('qibla.dir', { d: Math.round(q) }) : denied ? 'Konum izni gerekli' : '…'} />
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Svg width={300} height={300} viewBox="0 0 300 300">
          <G rotation={heading != null ? -heading : 0} origin="150, 150">
            <Circle cx={150} cy={150} r={140} fill={C.bg} stroke={C.borderStrong} strokeWidth={2} />
            {['K', 'D', 'G', 'B'].map((l, i) => (
              <SvgText key={l} x={150 + 118 * Math.sin((i * Math.PI) / 2)} y={156 - 118 * Math.cos((i * Math.PI) / 2)} fontSize={16} fontWeight="700" fill={i === 0 ? C.accent : C.muted} textAnchor="middle">{l}</SvgText>
            ))}
            {q != null && (
              <G rotation={q} origin="150, 150">
                <Path d="M150 30 L164 150 L136 150 Z" fill={aligned ? C.open : C.accent} />
                <Path d="M150 270 L136 150 L164 150 Z" fill="#C9CCD2" />
              </G>
            )}
          </G>
          <Path d="M150 4 L158 20 L142 20 Z" fill={C.ink} />
          <Circle cx={150} cy={150} r={10} fill={C.ink} />
        </Svg>
      </View>
      <Text style={[T.h2, { textAlign: 'center', color: aligned ? C.open : C.ink }]}>
        {heading == null ? t('qibla.noSensor') : aligned ? t('qibla.aligned') : t('qibla.turn')}
      </Text>
      {km != null && <Text style={[T.muted, { textAlign: 'center' }]}>Kâbe’ye uzaklık: {km.toLocaleString()} km</Text>}
      <Text style={[T.small, { textAlign: 'center' }]}>Pusulayı kalibre etmek için telefonu havada 8 çizerek hareket ettirin. Metal ve mıknatıslardan uzak tutun.</Text>
    </Screen>
  );
}
