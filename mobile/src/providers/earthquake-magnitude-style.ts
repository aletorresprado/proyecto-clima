// Escala visual propia: no clasifica daños, intensidad sentida ni alerta oficial.
export function magnitudeStyle(value: number | null) {
  if (value === null || !Number.isFinite(value)) return { backgroundColor: '#52616B', range: 'Magnitud no informada' };
  if (value > 6) return { backgroundColor: '#A72632', range: 'Magnitud mayor de 6' };
  if (value >= 3) return { backgroundColor: '#954500', range: 'Magnitud entre 3 y 6 inclusive' };
  return { backgroundColor: '#163F57', range: 'Magnitud menor de 3' };
}
