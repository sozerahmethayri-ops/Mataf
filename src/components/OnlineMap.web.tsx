// Web önizlemesinde online harita yerine sade harita kullanılır (WebView yok).
import { PlainMap } from './PlainMap';
import type { OnlineMapProps } from './OnlineMap.types';

export function OnlineMap({ pins, lines, user, selectedId, onPin, onLongPress, center }: OnlineMapProps) {
  return <PlainMap pins={pins} lines={lines} user={user} selectedId={selectedId} onPin={onPin} onLongPress={onLongPress} center={center} />;
}
