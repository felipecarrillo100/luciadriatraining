import { TestBed } from '@angular/core/testing';

import { UICommandsService } from './uicommands.service';

describe('UICommandsService', () => {
  let service: UICommandsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UICommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
