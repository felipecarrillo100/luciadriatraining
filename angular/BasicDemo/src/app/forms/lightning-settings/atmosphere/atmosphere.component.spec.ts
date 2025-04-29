import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtmosphereComponent } from './atmosphere.component';

describe('AtmosphereComponent', () => {
  let component: AtmosphereComponent;
  let fixture: ComponentFixture<AtmosphereComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AtmosphereComponent]
    });
    fixture = TestBed.createComponent(AtmosphereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
