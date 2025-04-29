import { TestBed } from '@angular/core/testing';

import { PortAssetStoreService } from './port-asset-store.service';

describe('PortAssetStoreService', () => {
  let service: PortAssetStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortAssetStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
