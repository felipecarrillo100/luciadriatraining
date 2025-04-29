import {CompositeController} from "./CompositeController";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {PanoramaFeaturePainterV2} from "../../painters/PanoramaFeaturePainterV2";
import {ENABLED_CHANGE_EVENT, LookFromNavigationController} from "./LookFromNavigationController";
import {LeavePanoramaController} from "./LeavePanoramaController";
import {NoopController} from "./NoopController";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType";
import {
  END_MOVE_TO_PANORAMA_EVENT,
  ENTERED_PANORAMA_MODE_EVENT,
  LEFT_PANORAMA_MODE_EVENT,
  PanoramaActions,
  START_MOVE_TO_PANORAMA_EVENT
} from "./actions/PanoramaActions";
import {HoverFeatureController} from "./HoverFeatureController";
import {FEATURE_CLICKED, FeatureClickController} from "./FeatureClickController";
import {Controller} from "@luciad/ria/view/controller/Controller";
import Ruler3DController from "../measurementcontrollers/Ruler3DController/Ruler3DController";
import {SA_Ruler3DController} from "../ruler3d/SA_Ruler3DController";
import {
  ContextMenuOnClosestSurfaceController,
  OPEN_CONTEXTMENU_EVENT
} from "../contextmenuonclosestsurface/ContextMenuOnClosestSurfaceController";
import {ClickOnFeatureController, MAP_CLICKED} from "../clickcontroller/ClickOnFeatureController";
import {Point} from "@luciad/ria/shape/Point";
import {PaintPanoFeatureController} from "./PaintPanoFeatureController";
import {Layer} from "@luciad/ria/view/Layer";

class PanoramicController extends CompositeController {
    constructor(
        panoActions: PanoramaActions,
        panoLayers: FeatureLayer[],
        externalRulerController: Controller
    ) {
        super();
        const paintPanoController = new PaintPanoFeatureController(panoLayers)

      const handlePanoramaHover = (layer: FeatureLayer, feature: Feature | null): void => {
            const painter = layer.painter as PanoramaFeaturePainterV2;
            painter.setHover(feature);
            paintPanoController.handleHoverRepaint(!feature, layer, feature);
            if (layer.model && (layer.model as any).overviewMapLayer) {
                const overviewLayer = (layer.model as any).overviewMapLayer;
                const mainPainter = overviewLayer.painter;
                if (typeof mainPainter.setHover === "function") mainPainter.setHover(feature);
            }
        };

        const handlePanoramaClick = (feature: Feature, layer: FeatureLayer): void => {
            panoActions.moveToPanorama(feature, layer);
        };

        const mainMapController = this;
        const contextMenuController =  new ContextMenuOnClosestSurfaceController();
        const lookFromController = new LookFromNavigationController({enabled: false});
        const leavePanoController = new LeavePanoramaController(panoActions);
        const noopController = new NoopController({
            allowedEvents: [GestureEventType.SINGLE_CLICK_CONFIRMED],
            enabled: lookFromController.enabled
        });
        panoActions.on(ENTERED_PANORAMA_MODE_EVENT, () => {
            // in pano mode, use the lookFrom controls and enable noop (which blocks normal navigation)
            lookFromController.enabled = true;
            noopController.enabled = true;
            paintPanoController.show(true);
        });
        panoActions.on(START_MOVE_TO_PANORAMA_EVENT, () => {
            // while transitioning, disable lookFrom and enable noop (so the user can't do anything at all until the animation finishes)
            lookFromController.enabled = false;
            noopController.enabled = true;
        });
        panoActions.on(END_MOVE_TO_PANORAMA_EVENT, (feature, layer) => {
            lookFromController.enabled = true;
            noopController.enabled = true;
            paintPanoController.setActive(feature, layer);
        });
        panoActions.on(LEFT_PANORAMA_MODE_EVENT, () => {
            // outside pano mode, disable the lookFrom controls and disable noop (which blocks normal navigation)
            lookFromController.enabled = false;
            noopController.enabled = false;
            paintPanoController.show(false);
        });
        const hoverPanoController = new HoverFeatureController(panoLayers);
        hoverPanoController.on("HoverFeature", handlePanoramaHover);
        const clickPanoController = new FeatureClickController(panoLayers);
        clickPanoController.on(FEATURE_CLICKED, handlePanoramaClick);

        lookFromController.on(ENABLED_CHANGE_EVENT, (enabled) => {
            noopController.enabled = enabled;
        });

      contextMenuController.on(OPEN_CONTEXTMENU_EVENT, (p)=>{
        const map = this.map as any;
        if (map && typeof map.onCreateCustomContextMenu === "function") {
          (this.map as any).onCreateCustomContextMenu(p);
        }
      });

      const clickOnFeatureController = new ClickOnFeatureController();

      clickOnFeatureController.on(FEATURE_CLICKED, (feature: Feature, layer: FeatureLayer)=>{
        const map = this.map as any;
        if (map && layer && typeof (layer as any).onMouseClick === "function") {
          (layer as any).onMouseClick(feature, layer);
        }
      });

      clickOnFeatureController.on(MAP_CLICKED, (point: Point, worldPoint: Point)=>{
        const map = this.map as any;
        if (map && typeof (map as any).onMouseClick === "function") {
          (map as any).onMouseClick(point, worldPoint);
        }
      });


      // note the order here. click controller is before ruler, so when you click on a pano feature, you don't start measuring
      mainMapController.appendController(contextMenuController);

        mainMapController.appendController(hoverPanoController);
        mainMapController.appendController(clickPanoController);
        mainMapController.appendController(clickOnFeatureController);
        mainMapController.appendController(lookFromController);
        if (externalRulerController) mainMapController.appendController(externalRulerController);
        mainMapController.appendController(leavePanoController);
        mainMapController.appendController(noopController);
        mainMapController.appendController( paintPanoController );
    }

    public rulerControllerEnabled()  {
        const ruler = this.getControllerByType(Ruler3DController);
        if (ruler) {
            const ruler3D = ruler as Ruler3DController;
            return ruler3D.enabled;
        } else return false;
    }

  public rulerControllerSAEnabled()  {
    const ruler = this.getControllerByType(SA_Ruler3DController);
    if (ruler) {
      const ruler3D = ruler as SA_Ruler3DController;
      return ruler3D.enabled;
    } else return false;
  }
}

class OverviewPanoramicController extends CompositeController {
    constructor(
        panoActions: PanoramaActions,
        panoLayers: FeatureLayer[],
        extraController?: Controller
    ) {
        super();
        const handlePanoramaHover = (layer: FeatureLayer, feature: Feature | null): void => {
            const painter = layer.painter as PanoramaFeaturePainterV2;
            painter.setHover(feature);
            if (layer.model && (layer.model as any).mainMapLayer) {
                const mainMapLayer = (layer.model as any).mainMapLayer;
                const mainPainter = mainMapLayer.painter;
                if (typeof mainPainter.setHover === "function") mainPainter.setHover(feature);
            }
        };

        const handlePanoramaClick = (feature: Feature, layer: FeatureLayer): void => {
            if (layer.model && (layer.model as any).mainMapLayer) {
                const mainMapLayer = (layer.model as any).mainMapLayer;
                panoActions!.moveToPanorama(feature, mainMapLayer);
            }
        };

        const mainMapController = this;
        const overviewHoverController = new HoverFeatureController(panoLayers);
        overviewHoverController.on("HoverFeature", handlePanoramaHover);
        const overviewClickPanoController = new FeatureClickController(panoLayers);
        overviewClickPanoController.on(FEATURE_CLICKED, handlePanoramaClick);


        // note the order here. click controller is before ruler, so when you click on a pano feature, you don't start measuring
        mainMapController.appendController(overviewHoverController);
        mainMapController.appendController(overviewClickPanoController);
        if (extraController) mainMapController.appendController(extraController);
    }
}

export {
    PanoramicController,
    OverviewPanoramicController
}
