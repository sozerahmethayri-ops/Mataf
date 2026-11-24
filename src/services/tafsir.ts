// Ayet tefsiri: spa5k/tafsir_api (jsDelivr üzerinden statik JSON). Cihazda 180 gün saklanır.
import { cachedJson } from './cache';

const BASE = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

/** HTML etiketlerini ve fazla boşlukları temizler. */
export function cleanTafsir(t: string) {
  return t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export async function getTafsir(slug: string, surah: number, ayah: number): Promise<string> {
  const r = await cachedJson<{ text: string }>(`tafsir:${slug}:${surah}:${ayah}`, `${BASE}/${slug}/${surah}/${ayah}.json`, 180 * 24 * 3600e3);
  return cleanTafsir(r.data.text ?? '');
}
