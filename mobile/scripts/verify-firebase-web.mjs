import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readFirebaseConfig } from '../src/providers/firebase-config.ts';
try {
  process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
  const config = readFirebaseConfig(process.env);
  const android = JSON.parse(readFileSync(new URL('../google-services.json', import.meta.url), 'utf8'));
  if (config.projectId !== android.project_info?.project_id || config.appId.split(':')[1] !== android.project_info?.project_number) throw new Error('Las configuraciones Web y Android no pertenecen al mismo proyecto Firebase.');
  console.log('Configuración Web válida y consistente con el proyecto Android de desarrollo.');
  console.log('Cuatro campos completos; appId de tipo Web. No se imprimieron sus valores.');
  console.log('Verificación local; no prueba acceso ni reglas externas.');
} catch (error) {
  console.error(error?.code === 'ENOENT' ? 'Falta .env.local o google-services.json en mobile.' : error instanceof SyntaxError ? 'El archivo Android no es JSON válido.' : error.message);
  process.exitCode = 1;
}
