// From Angular Folder
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera";
import {
  END_MOVE_TO_PANORAMA_EVENT,
  ENTERED_PANORAMA_MODE_EVENT,
  LEFT_PANORAMA_MODE_EVENT,
  PanoramaActions,
  START_MOVE_TO_PANORAMA_EVENT
} from "./PanoramaActions";
import {LayerFactory} from "../../../factories/LayerFactory";
import Ruler3DController from "../../measurementcontrollers/Ruler3DController/Ruler3DController";
import {PanoramicController} from "../PanoramicController";

export function attachPanoToMap(map: WebGLMap, onPanoModeStatus:(entered: boolean)=>void, onPanoAnimationStatus?:(entered: boolean)=>void ) {
    if (!map) return;
    if (!(map.camera instanceof PerspectiveCamera)) {
        return;
    }
    const myPanoramaActions = new PanoramaActions(map);
    (map as any)._myPanoramaActions = myPanoramaActions;
    const enteredListener = myPanoramaActions.on(ENTERED_PANORAMA_MODE_EVENT, () => {
      onPanoModeStatus(true);
    });
    const leftListener = myPanoramaActions.on(LEFT_PANORAMA_MODE_EVENT, () => {
      onPanoModeStatus(false)
    });
    const startPanoramaMove = myPanoramaActions.on(START_MOVE_TO_PANORAMA_EVENT, (feature, layer)=>{
      if (typeof onPanoAnimationStatus === "function") onPanoAnimationStatus(true);
    });
    const finalizedPanoramaMove= myPanoramaActions.on(END_MOVE_TO_PANORAMA_EVENT, (feature, layer)=>{
      if (typeof onPanoAnimationStatus === "function") onPanoAnimationStatus(false);
    });

    (map as any)._myPanoramaListeners = {
      enteredListener,
      leftListener,
      startPanoramaMove,
      finalizedPanoramaMove
    };
}

export function detachPanoFromMap(map: WebGLMap) {
    if (!map) return;
    if ((map as any)._myPanoramaListeners ) {
        const panoramaListeners = (map as any)._myPanoramaListeners;
        for (const key in panoramaListeners) {
            if (key.hasOwnProperty(key)) {
                panoramaListeners[key].remove();
            }
        }
        delete (map as any)._myPanoramaActions;
        delete (map as any)._myPanoramaListeners;
    }
}

export  function attachPanoControllerToMap (map: WebGLMap, ruler3DController?: Ruler3DController) {
    if (map) {
        const panoLayers = LayerFactory.findFusionPanoramaLayers(map);
        if (panoLayers.length>0) {
            const panoActions = (map as any)._myPanoramaActions as PanoramaActions;
            const ruler3DController = new Ruler3DController({enabled: false})
            const panoramicController = new PanoramicController(panoActions, panoLayers, ruler3DController);
            map.controller = panoramicController;
            if (ruler3DController) {
                setTimeout(()=>{
                    // this.initializeRuler3DController(ruler3DController)
                },10);
            }
            console.info("Click on a point to enter panoramic view.");
        } else {
            console.info("No panoramic layers were found.");
        }
    }
}
