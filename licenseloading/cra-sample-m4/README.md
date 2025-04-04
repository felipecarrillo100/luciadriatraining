# Create React App + LuciadRIA (license as an import)

This project was initialized using [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

### `npm start`

Starts the application in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will automatically reload if you make edits.\
Any lint errors will be displayed in the console.

### `npm run build`

Compiles the application for production and outputs it to the `build` folder.\
It bundles React in production mode and optimizes the build for the best performance.

## Project Initialization

This project was created using the following command with a TypeScript template:

```shell
npx create-react-app cra-luciad-m2 --template typescript
```

### Installing LuciadRIA

To add LuciadRIA to your project, run:

```shell
npm install @luciad/ria
```

## Creating a React Component for the Map

Here's an example of a React component to host the LuciadRIA map:

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
      // Clean up the map
      if (nativeMap.current) nativeMap.current.destroy();
    };
  }, []);

  return <div className="LuciadMap" ref={divElement}></div>;
};
```

### License Loader

To load the LuciadRIA license, first install `raw-loader`:

```shell
npm install raw-loader --save-dev
```

Then, use the following code `LicenseLoader.ts`:

```typescript
import { setLicenseText } from "@luciad/ria/util/License.js";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import txt from '!!raw-loader!./luciadria_development.txt';

export default function LicenseLoader() {
  setLicenseText(txt);
  // Import the library after loading the license
  return import('../App');
}
```

This setup should help you get started with integrating LuciadRIA into your React project efficiently. If you have any questions or need further assistance, feel free to ask.
