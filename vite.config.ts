import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'electron-clipboard-ex',
        'sqlite3',
        'jimp',
        '@nut-tree-fork/nut-js',
        'sharp',
        'sharp-apng',
      ], // Add sharp and sharp-apng
    },
  },
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
