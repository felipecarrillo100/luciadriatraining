import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Shape} from "@luciad/ria/shape/Shape";
import {Layer} from "@luciad/ria/view/Layer";
import {Map} from "@luciad/ria/view/Map";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas";
import {ShapeType} from "@luciad/ria/shape/ShapeType";
import {PointLabelStyle} from "@luciad/ria/view/style/PointLabelStyle";
import {OnPathLabelStyle} from "@luciad/ria/view/style/OnPathLabelStyle";
import {InPathLabelStyle} from "@luciad/ria/view/style/InPathLabelStyle";
import {IconFactory} from "../controls/ruler3d/IconFactory";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget";
import {OcclusionMode} from "@luciad/ria/view/style/OcclusionMode";
import {Point} from "@luciad/ria/shape/Point";
import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";


const AStyle = {
  selected: {
    lineStyle:{
      "draped": false,
      "drapeTarget": DrapeTarget.ALL,
      "stroke": {
        "color": "rgb(0,255,21)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    shapeStyle:{
      "draped": false,
      // "drapeTarget": DrapeTarget.ALL,
      "fill": {
        "color": "rgba(70,70,65,0.8)",
      },
      "stroke": {
        "color": "rgb(0, 255, 21)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    pointStyle:{
      draped: false,
      image: IconFactory.circle({
        fill: "rgba(255,0,0,1)",
        stroke: "rgba(255,255,255,1)",
        width: 15,
        height: 15
      }),
      width: "28px",
      height: "28px"
    }
  },
  default: {
    lineStyle:{
      "draped": false,
      "drapeTarget": DrapeTarget.ALL,
      "stroke": {
        "color": "rgb(0, 128, 256)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    shapeStyle:{
      "draped": false,
      // "drapeTarget": DrapeTarget.ALL,
      "fill": {
        "color": "rgba(70,70,65,0.6)",
      },
      "stroke": {
        "color": "rgb(0, 128, 256)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    pointStyle:{
      "draped": false,
      image: IconFactory.circle({
        fill: "rgba(255,0,0,1)",
        stroke: "rgba(255,255,255,1)",
        width: 10,
        height: 10
      }),
      width: "24px",
      height: "24px"
    }
  }
}

export const LineGeometries = [
  ShapeType.ARC, ShapeType.CIRCULAR_ARC, ShapeType.CIRCULAR_ARC_BY_3_POINTS, ShapeType.CIRCULAR_ARC_BY_BULGE, ShapeType.CIRCULAR_ARC_BY_CENTER_POINT, ShapeType.POLYLINE
];

export class DocumentFilePainter extends FeaturePainter {

  constructor() {
    super();
  }

  override getDetailLevelScales(layer?: FeatureLayer, map?: Map): number[] | null {
    return [1 / 1000];
  }
  override paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    let style;
    if (paintState.selected) {
      style = AStyle.selected;
    } else {
      style = AStyle.default;
    }
    if (shape.type === ShapeType.SHAPE_LIST){
      const MyShape = shape as any;
      for (const geometry of MyShape.geometries){
        this.paintBody(geoCanvas, feature, geometry, layer, map, paintState)
      }
    } else if (shape.type === ShapeType.POINT) {
      if (feature.properties && (feature.properties as any).icon) {
        const icon = (feature.properties as any).icon;
        this.drawIconPlus(geoCanvas, shape as Point, {...style.pointStyle, image: undefined, url: icon});
      } else {
        const pointStyle = {...style.pointStyle};
        this.drawIconPlus(geoCanvas, shape as Point, pointStyle);
      }
    } else if (LineGeometries.includes(shape.type)) {
      geoCanvas.drawShape(shape, style.lineStyle);
    } else {

        geoCanvas.drawShape(shape, style.shapeStyle);
    }
  }

  override paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    if (!paintState.hovered) return;

    const label = feature.properties["name"];
    let  cssStyle = 'color: white;';
         cssStyle += "white-space: nowrap;"
    // cssStyle += 'font: italic 12';
    const labelHTML = '<span style="'+cssStyle+'">' + label + "</span>";

    if (shape.type === ShapeType.POINT && shape.focusPoint) {
        labelCanvas.drawLabel(labelHTML, shape.focusPoint, {} as PointLabelStyle);
    } else if (shape.type === ShapeType.POLYLINE) {
      labelCanvas.drawLabelOnPath(labelHTML, shape, {} as OnPathLabelStyle);
    } else {
      labelCanvas.drawLabelInPath(labelHTML, shape, {} as InPathLabelStyle);
    }
  }

  private drawIconPlus(geocanvas:GeoCanvas, point: Point, iconStyle:IconStyle) {
    geocanvas.drawIcon(point, {...iconStyle, occlusionMode: OcclusionMode.OCCLUDED_ONLY});
    geocanvas.drawIcon(point, iconStyle);
  }

}
