import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const result = spawnSync(path.join(root, 'tooling/node_modules/.bin/openspec'), process.argv.slice(2), {
  cwd: path.dirname(root), stdio: 'inherit', env: { ...process.env, OPENSPEC_TELEMETRY: '0' }
});
if (result.error) console.error('Install the pinned tooling dependencies first:', result.error.message);
process.exit(result.status ?? 1);
