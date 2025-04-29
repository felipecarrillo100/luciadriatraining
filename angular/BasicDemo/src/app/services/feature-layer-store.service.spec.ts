import { TestBed } from '@angular/core/testing';

import { FeatureLayerStoreService } from './feature-layer-store.service';

describe('FeatureLayerStoreService', () => {
  let service: FeatureLayerStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureLayerStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
