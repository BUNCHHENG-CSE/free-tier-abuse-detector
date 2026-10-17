const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function build() {
  const distDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('📦 Building @abuseshield/server...');

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    target: ['node20'],
    format: 'cjs',
    outfile: path.resolve(distDir, 'index.js'),
    sourcemap: true,
    external: ['node:sqlite', 'better-sqlite3', 'fsevents', 'pg', 'pg-native'],
  });

  console.log('✅ Server built successfully at dist/index.js');
}

build().catch((err) => {
  console.error('❌ Server build failed:', err);
  process.exit(1);
});
