import { build } from 'vite';

async function run() {
  console.log('📦 Building dashboard with Vite...');
  await build({ root: '.' });
  console.log('✅ Dashboard built successfully in dist/');
}

run().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
