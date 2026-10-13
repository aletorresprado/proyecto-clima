# Proyecto Clima

App Android en React Native, Expo SDK 57 y TypeScript. App en `mobile`; contexto en `AGENTS.md` y `docs`.

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
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir .expo/export-check
```

La exportación comprueba el bundle, no genera una app publicable. En teléfono: confirmar inicio, desplazamiento, detalle y regreso con Atrás.

Las variables de caché y temporales se aplican solo a la terminal actual. Se usan en este equipo porque C no tenía espacio libre; no cambian la configuración global ni la política de scripts.

## Alcance actual

Inicio y detalle con clima explícitamente ficticio. Selección de ubicación: consulta puntual con permiso y confirmación, o lista manual de lugares de prueba. Búsqueda global y clima real pendientes. Sin Firebase, salud ni notificaciones. No usar estos ejemplos para decisiones meteorológicas. Sin servicios ni facturación configurados.
