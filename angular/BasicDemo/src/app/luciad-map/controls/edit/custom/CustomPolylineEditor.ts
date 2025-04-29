import {PointListEditor} from "@luciad/ria/view/editor/editors/PointListEditor.js";
import {EditContext} from "@luciad/ria/view/controller/EditContext.js";
import {PointListDeleteHandle, SinglePointDeleteHandle} from "@luciad/ria/view/editor/handles/PointListDeleteHandle.js";
import {GestureEvent} from "@luciad/ria/view/input/GestureEvent.js";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType.js";
import {Polyline} from "@luciad/ria/shape/Polyline.js";
import {Polygon} from "@luciad/ria/shape/Polygon.js";

function isRightMouseButtonDown(gestureEvent: GestureEvent) {
  if (gestureEvent.inputType === "mouse" && gestureEvent.domEvent instanceof MouseEvent) {
    return gestureEvent.domEvent.button === 2;
  }
  return false;
}

class CustomSinglePointDeleteHandle extends SinglePointDeleteHandle {
  override shouldActivate(gestureEvent: GestureEvent, context: EditContext): boolean {
    return gestureEvent.type === GestureEventType.SINGLE_CLICK_UP &&
      isRightMouseButtonDown(gestureEvent) &&
      this.interacts(gestureEvent, context);
  }

  override shouldProcess(gestureEvent: GestureEvent): boolean {
    return gestureEvent.type === GestureEventType.SINGLE_CLICK_UP &&
      isRightMouseButtonDown(gestureEvent);
  }
}

class CustomPointListDeleteHandle extends PointListDeleteHandle {
  override createDeleteHandles(): CustomSinglePointDeleteHandle[] {
    const handles = [];
    for (let i = 0; i < this.pointList.pointCount; i++) {
      handles.push(new CustomSinglePointDeleteHandle(this.pointList, i, this.handleIconStyle));
    }
    return handles;
  }
}

//export class CustomPolylineEditor extends PointListEditor {
export class CustomPolylineEditor extends PointListEditor {
  override createPointListDeleteHandle(context: EditContext): PointListDeleteHandle {
    return new CustomPointListDeleteHandle(context.shape as Polyline | Polygon, context.settings.minimumPointCount);
  }
}
