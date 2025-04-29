import { TestBed } from '@angular/core/testing';

import { MainMapService } from './main-map.service';

describe('MainMapService', () => {
  let service: MainMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
