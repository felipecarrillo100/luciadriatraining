import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel.js";
import "./LuciadMap.css";

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




