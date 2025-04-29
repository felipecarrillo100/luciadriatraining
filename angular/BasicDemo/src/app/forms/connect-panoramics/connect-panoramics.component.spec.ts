import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectPanoramicsComponent } from './connect-panoramics.component';

describe('ConnectPanoramicsComponent', () => {
  let component: ConnectPanoramicsComponent;
  let fixture: ComponentFixture<ConnectPanoramicsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectPanoramicsComponent]
    });
    fixture = TestBed.createComponent(ConnectPanoramicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
