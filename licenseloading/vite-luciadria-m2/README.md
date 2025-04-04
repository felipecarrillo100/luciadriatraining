# Creating a new App Using Vite with React + TypeScript

Creating a new React application using Vite with TypeScript is a straightforward process that leverages Vite's fast build times and modern tooling. 
In this guide, we'll walk through the steps to set up a new React app named `vite-luciadria` using Vite and TypeScript.

## Step-by-Step Guide to Create a React App with Vite and TypeScript

### Step 1: Install Node.js

Before you begin, ensure you have Node.js installed on your machine. You can download it from the [official Node.js website](https://nodejs.org/). This will also install npm, the Node package manager, which you'll use to manage your project dependencies.

### Step 2: Create the React App

Open your terminal and run the following command to create a new React app using Vite:

```bash
npm create vite@latest vite-luciadria -- --template react-ts
```

### Step 3: Navigate to Your Project Directory

Once the project is created, navigate into your project directory:

```bash
cd vite-luciadria
```

### Step 4: Install Dependencies

Inside your project directory, install the necessary dependencies with:

```bash
npm install
```

To add LuciadRIA to your project, run:

```shell
npm install @luciad/ria
```


### Step 5: Start the Development Server

To start the development server and see your new React app in action, run:

```bash
npm run dev
```


This command will start a local development server, and you should see output indicating that your app is running, typically at `http://localhost:5173`.

### Step 6: Open Your App in a Browser

Open your web browser and navigate to `http://localhost:5173` to view your new React app. You should see the default Vite + React + TypeScript welcome page.


## Customizing Your App

Now that your app is set up, you can start customizing it. The main files you'll work with are located in the `src` directory:

- **`main.tsx`**: The entry point of your application, where your app is rendered.
- **`App.tsx`**: The main component of your React application. You can modify this file to change the content displayed on your app's homepage.


## LuciadRIA License as a resource-file loaded at run time

This method is tailored for React with Vite, which does not use Webpack.

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

Then, indicate the url(s) from where the license must be taken, several urls can be passed 

```typescript
import {loadLicenseFromUrls} from "@luciad/ria/util/License.js";

// Loading license from a URL
loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
])

```

Make sure you place a copy of your license at the URL you have indicated, int his example it is a relative path but absolute paths are also possible.


Since `LicenseLoader.ts` is loaded before `main.tsx` in `index.html`, the license will be loaded in the correct sequence without additional considerations.
