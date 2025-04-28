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
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas.js';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { getNavigationType, getSpeedMultiplier, getZoomFactor, NavigationType } from '../gesture/GestureUtil';
import { PanSupport } from '../gesture/PanSupport';
import { AnchorSupport, Gizmos } from '../anchor/AnchorSupport';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { ReferenceType } from '@luciad/ria/reference/ReferenceType.js';
import { createTopocentricReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { createBounds } from '@luciad/ria/shape/ShapeFactory.js';
import { ZoomSupport } from '../gesture/ZoomSupport';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import {CRSEnum} from '../../../interfaces/CRS.enum';

// const SCROLL_ZOOM_MULTIPLIER = 0.12;
const SCROLL_ZOOM_MULTIPLIER = 0.25;

const ALLOWED_INTERACTIONS = [NavigationType.PAN, NavigationType.ZOOM];

/**
 * Navigation controller meant to look at 3D objects from close-by, while visualizing navigational anchor points with
 * 3D gizmos.
 * Using this controllers, users can interact with the map in the following ways:
 * <ul>
 *   <li>Panning orthogonally to the camera's forward direction with left mouse drags or one finger touch drags</li>
 *   <li>Rotating around an anchor under your mouse with right mouse drags or two finger touch drags</li>
 *   <li>Rotating around the camera eye with left + right mouse drags or the normal rotation controls with ctrl pressed</li>
 *   <li>Zooming in to and away from an anchor under your mouse with the scroll wheel or pinch gestures</li>
 *   <li>Move horizontally relative to the earth's surface with the arrow or WASD keys (or corresponding keys if you
 *   don't have a QWERTY keyboard) </li>
 *   <li>Move vertically relative to the earth's surface with the Q and E keys (or corresponding keys if you don't have
 *   a QWERTY keyboard) </li>
 * </ul>
 *
 * This controller also guarantees that when it moves the camera, it will always stay in the given bounds.
 * The center of the given bounds is also used to calculate the interaction anchors if none could be found under or
 * close to the mouse position.
 *
 * Note that you _must_ specify a bounds (to the constructor)
 * that is large enough to encompass the asset that you want to navigate around in.
 * If the bounds do not fit around your asset, you are not able to move around in the asset.
 * When working with georeferenced data, note that the bounds should typically be in a topocentric reference,
 * so that they're aligned with the earth surface. This is unlike geocentric (EPSG:4978) bounds, which often stick slanted through the surface.
 * If you do pass in geocentric bounds, these will automatically be converted to a topocentric reference.
 *
 * This controller only works with a PerspectiveCamera.
 */
export class IsolatedZoomPanController extends Controller {
  private readonly _bounds: Bounds;
  private readonly _gizmos: Gizmos;
  private readonly _panSupport: PanSupport;
  private readonly _zoomSupport: ZoomSupport;

  private disableController = false;
  private _anchorSupport: AnchorSupport | null = null;
  private _navigationType: NavigationType = NavigationType.NONE;

  constructor(gizmos: Gizmos, inBounds?: Bounds) {
    super();

    let bounds = inBounds
      ? inBounds.copy()
      : createBounds(getReference(CRSEnum.CRS_84), [-180, 360, -90, 180, -100, 8000]);

    if (bounds.reference?.referenceType === ReferenceType.GEOCENTRIC) {
      // SceneNavigationController bounds are defined in a geocentric reference.
      // These are not aligned to the earth surface and might give issues.
      // Switch to using topocentric navigation bounds
      const topoRef = createTopocentricReference({
        origin: bounds.focusPoint,
      });
      const diagonal = Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2) + Math.pow(bounds.depth, 2));
      bounds = createBounds(topoRef, [-diagonal / 2, diagonal, -diagonal / 2, diagonal, -diagonal / 2, diagonal]);
    }

    this._panSupport = new PanSupport(inBounds ? bounds : undefined);
    this._zoomSupport = new ZoomSupport(inBounds ? bounds : undefined);
    this._bounds = bounds;
    this._gizmos = gizmos;
  }

  onActivate(map: WebGLMap) {
    super.onActivate(map);
    map.domNode.style.cursor = 'move';

    if (!(map.camera instanceof PerspectiveCamera)) {
      // throw new Error('IsolatedZoomPanController only works with a PerspectiveCamera');
      this.disableController = true;
    }

    this._anchorSupport = new AnchorSupport(map, this._bounds);
  }

  onDeactivate(map: WebGLMap) {
    super.onDeactivate(map);
  }

  onDraw(geoCanvas: GeoCanvas) {
    const gizmo = this._gizmos[this._navigationType];
    const anchor = this._anchorSupport?.anchor;
    if (gizmo && anchor) {
      geoCanvas.drawIcon3D(anchor, gizmo.style);
    }
  }

  onGestureEvent(event: GestureEvent) {
    if (this.disableController) return HandleEventResult.EVENT_IGNORED;

    if (!this._anchorSupport || !this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }

    const { viewPoint } = event;
    const newNavigationType = getNavigationType(event, this._navigationType, ALLOWED_INTERACTIONS);

    if (this._navigationType !== newNavigationType) {
      this.invalidate();
      if (newNavigationType === NavigationType.NONE) {
        this._panSupport.reset();
      } else {
        // compute gizmo anchor when navigation type changed
        this._anchorSupport.computeAnchor(viewPoint, newNavigationType);
        this._gizmos[newNavigationType]?.rescaleForFixedViewSize(this.map, this._anchorSupport.anchor);
      }
    }

    this._navigationType = newNavigationType;

    //stop current camera animations if the user moves
    if (this._navigationType !== NavigationType.NONE) {
      AnimationManager.removeAnimation(this.map.cameraAnimationKey);
    }

    const { anchor } = this._anchorSupport;

    if (this._navigationType === NavigationType.PAN) {
      this._panSupport.panCameraOverOrthogonalPlane(this.map, anchor, viewPoint);
    } else if (this._navigationType === NavigationType.ZOOM) {
      const scaleFraction = getZoomFactor(event, SCROLL_ZOOM_MULTIPLIER);
      const zoomScale = scaleFraction * getSpeedMultiplier(event);
      const ghostMode = (event.domEvent as MouseEvent | TouchEvent).ctrlKey;
      const surfaceCrossed = this._zoomSupport.zoomToAnchor(this.map, anchor, zoomScale, ghostMode);
      // A new zoom anchor will be computed when camera crossed surface or on zooming out
      if (zoomScale < 0 || surfaceCrossed) {
        this._navigationType = NavigationType.NONE;
        this._panSupport.reset();
      }
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
    return HandleEventResult.EVENT_HANDLED;
  }
}
