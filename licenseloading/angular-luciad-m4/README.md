# AngularLuciad
## Method 2: Load license as import

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.
```html
 ng new angular-luciad-m2
```

### Installing LuciadRIA

To add LuciadRIA to your project, run:

```shell
npm install @luciad/ria
```

### License Loading

Here we will use an alternative method to load the LuciadRIA license.

Configure Angular to import (load) files with `.txt` extension  as text strings `loader:{".txt": "text"}`. In `angular.json`
```json
{
  ...other,
  "projects": {
    "angular-luciad-m2": {
      "architect": {
        "build": {
          ...other,
          "loader": {
            ".txt": "text"
          }
        }
      }
    }
  }
}
```
Create a license loader `LicenseLoader.ts`:
```Typescript
import {loadLicenseFromUrls} from "@luciad/ria/util/License.js";

export default function LicenseLoader() {

  // Load License from URl  
  loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
  ])

  // Library is imported after loading the license
  return import('../app/app.component');
}

```
Modify `main.ts` to load tha app component only after the license has been loaded
```Typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import LicenseLoader from './license/LicenseLoader';

// @ts-ignore
LicenseLoader().then(({AppComponent}) => {
  // @ts-ignore
  bootstrapApplication(AppComponent, appConfig)
    .catch((err:unknown) => console.error(err));
})

```

## Development server

To start a local development server, run:

```bash
npm start
```
Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Create LuciadRIA map component
You can create a new component using Angular CLI:
```bash
ng generate component components/LuciadMap
```
The following code snippet shows you how to attach the map to the Angular component.
You will require a reference the the div element to host the map `luciadMapContainer` and make sure you set `{ static: true }` to ensure the ngInit is only called after the real HTML component exist in the DOM
```Typescript
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';

@Component({
  selector: 'app-luciad-map',
  imports: [],
  templateUrl: './luciad-map.component.html',
  styleUrl: './luciad-map.component.scss'
})
export class LuciadMapComponent implements OnInit, OnDestroy {
  // IMPORTANT: The div component must be set to static:true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  // Initialize map
  ngOnInit(): void {
    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  // Destroy map
  ngOnDestroy(): void {
    this.map?.destroy();
  }

}
```
## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


