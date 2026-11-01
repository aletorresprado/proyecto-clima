# Preparación local de Firestore

Estado al 2026-11-01: reglas compiladas y nueve grupos de pruebas correctos en el
emulador oficial. No se creó Firestore en nube ni se desplegaron reglas. La app
todavía no lee ni escribe lugares guardados.

## Herramientas y ejecución local

Herramientas instaladas y comprobadas en D el 2026-11-01 tras retomar la tarea.
Las solicitudes no autorizadas del 29 de octubre quedan como antecedente histórico.

Dependencias separadas de la app en `package.json`: firebase-tools 15.34.2,
@firebase/rules-unit-testing 6.0.0 y firebase 13.0.0; versiones consultadas en npm.
El lanzador espera Java 21+ portátil en `../.cache/java/temurin21/` (directamente
o en una subcarpeta extraída), o una ruta explícita en `FIREBASE_TEST_JAVA_HOME`.
Java usado: Temurin JRE 21.0.13+9 LTS portátil; checksum SHA-256 verificado antes
de extraer: `2332c0b4cff6bed722da3567c91d5e47568bcba863fa4945d0a8d6fc76158628`.
Descarga oficial: https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.13%2B9
El runtime no se versiona; al preparar otro equipo verificar su descarga oficial.

Con las herramientas preparadas, ejecutar desde `firebase/`:

```powershell
npm.cmd test
```

El lanzador aplica Java/PATH/TEMP solo al proceso, guarda emuladores en D mediante
`FIREBASE_EMULATORS_PATH` y ejecuta únicamente Firestore con proyecto fijo
`demo-proyecto-clima`. Puertos loopback: Firestore 8085, hub 4405 y logs 4505;
websocket adicional 9150 e interfaz web desactivada. No usa el proyecto real ni despliega reglas. El SDK de
pruebas se niega a ejecutar si no recibe `FIRESTORE_EMULATOR_HOST=127.0.0.1:8085`.
Se confirmó escucha en loopback y apagado de los cuatro puertos al finalizar.

El lanzador transmite solo variables necesarias del sistema, sin heredar claves,
tokens o DEBUG de la terminal. Diagnóstico CLI en `../.cache/firebase-debug`,
configuración CLI aislada en `../.cache/firebase-config`; logs Java ignorados
por Git. `firebase/` se excluye del paquete EAS de la app. No publicar logs.
La instalación npm informó 21 hallazgos (16 moderados y 5 altos) en las herramientas
de prueba, separadas de la app; no se aplicaron correcciones forzadas.

## Contrato inicial

Ruta propuesta: `users/{uid}/locations/{locationId}`, con ID de documento generado,
sin correo ni coordenadas en la ruta. El guardado será una acción explícita.

- `label`: nombre del lugar, entre 1 y 160 caracteres; el cliente recorta espacios.
- `latitude`: número finito entre -90 y 90.
- `longitude`: número finito entre -180 y 180.
- `createdAt`, `updatedAt`: timestamps de servidor; creación inmutable al editar.

No admitir campos adicionales. Listas paginadas de hasta 20 documentos; eso limita
el tamaño de cada consulta, no el total guardado ni el consumo de la cuenta.
Preferencias quedan para otro incremento. No persistir GPS automáticamente, tokens,
perfil Google, salud ni pronósticos en estos documentos.

## Cobertura probada en el emulador

Se usó proyecto local `demo-proyecto-clima`, usuarios ficticios A y B y contexto
sin sesión. Emulador cloud-firestore-emulator-v1.22.0; nueve grupos pasaron y el
emulador se apagó automáticamente. El ajuste del entorno se verificó con otra
ejecución completa, también correcta.

1. A puede crear, leer, listar, editar y borrar sus lugares válidos.
2. A no puede obtener, listar, crear, editar ni borrar lugares de B.
3. Sin sesión no se permite ninguna de esas operaciones.
4. Rechazar campos extra o faltantes, tipos erróneos, coordenadas fuera de rango,
   nombre vacío/largo, fechas de cliente y cambios de fecha de creación.
5. Admitir extremos geográficos y cero; probar timestamps del servidor al crear y editar.
6. Rechazar listas sin límite o mayores que 20 y accesos a todas las demás rutas.

Las pruebas del validador TypeScript no comprueban autorización ni sintaxis de reglas.
La aplicación todavía no importa el validador ni usa Firestore. Antes de conectar
nube falta preparar integración y UI, limpiar estado/suscripciones al cambiar
de cuenta, y autorizar creación de base/región/despliegue con las mismas reglas.
La validación del emulador no demuestra que haya reglas desplegadas en producción.

Referencias oficiales:
- https://firebase.google.com/docs/firestore/security/rules-fields
- https://firebase.google.com/docs/firestore/security/test-rules-emulator
