import { Component, OnInit, ElementRef, OnChanges, SimpleChanges, Input } from '@angular/core';

@Component({
  selector: 'app-task-tab',
  templateUrl: './task-tab.component.html',
  styleUrls: ['./task-tab.component.scss']
})
export class TaskTabComponent implements OnInit, OnChanges {

  content;
  participation;
  discussions;
  relatedSkills;

  @Input() activityORSkill = true;
  @Input() autoText = 'category';
  @Input() data;
  @Input() image;

  parentSkills;

  validText;

  constructor(private elementRef: ElementRef) { }

  findParents(node) {
    if (!node) {
      return ;
    }

    this.parentSkills.push(node);
    this.findParents(node.parent);
  }

  refresh() {
    // this.content = this.items.content;
    // this.participation = this.items.participation;
    // this.discussions = this.items.discussions;
    // this.relatedSkills = this.items.relatedSkills;
    switch (this.autoText) {
      case 'category':
        this.validText = 'solve at least all tasks with Validation type';
        break;
      case 'all':
        this.validText = 'solve all the tasks';
        break;
      case 'all_but_one':
        this.validText = 'solve all the tasks except maybe one';
        break;
      default:
        this.validText = `solve at least ${this.autoText} tasks`;
        break;
    }

    console.log(this.data);

    this.parentSkills = [];

    this.findParents(this.data);

    console.log(this.parentSkills);

    if (this.parentSkills.length > 0) {
      this.parentSkills.shift();
      this.parentSkills.reverse();
    }
  }

  ngOnInit() {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refresh();
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll('.mat-tab-labels .mat-tab-label');
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector('.mat-tab-labels .mat-tab-label.mat-tab-label-active');
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    for (i = 0 ; i < tabs.length ; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

}
