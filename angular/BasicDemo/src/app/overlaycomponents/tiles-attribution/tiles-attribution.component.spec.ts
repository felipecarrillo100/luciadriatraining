import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilesAttributionComponent } from './tiles-attribution.component';

describe('TilesAttributionComponent', () => {
  let component: TilesAttributionComponent;
  let fixture: ComponentFixture<TilesAttributionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TilesAttributionComponent]
    });
    fixture = TestBed.createComponent(TilesAttributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
