import { inject, Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AssetItemDetails } from '@shared/new-ui-components/custom-damage-table/damage-table-data.interface';
import { AssetAPI } from '@shared/interfaces/asset.interface';
import {
  selectAssetAndHXDROneById,
  selectAssetByIdInitialData,
  selectAssetsInitialData,
  selectFileListByAssetId,
  selectPart,
  selectPartsInitialData,
} from '@shared/state/selectors/assets.selectors';
import { DamageGroup } from '@shared/interfaces/damage-group.interfaces';
import { IMeasurementUnit } from '@shared/interfaces/size.interface';
import { DamageTypeAPI } from '@shared/interfaces/damage-type.interface';
import { PartAPI, PartItemDetails } from '@shared/interfaces/part.interface';
import { getInitialData } from '@shared/state/actions/initial-data.actions';
import { FilesAPI } from '@shared/interfaces/file.interface';
import { HXDRAsset } from '@shared/interfaces/hxdr-asset.interface';
import {
  selectDamageGroups,
  selectDamageTypes,
  selectMeasurementUnit,
} from '@entities/static-data/lib/static-data.selectors';
import { getAllInspections } from '@entities/inspection/lib/inspection.actions';

@Injectable({ providedIn: 'root' })
export class InitialDataStoreService {
  private store: Store = inject(Store);

  public selectAllAssetsInitialData(): Observable<AssetAPI[]> {
    return this.store.pipe(select(selectAssetsInitialData));
  }

  public selectAllDamageGroups(): Observable<DamageGroup[]> {
    return this.store.pipe(select(selectDamageGroups));
  }

  public selectAllMeasurementUnit(): Observable<IMeasurementUnit[]> {
    return this.store.pipe(select(selectMeasurementUnit));
  }

  public selectAllDamageTypes(): Observable<DamageTypeAPI[]> {
    return this.store.pipe(select(selectDamageTypes));
  }

  public selectAssetsById(id: number): Observable<{ asset: AssetAPI; hXDRAssetsList: HXDRAsset[] }> {
    return this.store.pipe(select(selectAssetAndHXDROneById(id)));
  }

  public selectAssetDetailsById(id: number): Observable<AssetItemDetails> {
    return this.store.pipe(select(selectAssetByIdInitialData(id)));
  }

  public selectFileListByAssetId(id: number): Observable<FilesAPI[]> {
    return this.store.pipe(select(selectFileListByAssetId(id)));
  }

  public dispatchGetInitialData(): void {
    this.store.dispatch(getInitialData());
    this.store.dispatch(getAllInspections());
  }

  public selectPart(assetId: number, partId: number): Observable<PartItemDetails> {
    return this.store.pipe(select(selectPart(assetId, partId)));
  }

  public selectAllParts(): Observable<PartAPI[]> {
    return this.store.pipe(select(selectPartsInitialData));
  }
}
