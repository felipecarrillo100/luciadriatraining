import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrProjectAssetDetailsComponent } from './hxdr-project-asset-details.component';

describe('HxdrProjectAssetDetailsComponent', () => {
  let component: HxdrProjectAssetDetailsComponent;
  let fixture: ComponentFixture<HxdrProjectAssetDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrProjectAssetDetailsComponent]
    });
    fixture = TestBed.createComponent(HxdrProjectAssetDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
