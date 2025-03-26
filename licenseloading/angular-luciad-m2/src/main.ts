import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import LicenseLoader from './license/LicenseLoader';


// @ts-ignore
LicenseLoader().then(({AppComponent}) => {
  // @ts-ignore
  bootstrapApplication(AppComponent, appConfig)
    .catch((err:unknown) => console.error(err));
})
