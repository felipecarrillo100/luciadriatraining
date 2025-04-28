import { IconFactory } from '../../../controllers/ruler3d/IconFactory';

export const BASE_ICON_SIZE = 30;

interface IconProperties {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}
const GenerateDamageIcon = (props: IconProperties) =>
  IconFactory.rectangle({
    width: BASE_ICON_SIZE,
    height: BASE_ICON_SIZE,
    strokeWidth: 2,
    ...props,
  });

const DAMAGE_BORDER_COLOR_DEFAULT = 'rgb(43,141,194)';
const DAMAGE_BORDER_COLOR_HOVERED = 'rgb(43,141,194)';
const DAMAGE_BORDER_COLOR_SELECTED = 'rgb(111,194,43)';

const DAMAGE_FILL_COLOR_CLASS_0 = 'rgb(54,181,255)';
const DAMAGE_FILL_COLOR_CLASS_1 = 'rgb(193,193,193)';
const DAMAGE_FILL_COLOR_CLASS_2 = 'rgb(234,229,0)';
const DAMAGE_FILL_COLOR_CLASS_3 = 'rgb(255,188,0)';
const DAMAGE_FILL_COLOR_CLASS_4 = 'rgb(255,62,0)';

export const MinSizeGeneratedIcons = {
  default: {
    0: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_DEFAULT, fill: DAMAGE_FILL_COLOR_CLASS_0 }),
    1: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_DEFAULT, fill: DAMAGE_FILL_COLOR_CLASS_1 }),
    2: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_DEFAULT, fill: DAMAGE_FILL_COLOR_CLASS_2 }),
    3: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_DEFAULT, fill: DAMAGE_FILL_COLOR_CLASS_3 }),
    4: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_DEFAULT, fill: DAMAGE_FILL_COLOR_CLASS_4 }),
  },
  hovered: {
    0: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_HOVERED, fill: DAMAGE_FILL_COLOR_CLASS_0, strokeWidth: 3 }),
    1: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_HOVERED, fill: DAMAGE_FILL_COLOR_CLASS_1, strokeWidth: 3 }),
    2: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_HOVERED, fill: DAMAGE_FILL_COLOR_CLASS_2, strokeWidth: 3 }),
    3: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_HOVERED, fill: DAMAGE_FILL_COLOR_CLASS_3, strokeWidth: 3 }),
    4: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_HOVERED, fill: DAMAGE_FILL_COLOR_CLASS_4, strokeWidth: 3 }),
  },
  selected: {
    0: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_SELECTED, fill: DAMAGE_FILL_COLOR_CLASS_0, strokeWidth: 3 }),
    1: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_SELECTED, fill: DAMAGE_FILL_COLOR_CLASS_1, strokeWidth: 3 }),
    2: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_SELECTED, fill: DAMAGE_FILL_COLOR_CLASS_2, strokeWidth: 3 }),
    3: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_SELECTED, fill: DAMAGE_FILL_COLOR_CLASS_3, strokeWidth: 3 }),
    4: GenerateDamageIcon({ stroke: DAMAGE_BORDER_COLOR_SELECTED, fill: DAMAGE_FILL_COLOR_CLASS_4, strokeWidth: 3 }),
  },
};
