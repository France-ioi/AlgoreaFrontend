# Notifications & WebSocket

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing the notification bell/toasts, group-results export UX, thread following, or SLS WebSocket handling.

## Notification system

- Real-time notifications via WebSocket (SLS API)
- Notification bell component in top bar with unread count badge
- Dropdown panel showing forum messages and group-results export ready/failed notifications
- Toast notifications for displayable types by default (forum, export ready/failed) via a global store effect; display copy lives in `models/notification-display` (`notification-toast.ts` is display-only)
- Shared `NotificationInteractionService` (`clear$(sk)`, `activate$(notification)`) used by toast `onClick` and the bell: ready export → download + delete in parallel (consume-on-click even if download later fails); failed or expired ready → delete only; forum → open thread (thread-cleanup still deletes). If another download is already in flight, a second ready activate is a no-op (no download, no delete). Toast **X** dismisses the toast only
- Bell rows are never disabled (failed/expired remain clickable); each row has a trash button sibling of the `cdkMenuItem` (delete only, menu stays open). Hover-reveal on fine pointers; always visible on `:focus-within` and `@media (hover: none)`
- Async ZIP export is only offered when `enableNotifications` is on and `slsApiUrl` is set (retrieval is via toast or bell)
- Export-ready notifications download via SLS `download-url` (https-only, new-tab anchor); expired links are labeled in place; in-flight export-id guard prevents overlapping downloads without consuming a different ready notification
- One-shot notification deletes (`deleteNotification` / `deleteAllNotifications`) use `take(1)` on `identityToken$` so callers complete and unsubscribe
- Forum notifications automatically cleared when visiting the relevant thread
- Controlled by `enableNotifications` feature flag

## WebSocket architecture

The WebSocket connection is managed at the root store level:

- `websocket` store tracks connection state (open/closed)
- Effects in feature stores subscribe to WebSocket messages
- Forum threads subscribe/unsubscribe based on visibility
- Notifications are received via WebSocket and stored in root `notification` store

## Thread following

- Users can follow/unfollow forum threads they don't own
- Follow status fetched from SLS API when viewing a thread
- Auto-follow when posting a message to a thread
- Thread tokens (not identity tokens) required for follow operations
