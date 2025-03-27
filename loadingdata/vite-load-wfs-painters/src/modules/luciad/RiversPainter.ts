import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas.js"
import {Map} from "@luciad/ria/view/Map.js";
import {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle.js";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget.js";


const normalStyle: ShapeStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    stroke: {
        width: 2,
        color: "rgb(61,156,194)"
    },
    fill: {
        color: "rgb(61,156,194, 0.5)"
    }
}

const selectedStyle: ShapeStyle = {
    drapeTarget: DrapeTarget.TERRAIN,
    stroke: {
        width: 2,
        color: "rgb(178,69,127)"
    },
    fill: {
        color: "rgb(178,69,127, 0.5)"
    }
}

export class RiversPainter extends FeaturePainter {
    paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const style = paintState.selected
            ? JSON.parse(JSON.stringify(selectedStyle))
            : JSON.parse(JSON.stringify(normalStyle));

        if (paintState.hovered && style.stroke) {
            style.stroke.width = 4;
        }
        geoCanvas.drawShape(shape, style);
    }

    paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
        const name = feature.properties.NAME;
        const label = `<div class="painter_river_label"><span>${name}</span></div>`
        labelCanvas.drawLabelOnPath(label, shape, {});
    }
}
