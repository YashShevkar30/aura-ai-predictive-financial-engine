# Aura Delivery Workflow

## Branching
- `main` for stable releases.
- `feature/*` for development work.

## Quality Gates
- Backend unit/API tests must pass.
- Frontend build must pass.
- Scenario compare and history endpoints must remain contract-stable.
- PRs require at least one review before merge.

## Release Steps
1. Merge feature branches to `main`.
2. CI validates backend and frontend.
3. Validate Docker Compose startup (`docker compose up --build`).
4. Tag release (`vX.Y.Z`) and publish notes.
