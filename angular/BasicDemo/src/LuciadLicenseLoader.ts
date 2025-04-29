// @ts-ignore
import txtLicense from 'raw-loader!./assets/luciad/license/luciadria_development.txt';
import {setLicenseText} from "@luciad/ria/util/License";

export function LuciadLicenseLoader() {
  setLicenseText(txtLicense);
}
