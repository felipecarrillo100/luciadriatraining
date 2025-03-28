import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {ShapeType} from "@luciad/ria/shape/ShapeType.js";
import {MemoryStore} from "@luciad/ria/model/store/MemoryStore.js";
import {CreateFeatureInLayerController} from "../../modules/luciad/controllers/CreateFeatureInLayerController.ts";
import {EditController} from "@luciad/ria/view/controller/EditController";

const DefaultProperties = {
    name: "",
    abbr: ""
}

const TargetEditableLayerID = "target-edit-layer";

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

    const editNewShape = (shapeType: ShapeType) => (event: any) =>{
        if (nativeMap.current) createShapeInMap(nativeMap.current, shapeType)
    }
    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={editNewShape(ShapeType.POINT)}>Point</button>
            <button onClick={editNewShape(ShapeType.POLYLINE)}>Line</button>
            <button onClick={editNewShape(ShapeType.POLYGON)}>Polygon</button>
        </div>
    </div>)
}


function createShapeInMap(map: WebGLMap, shapeType: ShapeType) {
    const layer = map.layerTree.findLayerById(TargetEditableLayerID)
    map.controller = new CreateFeatureInLayerController(shapeType, {...DefaultProperties},
        {
            layer,
        });


    map.on("SelectionChanged", () => {
            const selection = map.selectedObjects;
            if (selection.length === 1 && selection[0].layer === layer) {
                if (selection[0].selected.length === 1) {
                    const feature = selection[0].selected[0];
                    const editController = new EditController(layer, feature, {
                        finishOnSingleClick: true
                    });
                    map.controller = editController;
                }
            }
    });
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

        // Once whe WMS layer has been loaded Add the WFS layer
        addMemoryStoreLayer(map);
    });
}

// Using  WFSFeatureStore.createFromUR
function addMemoryStoreLayer(map: WebGLMap) {
    const store= new MemoryStore();

    const model = new FeatureModel(store);
    //Create a layer for the model
    const layer = new FeatureLayer(model, {
        label: "Editable Layer",
        selectable: true,
        hoverable: true,
        id: TargetEditableLayerID
    });

    //Add the model to the map
    map.layerTree.addChild(layer);

    //fit on the cities layer
    const queryFinishedHandle = layer.workingSet.on("QueryFinished", () => {
        if (layer.bounds) {
            //#snippet layerFit
            map.mapNavigator.fit({
                bounds: layer.bounds,
                animate: true
            });
            //#endsnippet layerFit
        }
        queryFinishedHandle.remove();
    });

}




