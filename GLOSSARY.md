# Algorea Frontend

The learner-facing platform: items, attempts, and the navigation context used to open them.

## Language

**Task**:
An item the participant works on. It contains no other items.
_Avoid_: chapter, exercise

**Attempt**:
A participant's try at an item. The default attempt exists for every participant. Any other attempt is created explicitly and records which attempt it was created from.
_Avoid_: session, try, run

**Default attempt**:
The attempt that exists for a participant without being created on an item. It is the parent attempt of an item that has no parent item.
_Avoid_: attempt zero, root attempt

**Attempt number**:
The position of an attempt among a participant's attempts on an item, starting at 1 with the one started first.
_Avoid_: attempt id

**Parent attempt**:
The attempt from which another attempt was created. For an item with no parent item, the parent attempt is the default attempt.
_Avoid_: parent item

**Parent item**:
An ancestor of the current item on the path from a root to that item.
_Avoid_: parent attempt

**User**:
The signed-in person on the platform (current session identity).
_Avoid_: account, profile (unless meaning Profile below)

**Profile**:
The login-module profile payload nested under the current-user (and user-view) `profile` field. It is not the flat root attributes of those responses.
_Avoid_: user info, personal info, account details

**Activity log**:
The platform record of what a participant did on an item: submissions, saved answers, current answers, and when the activity was started or validated. The History page calls these events.
_Avoid_: editor history, edits

**Editor history**:
The task's record of saved versions of the work in progress for one attempt. The History page calls these edits.
_Avoid_: activity log, events

**History element**:
One saved version in the editor history.
_Avoid_: submission, current answer, saved answer

**Checkpoint**:
A history element that marks a point the participant can return to. Other history elements sit between checkpoints.
_Avoid_: submission

**Work in progress**:
What is in the editor between submissions. It is the editor history when the task keeps one, and the current answer otherwise.
_Avoid_: submission

**Current answer**:
The platform's single stored work in progress for one attempt.
_Avoid_: editor history, submission, saved answer

**Submission**:
An answer a participant sent for grading.
_Avoid_: current answer, history element, saved answer

**Saved answer**:
A platform copy of a previous current answer, kept so that work in progress is not lost when another answer is loaded.
_Avoid_: submission, history element, checkpoint
