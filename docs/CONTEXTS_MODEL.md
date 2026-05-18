# Account Contexts — Architecture

> **TL;DR**: A single Rowi user can wear several "hats" at once: their own
> personal account, an employee at one or more tenants (with a manager and
> direct reports), a family member declared by themself or by others, and
> a coach/consultant/mentor providing services to clients (or receiving
> 1:1 services). This document explains how those hats are stored,
> resolved at request time, and surfaced in the UI.

## Why this exists

The original tier model (`Free / Pro / Admin / SuperAdmin`, in
`src/lib/account/accountType.ts`) collapsed the user's identity into a
single string. That worked while every user was either an individual on
their own dashboard or an admin of one organization, but broke for the
real cases Eduardo described:

- Employees of companies who report to a manager and have direct reports
  themselves.
- Individuals with family on the platform (partner, kids, parents).
- Coaches/consultants who serve **multiple** orgs without being an
  employee of any of them.

These contexts compose — a single person can be all of the above on the
same day. We needed a model that surfaces all of them without forcing a
choice.

## The data model

Three new Prisma models added in `prisma/schema.prisma` (Bloque A,
commit `dd3c839`):

### `EmployeeProfile.managerId` (self-FK)

```prisma
model EmployeeProfile {
  // …existing fields…
  managerId    String?
  manager      EmployeeProfile?    @relation("EmployeeManagerHierarchy", fields: [managerId], references: [id], onDelete: SetNull)
  reports      EmployeeProfile[]   @relation("EmployeeManagerHierarchy")
  @@index([managerId])
}
```

One self-FK lets an employee point at their manager. Cycle detection
lives in `PATCH /api/admin/hr/employees/[id]` — walks up the candidate
manager's chain; if it reaches the employee being edited, the
assignment is rejected.

### `FamilyRelation`

```prisma
model FamilyRelation {
  id            String   @id
  ownerId       String                  // who declared the link
  relatedUserId String?                 // resolved User if any
  relatedEmail  String?                 // dangling email if not
  relatedName   String?
  relationship  String                  // partner|spouse|child|parent|sibling|other
  consentStatus String   @default("pending")  // pending|accepted|declined|not_required
  consentAt     DateTime?
  // …
  @@unique([ownerId, relatedUserId])
}
```

Consent is **honest**: the owner declares; the related user (if they
have an account) is the only side allowed to flip `consentStatus` to
`accepted` or `declined`. Application-level dedup by email closes the
gap that Postgres unique-on-NULL leaves.

### `ServiceEngagement`

```prisma
model ServiceEngagement {
  id                   String    @id
  providerId           String                          // the User who provides
  serviceRole          String                          // coach|consultant|mentor|facilitator|trainer|advisor
  clientTenantId       String?
  clientCommunityId    String?
  clientOrganizationId String?
  clientUserId         String?
  status               String    @default("active")    // active|paused|ended|proposed
  // …
}
```

Exactly one client kind per engagement. State machine enforced in
`PATCH /api/account/services/[id]`:

- Provider: any field, any status (set paused/ended at will).
- Client (when `clientUserId` is the caller): only `proposed→active`
  (accept), `proposed→ended` (decline), or `active→ended`.

## The runtime layer

### `getActiveContexts(userId)` — `src/lib/account/contexts.ts`

Single async function that returns all hats the user is currently
wearing, ordered by `weight`:

```
ContextKind = "personal" | "employee" | "manager" | "family"
            | "service_provider" | "service_client"
            | "tenant_primary" | "workspace_pro"
```

`personal` is always present. The rest only appear when the underlying
data justifies it (e.g. `manager` appears only when the user has at
least one active direct report).

### `/api/account/contexts` (GET)

Exposes the helper to the client. Returns `{ ok, userId, contexts[] }`.

### The active-context cookie

When the user picks a context in `<AccountContextChip>`
(`src/components/shared/AccountContextChip.tsx`), the chip writes
the context id into a cookie:

```
Name:      rowi_active_context
Format:    "{kind}:{scopeRef.id}"
Path:      /
Max-age:   30 days
SameSite:  Lax
Secure:    only over HTTPS (so localhost dev still works)
```

The cookie is **client-set but server-readable**. It's a UI
preference, not a session secret — there's nothing in it that grants
authorization. Compromise of the cookie at worst forces the user to
view a different tenant they already had access to.

### `resolveContextTenantId(cookieValue)` — same file

Reverse map: given a cookie value, returns the tenant id (or null)
that the active context binds to. Used server-side to **narrow** the
result set of any tenant-scoped query.

```
tenant_primary:tenant_abc123  →  tenant_abc123
employee:profile_xyz          →  (looks up EmployeeProfile.tenantId)
workspace_pro:community_456   →  (looks up RowiCommunity.tenantId)
service_provider:eng_789      →  (looks up the engagement's tenant)
manager:user_xyz              →  null (not tenant-scoped)
personal | family | service_client  →  null
```

### Filtering rule (consumers)

Every server route that consumes the cookie must follow the same
contract — **cookie only narrows, never grants**:

```ts
const allAccessibleTenantIds = await computeUserAccessSet(userId);
const requestedTenantId = await resolveContextTenantId(cookieValue);

let tenantIds = allAccessibleTenantIds;
if (
  requestedTenantId &&
  allAccessibleTenantIds.includes(requestedTenantId)
) {
  tenantIds = [requestedTenantId];  // narrow to just this one
}
// else: cookie pointed somewhere the user can't reach → ignored.
```

Wired in:
- `GET /api/org/summary`
- `GET /api/team/summary`
- `GET /api/hr/summary`
- `GET /api/workspaces/*` (where tenant-scoped)

### Why two switchers in NavBar?

Two coexist by design — they switch along different axes:

| Switcher | Axis | Storage |
| --- | --- | --- |
| `ContextSwitcher` (existing) | Org hierarchy (superhub / hub / tenant / community / organization) | localStorage |
| `AccountContextChip` (new) | Account role (personal / employee / manager / family / service / workspace pro) | cookie |

They were unified at the **cookie write** level: when the org switcher
picks a tenant or community, it ALSO writes the account-context cookie
(`tenant_primary:X` or `workspace_pro:Y`). That way `/api/org/summary`
gets the same narrowing whether the user picked from either switcher.

`src/contexts/UserContextProvider.tsx` does the bridging — see
`switchContext()`.

## Scope-aware admin (separate but related)

A parallel system gates admin endpoints by scope (rowiverse / superhub
/ tenant / hub) instead of the binary SuperAdmin check. See
`src/core/admin/scopedList.ts` for:

- `requireAdminWithScope()` — extracts the caller's highest reachable
  scope.
- `tenantIdsForScope(scope)` — returns the tenant ids that scope can
  administer. `null` means rowiverse (no narrowing).
- `scopeCanSeeUser(scope, userId)` — does this scope have any
  membership overlap with the target user?
- `scopeCanAdminProfileFeatureScope(scope, ...)` — can this scope
  edit a permission row scoped at the given level?
- `scopeCanAdminHub(scope, hubId)` — can this scope administer this
  specific hub?

These are tested in `src/__tests__/admin/scopedList.test.ts`.

## Email notifications

Four user-visible events fire transactional emails through
`src/lib/email/sendContextNotification.ts`:

| Event | Trigger | Recipient |
| --- | --- | --- |
| `family.requested` | `POST /api/account/family` with pending consent | The related user (if they have an account) |
| `family.accepted` / `family.declined` | `PATCH /api/account/family/[id]` flipping consentStatus | The owner |
| `service.proposed` | `POST /api/account/services` with 1:1 client | The clientUser |
| `service.accepted` | `PATCH /api/account/services/[id]` client→active | The provider |
| `service.ended` | `PATCH /api/account/services/[id]` either side→ended | The other side |

Each call now reads `recipient.preferredLang` (falling back to
`recipient.language`, then `"es"`) so the email lands in the right
language. See commit `5397919`.

## Observability

`src/core/prisma.ts` ships a `$extends({query})` middleware that logs
two structured events:

- `prisma.slow_query` (warn) — any query ≥ `PRISMA_SLOW_QUERY_MS` env
  (default 500ms).
- `prisma.query_failed` (error) — any thrown query plus elapsed time.

This makes the new per-request lookups (rowi chat history, preferred
lang for emails, scope resolution joins) visible in production logs
without manual instrumentation.

## What this enables next

- A proper Org Chart view (`/hub/admin/hr/org-chart`) reads
  `EmployeeProfile.managerId` and renders the tree.
- A future "context history" surface could show which hats a user
  switched between, useful for compliance audits.
- Family + services data feed downstream features without
  re-modeling identity each time.

## Conventions when extending

- Adding a new `ContextKind`: extend the `ContextKind` union in
  `src/lib/account/contexts.ts`, add a kind→tenant resolver to
  `resolveContextTenantId`, ship i18n keys for the chip label, update
  this doc.
- New tenant-scoped admin endpoint: lean on `tenantIdsForScope` from
  `src/core/admin/scopedList.ts`. Read scope-aware always; mutations
  only when the operation is tenant-local. Platform-level operations
  stay `requireSuperAdmin`.
- New email kind: extend `sendContextNotification` rather than
  duplicating Resend wiring (see `src/lib/email/sendInviteEmail.ts`
  for the canonical sender pattern).
