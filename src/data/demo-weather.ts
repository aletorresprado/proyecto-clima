// Valores inventados para probar la interfaz; no son observaciones ni pronósticos.
export const demoWeather = {
  place: 'Yerba Buena, Tucumán',
  temperatureC: 24,
  condition: 'Parcialmente nublado (ficticio)',
  windKmh: 18,
  seaLevelPressureHpa: 1013,
  source: 'Escenario ficticio local, sin proveedor meteorológico',
  updated: '9 de octubre de 2026, 09:00 ART (UTC−3)',
  notice: {
    title: 'Viento durante la tarde',
    validity: 'Vigencia ficticia: 9 de octubre de 2026, 14:00–18:00 ART (UTC−3)',
    reason: 'El escenario de prueba incluye ráfagas ficticias de 45 km/h. No se evaluó una regla ni un umbral validado.',
    action: 'Ejemplo de acción sugerida: asegurá los objetos sueltos del exterior.',
  },
} as const;
