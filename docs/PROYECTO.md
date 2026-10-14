# Proyecto Clima

Fecha base: 2026-10-09. Estado al 2026-10-13: app mínima, selección de lugares y consulta meteorológica real validadas en Android 13, incluyendo cambio de localidad, actualización, error sin conexión y recuperación. Prueba específica de permiso rechazado pendiente. Sin infraestructura configurada.
Nombre provisional: Proyecto Clima.
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
Inicio de etapa 3 el 2026-10-14: usuario aprobó el criterio experimental de viento >=40 km/h a 10 m y el aviso preventivo propuesto. Implementado como evaluación dentro de la app. Usuario verificó en Android 13 la tarjeta real de Taco Ralo y el cambio entre los cuatro escenarios ficticios (con aviso, debajo del criterio, datos faltantes y consulta vencida). Regreso y actualización/cambio de lugar sin duplicados pendientes de comprobar en teléfono; aprobación de producto y prueba de interfaz no equivalen a validación meteorológica local.

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
Solo el umbral experimental de viento está aprobado para estas pruebas; los demás umbrales siguen pendientes. Calibrarlos y revisarlos antes de ampliar avisos o entrega de notificaciones.
Combinar criterios cuando corresponda y añadir histéresis y pausas para evitar entradas y salidas repetidas.
Distinguir información, recomendación preventiva y alerta oficial. Los colores no deben hacer pasar una regla propia por aviso del SMN.
Mostrar datos vencidos y limitaciones de cobertura. La entrega de push no es una garantía de aviso inmediato.

Ejemplo ficticio de formato, no condición real:
“Se prevén ráfagas fuertes en tu ubicación durante la tarde. Asegurá objetos sueltos.”
Detalles: intervalo, valores previstos, fuente y última actualización.

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
