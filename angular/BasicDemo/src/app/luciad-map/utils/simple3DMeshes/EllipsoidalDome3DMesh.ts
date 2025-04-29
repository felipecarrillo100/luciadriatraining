import { Ellipsoid3DMesh } from './Ellipsoid3DMesh';

/**
 * Creates a 3D ellipsoidal dome with given radial dimensions in X, Y, and Z axis, and with the given number of
 * vertical and horizontal subdivisions of the surface.
 *
 * A dome can be obtained by setting the three radial parameters to the same value.
 *
 * @param {Number} radiusX the radial dimension along the X axis
 * @param {Number} radiusY the radial dimension along the Y axis
 * @param {Number} radiusZ the radial dimension along the Z axis
 * @param {Number} verticalSlicesCount the number of vertical subdivisions of the surface (similar to lines of longitude)
 * @param {Number} horizontalSlicesCount the number of horizontal subdivisions of the surface (similar to lines of latitude)
 *
 */

export class EllipsoidalDome3DMesh extends Ellipsoid3DMesh {
  constructor(
    radiusX: number,
    radiusY: number,
    radiusZ: number,
    verticalSlicesCount: number,
    horizontalSlicesCount: number
  ) {
    super(
      radiusX,
      radiusY,
      radiusZ,
      verticalSlicesCount,
      horizontalSlicesCount
    );

    this.horizontalSlicesEndIndex = this.horizontalSlicesCount / 2;
  }
}
