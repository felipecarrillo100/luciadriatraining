/**
 * CRS - Coordinate Reference System
 * EPSG - European Petroleum Survey Group
 *
 * CRS:84 (WGS 84)     - Geographic 2D, Alternative Notation (Long, Lat) https://ext.eurocontrol.int/aixm_confluence/display/ACG/Coordinate+Reference+System
 * EPSG:4326 (WGS 84)  - Geographic 2D + Height (Lat, Long) https://epsg.io/4326
 * EPSG:4978 (WGS 84)  - Geocentric (Cartesian 3D) - describes positions in space relative to the planet’s core (X, Y, Z) https://epsg.io/4978
 * EPSG:3857 (WGS 84)  - 2D. (Easting, Northing) https://epsg.io/3857
 * EPSG:25832 (ETRS89) - 2D. Specific region (UTM Zone 32N) in a 2D grid. Covers Germany, Denmark, parts of Norway. (Easting, Northing) https://epsg.io/25832
 */

export enum CRSEnum {
  CRS_84 = 'CRS:84',
  EPSG_4326 = 'EPSG:4326',
  EPSG_4978 = 'EPSG:4978',
  EPSG_3857 = 'EPSG:3857',
  EPSG_25832 = 'EPSG:25832',
}
