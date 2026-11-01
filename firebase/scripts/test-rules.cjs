const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const workspace = path.join(root, 'firebase');
const javaRoot = process.env.FIREBASE_TEST_JAVA_HOME || path.join(root, '.cache', 'java', 'temurin21');
let javaHome = javaRoot;
if (!fs.existsSync(path.join(javaHome, 'bin', 'java.exe')) && fs.existsSync(javaRoot)) {
  const directory = fs.readdirSync(javaRoot, { withFileTypes: true }).find((entry) =>
    entry.isDirectory() && fs.existsSync(path.join(javaRoot, entry.name, 'bin', 'java.exe')));
  if (directory) javaHome = path.join(javaRoot, directory.name);
}
const java = path.join(javaHome, 'bin', 'java.exe');
const cli = path.join(workspace, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
if (!fs.existsSync(java) || !fs.existsSync(cli)) {
  console.error('Faltan Java 21 portátil o las dependencias locales de firebase/. No se inició ningún servicio.');
  process.exit(1);
}
const check = spawnSync(java, ['-version'], { encoding: 'utf8', windowsHide: true });
const major = Number(`${check.stdout || ''}${check.stderr || ''}`.match(/version "(\d+)/)?.[1]);
if (check.status !== 0 || major < 21 || !Number.isFinite(major)) {
  console.error('Se requiere Java 21 o superior para las pruebas.');
  process.exit(1);
}
const temporary = path.join(root, '.cache', 'tmp');
fs.mkdirSync(temporary, { recursive: true });
// La CLI puede escribir el entorno del subproceso en sus logs de diagnóstico.
// Pasar solo lo necesario; no heredar tokens, claves, DEBUG ni configuración real.
const inherited = {};
for (const key of ['SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'SYSTEMDRIVE',
  'USERPROFILE', 'APPDATA', 'LOCALAPPDATA']) {
  if (process.env[key]) inherited[key] = process.env[key];
}
const env = {
  ...inherited,
  NODE_OPTIONS: '--use-system-ca',
  JAVA_HOME: javaHome,
  PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
  TEMP: temporary,
  TMP: temporary,
  FIREBASE_EMULATORS_PATH: path.join(root, '.cache', 'firebase-emulators'),
  FIREBASE_CLI_DISABLE_TELEMETRY: '1',
  FIREBASE_DEBUG_PATH: path.join(root, '.cache', 'firebase-debug'),
  XDG_CONFIG_HOME: path.join(root, '.cache', 'firebase-config'),
  GOOGLE_CLOUD_PROJECT: 'demo-proyecto-clima',
  GCLOUD_PROJECT: 'demo-proyecto-clima',
};
// Proyecto demo y selección de emulador fijos: este lanzador no despliega ni usa nube.
const result = spawnSync(process.execPath, [cli, 'emulators:exec', '--project', 'demo-proyecto-clima',
  '--non-interactive', '--only', 'firestore', '--config', path.join(workspace, 'firebase.json'),
  'node --test --test-reporter=spec tests/firestore.rules.test.mjs'], {
  cwd: workspace, env, stdio: 'inherit', windowsHide: true,
});
if (result.error) console.error('No se pudieron iniciar las pruebas locales.');
process.exit(result.status ?? 1);
