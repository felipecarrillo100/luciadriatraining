import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectGeojsonComponent } from './connect-geojson.component';

describe('ConnectGeojsonComponent', () => {
  let component: ConnectGeojsonComponent;
  let fixture: ComponentFixture<ConnectGeojsonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectGeojsonComponent]
    });
    fixture = TestBed.createComponent(ConnectGeojsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
