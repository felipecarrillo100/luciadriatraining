import {loadLicenseFromUrls} from "@luciad/ria/util/License.js";


export default function LicenseLoader() {

  loadLicenseFromUrls([
    "./luciad/license/luciadria_development.txt"
  ])

    // Library is imported after loading the license
    return import('../app/app.component');
}


