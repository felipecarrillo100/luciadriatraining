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


const AStyle = {
  selected: {
    lineStyle:{
      "draped": true,
      "drapeTarget": DrapeTarget.ALL,
      "stroke": {
        "color": "rgb(0,255,21)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    shapeStyle:{
      "draped": true,
      "drapeTarget": DrapeTarget.ALL,
      "fill": {
        "color": "rgb(70,70,65,0.8)",
      },
      "stroke": {
        "color": "rgb(0, 255, 21)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    pointStyle:{
      image: IconFactory.circle({
        fill: "rgba(255,0,0,1)",
        stroke: "rgba(255,255,255,1)",
        width: 10,
        height: 10
      }),
      width: "10px",
      height: "10px"
    }
  },
  default: {
    lineStyle:{
      "draped": true,
      "drapeTarget": DrapeTarget.ALL,
      "stroke": {
        "color": "rgb(0, 128, 256)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    shapeStyle:{
      "draped": true,
      "drapeTarget": DrapeTarget.ALL,
      "fill": {
        "color": "rgb(70,70,65,0.6)",
      },
      "stroke": {
        "color": "rgb(0, 128, 256)",
        "dashIndex" : "solid",
        "width": 2
      }
    },
    pointStyle:{
      image: IconFactory.circle({
        fill: "rgba(255,0,0,1)",
        stroke: "rgba(255,255,255,1)",
        width: 10,
        height: 10
      }),
      width: "10px",
      height: "10px"
    }
  }
}

export const LineGeometries = [
  ShapeType.ARC, ShapeType.CIRCULAR_ARC, ShapeType.CIRCULAR_ARC_BY_3_POINTS, ShapeType.CIRCULAR_ARC_BY_BULGE, ShapeType.CIRCULAR_ARC_BY_CENTER_POINT, ShapeType.POLYLINE
];

export class PortAssetsPainter extends FeaturePainter {
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
      const pointStyle = {...style.pointStyle};
      geoCanvas.drawIcon(shape, pointStyle);
    } else if (LineGeometries.includes(shape.type)) {
      geoCanvas.drawShape(shape, style.lineStyle);
    } else {
        geoCanvas.drawShape(shape, style.shapeStyle);
    }
  }

  override paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {

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
}
