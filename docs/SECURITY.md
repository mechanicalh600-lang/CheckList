# Security rules for the preserved museum

- Never reintroduce browser-side password comparison.
- Never store plaintext passwords in a public API table.
- Never grant anonymous write access to application tables or storage objects.
- `SECURITY DEFINER` functions must have an explicit `search_path` and minimum EXECUTE grants.
- Application authorization must be enforceable by the database/session layer, not only by hidden buttons or React routes.
- Public media URLs may remain for compatibility, but upload/update/delete require a valid museum session.
- Re-run Supabase security advisors after every schema, function, policy, or storage-policy change.
