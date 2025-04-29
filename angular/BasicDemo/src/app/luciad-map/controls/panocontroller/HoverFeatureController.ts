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
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Handle} from "@luciad/ria/util/Evented";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";
import {Controller} from "@luciad/ria/view/controller/Controller";
import {HandleEventResult} from "@luciad/ria/view/controller/HandleEventResult";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {GestureEvent} from "@luciad/ria/view/input/GestureEvent";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType";
import {Map} from "@luciad/ria/view/Map";

const PICK_SENSITIVITY = 2; // pixels around mouse

const MOUSEOVER_CURSOR = "pointer"; // the cursor to show when hovering over a feature

export class HoverFeatureController extends Controller {

    private readonly _layers: FeatureLayer[];
    private _hoveredFeature: Feature | null;
    private _hoveredLayer: FeatureLayer | null;
    private readonly _eventedSupport: EventedSupport;
    private _oldCursorValue: string;

    constructor(layers?: FeatureLayer[]) {
        super();
        this._layers = layers || [];
        this._hoveredFeature = null;
        this._hoveredLayer = null;
        this._eventedSupport = new EventedSupport(["HoverFeature"], true);
        this._oldCursorValue = "";
    }

  override onDeactivate(map: Map) {
        if (map && map.domNode.style.cursor === MOUSEOVER_CURSOR) {
            map.domNode.style.cursor = this._oldCursorValue;
        }
        return super.onDeactivate(map);
    }

  override onGestureEvent(gestureEvent: GestureEvent): HandleEventResult {
        if (this.map && gestureEvent.type === GestureEventType.MOVE) {
            const pick = this.map.pickClosestObject(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
            if ((pick && this._layers.length === 0) || (pick && this._layers.indexOf(pick.layer as FeatureLayer) >= 0)) {
                if (this._hoveredFeature !== pick.objects[0]) {
                    if (this._hoveredFeature && this._hoveredLayer) {
                        this._eventedSupport.emit("HoverFeature", this._hoveredLayer, null);
                    }

                    if (this.map.domNode.style.cursor !== MOUSEOVER_CURSOR) {
                        this._oldCursorValue = this.map.domNode.style.cursor;
                        this.map.domNode.style.cursor = MOUSEOVER_CURSOR;
                    }

                    this._hoveredFeature = pick.objects[0];
                    this._hoveredLayer = pick.layer as FeatureLayer;
                    this._eventedSupport.emit("HoverFeature", this._hoveredLayer, this._hoveredFeature);
                }
            } else {
                if (this._hoveredFeature && this._hoveredLayer) {
                    this._hoveredFeature = null;
                    const layer = this._hoveredLayer;
                    this._hoveredLayer = null;

                    if (this.map && this.map.domNode.style.cursor === MOUSEOVER_CURSOR) {
                        this.map.domNode.style.cursor = this._oldCursorValue;
                    }
                    this._eventedSupport.emit("HoverFeature", layer, null);
                }
            }
        }
        return HandleEventResult.EVENT_IGNORED;
    }

  override on(event: "HoverFeature", callback: (layer: FeatureLayer, feature: Feature | null) => void): Handle;
    /**
     * @see {@link Controller.on}
     * @event
     */
    override on(event: "Invalidated", callback: () => void): Handle;

    /**
     * @see {@link Controller.on}
     * @event
     */
    override on(event: "Activated", callback: (map: Map) => void): Handle;

    /**
     * @see {@link Controller.on}
     * @event
     */
    override on(event: "Deactivated", callback: (map: Map) => void): Handle;

  override on(event: string, callback: (...args: any[]) => void): Handle {
        if (event === "Invalidated") {
            return super.on(event, callback);
        }
        if (event === "Activated") {
            return super.on(event, callback);
        }
        if (event === "Deactivated") {
            return super.on(event, callback);
        }
        return this._eventedSupport.on(event, callback);
    }
}
