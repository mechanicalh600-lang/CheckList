# CheckList Refactor Roadmap (2 Weeks)

This roadmap keeps runtime behavior stable while reducing architectural risk.

## Scope

- Keep current database integration as-is during development.
- Refactor structure incrementally with zero feature freeze.
- Validate every phase with `typecheck`, `lint`, `test`, and `build`.

## Week 1 - Stabilize Architecture Boundaries

### Day 1-2: Service Layer Decomposition

- Split `services/supabaseClient.ts` into:
  - `services/supabase/client.ts`
  - `services/supabase/auth.ts`
  - `services/supabase/storage.ts`
- Keep public API backward compatible via `services/supabaseClient.ts`.
- No UI behavior changes.

### Day 3: Inspection Flow Utilities

- Extract pure helpers from `App.tsx`:
  - progress calculation
  - incomplete item checks
  - report share text formatter
- Place in `features/inspection/utils.ts`.

### Day 4: History and Pagination Hook

- Create `hooks/useHistory.ts` for:
  - date filters
  - pagination
  - row selection
  - reload behavior
- Move logic from `App.tsx` without changing view outputs.

### Day 5: Settings Hook

- Create `hooks/useAppSettings.ts` for:
  - theme
  - snow effect
  - biometric toggle
  - org title
  - auto logout duration

## Week 2 - Reduce God Component and Featureize UI

### Day 6-7: App View Extraction

- Move large view blocks from `App.tsx` to:
  - `features/inspection/views/*`
  - `features/auth/views/*`
  - `features/history/views/*`
- Keep `App.tsx` as orchestrator and router only.

### Day 8: Modal Extraction

- Extract modal components:
  - user profile
  - system settings
  - logout confirmation
  - auto logout notice

### Day 9: Dashboard Refactor Preparation

- Identify shared table/export/filter logic in:
  - `components/AdminDashboard.tsx`
  - `components/ReportsDashboard.tsx`
- Extract shared helpers to `shared/table/` and `shared/export/`.

### Day 10: Cleanup and Hardening

- Normalize naming in `data/`.
- Remove dead code and unreachable branches.
- Reduce remaining `react-hooks/exhaustive-deps` warnings safely.

## Definition of Done Per Phase

- `npm run typecheck` passes.
- `npm run lint` has no new warnings/errors introduced by the phase.
- `npm run test` passes.
- `npm run build` passes.
- Manual smoke test:
  - login
  - scan/search
  - checklist submit
  - history open
  - report view

