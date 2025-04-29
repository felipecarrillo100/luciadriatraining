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
import {LocationMode} from "@luciad/ria/transformation/LocationMode";
import {Point} from "@luciad/ria/shape/Point";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import * as TransformationFactory from "@luciad/ria/transformation/TransformationFactory";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference";
import {ShapeType} from "@luciad/ria/shape/ShapeType";

export const FEATURE_CLICKED = "FeatureClicked";
export const MAP_CLICKED = "MapClicked";
const PICK_SENSITIVITY = 2; // pixels around mouse


function reprojectPoint3D(shape: Point, targetProjection?: string) {
  // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
  targetProjection =  targetProjection ?  targetProjection : "EPSG:4326";
  targetProjection = targetProjection==="CRS:84" ? "EPSG:4326" : targetProjection;
  const sourceProjection = shape.reference?.name === "WGS_1984" && shape.reference.identifier.includes("CRS84") ? "EPSG:4326" : shape.reference?.identifier;
  const targetReference = getReference(targetProjection);
  if ( sourceProjection === targetProjection) {
    return shape;
  } else {
    const transformer = TransformationFactory.createTransformation(shape.reference  as CoordinateReference, targetReference);
    const newShape = transformer.transform(shape)
    return newShape;
  }
}

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
export class ClickOnFeatureController extends Controller {
    private readonly _eventedSupport: EventedSupport;
    constructor() {
        super();
        this._eventedSupport = new EventedSupport([FEATURE_CLICKED, MAP_CLICKED]);
    }

  override onGestureEvent(gestureEvent: GestureEvent): HandleEventResult {
      const triggetMapClickEvent = (viewPoint: Point) =>{
        if (this.map) {
          const worldPoint = this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(gestureEvent.viewPoint);
          const pointCrs84 = reprojectPoint3D(worldPoint);
          this._eventedSupport.emit(MAP_CLICKED, pointCrs84, worldPoint, gestureEvent);
        }
      }
        const triggerFeatureClick = () =>{
            const pick = this.map!.pickClosestObject(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
            if (pick && pick.layer instanceof FeatureLayer) {
                const pickedObject = pick.objects[0];
                if (pickedObject.shape && pickedObject.shape.type === ShapeType.POINT) {
                  this._eventedSupport.emit(FEATURE_CLICKED, pickedObject, pick.layer, gestureEvent);
                } else {
                  triggetMapClickEvent(gestureEvent.viewPoint);
                }
            } else {
              triggetMapClickEvent(gestureEvent.viewPoint);
            }
            return null;
        }
        if (gestureEvent.inputType==="mouse" && gestureEvent.type === GestureEventType.SINGLE_CLICK_UP && (gestureEvent.domEvent as MouseEvent).button === 0) {
            if (triggerFeatureClick()===HandleEventResult.EVENT_HANDLED) return HandleEventResult.EVENT_HANDLED;
        }
        // if (gestureEvent.inputType==="mouse" && gestureEvent.type === GestureEventType.SINGLE_CLICK_CONFIRMED && (gestureEvent.domEvent as MouseEvent).button === 0) {
        //     const pick = this.map!.pickClosestObject(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
        //     if (pick && pick.layer instanceof FeatureLayer) {
        //       //  return HandleEventResult.EVENT_HANDLED;
        //     }
        // }
        if (gestureEvent.inputType === "touch" && gestureEvent.type === GestureEventType.SINGLE_CLICK_CONFIRMED) {
            if (triggerFeatureClick()===HandleEventResult.EVENT_HANDLED) return HandleEventResult.EVENT_HANDLED;
        }
        return super.onGestureEvent(gestureEvent);
    }

  override on(event: typeof FEATURE_CLICKED | typeof MAP_CLICKED | "Invalidated" | "Activated" | "Deactivated", callback: (...args: any[]) => void,
       context?: any): Handle {
        if (event === MAP_CLICKED) {
          return this._eventedSupport.on(event, callback, context);
        } else
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
