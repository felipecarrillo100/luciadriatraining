import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompassButtonComponent } from './compass-button.component';

describe('CompassButtonComponent', () => {
  let component: CompassButtonComponent;
  let fixture: ComponentFixture<CompassButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompassButtonComponent]
    });
    fixture = TestBed.createComponent(CompassButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
