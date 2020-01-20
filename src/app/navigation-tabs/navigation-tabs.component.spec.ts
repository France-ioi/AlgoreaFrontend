import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsComponent } from './navigation-tabs.component';

describe('GroupViewComponent', () => {
  let component: NavigationTabsComponent;
  let fixture: ComponentFixture<NavigationTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavigationTabsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
