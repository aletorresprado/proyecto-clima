# Proyecto Clima

App Android para consultar el clima y organizar actividades con recomendaciones preventivas comprensibles. Desarrollada con React Native, Expo SDK 57 y TypeScript.

**Estado al 18 de octubre de 2026:** etapa 3 en curso. Condiciones actuales, pronóstico de 24 horas, viento, UV y precipitación validados funcionalmente en un teléfono Android 13 con Expo Go. Monitoreo de eventos sísmicos recientes integrado y probado con consultas reales y escenarios ficticios.

## Funciones disponibles

| Función | Alcance actual |
| --- | --- |
| Ubicación | Ubicación puntual con permiso y confirmación, o búsqueda manual de localidades con Open-Meteo/GeoNames. |
| Clima | Condiciones actuales estimadas y próximos 24 puntos horarios: temperatura en °C, viento en km/h y presión reducida al nivel del mar en hPa. Fuente, consulta y horarios visibles. |
| Viento | Recomendación experimental desde 40 km/h de viento previsto a 10 m. No evalúa ráfagas ni usa un umbral local calibrado. |
| Índice UV | Protección recomendada desde UV 3 y mensaje reforzado desde UV 8, con referencia de la OMS. |
| Precipitación | Criterio práctico propio desde 50 % de probabilidad. Porcentaje y cantidad en mm separados, con inicio y fin de cada intervalo horario completo futuro. |
| Sismos recientes | Eventos publicados por USGS de las últimas 24 horas, en un radio aproximado de 200 km alrededor del teléfono. Consulta cada 2 minutos tras completar el ciclo, solo con la app activa; controles para iniciar y detener. |
| Pruebas ficticias | Pantallas de desarrollo separadas para viento, UV, precipitación y repetición/persistencia de eventos sísmicos. |

Los datos meteorológicos son estimaciones de modelos. Las recomendaciones propias no son alertas oficiales. El monitoreo sísmico muestra eventos ya ocurridos con posibles demoras y revisiones: **no es predicción ni alerta temprana**. Una respuesta vacía no garantiza ausencia de actividad; los datos ausentes o vencidos significan información insuficiente.

## Organización

- [`mobile/`](mobile/): aplicación y scripts de arranque y pruebas.
- [`docs/PROYECTO.md`](docs/PROYECTO.md): acuerdos, fuentes, criterios y límites.
- [`docs/PLAN.md`](docs/PLAN.md): etapas, comprobaciones y siguiente paso.
- [`AGENTS.md`](AGENTS.md): instrucciones de colaboración y continuidad.

## Ejecutar en Windows / PowerShell

Con las dependencias ya instaladas, Node 24 LTS y Expo Go compatible con SDK 57:

```powershell
Set-Location 'D:\Trabajo-Ale\Proyecto-clima\mobile'
npm.cmd start
```

El lanzador scripts/start.cjs prepara automáticamente certificados de Windows, telemetría desactivada y caché/temporales en .cache del repositorio. Inicia Expo por LAN en puerto 8081. No instala dependencias ni cambia variables globales o la política de PowerShell. Cada terminal nueva puede usar el mismo comando.

### Solo para instalar dependencias en otra copia

```powershell
Set-Location mobile
$env:NODE_OPTIONS = '--use-system-ca'
$env:EXPO_NO_TELEMETRY = '1'
$env:npm_config_cache = 'D:\Trabajo-Ale\Proyecto-clima\.cache\npm'
$env:TEMP = 'D:\Trabajo-Ale\Proyecto-clima\.cache\tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
npm.cmd ci
npm.cmd start
```

`npm.cmd ci` instala el lockfile; solo hace falta al preparar otra copia o reinstalar dependencias. PC y teléfono deben estar en la misma red. Escanear el QR desde Expo Go o introducir la dirección exp:// del servidor. Ctrl+C lo detiene. No hace falta Android Studio para esta prueba.

Si la conexión necesita certificados de Windows: usar `$env:NODE_OPTIONS = '--use-system-ca'` en esa terminal antes de npm/npx; no deshabilitar HTTPS.

## Verificar

```powershell
npx.cmd tsc --noEmit
npm.cmd run test:locations
npm.cmd run test:weather
npm.cmd run test:wind
npm.cmd run test:uv
npm.cmd run test:precipitation
npm.cmd run test:earthquakes
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir .expo/export-check
```

Ejecutar desde `mobile`. Última entrega verificada: TypeScript, **47 pruebas automatizadas** y exportación Android correctos. Las pruebas cubren límites, unidades, datos ausentes, vencimiento, intervalos y persistencia/deduplicación de IDs.

La exportación comprueba el bundle, no genera una app publicable. En Android 13 se verificaron navegación, actualización y cambio de localidad, errores de conexión y recuperación, permisos y escenarios ficticios. La persistencia sísmica se probó con eventos ficticios aislados; no se verificó la recepción de un sismo real cercano.

Las variables de caché y temporales se aplican solo a la terminal actual. Se usan en este equipo porque C no tenía espacio libre; no cambian la configuración global ni la política de scripts.

## Uso de datos y privacidad

Antes de elegir un lugar se muestra una demo explícitamente ficticia. La búsqueda y consulta meteorológica requieren acciones del usuario; se informa el envío de texto o coordenadas al proveedor. El monitoreo sísmico se activa por separado y consulta la ubicación del teléfono en cada ciclo, independientemente de la localidad elegida para el clima. No usa seguimiento en segundo plano.

AsyncStorage guarda únicamente IDs sísmicos vistos para evitar repetir avisos; el historial ficticio usa otra clave. La app no persiste las coordenadas ni recopila datos de salud. No hay Firebase, autenticación, push, servicios de nube ni facturación configurados.

Fuentes: [Open-Meteo](https://open-meteo.com/en/docs), [Open-Meteo/GeoNames](https://open-meteo.com/en/docs/geocoding-api), [USGS](https://earthquake.usgs.gov/fdsnws/event/1/), [OMS para UV](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index) y [NWS como referencia descriptiva de viento](https://www.weather.gov/tbw/beaufort). Uso inicial no comercial de Open-Meteo, con atribución CC BY 4.0; revisar condiciones antes de monetizar.

## Próximos pasos

Quedan por definir los criterios de **visibilidad** y **tendencia de presión** de la etapa 3. Firebase, perfil de salud opcional, notificaciones con la app cerrada y publicación en Google Play pertenecen a etapas posteriores. Revisar también los hallazgos de auditoría de dependencias registrados en el plan antes de distribuir.
