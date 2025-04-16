import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel.js";
import "./LuciadMap.css";
import {
    color,
    distance,
    fraction,
    mixmap,
    numberParameter,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";
import {PointCloudStyle} from "@luciad/ria/view/style/PointCloudStyle.js";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode.js";

const COLOR_SPAN_HEIGHT_V2 = [
    "rgb( 51,102,  0)",
    "rgb( 51,102,  0)",
    "rgba( 60,179,113, 0.9)",
    "rgb(187,228,146)",
    "rgba( 222,184,135, 0.9)",
    "rgba( 205,102,  0, 0.9)",
    "rgba( 139, 69, 19, 0.9)",
    "rgba( 238,213,183, 0.9)",
    "rgba( 238,238,224, 0.9)",
    "rgba( 255,250,250, 0.9)"
]

const TargetHSPCLayerID = "TARGET-HSPC-LAYER";

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            LoadLayers(nativeMap.current);
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[]);

    const toggleStyle = () => {
        if (nativeMap.current) {
            const hspcLayer = nativeMap.current?.layerTree.findLayerById(TargetHSPCLayerID);
            if (hspcLayer instanceof TileSet3DLayer) {
                if (hspcLayer.pointCloudStyle.colorExpression === null) {
                    hspcLayer.pointCloudStyle.colorExpression = createPointStyle().colorExpression;
                } else {
                    hspcLayer.pointCloudStyle.colorExpression = null;
                }
            }
        }
    }


    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={toggleStyle}>Toggle Mode</button>
        </div>
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
    const url = "https://datamonster.myvr.net/mMap/data/pointcloud/APR/SanFrancisco/tree.hspc"

    // Create the model
    HSPCTilesModel.create(url, {}).then((model:HSPCTilesModel)=>{
        //Create a layer for the model
        const layer = new TileSet3DLayer(model, {
            label: "HSPC Layer",
            id: TargetHSPCLayerID
        });

        layer.pointCloudStyle = createPointStyle();

        //Add the model to the map
        map.layerTree.addChild(layer);

        // Zoom to the point cloud location
        map.mapNavigator.fit({ bounds: layer.bounds, animate: true });
        console.log("Z: "+ layer.bounds.z);
        console.log("Z+depth: "+layer.bounds.z+layer.bounds.depth);
        console.log("Depth: " + layer.bounds.depth);
    });
}

function createPointStyle(): PointCloudStyle  {
    const earthRadiusAtSanFransisco = 6370268;
    const minParameter = numberParameter(earthRadiusAtSanFransisco - 200);
    const maxParameter = numberParameter(earthRadiusAtSanFransisco + 300);

    console.log("Min: " + minParameter.value);
    console.log("Max: " + maxParameter.value);

    const position = positionAttribute();
    const earthCenter = pointParameter({x: 0, y: 0, z: 0});
    const distanceToCenter = distance(position, earthCenter);
    const heightFraction = fraction(distanceToCenter, minParameter, maxParameter);

    const colorMix = COLOR_SPAN_HEIGHT_V2.map(c => {
        return color(c);
    });

    return {
        gapFill: 2,
        pointSize:{
            mode: ScalingMode.PIXEL_SIZE,
            pixelSize: 2
        },
        colorExpression: mixmap(heightFraction, colorMix)
    }

}




