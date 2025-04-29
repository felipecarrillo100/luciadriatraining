import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunlightComponent } from './sunlight.component';

describe('SunlightComponent', () => {
  let component: SunlightComponent;
  let fixture: ComponentFixture<SunlightComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SunlightComponent]
    });
    fixture = TestBed.createComponent(SunlightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
