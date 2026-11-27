// Web ve iOS: arka plan görevi yok. "Kıldım" uygulamayı açar, yanıtı AdhanHost işler (bkz. prayedTask.android.ts).
export * from './prayedTask.types';

export const prayedInBackground = () => false;

export async function registerPrayedTask() {
  return false;
}
