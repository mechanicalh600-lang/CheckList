# Security hardening changelog

## 2026-09-08

- Created isolated preservation branch.
- Added CI validation.
- Added museum preservation contract and security baseline.
- Added private credential/session foundation in Supabase.
- Replaced browser-side password verification on the preservation branch with secure RPC authentication.
- Added museum-session request header support and server-session revocation on logout.

Database/storage lockdown and plaintext cleanup remain sequenced after frontend validation/deployment.
