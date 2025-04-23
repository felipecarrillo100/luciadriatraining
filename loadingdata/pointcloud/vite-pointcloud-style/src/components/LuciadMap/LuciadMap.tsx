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
import {PointCloudStyle} from "@luciad/ria/view/style/PointCloudStyle.js";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode.js";
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory.js";
import Slider from "rc-slider";
import 'rc-slider/assets/index.css';
import "./LuciadMap.css";
import {throttle} from "lodash";


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
    earthCenterDistance: {
        min: number;
        max: number;
    };
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
    const pointCloudStyle = useRef(null as null |  PointCloudStyle);
    const [rangeWithExpressions, setRangeWithExpressions] = useState(null as null |  RangeWithExpressions);
    const [minValue, setMinValue ] = useState(0);
    const [maxValue, setMaxValue ] = useState(0);
  //  const [range, setRange ] = useState({minimum: -100, maximum: 100});


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
                setMinValue(min);
                setMaxValue(max);
                result.range.minParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, min);
                result.range.maxParameter.value = calculateDistanceToEarthCenter(result.range.focusPoint_EPSG_4979, max);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MyHandle = (props: any) => {
        const handleStyle = { bottom: `${props.offset}%`};
        let value = 0;
        if (rangeWithExpressions) {
            value = props.value;
        }
        return(
            <div className="MyHandle" style={handleStyle} key={"rc-slider"+props.index}>
                { props.dragging && <div className="bubble">{value}</div> }
            </div>
        )
    }

    const throttleUpdate = throttle((value: number[])=>{
        if (rangeWithExpressions) {
            rangeWithExpressions.minParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[0]);
            rangeWithExpressions.maxParameter.value = calculateDistanceToEarthCenter(rangeWithExpressions.focusPoint_EPSG_4979, value[1]);
        }
    }, 1000, {trailing: false} );

    const update = (value: number[])=>{
        setMinValue(value[0]);
        setMaxValue(value[1]);
        throttleUpdate(value);
    }

    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={toggleStyle}>Toggle Mode</button>
        </div>
        <div className="vertical-slider">
            { rangeWithExpressions &&
                <Slider.Range vertical={true} allowCross={false}
                              min={rangeWithExpressions.ellipsoidHeight.min }
                              max={rangeWithExpressions.ellipsoidHeight.max }
                        value={[minValue, maxValue]}
                              step={0.1}
                        marks={{
                            [rangeWithExpressions.ellipsoidHeight.min]: <div className="mark123">{`${rangeWithExpressions.ellipsoidHeight.min.toFixed(2)}`}</div>,
                            [(rangeWithExpressions.ellipsoidHeight.max+rangeWithExpressions.ellipsoidHeight.min)*0.5]: <div className="mark123">{`Center`}</div>,
                            [rangeWithExpressions.ellipsoidHeight.max]: <div className="mark123">{`${rangeWithExpressions.ellipsoidHeight.max.toFixed(2)}`}</div>,
                        }}
                        handle={MyHandle}
                        onChange={update}/>
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
    const range  = calculateRangeDistanceToEarthCenter(bounds);
    const ellipsoidHeightBounds = calculateRangeMeterEllipsoidalHeight(bounds);

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
            // gapFill: 3,   // Too heavy style for Intel Integrated Graphic cards
            pointSize: {
                mode: ScalingMode.ADAPTIVE_WORLD_SIZE,
                minimumPixelSize: 2,
                worldScale: 1
            },
            colorExpression: mixmap(heightFraction, colorMix)
        },
        range: {
            focusPoint_EPSG_4979: ellipsoidHeightBounds.bounds.focusPoint,
            earthCenterDistance: {
                min: range.min,
                max: range.max,
            },
            ellipsoidHeight: {
                min: ellipsoidHeightBounds.min,
                max: ellipsoidHeightBounds.max,
            },
            minParameter,
            maxParameter
        }
    }
}

function calculateRangeDistanceToEarthCenter(boundsIn: Bounds) {
    // Reproject the bounds to the desired coordinate system
    const bounds = reprojectBounds(boundsIn, getReference("EPSG:4978")) as Bounds;

    // Pre-compute the corner coordinates
    const corners = [
        { x: bounds.x, y: bounds.y, z: bounds.z },
        { x: bounds.x + bounds.width, y: bounds.y, z: bounds.z },
        { x: bounds.x, y: bounds.y + bounds.height, z: bounds.z },
        { x: bounds.x, y: bounds.y, z: bounds.z + bounds.depth },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, z: bounds.z },
        { x: bounds.x + bounds.width, y: bounds.y, z: bounds.z + bounds.depth },
        { x: bounds.x, y: bounds.y + bounds.height, z: bounds.z + bounds.depth },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, z: bounds.z + bounds.depth }
    ];

    let minDistanceSquared = Infinity;
    let maxDistanceSquared = -Infinity;

    for (const corner of corners) {
        const distanceSquared = corner.x * corner.x + corner.y * corner.y + corner.z * corner.z;
        minDistanceSquared = Math.min(minDistanceSquared, distanceSquared);
        maxDistanceSquared = Math.max(maxDistanceSquared, distanceSquared);
    }

    return {
        min: Math.sqrt(minDistanceSquared),
        max: Math.sqrt(maxDistanceSquared)
    };
}

function calculateDistanceToEarthCenter(p: Point, height: number): number {
    const pointIn = p.copy();
    pointIn.z = height;
    // Reproject the point to the desired coordinate system;
    const point = reprojectPoint(pointIn, getReference("EPSG:4978")) as Point;

    // Calculate the distance from the Earth's center using the Euclidean distance formula
    return Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
}

function calculateRangeMeterEllipsoidalHeight(boundsIn: Bounds) {
    const bounds =  reprojectBounds(boundsIn, getReference("EPSG:4979")) as Bounds;
    const a = bounds.z;
    const b = bounds.z+bounds.depth;
    return {
        bounds,
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

function reprojectPoint(point: Point, targetReference?:  CoordinateReference) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetReference =  targetReference ?  targetReference : getReference("EPSG:4326");
    const sourceReference = point.reference;
    if ( sourceReference?.equals(targetReference)) {
        return point;
    } else {
        const transformer = createTransformation(sourceReference!, targetReference);
        try {
            return transformer.transform(point);
        } catch (e) {
            return null;
        }
    }
}




