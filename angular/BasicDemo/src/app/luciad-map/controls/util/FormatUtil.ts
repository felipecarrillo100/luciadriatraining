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

const MIN_DISTANCE_TO_DRAW = 0.1;   // In meters

function formatAngle(angle: number, min?: number, max?: number): string {
  min = min || 10;
  max = max || 80;
  if (!angle || angle < min || angle > max) {
    return "";
  }
  return `${angle.toFixed(1)} deg`;
}

function formatDistance(distance: number, min?: number): string {
  min = min || MIN_DISTANCE_TO_DRAW;
  if (!distance || distance < min) {
    return "";
  }
  if (distance > 1000) {
    distance /= 1000;
    return `${distance.toFixed(2)} km`;
  }
  return `${distance.toFixed(2)} m`;
}

function formatHeight(h: number): string {
  return `${h.toFixed(1)} m`;
}

function formatArea(area: number, min?: number): string {
  const M2_to_KM2 = 1000 * 1000;

  min = min || 1;
  if (!area || area < min) {
    return "";
  }
  if (area > M2_to_KM2) {
    area /= M2_to_KM2;
    return `${area.toFixed(2)} km2`;
  }
  return `${area.toFixed(2)} m2`;
}

export function getFixedPrecisionFormatter(precision: number, unit: string = "") {
  return (value: number) => value.toFixed(precision) + unit;
}

export const defaultValueFormatter = getFixedPrecisionFormatter(1);

export const hourFormatter = (value: number) => {
  const hr = Math.floor(+value);
  const minutes = Math.round((+value % 1) * 60);
  return hr + ":" + (minutes > 9 ? minutes : "0" + minutes);
}

export const percentFormatter = (value: number) => Math.round(value * 10) / 10 + "%";

export function parseDMStoDD(value: string) {
  let deg = 0;
  let min = 0;
  let sec = 0;
  let isNegative = false;
  let start = 0;
  let index = value.indexOf("\u00b0", start);
  if (index < 0) {
    return undefined;
  }

  if (index === 0) {
    deg = 0;
  } else {
    deg = parseInt(value.substring(0, index), 10);
    if (isNaN(deg)) {
      return undefined;
    } else if (deg < 0) {
      deg = Math.abs(deg);
      isNegative = true;
    }
  }

  start = index + 1;
  index = value.indexOf("\'", start);
  if (index < 0) {
    min = 0;
  } else if (index === 0) {
    min = 0;
    start = index + 1;
  } else {
    min = parseInt(value.substr(start, index - start), 10);
    if (isNaN(min) || min < 0.0 || min > 60.0) {
      return undefined;
    }
    start = index + 1;
  }

  index = value.indexOf("\"", start);
  if (index <= 0) {
    sec = 0;
  } else {
    sec = parseFloat(value.substr(start, index - start));
    if (isNaN(sec) || sec < 0.0 || sec > 60.0) {
      return undefined;
    }
  }
  let result = deg + (min / 60.0) + sec / 3600.0;
  if (isNegative) {
    result = -result;
  }
  return result;
}


export const FormatUtil = {
  angle: formatAngle,
  distance: formatDistance,
  height: formatHeight,
  area: formatArea
};

