// Gradle'ın bellek ayarı: Compose/Glance (ana ekran küçük uygulaması) eklenince dex birleştirme
// varsayılan 2 GB'ta "Java heap space" hatasıyla düşebiliyor. android/ klasörü her derlemede yeniden
// üretildiği için ayar buradan (prebuild sırasında) gradle.properties'e yazılır.
const { withGradleProperties } = require('expo/config-plugins');

const DEFAULT = '-Xmx6g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8';

module.exports = function withGradleMemory(config, props = {}) {
  const jvmargs = props.jvmargs || DEFAULT;
  return withGradleProperties(config, (c) => {
    const list = c.modResults;
    const item = { type: 'property', key: 'org.gradle.jvmargs', value: jvmargs };
    const i = list.findIndex((p) => p.type === 'property' && p.key === 'org.gradle.jvmargs');
    if (i >= 0) list[i] = item;
    else list.push(item);
    return c;
  });
};
