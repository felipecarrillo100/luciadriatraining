import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from "fs";
import path from 'path';

const hexLoader = {
  name: 'hex-loader',
  // @ts-ignore
  transform(code: any, id: string) {
    const [path, query] = id.split('?');
    if (query != 'raw-txt')
      return null;

    const data = fs.readFileSync(path,'utf-8');
    return `export default \`${data}\`;`;
  }
};


console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+__dirname);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), hexLoader],
  resolve: {
    alias: {
      '@luciad/ria-toolbox-config': path.resolve(__dirname, 'src/toolbox/ria/config'),
      '@luciad/ria-toolbox-core': path.resolve(__dirname, 'src/toolbox/ria/core'),
      '@luciad/ria-toolbox-ruler3d': path.resolve(__dirname, 'src/toolbox/ria/ruler3d'),
      '@luciad/ria-toolbox-annotation': path.resolve(__dirname, 'src/toolbox/ria/annotation'),
      '@luciad/ria-toolbox-controller': path.resolve(__dirname, 'src/toolbox/ria/controller'),
      '@luciad/ria-toolbox-crosssection': path.resolve(__dirname, 'src/toolbox/ria/crosssection'),
      '@luciad/ria-toolbox-geolocation': path.resolve(__dirname, 'src/toolbox/ria/geolocation'),
      '@luciad/ria-toolbox-hooks': path.resolve(__dirname, 'src/toolbox/ria/hooks'),
      '@luciad/ria-toolbox-legend': path.resolve(__dirname, 'src/toolbox/ria/legend'),
      '@luciad/ria-toolbox-loaders': path.resolve(__dirname, 'src/toolbox/ria/loaders'),
      '@luciad/ria-toolbox-magnifier': path.resolve(__dirname, 'src/toolbox/ria/magnifier'),
      '@luciad/ria-toolbox-overviewmap': path.resolve(__dirname, 'src/toolbox/ria/overviewmap'),
      '@luciad/ria-toolbox-player': path.resolve(__dirname, 'src/toolbox/ria/player'),
      '@luciad/ria-toolbox-recorder': path.resolve(__dirname, 'src/toolbox/ria/recorder'),
      '@luciad/ria-toolbox-slicing': path.resolve(__dirname, 'src/toolbox/ria/slicing'),
      '@luciad/ria-toolbox-tour': path.resolve(__dirname, 'src/toolbox/ria/tour'),
      '@luciad/ria-toolbox-scene-navigation': path.resolve(__dirname, 'src/toolbox/ria/scene-navigation'),
    }
  }
})
