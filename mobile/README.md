# Proyecto Clima — app móvil

Expo SDK 57, React Native y TypeScript. Inicio y detalle con datos ficticios separados en src/data/demo-weather.ts.

Ver ../README.md para preparación de la terminal Windows, caché en D, ejecución con npm.cmd/npx.cmd y pruebas en Expo Go. Estado y pendientes en ../docs/PLAN.md.

Desde esta carpeta, con las dependencias ya instaladas:

    npm.cmd run typecheck
    npm.cmd start

El comando start prepara automáticamente el entorno de Expo y usa caché y temporales en .cache de la raíz. No hace falta pegar variables en cada terminal nueva.

Ubicación, búsqueda manual y condiciones actuales/pronóstico de 24 horas validados en Android. Primera evaluación experimental de viento >=40 km/h implementada, pendiente de prueba visual; no es una alerta oficial ni umbral local validado. En desarrollo, Probar con datos ficticios abre cuatro escenarios separados. Sin Firebase ni notificaciones. Ver docs/PLAN.md de la raíz para validaciones y pendientes.
