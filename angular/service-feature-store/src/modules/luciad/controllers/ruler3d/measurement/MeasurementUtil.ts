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
import { Measurement } from './Measurement';
import { Point } from '@luciad/ria/shape/Point';
import { DistanceMeasurement } from './DistanceMeasurement';
import { OrthogonalMeasurement } from './OrthogonalMeasurement';
import { AreaMeasurement } from './AreaMeasurement';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { Shape } from '@luciad/ria/shape/Shape';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition';
import { FormatUtil } from '../../util/FormatUtil';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { CreateMeasurementOptions, StationingMeasurement } from './StationingMeasurement';
import { Polyline } from '@luciad/ria/shape/Polyline';
import {EAnnotationsTypes} from '../../../interfaces/EAnnotationsTypes';

const iconFlag = `<mat-icon>
      <svg style="height: 16px;" role="img" aria-hidden="true" focusable="false" data-icon="flag" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V64 368 480c0 17.7 14.3 32 32 32s32-14.3 32-32V352l64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30V66.1c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48V32z"></path></svg>
   </mat-icon>`;

const MIN_MEASURE_DISTANCE = 0.02;
const MIN_MEASURE_ANGLE = 0.02;
const MIN_MEASURE_AREA = MIN_MEASURE_DISTANCE * MIN_MEASURE_DISTANCE;

const LABEL_STYLE: PointLabelStyle = {
  group: 'ruler3DLabel',
  padding: 2,
  priority: -100,
  positions: [PointLabelPosition.NORTH],
};

export function createMeasurement(
  type: EAnnotationsTypes,
  points: Point[] = [],
  options: CreateMeasurementOptions,
): Measurement {
  let measurement;
  if (type === EAnnotationsTypes.Stationing) {
    measurement = new StationingMeasurement(options);
  } else if (type === EAnnotationsTypes.Distance) {
    measurement = new DistanceMeasurement();
  } else if (type === EAnnotationsTypes.Orthogonal) {
    measurement = new OrthogonalMeasurement();
  } else if (type === EAnnotationsTypes.Area) {
    measurement = new AreaMeasurement();
  } else {
    throw new Error('Unsupported measurement type: ' + type);
  }
  for (const point of points) {
    measurement.addPoint(point);
  }

  return measurement;
}

function drawLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, text: string) {
  const html = `<div style='${style}'>${text}</div>`;
  labelCanvas.drawLabel(html, shape, LABEL_STYLE);
}

function drawLabel10mMark(labelCanvas: LabelCanvas, shape: Shape, style: string, text: string) {
  const html = `<div style='user-select: none;' class="stationing-10m-mark-label">${text}</div>`;
  labelCanvas.drawLabel(html, shape, {
    ...LABEL_STYLE,
    priority: -1,
    positions: PointLabelPosition.SOUTH,
    //   pin:{
    //     color: "rgb(210,210,210)",
    //     width: 2.5,
    //     haloColor: "rgb(36,55,98)",
    //     haloWidth: 0.5,
    // }
  });
}

function drawLabelCornerMark(labelCanvas: LabelCanvas, shape: Shape, style: string, text: string) {
  const html = `<div style='user-select: none;' class="stationing-corner-mark-label">${text}</div>`;
  labelCanvas.drawLabel(html, shape, {
    ...LABEL_STYLE,
    positions: PointLabelPosition.NORTH,
    // pin:{
    //   color: "rgb(210,210,210)",
    //   width: 2.5,
    //   haloColor: "rgb(36,55,98)",
    //   haloWidth: 0.5,
    // }
  });
}

// function drawLabelWithFlag(labelCanvas: LabelCanvas, shape: Shape, style: string, text: string) {
//   const style2 =
//     'line-height:20px; border-radius:5px;padding:4px;font-weight: bold;background-color:#1B97F3; color: black;';
//   const html = `<div style='${style2}'><div style="border-bottom: 2px solid #000; padding: 2px">${iconFlag}&nbsp;${text}<div></div>`;
//   labelCanvas.drawLabel(html, shape, { ...LABEL_STYLE, positions: PointLabelPosition.CENTER });
// }

function drawLabelWithFlag(labelCanvas: LabelCanvas, shape: Shape, style: string, text: string) {
  const finalText = text ? text : '';
  const html = `<div class="stationing-start-flag"><div>
    <span>${iconFlag}</span><span>${finalText}</span>
</div></div>`;
  labelCanvas.drawLabel(html, shape, { ...LABEL_STYLE, positions: PointLabelPosition.CENTER });
}

export function drawDistanceLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, distance: number) {
  if (distance < MIN_MEASURE_DISTANCE) {
    return;
  }
  drawLabel(labelCanvas, shape, style, FormatUtil.distance(distance));
}

export function drawStationingDistanceLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, distance: number) {
  if (distance < MIN_MEASURE_DISTANCE) {
    return;
  }
  const line = shape as Polyline;
  const point = line.getPoint(1);
  drawLabel(labelCanvas, point, style, FormatUtil.distance(distance));
}

export function drawStationingDistanceLabelEnd(labelCanvas: LabelCanvas, shape: Shape, style: string, label: string) {
  const line = shape as Polyline;
  const point = line.getPoint(1);
  drawLabelWithFlag(labelCanvas, point, style, label);
}

export function drawStationingDistanceLabelStart(labelCanvas: LabelCanvas, shape: Shape, style: string, label: string) {
  const line = shape as Polyline;
  const point = line.getPoint(0);
  drawLabelWithFlag(labelCanvas, point, style, label);
}

export function drawStationingDistanceLabel10mMark(
  labelCanvas: LabelCanvas,
  shape: Shape,
  style: string,
  label: string,
) {
  const point = shape as Point;
  drawLabel10mMark(labelCanvas, point, style, label);
}

export function drawStationingDistanceLabelCornerMark(
  labelCanvas: LabelCanvas,
  shape: Shape,
  style: string,
  distance: number,
) {
  if (typeof distance === 'undefined' || distance === null) {
    return;
  }
  if (distance < MIN_MEASURE_DISTANCE) {
    return;
  }
  const line = shape as Polyline;
  const point = line.getPoint(1);
  if (typeof distance === 'string') {
    drawLabelCornerMark(labelCanvas, point, style, distance);
  } else {
    drawLabelCornerMark(labelCanvas, point, style, FormatUtil.distance(distance));
  }
}

export function drawAngleLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, angle: number) {
  if (angle < MIN_MEASURE_ANGLE) {
    return;
  }
  drawLabel(labelCanvas, shape, style, FormatUtil.angle(angle));
}

export function drawAreaLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, area: number) {
  if (area < MIN_MEASURE_AREA) {
    return;
  }
  drawLabel(labelCanvas, shape, style, FormatUtil.area(area));
}

export function drawHeightLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, height: number) {
  drawLabel(labelCanvas, shape, style, FormatUtil.height(height));
}
