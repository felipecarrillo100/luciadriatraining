import { Cone3DMesh } from './Cone3DMesh';
import { Cylinder3DMesh } from './Cylinder3DMesh';

/**
 * Creates a 3D arrow mesh with the given dimensional parameters.
 * A 3D arrow is composed of two parts:
 *   - A stick (cylindrical shape)
 *   - A tip (conic shape)
 *
 * @param stickRadius the radius of the arrow stick
 * @param stickHeight the height of the arrow stick
 * @param tipBaseRadius the radius of the arrow tip's bottom base
 * @param tipTopRadius the radius of the arrow tip's top base
 * @param tipHeight the height of the arrow tip
 * @param sliceCount the number of slices (subdivisions) of the side surface of the stick and the tip
 */

export class Arrow3DMesh {
  private cone3DMesh: Cone3DMesh;
  private cylinder3DMesh: Cylinder3DMesh;

  constructor(
    stickRadius: number,
    stickHeight: number,
    tipBaseRadius: number,
    tipTopRadius: number,
    tipHeight: number,
    sliceCount: number
  ) {
    this.cylinder3DMesh = new Cylinder3DMesh(
      stickRadius,
      stickHeight,
      sliceCount
    );
    this.cone3DMesh = new Cone3DMesh(
      tipBaseRadius,
      tipTopRadius,
      tipHeight,
      sliceCount
    );

    // Adjust the z value of the stick and tip so that they are properly connected
    this.cylinder3DMesh.zOffset = -(stickHeight / 2);
    this.cone3DMesh.zOffset = tipHeight / 2;
  }

  public createVertices() {
    return this.cylinder3DMesh
      .createVertices()
      .concat(this.cone3DMesh.createVertices());
  }

  public createIndices() {
    const arrowIndices = this.cylinder3DMesh.createIndices();
    const firstIndexForArrowTip = Math.max.apply(null, arrowIndices) + 1;

    const tipIndices = this.cone3DMesh.createIndices();
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < tipIndices.length; i++) {
      arrowIndices.push(tipIndices[i] + firstIndexForArrowTip);
    }
    return arrowIndices;
  }

  public createNormals() {
    return this.cylinder3DMesh
      .createNormals()
      .concat(this.cone3DMesh.createNormals());
  }

  public createTextureCoordinates() {
    return this.cylinder3DMesh
      .createTextureCoordinates()
      .concat(this.cone3DMesh.createTextureCoordinates());
  }
}
