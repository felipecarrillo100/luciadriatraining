import React, {useEffect, useRef, useState} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel.js";
import "./LuciadMap.css";
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {MeshStyle} from "@luciad/ria/view/style/MeshStyle.js";
import {
    calculateDistanceToEarthCenter,
    calculateRangeMeterEllipsoidalHeight
} from "../../modules/geotools/GeoToolsLib.ts";
import * as ExpressionFactory from "@luciad/ria/util/expression/ExpressionFactory.js";
import{
    distance,
    numberParameter, ParameterExpression,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {CustomRange} from "../CustomRange/CustomRange.tsx";
import {throttle} from "lodash";


const TargetMeshLayerID = "TARGET-MESH-LAYER";

interface RangeWithExpressions {
    ellipsoidHeight: {
        min: number;
        max: number;
    },
    focusPoint_EPSG_4979: Point;
    minParameter: ParameterExpression<number>;
    maxParameter: ParameterExpression<number>;
}

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);

    const meshStyle = useRef(null as null |  MeshStyle);
    const [rangeWithExpressions, setRangeWithExpressions] = useState(null as null |  RangeWithExpressions);
    const [sliderValues, setSliderValues] = useState({min:-10, max: 10});

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            nativeMap.current.mapNavigator.constraints.above!.minAltitude = 0.5;
            LoadWMS(nativeMap.current);
            LoadMeshLayer(nativeMap.current).then(meshLayer=> {
                // Create a style for this layer taking into account the min/max from the bounds
                const result = createMeshStyle(meshLayer.bounds);
                meshStyle.current = result.meshStyle;
                setRangeWithExpressions(result.range);
                const oneTenth = (result.range.ellipsoidHeight.max - result.range.ellipsoidHeight.min)/100;
                const min = result.range.ellipsoidHeight.min + oneTenth * 40;
                const max = result.range.ellipsoidHeight.min + oneTenth * 60;
                setSliderValues({min, max})
                result.range.minParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, min);
                result.range.maxParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, max);
                meshLayer.meshStyle = meshStyle.current;
            });
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[]);

    const toggleStyle = () => {
        if (nativeMap.current) {
            const meshLayer = nativeMap.current?.layerTree.findLayerById(TargetMeshLayerID);
            if (meshLayer instanceof TileSet3DLayer) {
                if (meshLayer.meshStyle.visibilityExpression === null) {
                    if (meshStyle.current) {
                        meshLayer.meshStyle.visibilityExpression = meshStyle.current.visibilityExpression;
                    }
                } else {
                    meshLayer.meshStyle.visibilityExpression = null;
                }
            }
        }
    }


    const throttleUpdate = throttle((value: number[])=>{
        if (rangeWithExpressions) {
            rangeWithExpressions.minParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[0]);
            rangeWithExpressions.maxParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[1]);
        }
    }, 1000, {trailing: false} );

    const update = (value: number[])=>{
        setSliderValues({min:value[0], max: value[1]});
        throttleUpdate(value);
    }


    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={toggleStyle}>Toggle Mode</button>
        </div>
        <div className="vertical-slider">
            { rangeWithExpressions &&
                <CustomRange
                    min={rangeWithExpressions.ellipsoidHeight.min}
                    max={rangeWithExpressions.ellipsoidHeight.max}
                    onChange={update}
                    values={[sliderValues.min, sliderValues.max]}
                    step={0.01}
                />
            }
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



// Adding a Memory Store
function LoadMeshLayer(map: WebGLMap) {
    const url = "https://sampledata.luciad.com/data/ogc3dtiles/outback_PBR_Draco/tileset.json";
 //   const url = "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json";

    return new Promise<TileSet3DLayer>(resolve=>{
        OGC3DTilesModel.create(url, {}).then((model:OGC3DTilesModel)=>{
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "Mesh Layer",
                id: TargetMeshLayerID
            });

            //Add the model to the map
            map.layerTree.addChild(layer);

            // Zoom to the layer bounds
            if (layer.bounds) map.mapNavigator.fit({ bounds: layer.bounds, animate: true});

            resolve(layer);
        });
    });
}

//  Defines a style to style a PointCloud
function createMeshStyle(bounds: Bounds): {
    meshStyle: MeshStyle;
    range: RangeWithExpressions;
}  {
    const ellipsoidHeightBounds = calculateRangeMeterEllipsoidalHeight(bounds);
    const {focusPoint} = ellipsoidHeightBounds.bounds;

    const minParameter = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.min));
    const maxParameter = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.max));

    const position = positionAttribute();
    const earthCenter = pointParameter({x: 0, y: 0, z: 0});
    const distanceToCenter = distance(position, earthCenter);

    return {
        meshStyle: {
            visibilityExpression: ExpressionFactory.and(
                ExpressionFactory.lt(minParameter, distanceToCenter),
                ExpressionFactory.gt(maxParameter, distanceToCenter)
            )
        },
        range: {
            focusPoint_EPSG_4979: focusPoint,
            ellipsoidHeight: {
                min: ellipsoidHeightBounds.min,
                max: ellipsoidHeightBounds.max,
            },
            minParameter,
            maxParameter
        }
    }
}







