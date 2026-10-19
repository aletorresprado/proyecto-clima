# Etapa 4 — Firebase y acceso

Revisión inicial: 2026-10-19. Diseño propuesto; sin servicios creados, paquetes instalados ni facturación activada.
Actualización de entorno informada por el usuario: cuenta Expo creada y proyecto Firebase de desarrollo con ID proyecto-clima-dev creado desde consola. No se verificó la configuración externa; Authentication/Firestore no se han integrado. Proyecto EAS todavía sin vincular. El encabezado anterior describe el inicio de la revisión.
Vinculación verificada el 2026-10-19: EAS @aletorresprado/proyecto-clima, ID df17173d-6b25-496b-898c-c3ed2c117e6d. Sesión personal aletorresprado verificada; usuario autorizó avanzar tras elegir esa cuenta. eas init --account aletorresprado --non-interactive creó y vinculó el proyecto, registrado en mobile/app.json (owner y extra.eas.projectId). eas project:info confirmó nombre e ID. No se ejecutaron builds ni se activó facturación. EAS CLI se usó con npx y caché en D, sin dependencia global ni de la app. Las notas anteriores de vínculo pendiente son históricas.

## Acuerdos previos

- Firebase Authentication y Cloud Firestore; acceso con la cuenta Google de cada usuario.
- Consulta meteorológica básica sin cuenta. Rechazar ubicación o cancelar acceso no bloquea la búsqueda manual.
- Salud y síntomas fuera de esta etapa: requieren alcance, consentimiento y controles propios.
- Cambios de servicios externos, facturación y publicación requieren autorización. Cada commit se acompaña de push; mantener README.

## Revisión técnica

- La app actual usa Expo SDK 57, React Native 0.86.3 y React 19.2.3; Firebase y EAS no están configurados. Falta definir android.package y una URL scheme propia.
- Firebase JS SDK admite Auth/Firestore en React Native y Expo Go. Expo exige firebase >=12; seleccionar versión estable compatible al instalar, sin tomar esta cifra como versión exacta fijada.
- El acceso Google nativo descrito por Expo necesita código nativo y una development build. Expo Go por sí solo no valida ese acceso. La app seguirá usando Metro durante el desarrollo con una compilación propia instalada en el teléfono.
- Propuesta: Firebase JS SDK para Auth/Firestore, persistencia de sesión local y proveedor nativo de Google separado del resto de la app. Evitar añadir React Native Firebase sin una necesidad concreta de sus módulos nativos.
- Biblioteca Google pendiente: revisar compatibilidad con SDK 57/RN 0.86 y Credential Manager antes de elegir. La guía Expo distingue react-native-nitro-google-signin y @react-native-google-signin/google-signin; no asumir que todas las variantes son gratuitas o equivalentes.
- Compilación pendiente: EAS Build o herramientas Android locales. No se encontraron java/adb en PATH en esta revisión; no descarta otras instalaciones. La consulta de espacio de discos no devolvió valores utilizables; no se afirma espacio disponible. Considerar la limitación previa de C antes de descargar SDK/Java/emuladores. Revisar cuotas/precios y autorización antes de enviar código a un servicio de compilación.

## Entregas propuestas

1. Preparar configuración de ejemplo sin valores reales, interfaces de sesión y datos, y estrategia de compilación. Confirmar identificador Android y entorno Firebase de desarrollo separado de producción.
2. Configurar Google/Firebase con autorización y crear una compilación de desarrollo. Probar acceso, cancelación, error, restauración de sesión y cierre. No guardar tokens en Firestore ni imprimirlos en logs.
3. Probar reglas Firestore con emuladores y usuarios ficticios antes de habilitar datos personales en nube. Preparar Java/CLI solo después de verificar requisitos y almacenamiento local.
4. Habilitar lugares guardados y preferencias con reglas verificadas. Probar dos usuarios y reinicio de sesión sin mezclar datos. No guardar ubicación automáticamente: acción explícita del usuario y opción de eliminar cada lugar.

## Modelo inicial propuesto

| Ruta | Datos mínimos | Acceso |
| --- | --- | --- |
| users/{uid}/locations/{locationId} | Nombre elegido, latitud, longitud, zona horaria opcional y fecha de actualización | Solo usuario con request.auth.uid == uid |
| users/{uid}/preferences/main | Preferencias seleccionadas, sin salud ni síntomas | Solo usuario con request.auth.uid == uid |

No guardar correo, foto o nombre de Google en Firestore si la interfaz puede obtenerlos de Authentication. No duplicar pronósticos por usuario. Campos, límites y consultas se definirán antes de escribir las reglas. Rechazar campos desconocidos, coordenadas inválidas y acceso a otras rutas; no usar modo de prueba público. Authentication identifica al usuario, las reglas autorizan cada lectura/escritura.

## Comprobaciones necesarias

- Clima y sismos siguen disponibles con sesión cerrada o acceso cancelado.
- Usuario A no puede leer, listar, crear, editar ni eliminar datos de B; usuario no autenticado tampoco.
- Escrituras inválidas son rechazadas por reglas, no solo por validación de la app.
- Al cerrar/cambiar sesión se limpian estado y suscripciones de usuario; no mostrar datos de la cuenta previa.
- Datos de prueba ficticios. Exportación/eliminación de cuenta y datos debe resolverse antes de ofrecer persistencia personal como función pública; no recopilar salud en este paso.

## Próximas decisiones y acceso externo

- Firebase proyecto-clima-dev informado por usuario; proyecto EAS vinculado y verificado. Próximo paso: confirmar identificador Android y elegir biblioteca Google compatible antes de registrar app/configurar acceso y preparar development build. No compartir contraseñas, tokens ni claves administrativas.
- Identificador Android aprobado por usuario y aplicado en mobile/app.json: com.aletorresprado.proyectoclima. expo config verificó la configuración resuelta. Próximo paso manual: registrar app Android en Firebase proyecto-clima-dev con exactamente ese paquete, alias Proyecto Clima Android Dev. SHA-1 pendiente de certificado real de compilación; no inventar valores. Descargar google-services.json sin editar Gradle manualmente; integración del archivo y biblioteca Google se harán después. No se afirma registro Firebase completado.
- Elegir método de compilación y revisar biblioteca Google compatible. La primera visita externa será a Firebase Console, solo para inspeccionar/crear el entorno acordado con instrucciones precisas.
- Inicio propuesto en Spark, dentro de sus cuotas; verificar condiciones actuales antes de crear servicios. No activar Blaze, Functions, Storage, Analytics ni publicar en Play como parte de este diseño.

## Fuentes oficiales revisadas

- https://docs.expo.dev/guides/using-firebase/
- https://docs.expo.dev/guides/google-authentication/
- https://docs.expo.dev/build/introduction/
- https://firebase.google.com/docs/emulator-suite/install_and_configure
- https://firebase.google.com/docs/firestore/security/rules-conditions
