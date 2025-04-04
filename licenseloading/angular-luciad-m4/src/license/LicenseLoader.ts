import {loadLicenseFromUrls} from "@luciad/ria/util/License.js";


export default function LicenseLoader() {

  // Load license from URL at runtime
  loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
  ])

    // Library is imported after loading the license
    return import('../app/app.component');
}


