import { defineConfig } from 'vite';

console.log("Vite config is being executed");

export default defineConfig({
  assetsInclude: ['**/*.glb'],
});
