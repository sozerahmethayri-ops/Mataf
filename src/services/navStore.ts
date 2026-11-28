// Navigasyon ekranına (/rota) seçilen toplu taşıma tarifinin aktarılması: tarif büyük, adres satırına konmaz.
import type { Itinerary } from './transport';

let active: Itinerary | null = null;
export const setNavItinerary = (it: Itinerary | null) => { active = it; };
export const getNavItinerary = () => active;
