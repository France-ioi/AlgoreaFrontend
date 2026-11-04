# Algorea Frontend

The learner-facing platform: items, attempts, and the navigation context used to open them.

## Language

**Attempt**:
A participant's try at an item. The default attempt exists for every participant. Any other attempt is created explicitly and records which attempt it was created from.
_Avoid_: session, try, run

**Default attempt**:
The attempt that exists for a participant without being created on an item. It is the parent attempt of an item that has no parent item.
_Avoid_: attempt zero, root attempt

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
