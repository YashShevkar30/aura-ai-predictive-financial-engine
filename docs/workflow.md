# Aura Delivery Workflow

## Branching
- `main` for stable releases.
- `feature/*` for development work.

## Quality Gates
- Backend unit/API tests must pass.
- Frontend build must pass.
- PRs require at least one review before merge.

## Release Steps
1. Merge feature branches to `main`.
2. CI validates backend and frontend.
3. Tag release (`vX.Y.Z`) and publish notes.
