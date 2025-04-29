import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MouseCoordinatesComponent } from './mouse-coordinates.component';

describe('MouseCoordinatesComponent', () => {
  let component: MouseCoordinatesComponent;
  let fixture: ComponentFixture<MouseCoordinatesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MouseCoordinatesComponent]
    });
    fixture = TestBed.createComponent(MouseCoordinatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
