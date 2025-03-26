# LuciadRIA License loading

LuciadRIA license is required to  use the LuciadRIA software in a web applications.
A missing license will result on a water mark and constant alert popups on the screen.

To deploy the license there are several methods.  You can take the one more suitable for your applications requirements

The LuciadRIA documentation describes the following method:

https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/tutorial/getting_started/deployment.html#_using_your_deployment_license_in_production

Nevertheless, this method assumes you have full control of the webpack configuration
which is not always the case, more over Vite does't even use webpack. 

When you use frameworks such as:

- Create React App (CRA)
- Angular CLI
- Vite

The scripts of the framework configure webpack for you and webpack configurations becomes  a blackbox for you where you have bo access or limited access to customization.
Or in the case of Vite, it doesn't use Webpack at all.

This examples, in this document, show you how you can overcome this limitations.

## Method 1
Applies to: CRA and ANGULAR
The method one is the easiest and more straight forward. Your license will be loaded a s resource loaded at tun time when the application is loaded.
For this you need to specify the location of the license in the `<head>` section of the `index.html` of your application.

```html
    <script>window.__LUCIAD_ROOT__="./luciad"</script>
```

The path is relative to the location of `index.html`, and your need to place your license at:
```html
./luciad/license/luciadria_development.txt
```

## Method 2
Applies to: CRA and ANGULAR

This method will import the license during compile/build. The license will be loaded as a text string and then configured usig the LuciadRIA API
```html
    setLicenseText(txt);
```
Since the setLicenseText must be loaded before any other LuciadRIA code this forces you to use a promise. You will only import the main code once the promise is resolved.

You create a LicenseLoader.ts
```Typescript
import {setLicenseText} from "@luciad/ria/util/License.js";

// Import your licese as a string,  you may need to add a loader for this:
import txt from './luciadria_development.txt';

export default function LicenseLoader() {
    setLicenseText(txt);
    // Maon module is now imported after loading the license
    return import('../pathto/YOURMAINMODULE');
}
```
And not youi can use the LicenseLoader
```Typescript
// @ts-ignore
LicenseLoader().then(({YOURMAINMODULE}) => {
    // Use YOURMAINCOMPONENT HERE
});
```
Don't worry if you don't undertand how to do it at this moment.  Look at the detailed examples provided for CRA and Angular

## Method 3
This method only applies to React Vite. Vite for React doesn't use Webpack and Method 1 and Method 2 will not work.

For this methods you will simply need to define a new entry point in the `index.html`

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
    <!-- License is Loaded here in a separate entry! -->
    <script type="module" src="/src/license/LicenseLoader.ts"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Then you simply load the license:
```Typescript
import {setLicenseText} from "@luciad/ria/util/License.js";

// You can use a loader for this or you can add custom code to vite.config.js
import txt from './luciadria_development.txt?raw-txt';

setLicenseText(txt);
```
Because the LicenseLoader is loaded first in the `index.html` there is not need of additional changes.

