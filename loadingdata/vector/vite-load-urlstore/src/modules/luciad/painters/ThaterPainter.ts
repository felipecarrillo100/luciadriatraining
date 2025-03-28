import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas.js"
import {Map} from "@luciad/ria/view/Map.js";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget.js";
import {IconStyle} from "@luciad/ria/view/style/IconStyle.js";

import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition.js";

const normalStyle:  IconStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    url: "./resources/icons/theater_yellow.png",
    width: "48px",
    height: "48px"
}

const selectedStyle:  IconStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    url: "./resources/icons/theater_red.png",
    width: "48px",
    height: "48px"
}

export class ThaterPainter extends FeaturePainter {
    paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const style =
            paintState.selected ?
                {...selectedStyle} :
                {...normalStyle};
        if (paintState.hovered) {
            style.height = 64;
            style.width = 64;
        }
        geoCanvas.drawIcon(shape, style);
    }

    paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const label = !paintState.selected
            ? `<div class="theater_city_label"><span>${feature.properties.naam}</span></div>`
            : `<div class="theater_city_label"><span>${feature.properties.naam}</span><br/><span>${feature.properties.adres}</span></div>`

        labelCanvas.drawLabel(label, shape, {positions: [PointLabelPosition.NORTH, PointLabelPosition.SOUTH]});
    }
}
