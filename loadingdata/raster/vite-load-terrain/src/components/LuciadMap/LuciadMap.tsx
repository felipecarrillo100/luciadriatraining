import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {FusionTileSetModel} from "@luciad/ria/model/tileset/FusionTileSetModel.js";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer.js";


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
    },[])
    return (<div className="LuciadMap" ref={divElement}></div>)
}


function LoadLayers(map: WebGLMap) {
    LoadTerrain(map);
    const wmsUrl = "https://sampleservices.luciad.com/wms";
    const imagery = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Method 3: createFromURL (GetCapabilities is called behind the scenes)
    WMSTileSetModel.createFromURL(wmsUrl, imagery, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {label: "Imagery"});
        map.layerTree.addChild(layer);
    });
}


function LoadTerrain(map: WebGLMap) {
    const ltsUrl = "https://sampleservices.luciad.com/lts";

    const layerImageryName = "world_elevation_6714a770-860b-4878-90c9-ab386a4bae0f";

    // Adds a WMS layer as a background
    FusionTileSetModel.createFromURL(ltsUrl, layerImageryName, {}).then((model:FusionTileSetModel) => {
        const layer = new RasterTileSetLayer(model, {
            label: "Elevation layer",
        });
        map.layerTree.addChild(layer);
    });
}
