import React, {useEffect, useRef, useState} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel.js";
import "./LuciadMap.css";
import {MeshStyle} from "@luciad/ria/view/style/MeshStyle.js";
import * as ExpressionFactory from "@luciad/ria/util/expression/ExpressionFactory.js";
import {
    attribute, number, divide,
    numberParameter, ParameterExpression, color, mixmap,
} from "@luciad/ria/util/expression/ExpressionFactory.js";
import {CustomRange} from "../CustomRange/CustomRange.tsx";
import {throttle} from "lodash";


const TargetMeshLayerID = "TARGET-MESH-LAYER";

const COLOR_MAP = [
    "#FF0000",
    "#FFA500",
    "#FFFF00",
    "#008000",
    "#0000FF",
    "#800080"
]

interface RangeWithExpressions {
    rangeIdValue: {
        min: number;
        max: number;
    },
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
                const result = createMeshStyle();
                meshStyle.current = result.meshStyle;
                setRangeWithExpressions(result.range);
                const min = result.range.rangeIdValue.min;
                const max = result.range.rangeIdValue.max;
                setSliderValues({min, max})
                result.range.minParameter.value =  min;
                result.range.maxParameter.value =  max;
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
            rangeWithExpressions.minParameter.value = value[0];
            rangeWithExpressions.maxParameter.value = value[1];
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
                    min={rangeWithExpressions.rangeIdValue.min}
                    max={rangeWithExpressions.rangeIdValue.max}
                    onChange={update}
                    values={[sliderValues.min, sliderValues.max]}
                    step={1}
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
 //   const url = "https://sampledata.luciad.com/data/ogc3dtiles/outback_PBR_Draco/tileset.json";
 //   const url = "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json";
  //  const url = "https://sampledata.luciad.com/data/ogc3dtiles/ScienceCenter/tileset.json";
  //  const url = "https://sampledata.luciad.com/data/ogc3dtiles/CommercialBuilding/tileset.json";
    const url = "https://sampledata.luciad.com/data/ogc3dtiles/Clinic/tileset.json";

    return new Promise<TileSet3DLayer>(resolve=>{
        OGC3DTilesModel.create(url, {}).then((model:OGC3DTilesModel)=>{
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "Mesh Layer",
                id: TargetMeshLayerID,
                idProperty: "FeatureID",
                selectable: true
            });

            console.log(model.modelDescriptor.properties);

            //Add the model to the map
            map.layerTree.addChild(layer);

            // Zoom to the layer bounds
            if (layer.bounds) map.mapNavigator.fit({ bounds: layer.bounds, animate: true});

            resolve(layer);
        });
    });
}

//  Defines a style to style a PointCloud
function createMeshStyle(): {
    meshStyle: MeshStyle;
    range: RangeWithExpressions;
}  {

    const minParameter = numberParameter(0);
    const maxParameter = numberParameter(6000);

    const propertyValue = attribute("FeatureID");
    const colorMix = COLOR_MAP.map((c) => {            //  COLOR_MAP contains 6 colors
        return color(c);
    });

    const divider = number(6000);
    const index = divide(propertyValue, divider);

    return {
        meshStyle: {
            visibilityExpression: ExpressionFactory.between(
                propertyValue,
                minParameter, maxParameter
            ),
//            colorExpression: map(index, colorMix, ExpressionFactory.color('rgb(0,0,0)'))
            colorExpression: mixmap(index, colorMix)
        },
        range: {
            rangeIdValue: {
                min: 0,
                max: 6000,
            },
            minParameter,
            maxParameter
        }
    }
}







