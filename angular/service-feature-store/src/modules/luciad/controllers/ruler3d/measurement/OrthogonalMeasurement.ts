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
import { Polyline } from '@luciad/ria/shape/Polyline';
import { Polygon } from '@luciad/ria/shape/Polygon';
import { Point } from '@luciad/ria/shape/Point';
import { createPoint, createPolygon, createPolyline } from '@luciad/ria/shape/ShapeFactory';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import {
  CARTESIAN_GEODESY,
  Measurement,
  MeasurementPaintStyles,
  MEASUREMENTS_MODEL_REFERENCE,
  MeasurementSegment,
} from './Measurement';
import { RAD2DEG } from '../../util/Math';
import { drawAngleLabel, drawDistanceLabel } from './MeasurementUtil';
import { FormatUtil } from '../../util/FormatUtil';
import {EAnnotationsTypes} from '../../../interfaces/EAnnotationsTypes';

export interface OrthogonalMeasurementSegment extends MeasurementSegment {
  lineH: Polyline;
  lineV: Polyline;
  area: Polygon;
  distanceH: number;
  distanceV: number;
  angle: number;
}

export interface OrthogonalMeasurementInfo {
  length: number;
  width: number;
  height: number;
}

export class OrthogonalMeasurement extends Measurement<OrthogonalMeasurementSegment, OrthogonalMeasurementInfo> {
  constructor() {
    super(EAnnotationsTypes.Orthogonal);
  }

  protected createSegment(p1: Point, p2: Point): OrthogonalMeasurementSegment {
    const { pCorner, distance, distanceH, distanceV, angle } = calculateSegmentProperties(p1, p2);

    return {
      line: createPolyline(MEASUREMENTS_MODEL_REFERENCE, [p1, p2]),
      p1,
      p2,
      distance,
      lineH: createPolyline(MEASUREMENTS_MODEL_REFERENCE, [p1, pCorner]),
      lineV: createPolyline(MEASUREMENTS_MODEL_REFERENCE, [p2, pCorner]),
      distanceH,
      distanceV,
      angle,
      area: createPolygon(MEASUREMENTS_MODEL_REFERENCE, [p1, p2, pCorner]),
    };
  }

  recomputeSegment(segment: OrthogonalMeasurementSegment): void {
    super.recomputeSegmentLine(segment);

    const { pCorner, distance, distanceH, distanceV, angle } = calculateSegmentProperties(segment.p1, segment.p2);

    segment.distance = distance;
    segment.lineH = createPolyline(MEASUREMENTS_MODEL_REFERENCE, [segment.p1, pCorner]);
    segment.lineV = createPolyline(MEASUREMENTS_MODEL_REFERENCE, [segment.p2, pCorner]);
    segment.distanceH = distanceH;
    segment.distanceV = distanceV;
    segment.angle = angle;
    segment.area = createPolygon(MEASUREMENTS_MODEL_REFERENCE, [segment.p1, segment.p2, pCorner]);
  }

  paintBody(
    geoCanvas: GeoCanvas,
    { mainLineStyles, helperLineStyles, areaStyles, pointStyles }: MeasurementPaintStyles,
  ): void {
    for (const { line, lineH, lineV, area } of this.segments) {
      for (const style of mainLineStyles) {
        geoCanvas.drawShape(line, style);
      }
      for (const style of helperLineStyles) {
        geoCanvas.drawShape(lineH, style);
        geoCanvas.drawShape(lineV, style);
      }
      for (const style of areaStyles) {
        geoCanvas.drawShape(area, style);
      }
    }
    for (const point of this.points) {
      for (const style of pointStyles) {
        geoCanvas.drawIcon(point, style);
      }
    }
  }

  paintLabel(labelCanvas: LabelCanvas, styles: MeasurementPaintStyles): void {
    for (const { distance, line, distanceH, distanceV, p1, lineH, lineV, angle } of this.segments) {
      drawDistanceLabel(labelCanvas, line, styles.mainLabelHtmlStyle, distance);

      if (distanceH > 1 && distanceV > 1) {
        drawDistanceLabel(labelCanvas, lineH, styles.helperLabelHtmlStyle, distanceH);
        drawDistanceLabel(labelCanvas, lineV, styles.helperLabelHtmlStyle, distanceV);
        drawAngleLabel(labelCanvas, p1, styles.helperLabelHtmlStyle, angle);
      }
    }
  }

  calculateTotalInfo(): OrthogonalMeasurementInfo {
    let length = 0;
    let height = 0;
    let width = 0;

    for (const segment of this.segments) {
      length += segment.distance;
      height += segment.distanceV;
      width += segment.distanceH;
    }

    return { length, height, width };
  }

  getFormattedTotalInfo() {
    return [
      {
        label: 'Length',
        value: FormatUtil.distance(this.totalInfo.length),
      },
      {
        label: 'Height',
        value: FormatUtil.distance(this.totalInfo.height),
      },
      {
        label: 'Width',
        value: FormatUtil.distance(this.totalInfo.width),
      },
    ];
  }
}

function calculateSegmentProperties(p1: Point, p2: Point) {
  const distance = CARTESIAN_GEODESY.distance3D(p1, p2);
  const pCorner = createPoint(MEASUREMENTS_MODEL_REFERENCE, [p2.x, p2.y, p1.z]);
  const distanceH = CARTESIAN_GEODESY.distance3D(p1, pCorner);
  const distanceV = CARTESIAN_GEODESY.distance3D(p2, pCorner);
  const angle = Math.asin(distanceV / distance) * RAD2DEG;

  return {
    distance,
    pCorner,
    distanceH,
    distanceV,
    angle,
  };
}
