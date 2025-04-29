import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortAssetComponent } from './port-asset.component';

describe('PortAssetComponent', () => {
  let component: PortAssetComponent;
  let fixture: ComponentFixture<PortAssetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PortAssetComponent]
    });
    fixture = TestBed.createComponent(PortAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
