const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/worker.js'], // Entry point of your worker
  bundle: true,                   // Bundle all dependencies into a single file
  outfile: 'dist/worker.bundle.js', // Output file path
  target: 'es2020',                // Target environment (Cloudflare Workers support modern JavaScript)
  platform: 'neutral',             // Cloudflare Workers run in a neutral environment
  minify: true,                    // Optional: Minify the output
  sourcemap: true,                 // Optional: Enable source maps for debugging
  external: [],                    // Don't exclude any modules, include all dependencies in the bundle
}).catch(() => process.exit(1));
