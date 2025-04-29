
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import {LuciadLicenseLoader} from "./LuciadLicenseLoader";

LuciadLicenseLoader();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
