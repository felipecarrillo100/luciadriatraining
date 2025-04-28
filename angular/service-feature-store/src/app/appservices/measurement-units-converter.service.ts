import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IMeasurementUnit, ISizeCalculation } from '@shared/interfaces/size.interface';
import { DamageAPI } from '@shared/interfaces/damage.interface';
import { InitialDataStoreService } from '@shared/state/services/initial-data-store.service';

@Injectable({ providedIn: 'root' })
export class MeasurementUnitsService {
  private initialDataStoreService: InitialDataStoreService = inject(InitialDataStoreService);
  private destroyRef: DestroyRef = inject(DestroyRef);

  public measurementUnitsListById: { [key: number]: string } = {};
  public measurementUnit$ = this.initialDataStoreService.selectAllMeasurementUnit();

  constructor() {
    this.measurementUnit$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.measurementUnitsListById = this.convertMeasurementUnitsToMap(data);
      },
    });
  }

  public measurementUnitsConverters = {
    '°[Grad]': (value) => value,
    mm: (value) => value,
    cm: (value) => value / 10,
    m: (value) => value / 1000,
    'mm²': (value) => value,
    'cm²': (value) => value / 100,
    'm²': (value) => value / 1000000,
    'cm³': (value) => value / 1000,
    'dm³': (value) => value / 1000000,
    'm³': (value) => value / 1000000000,
  };

  public convertFromMM = (value: number, unit: string): number => {
    const converter = this.measurementUnitsConverters[unit];
    return converter ? converter(Number(value)).toFixed(2) : value;
  };

  public convertToMM = (value: number, unit: string): number => {
    const converter = this.measurementUnitsConverters[unit];
    return converter ? Number(value) / converter(1).toFixed(2) : value;
  };

  public convertMeasurementUnitsToMap(data: IMeasurementUnit[]): { [key: number]: string } {
    const map = {};
    data.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }

  public convertDamageSizes(damage: DamageAPI): { size1: number; size2: number; size3: number } {
    const result = {
      size1: null,
      size2: null,
      size3: null,
    };

    if (damage.type.measurement_unit_1) {
      result.size1 = this.convertToMM(
        damage.detail.size1,
        this.measurementUnitsListById[damage.type.measurement_unit_1],
      );
    }

    if (damage.type.measurement_unit_2) {
      result.size2 = this.convertToMM(
        damage.detail.size2,
        this.measurementUnitsListById[damage.type.measurement_unit_2],
      );
    }

    if (damage.type.measurement_unit_3) {
      result.size3 = this.convertToMM(
        damage.detail.size3,
        this.measurementUnitsListById[damage.type.measurement_unit_3],
      );
    }

    return result;
  }

  public calculateDamageSizes(damage: DamageAPI): ISizeCalculation {
    const result = {
      size1: null,
      size2: null,
      size3: null,
    };

    const { size1, size2, size3 } = damage.detail;
    const { measurement_unit_1, measurement_unit_2, measurement_unit_3 } = damage.type;

    if (damage.type.measurement_unit_1 && size1) {
      const unit1 = this.measurementUnitsListById[measurement_unit_1];
      const convertedSize1 = this.convertFromMM(size1, unit1);
      result.size1 = { unit: unit1, size: size1, convertedSize: convertedSize1 };
    }

    if (damage.type.measurement_unit_2 && size2) {
      const unit2 = this.measurementUnitsListById[measurement_unit_2];
      const convertedSize2 = this.convertFromMM(size2, unit2);
      result.size2 = { unit: unit2, size: size2, convertedSize: convertedSize2 };
    }

    if (damage.type.measurement_unit_3 && size3) {
      const unit3 = this.measurementUnitsListById[measurement_unit_3];
      const convertedSize3 = this.convertFromMM(size3, unit3);
      result.size3 = { unit: unit3, size: size3, convertedSize: convertedSize3 };
    }

    if (!size1 && !size2) {
      return { ...result, cubicCalc: null, squareCalc: null, lengthCalc: null };
    }

    const lengthCalc = result.size1.unit !== result.size2?.unit;
    const squareCalc =
      (result.size1.unit === result.size2?.unit && !result.size3) ||
      (!!result.size3 && result.size1.unit === result.size2?.unit && result.size3?.unit !== result.size2?.unit);
    const cubicCalc =
      !!result.size3 && result.size1.unit === result.size2?.unit && result.size2?.unit === result.size3?.unit;

    return { ...result, cubicCalc, squareCalc, lengthCalc };
  }
}
