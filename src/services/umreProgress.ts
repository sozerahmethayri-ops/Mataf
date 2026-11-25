// Umre ilerlemesi: hangi adımların bittiği cihazda saklanır. Tavaf ve sa'y ekranları bitince ilgili adımı işaretler;
// Umre rehberi ekranı öne geldiğinde yeniden okur.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UMRE_KEY = 'umre:progress';
export type UmreProgress = { done: string[]; at: number };

export async function readUmre(): Promise<UmreProgress> {
  try {
    const raw = await AsyncStorage.getItem(UMRE_KEY);
    if (raw) return { done: [], at: 0, ...(JSON.parse(raw) as Partial<UmreProgress>) };
  } catch { /* bozuk kayıt */ }
  return { done: [], at: 0 };
}
export async function writeUmre(p: UmreProgress) {
  await AsyncStorage.setItem(UMRE_KEY, JSON.stringify(p)).catch(() => undefined);
}
/** Adımı tamamlandı olarak işaretle (zaten işaretliyse dokunma). */
export async function markUmreStep(id: string) {
  const p = await readUmre();
  if (p.done.includes(id)) return;
  await writeUmre({ done: [...p.done, id], at: Date.now() });
}
