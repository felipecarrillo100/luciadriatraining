import { TestBed } from '@angular/core/testing';

import { MapLayerCommandsService } from './map-layer-commands.service';

describe('MapLayerCommandsService', () => {
  let service: MapLayerCommandsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapLayerCommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
