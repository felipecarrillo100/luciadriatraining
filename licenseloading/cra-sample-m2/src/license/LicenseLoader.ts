import {setLicenseText} from "@luciad/ria/util/License.js";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import txt from '!!raw-loader!./luciadria_development.txt';

export default function LicenseLoader() {
    setLicenseText(txt);
    // Library is imorted after loading the license
    return import('../App');
}


