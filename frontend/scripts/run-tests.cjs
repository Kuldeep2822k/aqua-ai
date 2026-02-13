const { spawnSync } = require('child_process');

const result = spawnSync('npx vitest run', {
  stdio: 'inherit',
  shell: true,
});
if (result.error) {
  console.error('Failed to spawn npx vitest run', result.error);
}
process.exit(result.status ?? 1);
