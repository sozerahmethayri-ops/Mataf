// app.json'a ek: Google Haritalar anahtarı (isteğe bağlı) GOOGLE_MAPS_API_KEY ortam değişkeninden gelir.
// Anahtar yoksa Android derlemesi yerel harita yerine sade haritayı kullanır (src/services/nativeMaps.ts).
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return config;
  return {
    ...config,
    android: { ...config.android, config: { ...(config.android?.config ?? {}), googleMaps: { apiKey: key } } },
  };
};
