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
import {Controller} from "@luciad/ria/view/controller/Controller";
import {HandleEventResult} from "@luciad/ria/view/controller/HandleEventResult";
import {GestureEvent} from "@luciad/ria/view/input/GestureEvent";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType";

export interface NoopControllerConstructorOptions {
    allowedEvents?: GestureEventType[];
    enabled?: boolean;
}

/**
 * Controller that stops default map behavior, except for explicitly allowed gesture events
 */
export class NoopController extends Controller {

    private readonly _allowedEvents: GestureEventType[];
    private _enabled: boolean;

    constructor(options?: NoopControllerConstructorOptions) {
        super();
        options = options || {};
        this._allowedEvents = options.allowedEvents || [];
        this._enabled = typeof options.enabled !== "undefined" ? options.enabled : true;
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(enabled: boolean) {
        this._enabled = enabled;
    }

  override onGestureEvent(gestureEvent: GestureEvent): HandleEventResult {
        if (!this._enabled) {
            return HandleEventResult.EVENT_IGNORED;
        }
        if (this._allowedEvents.indexOf(gestureEvent.type) >= 0) {
            return HandleEventResult.EVENT_IGNORED;
        }
        return HandleEventResult.EVENT_HANDLED;
    }
}
