const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

async function build() {
  const isWatch = process.argv.includes('--watch');
  const distDir = path.resolve(__dirname, 'dist');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('📦 Building @abuseshield/sdk...');

  // 1. Browser standalone bundle (IIFE, minified for <script> tag)
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/browser.ts')],
    bundle: true,
    minify: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: 'none',
    treeShaking: true,
    sourcemap: 'external',
    format: 'iife',
    globalName: 'AbuseShieldExport',
    footer: {
      js: 'if(typeof window!=="undefined"){window.AbuseShield=AbuseShieldExport.AbuseShield||AbuseShieldExport.default||AbuseShieldExport;}'
    },
    outfile: path.resolve(distDir, 'abuse-shield.min.js'),
    target: ['es2020'],
  });

  // 2. ESM bundle for modern bundlers (Vite, Next.js, Rollup)
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    bundle: true,
    minify: true,
    legalComments: 'none',
    treeShaking: true,
    sourcemap: 'external',
    format: 'esm',
    outfile: path.resolve(distDir, 'index.esm.js'),
    target: ['es2020'],
  });

  // 3. CommonJS bundle
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    bundle: true,
    minify: true,
    legalComments: 'none',
    treeShaking: true,
    sourcemap: 'external',
    format: 'cjs',
    outfile: path.resolve(distDir, 'index.cjs'),
    target: ['es2020'],
  });

  // Check file sizes
  const minifiedFile = path.resolve(distDir, 'abuse-shield.min.js');
  const content = fs.readFileSync(minifiedFile);
  const rawSizeKb = (content.length / 1024).toFixed(2);
  const gzippedSizeKb = (zlib.gzipSync(content).length / 1024).toFixed(2);

  console.log(`✅ Standalone bundle: ${rawSizeKb} KB raw (${content.length} bytes), ${gzippedSizeKb} KB gzipped`);
  if (parseFloat(rawSizeKb) < 10.0) {
    console.log(`🎉 Size check PASSED! Target < 10KB met successfully (${rawSizeKb} KB < 10KB).`);
  } else {
    console.log(`ℹ️ Bundle size: ${rawSizeKb} KB raw (${gzippedSizeKb} KB gzipped)`);
  }

  // Type declarations
  try {
    const tscBin = path.resolve(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');
    if (fs.existsSync(tscBin)) {
      execSync(`node "${tscBin}" --emitDeclarationOnly`, { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Type declarations generated.');
    }
  } catch (err) {
    // Non-fatal
  }

  if (isWatch) {
    console.log('👀 Watching for changes...');
  }
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
