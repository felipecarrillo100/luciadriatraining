import {setLicenseText} from "@luciad/ria/util/License.js";

// @ts-ignore
import txt from './luciadria_development.txt';

export default function LicenseLoader() {
    setLicenseText(txt);
    // Library is imported after loading the license
    return import('../app/app.component');
}


