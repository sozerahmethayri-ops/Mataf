/** "0.10.0" > "0.9.3" gibi sürüm karşılaştırması (sayısal parçalar). */
export function newer(remote: string, local: string) {
  const a = remote.split('.').map((x) => parseInt(x, 10) || 0);
  const b = local.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}
