import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel.js";
import {createCircle} from "@luciad/ria-toolbox-core/util/IconFactory.js";

import "./LuciadMap.css";
import {Ruler3DController} from "@luciad/ria-toolbox-ruler3d/Ruler3DController.ts";
import {createMeasurement} from "@luciad/ria-toolbox-ruler3d/measurement/MeasurementUtil.ts";
import {DISTANCE_MEASUREMENT_TYPE} from "@luciad/ria-toolbox-ruler3d/measurement/DistanceMeasurement.ts";
import {IconStyle} from "@luciad/ria/view/style/IconStyle.js";
import {MeasurementPaintStyles} from "@luciad/ria-toolbox-ruler3d/measurement/Measurement.ts";


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


export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});

            const measurement = createMeasurement(DISTANCE_MEASUREMENT_TYPE);
            nativeMap.current.controller = new Ruler3DController(measurement, {styles: OGC3D_PAINT_STYLES, enabled: true});


            LoadLayers(nativeMap.current);
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[]);


    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
    </div>)
}



function LoadLayers(map: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Adds a WMS layer as a background
    WMSTileSetModel.createFromURL(wmsUrl, layerImageryName, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {
            label: "Satellite Imagery",
        });
        map.layerTree.addChild(layer);

        // Once whe WMS layer has been loaded the Mesh layer
        addMeshLayer(map);
    });
}



// Adding a Memory Store
function addMeshLayer(map: WebGLMap) {
    const url = "https://sampledata.luciad.com/data/ogc3dtiles/outback_PBR_Draco/tileset.json"

    OGC3DTilesModel.create(url, {}).then((model:OGC3DTilesModel)=>{
        //Create a layer for the model
        const layer = new TileSet3DLayer(model, {
            label: "Mesh Layer",
        });

        //Add the model to the map
        map.layerTree.addChild(layer);

        // Zoom to the layer bounds
        if (layer.bounds) map.mapNavigator.fit({ bounds: layer.bounds, animate: true});
    });

}




