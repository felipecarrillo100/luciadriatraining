import {createCircle} from "@luciad/ria-toolbox-core/util/IconFactory";
import {MeasurementPaintStyles} from "@luciad/ria-toolbox-ruler3d/measurement/Measurement.ts";
import {IconStyle} from "@luciad/ria/view/style/IconStyle.js";

const RULER_COLOR = "rgb(255,0,0)";
const HELPER_COLOR = "rgb(255,255,0)";

export const OGC3D_PAINT_STYLES: MeasurementPaintStyles = {
    mainLineStyles: [
        {
            stroke: {
                color: RULER_COLOR,
                width: 5
            }
        },
    ],
    helperLineStyles: [
        {
            stroke: {
                color: HELPER_COLOR,
                width: 1
            }
        },
    ],
    areaStyles: [
        {
            fill: {
                color: "rgba(255,200,0,0.2)"
            },
            stroke: {
                color: "rgba(0,0,0,0)",
                width: 1
            }
        },
    ],
    pointStyles: [createIconStyle(RULER_COLOR)],
    mainLabelHtmlStyle: createHtmlStyle(RULER_COLOR),
    helperLabelHtmlStyle: createHtmlStyle(HELPER_COLOR, "rgb(0,0,0)"),
};

function createHtmlStyle(haloColor?: string, textColor?: string): string {
    textColor = textColor || "rgb(255,255,255)";
    haloColor = haloColor || "rgb(0,0,0)";
    return `font: bold 14px sans-serif;color:${textColor};text-shadow:${createTextShadowHalo(
        haloColor)}`;
}

function createTextShadowHalo(color: string): string {
    return `1px 1px ${color}, 1px -1px ${color}, -1px 1px ${color}, -1px -1px ${color};`;
}


function createIconStyle(color: string): IconStyle {
    const iconSize = 17;
    return {
        image: createCircle({
            stroke: color,
            fill: color,
            width: iconSize,
            height: iconSize
        }),
        width: `${iconSize}px`,
        height: `${iconSize}px`
    };
}
