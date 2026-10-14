# Plan de desarrollo — Proyecto Clima

Fecha: 2026-10-09.
Estado actualizado al 2026-10-14: etapas 0, 1 y 2 completadas. Etapa 3 en curso: primera entrega experimental de viento validada en Android 13, incluyendo tarjeta real, cuatro escenarios ficticios, regreso y actualización/cambio de lugar sin duplicados. Otros módulos y criterios pendientes.
Este plan es una propuesta de ejecución incremental. Las funciones pendientes no son compromisos ya implementados.

## Etapa 0 — Revisar entorno y confirmar arranque
- Leer AGENTS.md y docs/PROYECTO.md.
- Inspeccionar la carpeta elegida sin sobrescribir archivos existentes.
- Identificar Windows/WSL, Node.js, gestor de paquetes, Git y dispositivos Android disponibles.
- Proponer una ruta consistente de desarrollo; evitar mezclar instalaciones Windows y WSL.
- Verificar versiones estables de Expo y compatibilidad de Firebase.
- Explicar instalaciones y comandos antes de ejecutarlos.
- Acordar dónde crear el proyecto y cómo se probará en un teléfono.
Resultado: entorno y comandos concretos; sin activar facturación ni servicios.
Estado: completada. Entorno y ruta acordados, Node/npm verificados y Expo Go utilizado con éxito en Android 13. Versión exacta de Expo Go pendiente de registrar.

### Resultado de la revisión
- Carpeta actual: solo AGENTS.md y docs; sin app ni carpeta .git visible.
- Windows 11 Home Single Language, 64 bits; PowerShell y VS Code disponibles.
- Inicialmente: Node.js 20.19.5, npm 11.4.1 y Git 2.55.0.windows.5. Actualización posterior verificada: Node v24.20.0 y npm 11.4.1 en C:\Program Files\nodejs.
- WSL tiene Ubuntu; acordado: desarrollar íntegramente en Windows con PowerShell y npm, sin mezclar herramientas de WSL.
- No se localizaron adb ni Java en PATH, ni Android Studio/SDK en sus rutas habituales. Esto no descarta instalaciones en otras rutas. No se pudo comprobar un teléfono conectado ni la memoria disponible.
- Documentación oficial consultada: Expo SDK 57 requiere Node 22.13.x como mínimo; Node 24.20.0 instalado satisface ese requisito.
- Firebase JS SDK admite Auth y Firestore en Expo Go; la guía actual requiere firebase >=12. React Native Firebase y Google Sign-In nativo necesitan development build. La elección de SDK sigue pendiente.
- Propuesta de arranque: teléfono Android con Expo Go para la app mínima con datos ficticios; Android Studio y compilación propia cuando se necesiten módulos nativos o emulador.
- Ubicación acordada: subcarpeta mobile dentro del repositorio, preservando AGENTS.md y docs en la raíz. No se creó.
- Comandos futuros, NO ejecutados: `npx create-expo-app@latest mobile` (crea archivos y descarga dependencias), `Set-Location mobile` (cambia carpeta), `npx expo start` (inicia servidor local; abrir QR desde Expo Go). Revisar plantilla/SDK compatibles antes de ejecutarlos.
- Se actualizó únicamente Node; no se instalaron dependencias del proyecto, inicializó código, crearon servicios ni activó facturación.
- Referencias: https://docs.expo.dev/versions/latest/ ; https://docs.expo.dev/get-started/create-a-project/ ; https://docs.expo.dev/get-started/set-up-your-environment/ ; https://docs.expo.dev/guides/using-firebase/ ; https://docs.expo.dev/guides/google-authentication/ ; https://nodejs.org/en/about/previous-releases

### Actualización de Node y preparación del teléfono
- Verificación adicional: https://nodejs.org/en/blog/release/v24.20.0 confirma 24.20.0 Krypton como LTS. Node vuelve a responder v24.20.0.
- Diferencia inicial detectada en npm: el MSI incluye npm 11.19.0, pero los lanzadores priorizaban npm 11.4.1 del perfil. Resuelta mediante el renombrado autorizado descrito abajo; versión efectiva actual de npm.cmd y npx.cmd: 11.19.0.
- En la sesión restringida, npm --version encuentra npm.ps1 bloqueado por la política de scripts; npm.cmd --version funciona sin modificar dicha política.
- Revisión de resolución: node → C:\Program Files\nodejs\node.exe; npm → C:\Program Files\nodejs\npm.ps1; npm.cmd → C:\Program Files\nodejs\npm.cmd. También existen lanzadores npm/npx en C:\Users\Alejandro\AppData\Roaming\npm. El PATH ya prioriza Program Files; el lanzador redirige al npm del prefijo global del perfil (11.4.1).
- Alternativa mínima verificada en un proceso nuevo de PowerShell sin perfil: `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' --version` y CLI npx equivalente responden 11.19.0; node responde v24.20.0. npm.cmd y npx.cmd siguen respondiendo 11.4.1; no se alteró resolución permanente.
- Cambio autorizado y ejecutado el 2026-10-09: renombrada únicamente C:\Users\Alejandro\AppData\Roaming\npm\node_modules\npm a npm.backup-11.4.1 dentro del mismo directorio, tras comprobar que el destino no existía. Copia reversible conservada; otros paquetes globales sin modificar; PATH y política de scripts sin cambios.
- Validación en nuevo proceso PowerShell -NoProfile -NonInteractive: node --version → v24.20.0; npm.cmd --version → 11.19.0; npx.cmd --version → 11.19.0. Todos finalizaron correctamente y coincidieron con las versiones esperadas; no fue necesario restaurar. Se preparó restauración automática ante fallo. Usar npm.cmd y npx.cmd para evitar el bloqueo de scripts .ps1.
- Instalación anterior: MSI registrado en Windows, directorio sin enlace simbólico. No se encontraron comandos ni variables de NVM, fnm, Volta o NVS; evidencia compatible con instalación directa, sin gestor de versiones detectado.
- Método ejecutado: `winget install --id OpenJS.NodeJS.LTS --version 24.20.0 --exact --source winget --silent --accept-package-agreements --accept-source-agreements`. Winget descargó el MSI oficial de nodejs.org, verificó su hash y terminó con instalación correcta.
- El catálogo ofrecía 24.20.0; la web de Node anunciaba 24.21.0. Se eligió explícitamente la versión 24 LTS disponible en winget, sin seguir automáticamente otra rama.
- Validación posterior en un nuevo proceso: `node --version` → v24.20.0; `npm --version` → 11.4.1; rutas de ambos en C:\Program Files\nodejs. Si una terminal anterior conserva el entorno viejo, abrir una nueva.
- https://expo.dev/go identifica SDK 57 como versión actual. La plantilla oficial `default` incluye TypeScript y Expo Router: propuesta para el arranque con Expo Go compatible con SDK 57. Referencia: https://docs.expo.dev/more/create-expo/
- Teléfono de prueba: Android 13 confirmado por el usuario; cumple el mínimo Android 7 documentado para SDK 57. Pendientes: modelo y versión instalada/disponible de Expo Go; todavía no se verificó ejecución en el dispositivo real.
- No se ejecutó create-expo-app ni se creó mobile. Al crear posteriormente, revisar `--no-agents-md` para conservar las instrucciones propias y evitar configuración adicional para otras herramientas.

## Etapa 1 — Crear app mínima
- Inicializar Expo + TypeScript, preservando estos documentos.
- Configurar navegación y estructura modular mínima.
- Crear inicio con tarjetas usando datos ficticios claramente identificados.
- Añadir README con instalación, ejecución y limitaciones.
- Configurar Git e ignorados sin subir credenciales.
Validación: app abre en Android; comprobación de tipos y navegación.
Estado: completada el 2026-10-13. Usuario confirma arranque con npm.cmd start, acceso desde Android 13, desplazamiento, apertura del detalle y regreso con Atrás. Tipos, compatibilidad y bundle Android comprobados previamente. La revisión de auditoría permanece pendiente antes de distribución.

### Registro del arranque
- Validación final del 2026-10-13: usuario confirma que funcionan los tres pasos de prueba en Android 13: desplazamiento, enlace Ver motivo y fuente y regreso con Atrás. También confirma acceso tras npm.cmd start. Etapa 1 cerrada; datos siguen siendo ficticios. Versión exacta de Expo Go pendiente como dato de entorno, sin bloquear este cierre.
- 2026-10-13: arranque simplificado autorizado e implementado: npm.cmd start desde mobile ejecuta scripts/start.cjs. Prepara certificados de Windows, EXPO_NO_TELEMETRY, caché y temporales relativos a .cache de la raíz solo para el proceso de Expo; preserva NODE_OPTIONS existentes. Sin dependencias nuevas, cambios globales, PATH ni política de scripts.
- Validación del lanzador: npm.cmd start ejecutado en nuevo proceso PowerShell sin perfil ni bloque manual de variables; Metro inició por LAN en puerto 8081 y /status respondió packager-status:running. Servidor dejado abierto para prueba; dirección anunciada exp://192.168.0.108:8081. README de raíz/mobile actualizados. Esta comprobación valida el arranque, no cierra la prueba pendiente de navegación en teléfono.
- Plantilla publicada verificada con npm view: default 57.0.29, Expo ~57.0.27; Expo Go oficial anuncia SDK 57. Generador create-expo-app 5.0.0, opción --no-agents-md para preservar instrucciones propias.
- App creada en mobile; inicio con temperatura, viento, presión reducida al nivel del mar y aviso ficticio; detalle con motivo, lugar, vigencia, fuente, actualización y acción. Datos separados en src/data/demo-weather.ts. Sin GPS, Firebase, API ni reglas operativas.
- README de raíz con ejecución y verificación; documentos de raíz conservados.
- Git generado en mobile trasladado a la raíz tras comprobar destino libre, para incluir documentación y app en el mismo historial. Sin remotos ni publicación. El entorno restringido reporta distinta propiedad al consultar Git; no se agregó excepción global.
- Primer npm install falló: ENOSPC, C sin espacio libre; D con 124,74 GB libres. Reintento usando caché .cache/npm y temporales .cache/tmp en D, solo mediante variables de proceso. No se borraron archivos ni cambió configuración global.
- Reintento de npm install completado: dependencias y package-lock.json generados. TypeScript (tsc --noEmit) pasó tras agregar declaraciones CSS para ejemplos web; expo install --check confirmó dependencias actualizadas. Exportación Android correcta: 1242 módulos, bundle Hermes y recursos generados en .expo/export-check; no equivale a prueba visual en dispositivo.
- Metro iniciado por LAN en puerto 8081, dirección anunciada exp://192.168.0.108:8081. Sesión de servidor activa al registrar este resultado; si se cierra, reiniciar según README. El usuario debe confirmar en Expo Go: inicio, desplazamiento, detalle y regreso con Atrás. Sin confirmación todavía; etapa 1 sigue en curso.
- Salud de Metro comprobada en http://127.0.0.1:8081/status: packager-status:running. Sin errores nuevos en registros; no hay confirmación de conexión del teléfono todavía.
- Cierre del 2026-10-09: el usuario confirma que ve Proyecto Clima en el teléfono Android 13. Apertura del inicio validada; detalle, regreso con Atrás y versión de Expo Go aún no confirmados. Trabajo detenido por pedido del usuario; Metro se detiene al cerrar la sesión.
- npm audit: 29 hallazgos (11 moderados, 18 altos), incluyendo árbol de herramientas. Informe local en .cache/npm-audit.json; propuestas automáticas implican cambios incompatibles de SDK. Sin audit fix --force; pendiente revisar avisos y correcciones compatibles antes de distribuir.
- EXPO_NO_TELEMETRY=1 usado solo en procesos de CLI para evitar escritura de estado en C. Sin cambios globales de npm, PATH o política de PowerShell.
- Consulta npm requirió NODE_OPTIONS=--use-system-ca para confiar en certificados de Windows; verificación HTTPS preservada.
- Expo Go: instalación/actualización guiada mediante Google Play; versión y apertura aún pendientes de confirmar por el usuario.

## Etapa 2 — Ubicación y datos reales
- Permiso de ubicación al solicitar “Usar mi ubicación”, confirmación y localidad manual.
- Obtener coordenadas, zona horaria y etiqueta legible.
- Integrar geocodificación y pronóstico Open-Meteo tras revisar uso y atribución.
- Normalizar unidades y tiempos; gestionar conexión, falta de permisos, errores y datos vencidos.
- Mostrar fuente y actualización.
Validación: ubicación actual y al menos dos localidades distintas; permiso rechazado; sin conexión.
Estado: completada el 2026-10-14 para el alcance inicial: ubicación puntual/nombre/confirmación, búsqueda manual, condiciones actuales y pronóstico de temperatura/viento/presión de las próximas 24 horas. Validación Android 13: localidad actual y localidades distintas, cambio sin mezclar valores, actualización, error/recuperación sin conexión y consulta manual con permiso bloqueado. Tipos, 16 pruebas y bundle pasaron tras parches compatibles. No hay reglas de riesgo ni alertas operativas.

### Pronóstico de 24 horas — 2026-10-14
- Usuario confirmó en Android 13 el fallo y recuperación de conexión: sin conexión no se obtiene información y al reconectar vuelve a funcionar la consulta. Flujo meteorológico/horario validado con conexión, cambio de lugar, actualización y recuperación. No se infiere de este reporte una verificación separada de cada tarjeta durante el fallo.
- Usuario confirmó en Android 13 los tres pasos indicados: desplazamiento hasta la última tarjeta con fechas/horas correctas, cambio de localidad sin conservar datos anteriores y actualización del pronóstico. Pruebas del flujo con conexión validadas; sin conexión/recuperación del pronóstico y permiso explícitamente rechazado permanecen pendientes.
- Usuario confirmó en Android 13 que la pantalla muestra las próximas 24 horas. Visualización inicial validada; no implica todavía confirmar la última fila, cambio de lugar, actualización ni error/recuperación de red del pronóstico. Expo notificó parches disponibles (expo 57.0.28 → ~57.0.29 y otros cuatro paquetes); pendientes de revisar con expo install --check, sin actualización ejecutada.
- Mismo botón y misma petición obtienen condiciones actuales y series horarias de temperatura a 2 m, viento a 10 m y presión reducida al nivel del mar. Sin dependencias nuevas, consultas automáticas ni servicios/cuentas configurados.
- Filtra timestamps futuros dentro de las próximas 24 horas; fecha, hora local y offset UTC visibles. Valida unidades, longitud de series, orden y paso horario. No convierte valores ausentes en cero; respuesta parcial identificada. Pronóstico inválido no invalida condiciones actuales válidas.
- Vigencia de presentación provisional de 60 minutos desde consulta, independiente de la hora futura prevista; comprobación local al regresar del segundo plano y periódicamente, sin tráfico de red. Horas pasadas dejan de mostrarse; se pide actualización si quedan menos de 24 disponibles.
- Validación: TypeScript y 16 pruebas pasaron (5 localidades y 11 clima), con cinco casos nuevos de ventana de 24 horas, medianoche/límites exactos, desalineación/unidades/duplicados, faltantes y vencimiento de consulta. API real devolvió 24 horas para Córdoba y Madrid con zonas horarias correctas. Exportación Android exitosa (1256 módulos).
- Pendiente en teléfono: ver sección y horarios, desplazarse hasta última hora, cambio de localidad, actualización y comportamiento sin conexión/recuperación del pronóstico. No hay motor de avisos ni reglas de riesgo.

### Primera consulta meteorológica — 2026-10-13
- Validación final de este flujo en Android 13: usuario confirmó los tres pasos indicados, Actualizar clima con conexión, error claro al consultar sin conexión y retorno de tarjetas tras reconectar sin reiniciar. Consulta inicial, unidades/fuente/horarios y cambio de localidad ya confirmados. Consulta meteorológica actual validada; esto no implica validar pronóstico horario ni reglas de riesgo.
- Usuario confirmó en Android 13 el cambio de localidad sin mezclar datos: desaparecen los valores del lugar anterior y Consultar clima muestra el nuevo lugar y su zona horaria. Validada la prueba indicada con otra localidad (Madrid). Actualización y error/recuperación sin conexión del clima siguen pendientes.
- Validación en Android 13 confirmada por el usuario: Consultar clima muestra temperatura en °C, viento en km/h, presión en hPa, fuente y horarios. Ubicación automática y búsqueda manual también confirmadas. Cambio de lugar sin conservar valores, actualización y error/recuperación sin conexión del panel meteorológico siguen pendientes; no se equiparan a las pruebas ya realizadas de búsqueda de localidades.
- Implementado proveedor current-weather.ts y componente WeatherPanel; LocationPicker comunica el lugar elegido al inicio. Consulta solo al tocar Consultar clima/Actualizar clima, con información del envío de coordenadas; sin cuentas, persistencia, GPS continuo ni dependencias nuevas.
- Temperatura a 2 m (°C), viento a 10 m (km/h), presión reducida al nivel del mar (hPa). Datos de modelos, no mediciones locales. Fuente enlazada Open-Meteo CC BY 4.0; condiciones no comerciales revalidadas en https://open-meteo.com/en/terms . Resolución/celda no se equipara a precisión del punto elegido.
- Hora de los datos y hora de consulta mostradas en zona del lugar, usando timestamps Unix. Unidades, estructura y zona horaria validadas; valores ausentes/inválidos no se convierten en cero. Vigencia provisional 60 minutos, futuro tolerado 5 minutos; datos fuera de vigencia no se presentan como actuales. Comprobación al volver del segundo plano y cada 30 segundos, sin consultas automáticas de red.
- Cambio de lugar desmonta el panel y cancela consulta previa; actualización borra valores anteriores. Se ocultan las tarjetas y el aviso ficticio al seleccionar ubicación. Demo y detalle ficticio siguen disponibles antes de elegir un lugar; no se convierten en avisos reales.
- Verificación: TypeScript, 5 pruebas de localidades y 6 de clima pasaron (ausentes/cero, unidades, fechas, vigencia, error nativo/reintento y cancelación). Consultas reales desde PC para Córdoba y Madrid devolvieron datos vigentes y zonas horarias correctas. Bundle Android exportado (1256 módulos).
- Pendiente en Android: consulta de ubicación actual y dos localidades, cambio sin conservar datos anteriores, actualización, ausencia de conexión y recuperación. Permiso explícitamente rechazado sigue pendiente. No se añadieron reglas de riesgo ni pronóstico horario; etapa 2 no cerrada.

### Selección de ubicación — 2026-10-13
- Usuario confirmó en Android 13 que, al desactivar ubicación, la app no pudo establecerla y, al reactivarla, obtuvo la ubicación actual. Fallo y recuperación por ubicación desactivada validados. El reporte no distingue rechazo del permiso de la app de desactivación del servicio del teléfono; permiso explícitamente rechazado y búsqueda manual bajo ese estado no se dan por verificados.
- Usuario confirmó en Android 13 que Usar mi ubicación seguido de Confirmar esta ubicación actualiza Ubicación elegida correctamente. Flujo de sugerencia y confirmación validado; permiso rechazado con alternativa manual pendiente. Pronóstico real todavía no integrado.
- Usuario confirmó en Android 13 que buscar una localidad inexistente muestra el estado sin coincidencias correctamente. Búsqueda manual validada con resultados, selección, ausencia de coincidencias, error de red y recuperación. Confirmación GPS y permiso rechazado permanecen pendientes; etapa 2 sigue en curso sin pronóstico real.
- Recuperación sin conexión validada en Android 13: usuario reconectó y repitió la búsqueda sin reiniciar la app; los resultados volvieron a funcionar. Confirmados búsqueda/selección manual, nombre sugerido, mensaje de error de red y recuperación. Consulta sin coincidencias, confirmación GPS y permiso rechazado siguen pendientes; pronóstico real todavía no integrado.
- Usuario confirmó en Android 13 que el fallo sin conexión muestra el mensaje corregido: No pudimos conectar. Revisá tu conexión y reintentá. Manejo visual del error validado; recuperación tras reconectar todavía no confirmada.
- Prueba sin conexión en Android: usuario observó fetch failed / java.net.UnknownHostException. Se corrigió el manejo de rechazos nativos de fetch (Error, además de TypeError) para mostrar No pudimos conectar. Revisá tu conexión y reintentá, manteniendo cancelación y timeout. TypeScript y cinco pruebas pasaron, incluida regresión del error nativo y reintento exitoso simulado. Mensaje corregido y recuperación en teléfono pendientes de confirmar.
- Usuario confirma en Android 13 que la búsqueda manual real y selección funcionan tras la prueba indicada de Córdoba y Madrid: cambia Ubicación elegida. Clima continúa ficticio. Error sin conexión, consulta sin coincidencias, permiso rechazado y confirmación GPS aún pendientes de validar en dispositivo.
- Tercera tarea implementada: lista de prueba reemplazada por búsqueda manual real con Open-Meteo/GeoNames, atribución enlazada visible y explicación del envío de texto al tocar Buscar. Sin dependencias nuevas ni claves. Consulta explícita (mínimo 3 caracteres), máximo 10 resultados con provincia/país, espera máxima 10 segundos y cancelación al editar/desmontar; errores, ausencia de resultados y límite de consultas distinguidos.
- Proveedor search-locations.ts valida estructura, ID, nombre, rangos de coordenadas y zona horaria. Coordenadas y zona horaria de la elección permanecen en memoria; datos meteorológicos ficticios siguen independientes.
- Validación: TypeScript y cuatro pruebas automatizadas pasaron (respuesta vacía vs rota, coordenadas inválidas/deduplicación, zona horaria y cancelación). Consultas reales desde PC de Córdoba y Madrid dieron 10 resultados cada una y zonas horarias válidas. Exportación Android correcta (1254 módulos); búsqueda/selección y error sin conexión en teléfono pendientes.
- Condiciones verificadas en https://open-meteo.com/en/terms y https://open-meteo.com/en/docs/geocoding-api para prueba no comercial. No se activó facturación ni cuenta de servicios.
- Prueba en Android 13 confirmada por el usuario: geocodificación inversa mostró Yerba Buena como sugerencia. Obtención de coordenadas y resolución del nombre verificadas en dispositivo; confirmación de selección, permiso rechazado y fallback sin conexión siguen pendientes. El clima mostrado continúa siendo ficticio.
- Usuario confirmó obtención de coordenadas en Android 13. Confirmación de selección y permiso rechazado todavía pendientes.
- Segunda tarea: reverseGeocodeAsync de Expo Location convierte coordenadas a localidad/provincia/país según servicio del sistema. Si solo hay distrito/subregión, se identifica como Zona; si faltan nombres, falla o pasan 8 segundos, se conservan coordenadas y alternativa manual. No se usan calle, número, edificios ni dirección completa; no se promete localidad más cercana ni exactitud administrativa.
- Se explica en la interfaz que geocodificación del sistema puede necesitar conexión. Sin claves, cuentas nuevas ni almacenamiento; clima de Yerba Buena sigue identificado como escenario ficticio independiente.
- TypeScript pasó y cuatro escenarios ficticios de formato verificaron deduplicación, localidad ausente, zona y respuesta vacía. Bundle Android exportado correctamente (1253 módulos); nombre real y fallback sin conexión pendientes de probar en teléfono.
- Instalado expo-location mediante expo install compatible con SDK 57; fuente: https://docs.expo.dev/versions/v57.0.0/sdk/location/ . Incluido en Expo Go.
- Proveedor separado en src/providers/device-location.ts; permiso de primer plano solo al tocar Usar mi ubicación, consulta puntual, límite de espera de 15 segundos y validación de coordenadas/timestamp. Sin suscripción, permiso en segundo plano, persistencia ni envío a proveedor meteorológico.
- Componente LocationPicker muestra sugerencia de coordenadas redondeadas con confirmación/descarte; no inventa nombre de localidad. Selección manual filtra una lista local de prueba (Yerba Buena, Buenos Aires, Córdoba, Madrid), sin API ni coordenadas atribuidas a esos ejemplos. Búsqueda global y geocodificación pendientes para la siguiente tarea.
- Estados de permiso rechazado/bloqueado, ubicación apagada y fallo/espera informados; alternativa manual disponible. Clima ficticio mantiene su propio lugar y no se presenta como datos para la ubicación elegida.
- Validación local completada: npm.cmd run typecheck sin errores; expo install --check confirmó compatibilidad; exportación Android correcta (1252 módulos). Pruebas de permiso y selección en teléfono pendientes. No cerrar etapa 2 hasta integrar y verificar datos reales según su alcance.
- Parches compatibles del SDK 57 alineados con expo install --fix: expo ~57.0.28, expo-router ~57.0.26, expo-splash-screen ~57.0.10, @expo/ui ~57.0.23; expo-location ~57.0.21. Sin cambio de SDK; lockfile actualizado. Auditoría mantiene 29 hallazgos pendientes; no se aplicó audit fix --force.

## Etapa 3 — Motor de avisos dentro de la app
Alcance recomendado: UV, viento, lluvia, visibilidad y tendencia de presión.
- Definir reglas documentadas y textos revisados antes de activarlos.
- Implementar reglas independientes de la interfaz.
- Mostrar motivo, periodo y acción sugerida.
- Controlar repetición, vigencia y estados de información insuficiente.
- Dejar granizo, hormigas y predicción de dolor fuera de reglas operativas.
Validación: escenarios ficticios de límites y datos ausentes; pruebas unitarias relevantes del motor.
Estado: en curso el 2026-10-14. Usuario aprobó viento previsto a 10 m >=40 km/h como criterio experimental. Motor puro y tarjeta implementados; no es alerta oficial ni criterio local validado. Otras reglas pendientes.

### Primera regla de viento — 2026-10-14
- rules/wind.ts recibe lugar, consulta, serie horaria normalizada y reloj explícito. Devuelve aviso experimental, criterio no alcanzado o información insuficiente. Filtra horas futuras de 24 h; consulta vence a 60 min. No accede a red, GPS ni persistencia.
- Cobertura incompleta con excedencia válida conserva aviso con limitación; sin excedencia y con huecos no concluye ausencia de riesgo. Estructura inválida o vencida da información insuficiente. Horas son puntos del modelo, no intervalos continuos confirmados.
- WindNoticeCard muestra lugar, máximo/horas, motivo/umbral, acción, fuente/consulta, vigencia y referencia NWS. Una tarjeta por regla/lugar con ID estable, reemplazada al reevaluar; sin push, popups ni historial persistente. Cambiar de lugar o actualizar no apila avisos.
- Ruta wind-demo ofrece cuatro escenarios ficticios (con aviso, debajo, faltantes, vencido), accesible desde la tarjeta en desarrollo, sin consultar clima real. No se inyectan ejemplos en datos reales.
- Validación: TypeScript pasó; 24 pruebas pasaron (5 localidades, 11 clima y 8 viento: límites, ausentes/cero, parcial, vencimiento/reloj, horizonte, duplicados, cierre por tiempo e identidad/reevaluación). Se corrigió el generador de un caso de prueba ausente antes de obtener el resultado final. Bundle Android exportado correctamente (1259 módulos).
- Validación en Android 13 confirmada por el usuario: tarjeta de evaluación para Taco Ralo, Provincia de Tucumán, Argentina, con criterio no alcanzado en las 24 horas evaluadas. Acceso a pruebas ficticias y cambio de resultado al seleccionar Con aviso, Debajo del criterio, Datos faltantes y Consulta vencida confirmados. Esto verifica la interfaz, no la calibración meteorológica del umbral.
- Cierre de esta entrega: usuario confirmó en Android 13 regreso con Atrás, actualización y cambio de localidad sin duplicar tarjetas ni conservar la del lugar anterior. Primera entrega experimental de viento validada funcionalmente. Etapa 3 no completada: otros módulos/umbrales y validación de contenidos pendientes.

## Etapa 4 — Firebase y acceso
- Crear o seleccionar proyecto Firebase con autorización del usuario.
- Elegir SDK compatible con la estrategia Expo.
- Configurar Authentication y Google Sign-In; conservar modo sin cuenta.
- Configurar Firestore, reglas de acceso e índices mínimos.
- Guardar ubicaciones y preferencias.
- Preparar development build cuando corresponda.
Validación: inicio/cierre de sesión, persistencia y aislamiento entre dos usuarios mediante emuladores o entorno de pruebas.
Estado: pendiente.

## Etapa 5 — Diario de síntomas
- Definir campos mínimos, consentimiento y retención.
- Crear registro, edición, consulta y eliminación de síntomas.
- Asociar datos ambientales del lugar y momento correcto.
- Añadir exportación y eliminación de los datos personales.
- Presentar historial descriptivo, sin predicción médica.
- No implementar análisis estadístico de patrones hasta definir calidad y tamaño de datos necesarios.
Validación: datos ficticios; aislamiento, consentimiento y eliminación, incluyendo registros asociados.
Estado: pendiente.

## Etapa 6 — Avisos con la app cerrada
- Elegir Expo Push Service o FCM directo.
- Solicitar permiso de notificación y guardar tokens por dispositivo.
- Implementar tareas del servidor que reutilicen consultas por zona y eviten duplicados.
- Definir frecuencia según actualización del proveedor, costo y necesidad.
- Activar Blaze únicamente con autorización; configurar monitoreo y controles de consumo.
- Permitir desactivar categorías, respetar horarios y retirar tokens inválidos.
- Mantener información sanitaria privada fuera del texto visible de push.
Validación: Android real con app en segundo plano/cerrada; duplicados, permisos, token inválido y retrasos.
Estado: pendiente.

## Etapa 7 — Ampliaciones validadas
- Aire: PM2,5, PM10 y AQI con escala explícita y limitaciones regionales.
- Jardín: heladas, calor, viento y lluvia; criterios revisados.
- Frío y riesgo de hielo con datos y lenguaje adecuados.
- Investigar acceso estable y autorizado a alertas oficiales; empezar por Argentina si se acuerda.
- Añadir otros proveedores por jurisdicción si se amplía la cobertura oficial.
Validación: cobertura, atribución, severidad, caducidad y diferenciación de fuentes.
Estado: pendiente.

## Etapa 8 — Preparación para Google Play
- Verificar requisitos actuales de Play Console y categorías/declaraciones aplicables.
- Política de privacidad pública y accesible; seguridad de datos; permisos mínimos.
- Revisar eliminación de cuenta y datos.
- Preparar icono, capturas, ficha, contacto y compilación AAB firmada.
- Realizar prueba interna y prueba cerrada si corresponde.
- Resolver resultados antes de solicitar acceso a producción.
- Publicar únicamente tras instrucción explícita del usuario.
Validación: pruebas en dispositivos, revisión de accesibilidad, errores, consumo y flujo completo.
Estado: pendiente.

## Criterio para continuar entre etapas
La funcionalidad anterior debe ser verificable y su estado debe quedar documentado.
No avanzar automáticamente a servicios pagos o publicación.
No bloquear cambios locales rutinarios con confirmaciones innecesarias.

## Registro de continuidad
- 2026-10-14: primera entrega de viento validada funcionalmente en Android 13. Código, pruebas y documentación previa enviados a GitHub en cb8fa2f; la confirmación final de regreso/actualización/cambio sin duplicados se registra después de ese commit. Siguiente incremento pendiente de definir; no hay nuevos umbrales aprobados ni servicios activados.
- 2026-10-14: usuario confirmó que el permiso se solicita después de tocar Usar mi ubicación. Al rechazarlo, muestra El permiso está bloqueado… y permite búsqueda manual y consulta de pronóstico. Último caso pendiente validado en Android 13; etapa 2 cerrada. Versión exacta de Expo Go sigue pendiente como dato de entorno, sin bloquear el cierre. Revisión de auditoría antes de distribuir sigue pendiente.
- 2026-10-14: parches compatibles de SDK 57 aplicados con expo install --fix; package.json y lockfile actualizados. TypeScript, 16 pruebas, expo install --check y exportación Android (1256 módulos) pasaron. Sin cambios globales ni facturación. Auditoría mantiene los 29 hallazgos previamente registrados; no se aplicó audit fix --force. Pendiente reiniciar Metro/reabrir en Android y verificar permiso explícitamente rechazado con alternativa manual; no se cierra etapa 2 aún.
- Cierre del 2026-10-13 por pedido del usuario: consulta meteorológica actual validada en Android (variables/unidades, fuente/horarios, cambio de lugar, actualización, error y recuperación de conexión). TypeScript y 11 pruebas pasaron antes del commit/push autorizado de estos avances. Etapa 2 sigue abierta. Al retomar: prueba específica de permiso rechazado y definición del siguiente incremento de pronóstico; propuesta de próximas 24 horas todavía no implementada. Sin servicios ni facturación activados.
- 2026-10-13: proyecto subido a https://github.com/aletorresprado/proyecto-clima en rama main, vinculada a origin/main. SSH rechazó autenticación; HTTPS funcionó con credenciales existentes y el remoto estaba vacío. Commit de avances 9ed71be enviado y hash local/remoto verificado. Caché, node_modules, .expo y .env excluidos; sin push forzado ni cambios de permisos. Registro documental enviado posteriormente en otro commit.
- 2026-10-09: documentación de contexto y plan creada. Sin código, credenciales ni infraestructura.
- 2026-10-09: revisión de etapa 0 registrada; entorno inspeccionado y requisitos oficiales consultados. Sin implementación ni servicios.
- 2026-10-09: Windows/PowerShell/npm y mobile aceptados; Node actualizado a v24.20.0 y npm 11.4.1 comprobado. Expo Go actual/SDK 57 y plantilla default revisados; teléfono pendiente.
- 2026-10-09: conflicto de npm resuelto con respaldo autorizado; versiones efectivas verificadas en PowerShell nuevo: Node 24.20.0, npm.cmd/npx.cmd 11.19.0. Sin creación de app.
- 2026-10-09: app mínima autorizada, creada en mobile con datos ficticios; tipos, compatibilidad de dependencias y bundle Android verificados. Metro iniciado; apertura real en Expo Go pendiente de confirmación.
- 2026-10-13: etapa 1 completada con confirmación del usuario de arranque y navegación en Android 13.
- Próximo paso: definir el siguiente módulo de etapa 3 y documentar variables, fuente, criterio y textos antes de implementarlo. Primera entrega de viento validada; no confundir con ráfagas, ausencia de riesgo ni alertas oficiales. Registrar versión de Expo Go cuando esté disponible.
