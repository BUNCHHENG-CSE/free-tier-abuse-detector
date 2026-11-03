import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'public/sdk');

async function buildSdk() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('📦 Building @tct/shield browser bundle -> public/sdk/tct-shield.min.js & abuse-shield.min.js...');

  const outfile = path.resolve(outDir, 'abuse-shield.min.js');
  const tctOutfile = path.resolve(outDir, 'tct-shield.min.js');

  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/sdk/browser.ts')],
    bundle: true,
    minify: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: 'none',
    treeShaking: true,
    sourcemap: 'external',
    format: 'iife',
    globalName: 'TCTShieldExport',
    footer: {
      js: 'if(typeof window!=="undefined"){window.TCTShield=TCTShieldExport.TCTShield||TCTShieldExport.AbuseShield||TCTShieldExport.default||TCTShieldExport;window.AbuseShield=window.TCTShield;}',
    },
    outfile,
    target: ['es2020'],
  });

  fs.copyFileSync(outfile, tctOutfile);
  if (fs.existsSync(`${outfile}.map`)) {
    fs.copyFileSync(`${outfile}.map`, `${tctOutfile}.map`);
  }

  const content = fs.readFileSync(outfile);
  const rawSizeKb = (content.length / 1024).toFixed(2);
  const gzippedSizeKb = (zlib.gzipSync(content).length / 1024).toFixed(2);

  console.log(`✅ Standalone bundle: ${rawSizeKb} KB raw (${content.length} bytes), ${gzippedSizeKb} KB gzipped`);
}

buildSdk().catch((err) => {
  console.error('❌ SDK Build failed:', err);
  process.exit(1);
});
