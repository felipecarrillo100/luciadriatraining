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
import {Measurement, MeasurementType} from "./Measurement";
import {Point} from "@luciad/ria/shape/Point";
import {DistanceMeasurement} from "./DistanceMeasurement";
import {OrthogonalMeasurement} from "./OrthogonalMeasurement";
import {AreaMeasurement} from "./AreaMeasurement";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas";
import {Shape} from "@luciad/ria/shape/Shape";
import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition";
import {FormatUtil} from "../../util/FormatUtil";
import {PointLabelStyle} from "@luciad/ria/view/style/PointLabelStyle";

const MIN_MEASURE_DISTANCE = 0.02;
const MIN_MEASURE_ANGLE = 0.02;
const MIN_MEASURE_AREA = MIN_MEASURE_DISTANCE * MIN_MEASURE_DISTANCE;

const LABEL_STYLE: PointLabelStyle = {
  group: "ruler3DLabel",
  padding: 2,
  priority: -100,
  positions: [PointLabelPosition.NORTH]

}

export function createMeasurement(type: MeasurementType, points: Point[] = []): Measurement {
  let measurement;
  if (type === MeasurementType.DISTANCE) {
    measurement = new DistanceMeasurement();
  } else if (type === MeasurementType.ORTHOGONAL) {
    measurement = new OrthogonalMeasurement();
  } else if (type === MeasurementType.AREA) {
    measurement = new AreaMeasurement();
  } else {
    throw new Error("Unsupported measurement type: " + type);
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

export function drawDistanceLabel(labelCanvas: LabelCanvas, shape: Shape, style: string, distance: number) {
  if (distance < MIN_MEASURE_DISTANCE) {
    return;
  }
  drawLabel(labelCanvas, shape, style, FormatUtil.distance(distance));
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