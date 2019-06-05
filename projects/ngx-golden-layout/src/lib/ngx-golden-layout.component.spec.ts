import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxGoldenLayoutComponent } from './ngx-golden-layout.component';

describe('NgxGoldenLayoutComponent', () => {
  let component: NgxGoldenLayoutComponent;
  let fixture: ComponentFixture<NgxGoldenLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxGoldenLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxGoldenLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
