import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectTmsComponent } from './connect-tms.component';

describe('ConnectTmsComponent', () => {
  let component: ConnectTmsComponent;
  let fixture: ComponentFixture<ConnectTmsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectTmsComponent]
    });
    fixture = TestBed.createComponent(ConnectTmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
