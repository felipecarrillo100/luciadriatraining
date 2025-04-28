/*
 *
 * Copyright (c) 1999-2025 Luciad All Rights Reserved.
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
import {interpolate} from "ria-toolbox/libs/core/util/Math";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Animation} from "@luciad/ria/view/animation/Animation.js";
import {PanoramaFeaturePainter} from '../../painters/PanoramaFeaturePainter';

export const createFadePanoAnimationKey = (feature: Feature): string => {
  return "fade-pano-opacity-" + feature.id;
};

export class FadePanoramaAnimation extends Animation {
  private _painter: PanoramaFeaturePainter;
  private readonly _feature: Feature | null;
  private readonly _startOpacity: number;
  private readonly _targetOpacity: number;

  constructor(painter: PanoramaFeaturePainter, feature: Feature | null, targetOpacity: number, duration: number) {
    super(duration);
    this._painter = painter;
    this._feature = feature;
    this._startOpacity = (feature && painter.getPanoOpacity(feature)) || 0;
    this._targetOpacity = targetOpacity;
  }

  override update(fraction: number): void {
    if (this._feature) {
      this._painter.setPanoOpacity(this._feature, interpolate(this._startOpacity, this._targetOpacity, fraction));
    }
  }
}
