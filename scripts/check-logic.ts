// Hızlı mantık kontrolü: npx tsx scripts/check-logic.ts
import { planRoute } from '../src/services/routing';
import { summarize, type Report, type GateStatus } from '../src/services/reports';
import { DEMO_START } from '../src/data/sites';

const now = Date.now();
const r = (gateId: string, status: GateStatus, user: string, minsAgo: number, official = false): Report =>
  ({ id: `${gateId}-${user}-${minsAgo}`, gateId, kind: 'report', status, userId: user, userName: user, official, createdAt: now - minsAgo * 60000 });

let fails = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };

// Bildirim kuralları
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'b', 5)], 'g').status === 'open', '2 kişi yetmez → varsayılan açık');
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'b', 5), r('g', 'closed', 'c', 5)], 'g').status === 'closed', '3 farklı kişi → kapalı');
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'a', 6), r('g', 'closed', 'a', 7)], 'g').status === 'open', 'aynı kişi 3 kez → sayılmaz');
ok(summarize([r('g', 'closed', 'a', 130), r('g', 'closed', 'b', 130), r('g', 'closed', 'c', 130)], 'g').status === 'open', '2 saatten eski → düşer');
ok(summarize([r('g', 'closed', 'off', 60, true)], 'g').status === 'closed', 'resmî kapalı → kapalı');
ok(summarize([r('g', 'closed', 'off', 60, true), r('g', 'open', 'a', 1), r('g', 'open', 'b', 1), r('g', 'open', 'c', 1)], 'g').status === 'open', 'resmî kapalı + 3 kişi açıldı → açık');

// Rota: kapı 79 kapalıysa başka kapı seçilmeli
const all = () => 'open' as GateStatus;
const p1 = planRoute('makkah', DEMO_START.makkah, 'mataf', all)!;
ok(p1.gate?.id === 'mk-79', `batıdan Mataf'a en kısa kapı 79 (seçilen: ${p1.gate?.id}, ${Math.round(p1.lengthM)} m)`);
const p2 = planRoute('makkah', DEMO_START.makkah, 'mataf', (id) => (id === 'mk-79' ? 'closed' : 'open'))!;
ok(!!p2.gate && p2.gate.id !== 'mk-79', `79 kapalı → yeni kapı ${p2.gate?.id} (${Math.round(p2.lengthM)} m)`);
const p3 = planRoute('madinah', DEMO_START.madinah, 'rawdah', all)!;
ok(p3.lengthM > 300 && p3.lengthM < 1500, `Medine kuzeyden Ravza girişine ${Math.round(p3.lengthM)} m`);

process.exit(fails ? 1 : 0);
