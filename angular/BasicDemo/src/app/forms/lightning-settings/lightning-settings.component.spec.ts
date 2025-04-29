import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightningSettingsComponent } from './lightning-settings.component';

describe('LightningSettingsComponent', () => {
  let component: LightningSettingsComponent;
  let fixture: ComponentFixture<LightningSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LightningSettingsComponent]
    });
    fixture = TestBed.createComponent(LightningSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
