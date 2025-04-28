import { MapAbstractController } from './MapAbstractController';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { ENABLED_CHANGE_EVENT, LookFromNavigationController } from './LookFromNavigationController';
import { LeavePanoramaController } from './LeavePanoramaController';
import { NoopController } from './NoopController';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import {
  END_MOVE_TO_PANORAMA_EVENT,
  ENTERED_PANORAMA_MODE_EVENT,
  LEFT_PANORAMA_MODE_EVENT,
  PanoramaActions,
  START_MOVE_TO_PANORAMA_EVENT,
} from './actions/PanoramaActions';
import {
  FEATURE_CLICKED,
  OPEN_SIDE_PANEL_ON_FEATURE_CLICK,
  PanoFeatureClickController,
} from './PanoFeatureClickController';
import { PaintPanoFeatureController } from './PaintPanoFeatureController';
import { FirstPersonNavigationController } from '../firstperson/FirstPersonNavigationController';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

export class MinimalisticPanoramicController extends MapAbstractController {
  constructor(
    panoActions: PanoramaActions,
    panoLayers: FeatureLayer[],
    confirmationDialogService: ConfirmationDialogService,
  ) {
    super();
    const paintPanoController = new PaintPanoFeatureController(panoLayers);
    const handlePanoramaClick = (feature: Feature, layer: FeatureLayer): void => {
      panoActions?.moveToPanorama(feature, layer);
    };

    const handleOpeningOfSidePanel = (feature: Feature, layer: FeatureLayer): void => {
      panoActions?.openSidePanel(feature, layer);
    };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const mainMapController = this;
    const lookFromController = new LookFromNavigationController({ enabled: false });
    const leavePanoController = new LeavePanoramaController(panoActions);
    const noopController = new NoopController({
      allowedEvents: [GestureEventType.SINGLE_CLICK_CONFIRMED],
      enabled: lookFromController.enabled,
    });

    panoActions?.on(ENTERED_PANORAMA_MODE_EVENT, () => {
      // in pano mode, use the lookFrom controls and enable noop (which blocks normal navigation)
      lookFromController.enabled = true;
      noopController.enabled = true;
      paintPanoController.show(true);
    });

    panoActions?.on(START_MOVE_TO_PANORAMA_EVENT, () => {
      // while transitioning, disable lookFrom and enable noop (so the user can't do anything at all until the animation finishes)
      lookFromController.enabled = false;
      noopController.enabled = true;
    });

    panoActions?.on(END_MOVE_TO_PANORAMA_EVENT, (feature, layer) => {
      lookFromController.enabled = true;
      noopController.enabled = true;
      paintPanoController.setActive(feature, layer);
    });

    panoActions?.on(LEFT_PANORAMA_MODE_EVENT, () => {
      // outside pano mode, disable the lookFrom controls and disable noop (which blocks normal navigation)
      lookFromController.enabled = false;
      noopController.enabled = false;
      paintPanoController.show(false);
    });

    const clickPanoController = new PanoFeatureClickController();

    clickPanoController.on(FEATURE_CLICKED, handlePanoramaClick);
    clickPanoController.on(OPEN_SIDE_PANEL_ON_FEATURE_CLICK, handleOpeningOfSidePanel);

    lookFromController.on(ENABLED_CHANGE_EVENT, (enabled) => {
      noopController.enabled = enabled;
    });

    // note the order here. click controller is before ruler, so when you click on a pano feature, you don't start measuring
    mainMapController.appendController(clickPanoController);
    mainMapController.appendController(lookFromController);
    mainMapController.appendController(leavePanoController);
    mainMapController.appendController(noopController);
    mainMapController.appendController(paintPanoController);

    const allRoundControler = new FirstPersonNavigationController(
      {
        lockMouse: true,
        lockMouseOnActivate: false,
      },
      undefined,
      confirmationDialogService,
    );
    // @ts-ignore
    mainMapController.appendController(allRoundControler);
  }
}
