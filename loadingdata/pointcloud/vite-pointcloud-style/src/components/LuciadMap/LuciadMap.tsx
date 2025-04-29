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
    numberParameter,
    ParameterExpression,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";

import * as ExpressionFactory from "@luciad/ria/util/expression/ExpressionFactory.js";
import {PointCloudStyle} from "@luciad/ria/view/style/PointCloudStyle.js";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode.js";
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {throttle} from "lodash";
import {CustomRange} from "../CustomRange/CustomRange.tsx";
import {
    calculateDistanceToEarthCenter,
    calculateRangeMeterEllipsoidalHeight
} from "../../modules/geotools/GeoToolsLib.ts";
import "./LuciadMap.css";


const COLOR_SPAN_HEIGHT= [
    "#000080", /* Deep Water */
    "#00BFFF", /* Shallow Water */
    "#00FF00", /* Sea Level */
    "#ADFF2F", /* Low Elevation */
    "#FFFF00", /* Medium Elevation */
    "#FFA500", /* High Elevation */
    "#FF0000", /* Very High Elevation */
    // "#FFFFFF"  /* Mountain Peaks */
];

const TargetHSPCLayerID = "TARGET-HSPC-LAYER";

interface RangeWithExpressions {
    ellipsoidHeight: {
        min: number;
        max: number;
    },
    focusPoint_EPSG_4979: Point;
    minParameter: ParameterExpression<number>;
    maxParameter: ParameterExpression<number>;
    minParameterVisibility: ParameterExpression<number>;
    maxParameterVisibility: ParameterExpression<number>;
}

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);
    const pointCloudStyle = useRef(null as null |  PointCloudStyle);
    const [rangeWithExpressions, setRangeWithExpressions] = useState(null as null |  RangeWithExpressions);
    const [sliderValues, setSliderValues] = useState({min:-10, max: 10});
    const [sliderVisibilityValues, setSliderVisibilityValues] = useState({min:-10, max: 10});

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
                const oneTenth = (result.range.ellipsoidHeight.max - result.range.ellipsoidHeight.min)/100;
                const min = result.range.ellipsoidHeight.min + oneTenth * 50;
                const max = result.range.ellipsoidHeight.min + oneTenth * 55;
                setSliderValues({min, max});
                setSliderVisibilityValues({min, max});
                result.range.minParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, min);
                result.range.maxParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, max);

                result.range.minParameterVisibility.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, min);
                result.range.maxParameterVisibility.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, max);

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


    const throttleUpdate = throttle((value: number[])=>{
        if (rangeWithExpressions) {
            rangeWithExpressions.minParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[0]);
            rangeWithExpressions.maxParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[1]);
        }
    }, 1000, {trailing: false} );

    const throttleUpdateVisibility = throttle((value: number[])=>{
        if (rangeWithExpressions) {
            rangeWithExpressions.minParameterVisibility.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[0]);
            rangeWithExpressions.maxParameterVisibility.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[1]);
        }
    }, 1000, {trailing: false} );

    const updateColorExpression = (value: number[])=>{
        setSliderValues({min:value[0], max: value[1]});
        throttleUpdate(value);
    }

    const updateVisibility = (value: number[])=>{
        setSliderVisibilityValues({min:value[0], max: value[1]});
        throttleUpdateVisibility(value);
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
                    onChange={updateColorExpression}
                    values={[sliderValues.min, sliderValues.max]}
                    step={0.01}
                />
            }
        </div>
        <div className="vertical-slider-2">
            { rangeWithExpressions &&
                <CustomRange
                    min={rangeWithExpressions.ellipsoidHeight.min}
                    max={rangeWithExpressions.ellipsoidHeight.max}
                    onChange={updateVisibility}
                    values={[sliderVisibilityValues.min, sliderVisibilityValues.max]}
                    step={0.01}
                />
            }
        </div>
    </div>)
}

// Load WMS Layer
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
    // const url = "https://demo.luciad.com/PortAIDemo/hspc/limerick/tree.hspc";

    return new Promise<TileSet3DLayer>((resolve)=>{
        // Create the model
        HSPCTilesModel.create(url, {}).then((model:HSPCTilesModel)=>{
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "HSPC Layer",
                id: TargetHSPCLayerID
            });

            console.log(model.modelDescriptor.properties);

            //Add the model to the map
            map.layerTree.addChild(layer);
            // Zoom to the point cloud location
            map.mapNavigator.fit({ bounds: layer.bounds, animate: true }).catch(()=>{});
            resolve(layer);
        });

    })
}

//  Defines a style to style a PointCloud
function createPointStyle(bounds: Bounds): {
    pointCloudStyle: PointCloudStyle;
    range: RangeWithExpressions;
}  {
    const ellipsoidHeightBounds = calculateRangeMeterEllipsoidalHeight(bounds);
    const {focusPoint} = ellipsoidHeightBounds.bounds;

    const minParameter = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.min));
    const maxParameter = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.max));

    const minParameterVisibility = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.min));
    const maxParameterVisibility = numberParameter(calculateDistanceToEarthCenter(focusPoint, ellipsoidHeightBounds.max));

    // Uses absolute position of the point as value to evaluate in the expressions
    const position = positionAttribute();
    const earthCenter = pointParameter({x: 0, y: 0, z: 0});
    const distanceToCenter = distance(position, earthCenter);
    const heightFraction = fraction(distanceToCenter, minParameter, maxParameter);

    const colorMix = COLOR_SPAN_HEIGHT.map(c => {
        return color(c);
    });

    return {
        pointCloudStyle: {
           //  gapFill: 3,   // Too heavy style for Intel Integrated Graphic cards
            pointSize: {
                mode: ScalingMode.ADAPTIVE_WORLD_SIZE,
                minimumPixelSize: 2,
                worldScale: 1
            },
            colorExpression: mixmap(heightFraction, colorMix),
            visibilityExpression: ExpressionFactory.and(
                ExpressionFactory.lt(minParameterVisibility, distanceToCenter),
                ExpressionFactory.gt(maxParameterVisibility, distanceToCenter)
            )
        },
        range: {
            focusPoint_EPSG_4979: focusPoint,
            ellipsoidHeight: {
                min: ellipsoidHeightBounds.min,
                max: ellipsoidHeightBounds.max,
            },
            minParameter,
            maxParameter,
            minParameterVisibility,
            maxParameterVisibility
        }
    }
}





