import {
    END_MOVE_TO_PANORAMA_EVENT,
    ENTERED_PANORAMA_MODE_EVENT, LEFT_PANORAMA_MODE_EVENT,
    PanoramaActions,
    START_MOVE_TO_PANORAMA_EVENT
} from "../actions/PanoramaActions";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";

import {DefaultController} from "@luciad/ria/view/controller/DefaultController.js";
import {CompositeController} from "@luciad/ria/view/controller/CompositeController.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {ReferenceType} from "@luciad/ria/reference/ReferenceType.js";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {Controller} from "@luciad/ria/view/controller/Controller.js";
import {KeyEvent} from "@luciad/ria/view/input/KeyEvent.js";
import {HandleEventResult} from "@luciad/ria/view/controller/HandleEventResult.js";

// From Toolbox:
import {FEATURE_CLICKED, FeatureClickController} from "ria-toolbox/libs/controller/FeatureClickController.js";
import {createMeasurement} from "ria-toolbox/libs/ruler3d/measurement/MeasurementUtil";
import {
    ENABLED_CHANGE_EVENT,
    LookFromNavigationController
} from "ria-toolbox/libs/controller/LookFromNavigationController";
import {Ruler3DController} from "ria-toolbox/libs/ruler3d/Ruler3DController";
import {DISTANCE_MEASUREMENT_TYPE} from "ria-toolbox/libs/ruler3d/measurement/DistanceMeasurement";
import {CustomHoverController} from "ria-toolbox/libs/controller/CustomHoverController";
import {CustomNoopController} from "ria-toolbox/libs/controller/CustomNoopController";

import {OGC3D_PAINT_STYLES} from "../Ruler3DStyling";

class LeavePanoramaController extends Controller {

    private _panoActions: PanoramaActions;

    constructor(panoActions: PanoramaActions) {
        super();
        this._panoActions = panoActions;
    }

    override onKeyEvent(keyEvent: KeyEvent): HandleEventResult {
        if (this._panoActions.isInPanoramaMode() && keyEvent.domEvent && keyEvent.domEvent.key === "Escape") {
            this._panoActions.leavePanoramaMode();
            return HandleEventResult.EVENT_HANDLED;
        }
        return HandleEventResult.EVENT_IGNORED;
    }
}
export const CreatePanoramaControllers = (panoActions: PanoramaActions, map: WebGLMap, panoLayer: FeatureLayer): Ruler3DController | null => {

    const handlePanoramaClick = (feature: Feature): void => {
        panoActions.moveToPanorama(feature, panoLayer);
    };

    const mainMapController = new CompositeController();
    const lookFromController = new LookFromNavigationController({enabled: false});
    const leavePanoController = new LeavePanoramaController(panoActions);
    const noopController = new CustomNoopController({
        allowedEvents: [GestureEventType.SINGLE_CLICK_CONFIRMED],
        enabled: lookFromController.enabled
    });
    panoActions.on(ENTERED_PANORAMA_MODE_EVENT, () => {
        // in pano mode, use the lookFrom controls and enable noop (which blocks normal navigation)
        lookFromController.enabled = true;
        noopController.enabled = true;
    });
    panoActions.on(START_MOVE_TO_PANORAMA_EVENT, () => {
        // while transitioning, disable lookFrom and enable noop (so the user can't do anything at all until the animation finishes)
        lookFromController.enabled = false;
        noopController.enabled = true;
    });
    panoActions.on(END_MOVE_TO_PANORAMA_EVENT, () => {
        lookFromController.enabled = true;
        noopController.enabled = true;
    });
    panoActions.on(LEFT_PANORAMA_MODE_EVENT, () => {
        // outside pano mode, disable the lookFrom controls and disable noop (which blocks normal navigation)
        lookFromController.enabled = false;
        noopController.enabled = false;
    });
    const hoverController = new CustomHoverController([panoLayer]);
    const clickPanoController = new FeatureClickController([panoLayer]);
    clickPanoController.on(FEATURE_CLICKED, handlePanoramaClick);

    lookFromController.on(ENABLED_CHANGE_EVENT, (enabled) => {
        noopController.enabled = enabled;
    });

    let rulerController: Ruler3DController | null = null;
    if (map.reference.referenceType !== ReferenceType.CARTESIAN) {
        rulerController = new Ruler3DController(createMeasurement(DISTANCE_MEASUREMENT_TYPE),
            {styles: OGC3D_PAINT_STYLES, enabled: false});
    }

    // note the order here. click controller is before ruler, so when you click on a pano feature, you don't start measuring
    mainMapController.appendController(clickPanoController);
    mainMapController.appendController(leavePanoController);
    mainMapController.appendController(lookFromController);
    mainMapController.appendController(hoverController);
    mainMapController.appendController(noopController);
    mainMapController.appendController(new DefaultController());
    map.defaultController = mainMapController;

    return rulerController;
};




