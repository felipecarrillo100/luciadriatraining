import { TestBed } from '@angular/core/testing';

import { ReferenceLoaderService } from './reference-loader.service';

describe('ReferenceLoaderService', () => {
  let service: ReferenceLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
