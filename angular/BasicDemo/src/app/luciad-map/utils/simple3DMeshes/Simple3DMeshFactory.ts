import { create3DMesh } from '@luciad/ria/geometry/mesh/MeshFactory';
import { Arrow3DMesh } from './Arrow3DMesh';
import { Cone3DMesh } from './Cone3DMesh';
import { Cylinder3DMesh } from './Cylinder3DMesh';
import { Ellipsoid3DMesh } from './Ellipsoid3DMesh';
import { EllipsoidalDome3DMesh } from './EllipsoidalDome3DMesh';

type Texture = HTMLImageElement;

/**
 * Creates a 3D ellipsoid with the given radial dimensions in X, Y, and Z axis, and with the given number of
 * vertical and horizontal subdivisions of the surface.
 *
 * A texture can be optionally applied to the mesh.
 *
 * @param {Number} radiusX the radial dimension along the X axis
 * @param {Number} radiusY the radial dimension along the Y axis
 * @param {Number} radiusZ the radial dimension along the Z axis
 * @param {Number} verticalSlicesCount the number of vertical subdivisions of the surface (similar to lines of longitude)
 * @param {Number} horizontalSlicesCount the number of horizontal subdivisions of the surface (similar to lines of latitude)
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D ellipsoid
 */
export function create3DEllipsoid(
  radiusX: number,
  radiusY: number,
  radiusZ: number,
  verticalSlicesCount: number,
  horizontalSlicesCount: number,
  texture?: Texture
) {
  const ellipsoid3DMesh = new Ellipsoid3DMesh(
    radiusX,
    radiusY,
    radiusZ,
    verticalSlicesCount,
    horizontalSlicesCount
  );
  return texture
    ? create3DMesh(
        ellipsoid3DMesh.createVertices(),
        ellipsoid3DMesh.createIndices(),
        // @ts-ignore
        {
          normals: ellipsoid3DMesh.createNormals(),
          texCoords: ellipsoid3DMesh.createTextureCoordinates(),
          image: texture,
        }
      )
    : create3DMesh(
        ellipsoid3DMesh.createVertices(),
        ellipsoid3DMesh.createIndices(),
        {
          normals: ellipsoid3DMesh.createNormals(),
        }
      );
}

/**
 * Creates a 3D ellipsoidal dome with the given radial dimensions in X, Y, and Z axis, and with the given number of
 * vertical and horizontal subdivisions of the surface.
 *
 * A texture can be optionally applied to the mesh.
 *
 * @param {Number} radiusX the radial dimension along the X axis
 * @param {Number} radiusY the radial dimension along the Y axis
 * @param {Number} radiusZ the radial dimension along the Z axis
 * @param {Number} verticalSlicesCount the number of vertical subdivisions of the surface (similar to lines of longitude)
 * @param {Number} horizontalSlicesCount the number of horizontal subdivisions of the surface (similar to lines of latitude)
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D ellipsoidal dome
 */
export function create3DEllipsoidalDome(
  radiusX: number,
  radiusY: number,
  radiusZ: number,
  sliceCount: number,
  stackCount: number,
  texture?: Texture
) {
  const ellipsoidal3DMesh = new EllipsoidalDome3DMesh(
    radiusX,
    radiusY,
    radiusZ,
    sliceCount,
    stackCount
  );
  return texture
    ? create3DMesh(
        ellipsoidal3DMesh.createVertices(),
        ellipsoidal3DMesh.createIndices(),
        // @ts-ignore
        {
          normals: ellipsoidal3DMesh.createNormals(),
          texCoords: ellipsoidal3DMesh.createTextureCoordinates(),
          image: texture,
        }
      )
    : create3DMesh(
        ellipsoidal3DMesh.createVertices(),
        ellipsoidal3DMesh.createIndices(),
        {
          normals: ellipsoidal3DMesh.createNormals(),
        }
      );
}

/**
 * Creates a 3D sphere with the given radius and number of subdivisions of the surface.
 *
 * A texture can be optionally applied to the mesh.
 *
 * @param {Number} radius the radius of the sphere
 * @param {Number} sliceCount number of vertical and horizontal subdivisions of the surface (similar to lines of
 * longitude and latitude)
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D Sphere
 */
export function create3DSphere(
  radius: number,
  sliceCount: number,
  texture?: Texture
) {
  return create3DEllipsoid(
    radius,
    radius,
    radius,
    sliceCount,
    sliceCount,
    texture
  );
}

/**
 * Creates a 3D dome with the given radius and number of subdivisions of the surface.
 *
 * A texture can be optionally applied to the mesh.
 *
 * @param {Number} radius the radius of the sphere
 * @param {Number} sliceCount number of vertical and horizontal subdivisions of the surface (similar to lines of
 * longitude and latitude)
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D Dome
 */
export function create3DDome(
  radius: number,
  sliceCount: number,
  texture?: Texture
) {
  return create3DEllipsoidalDome(
    radius,
    radius,
    radius,
    sliceCount,
    sliceCount,
    texture
  );
}

/**
 * Creates a 3D cone with given base and top radius, height and number of subdivisions
 * of the side surface.
 * A higher subdivision number will ensure a smoother appearance of the side surface of the cone.
 *
 * A texture can be optionally applied to the mesh.
 *
 * @param {Number} baseRadius the base radius of the cone
 * @param {Number} topRadius the top radius of the cone
 * @param {Number} height the cone height
 * @param {Number} sliceCount the number of subdivisions of the side surface of the cone around the cone main axis
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D cone
 */
export function create3DCone(
  baseRadius: number,
  topRadius: number,
  height: number,
  sliceCount: number,
  texture?: Texture
) {
  const cone3DMesh = new Cone3DMesh(baseRadius, topRadius, height, sliceCount);
  return texture
    ? create3DMesh(cone3DMesh.createVertices(), cone3DMesh.createIndices(), {
        normals: cone3DMesh.createNormals(),
        texCoords: cone3DMesh.createTextureCoordinates(),
        image: texture,
      })
    : create3DMesh(cone3DMesh.createVertices(), cone3DMesh.createIndices(), {
        normals: cone3DMesh.createNormals(),
      });
}

/**
 * Creates a 3D cylinder mesh. The cylinder is oriented in the Z direction.
 *
 * @param {Number} radius the radius of the cylinder
 * @param {Number} height the height of the cylinder
 * @param {Number} sliceCount the number of slices (subdivisions) of the side surface of the stick and the tip
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D cylinder
 */
export function create3DCylinder(
  radius: number,
  height: number,
  sliceCount: number,
  texture?: Texture
) {
  const cylinder3DMesh = new Cylinder3DMesh(radius, height, sliceCount);
  return texture
    ? create3DMesh(
        cylinder3DMesh.createVertices(),
        cylinder3DMesh.createIndices(),
        // @ts-ignore
        {
          normals: cylinder3DMesh.createNormals(),
          texCoords: cylinder3DMesh.createTextureCoordinates(),
          image: texture,
        }
      )
    : create3DMesh(
        cylinder3DMesh.createVertices(),
        cylinder3DMesh.createIndices(),
        {
          normals: cylinder3DMesh.createNormals(),
        }
      );
}

/**
 * Creates a 3D arrow with the given dimensional parameters.
 * A 3D arrow is composed of two parts:
 *   - A stick (cylindrical shape)
 *   - A tip (conic shape)
 *
 * The default orientation is in the direction of the z-axis (i.e. upward).
 *
 * @param {Number} stickRadius the radius of the arrow stick
 * @param {Number} stickHeight the height of the arrow stick
 * @param {Number} tipBaseRadius the radius of the arrow tip's bottom base
 * @param {Number} tipTopRadius the radius of the arrow tip's top base
 * @param {Number} tipHeight the height of the arrow tip
 * @param {Number} sliceCount the number of slices (subdivisions) of the side surface of the stick and the tip
 * @param {HTMLCanvasElement|Image|String} texture (optional) the texture to be applied to the 3D arrow
 */
export function create3DArrow(
  stickRadius: number,
  stickHeight: number,
  tipBaseRadius: number,
  tipTopRadius: number,
  tipHeight: number,
  sliceCount: number,
  texture: Texture
) {
  const arrow3DMesh = new Arrow3DMesh(
    stickRadius,
    stickHeight,
    tipBaseRadius,
    tipTopRadius,
    tipHeight,
    sliceCount
  );
  return texture
    ? create3DMesh(
        arrow3DMesh.createVertices(),
        arrow3DMesh.createIndices(),
        // @ts-ignore
        {
          normals: arrow3DMesh.createNormals(),
          texCoords: arrow3DMesh.createTextureCoordinates(),
          image: texture,
        }
      )
    : create3DMesh(arrow3DMesh.createVertices(), arrow3DMesh.createIndices(), {
        normals: arrow3DMesh.createNormals(),
      });
}
