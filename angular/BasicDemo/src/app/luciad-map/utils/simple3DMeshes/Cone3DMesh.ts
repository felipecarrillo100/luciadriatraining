/* eslint-disable no-plusplus */
import { createPoint } from '@luciad/ria/shape/ShapeFactory';

/**
 * Creates a 3D cone with given base and top radius, height and number of subdivisions
 * of the side surface.
 * A higher subdivision number will ensure a smoother appearance of the side surface of the cone.
 * @param baseRadius the base radius of the cone
 * @param topRadius the top radius of the cone
 * @param height the cone height
 * @param sliceCount the number of subdivisions of the side surface of the cone around the cone main axis.
 */

export class Cone3DMesh {
  public zOffset: number;

  private baseRadius: number;
  private topRadius: number;
  private height: number;
  private sliceCount: number;
  private indices: number[];

  constructor(
    baseRadius: number,
    topRadius: number,
    height: number,
    sliceCount: number
  ) {
    this.baseRadius = baseRadius;
    this.topRadius = topRadius;
    this.height = height;
    this.sliceCount = sliceCount;
    this.indices = [];
    this.zOffset = 0;
  }

  public createVertices() {
    const vertices = [];
    let point;
    const dPhi = (2 * Math.PI) / this.sliceCount;
    let x0;
    let y0;
    let x1;
    let y1;

    const baseZ = -0.5 * this.height + this.zOffset;
    const topZ = 0.5 * this.height + this.zOffset;

    let offset = 0;

    // do side surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      x0 = this.baseRadius * nx;
      y0 = this.baseRadius * ny;
      x1 = this.topRadius * nx;
      y1 = this.topRadius * ny;
      // base vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x0, y0, baseZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
      this.indices.push(offset + 2 * i);
      // top vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x1, y1, topZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
      this.indices.push(offset + 2 * i + 1);
    }
    offset = this.indices.length;

    // do base surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      x0 = 0;
      y0 = 0;
      x1 = this.baseRadius * nx;
      y1 = this.baseRadius * ny;
      // inner vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x0, y0, baseZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
      this.indices.push(offset + 2 * i);
      // outer vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x1, y1, baseZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
      this.indices.push(offset + 2 * i + 1);
    }
    offset = this.indices.length;

    // do top surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      x0 = 0;
      y0 = 0;
      x1 = this.topRadius * nx;
      y1 = this.topRadius * ny;
      // inner vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x0, y0, topZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
      this.indices.push(offset + 2 * i);
      // outer vertex
      // @ts-ignore ignore null
      point = createPoint(null, [x1, y1, topZ]);
      vertices.push(point.x);
      vertices.push(point.y);
      vertices.push(point.z);
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
    let point;
    const dPhi = (2 * Math.PI) / this.sliceCount;

    // do side surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      // base vertex
      // @ts-ignore ignore null
      point = createPoint(null, [nx, ny, 0]);
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
      // top vertex
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
    }

    // do base surface
    for (let i = 0; i <= this.sliceCount; i++) {
      // inner vertex
      // @ts-ignore ignore null
      point = createPoint(null, [0, 0, -1]);
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
      // outer vertex
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
    }

    // do top surface
    for (let i = 0; i <= this.sliceCount; i++) {
      // inner vertex
      // @ts-ignore ignore null
      point = createPoint(null, [0, 0, 1]);
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
      // outer vertex
      normals.push(point.x);
      normals.push(point.y);
      normals.push(point.z);
    }

    return normals;
  }

  public createTextureCoordinates() {
    const texCoords = [];
    const dPhi = (2 * Math.PI) / this.sliceCount;

    // do side surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const tx = phi / (2 * Math.PI);
      // base vertex
      texCoords.push(tx); // u
      texCoords.push(0); // v
      // top vertex
      texCoords.push(tx); // u
      texCoords.push(1); // v
    }

    // do base surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const tx = phi / (2 * Math.PI);
      // inner vertex
      texCoords.push(tx); // u
      texCoords.push(0); // v
      // outer vertex
      texCoords.push(tx); // u
      texCoords.push(1); // v
    }

    // do top surface
    for (let i = 0; i <= this.sliceCount; i++) {
      const phi = i * dPhi;
      const tx = phi / (2 * Math.PI);
      // inner vertex
      texCoords.push(tx); // u
      texCoords.push(0); // v
      // outer vertex
      texCoords.push(tx); // u
      texCoords.push(1); // v
    }

    return texCoords;
  }
}
