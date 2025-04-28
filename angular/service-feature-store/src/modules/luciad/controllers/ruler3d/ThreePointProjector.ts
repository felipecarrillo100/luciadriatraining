/*
 *
 * Copyright (c) 1999-2022 Luciad All Rights Reserved.
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
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { Point } from '@luciad/ria/shape/Point';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { Map } from '@luciad/ria/view/Map';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import {
  addArray,
  angle,
  cross,
  distance,
  normalize,
  projectVectorOnPlane,
  rotateAroundAxis,
  scale,
  sub,
  toPoint,
} from '../util/Vector3Util';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';
import { MEASUREMENTS_MODEL_REFERENCE } from './measurement/Measurement';
import { Icon3DStyle, MeshUrlIcon3DStyle } from '@luciad/ria/view/style/Icon3DStyle';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { IconFactory } from './IconFactory';
import { Vector3 } from '@luciad/ria/util/Vector3';
import {CRSEnum} from '../../interfaces/CRS.enum';

export const CARTESIAN_REFERENCE = getReference(CRSEnum.EPSG_4978);
export const WORLD_TO_MODEL = createTransformation(CARTESIAN_REFERENCE, MEASUREMENTS_MODEL_REFERENCE);

const DEFAULT_POINT_STYLE: IconStyle = {
  image: IconFactory.cross({
    width: 20,
    height: 20,
    stroke: 'rgb(250,250,250)',
    strokeWidth: 3,
  }),
  opacity: 0.99,
};

const DEFAULT_OCCLUDED_POINT_STYLE: IconStyle = {
  image: IconFactory.cross({
    width: 20,
    height: 20,
    stroke: 'rgb(250,250,250)',
    strokeWidth: 3,
  }),
  opacity: 0.4,
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

function createPlaneStyle(meshUrl: string, size: number, pitch: number, heading: number): MeshUrlIcon3DStyle {
  return {
    meshUrl,
    rotation: {
      x: 0,
      y: 90,
      z: 90,
    },
    orientation: {
      pitch: pitch,
      heading: heading,
    },
    scale: {
      x: size * 0.66,
      y: size * 0.66,
      z: size * 0.66,
    },
  };
}

export interface MeasurementProjector {
  readonly ready: boolean;

  handleEventForInitialization(gestureEvent: GestureEvent): HandleEventResult;

  project(viewPoint: Point): Point | null;

  paintProjection(geoCanvas: GeoCanvas): void;
}

export abstract class ThreePointProjector implements MeasurementProjector {
  private readonly _map: Map;
  private readonly _planeMeshUrl: string;
  private _points: Point[] = [createPoint(CARTESIAN_REFERENCE, [0, 0, 0])];
  private _ready = false;
  private _planeCenter: Point | null = null;
  private _planeNormal: Vector3 | null = null;
  private _planeStyle: Icon3DStyle | null = null;

  protected constructor(map: Map, planeMeshUrl: string) {
    if (!CARTESIAN_REFERENCE.equals(map.reference)) {
      throw new Error('The ThreePointProjector should only be used in 3D');
    }
    this._map = map;
    this._planeMeshUrl = planeMeshUrl;
  }

  get ready(): boolean {
    return this._ready;
  }

  protected get planeCenter(): Point | null {
    return this._planeCenter;
  }

  protected get planeNormal(): Vector3 | null {
    return this._planeNormal;
  }

  protected get map(): Map {
    return this._map;
  }

  handleEventForInitialization(gestureEvent: GestureEvent): HandleEventResult {
    if (this._ready) {
      return HandleEventResult.EVENT_IGNORED;
    }

    if (gestureEvent.type === GestureEventType.SINGLE_CLICK_UP) {
      return this.handleClick(gestureEvent);
    } else if (gestureEvent.type === GestureEventType.MOVE) {
      return this.handleMove(gestureEvent);
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
  }

  private handleClick(gestureEvent: GestureEvent) {
    if (this._points.length >= 3) {
      this._ready = true;
    } else {
      const worldPoint = this.toWorldPoint(gestureEvent);
      if (worldPoint) {
        this._points.push(worldPoint);
      }
    }
    return HandleEventResult.EVENT_HANDLED;
  }

  private handleMove(gestureEvent: GestureEvent) {
    const worldPoint = this.toWorldPoint(gestureEvent);

    if (this._points.length > 0 && !this._ready && worldPoint) {
      this._points[this._points.length - 1].move3DToPoint(worldPoint);

      if (this._points.length === 3) {
        this.buildPlane();
      }

      return HandleEventResult.EVENT_HANDLED;
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
  }

  private toWorldPoint(gestureEvent: GestureEvent): Point | null {
    try {
      return this._map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(gestureEvent.viewPoint);
    } catch (e) {
      if (e instanceof OutOfBoundsError) {
        return null;
      } else {
        throw e;
      }
    }
  }

  private buildPlane() {
    const [p0, p1, p2] = this._points;
    this._planeCenter = toPoint(CARTESIAN_REFERENCE, scale(addArray([p0, p1, p2]), 1 / 3));
    this._planeNormal = normalize(cross(sub(p1, p0), sub(p2, p0)));

    const planeSize =
      Math.max(distance(this._planeCenter, p0), distance(this._planeCenter, p0), distance(this._planeCenter, p0)) * 3;

    const camera = (this.map.camera as PerspectiveCamera).lookFrom({
      yaw: 0,
      pitch: 0,
      roll: 0,
      eye: this._planeCenter,
    });
    const up = camera.up;
    const north = camera.forward;
    const east = cross(north, up);

    const heading = angle(projectVectorOnPlane(this._planeNormal, up), north, up);
    const pitch = angle(this._planeNormal, up, rotateAroundAxis(east, up, -heading));

    this._planeStyle = createPlaneStyle(this._planeMeshUrl, planeSize, -pitch, heading);
  }

  paintProjection(geoCanvas: GeoCanvas): void {
    if (!this._ready) {
      for (const point of this._points) {
        geoCanvas.drawIcon(point, DEFAULT_POINT_STYLE);
        geoCanvas.drawIcon(point, DEFAULT_OCCLUDED_POINT_STYLE);
      }
    }

    if (this._planeCenter && this._planeStyle) {
      geoCanvas.drawIcon3D(this._planeCenter, this._planeStyle);
    }
  }

  abstract project(viewPoint: Point): Point | null;
}
