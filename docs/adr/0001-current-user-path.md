# `/groups/users/me` redirects to the signed-in user

The login-module can only store a fixed URL. `/groups/users/me` is that URL for this platform's user page (progress, personal data, and settings). It is not a group id.

A temporary session starts login and comes back to the same URL, including the query. A signed-in user is redirected, replacing the history entry, to `/groups/users/{groupId}` with the same child path and query.
