# Proyecto Clima

App Android para consultar el clima y organizar actividades con recomendaciones preventivas comprensibles. Desarrollada con React Native, Expo SDK 57 y TypeScript.

**Estado al 21 de octubre de 2026:** alcance inicial de etapa 3 completado. Condiciones actuales, pronóstico de 24 horas, viento, UV, precipitación, visibilidad y variación de presión validados funcionalmente en un teléfono Android 13 con Expo Go. Monitoreo de eventos sísmicos recientes integrado y probado con consultas reales y escenarios ficticios.

**Etapa 4:** pantalla de cuenta opcional validada en Expo Go (abrir, regresar y consultar clima sin sesión). Acceso Google/Firebase preparado, OAuth y firma Android verificados localmente. Firebase Spark y Expo Free confirmados; uso EAS informado: 0 builds. La primera compilación Android y las pruebas reales de acceso, persistencia y cierre quedan pendientes para retomar el 22 de octubre. No se ejecutaron builds ni se activaron cobros.

## Funciones disponibles

| Función | Alcance actual |
| --- | --- |
| Ubicación | Ubicación puntual con permiso y confirmación, o búsqueda manual de localidades con Open-Meteo/GeoNames. |
| Clima | Condiciones actuales estimadas y próximos 24 puntos horarios: temperatura en °C, viento en km/h y presión reducida al nivel del mar en hPa. Fuente, consulta y horarios visibles. |
| Viento | Recomendación experimental desde 40 km/h de viento previsto a 10 m. No evalúa ráfagas ni usa un umbral local calibrado. |
| Índice UV | Protección recomendada desde UV 3 y mensaje reforzado desde UV 8, con referencia de la OMS. |
| Precipitación | Criterio práctico propio desde 50 % de probabilidad. Porcentaje y cantidad en mm separados, con inicio y fin de cada intervalo horario completo futuro. |
| Visibilidad | Recomendación experimental para valores previstos menores de 1.000 m; muestra mínimo y horas, sin confirmar niebla ni condiciones de una carretera concreta. Validada funcionalmente en Android. |
| Variación de presión | Compara la presión prevista al nivel del mar entre dos horas separadas por 3 h, con diferencia en hPa. Información de contexto, sin alertas de tormenta ni conclusiones de salud. Validada funcionalmente en Android. |
| Sismos recientes | Eventos publicados por USGS de las últimas 24 horas, en un radio aproximado de 200 km alrededor del teléfono. Consulta cada 2 minutos tras completar el ciclo, solo con la app activa; controles para iniciar y detener. |
| Pruebas ficticias | Pantallas de desarrollo separadas para viento, UV, precipitación, visibilidad, presión y repetición/persistencia de eventos sísmicos. |

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

`npm.cmd start` mantiene explícitamente Expo Go. Se agregó `npm.cmd run start:dev` para cuando esté instalada nuestra compilación de desarrollo; el perfil APK está preparado en `mobile/eas.json`, pero todavía no se creó esa compilación.

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
npm.cmd run test:visibility
npm.cmd run test:pressure
npm.cmd run test:earthquakes
npm.cmd run test:account
npm.cmd run test:firebase-config
npm.cmd run verify:firebase-web
npm.cmd run verify:firebase-android
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir .expo/export-check
```

Ejecutar desde `mobile`. Incremento de presión: TypeScript, **60 pruebas automatizadas**, bundle Android y validación funcional en teléfono correctos. Las pruebas cubren límites, unidades, datos ausentes, vencimiento, intervalos y persistencia/deduplicación de IDs.

La exportación comprueba el bundle, no genera una app publicable. En Android 13 se verificaron navegación, actualización y cambio de localidad, errores de conexión y recuperación, permisos y escenarios ficticios. La persistencia sísmica se probó con eventos ficticios aislados; no se verificó la recepción de un sismo real cercano.

`verify:firebase-android` requiere el archivo local ignorado `mobile/google-services.json`; verifica proyecto/paquete sin imprimir claves. En una copia sin configuración local este comando informará que falta el archivo. No prueba autenticación ni reglas de Firebase. Preparación de etapa 4 comprobada con expo-dev-client 57.0.20 y parches compatibles del SDK 57 (expo 57.0.30, router 57.0.28 y @expo/ui 57.0.25).

Las variables de caché y temporales se aplican solo a la terminal actual. Se usan en este equipo porque C no tenía espacio libre; no cambian la configuración global ni la política de scripts.

## Uso de datos y privacidad

Antes de elegir un lugar se muestra una demo explícitamente ficticia. La búsqueda y consulta meteorológica requieren acciones del usuario; se informa el envío de texto o coordenadas al proveedor. El monitoreo sísmico se activa por separado y consulta la ubicación del teléfono en cada ciclo, independientemente de la localidad elegida para el clima. No usa seguimiento en segundo plano.

AsyncStorage guarda únicamente IDs sísmicos vistos para evitar repetir avisos; el historial ficticio usa otra clave. La app no persiste las coordenadas ni recopila datos de salud. Firebase JS instalado y configuración local validada. Sin autenticación integrada, push ni facturación activada.

Fuentes: [Open-Meteo](https://open-meteo.com/en/docs), [Open-Meteo/GeoNames](https://open-meteo.com/en/docs/geocoding-api), [USGS](https://earthquake.usgs.gov/fdsnws/event/1/), [OMS para UV](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index) y [NWS como referencia descriptiva de viento](https://www.weather.gov/tbw/beaufort). Uso inicial no comercial de Open-Meteo, con atribución CC BY 4.0; revisar condiciones antes de monetizar.

## Próximos pasos

La **etapa 4 está en preparación**: [Firebase y acceso](docs/ETAPA-4.md), preservando la consulta meteorológica sin cuenta. La app está vinculada al [proyecto Expo](https://expo.dev/accounts/aletorresprado/projects/proyecto-clima), con identificador Android `com.aletorresprado.proyectoclima`. Firebase proyecto-clima-dev tiene su configuración Android validada localmente; SDK JS 13.0.0 instalado con inicialización explícita preparada; Auth/Firestore y acceso Google aún sin integrar. expo-dev-client y perfil de compilación preparados, sin APK creado ni facturación activada. Registro Web completado y validado. Próximo paso: persistencia Auth y proveedor Google para la development build. Perfil de salud, notificaciones con la app cerrada y publicación pertenecen a etapas posteriores.

## Avance del 19 de octubre: configuración Firebase Web

El usuario guardó mobile/.env.local. npm.cmd run verify:firebase-web verificó los cuatro campos y que la app Web corresponde al mismo proyecto Android, sin imprimir valores. El archivo está ignorado por Git; mobile/.env.example contiene solo la plantilla. Tres pruebas ficticias verifican campos ausentes, proyecto/dominio incorrectos y confusión entre appId Web y Android.

Se preparó getFirebaseClient con inicialización explícita y reutilización de instancia. Todavía no se conecta a la pantalla ni implementa Auth, persistencia de sesión o Firestore. Instalado Firebase 13.0.0; TypeScript, 63 pruebas y expo install --check correctos. Próximo paso: preparar persistencia Auth y elegir el proveedor Google compatible antes de la primera development build. Sin nuevas activaciones externas ni facturación.

Auditoría del incremento: instalación informó 33 hallazgos (11 moderados, 22 altos); consulta independiente posterior informó 71 dependencias afectadas (9 moderadas, 62 altas), incluidas cadenas de Expo/React Native y Firebase. Pendiente revisión antes de distribuir; sin correcciones forzadas. No se probó acceso Google ni persistencia de sesión en teléfono.
## Avance del 20 de octubre: preparación de sesión

Retomado desde 663d5dc, sin cambios locales previos. Implementados getFirebaseSessionAuth y restoreFirebaseSession, con inicialización explícita, espera de authStateReady y reutilización de la instancia durante Fast Refresh. Android/iOS usan getReactNativePersistence con AsyncStorage existente; web usa browserLocalPersistence. No se agregaron dependencias. El módulo todavía no se importa desde las pantallas: no se inicia Auth al consultar clima o sismos.

Firebase 13 incluye getReactNativePersistence en su entrada nativa, pero sus tipos públicos no la exportan. Se agregó una declaración acotada en src/types/firebase-auth-native.d.ts, sin modificar node_modules; revisar al actualizar Firebase. Referencia: https://firebase.google.com/docs/reference/js/auth .

Verificación local: TypeScript y 63 pruebas correctos. Las pruebas existentes cubren reglas, proveedores y configuración; no prueban restauración real de una sesión Auth. Pendientes: seleccionar biblioteca Google/Credential Manager compatible, configurar acceso con autorización y crear development build; luego verificar acceso, cancelación, error, restauración tras cerrar/reabrir y cierre de sesión en Android 13. Sin Firestore, servicios nuevos, facturación ni datos de salud. No se generó APK ni se afirma prueba nativa de este incremento.
## Acuerdo de costos y preparación Google — 2026-10-20

Acuerdo del usuario: desarrollar dentro de planes gratuitos; Firebase Spark, sin Blaze ni cuenta de facturación vinculada por este trabajo. Expo/EAS gratuito dentro de sus cuotas; al agotarlas evaluar esperar o compilación local antes de contratar. Google Play postergado hasta decidir publicar; tarifa de registro única de USD 25 según condiciones consultadas. No asumir que el consumo futuro estará por debajo de las cuotas. Plan Spark y cuota EAS disponibles pendientes de confirmación en consola antes de usar servicios.

Selección técnica para preparación local: react-native-nitro-google-signin 2.0.0 con react-native-nitro-modules 0.37.1, versiones fijas de la línea documentada compatible con RN 0.86. Licencia MIT y Credential Manager sin variante de pago. npm publica también 2.3.0, cuya combinación no se adopta automáticamente porque la matriz consultada describe 2.0.x. Referencias: https://docs.expo.dev/guides/google-authentication/ y https://react-native-nitro-google-sign-in.github.io/docs/getting-started/compatibility/ . Compatibilidad declarada no equivale a APK validado.

Pendiente: configurar plugin y archivo Android, obtener certificado real/SHA-1, habilitar proveedor Google con autorización y actualizar OAuth; después primera development build y pruebas en Android 13. No se ejecuta build ni se activa proveedor externo en esta entrega. Expo Go conserva su flujo meteorológico; Google requiere development build. No se recopilan datos personales nuevos.
Resultado local del incremento Google: instalados 2.0.0 y 0.37.1; plugin agregado a mobile/app.json y android.googleServicesFile conectado al archivo local ignorado. getConfig de Expo resolvió el plugin; TypeScript, 63 pruebas y verify:firebase-android correctos. Cliente OAuth web aún ausente. El script validate-compatibility.js citado por la documentación actual no viene en el paquete 2.0.0: no se ejecutó esa validación y no se afirma compatibilidad nativa comprobada. npm informó 34 hallazgos (11 moderados, 23 altos); pendiente revisión de auditoría ya registrada, sin audit fix forzado. Cambios locales sin commit en esta entrega.

Próximo paso inmediato del usuario: abrir Firebase Console, seleccionar proyecto-clima-dev y confirmar que el plan mostrado sea Spark. Solo inspección; no pulsar Actualizar ni vincular facturación. Después preparar certificado/SHA-1 y configuración Google, con autorización antes de cambios externos. La primera compilación EAS solo se considerará dentro de cuota gratuita disponible.
Confirmación del usuario — 2026-10-20: Firebase Console muestra Spark / Sin costo en proyecto-clima-dev. Confirmación visual informada por el usuario; no es una consulta remota automatizada. No se activó Blaze ni facturación. Próximo cambio externo propuesto: habilitar únicamente Google en Firebase Authentication, con correo de soporte elegido por el usuario; requiere autorización antes de aplicarlo. Certificado/SHA-1 y cuotas EAS siguen pendientes. Referencia: https://firebase.google.com/docs/auth/android/google-signin .
2026-10-20: tras autorización explícita, el usuario confirmó Google habilitado en Firebase Authentication. Confirmación informada desde consola, aún sin prueba de acceso real. Spark previamente confirmado. Próximo paso: descargar google-services.json actualizado de la app Android com.aletorresprado.proyectoclima, reemplazar la copia local ignorada y verificar presencia de cliente OAuth web sin imprimir valores. Certificado/SHA-1 continúa pendiente; el archivo puede requerir otra actualización después de registrar esa huella. Sin build, Firestore ni facturación activada por este trabajo.
2026-10-20 — Configuración Google actualizada y verificada: el usuario reemplazó mobile/google-services.json. verify:firebase-android pasó para proyecto-clima-dev y com.aletorresprado.proyectoclima, con cliente OAuth web presente. verify:firebase-web pasó y confirmó coherencia Web/Android sin imprimir valores. git check-ignore confirmó exclusión de google-services.json y .env.local. Estos resultados reemplazan el estado previo de OAuth web ausente. Siguiente paso: obtener certificado real y SHA-1, registrarlo en Firebase con autorización y verificar configuración antes de la primera development build dentro de cuota gratuita. Acceso Google y restauración/cierre de sesión todavía no probados en teléfono. Sin compilaciones ni cambios externos en esta comprobación.
Preparación de firma Android — 2026-10-20: no se encontraron java, keytool ni adb en PATH (no descarta otras instalaciones). Propuesta: gestionar la clave de firma Android en EAS y obtener su SHA-1 mediante eas credentials --platform android, sin ejecutar eas build. Reutilizar una credencial existente si la hay; no reemplazar ni eliminar claves. Antes de crear/almacenar una credencial nueva en Expo se consultará al usuario. No se requiere cuenta Google Play para este paso. Antes del primer build sigue pendiente comprobar plan Free y cuota EAS disponible. No se ha generado certificado en esta revisión.
Consulta EAS verificada — 2026-10-20: eas-cli 25.2.0 credentials --platform android seleccionó perfil development y mostró proyecto proyecto-clima, paquete com.aletorresprado.proyectoclima y No credentials set up yet. Se salió sin seleccionar acciones de creación. No existe credencial Android configurada en EAS según esta consulta. Siguiente paso sujeto a autorización: generar y almacenar keystore Android administrado por EAS, obtener SHA-1 y guiar registro en Firebase; no ejecutar build en ese paso. EAS CLI se descargó a caché D mediante npx, sin dependencia global ni de la app.
Firma Android creada — 2026-10-20: con autorización explícita del usuario, EAS CLI 25.2.0 generó en la nube un keystore JKS y lo almacenó como credencial predeterminada de com.aletorresprado.proyectoclima (proyecto EAS proyecto-clima, perfil development). Se verificó la confirmación Created keystore y la ficha de credenciales. Huella pública SHA-1: E5:CB:5F:6E:3B:CE:A6:10:F2:45:48:09:9B:33:00:07:5C:C9:48:A2. No se descargó la clave privada ni contraseñas, no se ejecutó EAS Build ni se activó plan pago. Se salió del gestor después de consultar la huella.

Siguiente paso del usuario: Firebase Console > Configuración del proyecto > General > app Android com.aletorresprado.proyectoclima > agregar huella SHA-1 indicada y guardar; volver a descargar google-services.json actualizado y reemplazar únicamente mobile/google-services.json. Luego verificar cliente OAuth Android asociado a esta huella además del cliente web. La presencia de certificado en EAS todavía no demuestra acceso Google funcionando; primera development build y pruebas reales pendientes, solo dentro de cuota gratuita verificada. Revisar respaldo seguro del keystore antes de distribuir, fuera de Git.
2026-10-20 — Firma y OAuth verificados localmente: tras registrar SHA-1 en Firebase, el usuario reemplazó google-services.json. Pasaron verify:firebase-web y verify:firebase-android. Se amplió este último con --require-google: exige cliente OAuth web y cliente Android con paquete configurado y huella pública del certificado EAS de desarrollo. npm.cmd --prefix mobile run verify:firebase-android -- --require-google pasó sobre el archivo actualizado. git check-ignore confirmó que .env.local y google-services.json siguen fuera de Git. No demuestra acceso real ni valida permisos externos por red.

Próximo incremento: preparar pantalla de cuenta opcional y adaptador Google/Firebase (entrada explícita, cancelación, error y cierre), conservando uso meteorológico sin cuenta y Expo Go. Después revisar plan/cuota EAS gratuitos y preparación de configuración para build antes de solicitar primera compilación. Ningún APK generado todavía. Actualizar la huella esperada del verificador si se adopta otro certificado; no representa la firma futura de Google Play.
## Pantalla de cuenta opcional — 2026-10-20

Implementada ruta /account y enlace desde Inicio. En Expo Go o fuera de Android informa que Google requiere la app de desarrollo, sin inicializar Firebase Auth ni cargar el módulo Google nativo. En Android propio restaura sesión al visitar Cuenta, espera authStateReady, observa cambios y permite entrada explícita con presentExplicitSignIn. Configuración nativa autoDetect usa cliente OAuth del archivo Android. Sin acceso silencioso a Google, scopes adicionales ni offlineAccess.

Token Google se entrega a signInWithCredential de Firebase; no se imprime, no se guarda manualmente ni se envía a Firestore. Cancelación conserva uso sin cuenta. Se bloquean pulsaciones simultáneas; observador se retira al salir. Al cerrar, Firebase se cierra primero y luego se limpia sesión Google; si esa limpieza falla se informa por separado. La pantalla explica identificación/persistencia local y que aún no se sincronizan lugares o preferencias. Salud fuera del alcance. Se muestran nombre/correo solo en Cuenta, sin registro en logs.

Verificación: rutas regeneradas con herramienta instalada de Expo Router, TypeScript correcto, 67 pruebas correctas (4 nuevas sobre respuestas/cancelación y mensajes sin filtración), exportación Android local correcta (1324 módulos). No APK ni build EAS. No se afirma restauración nativa, inicio o cierre reales verificados. Auditoría pendiente según registros anteriores.

Prueba inmediata pendiente en Expo Go: desde Inicio abrir Tu cuenta, comprobar explicación de acceso en app Android de desarrollo sin error de módulo nativo, volver al clima y comprobar consulta habitual. Luego revisar plan Free/cuota EAS y configuración de archivos para primera development build autorizada. En APK probar: entrar, cancelar, fallo de conexión y recuperación, salir/volver, cerrar/reabrir app conservando sesión, cerrar sesión y reiniciar sin cuenta; confirmar clima sin cuenta. Cambios aún sin commit; al crear uno se hará push y verificación remota.
Validación del usuario en Android 13 / Expo Go — 2026-10-20: abrió Tu cuenta · acceso opcional, pudo regresar y confirmó consulta manual por localidad a demanda funcionando. Navegación de Cuenta y continuidad meteorológica sin sesión validadas en el teléfono. No equivale a prueba de inicio Google, persistencia o cierre: esas verificaciones requieren el APK de desarrollo. Próximo paso: comprobar plan Free y cuota de builds Android en la cuenta personal Expo aletorresprado; luego preparar archivos/configuración y revisar cambios antes de autorizar la primera development build. Sin compilación EAS ni facturación nueva en esta entrega.
Preparación de envío EAS — 2026-10-20: usuario confirmó Current plan Free, 15 Android y 15 iOS builds. Esto confirma plan y cupo anunciado, no saldo restante del período. Se consultó al usuario por consumo/saldo. Sin EAS Build iniciado.

Agregadas .easignore en raíz del repositorio y mobile para preparar envío desde ambas raíces: excluyen dependencias, cachés, artefactos, archivos env generales y credenciales privadas; excepciones exactas para mobile/google-services.json y mobile/.env.local (o rutas relativas a mobile). Git sigue ignorando ambos archivos reales. Verificación local con parser ignore pasó para inclusiones y exclusiones representativas; .env.local contiene únicamente los cuatro campos Firebase de cliente previstos, sin imprimir valores. No se generó ni inspeccionó todavía un archivo de envío EAS real. La autorización de un build incluirá explícitamente enviar estos archivos de cliente a Expo; no hubo envío en esta preparación. Nunca agregar secretos administrativos a esos archivos.

Próximo paso: confirmar cuota Android restante, revisar archivo de envío real local y solicitar autorización de primera development build interna Android, dentro de plan Free, sin publicar en Play ni habilitar cobros. Google y persistencia reales siguen pendientes de APK. Cambios locales aún sin commit.
2026-10-20 — Cuota Free confirmada por usuario: Usage muestra Total builds 0/30, Android builds 0 e iOS builds 0; junto al cupo del plan 15 Android/15 iOS indica disponibilidad para la primera compilación. No se consumió build en esta revisión.

Inspección local EAS realizada con eas-cli 25.2.0 build:inspect --platform android --stage archive --profile development. Primer intento falló por temporal dentro del repositorio (EINVAL, copia sobre sí mismo). Segundo intento correcto usando TEMP/TMP solo del proceso en D:\Trabajo-Ale\Proyecto-clima-eas-tmp, carpeta creada con aprobación de ejecución. Copia de revisión en .cache/eas-archive-review-20261020-2. Incluye código Cuenta, lockfile y copias idénticas de configuración Firebase Web/Android; excluye node_modules, .cache, .expo, claves privadas y credentials.json. La copia de inspección retiene 28 archivos de metadatos Git; no afirmar exclusión total de .git en esta etapa. No se imprimieron valores de configuración. No hubo subida a EAS Build ni compilación.

Siguiente acción concreta a autorizar: npx.cmd eas-cli@25.2.0 build --platform android --profile development, usando temporal separado en D y firma existente. Enviará código/configuración de cliente a Expo y consumirá un build Android de la cuota Free; genera APK interno de desarrollo, sin publicar en Play ni activar plan pago. Si el servicio exige pago o falta cuota, detener. Acceso Google real, persistencia y cierre se validarán después de instalar APK. Registrar y resolver cualquier fallo nativo antes de consumir otra compilación.
Cierre del 2026-10-21 por pedido del usuario: guardar avances con commit y push; retomar la compilación Android de desarrollo el 2026-10-22. Navegación de Cuenta y consulta meteorológica manual validadas por usuario en Android 13/Expo Go. Últimas comprobaciones locales: TypeScript, 67 pruebas y bundle Android correctos; configuración Firebase y OAuth/SHA-1 verificados, paquete EAS inspeccionado localmente. Acceso Google real, restauración y cierre pendientes de APK. No iniciar EAS Build durante este cierre; autorización específica de la primera compilación sigue pendiente. Mantener Spark/Free, comprobar vigencia de cuota antes de compilar y usar temporal separado en D. Configuraciones reales y claves privadas excluidas de Git. El commit de cierre se acompaña de push y verificación de coincidencia remota.
