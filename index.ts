// Uygulamanın girişi: önce expo-router, sonra uygulama kapalıyken de tanımlı olması gereken arka plan görevi.
// Android'de bildirimdeki "Kıldım"a dokununca expo-task-manager JS'i görünmeden yükler; ekranlar o zaman kurulmaz,
// görev ancak buradan yüklenirse bulunur (src/services/prayedTask.android.ts). Başka kurulum buraya eklenmez.
import 'expo-router/entry';

import './src/services/prayedTask';
