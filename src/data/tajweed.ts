// Tecvid kuralları: renkli Kur'an'daki her rengin adı, tanımı ve örneği (örnekler tecvidli metnin işaretlemesiyle
// yazılır, aynı çizimle renklenir). Tanımlar klasik tecvidin yaygın tanımlarıdır; renk kategorileri alquran.cloud
// "quran-tajweed" baskısınındır. Henüz bir ilahiyatçı kontrolünden geçmedi.
import type { RuleId } from '@/services/tajweed';

type ML = { tr: string; en: string; ar: string };
export type TajweedRule = { id: RuleId; light: string; dark: string; name: ML; desc: ML; example: string; letters?: string };
const t = (tr: string, en: string, ar: string): ML => ({ tr, en, ar });

/** Sayfadaki sıra: genizden okunanlar, idğamlar, kalkale, medler, okunmayanlar */
export const TAJWEED_RULES: TajweedRule[] = [
  { id: 'g', light: '#C75C0A', dark: '#FFA552', name: t('Ğunne', 'Ghunnah', 'الغنة'),
    desc: t('Şeddeli nun (نّ) ve şeddeli mim (مّ) genizden, iki hareke miktarı okunur.', 'A doubled nūn (نّ) or mīm (مّ) is read through the nose for two counts.', 'تُنطق النون والميم المشددتان بغنة مقدار حركتين.'),
    example: 'إِ[g[نَّ] ٱللَّهَ' },
  { id: 'f', light: '#8A1FA6', dark: '#D08CF0', name: t('İhfâ', 'Ikhfāʾ', 'الإخفاء'),
    desc: t('Sakin nun ya da tenvinden sonra ihfâ harflerinden biri gelirse nun açık okunmaz; gizlenerek genizden okunur.', 'When a silent nūn or tanwīn is followed by one of these letters, the nūn is hidden and read nasally.', 'إذا جاء بعد النون الساكنة أو التنوين أحد حروف الإخفاء أُخفيت النون مع الغنة.'),
    letters: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك', example: 'مِ[f[نْ] قَبْلِ' },
  { id: 'c', light: '#B5179E', dark: '#F57AE0', name: t('İhfâ-i şefevî', 'Ikhfāʾ shafawī', 'الإخفاء الشفوي'),
    desc: t('Sakin mimden sonra be (ب) gelirse mim, dudaklar hafifçe kapanarak genizden okunur.', 'A silent mīm followed by bāʾ (ب) is hidden, with the lips lightly closed and a nasal sound.', 'إذا جاء بعد الميم الساكنة باء أُخفيت الميم مع الغنة.'),
    letters: 'ب', example: 'تَرْمِيهِ[c[مْ] بِحِجَارَةٍ' },
  { id: 'i', light: '#0E7FB0', dark: '#5CCBF5', name: t('İklâb', 'Iqlāb', 'الإقلاب'),
    desc: t('Sakin nun ya da tenvinden sonra be (ب) gelirse nun mime çevrilir ve genizden okunur.', 'A silent nūn or tanwīn followed by bāʾ (ب) turns into a mīm, read nasally.', 'إذا جاء بعد النون الساكنة أو التنوين باء قُلبت النون ميمًا مع الغنة.'),
    letters: 'ب', example: 'مِ[i[نْ] بَعْدِ' },
  { id: 'a', light: '#13856B', dark: '#3FC4A0', name: t('İdğâm-ı maal-ğunne', 'Idghām with ghunnah', 'الإدغام بغنة'),
    desc: t('Sakin nun ya da tenvinden sonra, ayrı kelimede ي ن م و harflerinden biri gelirse nun sonraki harfe katılır ve genizden okunur.', 'When a silent nūn or tanwīn is followed in the next word by ي ن م و, it merges into it with a nasal sound.', 'إذا جاء بعد النون الساكنة أو التنوين في كلمة أخرى أحد حروف «ينمو» أُدغمت بغنة.'),
    letters: 'ي ن م و', example: 'مَ[a[نْ] يَقُولُ' },
  { id: 'u', light: '#2E7D32', dark: '#7BD67F', name: t('İdğâm-ı bilâ-ğunne', 'Idghām without ghunnah', 'الإدغام بلا غنة'),
    desc: t('Sakin nun ya da tenvinden sonra lâm (ل) ya da ra (ر) gelirse nun, ğunnesiz olarak sonraki harfe katılır.', 'A silent nūn or tanwīn followed by lām (ل) or rāʾ (ر) merges into it without a nasal sound.', 'إذا جاء بعد النون الساكنة أو التنوين لام أو راء أُدغمت بلا غنة.'),
    letters: 'ل ر', example: 'مِ[u[نْ] رَبِّهِمْ' },
  { id: 'w', light: '#5B8C00', dark: '#A6D94F', name: t('İdğâm-ı şefevî', 'Idghām shafawī', 'الإدغام الشفوي'),
    desc: t('Sakin mimden sonra mim gelirse iki mim birleşir ve genizden okunur (idğâm-ı misleyn).', 'A silent mīm followed by another mīm merges into it with a nasal sound.', 'إذا جاء بعد الميم الساكنة ميم أُدغمتا مع الغنة (إدغام المثلين).'),
    letters: 'م', example: 'لَهُ[w[مْ] مَا' },
  { id: 'd', light: '#6E7B8B', dark: '#9AA7B6', name: t('İdğâm-ı mütecâniseyn', 'Idghām mutajānisayn', 'إدغام المتجانسين'),
    desc: t('Çıkış yeri aynı, sıfatları farklı iki harf yan yana gelince (ör. د ile ت, ت ile ط, ذ ile ظ) birincisi ikincisine katılır.', 'Two letters from the same point of articulation but with different qualities (e.g. د and ت) meet; the first merges into the second.', 'إذا التقى حرفان اتحدا مخرجًا واختلفا صفةً (كالدال والتاء) أُدغم الأول في الثاني.'),
    example: 'قَ[d[دْ] تَبَيَّنَ' },
  { id: 'b', light: '#6E7B8B', dark: '#9AA7B6', name: t('İdğâm-ı mütekâribeyn', 'Idghām mutaqāribayn', 'إدغام المتقاربين'),
    desc: t('Çıkış yerleri ve sıfatları yakın iki harf yan yana gelince (ل ile ر, ق ile ك) birincisi ikincisine katılır.', 'Two letters close in articulation and qualities (ل and ر, ق and ك) meet; the first merges into the second.', 'إذا التقى حرفان تقاربا مخرجًا وصفةً (كاللام والراء) أُدغم الأول في الثاني.'),
    example: 'قُ[b[لْ] رَبِّ' },
  { id: 'q', light: '#C8102E', dark: '#FF6B6B', name: t('Kalkale', 'Qalqalah', 'القلقلة'),
    desc: t('ق ط ب ج د harfleri sakin olunca ya da durakta kısa bir yankıyla (sarsıntıyla) okunur.', 'The letters ق ط ب ج د, when silent or at a stop, are read with a short echo.', 'حروف «قطب جد» إذا سكنت أو وُقف عليها تُنطق بنبرة قوية.'),
    letters: 'ق ط ب ج د', example: 'يَ[q[قْ]طَعُونَ' },
  { id: 'n', light: '#2F6FE0', dark: '#7FA6FF', name: t('Med-i tabîî', 'Natural madd', 'المد الطبيعي'),
    desc: t('Med harfleri (ا و ي) önceki harfin harekesine uygun gelince bir elif, yani iki hareke uzatılır.', 'The long vowels ا و ي are stretched for two counts.', 'تُمد حروف المد (ا و ي) مقدار حركتين.'),
    example: 'قَ[n[ا]لَ' },
  { id: 'p', light: '#4A3FD6', dark: '#9E97FF', name: t('Caiz med', 'Permissible madd', 'المد الجائز'),
    desc: t('Med ya da lîn harfinden sonra durakta (vakıfta) sükûn gelirse 2, 4 ya da 6 hareke uzatılabilir (med-i ârız, med-i lîn).', 'When a stop brings a sukūn after a madd or līn letter, it may be stretched 2, 4 or 6 counts.', 'إذا جاء بعد حرف المد أو اللين سكون عارض للوقف جاز مده حركتين أو أربعًا أو ستًا.'),
    example: 'ٱلْعَٰلَمِ[p[ي]نَ' },
  { id: 'o', light: '#1F3AA8', dark: '#6F8CFF', name: t('Vâcip med', 'Obligatory madd', 'المد الواجب'),
    desc: t('Med harfinden sonra hemze gelirse 4–5 hareke uzatılır; aynı kelimede olunca vâciptir (med-i muttasıl).', 'When a hamzah follows a madd letter it is stretched 4–5 counts; within the same word this is obligatory.', 'إذا جاء بعد حرف المد همز مُدّ أربع أو خمس حركات، ويجب إذا كان في كلمة واحدة (المد المتصل).'),
    example: 'جَ[o[ا]ءَ' },
  { id: 'm', light: '#0B1E8A', dark: '#B3C1FF', name: t('Med-i lâzım', 'Necessary madd', 'المد اللازم'),
    desc: t('Med harfinden sonra aslî sükûn ya da şedde gelirse 6 hareke uzatılır.', 'When an original sukūn or a shaddah follows a madd letter, it is stretched six counts.', 'إذا جاء بعد حرف المد سكون أصلي أو شدة مُدّ ست حركات.'),
    example: 'ٱلضَّ[m[ا]لِّينَ' },
  { id: 'h', light: '#8A8A8A', dark: '#A8A8A8', name: t('Hemze-i vasl', 'Hamzat al-waṣl', 'همزة الوصل'),
    desc: t('Kelime başındaki ٱ, önceki kelimeye bağlanarak okununca okunmaz.', 'The ٱ at the start of a word is silent when joined to the previous word.', 'لا تُنطق الهمزة ٱ في أول الكلمة عند الوصل.'),
    example: 'بِسْمِ [h[ٱ]للَّهِ' },
  { id: 'l', light: '#8A8A8A', dark: '#A8A8A8', name: t('Lâm-ı şemsiyye', 'Sun lām', 'اللام الشمسية'),
    desc: t('Harf-i tarifin (ال) lâmı şemsî harflerden önce okunmaz; sonraki harf şeddeli okunur.', 'The lām of al- is silent before the “sun” letters; the next letter is doubled.', 'لا تُنطق لام «ال» قبل الحروف الشمسية، ويُشدد الحرف الذي بعدها.'),
    example: '[h[ٱ][l[ل]رَّحْمَٰنِ' },
  { id: 's', light: '#8A8A8A', dark: '#A8A8A8', name: t('Okunmayan harf', 'Silent letter', 'حرف لا يُنطق'),
    desc: t('Yazıda bulunup okunmayan harfler; ör. çoğul vavından sonraki elif.', 'Letters that are written but not pronounced, such as the alif after a plural wāw.', 'حروف تُكتب ولا تُنطق، كالألف بعد واو الجماعة.'),
    example: 'قَالُو[s[ا]' },
];

/** Renklendirilmeyen ama bilinmesi gereken kurallar */
export const OTHER_RULES: { name: ML; desc: ML; example: string }[] = [
  { name: t('İzhar', 'Iẓhār', 'الإظهار'),
    desc: t('Sakin nun ya da tenvinden sonra boğaz harfleri (ء ه ع ح غ خ) gelirse nun açık okunur.', 'A silent nūn or tanwīn before the throat letters (ء ه ع ح غ خ) is pronounced clearly.', 'إذا جاء بعد النون الساكنة أو التنوين حرف من حروف الحلق أُظهرت النون.'),
    example: 'مَنْ ءَامَنَ' },
  { name: t('İzhar-ı şefevî', 'Iẓhār shafawī', 'الإظهار الشفوي'),
    desc: t('Sakin mimden sonra ب ve م dışında bir harf gelirse mim açık okunur.', 'A silent mīm before any letter other than ب and م is pronounced clearly.', 'إذا جاء بعد الميم الساكنة حرف غير الباء والميم أُظهرت.'),
    example: 'لَهُمْ فِيهَا' },
  { name: t('Ra’nın okunuşu', 'The letter rāʾ', 'تفخيم الراء وترقيقها'),
    desc: t('Ra (ر) üstünlü ya da ötreli olunca kalın, esreli olunca ince okunur; sakin olunca önceki harfin harekesine bakılır.', 'Rāʾ is heavy with fatḥah or ḍammah and light with kasrah; when silent, the vowel before it decides.', 'تُفخم الراء المفتوحة والمضمومة وتُرقق المكسورة، والساكنة بحسب ما قبلها.'),
    example: 'رَبِّ · رِجَالٌ' },
  { name: t('Lafzatullah', 'The name Allah', 'لفظ الجلالة'),
    desc: t('Allah lafzının lâmı, öncesi üstün ya da ötre olunca kalın; esre olunca ince okunur.', 'The lām in “Allāh” is heavy after fatḥah or ḍammah, light after kasrah.', 'تُفخم لام لفظ الجلالة بعد الفتح والضم، وتُرقق بعد الكسر.'),
    example: 'قَالَ ٱللَّهُ · بِسْمِ ٱللَّهِ' },
];

const BY_ID = new Map(TAJWEED_RULES.map((r) => [r.id, r]));
/** Kuralın rengi (açık / koyu tema) */
export const ruleColor = (id: RuleId, dark: boolean) => {
  const r = BY_ID.get(id);
  return r ? (dark ? r.dark : r.light) : undefined;
};
