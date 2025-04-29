import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrBaselayersComponent } from './hxdr-baselayers.component';

describe('HxdrBaselayersComponent', () => {
  let component: HxdrBaselayersComponent;
  let fixture: ComponentFixture<HxdrBaselayersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrBaselayersComponent]
    });
    fixture = TestBed.createComponent(HxdrBaselayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
