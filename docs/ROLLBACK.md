# Museum rollback strategy

The visible application is preserved by keeping all hardening changes on a dedicated branch until validation succeeds.

If a frontend regression appears after merge, restore the previous Git commit and let the GitHub Pages workflow redeploy it. Database hardening migrations are phased: compatibility objects are added first; destructive cleanup, RLS lockdown, and storage-write restrictions are applied only after the compatible frontend is live.

Credential hashes in `museum_private` are independent from legacy public password columns during transition, allowing the cleanup phase to be delayed or rolled back without rewriting the historical UI.
