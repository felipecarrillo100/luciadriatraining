import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrProjectFolderComponent } from './hxdr-project-folder.component';

describe('HxdrProjectFolderComponent', () => {
  let component: HxdrProjectFolderComponent;
  let fixture: ComponentFixture<HxdrProjectFolderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrProjectFolderComponent]
    });
    fixture = TestBed.createComponent(HxdrProjectFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
