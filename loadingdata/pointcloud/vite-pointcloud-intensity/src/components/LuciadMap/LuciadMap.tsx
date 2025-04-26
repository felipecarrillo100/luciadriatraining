import React, {useEffect, useRef, useState} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel.js";
import {
    attribute,
    color,
    fraction,
    mixmap,
    numberParameter,
    ParameterExpression,
} from "@luciad/ria/util/expression/ExpressionFactory.js";
import {PointCloudStyle} from "@luciad/ria/view/style/PointCloudStyle.js";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode.js";
import {throttle} from "lodash";
import {CustomRange} from "../CustomRange/CustomRange.tsx";
import "./LuciadMap.css";


const COLOR_SPAN_INTENSITY = [
    "#001F3F",
    "#0074D9",
    "#7FDBFF",
    "#B3E5FC",
    "#E0F7FA"
];

const TargetHSPCLayerID = "TARGET-HSPC-LAYER";

interface RangeWithExpressions {
    intensityRange: {
        min: number;
        max: number;
    },
    minParameter: ParameterExpression<number>;
    maxParameter: ParameterExpression<number>;
}

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);
    const pointCloudStyle = useRef(null as null | PointCloudStyle);
    const [rangeWithExpressions, setRangeWithExpressions] = useState(null as null | RangeWithExpressions);
    const [sliderValues, setSliderValues] = useState({min: -10, max: 10});

    useEffect(() => {
        // Initialize Map
        if (divElement.current !== null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            LoadWMS(nativeMap.current);
            LoadHSPCLayer(nativeMap.current).then(hspcLayer => {
                // Create a style for this layer taking into account the min/max from the bounds
                const result = createPointStyle();
                pointCloudStyle.current = result.pointCloudStyle;
                setRangeWithExpressions(result.range);
                const min = result.range.intensityRange.min;
                const max = result.range.intensityRange.max;
                setSliderValues({min, max})
                result.range.minParameter.value = min;
                result.range.maxParameter.value = max;
                hspcLayer.pointCloudStyle = pointCloudStyle.current;
            });
        }
        return () => {
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    }, []);

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


    const throttleUpdate = throttle((value: number[]) => {
        if (rangeWithExpressions) {
            rangeWithExpressions.minParameter.value = value[0];
            rangeWithExpressions.maxParameter.value = value[1];
        }
    }, 1000, {trailing: false});

    const update = (value: number[]) => {
        setSliderValues({min: value[0], max: value[1]});
        throttleUpdate(value);
    }

    return (<div className="LuciadMap">
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={toggleStyle}>Toggle Mode</button>
        </div>
        {rangeWithExpressions &&
            <>
                <div className="vertical-slider">
                    <CustomRange
                        min={rangeWithExpressions.intensityRange.min}
                        max={rangeWithExpressions.intensityRange.max}
                        onChange={update}
                        values={[sliderValues.min, sliderValues.max]}
                        step={0.01}
                    />
                </div>
            </>
        }
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
    // const url = "https://datamonster.myvr.net/mMap/data/pointcloud/APR/SanFrancisco/tree.hspc";
    const url = "https://demo.luciad.com/PortAIDemo/hspc/limerick/tree.hspc";

    return new Promise<TileSet3DLayer>((resolve) => {
        // Create the model
        HSPCTilesModel.create(url, {}).then((model: HSPCTilesModel) => {
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "HSPC Layer",
                id: TargetHSPCLayerID
            });

            console.log("Properties available");
            console.log(JSON.stringify(model.modelDescriptor.properties, null, 2));

            //Add the model to the map
            map.layerTree.addChild(layer);
            // Zoom to the point cloud location
            map.mapNavigator.fit({bounds: layer.bounds, animate: true}).catch(() => {
            });
            resolve(layer);
        });

    })
}

//  Defines a style to style a PointCloud
function createPointStyle(): {
    pointCloudStyle: PointCloudStyle;
    range: RangeWithExpressions;
} {
    // Range (8 bits)
    const minParameter = numberParameter(0);
    const maxParameter = numberParameter(256);

    // Coloring on attribute("Intensity")
    const intensityFraction = fraction(attribute("Intensity"), minParameter!, maxParameter!);

    // Create Color Map as an array of color Expressions
    const colorMix = COLOR_SPAN_INTENSITY.map(c => {
        return color(c);
    });

    return {
        pointCloudStyle: {
            pointSize: {
                mode: ScalingMode.ADAPTIVE_WORLD_SIZE,
                minimumPixelSize: 2,
                worldScale: 1
            },
            colorExpression: mixmap(intensityFraction, colorMix)
        },
        range: {
            intensityRange: {
                min: 0,
                max: 256,
            },
            minParameter,
            maxParameter
        }
    }
}





