import {loadLicenseFromUrls} from "@luciad/ria/util/License";

export default function LicenseLoader() {
    loadLicenseFromUrls([
        "./luciad/license/luciadria_development.txt"
    ])
    // Library is loaded at run-time
    return import('../App');
}
