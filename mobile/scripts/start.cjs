const { spawn } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');

const appDirectory = path.resolve(__dirname, '..');
const cacheDirectory = path.resolve(appDirectory, '..', '.cache');
const tempDirectory = path.join(cacheDirectory, 'tmp');
const npmCacheDirectory = path.join(cacheDirectory, 'npm');
mkdirSync(tempDirectory, { recursive: true });
mkdirSync(npmCacheDirectory, { recursive: true });

const nodeOptions = process.env.NODE_OPTIONS || '';
const launchArguments = process.argv.slice(2);
const clientArguments = launchArguments.includes('--dev-client') || launchArguments.includes('--go')
  ? [] : ['--go'];
const child = spawn(
  process.execPath,
  [path.join(appDirectory, 'node_modules', 'expo', 'bin', 'cli'), 'start', ...clientArguments, '--lan', '--port', '8081', ...launchArguments],
  {
    cwd: appDirectory,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions.includes('--use-system-ca')
        ? nodeOptions
        : `${nodeOptions} --use-system-ca`.trim(),
      EXPO_NO_TELEMETRY: '1',
      npm_config_cache: npmCacheDirectory,
      TEMP: tempDirectory,
      TMP: tempDirectory,
    },
  }
);

child.on('error', (error) => {
  console.error('No se pudo iniciar Expo:', error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
// La terminal entrega Ctrl+C también a Expo; esperamos a que cierre el servidor.
process.on('SIGINT', () => {});
