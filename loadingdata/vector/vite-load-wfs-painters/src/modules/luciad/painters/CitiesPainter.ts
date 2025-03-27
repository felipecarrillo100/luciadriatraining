import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas.js"
import {Map} from "@luciad/ria/view/Map.js";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget.js";
import {IconStyle} from "@luciad/ria/view/style/IconStyle.js";

import * as IconFactory from "../../utils/IconFactory.ts"
import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition.js";

const normalStyle:  IconStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    image: IconFactory.createCircle({
        width: 16,
        height: 16,
        stroke: "#000000",
        fill: "rgba(213,188,22,0.5)",
    }),
    width: "16px",
    height: "16px"
}

const selectedStyle:  IconStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    image: IconFactory.createCircle({
        width: 16,
        height: 16,
        stroke: "#000000",
        fill: "rgba(28,213,22,0.5)",
    }),
    width: "16px",
    height: "16px"
}

export class CitiesPainter extends FeaturePainter {
    paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const style = paintState.selected ? selectedStyle : normalStyle;
        if (paintState.hovered) {
            style.height = 20;
            style.width = 20;
        } else {
            style.height = 16;
            style.width = 16;
        }
        geoCanvas.drawIcon(shape, style);
    }

    paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const name = feature.properties.CITY;
        const label = `<div class="painter_city_label"><span>${name}</span></div>`
        labelCanvas.drawLabel(label, shape, {positions: [PointLabelPosition.NORTH, PointLabelPosition.SOUTH]});
    }
}
