import React, {useEffect, useRef} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer.js";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel.js";
import "./LuciadMap.css";
import {UrlStore} from "@luciad/ria/model/store/UrlStore.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {FusionPanoramaModel} from "@luciad/ria/model/tileset/FusionPanoramaModel.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {PanoramaFeaturePainter} from "../../modules/luciad/painters/PanoramaFeaturePainter.ts";
import {PanoramaActions} from "../../modules/luciad/pano/actions/PanoramaActions.ts";
import {CreatePanoramaControllers} from "../../modules/luciad/pano/controller/CreatePanoramaControllers.ts";
import {BOX_CREATED_EVENT, BoxCreateController} from "@luciad/ria-toolbox-slicing/controllers/BoxCreateController.ts";
import {OrientedBox} from "@luciad/ria/shape/OrientedBox.js";
import {BoxSelectController} from "@luciad/ria-toolbox-slicing/controllers/BoxSelectController.ts";
import {Effect, VisibilityBoxSupport} from "@luciad/ria-toolbox-slicing/VisibilityBoxSupport.ts";
import {LayerGroup} from "@luciad/ria/view/LayerGroup.js";
import {orientedBox} from "@luciad/ria/util/expression/ExpressionFactory.js";

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);
    const visibilityBoxSupport = useRef(null as null | VisibilityBoxSupport);

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            LoadLayers(nativeMap.current);

            let layerGroup = nativeMap.current.layerTree.findLayerGroupById("VisibilityBoxSupportLayerGroup")
            if (!layerGroup) {
                layerGroup = new LayerGroup({label: "Visibility boxes", id: "VisibilityBoxSupportLayerGroup"});
                nativeMap.current.layerTree.addChild(layerGroup);
            }
            if (!visibilityBoxSupport.current) visibilityBoxSupport.current =  new VisibilityBoxSupport(nativeMap.current, layerGroup, []);
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[]);

    const onClick = () => {
        if (nativeMap.current) {
            const createController = new BoxCreateController();
            nativeMap.current.controller = createController;
            const createHandle = createController.on(
                BOX_CREATED_EVENT,
                (box: OrientedBox) => {
                    createHandle.remove();
                    const newConfig = {
                        id: new Date().toISOString(),
                        name: "box",
                        enabled: true,
                        expression: orientedBox(box),
                        isInsideLayers: [],
                        isOutsideLayers: [],
                        newLayersEffect: Effect.NONE,
                    }
                    if (nativeMap.current && visibilityBoxSupport.current) {
                        visibilityBoxSupport.current.addConfig(newConfig);
                        nativeMap.current.controller = new BoxSelectController(visibilityBoxSupport.current
                        , (controller)=>{
                                                    console.log(controller);
                                                    if (nativeMap.current) {
                                                        nativeMap.current.controller = controller
                                                    }
                                                })
                    }
                }
            );
        }
    }


    return (<div className="LuciadMap" >
        <div ref={divElement} className="map"/>
        <div className="button-bar">
            <button onClick={onClick}>BBox</button>
        </div>
    </div>)
}



function LoadLayers(map: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Adds a WMS layer as a background
    WMSTileSetModel.createFromURL(wmsUrl, layerImageryName, {}).then(async (model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {
            label: "Satellite Imagery",
        });
        map.layerTree.addChild(layer);

        // Once whe WMS layer has been loaded the Mesh layer
        addMeshLayer(map).then(()=>{
            addPanoramaLayer(map);
        });
    });
}



// Adding a Memory Store
function addMeshLayer(map: WebGLMap) {
    return new Promise<TileSet3DLayer>((resolve)=>{
        const url = "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json"
        OGC3DTilesModel.create(url, {}).then((model:OGC3DTilesModel)=>{
            //Create a layer for the model
            const layer = new TileSet3DLayer(model, {
                label: "Mesh Layer",
            });

            //Add the layer to the map
            map.layerTree.addChild(layer);
            resolve(layer);
        });
    });
}

function addPanoramaLayer(map: WebGLMap) {
    const target = "https://sampledata.luciad.com/data/panoramics/LucernePegasus/cubemap_final.json";
    const store = new UrlStore({
        target
    });
    const model = new FeatureModel(store);

    const panoModel = new FusionPanoramaModel(target);

    const layer = new FeatureLayer(model, {
        panoramaModel: panoModel,
        selectable: false,
        hoverable: true,
        painter:new PanoramaFeaturePainter({
            overview: false,
            iconHeightOffset: 0
        })
    });

    //Add the layer to the map
    map.layerTree.addChild(layer);

    //fit on the Panorama layer
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

    const panoramaActions = new PanoramaActions(map as WebGLMap)
    map.controller = CreatePanoramaControllers(panoramaActions, map, layer);

}
