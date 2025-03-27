import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {WFSFeatureStore} from "@luciad/ria/model/store/WFSFeatureStore.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {WFSCapabilities} from "@luciad/ria/model/capabilities/WFSCapabilities.js";
import {StatesPainter} from "../../modules/luciad/painters/StatesPainter.ts";
import {CitiesPainter} from "../../modules/luciad/painters/CitiesPainter.ts";
import {RiversPainter} from "../../modules/luciad/painters/RiversPainter.ts";


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
        loadWFS_States(map);
        loadWFS_Cities(map);
        loadWFS_Rivers(map);
    });
}

// Using  WFSFeatureStore.createFromUR
function loadWFS_States(map: WebGLMap) {
    const wfsUrl = "https://sampleservices.luciad.com/wfs";
    WFSFeatureStore.createFromURL(wfsUrl, "ns4:t_states__c__1213").then((store: WFSFeatureStore) => {
        //Create a model for the store
        const model = new FeatureModel(store);
        //Create a layer for the model
        const layer = new FeatureLayer(model, {
            label: "USA",
            selectable: true,
            hoverable: true
        });
        layer.painter = new StatesPainter();
        //Add the model to the map
        map.layerTree.addChild(layer);
        if (layer.bounds) map.mapNavigator.fit({bounds: layer.bounds});
    });
}


// Using WFSFeatureStore.createFromCapabilities
function loadWFS_Cities(map: WebGLMap) {
    const wfsUrl = "https://sampleservices.luciad.com/wfs";
// Perform: wfsUrl?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.3.0
    WFSCapabilities.fromURL(wfsUrl)
        .then((capabilities: WFSCapabilities) => {
            // Create a store using the capabilities
            const store = WFSFeatureStore.createFromCapabilities(capabilities, "ns4:t_cities__c__1214");
            // Create a model for the store
            const model = new FeatureModel(store);
            // Create a layer for the model
            const layer = new FeatureLayer(model, {
                label: "Cities",
                selectable: true,
                hoverable: true
            });
            layer.painter = new CitiesPainter();
            // Add the model to the map
            map.layerTree.addChild(layer);
        });
}

function loadWFS_Rivers(map: WebGLMap) {
    const wfsUrl = "https://sampleservices.luciad.com/wfs";
    WFSFeatureStore.createFromURL(wfsUrl, "ns4:t_rivers__c__1212").then((store: WFSFeatureStore) => {
        //Create a model for the store
        const model = new FeatureModel(store);
        //Create a layer for the model
        const layer = new FeatureLayer(model, {
            label: "Rivers",
            selectable: true,
            hoverable: true
        });
        layer.painter = new RiversPainter();
        //Add the model to the map
        map.layerTree.addChild(layer);
        if (layer.bounds) map.mapNavigator.fit({bounds: layer.bounds});
    });
}


