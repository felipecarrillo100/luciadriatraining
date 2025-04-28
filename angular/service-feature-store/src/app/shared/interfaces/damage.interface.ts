import { MaterialAPI } from '@shared/interfaces/material.interface';
import { DamageTypeAPI } from '@shared/interfaces/damage-type.interface';
import { InspectionAPI } from '@shared/interfaces/inspection.interface';
import { OldDamage } from '@shared/interfaces/old-damage.interface';
import { AssetAPI } from '@shared/interfaces/asset.interface';
import { PartAPI } from '@shared/interfaces/part.interface';
import { ILocation } from '@interfaces/sensor.interface';

export interface DamageAPI {
  id: number;
  asset?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  part: number;
  number: string;
  material: MaterialAPI;
  detailList?: DamageAPI[];
  type: DamageTypeAPI;
  detail: DamageDetailsAPI;
  inspection?: InspectionAPI;
  partName?: string;
}

export interface DamageDetailsAPI {
  id: number;
  location: ILocation;
  damage: number;
  inspection: InspectionAPI;
  status: number;
  class: number;
  size1?: number;
  size2?: number;
  size3?: number;
  estimation_remaining_cross_section?: number;
  quantity: number;
  long_location: number;
  cross_location: number;
  height_location: number;
  notice: number;
  old_damage_type: OldDamage;
  text: string;
}

export interface IDamagePanelView {
  asset: AssetAPI;
  damage: DamageAPI;
  part: PartAPI;
  storeId: number;
  route: string;
  fileReference?: number;
}
