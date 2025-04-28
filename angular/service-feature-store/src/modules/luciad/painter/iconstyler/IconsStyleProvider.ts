import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode.js';
import { getUnitOfMeasure } from '@luciad/ria/uom/UnitOfMeasureRegistry.js';

const occludedStyle = {
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
  opacity: 0.4,
  modulationColor: 'rgb(128,128,128)',
};
const METER_UOM = getUnitOfMeasure('Meter');

const UOMMETERStyle = {
  width: 2.5,
  height: 2.5,
  uom: METER_UOM,
};
export function getIconOccludedStyle(enabled: boolean) {
  return enabled ? occludedStyle : { occlusionMode: OcclusionMode.OCCLUDED_ONLY };
}

export function getUOMStyle(enabled: boolean) {
  return enabled ? UOMMETERStyle : {};
}
