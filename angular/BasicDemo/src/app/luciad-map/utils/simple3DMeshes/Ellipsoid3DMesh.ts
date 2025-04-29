/**
 * Creates a 3D ellipsoid with given radial dimensions in X, Y, and Z axis, and with the given number of
 * vertical and horizontal subdivisions of the surface.
 *
 * A sphere can be obtained by setting the three radial parameters to the same value.
 *
 * @param {Number} radiusX the radial dimension along the X axis
 * @param {Number} radiusY the radial dimension along the Y axis
 * @param {Number} radiusZ the radial dimension along the Z axis
 * @param {Number} verticalSlicesCount the number of vertical subdivisions of the surface (similar to lines of longitude)
 * @param {Number} horizontalSlicesCount the number of horizontal subdivisions of the surface (similar to lines of latitude)
 *
 */

export class Ellipsoid3DMesh {
  public horizontalSlicesEndIndex: number;
  public horizontalSlicesCount: number;
  private radiusX: number;
  private radiusY: number;
  private radiusZ: number;
  private verticalSlicesCount: number;

  constructor(
    radiusX: number,
    radiusY: number,
    radiusZ: number,
    verticalSlicesCount: number,
    horizontalSlicesCount: number
  ) {
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.radiusZ = radiusZ;
    this.verticalSlicesCount = verticalSlicesCount;
    this.horizontalSlicesCount = horizontalSlicesCount;

    // Used for domes
    this.horizontalSlicesEndIndex = this.horizontalSlicesCount;
  }

  public createVertices() {
    const vertices = [];
    const dPhi = (2 * Math.PI) / this.verticalSlicesCount;
    const dTheta = Math.PI / this.horizontalSlicesCount;
    let x;
    let y;
    let z;
    for (let i = 0; i <= this.horizontalSlicesEndIndex; i++) {
      const tht = -Math.PI / 2 + i * dTheta;
      for (let j = 0; j <= this.verticalSlicesCount; j++) {
        const phi = j * dPhi;
        x = this.radiusX * Math.cos(tht) * Math.cos(phi);
        y = this.radiusY * Math.cos(tht) * Math.sin(phi);
        z = this.radiusZ * Math.sin(tht);
        // base vertex
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
      }
    }
    return vertices;
  }

  public createIndices() {
    const indices = [];
    for (let i = 0; i < this.horizontalSlicesEndIndex; i++) {
      for (let j = 0; j < this.verticalSlicesCount; j++) {
        const index1 = i * (this.verticalSlicesCount + 1) + j;
        const index2 = i * (this.verticalSlicesCount + 1) + (j + 1);
        const index3 = (i + 1) * (this.verticalSlicesCount + 1) + (j + 1);
        const index4 = (i + 1) * (this.verticalSlicesCount + 1) + j;

        // Triangle 1
        indices.push(index2);
        indices.push(index4);
        indices.push(index3);

        // Triangle 2
        indices.push(index2);
        indices.push(index4);
        indices.push(index1);
      }
    }

    return indices;
  }

  public createNormals() {
    const normals = [];
    const dPhi = (2 * Math.PI) / this.verticalSlicesCount;
    const dTheta = Math.PI / this.horizontalSlicesCount;
    let nx;
    let ny;
    let nz;
    for (let i = 0; i <= this.horizontalSlicesEndIndex; i++) {
      const tht = -Math.PI / 2 + i * dTheta;
      for (let j = 0; j <= this.verticalSlicesCount; j++) {
        const phi = j * dPhi;
        nx = Math.cos(tht) * Math.cos(phi);
        ny = Math.cos(tht) * Math.sin(phi);
        nz = Math.sin(tht);
        // base vertex
        normals.push(nx);
        normals.push(ny);
        normals.push(nz);
      }
    }
    return normals;
  }

  public createTextureCoordinates() {
    const texCoords = [];
    const dPhi = (2 * Math.PI) / this.verticalSlicesCount;
    const dTheta = Math.PI / this.horizontalSlicesCount;
    for (let i = 0; i <= this.horizontalSlicesEndIndex; i++) {
      const tht = -Math.PI / 2 + i * dTheta;
      for (let j = 0; j <= this.verticalSlicesCount; j++) {
        const phi = j * dPhi;
        const tx = phi / (2 * Math.PI);
        const ty = 0.5 + tht / Math.PI;
        texCoords.push(tx); // u
        texCoords.push(ty); // v
      }
    }
    return texCoords;
  }
}
