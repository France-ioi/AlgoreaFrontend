import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit {
  newContentForm: FormGroup = this.formBuilder.group({
    title: '',
  });
  contentTypes = [
    {
      icon: 'book',
      title: 'Chapter',
      desc: 'A new folder which can contain any activities.',
    },
    {
      icon: 'code',
      title: 'Task',
      desc: 'A new task which users can try to solve.',
    },
    {
      icon: 'graduation-cap',
      title: 'Skill',
      desc: 'A new sub-skill.',
    },
  ];

  state: 'opened' | 'closed' = 'closed';


  constructor(
    private formBuilder: FormBuilder,
  ) {
  }


  ngOnInit(): void {
    this.newContentForm.get('title')?.valueChanges.subscribe((change: string) => this.state = change.length > 2 ? 'opened' : 'closed');
  }

}
