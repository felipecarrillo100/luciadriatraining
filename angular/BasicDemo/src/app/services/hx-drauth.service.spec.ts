import { TestBed } from '@angular/core/testing';

import { HxDRAuthService } from './hx-drauth.service';

describe('HxDRAuthService', () => {
  let service: HxDRAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HxDRAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
