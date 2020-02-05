import { Component, OnInit, ElementRef, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { NodeService } from 'src/app/services/node-service.service';

export enum AutoText {
  category = 'category',
  all = 'all',
  all_but_one = 'all_but_one',
  n_problem = 'n_problem'
}

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
  @Input() editing = false;
  @Input() desc;
  @Input() parentSkills;

  showDialog = false;

  validText;
  trees;
  selItems1 = [
    {
      label: 'list'
    },
    {
      label: 'event/log'
    }
  ];
  selItems2 = [
    {
      label: 'no'
    },
    {
      label: 'recommended'
    },
    {
      label: 'yes'
    }
  ];
  validationType = [
    {
      label: 'Category',
      value: AutoText.category
    },
    {
      label: 'All',
      value: AutoText.all
    },
    {
      label: 'All but one',
      value: AutoText.all_but_one
    },
    {
      label: 'N problems',
      value: AutoText.n_problem
    }
  ];

  chapterdata = [
    {
      ID: 1,
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor'
    },
    {
      ID: 2,
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor'
    },
    {
      ID: 3,
      col1: 'conc.',
      col2: 'Morbi sit amet eleifend tortor'
    }
  ];

  chaptercols = ['col1', 'col2', 'col3'];

  constructor(
    private elementRef: ElementRef,
    private nodeService: NodeService
  ) { }

  refresh() {
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
  }

  ngOnInit() {
    this.refresh();
    this.nodeService.getFiles().then(res => {
      this.trees = res;
      console.log(this.trees);
    });
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

  openContentDialog(e) {
    this.showDialog = true;
  }

}
