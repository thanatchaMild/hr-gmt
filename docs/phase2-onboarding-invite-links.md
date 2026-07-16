# Phase 2: Single-use Onboarding Invite Links

## Problem

`/onboarding/pdpa` → `consent` → `form` → `preview` is a static, unauthenticated URL today. Anyone with the link can open it and submit an application, any number of times. Since this is an internal system, HR wants to control who can submit: each invite link should belong to one candidate and stop working once used (optionally, also expire after a set time).

## Goal

HR generates a unique link per candidate from the admin panel. The link works once — after a successful submission (or after it expires / is revoked), it no longer opens the form.

## Out of scope for phase 2

- Automatic email/LINE delivery of the link (HR copies/sends it manually, same as today)
- Letting a candidate request their own link (self-service) — HR always initiates
- Multi-language invite pages

## Data model

New table, additive only — no changes to the existing `Employee` model besides an optional back-reference.

```prisma
model OnboardingInvite {
  id            String    @id @default(cuid())
  token         String    @unique // long random string, not the same as id
  candidateName String?
  position      String?
  employeeType  String?   // 'DAILY' | 'MONTHLY', optional pre-fill hint
  status        String    @default("PENDING") // 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED'
  expiresAt     DateTime?
  usedAt        DateTime?
  employeeId    String?   @unique
  createdBy     String    // HR user id who generated it
  createdAt     DateTime  @default(now())

  employee Employee? @relation(fields: [employeeId], references: [id])

  @@map("onboarding_invites")
}
```

Token: generate with `crypto.randomBytes(32).toString('hex')` (or similar), not a sequential/guessable id. Never log it server-side.

## Backend

New route group `server/api/onboarding-invites/`:

- `POST /api/onboarding-invites` (`requireRole('HR_ADMIN')`) — create invite, returns the token/full URL to copy
- `GET /api/onboarding-invites` (`requireRole('HR_ADMIN')`) — list with status filter/search, for the admin UI
- `PATCH /api/onboarding-invites/[id]` (`requireRole('HR_ADMIN')`) — revoke, or regenerate/extend expiry
- `GET /api/onboarding-invites/validate?token=...` (public, no auth) — used by the onboarding pages on load; returns `{ valid, reason? }` without leaking candidate details beyond what's needed to prefill the form

Modify existing `server/api/employees/index.post.ts` (the onboarding submit endpoint):
- Require a valid, unexpired, unused token in the request
- On success: set the invite's `status = 'USED'`, `usedAt = now()`, `employeeId = <new employee id>` in the same transaction as the employee create
- Reject with a clear error if the token is missing/invalid/expired/already used — this is the actual enforcement point, not just the UI gate

## Frontend

**Admin (new)**: a page — e.g. `/admin/hr/onboarding-invites` — with:
- A "generate link" form (candidate name, position, optional employee type)
- A table of invites: status badge, created date, expiry, copy-link button, revoke button, "regenerate" for expired ones

**Onboarding flow (existing pages)**: `app/pages/onboarding/pdpa.vue`, `consent.vue`, `form.vue`, `preview.vue` all need to read `?token=` from the query string. `app/stores/onboarding.ts` already has a `token` ref — reuse it.

- On entering the flow, call the validate endpoint once, store the result; if invalid, redirect to a new "this link is no longer valid" page instead of the form
- Carry the token through every step (query param or store) and send it with the final submit in `index.post.ts`

**New page**: an expired/invalid-link screen (plain, on-brand, explains to contact HR for a new link).

## Key decision to make before building

**When does the token get marked "used"?**
- At final submit only → candidate can close the tab mid-form and resume later with the same link (simpler UX, matches how people actually fill long forms)
- At first page load → tighter security (link truly one-shot from the first click) but riskier UX — a refresh or accidental double-open burns the link

Recommendation: mark used at final submit, since PDPA + this form is long and candidates will likely fill it across sessions. Flag this to the user before implementation, since it changes how "single-use" is actually enforced.

## Rollout note

This is a breaking change to the onboarding entry point — the current static `/onboarding/pdpa` link will need to require a token going forward, or the old flow needs to be intentionally kept open (decide before shipping, don't leave both reachable by accident).

## Rough sequencing

1. Prisma schema + `db push`, token generation util
2. `onboarding-invites` API routes + HR admin page (generate/list/revoke)
3. Wire token through onboarding pages + store, add invalid-link screen
4. Enforce token check + consumption in `employees/index.post.ts`
5. Decide and apply the rollout note above
