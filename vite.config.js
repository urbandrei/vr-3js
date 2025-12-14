import { defineConfig } from 'vite';

// Plugin to receive debug logs from the browser and print to terminal
function debugLogPlugin() {
  return {
    name: 'debug-log',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const timestamp = new Date().toLocaleTimeString();
              console.log(`\x1b[36m[VR DEBUG ${timestamp}]\x1b[0m ${data.message}`);
            } catch (e) {
              console.log(`\x1b[36m[VR DEBUG]\x1b[0m ${body}`);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{"ok":true}');
          });
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Debug log endpoint');
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [debugLogPlugin()],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        camera: 'camera.html'
      }
    }
  }
});
