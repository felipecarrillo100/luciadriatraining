import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrProjectAssetComponent } from './hxdr-project-asset.component';

describe('HxdrProjectAssetComponent', () => {
  let component: HxdrProjectAssetComponent;
  let fixture: ComponentFixture<HxdrProjectAssetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrProjectAssetComponent]
    });
    fixture = TestBed.createComponent(HxdrProjectAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
