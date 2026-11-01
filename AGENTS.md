# Instrucciones para Codex — Proyecto Clima

## Contexto y fuentes
- Este repositorio inicia una app Android de prevención basada en datos meteorológicos.
- Antes de actuar, leer docs/PROYECTO.md y docs/PLAN.md. Distinguir acuerdos, propuestas y pendientes.
- La documentación parte de la planificación del 9 de octubre de 2026 y registra avances posteriores. Hay una app Android en mobile; revisar docs/PLAN.md para su validación actual. Firebase Authentication y Firestore Standard en Spark están configurados; acceso y lugares guardados validados en Android. No hay facturación activada ni publicación en tienda.
- Las instrucciones actuales del usuario prevalecen. Actualizar la documentación cuando cambien decisiones.

## Forma de colaborar
- Comunicarse en español claro. El usuario conoce React y desarrollo web y está aprendiendo desarrollo móvil.
- Explicar antes de ejecutar comandos qué hacen, para qué sirven y si instalan dependencias, modifican archivos o generan costos.
- Trabajar por etapas pequeñas y verificables; no implementar todo el plan de una vez.
- Proceder con inspecciones y cambios locales reversibles autorizados, sin pedir confirmación por cada archivo.
- Si el usuario pide solo revisión o planificación, no instalar ni implementar.
- Consultar antes de activar facturación, desplegar, publicar, cambiar permisos externos o realizar acciones destructivas.
- No afirmar que algo funciona sin verificarlo. Informar comprobaciones y limitaciones relevantes.

## Base técnica
- Editor: Visual Studio Code; Antigravity no es necesario.
- Stack acordado para el arranque: React Native, Expo y TypeScript; Firebase para identidad y datos; Open-Meteo como proveedor inicial candidato.
- Usar versiones estables compatibles verificadas en documentación oficial al inicializar; no copiar números de versiones antiguos.
- Arquitectura inicial sencilla y modular: interfaz, proveedores de datos, reglas de riesgo, persistencia y notificaciones.
- Evitar microservicios, IA generativa y dependencias innecesarias.
- Separar reglas de riesgo de componentes visuales. Validar respuestas externas y unidades.
- Reglas puras y deterministas, con pruebas significativas de límites, datos ausentes, vencimiento y repetición de avisos.
- Mantener credenciales administrativas y secretos del servidor fuera de la app y de Git. Crear ejemplos de configuración sin valores reales.

## Producto y exactitud
- La app admite cualquier ubicación con cobertura, no únicamente Yerba Buena.
- Ofrecer permiso de ubicación, sugerencia de lugar y búsqueda manual. No asumir seguimiento continuo.
- Diferenciar mediciones, estimaciones de modelos, pronósticos y alertas oficiales.
- Cada aviso debe incluir lugar, intervalo de vigencia, fuente, actualización, motivo y acción sugerida.
- No inventar precisión local, probabilidades, umbrales validados o fuentes.
- Presión en hPa; no confundir instrumento barómetro con unidad. Diferenciar presión superficial y reducida al nivel del mar.
- No inferir tormenta solo por baja presión, hielo confirmado solo por temperatura del aire ni granizo confirmado solo por lluvia o CAPE.
- No presentar asociación ambiental como diagnóstico o causalidad médica.
- Mantener la hipótesis de hormigas cortadoras fuera de alertas operativas hasta validar evidencia específica.
- Datos ausentes o vencidos significan información insuficiente, no ausencia de riesgo.

## Privacidad
- Perfil de salud y diario de síntomas opcionales, separados del uso básico meteorológico.
- Requerir autenticación para guardar datos personales de salud en la nube.
- Acceso por usuario y pruebas de aislamiento de datos; Firebase Auth por sí solo no protege Firestore.
- Solicitar consentimiento específico y permitir exportación y eliminación de datos.
- No enviar síntomas a analítica, registros de errores, notificaciones visibles ni repositorios.
- Usar datos ficticios en desarrollo. Evitar recopilar datos personales que no sean necesarios.

## Continuidad
- Mantener el README.md de la raíz actualizado con las funciones, validación y próximos pasos de cada entrega, ya que es la presentación del repositorio en GitHub.
- Preferencia del usuario: cada vez que se cree un commit, subirlo también al repositorio remoto con push y verificar el resultado. No dejar commits locales pendientes de subida sin informar un bloqueo.
- Al cerrar una etapa, actualizar estado, validación y siguiente paso en docs/PLAN.md.
- Documentar las decisiones técnicas en docs/PROYECTO.md; no convertir propuestas en acuerdos sin indicarlo.
- No crear CLAUDE.md ni instrucciones para otras herramientas salvo petición explícita.
