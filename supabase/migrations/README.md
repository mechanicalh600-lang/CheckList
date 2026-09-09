# Supabase migrations

Migration SQL for the preserved museum database is tracked here from the 2026-09-08 hardening baseline onward. The database predates this history, so earlier schema evolution remains legacy state.

Live museum hardening sequence now includes:

1. private credential hashes, museum sessions and login throttling;
2. browser authentication migrated away from direct password reads;
3. session-gated RLS across historical application tables;
4. plaintext credential cleanup with a legacy password-write compatibility trigger;
5. session-gated Storage writes with historical public media URLs preserved;
6. fixed search paths on report RPCs;
7. de-duplicated administrative RLS policies for lower per-query overhead.

The historical interface is a preservation boundary: database changes must not redesign or restyle it.
