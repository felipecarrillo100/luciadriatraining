import { Point } from '@luciad/ria/shape/Point';
import { ExtrudedShape } from '@luciad/ria/shape/ExtrudedShape';
import { ShapeList } from '@luciad/ria/shape/ShapeList';
import {
  createArcBand,
  createCircleByCenterPoint,
  createExtrudedShape,
  createPolyline,
  createShapeList,
} from '@luciad/ria/shape/ShapeFactory';
import { createEllipsoidalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Shape } from '@luciad/ria/shape/Shape';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import {
  END_POINT_STYLE,
  HELPER_LINES_OCCLUDED_STYLE,
  HELPER_LINES_STYLE,
  MAIN_FILLED_OCCLUDED_STYLE,
  MAIN_FILLED_STYLE,
  MAIN_STROKE_OCCLUDED_STYLE,
  MAIN_STROKE_STYLE,
  START_POINT_STYLE,
} from './HandleStyles';
import {CRSEnum} from '../../../interfaces/CRS.enum';

const CRS_84 = getReference(CRSEnum.CRS_84);
const GEODESY = createEllipsoidalGeodesy(CRS_84);

/**
 *  Class used to calculate and paint the helper styling for geolocation rotate handles.
 */
export class RotateHandleSupport {
  private readonly _center: Point;
  private readonly _start: Point;
  private readonly _circle: ExtrudedShape;
  private readonly _lines: ShapeList;
  private readonly _radius: number;
  private readonly _startAzimuth: number;

  private _end: Point;
  private _band: ExtrudedShape;
  private _lastRotation: number;

  constructor(centerLLH: Point, startLLH: Point) {
    this._center = centerLLH;
    this._start = startLLH;
    this._radius = GEODESY.distance(this._center, this._start);
    this._startAzimuth = GEODESY.forwardAzimuth(this._center, this._start);
    this._circle = this.toExtrudedShape(
      createCircleByCenterPoint(CRS_84, this._center, GEODESY.distance(this._center, this._start)),
    );
    this._lines = createShapeList(CRS_84);
    this._lines.addShape(this.toExtrudedShape(createCircleByCenterPoint(CRS_84, this._center, this._radius * 0.85)));
    for (let i = 0; i < 360; i += 15) {
      const azimuth = this._startAzimuth + i;
      this._lines.addShape(
        createPolyline(CRS_84, [
          GEODESY.interpolate(this._center, this._radius * 0.9, azimuth),
          GEODESY.interpolate(this._center, this._radius, azimuth),
        ]),
      );
    }

    this._end = this._start.copy();
    this._band = this.createArcBand(0);
    this._lastRotation = 0;
  }

  update(rotation: number) {
    this._end = GEODESY.interpolate(this._center, this._radius, this._startAzimuth + rotation);
    if (rotation * this._lastRotation < 0 && Math.abs(rotation - this._lastRotation) > 180) {
      this._lastRotation = rotation + (rotation < 0 ? 360 : -360);
    } else {
      this._lastRotation = rotation;
    }
    this._band = this.createArcBand(this._lastRotation);
  }

  private createArcBand(rotation: number) {
    return this.toExtrudedShape(createArcBand(CRS_84, this._center, 0, this._radius, this._startAzimuth, rotation));
  }

  drawBody(geoCanvas: GeoCanvas) {
    geoCanvas.drawIcon(this._start, START_POINT_STYLE);
    geoCanvas.drawIcon(this._end, END_POINT_STYLE);
    geoCanvas.drawShape(this._circle, MAIN_STROKE_STYLE);
    geoCanvas.drawShape(this._circle, MAIN_STROKE_OCCLUDED_STYLE);
    geoCanvas.drawShape(this._band, MAIN_FILLED_STYLE);
    geoCanvas.drawShape(this._band, MAIN_FILLED_OCCLUDED_STYLE);
    geoCanvas.drawShape(this._lines, HELPER_LINES_STYLE);
    geoCanvas.drawShape(this._lines, HELPER_LINES_OCCLUDED_STYLE);
  }

  drawLabel(labelCanvas: LabelCanvas) {
    const html = `<div style="background-color: white; color: black; padding: 6px; border-radius: 6px">${Math.abs(
      this._lastRotation,
    ).toFixed(1)}°</div>`;
    labelCanvas.drawLabel(html, this._start, {});
  }

  private toExtrudedShape(shape: Shape) {
    return createExtrudedShape(CRS_84, shape, this._center.z, this._center.z);
  }
}
