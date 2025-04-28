import * as ShapeFactory from '@luciad/ria/shape/ShapeFactory';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition';
import { Transformation } from '@luciad/ria/transformation/Transformation';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { Geodesy } from '@luciad/ria/geodesy/Geodesy';

import FormatUtil from './FormatUtil';

import IconProvider, { IconProviderShapes } from '../../../utils/iconimagefactory/IconProvider';
import { ENUM_DISTANCE_UNIT } from '../../../utils/units/DistanceUnit';

import './Ruler3DController.scss';
import { Shape } from '@luciad/ria/shape/Shape';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget';

const DEFAULT_RULER_STYLE = {
  fill: { color: 'rgb(159,15,15)', width: '5px' },
  stroke: { color: 'rgb(255,125,68)', width: 5, drapeTarget: DrapeTarget.NOT_DRAPED },
};

const DEFAULT_HELPER_STYLE = {
  //   stroke: {color: "rgb(0,255,255)", width: 1},
  stroke: { color: 'rgb(252,213,114)', width: 1 },
};

const DEFAULT_AREA_STYLE = {
  // fill: {color: "rgba(255,200,0,0.2)"},
  fill: { color: 'rgba(0,128,255,0.2)' },
  stroke: { color: 'rgba(0,0,0,0)', width: 1 },
};

const HTML_TEMPLATE_PATTERN = '__CONTENT__';
const HTML_TEMPLATE_REGEX = new RegExp(HTML_TEMPLATE_PATTERN, 'g');

const DEFAULT_ICON_SIZE = { width: 18, height: 30 };
const RULER_POINT_ICON: IconStyle = {
  height: DEFAULT_ICON_SIZE.height + 'px',
  image: IconProvider.paintIconByName(IconProviderShapes.POI, {
    fill: DEFAULT_RULER_STYLE.fill.color,
    height: DEFAULT_ICON_SIZE.height,
    stroke: DEFAULT_RULER_STYLE.stroke.color,
    width: DEFAULT_ICON_SIZE.width,
    strokeWidth: 2,
  }),
  width: DEFAULT_ICON_SIZE.width + 'px',
  drapeTarget: DrapeTarget.NOT_DRAPED,
  anchorY: DEFAULT_ICON_SIZE.height + 'px',
};

const style = {
  areaStyle: DEFAULT_AREA_STYLE,
  helperLineStyle: DEFAULT_HELPER_STYLE,
  helperTextHtmlTemplate: createHtmlTemplate(DEFAULT_HELPER_STYLE.stroke.color, 'rgb(0,0,0)'),
  iconStyle: RULER_POINT_ICON,
  labelStyle: {
    group: 'ruler3DLabel',
    padding: 2,
    positions: [PointLabelPosition.NORTH],
    priority: -100,
  },
  lineStyle: DEFAULT_RULER_STYLE,
  textHtmlTemplate: createHtmlTemplate(DEFAULT_RULER_STYLE.stroke.color),
};

function createTextShadowHalo(color: string) {
  return '1px -1px ' + color + ', 1px -1px ' + color + ', -1px 1px ' + color + ', -1px -1px ' + color + ';';
}

function createHtmlTemplate(haloColor?: string, textColor?: string) {
  textColor = textColor || 'rgb(255,255,255)';
  haloColor = haloColor || 'rgb(0,0,0)';
  return (
    "<div style='" +
    'font: bold 14px sans-serif;' +
    'color:' +
    textColor +
    ';' +
    'text-shadow:' +
    createTextShadowHalo(haloColor) +
    "'>" +
    HTML_TEMPLATE_PATTERN +
    '</div>'
  );
}

interface ShapeExtended extends Shape {
  x: number;
  y: number;
  z: number;
}

interface Segment {
  p1: {
    modelPoint: ShapeExtended;
    worldPoint: { x: number; y: number; z: number };
  };
  p2: {
    modelPoint: ShapeExtended;
    worldPoint: { x: number; y: number; z: number };
  };
  line?: Shape;
  distance?: number;
  isFinal?: boolean;
  orthogonal?: OrthogonalInfo;
  areaInfo?: AreaInfo;
}

interface OrthogonalInfo {
  angle: number;
  area: Shape;
  distanceH: number;
  distanceV: number;
  lineH: Shape;
  lineV: Shape;
}

interface AreaInfo {
  area: number;
  shape: Shape | null;
}

interface GeoContext {
  geodesy?: Geodesy;
  modelToWorldTx?: Transformation;
}

/**
 * Factory function creating Ruler 3D Presentation object
 * @param geoContext {geodesy, modelToWorldTx, worldToModelTx} contains utilities for geo calculations
 */
class Ruler3DPresentation {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static createPresentation(geoContext: any, units?: ENUM_DISTANCE_UNIT): Ruler3DPresentation {
    units = units ? units : ENUM_DISTANCE_UNIT.KM;
    return new Ruler3DPresentation(geoContext, units);
  }

  private _formatUtil: FormatUtil;
  private geodesy: Geodesy;
  private modelToWorldTx: Transformation;

  constructor(geoContext: GeoContext, units: ENUM_DISTANCE_UNIT) {
    this._formatUtil = new FormatUtil({ units });
    this.geodesy = geoContext.geodesy;
    this.modelToWorldTx = geoContext.modelToWorldTx;
  }

  public get formatUtil(): FormatUtil {
    return this._formatUtil;
  }

  public set formatUtil(value: FormatUtil) {
    this._formatUtil = value;
  }

  public drawSegmentPoints(geoCanvas: GeoCanvas, segment: Segment, i: number) {
    if (i === 0) {
      geoCanvas.drawIcon(segment.p1.modelPoint, style.iconStyle);
    }
    geoCanvas.drawIcon(segment.p2.modelPoint, style.iconStyle);
  }

  public drawSegment(geoCanvas: GeoCanvas, segment: Segment) {
    geoCanvas.drawShape(segment.line, style.lineStyle);
  }

  public drawSegmentLabel(labelCanvas: LabelCanvas, segment: Segment) {
    if (segment.distance) {
      const text = this._formatUtil.distanceText(segment.distance);
      const html = style.textHtmlTemplate.replace(HTML_TEMPLATE_REGEX, text);
      labelCanvas.drawLabel(html, segment.line, style.labelStyle);
    }
  }

  // DRAW ORTHOGONAL

  public drawOrtho(geoCanvas: GeoCanvas, segment: Segment) {
    const orthoInfo = this.memoOrthogonal(segment);

    if (orthoInfo.distanceH > 1 && orthoInfo.distanceV > 1) {
      geoCanvas.drawShape(orthoInfo.area, style.areaStyle);

      geoCanvas.drawShape(orthoInfo.lineH, style.helperLineStyle);
      geoCanvas.drawShape(orthoInfo.lineV, style.helperLineStyle);
    }
  }

  public drawOrthoLabel(labelCanvas: LabelCanvas, segment: Segment) {
    const orthoInfo = this.memoOrthogonal(segment);

    if (orthoInfo.distanceH > 1 && orthoInfo.distanceV > 1) {
      const lineHHtml = style.helperTextHtmlTemplate.replace(
        HTML_TEMPLATE_REGEX,
        this._formatUtil.distanceText(orthoInfo.distanceH),
      );
      labelCanvas.drawLabel(lineHHtml, orthoInfo.lineH, style.labelStyle);
      const lineVHtml = style.helperTextHtmlTemplate.replace(
        HTML_TEMPLATE_REGEX,
        this._formatUtil.distanceText(orthoInfo.distanceV),
      );
      labelCanvas.drawLabel(lineVHtml, orthoInfo.lineV, style.labelStyle);
      const angleHtml = style.helperTextHtmlTemplate.replace(
        HTML_TEMPLATE_REGEX,
        this._formatUtil.angleText(orthoInfo.angle),
      );
      labelCanvas.drawLabel(angleHtml, segment.p1.modelPoint, style.labelStyle);
    }
  }

  public drawHeight(geoCanvas: GeoCanvas, segment: Segment, i: number) {
    if (i === 0) {
      this.drawHeightLine(geoCanvas, segment.p1.modelPoint);
    }
    this.drawHeightLine(geoCanvas, segment.p2.modelPoint);
  }

  public drawHeightLabel(labelCanvas: LabelCanvas, segment: Segment, i: number) {
    if (i === 0) {
      this.drawHeightLineLabel(labelCanvas, segment.p1.modelPoint);
    }
    this.drawHeightLineLabel(labelCanvas, segment.p2.modelPoint);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public drawHeightLine(geoCanvas: GeoCanvas, modelPoint: any) {
    const ref = modelPoint.reference;
    const pGround = ShapeFactory.createPoint(ref, [modelPoint.x, modelPoint.y, 0]);
    const verticalLine = ShapeFactory.createPolyline(ref, [pGround, modelPoint]);

    geoCanvas.drawShape(verticalLine, style.helperLineStyle);
  }

  public drawHeightLineLabel(labelCanvas: LabelCanvas, modelPoint: ShapeExtended) {
    const heightHtml = style.textHtmlTemplate.replace(
      HTML_TEMPLATE_PATTERN,
      'H: ' + this._formatUtil.heightText(modelPoint.z),
    );
    labelCanvas.drawLabel(heightHtml, modelPoint, style.labelStyle);
  }

  public drawArea(geoCanvas: GeoCanvas, segments: Segment[]) {
    if (segments.length === 0) {
      return;
    }

    for (const segment of segments) {
      const p0 = segments[0].p1;
      const areaInfo = this.memoArea(segment, p0);
      if (areaInfo.shape) {
        geoCanvas.drawShape(areaInfo.shape, style.areaStyle);
      }
    }
  }

  public drawAreaLabel(labelCanvas: LabelCanvas, segments: Segment[]) {
    if (segments.length === 0) {
      return;
    }

    const p0 = segments[0].p1;
    let areaSum = 0;
    for (const segment of segments) {
      areaSum += segment.areaInfo ? segment.areaInfo.area : 0;
    }

    const areaHtml = style.helperTextHtmlTemplate.replace(HTML_TEMPLATE_PATTERN, this._formatUtil.areaText(areaSum));
    labelCanvas.drawLabel(areaHtml, p0.modelPoint, style.labelStyle);
  }

  // SUMMARY ON TOTALS

  public getTotals(segments: Segment[]) {
    return segments.reduce(
      (acc: { length: number; area: number }, segment: Segment) => {
        acc.length += segment.distance ?? 0;
        acc.area += segment.areaInfo ? segment.areaInfo.area : 0;
        return acc;
      },
      {
        area: 0,
        length: 0,
      },
    );
  }

  // HELPERS

  public memoOrthogonal(segment: Segment): OrthogonalInfo {
    if (segment.orthogonal && segment.isFinal) {
      return segment.orthogonal;
    }
    const p1 = segment.p1.modelPoint;
    const p2 = segment.p2.modelPoint;
    const ref = p1.reference;

    const p90Model = ShapeFactory.createPoint(ref, [p2.x, p2.y, p1.z]);

    const p90World = this.modelToWorldTx.transform(p90Model);
    const dH = this.calculateDistance(segment.p1.worldPoint, p90World);
    const dV = this.calculateDistance(segment.p2.worldPoint, p90World);
    const angle = this.calculateAngle(dV, segment.distance);

    const orthogonal = {
      angle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      area: ShapeFactory.createPolygon(ref, [p1 as any, p2 as any, p90Model]),
      distanceH: dH,
      distanceV: dV,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lineH: ShapeFactory.createPolyline(ref, [p1 as any, p90Model]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lineV: ShapeFactory.createPolyline(ref, [p2 as any, p90Model]),
    };
    segment.orthogonal = orthogonal;
    return orthogonal;
  }

  private memoArea(segment: Segment, p0: { modelPoint: ShapeExtended }): AreaInfo {
    const tripletToPolygon = (aTriplet: Segment['p1'][]) => {
      const modelPoints = aTriplet.map(this.toModelPoint);
      const ref = modelPoints[0].reference;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ShapeFactory.createPolygon(ref, modelPoints as any);
    };

    const tripletToArea = (aTriplet: Segment['p1'][]) => {
      const wPoints = aTriplet.map(this.toWorldPoint);
      return this.calculateArea(
        this.calculateDistance(wPoints[0], wPoints[1]),
        this.calculateDistance(wPoints[0], wPoints[2]),
        this.calculateDistance(wPoints[1], wPoints[2]),
      );
    };

    if (segment.areaInfo && segment.isFinal) {
      return segment.areaInfo;
    }
    let areaInfo: AreaInfo = {
      area: 0,
      shape: null,
    };

    const p1 = segment.p1;
    const p2 = segment.p2;
    if (p0.modelPoint !== p1.modelPoint) {
      const triplet = [p0, p1, p2];
      areaInfo = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        area: tripletToArea(triplet as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shape: tripletToPolygon(triplet as any),
      };
    }

    segment.areaInfo = areaInfo;
    return areaInfo;
  }

  private calculateDistance(wp1: { x: number; y: number; z: number }, wp2: { x: number; y: number; z: number }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.geodesy.distance3D(wp1 as any, wp2 as any);
  }

  private toModelPoint(point: { modelPoint: ShapeExtended }): ShapeExtended {
    return point.modelPoint;
  }

  private toWorldPoint(point: { worldPoint: { x: number; y: number; z: number } }) {
    return point.worldPoint;
  }

  private calculateAngle(opposite: number, hypotenuse: number) {
    const radians = Math.asin(opposite / hypotenuse);
    return this.radiansToDegrees(radians);
  }

  private radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  private calculateArea(a: number, b: number, c: number) {
    // based on Heron's Formula for the area of a triangle
    const p = (a + b + c) / 2;
    return Math.sqrt(p * (p - a) * (p - b) * (p - c));
  }
}

export default Ruler3DPresentation;
