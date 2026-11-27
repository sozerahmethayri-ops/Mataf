// Hatim planı kaydı (yoksa null): ana sayfa kartı, Kur'an listesi ve Hatim planı ekranı aynı kopyayı görür.
import { PLAN_KEY, cleanPlan, type HatimPlan } from './hatim';
import { sharedPersisted } from './sharedPersisted';

export const useHatimPlan = sharedPersisted<HatimPlan | null>(PLAN_KEY, null, cleanPlan);
