// Resimli sahnenin kara katmanı (400 × 360 birimlik çizim; zemin çizgisi y = 283, altı meydan):
// uzak dağlar, şehir silueti ve meydan. Renkler gün saatine göre ScenePalette'ten gelir; gece pencereler,
// kemerler ve minare şerefeleri yanar.
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { mix } from '@/constants/theme';
import type { SceneKind, ScenePalette } from '@/services/skyScene';

export const VBW = 400;
export const VBH = 360;
export const GROUND = 283;

const GOLD = '#D4AF37';
const LAMP = '#FFD98A';

/** Gece yapı rengini karart (gündüz rengi korunur). */
const nightOf = (p: ScenePalette, c: string, k = 0.85) => mix(c, p.shade, p.dark * k);

/** Yukarı bakan hilal (minare ve kule alemi). */
function Crescent({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return <Path d={`M${x - r} ${y} A${r} ${r} 0 0 0 ${x + r} ${y} A${r * 0.78} ${r * 0.78} 0 0 1 ${x - r} ${y} Z`} fill={fill} />;
}

/** Kemer dizisi: gündüz gölge, gece sıcak ışık. */
function Arches({ x0, x1, y, h, w, gap, p }: { x0: number; x1: number; y: number; h: number; w: number; gap: number; p: ScenePalette }) {
  const fill = mix(mix(p.shade, p.wall, 0.15), LAMP, p.lights * 0.9);
  const out: string[] = [];
  for (let x = x0; x + w <= x1; x += w + gap) out.push(`M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`);
  return <Path d={out.join('')} fill={fill} />;
}

/** Gece yanan pencere noktaları (dikdörtgen alan içinde ızgara). */
function Windows({ x0, x1, y0, y1, dx, dy, p, seed = 1 }: { x0: number; x1: number; y0: number; y1: number; dx: number; dy: number; p: ScenePalette; seed?: number }) {
  if (p.lights < 0.05) return null;
  const out: string[] = [];
  let k = seed;
  for (let y = y0; y <= y1; y += dy) for (let x = x0; x <= x1; x += dx) {
    k = (k * 9301 + 49297) % 233280;
    if (k / 233280 < 0.62) out.push(`M${x} ${y}h1.6v1.4h-1.6Z`);
  }
  return <Path d={out.join('')} fill={LAMP} opacity={p.lights * 0.85} />;
}

/** İnce minare: gövde, şerefeler, külah ya da küçük kubbe, alem. */
function Minaret({ cx, top, base, w = 5.2, balconies, cap, p }: { cx: number; top: number; base: number; w?: number; balconies: number[]; cap: 'cone' | 'bulb' | 'pencil'; p: ScenePalette }) {
  const half = w / 2;
  const capColor = cap === 'pencil' ? nightOf(p, '#8E9BB0') : mix(p.wall, GOLD, 0.18);
  return (
    <G>
      <Rect x={cx - half} y={top + 14} width={w} height={base - top - 14} fill={p.wall} />
      <Rect x={cx + half * 0.2} y={top + 14} width={half * 0.8} height={base - top - 14} fill={p.shade} opacity={0.55} />
      {balconies.map((b) => (
        <G key={b}>
          <Rect x={cx - half - 1.8} y={b} width={w + 3.6} height={2.4} fill={p.shade} />
          {p.lights > 0.05 && <Circle cx={cx} cy={b - 1.2} r={1.5} fill="#E8FFF0" opacity={p.lights} />}
        </G>
      ))}
      {cap === 'bulb' ? (
        <G>
          <Rect x={cx - half * 0.8} y={top + 7} width={w * 0.8} height={8} fill={p.wall} />
          <Path d={`M${cx - 3.4} ${top + 8}A3.4 3.8 0 0 1 ${cx + 3.4} ${top + 8}Z`} fill={capColor} />
          <Line x1={cx} y1={top + 4} x2={cx} y2={top - 1} stroke={nightOf(p, GOLD, 0.5)} strokeWidth={0.8} />
        </G>
      ) : (
        <Polygon points={`${cx - half - 0.3},${top + 14} ${cx},${top - (cap === 'pencil' ? 8 : 4)} ${cx + half + 0.3},${top + 14}`} fill={capColor} />
      )}
      <Crescent x={cx} y={top - (cap === 'pencil' ? 9 : cap === 'bulb' ? 2 : 5)} r={1.9} fill={nightOf(p, GOLD, 0.5)} />
    </G>
  );
}

// Matâf'taki kalabalık (yerinde duran doku; üstünde hareket eden noktalar SkyScene'de)
const CROWD_DOTS = (() => {
  const out: { x: number; y: number; r: number; c: number }[] = [];
  let k = 29;
  const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 150; i++) {
    const a = rnd() * Math.PI * 2, rr = 0.36 + Math.sqrt(rnd()) * 0.64;
    out.push({ x: 142 + 66 * rr * Math.cos(a), y: 307 + 15.5 * rr * Math.sin(a), r: 0.75 + rnd() * 0.6, c: Math.floor(rnd() * 10) });
  }
  return out;
})();
const CROWD_COLORS = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#F3EEE4', '#FFFFFF', '#B9AE9E', '#8E877E', '#6A645D', '#FFFFFF', '#D8CDBD'];

// ── Mekke: kayalık dağlar, oteller, Saat Kulesi, Mescid-i Haram'ın kemerleri ve minareleri, Kâbe ──
function Makkah({ p }: { p: ScenePalette }) {
  const tower = mix(p.shade, p.far2, 0.35);
  const clockFace = mix('#F8F5EC', '#FFFFFF', p.lights);
  const clockGlow = p.lights;
  return (
    <G>
      <Path d="M0 236L18 226L30 231L52 210L70 222L88 214L104 196L122 212L140 206L160 218L178 204L196 214L214 200L236 216L258 206L276 220L300 208L322 218L344 198L366 214L384 206L400 214V283H0Z" fill={p.far} />
      <Path d="M0 252L22 240L44 248L66 234L90 246L112 238L134 250L156 242L180 252L204 244L228 254L252 242L276 250L300 240L324 252L348 244L372 252L400 242V283H0Z" fill={p.far2} />
      {/* Arkadaki oteller */}
      {[[14, 20, 226], [38, 14, 238], [214, 18, 224], [234, 14, 234], [352, 22, 222], [378, 18, 232]].map(([x, w, y]) => (
        <G key={x}>
          <Rect x={x} y={y} width={w} height={GROUND - y} fill={tower} />
          <Windows x0={x + 3} x1={x + w - 4} y0={y + 5} y1={GROUND - 30} dx={5} dy={6} p={p} seed={x} />
        </G>
      ))}
      {/* Saat Kulesi (Ebrâcü'l-Beyt) */}
      <Rect x={250} y={238} width={100} height={45} fill={p.wall} />
      <Rect x={328} y={238} width={22} height={45} fill={p.shade} />
      <Windows x0={254} x1={344} y0={244} y1={262} dx={6} dy={7} p={p} seed={7} />
      <Rect x={258} y={186} width={22} height={52} fill={p.wall} />
      <Polygon points="258,186 269,173 280,186" fill={p.wall} />
      <Rect x={320} y={192} width={22} height={46} fill={p.shade} />
      <Polygon points="320,192 331,180 342,192" fill={p.shade} />
      <Windows x0={261} x1={276} y0={192} y1={230} dx={5} dy={7} p={p} seed={3} />
      <Windows x0={323} x1={338} y0={198} y1={230} dx={5} dy={7} p={p} seed={5} />
      <Rect x={284} y={164} width={32} height={74} fill={p.wall} />
      <Rect x={304} y={164} width={12} height={74} fill={p.shade} />
      <Windows x0={288} x1={311} y0={170} y1={228} dx={6} dy={8} p={p} seed={11} />
      <Rect x={281} y={134} width={38} height={31} fill={p.wall} />
      <Rect x={306} y={134} width={13} height={31} fill={p.shade} />
      {clockGlow > 0.05 && <Circle cx={300} cy={149.5} r={17} fill="#E3FFEE" opacity={clockGlow * 0.35} />}
      <Circle cx={300} cy={149.5} r={11.5} fill={clockFace} stroke={nightOf(p, GOLD, 0.4)} strokeWidth={1.6} />
      <Line x1={300} y1={149.5} x2={300} y2={141.5} stroke="#2A2A2A" strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={300} y1={149.5} x2={305.5} y2={152} stroke="#2A2A2A" strokeWidth={1.3} strokeLinecap="round" />
      <Polygon points="283,134 290,120 310,120 317,134" fill={p.wall} />
      <Polygon points="303,120 310,120 317,134 306,134" fill={p.shade} />
      <Rect x={295} y={106} width={10} height={14} fill={mix(p.wall, GOLD, 0.25)} />
      {p.lights > 0.05 && <Rect x={296} y={109} width={8} height={8} fill="#C8FFD9" opacity={p.lights * 0.9} />}
      <Polygon points="296.5,106 300,80 303.5,106" fill={mix(p.wall, GOLD, 0.35)} />
      <Crescent x={300} y={77} r={4.6} fill={nightOf(p, GOLD, 0.4)} />
      {/* Mescid-i Haram: kemerler ve minareler */}
      <Rect x={-10} y={252} width={262} height={31} fill={p.wall} />
      <Rect x={-10} y={252} width={262} height={3.5} fill={p.shade} />
      <Arches x0={-4} x1={250} y={260} h={23} w={8} gap={5.2} p={p} />
      <Rect x={348} y={252} width={62} height={31} fill={p.wall} />
      <Rect x={348} y={252} width={62} height={3.5} fill={p.shade} />
      <Arches x0={352} x1={404} y={260} h={23} w={8} gap={5.2} p={p} />
      <Minaret cx={34} top={178} base={252} balconies={[204, 226]} cap="cone" p={p} />
      <Minaret cx={82} top={168} base={252} balconies={[196, 222]} cap="cone" p={p} />
      <Minaret cx={196} top={170} base={252} balconies={[198, 224]} cap="cone" p={p} />
      <Minaret cx={236} top={180} base={252} balconies={[206, 228]} cap="cone" p={p} />
      <Minaret cx={372} top={184} base={252} balconies={[208, 230]} cap="cone" p={p} />
      {/* Meydan ve Matâf (beyaz mermer, gece aydınlık) */}
      <Rect x={-10} y={GROUND} width={420} height={VBH - GROUND + 10} fill={mix(p.ground, '#EDE7DA', p.lights * 0.45)} />
      <Ellipse cx={142} cy={307} rx={96} ry={21} fill={mix(mix(p.ground, '#FFFFFF', 0.4), '#F4F0E8', p.lights * 0.6)} />
      <Ellipse cx={142} cy={307} rx={70} ry={16.5} fill={mix(p.ground, '#D9CFBF', 0.5)} opacity={0.35} />
      {CROWD_DOTS.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={CROWD_COLORS[d.c]} />)}
    </G>
  );
}

/** Kâbe (sahnede ayrı katman: tavaf edenler önünden ve arkasından geçer). Merkez (142, 307). */
export function Kaaba({ p }: { p: ScenePalette }) {
  const gold = mix('#C9A227', '#F2D675', p.lights * 0.5);
  return (
    <G>
      <Polygon points="126,281 134,276.5 158,276.5 150,281" fill="#2C2C30" />
      <Rect x={126} y={281} width={24} height={26} fill="#1B1B1E" />
      <Polygon points="150,281 158,276.5 158,302 150,307" fill="#0E0E10" />
      <Rect x={126} y={285.5} width={24} height={3.2} fill={gold} />
      <Polygon points="150,285.5 158,281 158,284.2 150,288.7" fill={mix(gold, '#000000', 0.25)} />
      <Rect x={141.5} y={293} width={5} height={10.5} fill={gold} opacity={0.9} />
      <Rect x={125} y={305.5} width={26} height={2.6} fill="#D9D3C6" />
      <Polygon points="150,305.5 159,300.5 159,303 151,308.1" fill="#BDB6A8" />
    </G>
  );
}

// ── Medine: Uhud, hurmalar, Mescid-i Nebevî (Yeşil Kubbe, minareler), avludaki şemsiyeler ──
function Palm({ x, h, lean, p }: { x: number; h: number; lean: number; p: ScenePalette }) {
  const leaf = nightOf(p, '#4E7D3A', 0.9);
  const leaf2 = nightOf(p, '#3E6A2F', 0.9);
  const trunk = nightOf(p, '#8A6847', 0.9);
  const tx = x + lean, ty = GROUND + 30 - h;
  const fronds = [[-26, 8], [-20, -6], [-8, -14], [8, -14], [20, -6], [26, 8], [-14, 14], [14, 14]];
  return (
    <G>
      <Path d={`M${x - 2.4} ${GROUND + 40}Q${x + lean * 0.3} ${ty + h * 0.5} ${tx - 1.2} ${ty}L${tx + 1.2} ${ty}Q${x + lean * 0.3 + 3} ${ty + h * 0.5} ${x + 2.4} ${GROUND + 40}Z`} fill={trunk} />
      {fronds.map(([dx, dy], i) => (
        <Path key={i} d={`M${tx} ${ty}Q${tx + dx * 0.5} ${ty + dy - 6} ${tx + dx} ${ty + dy}Q${tx + dx * 0.55} ${ty + dy * 0.4 + 2} ${tx} ${ty + 1.5}Z`} fill={i % 2 ? leaf2 : leaf} />
      ))}
      <Circle cx={tx} cy={ty + 2} r={2.4} fill={nightOf(p, '#B5742F', 0.9)} />
    </G>
  );
}

function Umbrella({ x, open, p }: { x: number; open: boolean; p: ScenePalette }) {
  const cloth = nightOf(p, '#FBF8F2', 0.8);
  const under = nightOf(p, '#D8CFC1', 0.8);
  const pole = nightOf(p, '#BDB4A6', 0.8);
  return (
    <G>
      <Rect x={x - 0.9} y={289} width={1.8} height={30} fill={pole} />
      {open ? (
        <G>
          <Path d={`M${x - 21} 298Q${x - 11} 290 ${x} 288Q${x + 11} 290 ${x + 21} 298Z`} fill={cloth} />
          <Path d={`M${x - 21} 298Q${x - 15.5} 300.5 ${x - 10.5} 298Q${x - 5.2} 300.5 ${x} 298Q${x + 5.2} 300.5 ${x + 10.5} 298Q${x + 15.5} 300.5 ${x + 21} 298Z`} fill={under} />
        </G>
      ) : (
        <Path d={`M${x} 286L${x + 2.6} 304L${x - 2.6} 304Z`} fill={cloth} />
      )}
    </G>
  );
}

function Madinah({ p, open }: { p: ScenePalette; open: boolean }) {
  const uhud = mix(p.far, '#C77B5B', 0.3 * (1 - p.dark));
  const green = mix('#2F8F5B', '#163F2A', p.dark * 0.55);
  const rib = mix('#58B784', '#2A6B47', p.dark * 0.6);
  const silver = nightOf(p, '#C9CED6', 0.8);
  return (
    <G>
      <Path d="M0 240C30 232 50 214 80 210C104 206 118 220 140 214C162 208 176 196 200 200C226 204 240 222 268 224C300 226 330 214 360 218C380 221 392 228 400 230V283H0Z" fill={uhud} />
      <Path d="M0 256C40 248 70 252 100 246C140 238 170 252 210 250C250 248 280 240 320 246C350 250 380 246 400 250V283H0Z" fill={p.far2} />
      <Palm x={150} h={88} lean={-6} p={{ ...p, dark: Math.min(1, p.dark + 0.15) }} />
      <Palm x={258} h={84} lean={5} p={{ ...p, dark: Math.min(1, p.dark + 0.15) }} />
      {/* Cephe */}
      <Rect x={-10} y={250} width={420} height={33} fill={p.wall} />
      <Rect x={-10} y={250} width={420} height={3.5} fill={p.shade} />
      <Arches x0={-6} x1={406} y={259} h={24} w={8} gap={5.4} p={p} />
      {/* Gümüş kubbeler */}
      <Path d="M138 250A12 10 0 0 1 162 250Z" fill={silver} />
      <Path d="M238 250A12 10 0 0 1 262 250Z" fill={silver} />
      {/* Yeşil Kubbe */}
      <Rect x={184} y={222} width={32} height={28} fill={p.shade} />
      <Rect x={182} y={219.5} width={36} height={3.5} fill={p.wall} />
      {p.lights > 0.05 && <Ellipse cx={200} cy={204} rx={26} ry={24} fill="#7DFFB0" opacity={p.lights * 0.18} />}
      <Path d="M183 220C183 199 194 189 200 181C206 189 217 199 217 220Z" fill={green} />
      <Path d="M191 220C191 203 196 192 200 183M209 220C209 203 204 192 200 183M200 220V183" stroke={rib} strokeWidth={1} fill="none" />
      <Line x1={200} y1={181} x2={200} y2={171} stroke={nightOf(p, GOLD, 0.4)} strokeWidth={1.1} />
      <Circle cx={200} cy={175} r={1.8} fill={nightOf(p, GOLD, 0.4)} />
      <Crescent x={200} y={169} r={2.4} fill={nightOf(p, GOLD, 0.4)} />
      {/* Minareler */}
      <Minaret cx={50} top={164} base={250} w={6} balconies={[190, 214, 236]} cap="bulb" p={p} />
      <Minaret cx={116} top={150} base={250} w={6} balconies={[178, 204, 230]} cap="bulb" p={p} />
      <Minaret cx={284} top={150} base={250} w={6} balconies={[178, 204, 230]} cap="bulb" p={p} />
      <Minaret cx={350} top={164} base={250} w={6} balconies={[190, 214, 236]} cap="bulb" p={p} />
      {/* Avlu ve şemsiyeler (gündüz açık, gece kapalı) */}
      <Rect x={-10} y={GROUND} width={420} height={VBH - GROUND + 10} fill={mix(p.ground, '#EDE7DA', p.lights * 0.4)} />
      {[34, 80, 126, 274, 320, 366].map((x) => <Umbrella key={x} x={x} open={open} p={p} />)}
      <Palm x={6} h={102} lean={4} p={p} />
      <Palm x={396} h={96} lean={-5} p={p} />
    </G>
  );
}

// ── Başka yerler: tepeler, servi ağaçları, kiremit çatılı evler ve kurşun kubbeli bir cami ──
function House({ x, w, h, p }: { x: number; w: number; h: number; p: ScenePalette }) {
  const wall = nightOf(p, '#EBCFA6');
  const roof = nightOf(p, '#C2623C');
  return (
    <G>
      <Rect x={x} y={GROUND - h} width={w} height={h} fill={wall} />
      <Polygon points={`${x - 2},${GROUND - h} ${x + w / 2},${GROUND - h - 9} ${x + w + 2},${GROUND - h}`} fill={roof} />
      <Rect x={x + w * 0.28} y={GROUND - h + 6} width={3.4} height={4.4} fill={p.lights > 0.05 ? LAMP : nightOf(p, '#9A7A58')} opacity={p.lights > 0.05 ? 0.5 + p.lights * 0.5 : 0.8} />
      <Rect x={x + w * 0.62} y={GROUND - h + 6} width={3.4} height={4.4} fill={p.lights > 0.05 ? LAMP : nightOf(p, '#9A7A58')} opacity={p.lights > 0.05 ? 0.5 + p.lights * 0.5 : 0.8} />
    </G>
  );
}

function Cypress({ x, h, p }: { x: number; h: number; p: ScenePalette }) {
  return <Path d={`M${x} ${GROUND}C${x - 6.5} ${GROUND - h * 0.3} ${x - 4.5} ${GROUND - h * 0.75} ${x} ${GROUND - h}C${x + 4.5} ${GROUND - h * 0.75} ${x + 6.5} ${GROUND - h * 0.3} ${x} ${GROUND}Z`} fill={nightOf(p, '#3F6A3E', 0.9)} />;
}

function Mosque({ p }: { p: ScenePalette }) {
  const lead = nightOf(p, '#8E9BB0');
  const leadDark = nightOf(p, '#75839A');
  const gold = nightOf(p, GOLD, 0.4);
  return (
    <G>
      <Path d="M0 238C40 222 80 226 120 232C160 238 190 220 230 218C270 216 300 230 340 228C370 226 390 222 400 224V283H0Z" fill={p.far} />
      <Path d="M0 258C50 246 90 254 140 252C190 250 220 244 260 246C300 248 340 256 400 248V283H0Z" fill={p.far2} />
      {/* Avlu duvarı, revaklar ve küçük kubbeler */}
      <Rect x={86} y={262} width={228} height={21} fill={p.wall} />
      <Arches x0={90} x1={150} y={267} h={16} w={6} gap={4.5} p={p} />
      <Arches x0={252} x1={312} y={267} h={16} w={6} gap={4.5} p={p} />
      {[104, 126, 274, 296].map((x) => <Path key={x} d={`M${x - 8} 262A8 6.5 0 0 1 ${x + 8} 262Z`} fill={lead} />)}
      {/* Ana yapı, yarım kubbeler, kasnak ve büyük kubbe */}
      <Rect x={150} y={236} width={100} height={47} fill={p.wall} />
      <Rect x={228} y={236} width={22} height={47} fill={p.shade} />
      <Arches x0={156} x1={226} y={250} h={20} w={7} gap={6} p={p} />
      <Path d="M150 238A20 16 0 0 1 190 238Z" fill={leadDark} />
      <Path d="M210 238A20 16 0 0 1 250 238Z" fill={leadDark} />
      <Rect x={174} y={212} width={52} height={26} fill={p.wall} />
      <Rect x={210} y={212} width={16} height={26} fill={p.shade} />
      <Arches x0={178} x1={224} y={220} h={12} w={5} gap={4.2} p={p} />
      <Path d="M170 213.5A30 27 0 0 1 230 213.5Z" fill={lead} />
      <Path d="M200 186.5A30 27 0 0 1 230 213.5H214A16 23 0 0 0 200 186.5Z" fill={leadDark} opacity={0.6} />
      <Line x1={200} y1={186.5} x2={200} y2={176} stroke={gold} strokeWidth={1.2} />
      <Circle cx={200} cy={180} r={1.8} fill={gold} />
      <Crescent x={200} y={174} r={2.6} fill={gold} />
      {/* Kalem minareler */}
      <Minaret cx={140} top={150} base={GROUND} w={5} balconies={[180, 204, 228]} cap="pencil" p={p} />
      <Minaret cx={260} top={150} base={GROUND} w={5} balconies={[180, 204, 228]} cap="pencil" p={p} />
      <Minaret cx={94} top={176} base={GROUND} w={4.6} balconies={[204, 228]} cap="pencil" p={p} />
      <Minaret cx={306} top={176} base={GROUND} w={4.6} balconies={[204, 228]} cap="pencil" p={p} />
      {/* Evler ve serviler */}
      <House x={2} w={24} h={22} p={p} />
      <House x={30} w={20} h={17} p={p} />
      <Cypress x={60} h={58} p={p} />
      <Cypress x={72} h={44} p={p} />
      <Cypress x={330} h={54} p={p} />
      <Cypress x={342} h={40} p={p} />
      <House x={352} w={22} h={19} p={p} />
      <House x={377} w={24} h={24} p={p} />
      <Rect x={-10} y={GROUND} width={420} height={VBH - GROUND + 10} fill={p.ground} />
    </G>
  );
}

/** Kara katmanı: dağlar, siluet ve zemin. open: Medine'de şemsiyeler açık mı (gündüz). */
export function Land({ kind, p, open }: { kind: SceneKind; p: ScenePalette; open: boolean }) {
  if (kind === 'makkah') return <Makkah p={p} />;
  if (kind === 'madinah') return <Madinah p={p} open={open} />;
  return <Mosque p={p} />;
}
