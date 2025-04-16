## Loading a Projection

LuciadRIA supports both map projection and data projection on multiple coordinate reference systems (CRS). While many CRSs are pre-loaded in memory, it is inefficient to load all the thousands of available projections simultaneously.

To optimize performance, it is more efficient to load the specific CRS needed at the time it is required. For instance, if your application needs to load a specific EPSG code for your country, you can dynamically load this projection from a string, a file, or a database.

The following example demonstrates how to load a projection from a Well-Known Text (WKT) string:


```typescript
import {
    addReference,
    getReference,
    isValidReferenceIdentifier,
    parseWellKnownText
} from "@luciad/ria/reference/ReferenceProvider.js";

function loadProjection_EPSG_25832() {
    const wktString = `PROJCS["ETRS89 / UTM zone 32N",GEOGCS["ETRS89",DATUM["European Terrestrial Reference System 1989",SPHEROID["GRS 1980",6378137.0,298.257222101],TOWGS84[0.0,0.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["degree",0.017453292519943295],AXIS["Geodetic latitude",NORTH],AXIS["Geodetic longitude",EAST],AUTHORITY["EPSG",4258]],PROJECTION["Transverse Mercator"],PARAMETER["Latitude of natural origin",0.0],PARAMETER["central_meridian",9.0],PARAMETER["Scale factor at natural origin",0.9996],PARAMETER["False easting",500000.0],PARAMETER["False northing",0.0],UNIT["Meter",1.0],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG",25832]]`;
    const reference = parseWellKnownText(wktString);
    if (reference && reference.identifier) {
        // Add the new reference to the ReferenceProvider if it is not already present
        if (!isValidReferenceIdentifier(reference.identifier)) {
            addReference(reference);
        }
    }
}
```

Detailed documentation can be found at: 
- [addReference Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/functions/_luciad_ria_reference_ReferenceProvider.addReference.html)
- [parseWellKnownText Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/functions/_luciad_ria_reference_ReferenceProvider.parseWellKnownText.html)
