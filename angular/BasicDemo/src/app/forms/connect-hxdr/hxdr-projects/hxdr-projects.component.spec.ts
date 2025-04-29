import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrProjectsComponent } from './hxdr-projects.component';

describe('HxdrProjectsComponent', () => {
  let component: HxdrProjectsComponent;
  let fixture: ComponentFixture<HxdrProjectsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrProjectsComponent]
    });
    fixture = TestBed.createComponent(HxdrProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
