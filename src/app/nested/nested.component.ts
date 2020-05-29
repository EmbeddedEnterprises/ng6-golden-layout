import { Component, OnInit } from '@angular/core';
import { GoldenLayoutModule, IExtendedGoldenLayoutConfig } from 'ngx-golden-layout';
import { ComponentType } from 'projects/ngx-golden-layout/src/lib/config';
import { SubcomponentComponent } from './subcomponent/subcomponent.component';
import { OthercomponentComponent } from './othercomponent/othercomponent.component';
import { BehaviorSubject } from 'rxjs';

const components: ComponentType[] = [
  {
    name: 'sub',
    type: SubcomponentComponent,
  },
  {
    name: 'other',
    type: OthercomponentComponent,
  }
];

const CONFIG: IExtendedGoldenLayoutConfig = {
  content: [{
    type: "column",
    content: [
      {
        type: 'component',
        componentName: 'sub',
        title: 'Test 1',
        id: 'foobar',
      },
      {
        type: 'component',
        componentName: 'other',
        title: 'Test 2',
        id: 'foobar2',
      }
    ]
  }],
  settings: {
    maximiseAllItems: false,
  }
};

@Component({
  selector: 'app-nested',
  templateUrl: './nested.component.html',
  styleUrls: ['./nested.component.scss'],
  providers: [
    GoldenLayoutModule.forChild(components),
  ]
})
export class NestedComponent implements OnInit {

  public layout$ = new BehaviorSubject(CONFIG);

  constructor() { }

  ngOnInit(): void {
  }
  stateChange() {

  }
  tabActivated() {

  }
}
