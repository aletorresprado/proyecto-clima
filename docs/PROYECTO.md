# Proyecto Clima

Fecha base: 2026-10-09. Estado al 2026-10-13: app mínima, selección de lugares y consulta meteorológica real validadas en Android 13, incluyendo cambio de localidad, actualización, error sin conexión y recuperación. Prueba específica de permiso rechazado pendiente. Sin infraestructura configurada.
Nombre provisional: Proyecto Clima.
Estado consolidado al 2026-10-16: primera entrega UV validada funcionalmente en Android 13: tarjeta, cinco escenarios ficticios, regreso, actualización y cambio de localidad sin duplicados. Viento y UV conservan sus accesos de prueba en desarrollo; debajo aparece el pronóstico de 24 horas con fecha/hora, temperatura, viento y presión al nivel del mar. TypeScript, 39 pruebas y bundle Android correctos. Referencia local origin/main incluye el commit sísmico 067d43a. Los registros siguientes describen estados históricos.
Último incremento del 2026-10-16: UV aprobado e implementado, pendiente de validación visual en Android. Regla pura y tarjeta con próximos puntos horarios UV >=3 y refuerzo >=8, con escenarios ficticios. TypeScript y 39 pruebas pasaron; consulta integrada real devolvió 24 horas de clima y UV. Commit sísmico 067d43a creado localmente, pendiente de push. Los párrafos históricos siguientes conservan el estado previo.
Estado vigente al 2026-10-16: viento experimental validado funcionalmente en Android 13; UV aprobado por el usuario, implementación pendiente. Monitoreo USGS implementado con tipos, pruebas y bundle verificados. Usuario confirmó en Android respuesta vacía válida, actualización periódica, consulta al regresar del segundo plano, detención y error de conexión/recuperación; persistencia con eventos pendiente. Los avances históricos siguientes describen estados anteriores.
Etapa 2 cerrada el 2026-10-14: usuario confirmó permiso solicitado solo al tocar, mensaje de permiso bloqueado y búsqueda/pronóstico manual funcionando sin acceso a ubicación. Condiciones actuales y pronóstico de 24 horas validados; siguiente etapa: criterios documentados del motor de avisos, todavía sin umbrales acordados.
Avance del 2026-10-14: pronóstico horario de las próximas 24 horas implementado y validado en Android 13: visualización, última hora, cambio de localidad, actualización y fallo/recuperación de conexión confirmados por el usuario. No hay reglas de riesgo ni avisos operativos.
Mantenimiento del 2026-10-14: parches compatibles instalados: expo 57.0.29, @expo/ui 57.0.24, expo-constants 57.0.22, expo-linking 57.0.13 y expo-router 57.0.27. SDK 57 conservado; compatibilidad, tipos, 16 pruebas y bundle Android verificados. Versión exacta de dependencias fijada por el lockfile; rangos de package.json pueden conservar un parche anterior compatible.

## 1. Objetivo
Desarrollar una app Android publicable en Google Play que traduzca datos meteorológicos y ambientales en avisos comprensibles para anticipar riesgos y organizar actividades.
El valor principal es informar qué podría ocurrir, dónde, cuándo y qué acción práctica considerar.
La temperatura actual y otras variables serán contexto, no el único producto.

## 2. Acuerdos del usuario
- Desarrollar desde Visual Studio Code con Codex. Antigravity puede obviarse.
- Repositorio GitHub: https://github.com/aletorresprado/proyecto-clima ; rama main, remoto origin por HTTPS. Subida autorizada y realizada el 2026-10-13. SSH no disponible con la autenticación actual; no se modificaron claves ni permisos.
- Trabajar en Windows con PowerShell y npm.cmd/npx.cmd; app en mobile y AGENTS.md y docs en la raíz. Creación y primera pantalla autorizadas el 2026-10-09; desarrollo guiado desde VS Code.
- Utilizar React Native + Expo + TypeScript como base propuesta y aceptada para continuar.
- Consultar una API de clima con acceso gratuito para comenzar.
- Solicitar permiso de localización y sugerir ubicación actual; cobertura general, no limitada a Yerba Buena.
- Utilizar base de datos y servicios Firebase; entrada con la cuenta Google del usuario.
- Incluir información personal de salud y registro de síntomas opcionales. Su alcance debe definirse antes de recopilar datos.
- Preparar el proyecto para Google Play mediante etapas.
- Explicar comandos antes de ejecutarlos.

## 3. Diseño recomendado, sujeto a refinamiento
- Consulta meteorológica sin cuenta.
- Inicio de sesión para sincronización y registros de salud en la nube.
- Selección manual de localidad si se rechaza ubicación o se busca otro lugar.
- Ubicación al abrir o actualizar; sin GPS continuo en la primera versión.
- Lugares guardados y preferencias por categoría.
- Avisos actuales y próximos, con detalles del motivo.
- Historial de avisos y control de frecuencia, para evitar saturación.
- Perfil de salud y diario de síntomas; no historia clínica de atención médica.
- Sin IA generativa para decidir riesgos o redactar cada aviso: reglas y textos revisados.

## 4. Fuentes candidatas
### Open-Meteo
Geocodificación manual integrada para pruebas no comerciales el 2026-10-13: endpoint /v1/search, lenguaje español, máximo 10 resultados, consulta explícita con al menos 3 caracteres. Atribución Open-Meteo/GeoNames visible. Condiciones verificadas: menos de 10.000 consultas/día, 5.000/hora y 600/minuto; licencia CC BY 4.0 indicada por Open-Meteo. Sin clave ni cuenta. Revisar uso comercial antes de monetizar; selección de este servicio no confirma todavía el proveedor de pronóstico.
Primera integración meteorológica implementada el 2026-10-13 para pruebas no comerciales: /v1/forecast con current temperature_2m, wind_speed_10m y pressure_msl; °C, km/h y hPa. Consulta explícita tras elegir/confirmar lugar, con información de envío de coordenadas a Open-Meteo. Se presentan como condiciones actuales estimadas por modelos, no sensores ni alertas oficiales. Horas Unix convertidas usando la zona horaria resuelta por el proveedor; se diferencian hora del dato y hora de consulta, sin inventar fecha de ejecución del modelo. Atribución visible.
Vigencia de presentación provisional: 60 minutos desde la hora del dato y tolerancia de futuro de 5 minutos para discrepancias de reloj. No es un criterio validado de riesgo. Fuera de vigencia se ocultan valores y se solicita actualización; variables ausentes muestran información insuficiente. No se calcula severidad ni ausencia de riesgo.
Pronóstico del 2026-10-14: misma consulta explícita agrega hourly para las tres variables y forecast_hours=25; se filtran las 24 horas futuras desde la consulta, excluyendo la hora ya pasada. Timestamps Unix y horas locales con desplazamiento UTC. Series desalineadas, unidades equivocadas o tiempos no consecutivos significan pronóstico insuficiente; series parciales se identifican como incompletas, sin rellenarlas. Vigencia provisional del pronóstico: 60 minutos desde la consulta; no representa fecha de ejecución del modelo ni un criterio meteorológico de riesgo.
Proveedor inicial recomendado para pronóstico y calidad del aire.
Verificar cobertura real, variables, resolución, actualización, atribución, límites y condiciones de uso antes de implementar.
El acceso gratuito consultado en octubre de 2026 era no comercial y anunciaba 10.000 llamadas diarias; revisar también los demás límites.
No asumir que una app gratuita con publicidad o uso empresarial cumple el uso no comercial.
Para Argentina, la calidad del aire del modelo global CAMS tiene resolución regional aproximada de 45 km: no equivale a un sensor del barrio.
Las condiciones actuales pueden ser estimaciones de modelos.

### Servicio Meteorológico Nacional de Argentina
Candidato para alertas oficiales de fenómenos severos y avisos a muy corto plazo.
No se ha confirmado una API pública estable ni permisos de integración. Investigar antes de implementar.
No usar endpoints internos o scraping como dependencia de producción sin evaluar condiciones, estabilidad y autorización.
Para otros países, la integración de alertas oficiales deberá resolverse por jurisdicción; no hay cobertura global acordada.

## 5. Módulos de prevención
| Módulo | Variables | Alcance inicial y límites |
| --- | --- | --- |
| Presión | Presión y variación temporal | Mostrar tendencia; cruzar con lluvia y viento. No diagnosticar frentes por un valor aislado. |
| Aire | PM2,5, PM10, AQI | Estimación regional; identificar escala de AQI y sus periodos de promedio. |
| Visibilidad | Visibilidad, humedad, códigos del tiempo | Avisos de visibilidad reducida; no atribuir siempre a niebla. |
| UV | Índice UV y horario | Protección solar independiente del calor; usar recomendaciones de fuentes sanitarias oficiales. |
| Calor | Temperatura, humedad, sensación térmica | Avisos generales con criterios documentados y contexto local. |
| Frío | Temperatura, humedad, precipitación | Riesgo de heladas; hielo superficial requiere más evidencia que temperatura del aire. |
| Lluvia | Probabilidad, intensidad y acumulación | Distinguir probabilidad y cantidad. No deducir inundación local sin datos adicionales. |
| Viento | Velocidad, ráfagas y horario | Avisos anticipados según reglas documentadas. |
| Tormenta y granizo | Alertas oficiales y datos adecuados | Priorizar fuente oficial; no prometer detección exacta con una API genérica. |
| Jardín | Helada, calor, viento, lluvia, suelo | Recomendaciones generales. Hipótesis de hormigas pendiente de evidencia. |

“Radar” puede ser una etiqueta visual. Estos módulos son análisis de datos; un radar meteorológico real sería una integración adicional.

## 6. Reglas de aviso
Inicio de etapa 3 el 2026-10-14: usuario aprobó el criterio experimental de viento >=40 km/h a 10 m y el aviso preventivo propuesto. Implementado como evaluación dentro de la app. Usuario verificó en Android 13 la tarjeta real de Taco Ralo y el cambio entre los cuatro escenarios ficticios (con aviso, debajo del criterio, datos faltantes y consulta vencida), además del regreso y actualización/cambio de lugar sin duplicados. Primera entrega validada funcionalmente; aprobación de producto y prueba de interfaz no equivalen a validación meteorológica local. Otros módulos y umbrales pendientes.

### Regla inicial de viento (aprobada para pruebas experimentales)
- Variable: wind_speed_10m prevista por Open-Meteo, en km/h, en las próximas 24 horas. No es wind_gusts_10m; no inferir ráfagas ni promedios de observación específicos del dato de modelo.
- Referencia descriptiva: NWS Beaufort https://www.weather.gov/tbw/beaufort : fuerza 6, 25–31 mph (aprox. 40–50 km/h), con efectos descritos sobre ramas grandes y dificultad para usar paraguas. Referencia para contexto; no valida una alerta propia ni una equivalencia exacta con salidas horarias del modelo.
- Decisión aprobada de la app: umbral de prueba >=40 km/h en al menos una hora válida; cifra redondeada inspirada en esa referencia, sin calibración local. Una sola categoría de recomendación preventiva experimental; no severidad oficial ni probabilidad de daño.
- Mostrar lugar, horas concretas que cumplen el criterio y máximo previsto. Son puntos horarios del pronóstico; no extender su vigencia automáticamente a toda la hora siguiente ni afirmar continuidad entre puntos. No generar aviso fuera de la ventana futura de 24 horas.
- Consulta vencida (criterio de presentación actual: 60 minutos), series inválidas o faltantes: información insuficiente. Si hay excedencias válidas y además huecos, puede mostrarse la evidencia disponible indicando cobertura incompleta; sin excedencias y con huecos, no concluir ausencia de aviso evaluable. Con datos completos por debajo del criterio: No se alcanza este criterio en las horas evaluadas, nunca Sin riesgo.
- Texto implementado: Aviso experimental de viento. Se prevén valores de viento de hasta {máximo} km/h en las horas indicadas. Considerá asegurar objetos sueltos del exterior. Incluye lugar, fechas/horas locales, fuente, hora de consulta, vigencia de evaluación y aviso explícito de estimación de modelos/regla propia.
- Primera entrega solo dentro de la app: una tarjeta por lugar/regla, reemplazada al actualizar; no apilar duplicados, mostrar popups ni enviar push. Retirar al vencer la consulta o pasar las horas relevantes; reevaluar con datos nuevos. Persistencia, pausas e histéresis para entrega de notificaciones se resolverán antes de habilitarlas.
- Pruebas previstas: valores justo debajo/en/encima del umbral, cero vs ausente, datos vencidos, futuro/pasado, cobertura parcial, cambio de lugar y reevaluación sin tarjetas duplicadas. Motor puro separado de la interfaz.

Cada regla debe definir variables, unidades, periodo, umbral, fuente de criterio, severidad, duración, zona y condiciones de cierre.
Están aprobados el umbral experimental de viento y los criterios UV >=3 y >=8 detallados abajo; los demás umbrales siguen pendientes. Revisar criterios y contenidos antes de ampliar avisos o entrega de notificaciones.
Combinar criterios cuando corresponda y añadir histéresis y pausas para evitar entradas y salidas repetidas.
Distinguir información, recomendación preventiva y alerta oficial. Los colores no deben hacer pasar una regla propia por aviso del SMN.
Mostrar datos vencidos y limitaciones de cobertura. La entrega de push no es una garantía de aviso inmediato.

Ejemplo ficticio de formato, no condición real:
“Se prevén ráfagas fuertes en tu ubicación durante la tarde. Asegurá objetos sueltos.”
Detalles: intervalo, valores previstos, fuente y última actualización.

### Módulo UV — 2026-10-16 (primera entrega validada funcionalmente en Android)
- Cierre: usuario confirmó regreso desde ejemplos, actualización y cambio de localidad sin duplicados; tarjetas de viento/UV y pronóstico de 24 horas con sus variables visibles. No equivale a calibración local ni a validar todas las condiciones meteorológicas posibles.
- Usuario confirmó en Android 13 la aparición de las tarjetas y el cambio correcto entre los cinco escenarios ficticios (UV 3, UV 8, debajo, faltantes y vencido). Regreso, actualización y cambio de localidad sin duplicados pendientes de verificar. Bundle Android del incremento correcto (1272 módulos).
- Fuentes revisadas: https://open-meteo.com/en/docs incluye índice UV entre variables horarias; https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index recomienda protección desde índice 3.
- Propuesta de producto: evaluar índice UV horario previsto en las próximas 24 horas, sin unidad física ni equivalencia con temperatura; mostrar horas concretas con UV >=3 y máximo disponible. No usar máximo diario para inventar horarios ni sustituir por escenario de cielo despejado.
- Texto propuesto: Protección solar recomendada en las horas indicadas. Buscá sombra y usá ropa protectora, sombrero, anteojos y protector solar. Para UV >=8, reforzar evitar exposición al sol alrededor del mediodía, siguiendo la referencia OMS. Sin tiempos personales seguros de exposición ni diagnóstico.
- Conservar fuente, lugar, hora de consulta y vigencia provisional de 60 minutos. Datos faltantes/vencidos indican información insuficiente; cobertura parcial se informa; valores debajo del criterio no significan ausencia general de riesgo. Primera entrega dentro de la app, sin push.
- Usuario aprobó módulo, criterio y propuesta de mensajes el 2026-10-16. API real verificada: hourly=uv_index, unidad vacía (índice sin unidad), 25 valores en puntos fijos de Tucumán y Madrid. La consulta existente añade uv_index y filtra los 24 puntos futuros; parser UV independiente evita invalidar viento/condiciones actuales si faltan valores UV. No se usa uv_index_clear_sky ni máximo diario.
- Implementados rules/uv.ts, UvNoticeCard y ruta uv-demo con UV 3, UV 8, debajo, faltantes y vencido. Regla pura con reloj explícito, vigencia provisional 60 minutos, cobertura parcial informada y una sola tarjeta por lugar; se reemplaza al actualizar/cambiar lugar. No añade consultas automáticas de clima, dependencias ni notificaciones. Horarios son puntos del modelo, sin inventar intervalos continuos ni exposición personal segura.
- Verificación: TypeScript y 39 pruebas pasaron (7 nuevas UV: límites exactos 3/8, ausentes/cero, parcial, tiempo/horizonte, identidad/cierre, parser e independencia del clima). Petición integrada real para punto fijo de prueba devolvió 24 horas meteorológicas y UV, con evaluación coherente. Prueba visual Android pendiente.

### Monitoreo sísmico solicitado — 2026-10-16
- Permiso específico validado en Android 13: al tocar Iniciar con mi ubicación con el permiso bloqueado, muestra Monitoreo detenido y Falta permiso de ubicación para consultar sismos cerca del teléfono. La consulta meteorológica por búsqueda manual sigue disponible, confirmada por el usuario. Comprobación distinguida del mensaje del selector meteorológico. Completadas las comprobaciones funcionales iniciales previstas, sin afirmar cobertura completa USGS ni recepción de un evento real.
- Validación posterior confirmada por el usuario: las seis pruebas ficticias pasaron en Android 13 (A nuevo, repetición, navegación, recarga con historial conservado y B nuevo). Persistencia local verificada en la clave aislada de prueba, mediante helpers compartidos con el monitoreo real. No equivale a probar una publicación real con eventos ni el rechazo de permiso específico del módulo. Bundle del incremento correcto (1269 módulos), TypeScript y 32 pruebas pasaron.
- Incremento de pruebas: ruta earthquake-demo, accesible por Probar eventos ficticios en desarrollo. Botones A/repetir A y B/repetir B; muestra evento ficticio y distingue nuevo de ya visto. No consulta red ni GPS; clave AsyncStorage exclusiva clima:earthquakes:demo-seen:v1. Reiniciar solo la prueba vacía esa clave, sin tocar historial real. Lectura/escritura compartidas en earthquake-history.ts con validación de IDs y propagación de fallos. Prueba nativa de navegación/reinicio pendiente; TypeScript y 32 pruebas automatizadas pasaron.
- Solicitud aprobada por el usuario: ubicación de primer plano con Expo Location, GeoJSON USGS con latitude/longitude/maxradius=1.8, polling cada 2 minutos con app activa y persistencia local para evitar avisos repetidos. Se integra antes del panel de clima, con centro del teléfono independiente de la localidad meteorológica elegida.
- Implementación: providers/earthquakes.ts valida GeoJSON, coordenadas, tiempos, magnitud ausente y distancias epicentrales; earthquake-monitor.tsx contiene proveedor compartido en RootLayout y tarjeta en Inicio. Activación explícita con información del envío de coordenadas a USGS; permiso inicial al tocar, comprobación y ubicación puntual en cada ciclo, sin GPS continuo ni segundo plano. Detener cancela el ciclo. Consulta al iniciar/reanudar y siguiente ciclo 120 segundos después de terminar, sin solapamientos; timeout de 20 segundos.
- Ventana inicial elegida: últimas 24 horas, eventtype=earthquake, orden temporal y hasta 1000 eventos. Una respuesta en el límite se trata como incompleta. maxradius=1.8 está en grados (aprox. 200 km), no son 200 km exactos; USGS permite maxradiuskm como alternativa, no usado para conservar la solicitud. Distancia al epicentro no equivale a intensidad ni riesgo en el teléfono.
- Persistencia: AsyncStorage compatible instalado por Expo, incluido en Expo Go. Solo IDs de eventos vistos en almacenamiento local no cifrado; se conserva un conjunto, en vez de un único ID, para reconocer publicaciones tardías y evitar repeticiones al cambiar el orden. Coordenadas y resultados solo en memoria. Si no puede leer IDs, no inicia; si no puede escribir, informa que la deduplicación solo queda garantizada en la sesión. Sin nube, notificaciones push, sonidos ni alerta temprana.
- Interfaz: Sismos recientes cerca del teléfono; resultados/horarios/última consulta, enlace por evento, banner de eventos no mostrados previamente y botón Entendido. La primera consulta puede mostrar eventos que ya ocurrieron; se explica expresamente. Error conserva la última consulta identificada como no actualizada. No devolver eventos no significa ausencia de actividad/riesgo.
- Fuente oficial: https://earthquake.usgs.gov/fdsnws/event/1/ y https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php . USGS recomienda feeds para automatización cuando sea posible; se conserva query para el filtro circular solicitado. Son eventos publicados con demoras y revisiones, no predicción ni sistema de alerta temprana, sin garantía de exhaustividad local. Revisar estrategia de feeds/caché antes de escalar.
- Validación local: TypeScript, 30 pruebas totales y bundle Android (1267 módulos) correctos. Consulta real desde PC con coordenadas fijas de prueba -26/-65 devolvió respuesta válida sin eventos para la ventana; no se usó ubicación personal.
- Validación Android 13 confirmada por el usuario: respuesta vacía válida con coordenadas y horarios, avance periódico de la consulta con app abierta, nueva consulta al regresar del segundo plano y detención del monitoreo. También confirmó error al desactivar Wi-Fi y recuperación de la lectura al reconectar. No equivale a verificar tráfico durante segundo plano ni deduplicación con eventos. Permiso rechazado del módulo sísmico, navegación y persistencia nativa con eventos siguen pendientes.

## 7. Perfil de salud y diario
Propuesta: condiciones o sensibilidades declaradas, síntomas, intensidad, zona corporal, fecha y nota opcional.
Asociar cada registro a un contexto ambiental del lugar y momento indicado, incluyendo fuente y condición de estimación.
No usar el GPS actual para un síntoma ocurrido en otro lugar o momento sin confirmación.
La intensidad es una autoevaluación; definir una escala consistente.
Las coincidencias entre síntomas y clima son exploratorias: no prueban causalidad ni predicen síntomas individuales.
La relación específica “baja presión causa dolor” no está validada como regla para esta app.
No recopilar medicamentos, documentos clínicos o diagnósticos adicionales sin necesidad y alcance explícitos.
Definir consentimiento, retención, eliminación y exportación antes de habilitar almacenamiento real.

## 8. Stack y arquitectura
| Componente | Selección inicial |
| --- | --- |
| Editor | Visual Studio Code con Codex |
| App | React Native + Expo + TypeScript |
| Arranque implementado | Expo SDK 57; plantilla default 57.0.29, create-expo-app 5.0.0; Stack de Expo Router, inicio y detalle ficticios |
| Ejecución local | npm.cmd start desde mobile; lanzador Node prepara variables solo para Expo, caché/temporales en .cache y LAN puerto 8081. Acordado el 2026-10-13 |
| Navegación | Expo Router, recomendado |
| Ubicación | Expo Location SDK 57 para ubicación puntual y nombre del sistema; búsqueda manual real con Open-Meteo/GeoNames y elección explícita |
| Identidad | Firebase Authentication; Google como proveedor inicial |
| Datos | Cloud Firestore; reemplaza la propuesta anterior de PostgreSQL |
| Notificaciones | Expo Notifications; elegir Expo Push Service o FCM directo antes de implementar |
| Servidor | Cloud Functions con TypeScript, candidato para tareas programadas |
| Distribución | EAS Build o compilación Android local |

Separar: interfaz, acceso a proveedores, normalización, reglas, persistencia y entrega de avisos.
El servidor consulta datos por áreas reutilizables, evalúa reglas y envía avisos sin depender de que la app esté abierta.
No se necesita un servidor Express independiente además de Functions salvo necesidad concreta.
Google Sign-In nativo y React Native Firebase pueden requerir development build. Verificar estrategia SDK antes de instalar.
La cuenta Google del desarrollador administra Firebase; cada usuario inicia sesión con su propia identidad.
Autenticación, permiso GPS y consentimiento para salud son procesos distintos.

## 9. Modelo conceptual
| Entidad | Contenido |
| --- | --- |
| Usuario | Identidad Firebase y preferencias |
| Ubicación guardada | Coordenadas, localidad, zona horaria y etiqueta |
| Preferencia de alerta | Categoría, horario y configuración permitida |
| Perfil de salud | Datos voluntarios y versión del consentimiento |
| Registro de síntomas | Fecha, ubicación elegida, intensidad y nota |
| Contexto ambiental | Variables, unidades, fuente, hora y resolución |
| Alerta | Regla, severidad, zona, vigencia y evidencia |
| Entrega de alerta | Usuario, dispositivo, estado y prevención de duplicados |
| Dispositivo | Token push y consentimiento de notificación |

Diseñar colecciones e índices después de validar consultas y reglas de acceso.
No guardar una nueva copia de todo el pronóstico por usuario si puede compartirse un contexto ambiental.

## 10. Costos y publicación
Firebase Spark permite iniciar dentro de cuotas. Cloud Functions normalmente requiere Blaze y una cuenta de facturación.
Configurar presupuestos, monitoreo y límites operativos: las alertas presupuestarias no constituyen un tope automático de gasto.
Open-Meteo comercial, servicios de compilación e infraestructura pueden tener costos.
Play Console anunciaba US$25 por registro único en octubre de 2026.
Las cuentas personales nuevas alcanzadas por la regla requieren 12 testers inscritos durante 14 días continuos y solicitud de acceso a producción.
Verificar al publicar: identidad, pruebas, firma y AAB, nivel Android objetivo, política de privacidad, seguridad de datos y declaraciones aplicables a salud.
No activar facturación ni publicar durante el arranque sin autorización.

## 11. Pendientes
- Nombre definitivo, diseño y público inicial.
- Alcance exacto de primera versión y países a validar primero.
- Reglas, umbrales, fuentes y revisión del contenido sanitario.
- SDK Firebase, proveedor push y alojamiento de tareas.
- Requisitos de privacidad y política de publicación por datos de salud.
- Estrategia offline, retención y frecuencia de consultas.
- Monetización y licencia de datos compatible.

## 12. Referencias oficiales
Revalidar al implementar; estas referencias no sustituyen revisar las condiciones actuales.
- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/air-quality-api
- https://open-meteo.com/en/pricing
- https://open-meteo.com/en/terms
- https://firebase.google.com/docs/auth
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://docs.expo.dev/guides/using-firebase/
- https://docs.expo.dev/guides/google-authentication/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation
- https://pubmed.ncbi.nlm.nih.gov/37078741/
