import * as ShapeFactory from "@luciad/ria/shape/ShapeFactory";
import { GeoCanvas } from "@luciad/ria/view/style/GeoCanvas";
import { LabelCanvas } from "@luciad/ria/view/style/LabelCanvas";
import { PointLabelPosition } from "@luciad/ria/view/style/PointLabelPosition";
import { Transformation } from "@luciad/ria/transformation/Transformation";
import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {Geodesy} from "@luciad/ria/geodesy/Geodesy";

import FormatUtil from "./FormatUtil";

import IconProvider, {IconProviderShapes} from "../../../utils/iconimagefactory/IconProvider";
import {ENUM_DISTANCE_UNIT} from "../../../utils/units/DistanceUnit";

import "./Ruler3DController.scss";

const DEFAULT_RULER_STYLE = {
    // fill: {color: "rgba(0,128,255,0.5)", width: 5},
 //   fill: {color: "rgba(255,125,68,0.75)", width: "5px"},
    fill: {color: "rgb(159,15,15)", width: "5px"},
//    stroke: {color: "rgb(0,113,225)", width: 5,  dash: [8, 2]},
    // stroke: {color: "rgb(0,113,225)", width: 5, draped: false},
    stroke: {color: "rgb(255,125,68)", width: 5, draped: false},
};

const DEFAULT_HELPER_STYLE = {
 //   stroke: {color: "rgb(0,255,255)", width: 1},
    stroke: {color: "rgb(252,213,114)", width: 1},
};

const DEFAULT_AREA_STYLE = {
   // fill: {color: "rgba(255,200,0,0.2)"},
    fill: {color: "rgba(0,128,255,0.2)"},
    stroke: {color: "rgba(0,0,0,0)", width: 1}
};

const HTML_TEMPLATE_PATTERN = "__CONTENT__";
const HTML_TEMPLATE_REGEX = new RegExp(HTML_TEMPLATE_PATTERN, 'g');

const DEFAULT_ICON_SIZE = {width:18, height:30};
const RULER_POINT_ICON: IconStyle =  {
    height: DEFAULT_ICON_SIZE.height + "px",
    image: IconProvider.paintIconByName(IconProviderShapes.POI, {
        fill: DEFAULT_RULER_STYLE.fill.color,
        height: DEFAULT_ICON_SIZE.height,
        stroke: DEFAULT_RULER_STYLE.stroke.color,
        width: DEFAULT_ICON_SIZE.width,
        strokeWidth:2,
    }),
    width: DEFAULT_ICON_SIZE.width + "px",
    draped: false,
    anchorY: DEFAULT_ICON_SIZE.height + "px",
}

const style = {
    areaStyle: DEFAULT_AREA_STYLE,
    helperLineStyle: DEFAULT_HELPER_STYLE,
    helperTextHtmlTemplate: createHtmlTemplate(DEFAULT_HELPER_STYLE.stroke.color, "rgb(0,0,0)"),
    iconStyle: RULER_POINT_ICON,
    labelStyle: {
        group: "ruler3DLabel",
        padding: 2,
        positions: [PointLabelPosition.NORTH],
        priority: -100,
    },
    lineStyle: DEFAULT_RULER_STYLE,
    textHtmlTemplate: createHtmlTemplate(DEFAULT_RULER_STYLE.stroke.color),
};

function createTextShadowHalo(color: string) {
    return '1px -1px ' + color + ', 1px -1px ' + color + ', -1px 1px ' + color + ', -1px -1px ' + color + ';'
}

function createHtmlTemplate(haloColor?: string, textColor?: string) {
    textColor = textColor || "rgb(255,255,255)";
    haloColor = haloColor || "rgb(0,0,0)";
    return '<div style=\'' +
        'font: bold 14px sans-serif;' +
        'color:' + textColor + ';' +
        'text-shadow:' + createTextShadowHalo(haloColor) +
        '\'>' + HTML_TEMPLATE_PATTERN + '</div>';
}

/**
 * Factory function creating Ruler 3D Presentation object
 * @param geoContext {geodesy, modelToWorldTx, worldToModelTx} contains utilities for geo calculations
 */
class Ruler3DPresentation {

    public static createPresentation(geoContext: any, units?: ENUM_DISTANCE_UNIT):Ruler3DPresentation {
        units = units ? units : ENUM_DISTANCE_UNIT.KM;
        return new Ruler3DPresentation(geoContext, units);
    }

    private _formatUtil: FormatUtil;
    private geodesy: Geodesy;
    private modelToWorldTx: Transformation;

    constructor(geoContext: any, units: ENUM_DISTANCE_UNIT) {
        this._formatUtil = new FormatUtil({units});
        this.geodesy = geoContext.geodesy;
        this.modelToWorldTx = geoContext.modelToWorldTx;
    }

    public get formatUtil(): FormatUtil {
        return this._formatUtil;
    }

    public set formatUtil(value: FormatUtil) {
        this._formatUtil = value;
    }

// HANDLE SEGMENT POINTS

    public drawSegmentPoints(geoCanvas: GeoCanvas, segment: any, i: number) {
        if (i === 0) {
            geoCanvas.drawIcon(segment.p1.modelPoint, style.iconStyle);
        }
        geoCanvas.drawIcon(segment.p2.modelPoint, style.iconStyle);
    }

    // DRAW SEGMENTS

    public drawSegment(geoCanvas: GeoCanvas, segment: any) {
        geoCanvas.drawShape(segment.line, style.lineStyle);
    }

    public drawSegmentLabel(labelCanvas: LabelCanvas, segment: any) {
        if (segment.distance) {
            const text = this._formatUtil.distanceText(segment.distance);
            const html = style.textHtmlTemplate.replace(HTML_TEMPLATE_REGEX, text);
            labelCanvas.drawLabel(html, segment.line, style.labelStyle);
        }
    }

    // DRAW ORTHOGONAL

    public drawOrtho(geoCanvas:any, segment: any) {

        const orthoInfo = this.memoOrthogonal(segment);

        if (orthoInfo.distanceH > 1 && orthoInfo.distanceV > 1) {
            geoCanvas.drawShape(orthoInfo.area, style.areaStyle);

            geoCanvas.drawShape(orthoInfo.lineH, style.helperLineStyle);
            geoCanvas.drawShape(orthoInfo.lineV, style.helperLineStyle);
        }
    }

    public drawOrthoLabel(labelCanvas: LabelCanvas, segment: any) {
        const orthoInfo = this.memoOrthogonal(segment);

        if (orthoInfo.distanceH > 1 && orthoInfo.distanceV > 1) {
            const lineHHtml = style.helperTextHtmlTemplate.replace(HTML_TEMPLATE_REGEX, this._formatUtil.distanceText(orthoInfo.distanceH));
            labelCanvas.drawLabel(lineHHtml, orthoInfo.lineH, style.labelStyle);
            const lineVHtml = style.helperTextHtmlTemplate.replace(HTML_TEMPLATE_REGEX, this._formatUtil.distanceText(orthoInfo.distanceV));
            labelCanvas.drawLabel(lineVHtml, orthoInfo.lineV, style.labelStyle);
            const angleHtml = style.helperTextHtmlTemplate.replace(HTML_TEMPLATE_REGEX, this._formatUtil.angleText(orthoInfo.angle));
            labelCanvas.drawLabel(angleHtml, segment.p1.modelPoint, style.labelStyle);
        }
    }


    // DRAW HEIGHT INFO

    public drawHeight(geoCanvas: GeoCanvas, segment: any, i: number) {
        if (i === 0) {
            this.drawHeightLine(geoCanvas, segment.p1.modelPoint);
        }
        this.drawHeightLine(geoCanvas, segment.p2.modelPoint);
    }

    public drawHeightLabel(labelCanvas:any , segment: any, i: number) {
        if (i === 0) {
            this.drawHeightLineLabel(labelCanvas, segment.p1.modelPoint);
        }
        this.drawHeightLineLabel(labelCanvas, segment.p2.modelPoint);
    }

    public drawHeightLine(geoCanvas: GeoCanvas, modelPoint: any) {
        const ref = modelPoint.reference;
        const pGround = ShapeFactory.createPoint(ref, [modelPoint.x, modelPoint.y, 0]);
        const verticalLine = ShapeFactory.createPolyline(ref, [pGround, modelPoint]);

        geoCanvas.drawShape(verticalLine, style.helperLineStyle);
    }

    public drawHeightLineLabel(labelCanvas: LabelCanvas, modelPoint: any) {
        const heightHtml = style.textHtmlTemplate.replace(HTML_TEMPLATE_PATTERN, "H: " + this._formatUtil.heightText(modelPoint.z));
        labelCanvas.drawLabel(heightHtml, modelPoint, style.labelStyle);
    }

    // DRAW AREA
    public drawArea(geoCanvas: GeoCanvas, segments: any) {
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

    public drawAreaLabel(labelCanvas: LabelCanvas, segments: any) {
        if (segments.length === 0) {
            return;
        }

        const p0 = segments[0].p1;
        let areaSum = 0;
        for (const segmenti of segments) {
            areaSum += segmenti.area;
        }

        const areaHtml = style.helperTextHtmlTemplate.replace(HTML_TEMPLATE_PATTERN, this._formatUtil.areaText(areaSum));
        labelCanvas.drawLabel(areaHtml, p0.modelPoint, style.labelStyle);
    }


    // SUMMARY ON TOTALS

    public getTotals(segments: any) {

        return segments.reduce((acc: any, segment: any)=>{
            acc.length += segment.distance;
            acc.area += segment.areaInfo ? segment.areaInfo.area : 0;
            return acc;
        }, {
            area: 0,
            length: 0,
        });
    }

    // HELPERS
    public memoOrthogonal(segment: any) {

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
            area: ShapeFactory.createPolygon(ref, [p1, p2, p90Model]),
            distanceH: dH,
            distanceV: dV,
            lineH: ShapeFactory.createPolyline(ref, [p1, p90Model]),
            lineV: ShapeFactory.createPolyline(ref, [p2, p90Model]),
        };
        segment.orthogonal = orthogonal;
        return orthogonal;
    }

    private memoArea(segment: any, p0: any) {
        const tripletToPolygon = (aTriplet: any) => {
            const modelPoints = aTriplet.map(this.toModelPoint);
            const ref = modelPoints[0].reference;
            return ShapeFactory.createPolygon(ref, modelPoints);
        }

        const tripletToArea = (aTriplet: any) => {
            const wPoints = aTriplet.map(this.toWorldPoint);
            return this.calculateArea(
                this.calculateDistance(wPoints[0], wPoints[1]),
                this.calculateDistance(wPoints[0], wPoints[2]),
                this.calculateDistance(wPoints[1], wPoints[2])
            );
        }

        if (segment.areaInfo && segment.isFinal) {
            return segment.areaInfo;
        }
        let areaInfo = {
            area: 0,
            shape: null as any,
        };

        const p1 = segment.p1;
        const p2 = segment.p2;
        if (p0.modelPoint !== p1.modelPoint) {
            const triplet = [p0, p1, p2];
            areaInfo = {
                area: tripletToArea(triplet),
                shape: tripletToPolygon(triplet),
            }
        }

        segment.areaInfo = areaInfo;
        return areaInfo;
    }

    private calculateDistance(wp1: any, wp2: any) {
        return this.geodesy.distance3D(wp1, wp2);
    }

    private toModelPoint(point: any) {
        return point.modelPoint;
    }

    private toWorldPoint(point: any) {
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
        // based on  Heron's Formula for the area of a triangle
        const p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a) * (p - b) * (p - c));
    }

}

export default Ruler3DPresentation;
