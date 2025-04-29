import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectLtsComponent } from './connect-lts.component';

describe('ConnectLtsComponent', () => {
  let component: ConnectLtsComponent;
  let fixture: ComponentFixture<ConnectLtsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectLtsComponent]
    });
    fixture = TestBed.createComponent(ConnectLtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
