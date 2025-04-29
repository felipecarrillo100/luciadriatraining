/**
 * Creates a 3D cylinder mesh
 *
 * @param radius the radius of the cylinder
 * @param height the height of the cylinder
 * @param sliceCount the number of slices (subdivisions) of the side surface of the stick and the tip
 */

export class Cylinder3DMesh {
  public zOffset: number;
  private radius: number;
  private height: number;
  private sliceCount: number;
  private indices: number[];

  constructor(radius: number, height: number, sliceCount: number) {
    this.radius = radius;
    this.height = height;
    this.sliceCount = sliceCount;

    this.indices = [];
    this.zOffset = 0;
  }

  public createVertices() {
    const vertices = [];
    const dphi = (2 * Math.PI) / this.sliceCount;
    const baseZ = -0.5 * this.height + this.zOffset;
    const topZ = 0.5 * this.height + this.zOffset;
    let offset = 0;

    // Side surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      const x0 = this.radius * nx;
      const y0 = this.radius * ny;
      const x1 = x0;
      const y1 = y0;
      // base vertex
      vertices.push(x0);
      vertices.push(y0);
      vertices.push(baseZ);
      this.indices.push(offset + 2 * i);
      // top vertex
      vertices.push(x1);
      vertices.push(y1);
      vertices.push(topZ);
      this.indices.push(offset + 2 * i + 1);
    }
    offset = this.indices.length;

    // Base surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      const x0 = 0;
      const y0 = 0;
      const x1 = this.radius * nx;
      const y1 = this.radius * ny;
      // base vertex
      vertices.push(x0);
      vertices.push(y0);
      vertices.push(baseZ);
      this.indices.push(offset + 2 * i);
      // top vertex
      vertices.push(x1);
      vertices.push(y1);
      vertices.push(baseZ);
      this.indices.push(offset + 2 * i + 1);
    }

    offset = this.indices.length;

    // Top base surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      const x0 = 0;
      const y0 = 0;
      const x1 = this.radius * nx;
      const y1 = this.radius * ny;
      // base vertex
      vertices.push(x0);
      vertices.push(y0);
      vertices.push(topZ);
      this.indices.push(offset + 2 * i);
      // top vertex
      vertices.push(x1);
      vertices.push(y1);
      vertices.push(topZ);
      this.indices.push(offset + 2 * i + 1);
    }

    return vertices;
  }

  public createIndices() {
    if (this.indices.length === 0) {
      this.createVertices();
    }

    const triangles = [];
    for (let i = 0; i < 3; i++) {
      const numberOfIndicesPerSide = this.indices.length / 3;
      for (let j = 1; j < numberOfIndicesPerSide - 1; j++) {
        triangles.push(this.indices[j - 1 + i * numberOfIndicesPerSide]);
        triangles.push(this.indices[j + i * numberOfIndicesPerSide]);
        triangles.push(this.indices[j + 1 + i * numberOfIndicesPerSide]);
      }
    }

    return triangles;
  }

  public createNormals() {
    const normals = [];
    const dPhi = (2 * Math.PI) / this.sliceCount;

    // Side
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      // base vertex
      normals.push(nx);
      normals.push(ny);
      normals.push(0);
      // top vertex
      normals.push(nx);
      normals.push(ny);
      normals.push(0);
    }

    // Base
    for (let i = 0; i <= this.sliceCount; i++) {
      // inner vertex
      normals.push(0);
      normals.push(0);
      normals.push(-1);
      // outer vertex
      normals.push(0);
      normals.push(0);
      normals.push(-1);
    }

    // Top base
    for (let i = 0; i <= this.sliceCount; i++) {
      // inner vertex
      normals.push(0);
      normals.push(0);
      normals.push(-1);
      // outer vertex
      normals.push(0);
      normals.push(0);
      normals.push(-1);
    }

    return normals;
  }

  public createTextureCoordinates() {
    const texCoords = [];
    const dphi = (2 * Math.PI) / this.sliceCount;

    // Side
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const tx = phi / (2 * Math.PI);
      // base vertex
      texCoords.push(tx);
      texCoords.push(0);
      // top vertex
      texCoords.push(tx);
      texCoords.push(1);
    }

    // Base
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const tx = phi / (2 * Math.PI);
      // inner vertex
      texCoords.push(tx);
      texCoords.push(0);
      // outer vertex
      texCoords.push(tx);
      texCoords.push(1);
    }

    // Top Base
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dphi;
      const tx = phi / (2 * Math.PI);
      // inner vertex
      texCoords.push(tx);
      texCoords.push(0);
      // outer vertex
      texCoords.push(tx);
      texCoords.push(1);
    }

    return texCoords;
  }
}
