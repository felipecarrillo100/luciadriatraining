import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {ThaterPainter} from "../../modules/luciad/painters/ThaterPainter.ts";
import {UrlStore} from "@luciad/ria/model/store/UrlStore";


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
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Adds a WMS layer as a background
    WMSTileSetModel.createFromURL(wmsUrl, layerImageryName, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {label: "Satellite Imagery"});
        map.layerTree.addChild(layer);

        // Once whe WMS layer has been loaded Add the WFS layer
        loadTheaters(map);
    });
}

// Using  WFSFeatureStore.createFromUR
function loadTheaters(map: WebGLMap) {
    const url = "./public/data/bruxelles_theatres.geojson";
    const store= new UrlStore({
        target: url
    });

    const model = new FeatureModel(store);
    //Create a layer for the model
    const layer = new FeatureLayer(model, {
        label: "Theaters Brussels",
        selectable: true,
        hoverable: true
    });

    layer.painter = new ThaterPainter();
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




