import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectHxdrComponent } from './connect-hxdr.component';

describe('ConnectHxdrComponent', () => {
  let component: ConnectHxdrComponent;
  let fixture: ComponentFixture<ConnectHxdrComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectHxdrComponent]
    });
    fixture = TestBed.createComponent(ConnectHxdrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
