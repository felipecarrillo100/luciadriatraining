import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Shape} from "@luciad/ria/shape/Shape";
import {Layer} from "@luciad/ria/view/Layer";
import {Map} from "@luciad/ria/view/Map";
import {InPathLabelStyle} from "@luciad/ria/view/style/InPathLabelStyle";
import {ShapeType} from "@luciad/ria/shape/ShapeType";
import {PointLabelStyle} from "@luciad/ria/view/style/PointLabelStyle";
import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle";
import React from "react";
import GeoTools from "../../utils/GeoTools";


const iconStyleNear: IconStyle = {
  url: "./assets/icons/motion-sensor.png",
  height: 32,
  width: 32
}

const iconStyleFar: IconStyle = {
  url: "./assets/icons/document.png",
  height: 32,
  width: 32
}


const shapeStyle: ShapeStyle = {
  "fill": {
    "color": "rgba(255, 0, 0, 0.6)"
  },
  "stroke": {
    color: "rgb(255, 255, 0)",
    "width": 2
  }
}

export class DistanceAwarePainter extends FeaturePainter {
  private map: Map;
  constructor(map: Map) {
    super();
    this.map = map;
    this.map.on("MapChange", ()=>{
      this.invalidateAll();
    })
  }


  override paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {

    const distanceToCamera = shape && shape.focusPoint && map.camera && map.camera.eyePoint ? GeoTools.distance(shape.focusPoint, map.camera.eyePoint) : 10000;
    switch (shape.type) {
      case ShapeType.POINT:
        if (distanceToCamera<100) {
          geoCanvas.drawIcon(shape, iconStyleNear)
        } else {
          geoCanvas.drawIcon(shape, iconStyleFar)
        }
        break;
      case ShapeType.POLYLINE:
      case ShapeType.POLYGON:
        geoCanvas.drawShape(shape, shapeStyle)
        break;
    }
  }

  override paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    const label = feature.properties["name"];
    const cssStyle  = "color: white";
    const labelHTML = '<span style="'+cssStyle+'">' + label + "</span>";

    switch (shape.type) {
      case ShapeType.POINT:
        labelCanvas.drawLabel(labelHTML, shape, {} as PointLabelStyle);
        break;
      case ShapeType.POLYGON:
        labelCanvas.drawLabelInPath(labelHTML, shape, {} as InPathLabelStyle);
        break;
    }

  }

}
