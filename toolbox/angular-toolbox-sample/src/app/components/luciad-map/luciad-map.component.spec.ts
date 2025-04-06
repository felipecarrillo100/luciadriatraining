import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LuciadMapComponent } from './luciad-map.component';

describe('LuciadMapComponent', () => {
  let component: LuciadMapComponent;
  let fixture: ComponentFixture<LuciadMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LuciadMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LuciadMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
