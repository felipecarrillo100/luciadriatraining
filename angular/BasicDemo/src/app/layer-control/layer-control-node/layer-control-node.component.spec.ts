import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerControlNodeComponent } from './layer-control-node.component';

describe('LayerControlNodeComponent', () => {
  let component: LayerControlNodeComponent;
  let fixture: ComponentFixture<LayerControlNodeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LayerControlNodeComponent]
    });
    fixture = TestBed.createComponent(LayerControlNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
