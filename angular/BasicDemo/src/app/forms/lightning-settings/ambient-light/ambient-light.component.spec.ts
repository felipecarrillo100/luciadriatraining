import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmbientLightComponent } from './ambient-light.component';

describe('AmbientLightComponent', () => {
  let component: AmbientLightComponent;
  let fixture: ComponentFixture<AmbientLightComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AmbientLightComponent]
    });
    fixture = TestBed.createComponent(AmbientLightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
