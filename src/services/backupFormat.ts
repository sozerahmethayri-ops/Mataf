// Yedek dosyasının biçimi (saf; testlerde kullanılır).
export type Backup = { app: 'MATAF'; version: string; at: string; data: Record<string, string> };

/** Yedeğe girmeyen anahtarlar: ağ önbelleği, yarım oturumlar, çevrimdışı paket dizini. */
export const SKIP = (k: string) => k.startsWith('cache:') || k === 'tawaf:session' || k === 'say:session' || k.startsWith('offline:');

export function parseBackup(text: string): Backup {
  const b = JSON.parse(text) as Partial<Backup>;
  if (b.app !== 'MATAF' || !b.data || typeof b.data !== 'object') throw new Error('MATAF yedeği değil');
  for (const v of Object.values(b.data)) if (typeof v !== 'string') throw new Error('bozuk yedek');
  return b as Backup;
}
