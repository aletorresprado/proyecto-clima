# Proyecto Clima — app móvil

Expo SDK 57, React Native y TypeScript. Inicio y detalle con datos ficticios separados en src/data/demo-weather.ts.

Ver ../README.md para preparación de la terminal Windows, caché en D, ejecución con npm.cmd/npx.cmd y pruebas en Expo Go. Estado y pendientes en ../docs/PLAN.md.

Desde esta carpeta, con las dependencias ya instaladas:

    npm.cmd run typecheck
    npm.cmd start

El comando start prepara automáticamente el entorno de Expo y usa caché y temporales en .cache de la raíz. No hace falta pegar variables en cada terminal nueva.

Hay ubicación puntual con permiso, nombre sugerido y confirmación, y búsqueda manual real con Open-Meteo/GeoNames, ya probadas en Android. Consultar clima obtiene condiciones actuales estimadas por modelos (temperatura, viento y presión al nivel del mar), con fuente y horas locales. Consulta meteorológica pendiente de prueba en teléfono; la compilación local no la sustituye. Sin reglas de riesgo, pronóstico horario, Firebase ni notificaciones.
