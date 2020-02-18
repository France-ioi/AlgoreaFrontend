import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss']
})
export class EditModeComponent implements OnInit {

  @Input() trees;

  globalTypes = [
    { label: 'Chapter', value: 'chapter' },
    { label: 'Presentation', value: 'presentation' }, 
    { label: 'Exercise', value: 'exercise' }
  ];

  displayFullScreen = [
    {
      label: 'No'
    },
    {
      label: 'Based on type'
    },
    {
      label: 'Yes'
    }
  ];

  partiAttempts = [
    {
      label: 'One'
    },
    {
      label: 'Limited'
    },
    {
      label: 'Unlimited'
    }
  ];

  displayLangList = [
    { label: 'Francis', value: 'Francis' },
    { label: 'English', value: 'English' },
    { label: 'Deutsch', value: 'Deutsch' },
    { label: 'Czech', value: 'Czech' },
    { label: 'Espanol', value: 'Espanol' }
  ];

  showDurationInput = false;
  selectedAttemptId = 0;
  restricted = false;

  sessionsList = [
    {
      label: 'No'
    },
    {
      label: 'Recommended'
    },
    {
      label: 'Yes'
    }
  ];

  teamsList = [
    {
      label: 'No'
    },
    {
      label: 'allowed'
    },
    {
      label: 'required'
    }
  ];

  teamParticipateOption = 0;
  restrictTeamSize = false;
  qualification = false;

  teamRange = [0, 1];
  memberRange = [0, 100];

  constructor() { }

  ngOnInit() {
  }

  onDurationChange(e) {
    this.showDurationInput = e;
  }

  onNumberOfAttemptsChange(e) {
    this.selectedAttemptId = e;
  }

  onParticipateAsTeamsChange(e) {
    this.teamParticipateOption = e;
  }

  onRestrictTeamSize(e) {
    this.restrictTeamSize = e;
  }

  onQualificationChange(e) {
    this.qualification = e;
  }

  onRestrictChange(e) {
    this.restricted = e;
  }

}
