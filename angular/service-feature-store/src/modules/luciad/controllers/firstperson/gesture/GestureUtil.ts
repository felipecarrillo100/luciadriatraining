/*
 *
 * Copyright (c) 1999-2024 Luciad All Rights Reserved.
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
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType.js';
import { ScrollEvent } from '@luciad/ria/view/input/ScrollEvent.js';
import { PinchEvent } from '@luciad/ria/view/input/PinchEvent.js';

export enum NavigationType {
  NONE = 'NONE',
  ROTATION = 'ROTATION',
  PAN = 'PAN',
  ZOOM = 'ZOOM',
  FIRST_PERSON_ROTATION = 'FIRST_PERSON_ROTATION',
}

/**
 * Returns which navigation type should be active based on the given gesture event, previous navigation type and
 * allowed types.
 */
export function getNavigationType(
  { type, domEvent }: GestureEvent,
  currentType: NavigationType,
  allowedActions: NavigationType[],
): NavigationType {
  // Check if the zooming action is finished.
  if (currentType === NavigationType.ZOOM && type !== GestureEventType.SCROLL && type !== GestureEventType.PINCH) {
    return NavigationType.NONE;
  }

  // Check if the rotation, orbit or pan action is finished
  if (type === GestureEventType.DRAG_END || type === GestureEventType.TWO_FINGER_DRAG_END) {
    return NavigationType.NONE;
  }

  // Handle the rotation and pan actions
  if (type === GestureEventType.DRAG || type === GestureEventType.TWO_FINGER_DRAG) {
    let newNavigationType = NavigationType.NONE;
    if (domEvent instanceof MouseEvent) {
      const { buttons } = domEvent;
      newNavigationType =
        buttons === 2 // left button pressed
          ? NavigationType.ROTATION
          : buttons === 1 // right button pressed
            ? NavigationType.PAN
            : buttons === 3 // left & right buttons pressed
              ? NavigationType.FIRST_PERSON_ROTATION
              : NavigationType.NONE;
    } else if (window.TouchEvent && domEvent instanceof TouchEvent) {
      const { touches } = domEvent;
      newNavigationType =
        touches.length === 1
          ? NavigationType.ROTATION
          : touches.length === 2
            ? NavigationType.PAN
            : touches.length === 3
              ? NavigationType.FIRST_PERSON_ROTATION
              : NavigationType.NONE;
    }

    if (
      allowedActions.indexOf(NavigationType.FIRST_PERSON_ROTATION) >= 0 &&
      //   (domEvent as MouseEvent | TouchEvent).ctrlKey
      //   The alternate button is now set to SHIFT Key!!
      (domEvent as MouseEvent | TouchEvent).shiftKey
    ) {
      return NavigationType.FIRST_PERSON_ROTATION;
    }

    if (allowedActions.indexOf(newNavigationType) >= 0) {
      return newNavigationType;
    } else {
      return NavigationType.NONE;
    }
  }

  // Handle the zoom action
  if (type === GestureEventType.SCROLL || type === GestureEventType.PINCH) {
    if (allowedActions.indexOf(NavigationType.ZOOM) >= 0) {
      return NavigationType.ZOOM;
    } else {
      return NavigationType.NONE;
    }
  }

  return NavigationType.NONE;
}

/**
 * Returns the speed multiplier factor.
 */
export function getSpeedMultiplier(event: GestureEvent): number {
  const domEvent = event.domEvent;
  if (domEvent instanceof MouseEvent || domEvent instanceof TouchEvent) {
    // Alternate buttons have been removed for this action
    // if (domEvent.shiftKey) {
    //   return 2;
    // } else if (domEvent.altKey) {
    //   return 0.5;
    // }
  }
  return 1;
}

/**
 * Returns the zoom factor.
 * If the value is greater than 0, this means that you need to zoom in, smaller than 0 is zooming out.
 * The given scroll multiplier is only applied on scroll events, not touch pinch events.
 */
export function getZoomFactor(event: GestureEvent, scrollMultiplier = 0.1): number {
  return event.type === GestureEventType.SCROLL
    ? (event as ScrollEvent).amount * scrollMultiplier
    : event.type === GestureEventType.PINCH
      ? (event as PinchEvent).scaleFactor - 1
      : 0;
}
