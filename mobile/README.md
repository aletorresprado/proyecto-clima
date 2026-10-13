# Proyecto Clima — app móvil

Expo SDK 57, React Native y TypeScript. Inicio y detalle con datos ficticios separados en src/data/demo-weather.ts.

Ver ../README.md para preparación de la terminal Windows, caché en D, ejecución con npm.cmd/npx.cmd y pruebas en Expo Go. Estado y pendientes en ../docs/PLAN.md.

Desde esta carpeta, con las dependencias ya instaladas:

    npm.cmd run typecheck
    npm.cmd start

El comando start prepara automáticamente el entorno de Expo y usa caché y temporales en .cache de la raíz. No hace falta pegar variables en cada terminal nueva.

Hay consulta puntual de ubicación con permiso y confirmación, y lista manual de prueba. No hay API meteorológica, Firebase ni notificaciones. Inicio/detalle ya validados; el nuevo flujo de ubicación requiere prueba en Android, que la compilación local no sustituye.
