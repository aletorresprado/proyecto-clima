const { readFileSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
try {
  const app = JSON.parse(readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
  const firebase = JSON.parse(readFileSync(path.join(root, 'google-services.json'), 'utf8'));
  const expectedProject = 'proyecto-clima-dev';
  if (firebase.project_info?.project_id !== expectedProject) throw new Error('El archivo no corresponde al proyecto Firebase de desarrollo acordado.');
  const clients = Array.isArray(firebase.client) ? firebase.client : [];
  const client = clients.find((item) => item.client_info?.android_client_info?.package_name === app.android?.package);
  if (!client || typeof client.client_info?.mobilesdk_app_id !== 'string') throw new Error('No encontramos la app Android del paquete configurado en app.json.');
  if (!Array.isArray(client.api_key) || !client.api_key.some((key) => typeof key.current_key === 'string' && key.current_key.length > 0)) throw new Error('Falta la configuración de API de la app. Descargá el archivo original desde Firebase.');
  console.log(`Firebase Android verificado: ${expectedProject}`);
  console.log(`Paquete: ${app.android.package}`);
  console.log(`Cliente OAuth web: ${client.oauth_client?.some((item) => item.client_type === 3) ? 'presente (acceso aún sin probar)' : 'pendiente de configurar'}`);
  console.log('Esta comprobación es local; no prueba acceso, reglas ni servicios de Firebase.');
} catch (error) {
  console.error(error?.code === 'ENOENT' ? 'Falta google-services.json o app.json en mobile. Guardá la configuración local antes de verificar.' : error instanceof SyntaxError ? 'El archivo de configuración no es JSON válido.' : error.message);
  process.exitCode = 1;
}
