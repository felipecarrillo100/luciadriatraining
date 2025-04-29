/*
 *
 * Copyright (c) 1999-2023 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import {createPoint} from "@luciad/ria/shape/ShapeFactory.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {Vector3} from "@luciad/ria/util/Vector3.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {DEG2RAD, RAD2DEG} from "./Math";

export function copy(a: Vector3): Vector3 {
  return {x: a.x, y: a.y, z: a.z}
}

export function add(a: Vector3, b: Vector3): Vector3 {
  return addArray([a, b]);
}

export function addArray(array: Vector3[]): Vector3 {
  let result = {
    x: 0,
    y: 0,
    z: 0
  };

  for (const vector of array) {
    result = {
      x: result.x + vector.x,
      y: result.y + vector.y,
      z: result.z + vector.z
    }
  }

  return result;
}

export function sub(a: Vector3, b: Vector3) {
  return subArray([a, b]);
}

export function subArray(array: Vector3[]): Vector3 {
  let result = {
    x: array[0].x,
    y: array[0].y,
    z: array[0].z
  };
  for (let i = 1; i < array.length; i++) {
    const vector = array[i];
    result = {
      x: result.x - vector.x,
      y: result.y - vector.y,
      z: result.z - vector.z
    }
  }
  return result;
}

export function scale(vec: Vector3, scalar: number): Vector3 {
  return {
    x: vec.x * scalar,
        y: vec.y * scalar,
      z: vec.z * scalar
  }
}

/**
 * Cross product of two vectors
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  }
}

/**
 * Scalar product of two vectors
 */
export function scalar(a: Vector3, b: Vector3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function negate(a: Vector3): Vector3 {
  return {
    x: -a.x,
    y: -a.y,
    z: -a.z
  }
}

export function length2(a: Vector3): number {
  return a.x * a.x + a.y * a.y + a.z * a.z;
}

export function length(a: Vector3): number {
  return Math.sqrt(length2(a));
}

export function distance3D(a: Vector3, b: Vector3): number {
  return length(sub(a, b));
}

export function absoluteAngle(a: Vector3, b: Vector3): number {
  return Math.acos(scalar(a, b) / (length(a) * length(b))) * RAD2DEG;
}

/**
 * Returns the angle from a to b, using the given axis to determine whether the angle is positive or not.
 * We assume that the given axis is either equal (or very close to) to the cross product of a & b or b & a.
 */
export function angle(a: Vector3, b: Vector3, axis: Vector3): number {
  const absAngle = absoluteAngle(a, b);

  const dot = scalar(axis, cross(a, b));
  if (dot < 0) {
    return -absAngle;
  } else {
    return absAngle
  }
}

/**
 * Returns the given vector rotated with given angle (in degrees) around the given axis.
 */
export function rotateAroundAxis(vector: Vector3, axis: Vector3, angleInDegrees: number): Vector3 {
  //Rodrigues formula
  const angle = angleInDegrees * DEG2RAD;
  const unitAxis = normalize(axis);
  return addArray([scale(vector, Math.cos(angle)),
                   scale(cross(unitAxis, vector), Math.sin(angle)),
                   scale(unitAxis, scalar(unitAxis, vector) * (1 - Math.cos(angle)))
  ])
}

/**
 * Returns the orthogonal projection of the vector a on the vector b.
 */
export function projectOnVector(a: Vector3, b: Vector3) {
  return scale(normalize(b), scalar(a, b) / length(b));
}

/**
 * Returns the orthogonal projection of the given point on the plane defined by the given normal and point on plane.
 */
export function projectPointOnPlane(point: Vector3, planeNormal: Vector3, pointOnPlane: Vector3): Vector3 {
  return sub(point, projectOnVector(sub(point, pointOnPlane), planeNormal))
}

/**
 * Returns the orthogonal projection of the given vector on the plane defined by the given normal.
 */
export function projectVectorOnPlane(vector: Vector3, planeNormal: Vector3): Vector3 {
  return sub(vector, projectOnVector(vector, planeNormal));
}

/**
 * Returns the intersection point (if any) between the given ray and plane.
 */
export function rayPlaneIntersection(rayOrigin: Vector3, rayDirection: Vector3, planeNormal: Vector3,
                                     pointOnPlane: Vector3): Vector3 | null {
  const numerator = scalar(sub(pointOnPlane, rayOrigin), planeNormal);
  const denominator = scalar(rayDirection, planeNormal);
  if (denominator !== 0) {
    //the plane and ray are not parallel
    const rayToPlaneDistance = numerator / denominator;
    if (rayToPlaneDistance < 0) {
      return null; //the intersection is behind the ray
    }
    return add(rayOrigin, scale(rayDirection, rayToPlaneDistance));
  } else if (numerator === 0) {
    //the origin of the ray is on the plane
    return copy(rayOrigin);
  } else {
    return null;
  }
}

export const normalize = (vec: Vector3): Vector3 => scale(vec, 1 / length(vec));

export const toPoint = (reference: CoordinateReference, vec: Vector3): Point => createPoint(reference,
    [vec.x, vec.y, vec.z]);
