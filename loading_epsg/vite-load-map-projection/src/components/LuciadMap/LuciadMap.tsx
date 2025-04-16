import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {
    addReference,
    getReference,
    isValidReferenceIdentifier,
    parseWellKnownText
} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
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
            loadProjection_EPSG_25832();
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:25832")});
            LoadLayers(nativeMap.current);
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[])
    return (<div className="LuciadMap" ref={divElement}></div>)
}

function loadProjection_EPSG_25832() {
    const wktString = `PROJCS["ETRS89 / UTM zone 32N",GEOGCS["ETRS89",DATUM["European Terrestrial Reference System 1989",SPHEROID["GRS 1980",6378137.0,298.257222101],TOWGS84[0.0,0.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["degree",0.017453292519943295],AXIS["Geodetic latitude",NORTH],AXIS["Geodetic longitude",EAST],AUTHORITY["EPSG",4258]],PROJECTION["Transverse Mercator"],PARAMETER["Latitude of natural origin",0.0],PARAMETER["central_meridian",9.0],PARAMETER["Scale factor at natural origin",0.9996],PARAMETER["False easting",500000.0],PARAMETER["False northing",0.0],UNIT["Meter",1.0],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG",25832]]`
    const reference = parseWellKnownText(wktString);
    if (reference && reference.identifier) {
        // Add new reference to the ReferenceProvider if not present
        if (!isValidReferenceIdentifier(reference.identifier)) {
            addReference(reference);
        }
    }
}

function LoadLayers(map: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e";

    const GermanWMS = "https://geodienste.hamburg.de/HH_WMS_DOP";
    const hamburgImagery = [{layer: "HH_WMS_DOP"}];

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
    map.layerTree.addChild(layer);

    // Load WMS for imagery around Hamburg
    WMSTileSetModel.createFromURL(GermanWMS, hamburgImagery, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {label: "Imagery"});
        map.layerTree.addChild(layer);
        // Zoom the map to fit the bounds of this layer
        if (model.bounds) map.mapNavigator.fit({bounds: model.bounds, animate: true});
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
