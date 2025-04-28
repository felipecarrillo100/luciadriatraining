import { MapAbstractController } from './MapAbstractController';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { LeavePanoramaController } from './LeavePanoramaController';
import { NoopController } from './NoopController';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import {
  END_MOVE_TO_PANORAMA_EVENT,
  ENTERED_PANORAMA_MODE_EVENT,
  LEFT_PANORAMA_MODE_EVENT,
  PanoramaActions,
} from './actions/PanoramaActions';
import {
  FEATURE_CLICKED,
  OPEN_SIDE_PANEL_ON_FEATURE_CLICK,
  PanoFeatureClickController,
} from './PanoFeatureClickController';
import { PaintPanoFeatureController } from './PaintPanoFeatureController';
import { FirstPersonNavigationController } from '@pages/map/luciad-map/controllers/firstperson/FirstPersonNavigationController';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { LookFromPanController } from '@pages/map/luciad-map/controllers/panocontroller/LookFromPanController';

export class PanoramicObserverController extends MapAbstractController {
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
    const lookFromController = new LookFromPanController();
    const leavePanoController = new LeavePanoramaController(panoActions);
    const noopController = new NoopController({
      allowedEvents: [
        GestureEventType.SINGLE_CLICK_CONFIRMED,
        GestureEventType.DOUBLE_CLICK,
        GestureEventType.CONTEXT_MENU,
      ],
      enabled: true,
    });
    panoActions?.on(ENTERED_PANORAMA_MODE_EVENT, () => {
      // in pano mode, use the lookFrom controls and enable noop (which blocks normal navigation)
      paintPanoController.show(true);
    });
    panoActions?.on(END_MOVE_TO_PANORAMA_EVENT, (feature, layer) => {
      paintPanoController.setActive(feature, layer);
    });
    panoActions?.on(LEFT_PANORAMA_MODE_EVENT, () => {
      // outside pano mode, disable the lookFrom controls and disable noop (which blocks normal navigation)
      paintPanoController.show(false);
    });

    const clickPanoController = new PanoFeatureClickController();
    clickPanoController.on(FEATURE_CLICKED, handlePanoramaClick);
    clickPanoController.on(OPEN_SIDE_PANEL_ON_FEATURE_CLICK, handleOpeningOfSidePanel);

    // note the order here. click controller is before ruler, so when you click on a pano feature, you don't start measuring
    mainMapController.appendController(clickPanoController);
    mainMapController.appendController(lookFromController);
    mainMapController.appendController(leavePanoController);
    mainMapController.appendController(noopController);
    mainMapController.appendController(paintPanoController);

    const firstPersonNavigationController = new FirstPersonNavigationController(
      {
        lockMouse: true,
        lockMouseOnActivate: false,
      },
      undefined,
      confirmationDialogService,
    );
    mainMapController.appendController(firstPersonNavigationController);
  }
}
