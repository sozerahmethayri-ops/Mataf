import type { PlainArea, PlainLine, PlainLL, PlainPin } from './PlainMap';

export type OnlineMapProps = {
  pins: PlainPin[];
  lines?: PlainLine[];
  /** Dolgulu alanlar (çerçevelemeye katılmaz). */
  areas?: PlainArea[];
  user?: PlainLL | null;
  selectedId?: string;
  onPin?: (id: string) => void;
  onLongPress?: (p: PlainLL) => void;
  /** Hiç nokta yokken gösterilecek merkez. */
  center?: PlainLL;
  /** Üstte/altta haritayı örten paneller (px): çerçeveleme ve düğmeler bunlara göre yapılır. */
  padding?: { top: number; bottom: number; left: number; right: number };
  /** Değişince harita noktaları + çizgileri kapsayacak şekilde yeniden çerçevelenir. */
  fitKey?: string;
  /** Verilirse çerçeveleme noktalar yerine bunlara göre yapılır. */
  fitTo?: PlainLL[];
  /** Çerçevelemeye kullanıcının konumunu da kat. */
  fitUser?: boolean;
  /** Verilirse 2D/3D dışarıdan yönetilir; yoksa haritanın kendi düğmesi kullanılır. */
  threeD?: boolean;
  /** Değişince haritayı konuma götür. */
  recenterKey?: number;
  /** Sağ üstteki 2D/3D ve konum düğmeleri (varsayılan: açık). */
  controls?: boolean;
  /** Dışarıdaki +/− düğmelerinin toplam adımı (+1 yaklaş, −1 uzaklaş; harita farkı uygular). */
  zoomLevel?: number;
};
