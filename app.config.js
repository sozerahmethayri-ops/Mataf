// app.json'a ek: Google Haritalar anahtarı (isteğe bağlı) GOOGLE_MAPS_API_KEY ortam değişkeninden gelir.
// Anahtar yoksa Android derlemesi yerel harita yerine sade haritayı kullanır (src/services/nativeMaps.ts).
// WEB_BASE_URL (ör. /Mataf): web sürümü GitHub Pages'te alt klasörde yayınlanırken.
module.exports = ({ config: base }) => {
  const webBase = process.env.WEB_BASE_URL;
  const config = webBase ? { ...base, experiments: { ...(base.experiments ?? {}), baseUrl: webBase } } : base;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return config;
  return {
    ...config,
    android: { ...config.android, config: { ...(config.android?.config ?? {}), googleMaps: { apiKey: key } } },
  };
};
