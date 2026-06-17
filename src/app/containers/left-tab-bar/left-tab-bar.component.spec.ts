import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeftTabBarComponent } from './left-tab-bar.component';

describe('LeftTabBarComponent', () => {
  let component: LeftTabBarComponent;
  let fixture: ComponentFixture<LeftTabBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ LeftTabBarComponent ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftTabBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tabs', [ 'activities', 'skills', 'search' ]);
    fixture.componentRef.setInput('activeTab', 'activities');
    fixture.componentRef.setInput('searchActive', false);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('marks the active tab when search is not active', () => {
    const activitiesTab = component.tabViews()[0]!;
    const skillsTab = component.tabViews()[1]!;
    expect(component.isTabActive(activitiesTab)).toBeTrue();
    expect(component.isTabActive(skillsTab)).toBeFalse();
  });

  it('marks search as active when searchActive is true', () => {
    fixture.componentRef.setInput('searchActive', true);
    const searchTab = component.tabViews().find(tab => tab.type === 'search')!;
    const activitiesTab = component.tabViews()[0]!;
    expect(component.isTabActive(searchTab)).toBeTrue();
    expect(component.isTabActive(activitiesTab)).toBeFalse();
  });

  it('emits tabSelected for non-search tabs', () => {
    const emitSpy = spyOn(component.tabSelected, 'emit');
    const skillsTab = component.tabViews().find(tab => tab.type === 'skills')!;
    component.onTabClick(skillsTab);
    expect(emitSpy).toHaveBeenCalledOnceWith('skills');
  });

  it('emits searchSelected for the search tab', () => {
    const tabSelectedSpy = spyOn(component.tabSelected, 'emit');
    const searchSelectedSpy = spyOn(component.searchSelected, 'emit');
    const searchTab = component.tabViews().find(tab => tab.type === 'search')!;
    component.onTabClick(searchTab);
    expect(searchSelectedSpy).toHaveBeenCalled();
    expect(tabSelectedSpy).not.toHaveBeenCalled();
  });
});
