import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelLibraryComponent } from './panel-library.component';

describe('PanelLibraryComponent', () => {
  let component: PanelLibraryComponent;
  let fixture: ComponentFixture<PanelLibraryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PanelLibraryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
