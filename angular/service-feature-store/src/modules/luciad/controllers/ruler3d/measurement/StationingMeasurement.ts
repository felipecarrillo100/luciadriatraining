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
import { Point } from '@luciad/ria/shape/Point';
import { createPolyline } from '@luciad/ria/shape/ShapeFactory';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import {
  CARTESIAN_GEODESY,
  GEODESIC_GEODESY,
  Measurement,
  MeasurementPaintStyles,
  MEASUREMENTS_MODEL_REFERENCE,
  MeasurementSegment,
} from './Measurement';
import {
  drawStationingDistanceLabel10mMark,
  drawStationingDistanceLabelCornerMark,
  drawStationingDistanceLabelStart,
} from './MeasurementUtil';
import { FormatUtil } from '../../util/FormatUtil';
import GeoTools from '../../../utils/GeoTools';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import {EAnnotationsTypes} from '../../../interfaces/EAnnotationsTypes';

const MAX_CARTESIAN_DISTANCE = 100000;

export interface DistanceMeasurementInfo {
  distance: number;
}

function calculateDistance(p1: Point, p2: Point) {
  const cartesianDistance = CARTESIAN_GEODESY.distance3D(p1, p2);
  return cartesianDistance < MAX_CARTESIAN_DISTANCE ? cartesianDistance : GEODESIC_GEODESY.distance3D(p1, p2);
}

const NewStationingStyles = [
  {
    stroke: {
      color: 'rgba(36,55,98,1)',
      width: 8,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  {
    stroke: {
      color: 'rgba(36,55,98,1)',
      width: 8,
    },
    occlusionMode: OcclusionMode.OCCLUDED_ONLY,
  },
];

const DASH_STYLE_TRUE = [
  {
    stroke: {
      color: 'rgba(36,55,98,1)',
      width: 4,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  {
    stroke: {
      color: 'rgba(36,55,98,1)',
      width: 4,
    },
    occlusionMode: OcclusionMode.OCCLUDED_ONLY,
  },
];
const DASH_STYLE_FALSE = [
  {
    stroke: {
      color: 'rgba(33,150,243,1)',
      width: 4,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  {
    stroke: {
      color: 'rgba(33,150,243,1)',
      width: 4,
    },
    occlusionMode: OcclusionMode.OCCLUDED_ONLY,
  },
];

export interface CreateMeasurementOptions {
  label: string;
  offset: number;
}

export class StationingMeasurement extends Measurement<MeasurementSegment, DistanceMeasurementInfo> {
  private _offset = 0;

  private label: string;
  constructor(options: CreateMeasurementOptions) {
    super(EAnnotationsTypes.Stationing);
    this.label = options.label;
    this._offset = options.offset ? Number(options.offset) : 0;
  }

  protected createSegment(p1: Point, p2: Point): MeasurementSegment {
    return {
      line: createPolyline(MEASUREMENTS_MODEL_REFERENCE, [p1, p2]),
      p1,
      p2,
      distance: calculateDistance(p1, p2),
    };
  }

  recomputeSegment(segment: MeasurementSegment): void {
    super.recomputeSegmentLine(segment);
    segment.distance = calculateDistance(segment.p1, segment.p2);
  }

  paintBody(geoCanvas: GeoCanvas, inputStyles: MeasurementPaintStyles): void {
    for (const { line } of this.segments) {
      for (const style of NewStationingStyles) {
        geoCanvas.drawShape(line, style);
      }
    }
    this.paintCustomDash(geoCanvas, inputStyles);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private paintCustomDash(geoCanvas: GeoCanvas, styles: MeasurementPaintStyles) {
    let accumulator = this._offset;
    for (let i = 0; i < this.segments.length; ++i) {
      const { distance } = this.segments[i];
      const markings = getMarkingsImproved(5, accumulator, this.segments[i], i);
      accumulator += distance;
      for (let j = 0; j < markings.length; ++j) {
        // const marking = markings[j];
        const line = createPolyline(this.segments[i].p1.reference, [markings[j].point1, markings[j].point2]);
        const colorToggle = markings[j].color !== 1;
        for (const style of colorToggle ? DASH_STYLE_TRUE : DASH_STYLE_FALSE) {
          geoCanvas.drawShape(line, style);
        }
      }
    }
  }

  paintLabel(labelCanvas: LabelCanvas, styles: MeasurementPaintStyles): void {
    let accumulator = this._offset;
    for (let i = 0; i < this.segments.length; ++i) {
      const { distance, line } = this.segments[i];
      const markings = getMarkingsImproved(10, accumulator, this.segments[i], i);
      accumulator += distance;
      drawStationingDistanceLabelCornerMark(labelCanvas, line, styles.mainLabelHtmlStyle, accumulator);
      if (i === 0) {
        drawStationingDistanceLabelStart(labelCanvas, line, styles.mainLabelHtmlStyle, this.label);
      }
      for (let j = 0; j < markings.length - 1; ++j) {
        const marking = markings[j];
        drawStationingDistanceLabel10mMark(labelCanvas, marking.point2, styles.mainLabelHtmlStyle, marking.value);
      }
    }
  }

  calculateTotalInfo(): DistanceMeasurementInfo {
    let distance = 0;
    for (const segment of this.segments) {
      distance += segment.distance;
    }

    return { distance };
  }

  getFormattedTotalInfo() {
    return [
      {
        label: 'Distance',
        value: FormatUtil.distance(this.totalInfo.distance),
      },
    ];
  }
}

// function getMarkings(distance: number, accumulator: number, measurementSegment2: MeasurementSegment) {
//   const d1 = accumulator;
//   const d2 = accumulator + measurementSegment2.distance;
//
//   if (d2 - d1 <= 0) return [];
//
//   let x = round(d1);
//   const marks = [];
//   while (x < d2) {
//     if (x > accumulator) marks.push(x);
//     x += distance;
//   }
//   return marks.map((mark) => ({
//     value: mark,
//     point: GeoTools.interpolate(measurementSegment2.p1, measurementSegment2.p2, (mark - d1) / (d2 - d1)),
//   }));
// }

function getMarkingsImproved(
  distanceMultiple: number,
  accumulator: number,
  measurementSegment2: MeasurementSegment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  i: number,
) {
  const d1 = accumulator;
  const d2 = accumulator + measurementSegment2.distance;

  const bottom = Math.floor(d1 / distanceMultiple);

  let left;
  let right;

  if (d1 > bottom * distanceMultiple) {
    left = d1;
    right = (bottom + 1) * distanceMultiple;
  } else {
    left = bottom * distanceMultiple;
    right = (bottom + 1) * distanceMultiple;
  }

  let color = bottom % 2;

  if (d2 - d1 <= 0) return [];

  const marks = [];

  let x = right;
  while (x < d2) {
    x += distanceMultiple;
    const coloredMark = { x1: left, x2: right, color };
    left = right;
    right = x;
    marks.push(coloredMark);
    color = (color + 1) % 2;
  }
  if (x > d2) {
    right = d2;
    const coloredMark = { x1: left, x2: right, color };
    marks.push(coloredMark);
  }
  return marks.map((coloredMark) => {
    return {
      color: coloredMark.color,
      value: coloredMark.x2,
      point1: GeoTools.interpolate(measurementSegment2.p1, measurementSegment2.p2, (coloredMark.x1 - d1) / (d2 - d1)),
      point2: GeoTools.interpolate(measurementSegment2.p1, measurementSegment2.p2, (coloredMark.x2 - d1) / (d2 - d1)),
    };
  });
}
