import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectCustomPanoramicsComponent } from './connect-custom-panoramics.component';

describe('ConnectPanoramicsComponent', () => {
  let component: ConnectCustomPanoramicsComponent;
  let fixture: ComponentFixture<ConnectCustomPanoramicsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectCustomPanoramicsComponent]
    });
    fixture = TestBed.createComponent(ConnectCustomPanoramicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
