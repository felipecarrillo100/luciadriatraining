# Create React App + LuciadRIA (license as a resource)

This project was initialized using [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

### `npm start`

Launches the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will automatically reload if you make changes to the code.\
Any lint errors will also be displayed in the console.

### `npm run build`

Compiles the app for production, creating an optimized build in the `build` folder.\
React is bundled in production mode, ensuring optimal performance.

## Project Creation

This project was created using the following command with a TypeScript template:

```shell
npx create-react-app cra-luciad-m1 --template typescript
```

### Installing LuciadRIA

To add LuciadRIA to your project, execute the following command:

```shell
npm install @luciad/ria
```

## Creating a React Component for the LuciadRIA Map

Below is an example of how to create a React component to host the LuciadRIA map:

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

### License Loading

To load the LuciadRIA license, include it as a resource during runtime. Add the following line to the `<head>` section of your `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Other head elements -->
    <script>window.__LUCIAD_ROOT__="./luciad"</script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Then, place your license file at the following path:

```shell
./public/luciad/license/luciadria_development.txt
```

This setup will help you integrate LuciadRIA into your React project efficiently. If you have any questions or require further assistance, feel free to ask.
