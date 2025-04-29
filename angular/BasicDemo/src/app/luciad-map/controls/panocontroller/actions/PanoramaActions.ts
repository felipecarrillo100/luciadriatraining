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
import {Geodesy} from "@luciad/ria/geodesy/Geodesy";
import {createEllipsoidalGeodesy} from "@luciad/ria/geodesy/GeodesyFactory";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {Point} from "@luciad/ria/shape/Point";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";
import {Handle} from "@luciad/ria/util/Evented";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";
import {AnimationManager} from "@luciad/ria/view/animation/AnimationManager";
import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {createFadePanoAnimationKey, FadePanoramaAnimation} from "../animation/FadePanoramaAnimation";
import {Move3DCameraAnimation} from "../animation/Move3DCameraAnimation";
import {PanoramaFeaturePainterV2} from "../../../painters/PanoramaFeaturePainterV2";

const DEFAULT_ENTER_ANIMATION_DURATION = 1000; // milliseconds
const DEFAULT_LEAVE_ANIMATION_DURATION = 1000; // milliseconds
const DEFAULT_LEAVE_BACK_DISTANCE = 30; // meter
const DEFAULT_LEAVE_UP_DISTANCE = 10; // meter
const DEFAULT_LEAVE_PITCH_DOWN_ANGLE = 10; // degrees

/**
 * Settings for entering and moving between panoramas
 */
export interface EnterAnimationOptions {
  /**
   * The duration, in milliseconds, of the enter / move animation.
   * Defaults to 1000 milliseconds.
   */
  duration?: number;
}

/**
 * Settings for leaving panoramas
 */
export interface LeaveAnimationOptions {
  /**
   * The duration, in milliseconds, of the leave animation.
   * Defaults to 1000 milliseconds.
   */
  duration?: number;
  /**
   * The distance, in meters, to move the camera back when leaving a panorama.
   * Defaults to 30 meters.
   */
  backDistance?: number;
  /**
   * The distance, in meters, to move the camera up when leaving a panorama.
   * Defaults to 10 meters.
   */
  upDistance?: number;
  /**
   * The angle, in degrees, to pitch the camera down when leaving a panorama.
   * Defaults to 10 degrees.
   */
  pitchDownAngle?: number;
}

/**
 * Constructor options for PanoramaActions
 */
export interface PanoramaActionsConstructorOptions {
  /**
   * Settings for animations used when entering / leaving panoramas
   */
  enter?: EnterAnimationOptions
  leave?: LeaveAnimationOptions
}

const numberOrDefault = (val: number | undefined, defaultValue: number): number => {
  return typeof val === "number" ? val : defaultValue;
};

const moveCameraToPoint = (map: WebGLMap, point: Point, duration: number): Promise<void> => {
  const lookFrom = (map.camera as PerspectiveCamera).asLookFrom();
  const moveToAnimation = new Move3DCameraAnimation(
      map,
      point,
      lookFrom.yaw,
      0,
      0,
      (map.camera as PerspectiveCamera).fovY,
      duration
  );
  return AnimationManager.putAnimation(map.cameraAnimationKey, moveToAnimation, false);
};

export const ENTERED_PANORAMA_MODE_EVENT = "EnteredPanorama";
export const LEFT_PANORAMA_MODE_EVENT = "LeftPanorama";
export const START_MOVE_TO_PANORAMA_EVENT = "StartMoveToPanorama";
export const END_MOVE_TO_PANORAMA_EVENT = "EndMoveToPanorama";

export class PanoramaActions {

  private readonly _map: WebGLMap;
  private readonly _eventedSupport: EventedSupport;
  private _initialFOVy: number;
  private _inPanoramaMode: boolean;
  private _currentPanoFeature: Feature | null;
  private _currentPanoFeatureLayer: FeatureLayer | null;
  private _llhGeodesy: Geodesy;

  private _enterOptions: Required<EnterAnimationOptions>;
  private _leaveOptions: Required<LeaveAnimationOptions>;

  constructor(map: WebGLMap, options?: PanoramaActionsConstructorOptions) {
    if (!(map.camera instanceof PerspectiveCamera)) {
      throw new Error("Can only use PanoramActions on a 3D WebGLMap");
    }
    this._map = map;
    this._eventedSupport = new EventedSupport([
      ENTERED_PANORAMA_MODE_EVENT,
      LEFT_PANORAMA_MODE_EVENT,
      START_MOVE_TO_PANORAMA_EVENT,
      END_MOVE_TO_PANORAMA_EVENT
    ], true);
    this._inPanoramaMode = false;
    this._currentPanoFeature = null;
    this._currentPanoFeatureLayer = null;
    this._initialFOVy = map.camera.fovY;
    this._llhGeodesy = createEllipsoidalGeodesy(getReference("CRS:84"));

    this._enterOptions = {
      duration: numberOrDefault(options?.enter?.duration, DEFAULT_ENTER_ANIMATION_DURATION)
    };

    this._leaveOptions = {
      duration: numberOrDefault(options?.leave?.duration, DEFAULT_LEAVE_ANIMATION_DURATION),
      backDistance: numberOrDefault(options?.leave?.backDistance, DEFAULT_LEAVE_BACK_DISTANCE),
      upDistance: numberOrDefault(options?.leave?.upDistance, DEFAULT_LEAVE_UP_DISTANCE),
      pitchDownAngle: numberOrDefault(options?.leave?.pitchDownAngle, DEFAULT_LEAVE_PITCH_DOWN_ANGLE),
    }
  }

  moveToPanorama(feature: Feature, layer: FeatureLayer): void {
    if (!this._inPanoramaMode) {
      this._inPanoramaMode = true;
      this._eventedSupport.emit(ENTERED_PANORAMA_MODE_EVENT, feature, layer);
      this._initialFOVy = (this._map.camera as PerspectiveCamera).fovY;
    }
    const oldFeature = this._currentPanoFeature;
    const oldLayer = this._currentPanoFeatureLayer;
    this._currentPanoFeature = feature;
    this._currentPanoFeatureLayer = layer;
    const oldPainter = oldLayer?.painter as PanoramaFeaturePainterV2;
    const painter = layer.painter as PanoramaFeaturePainterV2;
    const fadeAnimFinished = (): void => {
      if ((oldLayer && this._currentPanoFeatureLayer && oldLayer.id !== this._currentPanoFeatureLayer.id) ||
        (oldLayer && !this._currentPanoFeatureLayer)) {
        if (oldFeature) oldPainter.setPanoOpacity(oldFeature, 0);
      } else
      if (oldFeature && this._currentPanoFeature && oldFeature.id !== this._currentPanoFeature.id) {
        painter.setPanoOpacity(oldFeature, 0);
      }
    };
    const fadeInAnim = new FadePanoramaAnimation(painter, feature, 1, this._enterOptions.duration);
    AnimationManager.putAnimation(createFadePanoAnimationKey(feature), fadeInAnim, false).then(fadeAnimFinished).catch(
        fadeAnimFinished);
    if (feature.shape && feature.shape.focusPoint) {
      this._eventedSupport.emit(START_MOVE_TO_PANORAMA_EVENT, feature, layer);
      moveCameraToPoint(this._map, feature.shape!.focusPoint!, this._enterOptions.duration).then(() => {
        oldPainter?.setActive(null);
        painter?.setActive(feature, layer);
        this._eventedSupport.emit(END_MOVE_TO_PANORAMA_EVENT, feature, layer);
      });
    }
  }

  leavePanoramaMode(): void {
    if (this._currentPanoFeature && this._currentPanoFeatureLayer) {
      const painter = this._currentPanoFeatureLayer.painter as PanoramaFeaturePainterV2;
      const fadeAnimation = new FadePanoramaAnimation(painter, this._currentPanoFeature, 0, this._leaveOptions.duration);
      const animFinished = (): void => {
        painter.setActive(null);
      };
      AnimationManager.putAnimation(createFadePanoAnimationKey(this._currentPanoFeature), fadeAnimation, false).then(
          animFinished).catch(animFinished);
    }

    if (this._map.camera instanceof PerspectiveCamera) {
      const lookFrom = this._map.camera.asLookFrom();

      const llhRef = getReference("CRS:84");
      const toLLH = createTransformation(this._map.camera.worldReference, llhRef);
      let eyeLLH = toLLH.transform(this._map.camera.eyePoint);
      // move camera up and back a bit
      eyeLLH.translate3D(0, 0, this._leaveOptions.upDistance);
      eyeLLH = this._llhGeodesy.interpolate(eyeLLH, this._leaveOptions.backDistance, lookFrom.yaw + 180);

      const moveCameraUpAnimation = new Move3DCameraAnimation(
          this._map,
          eyeLLH,
          lookFrom.yaw,
          -this._leaveOptions.pitchDownAngle,
          0,
          this._initialFOVy,
          this._leaveOptions.duration
      );
      AnimationManager.putAnimation(this._map.cameraAnimationKey, moveCameraUpAnimation, false).catch(() => undefined);
    }
    this._inPanoramaMode = false;
    this._eventedSupport.emit(LEFT_PANORAMA_MODE_EVENT);
  }

  isInPanoramaMode(): boolean {
    return this._inPanoramaMode;
  }

  on(event: typeof ENTERED_PANORAMA_MODE_EVENT, callback: (feature: Feature, layer: FeatureLayer) => void): Handle;
  on(event: typeof START_MOVE_TO_PANORAMA_EVENT,
     callback: (feature: Feature | null, layer: FeatureLayer | null) => void): Handle;
  on(event: typeof END_MOVE_TO_PANORAMA_EVENT,
     callback: (feature: Feature | null, layer: FeatureLayer | null) => void): Handle;
  on(event: typeof LEFT_PANORAMA_MODE_EVENT, callback: () => void): Handle;
  on(event: string, callback: (...args: any[]) => any): Handle {
    return this._eventedSupport.on(event, callback);
  }

}
