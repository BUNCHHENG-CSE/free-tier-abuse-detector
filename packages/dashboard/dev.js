import { createServer } from 'vite';

async function run() {
  const server = await createServer({
    root: '.',
    server: {
      port: 3000,
    },
  });
  await server.listen();
  server.printUrls();
}

run().catch((err) => {
  console.error('❌ Failed to start dashboard dev server:', err);
  process.exit(1);
});
