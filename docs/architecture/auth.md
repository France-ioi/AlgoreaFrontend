# Authentication

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing auth modes, session restore, or cross-tab cookie refresh.

Two auth modes supported (configured via `authType`):

- **cookies**: Session-based authentication
- **tokens**: JWT token authentication

Auth flow handled by `AuthService` and `OAuthService` in `services/auth/`.

In cookie mode, session restore, 401 recovery, and periodic refresh are serialized across tabs by the `algorea-auth-session` Web Lock. Waiting tabs refresh and adopt the shared cookie instead of creating another temp user. Token mode stays per-tab (sessionStorage) and does not take that lock. Web Locks are per frontend origin, while the session cookie may be shared across an API Domain, so different frontend origins are not serialized against each other. OAuth return (`createTokenFromCode`) and logout (`revokeAuth`) still write the cookie without this lock.
