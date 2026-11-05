const conditions: Record<number, [string, string]> = {
  0: ['Despejado', '☀️'], 1: ['Mayormente despejado', '🌤️'], 2: ['Parcialmente nublado', '⛅'], 3: ['Cubierto', '☁️'],
  45: ['Niebla', '🌫️'], 48: ['Niebla con depósito de escarcha', '🌫️'],
  51: ['Llovizna leve', '🌦️'], 53: ['Llovizna moderada', '🌦️'], 55: ['Llovizna intensa', '🌧️'],
  56: ['Llovizna engelante leve', '🌧️'], 57: ['Llovizna engelante intensa', '🌧️'],
  61: ['Lluvia leve', '🌧️'], 63: ['Lluvia moderada', '🌧️'], 65: ['Lluvia intensa', '🌧️'],
  66: ['Lluvia engelante leve', '🌧️'], 67: ['Lluvia engelante intensa', '🌧️'],
  71: ['Nevada leve', '🌨️'], 73: ['Nevada moderada', '🌨️'], 75: ['Nevada intensa', '🌨️'], 77: ['Granos de nieve', '🌨️'],
  80: ['Chaparrones leves', '🌧️'], 81: ['Chaparrones moderados', '🌧️'], 82: ['Chaparrones intensos', '🌧️'],
  85: ['Chaparrones de nieve leves', '🌨️'], 86: ['Chaparrones de nieve intensos', '🌨️'],
  95: ['Tormenta prevista por el modelo', '⛈️'], 96: ['Tormenta con granizo leve prevista por el modelo', '⛈️'],
  97: ['Tormenta intensa prevista por el modelo', '⛈️'], 99: ['Tormenta con granizo intenso prevista por el modelo', '⛈️'],
};
export function weatherCode(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && Object.hasOwn(conditions, value) ? value : null;
}
export function daylight(value: unknown): boolean | null { return value === 1 ? true : value === 0 ? false : null; }
export function describeWeather(code: unknown, isDay?: boolean | null) {
  const valid = weatherCode(code);
  if (valid === null) return { label: 'Estado no disponible', icon: '◌' };
  const [label, original] = conditions[valid];
  const icon = valid <= 2 && isDay !== true ? (isDay === false ? (valid <= 1 ? '🌙' : '☁️') : '◌') : original;
  return { label, icon };
}
