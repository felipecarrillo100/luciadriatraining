# React + TypeScript + Vite + LuciadRIA

This template provides a minimal setup for integrating React with the LuciadRIA Map using Vite.

## Project Setup

This application was created using Vite. To start, run the following command:

```shell
npm create vite@latest vite-luciadria
```

### Installation

To install the necessary dependencies, execute:

```shell
npm install
```

### Running the Application

To run the development server, use:

```shell
npm run dev
```

### Installing LuciadRIA

To include LuciadRIA in your project, install it via:

```shell
npm install @luciad/ria
```

## Creating a React Component for the Map

Below is an example of a React component to host the LuciadRIA map:

```typescript
import React, { useEffect, useRef } from "react";
import { WebGLMap } from "@luciad/ria/view/WebGLMap";
import { getReference } from "@luciad/ria/reference/ReferenceProvider";
import "./LuciadMap.css";

export const LuciadMap: React.FC = () => {
  const divElement = useRef<HTMLDivElement | null>(null);
  const nativeMap = useRef<WebGLMap | null>(null);

  useEffect(() => {
    // Initialize the map
    if (divElement.current !== null) {
      nativeMap.current = new WebGLMap(divElement.current, { reference: getReference("EPSG:4978") });
    }
    return () => {
      // Destroy the map
      if (nativeMap.current) nativeMap.current.destroy();
    };
  }, []);

  return <div className="LuciadMap" ref={divElement}></div>;
};
```

### License Loader

To load the LuciadRIA license, use the following code:

```typescript
import { setLicenseText } from "@luciad/ria/util/License.js";

// @ts-ignore
import txt from './luciadria_development.txt?raw-txt';

// Load the license
setLicenseText(txt);
```

### Vite Configuration for text file loading as string using import

In `vite.config.ts`, create a loader using Node.js `fs` module:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from "fs";

const hexLoader = {
  name: 'hex-loader',
  // @ts-ignore
  transform(code: any, id: string) {
    const [path, query] = id.split('?');
    if (query !== 'raw-txt') return null;

    const data = fs.readFileSync(path, 'utf-8');
    return `export default \`${data}\`;`;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), hexLoader],
});
```

### Resolving the `fs` Warning

To suppress warnings related to the `fs` module, install the Node.js types:

```shell
npm install "@types/node" --save-dev
```

This setup should help you get started with integrating React, TypeScript, Vite, and LuciadRIA. If you have any questions or need further assistance, feel free to reach out.
