import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSCapabilities} from "@luciad/ria/model/capabilities/WMSCapabilities.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {WMSCapabilitiesLayer} from "@luciad/ria/model/capabilities/WMSCapabilitiesLayer.js";
import {WMSVersion} from "@luciad/ria/ogc/WMSVersion.js";


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


function LoadLayers(nativeMap: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e";
    const layersCities = [{layer: "cities"}];
    const layersRivers = [{layer: "rivers"}];

    //  Method 1: Manual mode using native constructor:
    const model1 = new WMSTileSetModel({
        getMapRoot: wmsUrl,
        layers: [layerImageryName],
        reference: getReference("EPSG:3857"),
        imageFormat: "image/png",
        styles: [],
        transparent: true,
        version: WMSVersion.V130
    })
    const layer = new WMSTileSetLayer(model1, {label: "Satellite Images"});
    nativeMap.layerTree.addChild(layer);

    // Method 2: Create using createFromCapabilities
    // Performs: wmsUrl?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
    WMSCapabilities.fromURL(wmsUrl).then((capabilities: WMSCapabilities) => {
        console.log(capabilities.layers);
        const model = WMSTileSetModel.createFromCapabilities(capabilities, layersCities);
        const layer = new WMSTileSetLayer(model, {label: "States"});
        nativeMap.layerTree.addChild(layer);
        if (model.bounds) nativeMap.mapNavigator.fit({bounds: model.bounds, animate: true});
    });

    // Method 3: createFromURL (GetCapabilities is called behind the scenes)
    WMSTileSetModel.createFromURL(wmsUrl, layersRivers, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {label: "Rivers"});
        nativeMap.layerTree.addChild(layer);
    });
}


export function findLayerInTree(name: string, layers: WMSCapabilitiesLayer[]): WMSCapabilitiesLayer | undefined  {
    for (const layer of layers) {
        if (layer.name === name) {
            return layer;
        }
        if (layer.children && layer.children.length > 0) {
            const foundLayer = findLayerInTree(name, layer.children);
            if (foundLayer) {
                return foundLayer;
            }
        }
    }
    return undefined;
}
