/*
 *
 * Copyright (c) 1999-2022 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import {Handle} from "@luciad/ria/util/Evented";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";
import {Controller} from "@luciad/ria/view/controller/Controller";
import {HandleEventResult} from "@luciad/ria/view/controller/HandleEventResult";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {GestureEvent} from "@luciad/ria/view/input/GestureEvent";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType";

export const FEATURE_CLICKED = "FeatureClicked";
const PICK_SENSITIVITY = 2; // pixels around mouse

/**
 * A controller that emits events when a feature is clicked.
 * Note that this controller will *not* select features. You can use the default map selection behavior for that.
 *
 * As an example, this controller is used with panoramas to enter/move in a panorama when its icon is clicked.
 *
 * This controller fires event when a feature from one of its layers was clicked.
 * You can listen to click events as follows:
 *
 * <code>
 *   const logClick = (feature, layer, gestureEvent) => {
 *     console.log(`Clicked on feature with ID: ${feature.id} from layer ${layer.label} at mouse [${gestureEvent.x}, ${gestureEvent.y}]`);
 *   }
 *   const clickController = new FeatureClickController([myFeatureLayer]);
 *   clickController.on(FEATURE_CLICKED, logClick);
 *   map.controller = clickController;
 * </code>
 */
export class FeatureClickController extends Controller {
    private readonly _eventedSupport: EventedSupport;
    private readonly _layers: FeatureLayer[];

    constructor(layers: FeatureLayer[]) {
        super();
        this._eventedSupport = new EventedSupport([FEATURE_CLICKED]);
        this._layers = layers;
    }

  override onGestureEvent(gestureEvent: GestureEvent): HandleEventResult {
        const triggerFeatureClick = () =>{
            const pick = this.map!.pickClosestObject(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
            if (pick && this._layers.indexOf(pick.layer as FeatureLayer) >= 0 ) {
                const pickedObject = pick.objects[0];
                this._eventedSupport.emit(FEATURE_CLICKED, pickedObject, pick.layer, gestureEvent);
                return HandleEventResult.EVENT_HANDLED;
            }
            return null;
        }
        if (gestureEvent.inputType==="mouse" && gestureEvent.type === GestureEventType.SINGLE_CLICK_UP && (gestureEvent.domEvent as MouseEvent).button === 0) {
            if (triggerFeatureClick()===HandleEventResult.EVENT_HANDLED) return HandleEventResult.EVENT_HANDLED;
        }
        if (gestureEvent.inputType==="mouse" && gestureEvent.type === GestureEventType.SINGLE_CLICK_CONFIRMED && (gestureEvent.domEvent as MouseEvent).button === 0) {
            const pick = this.map!.pickClosestObject(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
            if (pick && this._layers.indexOf(pick.layer as FeatureLayer) >= 0 ) {
                return HandleEventResult.EVENT_HANDLED;
            }
        }
        if (gestureEvent.inputType === "touch" && gestureEvent.type === GestureEventType.SINGLE_CLICK_CONFIRMED) {
            if (triggerFeatureClick()===HandleEventResult.EVENT_HANDLED) return HandleEventResult.EVENT_HANDLED;
        }
        return super.onGestureEvent(gestureEvent);
    }

  override on(event: typeof FEATURE_CLICKED | "Invalidated" | "Activated" | "Deactivated", callback: (...args: any[]) => void,
       context?: any): Handle {
        if (event === FEATURE_CLICKED) {
            return this._eventedSupport.on(event, callback, context);
        } else if (event === "Invalidated") {
            return super.on(event, callback, context);

        } else if (event === "Activated") {
            return super.on(event, callback, context);
        }
        return super.on(event, callback, context);
    }
}
