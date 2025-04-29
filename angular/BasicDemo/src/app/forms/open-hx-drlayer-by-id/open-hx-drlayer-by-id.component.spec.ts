import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenHxDRLayerByIdComponent } from './open-hx-drlayer-by-id.component';

describe('OpenHxDRLayerByIdComponent', () => {
  let component: OpenHxDRLayerByIdComponent;
  let fixture: ComponentFixture<OpenHxDRLayerByIdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OpenHxDRLayerByIdComponent]
    });
    fixture = TestBed.createComponent(OpenHxDRLayerByIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
