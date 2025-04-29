import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HxdrProjectFolderContentsComponent } from './hxdr-project-folder-contents.component';

describe('HxdrProjectFolderContentsComponent', () => {
  let component: HxdrProjectFolderContentsComponent;
  let fixture: ComponentFixture<HxdrProjectFolderContentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HxdrProjectFolderContentsComponent]
    });
    fixture = TestBed.createComponent(HxdrProjectFolderContentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
