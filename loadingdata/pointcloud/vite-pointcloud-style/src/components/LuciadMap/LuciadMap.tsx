import React, {useEffect, useRef, useState} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel.js";
import {
    color,
    distance,
    fraction,
    mixmap,
    numberParameter, ParameterExpression,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";
import {PointCloudStyle} from "@luciad/ria/view/style/PointCloudStyle.js";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode.js";
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory.js";
import Slider from "rc-slider";
import 'rc-slider/assets/index.css';
import "./LuciadMap.css";


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

interface RangeWithExpressions {
    min: number;
    max: number;
    minParameter: ParameterExpression<number>;
    maxParameter: ParameterExpression<number>;
}

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);
    const pointCloudStyle = useRef(null as null |  PointCloudStyle);
    const [rangeWithExpressions, setRangeWithExpressions] = useState(null as null |  RangeWithExpressions);
    const [minValue, setMinValue ] = useState(0);
    const [maxValue, setMaxValue ] = useState(0);


    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            LoadWMS(nativeMap.current);
            LoadHSPCLayer(nativeMap.current).then(hspcLayer=>{
                // Create a style for this layer taking into account the min/max from the bounds
                const result = createPointStyle(hspcLayer.bounds);
                pointCloudStyle.current = result.pointCloudStyle;
                setRangeWithExpressions(result.range);
                setMinValue(result.range.minParameter.value);
                setMaxValue(result.range.maxParameter.value);
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
        <div className="vertical-slider">
            { rangeWithExpressions &&
                <Slider range={true}  vertical={true} allowCross={false} min={rangeWithExpressions.min} max={rangeWithExpressions.max}
                        value={[minValue, maxValue]}
                        // handleRender={(node, handleProps) => {
                        //     return (
                        //         <Tooltip
                        //             overlayInnerStyle={{ minHeight: "auto" }}
                        //             overlay={"Height: " + (handleProps.value - rangeWithExpressions.min + rangeWithExpressions.seaLevel.min)}
                        //             placement="bottom"
                        //         >
                        //             {node}
                        //         </Tooltip>
                        //     );
                        // }}
                        marks={{
                            [rangeWithExpressions.min]: <div className="mark123">{`${Math.round(-(rangeWithExpressions.max-rangeWithExpressions.min)/2)}`}</div>,
                            [rangeWithExpressions.max]: <div className="mark123">{`${Math.round(rangeWithExpressions.max-rangeWithExpressions.min-(rangeWithExpressions.max-rangeWithExpressions.min)/2)}`}</div>,
                        }}
                        onChange={(value: any)=>{
                            setMinValue(value[0]);
                            rangeWithExpressions.minParameter.value = value[0];
                            setMaxValue(value[1]);
                            rangeWithExpressions.maxParameter.value = value[1];
                        }
                }/>
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

function createPointStyle(bounds: Bounds): {
    pointCloudStyle: PointCloudStyle;
    range: RangeWithExpressions;
}  {
    const range  = calculateFangeDistanceToEarthCenter(bounds);
    // const rangeSeaLevel = calculateRangeMeterFromSeaLevel(bounds);

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
        pointCloudStyle: {
            gapFill: 3,
            pointSize: {
                mode: ScalingMode.ADAPTIVE_WORLD_SIZE,
                minimumPixelSize: 2,
                worldScale: 1
            },
            colorExpression: mixmap(heightFraction, colorMix)
        },
        range: {
            min: range.min,
            max: range.max,
            minParameter,
            maxParameter
        }
    }
}


function calculateFangeDistanceToEarthCenter(boundsIn: Bounds) {
    const bounds = reprojectBounds(boundsIn, getReference("EPSG:4978")) as Bounds;
    const a =  Math.sqrt(bounds.x * bounds.x + bounds.y * bounds.y + bounds.z * bounds.z);
    const b = Math.sqrt((bounds.x+bounds.width) * (bounds.x+bounds.width) + (bounds.y+bounds.height) * (bounds.y+bounds.height) + (bounds.z+bounds.depth) * (bounds.z+bounds.depth));
    return {
        min: Math.min(a,b),
        max: Math.max(a,b)
    };
}

// function calculateRangeMeterFromSeaLevel(boundsIn: Bounds) {
//     const bounds =  reprojectBounds(boundsIn) as Bounds;
//     const a = bounds.z;
//     const b = bounds.z+bounds.depth;
//     return {
//         min: Math.min(a,b),
//         max: Math.max(a,b)
//     };
// }

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


