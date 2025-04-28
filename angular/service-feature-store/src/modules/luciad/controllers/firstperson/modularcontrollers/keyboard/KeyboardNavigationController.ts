/*
 *
 * Copyright (c) 1999-2023 Luciad All Rights Reserved.
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
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';

import { Map } from '@luciad/ria/view/Map.js';
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent.js';
import { Bounds } from '@luciad/ria/shape/Bounds';
import {
  KeyNavigationSupport,
  NavigationKeysMode,
} from '@pages/map/luciad-map/controllers/firstperson/keyboard/KeyNavigationSupport';

export interface KeyboardNavigationControllerConstructorOptions {
  navigationMode?: NavigationKeysMode;
  defaultSpeed?: number;
  slowerMultiplier?: number;
  fasterMultiplier?: number;
}

/**
 * The Keyboard Navigation controller lets you navigate on the map using a typical FPS control scheme.
 *
 * * Use the WASD keys on your keyboard to move left/right/forward/back.
 * * Use the space bar to fly up.
 * * Use the C key to fly down.
 * * Hold the shift key to speed up.
 *
 */
export class KeyboardNavigationController extends Controller {
  private readonly _keySupport: KeyNavigationSupport;

  constructor(inputOptions?: KeyboardNavigationControllerConstructorOptions, bounds?: Bounds) {
    super();
    const options = inputOptions ? inputOptions : {};
    this._keySupport = new KeyNavigationSupport(bounds, {
      navigationMode: options.navigationMode ? options.navigationMode : NavigationKeysMode.CAMERA_FORWARD,
      defaultSpeed: options.defaultSpeed,
      slowerMultiplier: options.slowerMultiplier,
      fasterMultiplier: options.fasterMultiplier,
    });
  }

  onActivate(map: Map): void {
    super.onActivate(map);
    this._keySupport.activate(map);
  }

  /**
   * Handles key events for the FirstPersonController. It tries to be keyboard-layout agnostic so the same
   * physical keys would work either in QWERTY, AZERTY, QWERTZ or DVORAK layouts.
   *
   * If any relevant key was pressed, it will update the FirstPersonControllerAnimation state and return
   * HandleEventResult.EVENT_HANDLED.
   *
   * For all other cases it will return HandleEventResult.EVENT_IGNORED.
   *
   */
  onKeyEvent(event: KeyEvent): HandleEventResult {
    const target = event.domEvent?.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      // Events on input targets are disregarded.
      return HandleEventResult.EVENT_IGNORED;
    }

    const result = this._keySupport.onKeyEvent(event);
    if (result === HandleEventResult.EVENT_HANDLED && this.map) {
      AnimationManager.removeAnimation(this.map.cameraAnimationKey);
    }
    return result;
  }

  onDeactivate(map: Map): void {
    super.onDeactivate(map);
    AnimationManager.removeAnimation(map.cameraAnimationKey);
    this._keySupport.deactivate();
  }
}
