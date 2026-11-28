// Ulaşım yığın ekranı (0.25.0): /ulasim?to=enlem,boylam&name=… (haritadaki "Nasıl giderim", caminin "Yol tarifi")
// alt sekmede Ulaşım olmasa da açılır; geri düğmesiyle.
import Transport from '@/screens/Transport';

export default function TransportStack() {
  return <Transport back />;
}
