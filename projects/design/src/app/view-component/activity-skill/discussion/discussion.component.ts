import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-discussion',
  templateUrl: './discussion.component.html',
  styleUrls: ['./discussion.component.scss']
})
export class DiscussionComponent implements OnInit {

  selected = false;
  currentThreadLabel;
  currentThread = [
    {
      icon: 'fa fa-flag-checkered',
      title: 'Subject started',
      date: new Date()
    },
    {
      icon: 'fa fa-flag',
      title: 'Submission n 1(Java)',
      date: new Date(),
      graded: true
    },
    {
      icon: 'fa fa-lightbulb',
      title: 'Advise asked',
      date: new Date()
    },
    {
      icon: 'fa fa-question-circle',
      user: 'htewech7',
      date: new Date(),
      image: '_messi.jpg',
      message: true,
      creator: true,
      message_content: '<ul> <li><a href="/docs/plugins/moxiemanager">MoxieManager (Premium Plugin)</a> — <a href="/docs/plugins/drive"><strong>Tiny Drive</strong></a> included instead.</li> <li><a href="/docs/plugins/autoresize">Autoresize</a> — Resizes the editor to fit the content.</li> <li><a href="/docs/plugins/bbcode">BBCode</a> — Changes the markup used for the content.</li> <li><a href="/docs/plugins/code">Code</a> — <a href="/docs/plugins/advcode"><strong>Advanced Code Editor</strong></a> included instead.</li> <li><a href="/docs/plugins/fullpage">Full Page</a> — Used for modifying HTML <code class="highlighter-rouge">&lt;head&gt;</code> elements.</li> <li><a href="/docs/plugins/paste">Paste</a> — <a href="/docs/plugins/powerpaste"><strong>PowerPaste</strong></a> included instead.</li> <li><a href="/docs/plugins/spellchecker">Spellchecker</a> — <a href="/docs/plugins/tinymcespellchecker"><strong>Spell Checker Pro</strong></a> included instead.</li> <li><a href="/docs/plugins/tabfocus">Tab Focus</a> — Changes the behavior of the TAB-key within the editor.</li> </ul>'
    },
    {
      icon: 'fa fa-comment',
      user: 'htewech7',
      date: new Date(),
      message: true,
      creator: false,
      message_content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'
    },
    {
      icon: 'fa fa-flag',
      title: 'Submission n 2(Python)',
      grading: true,
      date: new Date()
    }
  ];

  answer = {
    icon: 'fa fa-book',
    title: 'Current answer',
    date: new Date()
  };

  message = {
    desc: 'Don\'t give directly task solution. Try to give only necessary indications in order to let this user progress.',
    user: {
      image: '_messi.jpg',
      name: 'CyrilK'
    }
  };

  sels = [
    {
      icon: 'fa fa-handshake',
      label: 'Help requests'
    },
    {
      icon: 'fa fa-comment',
      label: 'General'
    },
    {
      icon: 'fa fa-glasses',
      label: 'Reviews'
    }
  ];

  filterChoice = [
    'Add a filter',
    'Date of Range',
    'Location'
  ];

  columns = [
    { field: 'user', header: 'user' },
    { field: 'date', header: 'date' },
    { field: 'title', header: 'title' },
    { field: 'domain', header: 'domain' },
    { field: 'progress', header: 'score' },
  ];

  gridData = [
    {
      notification: 'fa fa-bell',
      user: 'lorem ipsum',
      date: new Date(),
      title: 'Chapter 1 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      user: 'Mathias',
      date: new Date(),
      title: 'Chapter 2 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      notification: 'fa fa-bell',
      user: 'Melasto',
      date: new Date(),
      title: 'Chapter 3 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      user: 'htewech7',
      date: new Date(),
      title: 'Chapter 4 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      notification: 'fa fa-bell',
      user: 'Melasto',
      date: new Date(),
      title: 'Chapter 5 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      user: 'Melasto',
      date: new Date(),
      title: 'Chapter 6 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      user: 'Melasto',
      date: new Date(),
      title: 'Chapter 7 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      user: 'Melasto',
      date: new Date(),
      title: 'Chapter 8 - Lorem ipsum',
      domain: 'C++',
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
  ];

  gridPanel = [
    {
      name: 'Panel',
      columns: this.columns
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  onShowThread(thread) {
    this.currentThreadLabel = thread.user;
    this.selected = true;
  }

  onCloseThread(e) {
    this.selected = false;
  }

  onExpandWidth(e) {

  }

}
