import { Controller } from '@luciad/ria/view/controller/Controller';
import { PanoramaActions } from './actions/PanoramaActions';
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';

class LeavePanoramaController extends Controller {
  private _panoActions: PanoramaActions;

  constructor(panoActions: PanoramaActions) {
    super();
    this._panoActions = panoActions;
  }

  override onKeyEvent(keyEvent: KeyEvent): HandleEventResult {
    if (
      this._panoActions &&
      this._panoActions.isInPanoramaMode() &&
      keyEvent.domEvent &&
      keyEvent.domEvent.key === 'Escape'
    ) {
      this._panoActions.leavePanoramaMode();
      return HandleEventResult.EVENT_HANDLED;
    }
    return HandleEventResult.EVENT_IGNORED;
  }
}

export { LeavePanoramaController };
