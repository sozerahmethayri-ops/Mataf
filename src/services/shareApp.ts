// "Uygulamayı paylaş": arkadaşlara WhatsApp vb. ile gönderilecek kısa metin (Android APK + iPhone web sürümü).
import { Share } from 'react-native';

export const APK_URL = 'https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/mataf.apk';
export const WEB_URL = 'https://sozerahmethayri-ops.github.io/Mataf/';

export function shareAppText(lang: 'tr' | 'en' | 'ar') {
  if (lang === 'en') return `MATAF: prayer times, Quran, qibla and an Umrah–Hajj guide for Makkah and Madinah.\n\nAndroid (install the file): ${APK_URL}\niPhone (open in Safari → Add to Home Screen): ${WEB_URL}`;
  if (lang === 'ar') return `مطاف: مواقيت الصلاة والقرآن والقبلة ودليل العمرة والحج لمكة والمدينة.\n\nأندرويد: ${APK_URL}\nآيفون (افتح في سفاري ثم «إضافة إلى الشاشة الرئيسية»): ${WEB_URL}`;
  return `MATAF: namaz vakitleri, Kur’an, kıble ve Mekke–Medine için umre-hac rehberi.\n\nAndroid (dosyayı indirip kurun): ${APK_URL}\niPhone (Safari’de açıp “Ana Ekrana Ekle”): ${WEB_URL}`;
}

export const shareApp = (lang: 'tr' | 'en' | 'ar') => Share.share({ message: shareAppText(lang) }).catch(() => undefined);
