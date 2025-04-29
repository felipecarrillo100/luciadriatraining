import { TestBed } from '@angular/core/testing';

import { ConfigureLightningSettingsService } from './configure-lightning-settings.service';

describe('ConfigureLightningSettingsService', () => {
  let service: ConfigureLightningSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigureLightningSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
