import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectTiles3dComponent } from './connect-tiles3d.component';

describe('ConnectTiles3dComponent', () => {
  let component: ConnectTiles3dComponent;
  let fixture: ComponentFixture<ConnectTiles3dComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectTiles3dComponent]
    });
    fixture = TestBed.createComponent(ConnectTiles3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
