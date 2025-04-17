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
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory.js";

const COLOR_SPAN_HEIGHT= [
    "#000080", /* Deep Water */
    "#00BFFF", /* Shallow Water */
    "#00FF00", /* Sea Level */
    "#ADFF2F", /* Low Elevation */
    "#FFFF00", /* Medium Elevation */
    "#FFA500", /* High Elevation */
    "#FF0000", /* Very High Elevation */
    "#FFFFFF"  /* Mountain Peaks */
];

const TargetHSPCLayerID = "TARGET-HSPC-LAYER";

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);
    const pointCloudStyle = useRef(null as null |  PointCloudStyle);

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            LoadWMS(nativeMap.current);
            LoadHSPCLayer(nativeMap.current).then(hspcLayer=>{
                const range  = calculateDistanceToEarthCenter(hspcLayer.bounds);
                // Create a style for this layer taking into account the min/max from the bounds
                pointCloudStyle.current = createPointStyle(range);
                hspcLayer.pointCloudStyle = pointCloudStyle.current;
            });
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
                    if (pointCloudStyle.current) {
                        hspcLayer.pointCloudStyle.colorExpression = pointCloudStyle.current.colorExpression;
                    }
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



function LoadWMS(map: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Adds a WMS layer as a background
    WMSTileSetModel.createFromURL(wmsUrl, layerImageryName, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {
            label: "Satellite Imagery",
        });
        map.layerTree.addChild(layer);
    });
}



// Adding a HSPC Layer
function LoadHSPCLayer(map: WebGLMap) {
    const url = "https://datamonster.myvr.net/mMap/data/pointcloud/APR/SanFrancisco/tree.hspc";

    return new Promise<TileSet3DLayer>((resolve)=>{
        // Create the model
        HSPCTilesModel.create(url, {}).then((model:HSPCTilesModel)=>{
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "HSPC Layer",
                id: TargetHSPCLayerID
            });

            //Add the model to the map
            map.layerTree.addChild(layer);
            // Zoom to the point cloud location
            map.mapNavigator.fit({ bounds: layer.bounds, animate: true }).catch(()=>{});
            resolve(layer);
        });

    })


}

function createPointStyle(range: { min: number; max: number }): PointCloudStyle  {
    const averageHeight = range.min + (range.max-range.min) / 2;

    const min = Math.round(averageHeight - 20);
    const max = Math.round(averageHeight + 300);

    const minParameter = numberParameter(min);
    const maxParameter = numberParameter(max);

    const position = positionAttribute();
    const earthCenter = pointParameter({x: 0, y: 0, z: 0});
    const distanceToCenter = distance(position, earthCenter);
    const heightFraction = fraction(distanceToCenter, minParameter, maxParameter);

    const colorMix = COLOR_SPAN_HEIGHT.map(c => {
        return color(c);
    });

    return {
        gapFill: 3,
        pointSize:{
            mode: ScalingMode.ADAPTIVE_WORLD_SIZE,
            minimumPixelSize: 2,
            worldScale: 1
        },
        colorExpression: mixmap(heightFraction, colorMix)
    }
}


function calculateDistanceToEarthCenter(boundsIn: Bounds) {
    const bounds = reprojectBounds(boundsIn, getReference("EPSG:4978")) as Bounds;
    const a =  Math.sqrt(bounds.x * bounds.x + bounds.y * bounds.y + bounds.z * bounds.z);
    const b = Math.sqrt((bounds.x+bounds.width) * (bounds.x+bounds.width) + (bounds.y+bounds.height) * (bounds.y+bounds.height) + (bounds.z+bounds.depth) * (bounds.z+bounds.depth));
    return {
        min: Math.min(a,b),
        max: Math.max(a,b)
    };
}

function reprojectBounds(shape: Bounds, targetReference?:  CoordinateReference) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetReference =  targetReference ?  targetReference : getReference("EPSG:4326");
    const sourceReference = shape.reference;
    if ( sourceReference?.equals(targetReference)) {
        return shape;
    } else {
        const transformer = createTransformation(sourceReference!, targetReference);
        try {
            return transformer.transformBounds(shape);
        } catch (e) {
            return null;
        }
    }
}
