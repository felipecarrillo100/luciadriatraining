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
import {Mesh} from "@luciad/ria/geometry/mesh/Mesh";
import {create3DMesh} from "@luciad/ria/geometry/mesh/MeshFactory";
import IconProvider, {IconProviderShapes} from "../utils/iconimagefactory/IconProvider";
import {create3DCylinder, create3DSphere} from "../utils/simple3DMeshes";

export const createPanorama2DIcon = (color: string): HTMLCanvasElement => {
  return IconProvider.paintIconByName(IconProviderShapes.HEXAGON,{
    width: 16,
    height: 16,
    fill: color,
    strokeWidth: 2,
    stroke: color
  })
};

export const createPanorama3DIconV2 = ():Mesh => {
  return create3DCylinder(0.5, 0.5, 6);
}
export const createPanorama3DIcon = (): Mesh => {
  const radius = 1; // meter
  const color = "rgba(255, 255, 255, 1.0)"; // white, so it can be modulated using MeshStyle.color
  const segments = 6; // a hexagon

  const texture = document.createElement("canvas");
  texture.width = 1;
  texture.height = 1;
  const ctx = texture.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, texture.width, texture.height);

  const positions = [0, 0, 0];
  const indices: number[] = [];
  const texCoords: number[] = [0, 0.5];
  let index = 0;
  const angleStep = 2 * Math.PI / segments;
  for (let s = 0; s < segments; s++) {
    const angle = s * angleStep;
    positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    index++;
    texCoords.push(1, 0.5);
    if (s > 0) {
      indices.push(0, index - 1, index);
    }
  }
  indices.push(0, index, 1);

  return create3DMesh(positions, indices, {
    image: texture,
    texCoords: texCoords
  });

};
