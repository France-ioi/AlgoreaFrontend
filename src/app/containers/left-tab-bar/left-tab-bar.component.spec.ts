import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeftMenuTabView } from '../../config/left-menu-config.service';
import { LeftTabBarComponent } from './left-tab-bar.component';

const tabs: LeftMenuTabView[] = [
  { id: 0, type: 'activities', icon: 'ph ph-presentation' },
  { id: 1, type: 'skills', icon: 'ph ph-graduation-cap' },
  { id: 2, type: 'search', icon: 'ph ph-magnifying-glass', dataCy: 'main-menu-search-btn' },
];

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
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeTab', 0);
    fixture.componentRef.setInput('searchActive', false);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('marks the active tab when search is not active', () => {
    const activitiesTab = tabs[0]!;
    const skillsTab = tabs[1]!;
    expect(component.isTabActive(activitiesTab)).toBeTrue();
    expect(component.isTabActive(skillsTab)).toBeFalse();
  });

  it('marks search as active when searchActive is true', () => {
    fixture.componentRef.setInput('searchActive', true);
    const searchTab = tabs[2]!;
    const activitiesTab = tabs[0]!;
    expect(component.isTabActive(searchTab)).toBeTrue();
    expect(component.isTabActive(activitiesTab)).toBeFalse();
  });

  it('emits tabSelected with tab id for non-search tabs', () => {
    const emitSpy = spyOn(component.tabSelected, 'emit');
    const skillsTab = tabs[1]!;
    component.onTabClick(skillsTab);
    expect(emitSpy).toHaveBeenCalledOnceWith(1);
  });

  it('emits searchSelected for the search tab', () => {
    const tabSelectedSpy = spyOn(component.tabSelected, 'emit');
    const searchSelectedSpy = spyOn(component.searchSelected, 'emit');
    const searchTab = tabs[2]!;
    component.onTabClick(searchTab);
    expect(searchSelectedSpy).toHaveBeenCalled();
    expect(tabSelectedSpy).not.toHaveBeenCalled();
  });
});
