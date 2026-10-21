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
  if (process.argv.includes('--require-google')) {
    // Huella pública del certificado de desarrollo administrado por EAS.
    const expectedSha1 = 'E5CB5F6E3BCEA610F24548099B3300075CC948A2';
    const oauth = Array.isArray(client.oauth_client) ? client.oauth_client : [];
    if (!oauth.some((item) => item.client_type === 3 && typeof item.client_id === 'string' && item.client_id.endsWith('.apps.googleusercontent.com'))) throw new Error('Falta el cliente OAuth web para Google. Descargá la configuración actualizada desde Firebase.');
    const matchesCertificate = oauth.some((item) => item.client_type === 1
      && item.android_info?.package_name === app.android.package
      && typeof item.client_id === 'string' && item.client_id.endsWith('.apps.googleusercontent.com')
      && typeof item.android_info?.certificate_hash === 'string'
      && item.android_info.certificate_hash.replace(/:/g, '').toUpperCase() === expectedSha1);
    if (!matchesCertificate) throw new Error('Falta el cliente OAuth Android asociado al paquete y SHA-1 de EAS. Revisá la huella en Firebase y descargá de nuevo el archivo.');
    console.log('Google: clientes Web y Android presentes; paquete y SHA-1 coinciden con la firma EAS de desarrollo.');
  }
  console.log(`Firebase Android verificado: ${expectedProject}`);
  console.log(`Paquete: ${app.android.package}`);
  console.log(`Cliente OAuth web: ${client.oauth_client?.some((item) => item.client_type === 3) ? 'presente (acceso aún sin probar)' : 'pendiente de configurar'}`);
  console.log('Esta comprobación es local; no prueba acceso, reglas ni servicios de Firebase.');
} catch (error) {
  console.error(error?.code === 'ENOENT' ? 'Falta google-services.json o app.json en mobile. Guardá la configuración local antes de verificar.' : error instanceof SyntaxError ? 'El archivo de configuración no es JSON válido.' : error.message);
  process.exitCode = 1;
}
