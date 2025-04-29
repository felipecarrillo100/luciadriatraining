import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrSearchByIdComponent } from './hxdr-search-by-id.component';

describe('HxdrSearchByIdComponent', () => {
  let component: HxdrSearchByIdComponent;
  let fixture: ComponentFixture<HxdrSearchByIdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrSearchByIdComponent]
    });
    fixture = TestBed.createComponent(HxdrSearchByIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
