# Loading the LuciadRIA License

To utilize LuciadRIA in web applications, a valid license is required. Without it, you'll encounter a watermark and frequent alert pop-ups on your screen.

There are multiple methods for deploying the license, allowing you to choose the one that best fits your application's requirements.

The LuciadRIA documentation outlines a method available here:

[LuciadRIA Deployment Guide](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/tutorial/getting_started/deployment.html#_using_your_deployment_license_in_production)

However, this method assumes full control over the Webpack configuration, which may not always be the case. Furthermore, Vite does not use Webpack at all.

When working with frameworks such as:

- Create React App (CRA)
- Angular CLI
- Vite

These frameworks often handle Webpack configuration internally, limiting your ability to customize it. In the case of Vite, Webpack is not used.

This document provides examples to help you navigate these limitations.

## Method 1: Applies to CRA and Angular

This straightforward method involves loading your license as a resource at runtime when the application initializes. Specify the license's location in the `<head>` section of your application's `index.html`:

```html
<script>window.__LUCIAD_ROOT__="./luciad"</script>
```

Ensure your license is placed at the following path relative to `index.html`:

```
./luciad/license/luciadria_development.txt
```

## Method 2: Applies to CRA and Angular

This method imports the license during the compile/build process. The license is loaded as a text string and configured using the LuciadRIA API:

```typescript
setLicenseText(txt);
```

Since `setLicenseText` must be called before any other LuciadRIA code, you need to use a promise to ensure the main code is imported only after the license is loaded.

Create a `LicenseLoader.ts`:

```typescript
import { setLicenseText } from "@luciad/ria/util/License.js";

// Import your license as a string; you may need to add a loader for this:
import txt from './luciadria_development.txt';

export default function LicenseLoader() {
    setLicenseText(txt);
    // Main module is now imported after loading the license
    return import('../pathto/YOURMAINMODULE');
}
```

Then use the `LicenseLoader`:

```typescript
LicenseLoader().then(({ YOURMAINMODULE }) => {
    // MAke us of YOURMAINCOMPONENT here
});
```

If you're unsure how to implement this, refer to the detailed examples provided for CRA and Angular.

## Method 3: Applies to Vite with React

This method is tailored for React with Vite, which does not use Webpack. Methods 1 and 2 will not apply here.

Define a new entry point `LicenseLoader.ts`  in `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS + LuciadRIA</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- License is loaded here in a separate entry! -->
    <script type="module" src="/src/license/LicenseLoader.ts"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Then, load the license, here you have two options:

### Options 1: Load the license from a static string

```typescript
import { setLicenseText } from "@luciad/ria/util/License.js";

// Use a loader library or add custom code to vite.config.js to load the string as a string
import txt from './luciadria_development.txt?raw-txt';

setLicenseText(txt);
```



Since `LicenseLoader.ts` is loaded before `main.tsx` in `index.html`, the data will be loaded in the correct sequence without additional considerations.

## Method 4: Applies to Angular, CRA and VITE 
The method 4 is a combination of method 1 and 2. 
* `Method 1` loads the license at runtime from a relative path specified in index.html, 

* `Method 2` sets the license as a static string loaded from a file at compilation.

The `Method 4` allows you to specify a URL (relative or absolute) from where the application will retrieve license at run-time.

```typescript
loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
])
```

In principle, to use this method can simply replace `setLicenseText` from the previous examples with `loadLicenseFromUrls([url])` and the rest of your code can stay the same. 
The only difference, is that every time your application loads, it will try to download the license file from the url(s) indicated.

Obviously importing your license file as txt is no longer needed and that code can be removed from your application.

### For instance, in the case of CRA and Angular, (Method 2 described above), this would become:

```typescript
import { loadLicenseFromUrls } from "@luciad/ria/util/License.js";

export default function LicenseLoader() {
    loadLicenseFromUrls(['URL_TO_LICENSE']);
    // Main module is now imported after loading the license
    return import('../pathto/YOURMAINMODULE');
}
```

### Or in the case of VITE this would become:

```typescript
import {loadLicenseFromUrls} from "@luciad/ria/util/License.js";

loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
])

```

## Conclusions

LuciadRIA is a framework-agnostic solution that can be seamlessly integrated with any framework, such as React, Angular, Vite, Vue, or even Vanilla JavaScript. While JavaScript is supported, using TypeScript is strongly recommended due to its numerous benefits, including enhanced code quality and maintainability.

As a commercial software product, LuciadRIA requires a valid license for use. A license check has been implemented, with multiple methods available to accommodate the specific needs of your applications. Each method has its own advantages and disadvantages, so you can choose the one that best suits your requirements.

For example:

- **License Loaded as Static Text String at Compilation**: In this method, the license is embedded into your JavaScript code during compilation, making it more secure against unauthorized access. However, if the license expires, you will need to recompile and redeploy your application with the updated license.

- **License Loaded at Run-Time**: Here, the license is retrieved over the network each time the application loads, which makes it visible to others. The benefit of this approach is that you can update the license without recompiling the code; simply replace the license file on your web server.

By understanding these options, you can select the licensing method that aligns best with your application’s needs and operational considerations.
