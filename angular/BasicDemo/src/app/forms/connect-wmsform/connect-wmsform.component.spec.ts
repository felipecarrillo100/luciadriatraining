import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectWMSFormComponent } from './connect-wmsform.component';

describe('ConnectWMSFormComponent', () => {
  let component: ConnectWMSFormComponent;
  let fixture: ComponentFixture<ConnectWMSFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectWMSFormComponent]
    });
    fixture = TestBed.createComponent(ConnectWMSFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
