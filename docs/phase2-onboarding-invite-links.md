# Phase 2: Single-use Onboarding Invite Links

## Problem

`/onboarding/pdpa` → `consent` → `form` → `preview` is a static, unauthenticated URL today. Anyone with the link can open it and submit an application, any number of times. Since this is an internal system, HR wants to control who can submit: each invite link belongs to one candidate, HR pre-fills their employee code and name before generating it, and the link expires after 3 days.

## Goal

HR generates a unique link per candidate from the admin panel (entering employee code + first/last name first). The candidate fills the same onboarding flow as today. The link stops working after submission, after 3 days, or if revoked. HR can view and edit the submitted data at any time afterward, from both the applications list and the employees list.

## Out of scope for phase 2

- Automatic email/LINE delivery of the link (HR copies/sends it manually, same as today)
- Letting a candidate request their own link (self-service) — HR always initiates
- Multi-language invite pages
- Resuming a partially-filled form after the link expires — confirmed: if the 3-day window passes mid-fill, whatever the candidate typed is simply lost. No draft-saving/resume mechanism needed.

## Data model

New table, additive only — no changes to the existing `Employee` model (it already has `employeeCode`; it just gets set at invite-creation time now instead of at approval time).

```prisma
model OnboardingInvite {
  id           String    @id @default(cuid())
  token        String    @unique // long random string, not the same as id
  employeeCode String
  firstName    String
  lastName     String
  status       String    @default("PENDING") // 'PENDING' | 'SUBMITTED' | 'EXPIRED' | 'REVOKED'
  expiresAt    DateTime  // createdAt + 3 days, fixed (not configurable)
  submittedAt  DateTime?
  employeeId   String?   @unique
  createdBy    String    // HR user id who generated it
  createdAt    DateTime  @default(now())

  employee Employee? @relation(fields: [employeeId], references: [id])

  @@map("onboarding_invites")
}
```

Token: generate with `crypto.randomBytes(32).toString('hex')` (or similar), not a sequential/guessable id. Never log it server-side.

`expiresAt` is always `createdAt + 3 days` — no per-invite override in phase 2.

## Backend

New route group `server/api/onboarding-invites/`:

- `POST /api/onboarding-invites` (`requireRole('HR_ADMIN')`) — body: `{ employeeCode, firstName, lastName }`; creates the invite, sets `expiresAt = now + 3d`, returns the token/full URL to copy
- `GET /api/onboarding-invites` (`requireRole('HR_ADMIN')`) — list with status filter/search, for the admin UI. Should lazily flip `PENDING` → `EXPIRED` in the response (or via a cheap check) once `expiresAt` has passed, rather than needing a cron job
- `PATCH /api/onboarding-invites/[id]` (`requireRole('HR_ADMIN')`) — revoke, or generate a fresh replacement invite (new token, new 3-day window) for the same candidate
- `GET /api/onboarding-invites/validate?token=...` (public, no auth) — used by the onboarding pages on load; returns `{ valid, reason?, employeeCode?, firstName?, lastName? }` so the form can pre-fill

Modify existing `server/api/employees/index.post.ts` (the onboarding submit endpoint):
- Require a valid, unexpired, not-yet-submitted token
- On success: set the invite's `status = 'SUBMITTED'`, `submittedAt = now()`, `employeeId = <new employee id>` in the same transaction as the employee create
- Reject with a clear error if the token is missing/invalid/expired/already submitted — this is the actual enforcement point, not just the UI gate

New endpoint for editing submitted data:
- `PATCH /api/employees/[id]/form-data` (`requireRole('HR_ADMIN')`, respecting the existing `scopeEmployeeTypeFilter`) — updates the JSON `formData` blob. Available regardless of employee `status` (SUBMITTED or APPROVED) per the confirmed requirement that HR can edit anytime.

## Frontend

**Admin (new)**: a page — e.g. `/admin/hr/onboarding-invites` — with:
- A "generate link" form: employee code, first name, last name (all required) → creates the invite, shows the link with a copy button
- A table of invites: name/code, status badge (pending/submitted/expired/revoked), created date, expiry countdown, copy-link button, revoke button, "generate new link" for expired/revoked ones

**Onboarding flow (existing pages)**: `app/pages/onboarding/pdpa.vue`, `consent.vue`, `form.vue`, `preview.vue` all need to read `?token=` from the query string. `app/stores/onboarding.ts` already has a `token` ref — reuse it, and pre-fill `personalInfo.firstName/lastName` and the employee code from the validate response.

- On entering the flow, call the validate endpoint once, store the result; if invalid, redirect to a new "this link is no longer valid" page instead of the form
- Carry the token through every step and send it with the final submit in `index.post.ts`

**New page**: an expired/invalid-link screen (plain, on-brand, explains to contact HR for a new link).

**Edit capability (new, the biggest chunk of work)**:
- Reuse the existing onboarding step components (`StepPersonal`, `StepFamily`, etc.) in an editable admin context, prefilled from the stored `formData`
- Add an "แก้ไขข้อมูล" (edit) button to the row actions in both `/admin/hr/applications` (`app/pages/admin/hr/applications/index.vue`) and `/admin/hr/employees` (`app/pages/admin/hr/employees/index.vue`) tables — available regardless of status, per the confirmed requirement
- Save via the new `PATCH /api/employees/[id]/form-data` endpoint

## Rollout note

This is a breaking change to the onboarding entry point — the current static `/onboarding/pdpa` link will need to require a token going forward, or the old flow needs to be intentionally kept open (decide before shipping, don't leave both reachable by accident).

## Rough sequencing

1. Prisma schema + `db push`, token generation util
2. `onboarding-invites` API routes + HR admin page (generate/list/revoke)
3. Wire token through onboarding pages + store (pre-fill employee code/name), add invalid-link screen
4. Enforce token check + consumption in `employees/index.post.ts`
5. Build the edit view (reusing onboarding step components) + `PATCH /api/employees/[id]/form-data`, wire the "แก้ไขข้อมูล" button into both applications and employees tables
6. Decide and apply the rollout note above
