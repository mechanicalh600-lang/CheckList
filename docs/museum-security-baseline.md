# Museum Security Baseline

Baseline date: 2026-09-08

The museum-hardening initiative preserves the historical UI while replacing unsafe implementation details below it.

## Baseline findings

- Browser-side password comparison against `defined_users`.
- Legacy plain-text/default-password model.
- Public database policies that allowed anonymous reads/writes.
- Public storage write policies.
- No tracked Supabase migration history before the preservation initiative.
- Client-side biometric flow was not a server-verifiable authentication authority.

## Target invariant

A visitor may only reach museum data operations after a valid museum session is established. Password material is stored only as a one-way hash in a private, non-API schema. Public-facing application code must not need to read a password column.
