# EOS — Coordination & People Layer (Spec for later build)

> Articulated from the owner's vision. Status: **DRAFT for review** — not built yet.
> Read together with `EOS_PRD_FOR_CLAUDE.md` (invariants, layers) and
> `RUNBOOK.md`. Build order at the end (§9).
>
> Vision in one line: *"Half of this platform is WhatsApp-for-the-company"* —
> the goal is faster coordination, faster problem-solving, and real-time
> visibility of people & performance for leadership.

These features sit on top of the existing platform (multi-tenant + branch
scoping + RBAC + entitlement + audit). Each new module follows the same
9-artifact Module Build Contract and is sellable as an operator feature flag.

---

## 1. Accountability Chart (EOS "seats")

**Not an org chart.** Defines the *seats* a company needs, the *roles/
responsibilities* each seat owns, and *who* sits in it. Evolves as the company
grows.

**Entities**
- `Seat { id, orgId, parentSeatId?, name, holderUserId?, order, branchId? }`
  — tree structure (drag/drop reorder via `order` + `parentSeatId`).
- `SeatRole { id, seatId, description, order }` — the 3–5 responsibilities of
  the seat (the EOS "roles").
- A seat may be vacant (`holderUserId = null`) or shared (future: multiple
  holders).

**Behavior**
- Visible to the **entire org** (transparency) — read for everyone.
- Edit restricted to leadership/admin (`accountability.edit` permission).
- Drag & drop to restructure; PDF/print export.
- Surfaces "right person / wrong seat" by showing holder + seat side by side.
- Branch-scopable (a branch's sub-chart) using the existing scope system.

**Access**: view = any authenticated org member; edit = permission
`accountability.edit` (leadership). Feature flag `accountability`.

---

## 2. Internal Chat ("WhatsApp for the company")

Real-time messaging so anyone can reach anyone in the company, plus team/
project channels. Small file attachments like WhatsApp.

**Conversation types**
- **Direct (1:1)** — any org member ↔ any org member.
- **Group** — ad-hoc named group with members.
- **Team/Project channel** — auto-created per Team (§6) / Project.

**Entities**
- `Conversation { id, orgId, type (direct|group|team), name?, teamId?, createdBy, createdAt }`
- `ConversationMember { conversationId, userId, role (member|admin), lastReadAt }`
- `Message { id, conversationId, senderId, body?, createdAt, editedAt?, deletedAt? }`
- `MessageAttachment { id, messageId, fileName, filePath, fileSize, mimeType }`
  — reuse `lib/storage.ts`; small-file limit (e.g. ≤ 10 MB), images/pdf/doc.
- Unread = messages with `createdAt > member.lastReadAt`.

**Behavior**
- Send text + small file; show read state (lastReadAt), typing optional later.
- Search people to start a chat; org-scoped (can only chat people in same org;
  branch users can still DM anyone in org — coordination is company-wide).
- Soft-delete messages; edit window optional.

**Realtime transport** — see §3 (decision needed). MVP can poll; "live" needs
SSE/WebSocket or a managed realtime service.

**Access**: any authenticated org member. Files via authenticated download
route (like employee docs). Feature flag `chat`. Audit: message *deletes* and
membership changes logged (not every message — too noisy).

---

## 3. Realtime transport + Push notifications (Android/iPhone)

The hard, cross-cutting part. Two separate concerns:

### 3a. In-app realtime (chat updates live)
Options (decision in §10):
- **A. Short polling** — client polls every 2–5s. Zero infra, simplest, "near
  live." Good MVP.
- **B. SSE (Server-Sent Events)** — server→client stream via a Next route +
  Postgres `LISTEN/NOTIFY` or an in-memory bus. One-way realtime, self-hosted.
- **C. WebSocket** (separate `ws`/socket.io Node process) — true bidirectional,
  most "WhatsApp-like," most infra.
- **D. Managed realtime** (Pusher / Ably / Supabase Realtime) — easiest robust
  realtime + presence, external dependency + cost.
- **Recommended:** start **A (polling)** for MVP to ship fast, design the
  client so the transport is swappable; upgrade to **B/D** for true live.

### 3b. Push notifications to phones
The platform is a **web app**, so the realistic path without app stores:
- **PWA + Web Push (VAPID)** — make EOS an installable PWA (manifest + service
  worker). Push works on **Android Chrome** and **iOS 16.4+** *when the user
  installs the PWA to the home screen*. No store, no native build.
  - Entities: `PushSubscription { id, orgId, userId, endpoint, p256dh, auth, userAgent, createdAt }`.
  - Server sends via `web-push` (VAPID keys in env).
  - Triggers: new chat message (to offline/away members), @mentions,
    task assigned, leave/PR approval needed, etc.
- **Native companion app (later, optional)** — Expo/React Native sharing the
  same REST API + FCM (Android) / APNs (iOS) for the most reliable push.
  Bigger effort; do only if PWA push proves insufficient.
- **Recommended:** **PWA + Web Push first**. Note the iOS "add to home screen"
  caveat to users.

---

## 4. Employee profile: jobdesk, responsibilities, work schedule

Every person has a job description, responsibilities, and work hours that their
**manager fills in**, and which are **stuck to their profile** and visible.

**Entities** (extend HR `Employee` / link to `User`)
- `jobDesk` (long text / list of responsibilities) — could reuse the
  Accountability Chart seat roles, or a dedicated `EmployeeResponsibility { employeeId, text, order }`.
- `WorkSchedule { id, orgId, employeeId, dayOfWeek?, startTime, endTime, effectiveFrom }`
  — "work time in and out" (shift). Simple version: a single
  `workStart`/`workEnd` + workdays on the employee; richer: per-day schedule.
- `managerId` on Employee (who fills/owns the jobdesk).

**Behavior**
- Manager edits jobdesk + schedule; employee sees them read-only on their
  profile; appears on the employee detail page (§ HR) and the person's own
  "My Profile".
- Work in/out compared against **Attendance** (already built) → feeds
  performance (§5: lateness, presence).

**Access**: employee sees own; manager edits their reports'; leadership sees
all (scope). Permission `hr.edit` for managers. No new feature flag (part of
HR), or `hr.workschedule` if sellable separately.

---

## 5. Realtime performance & problem tracking (leadership-only)

System computes each employee's performance and "problems" in real time;
**only Director / high roles** can see the calculation.

**Inputs (already in the platform)**
- Tasks: assigned vs completed vs on-time (Phase 3).
- Attendance: present / late / absent vs work schedule (§4).
- Leave usage (HR).
- Issues/Problems (new, below) raised vs resolved.
- Workflow approvals handled (Phase 2).

**Problems / Issues (EOS "Issues List" / IDS)**
- `Issue { id, orgId, branchId?, title, description?, raisedBy, assignedToId?, teamId?, severity (low|med|high), status (open|solved|dropped), createdAt, solvedAt? }`
- Anyone can raise; resolution tracked → feeds performance + the coordination
  goal ("problems solved faster").

**Performance score**
- Computed on-read (aggregate queries) so it's "real time" without a job:
  e.g. `score = w1*taskOnTimeRate + w2*attendanceRate - w3*openIssuesAging …`
  (weights configurable later).
- A `PerformanceSnapshot` table is **optional** (for history/trends); start
  with on-the-fly calc.

**Access (strict)**: only roles with `performance.view` (Director/leadership)
AND typically `scope = org`. Branch managers may see their branch's people
(branch-scoped). Regular employees: **cannot** see the calculation. Feature
flag `performance`.

---

## 6. Teams & project grouping

People are grouped into teams by field/project so they have "their team."

**Entities**
- `Team { id, orgId, name, branchId?, leadUserId?, projectId?, createdAt }`
- `TeamMember { teamId, userId, role (lead|member) }`
- Link `Team.projectId → Project` (Phase 3) for project teams.
- Each Team auto-gets a **chat channel** (§2 `Conversation.type = team`).

**Behavior**
- Create team, add members, assign a lead, attach to a project.
- Team view: members, their seats/jobdesk, team chat, team tasks, team issues.
- Tasks/Issues can be filtered by team → ties coordination to execution.

**Access**: view = members + leadership; manage = `teams.manage` / leads.
Feature flag `teams`.

---

## 7. "My Profile" / self page

A single place each user sees: their seat + roles (Accountability Chart),
jobdesk + work schedule (§4), their teams (§6), their tasks, their attendance,
unread chats. Read-only except where they own data. Glues the people layer
together.

---

## 8. Cross-cutting integration with what exists

- **Tenancy & scope**: all new entities carry `organizationId`; branch-aware
  ones carry `branchId` and use `lib/scope.ts` (HQ sees all, branch sees own).
- **RBAC + entitlement**: new permissions (`chat.*`, `accountability.*`,
  `teams.*`, `performance.view`, `issues.*`) seeded into the matrix; new module
  feature flags surfaced in the **operator catalog** (`eos-operator`) so they're
  sellable per client.
- **Audit**: membership changes, issue status changes, performance-config
  changes, message deletes — audited. Normal messages are not audited.
- **Storage**: chat attachments + any new files reuse `lib/storage.ts`
  (off-webroot, authenticated download route).
- **Notifications**: in-app `Notification` (Phase 2) already exists; extend its
  emitters to also fire **web push** (§3b) for chat/mentions/approvals.

---

## 9. Recommended build order (phased)

1. **PWA shell** — manifest + service worker so the app is installable
   (prerequisite for push). Low risk, no UX change.
2. **Chat MVP** — conversations/messages/members + attachments, polling
   transport, DM + group. The headline feature.
3. **Web Push** — VAPID + `PushSubscription` + push on new message/mention.
   (Depends on 1.)
4. **Teams** — teams + members + team chat channel + link to projects.
5. **Accountability Chart** — seats tree + roles + holder, view-all, edit-
   leadership, PDF export.
6. **Profile/jobdesk/work schedule** — manager-filled jobdesk + schedule on
   employee profile + "My Profile" page.
7. **Issues (IDS)** — raise/assign/resolve problems, team/branch scoped.
8. **Performance dashboard** — leadership-only realtime scoring over tasks/
   attendance/issues.
9. **Realtime upgrade** — swap chat polling → SSE/WebSocket/managed for true
   live; presence/typing.
10. **(Optional) Native app** — Expo + FCM/APNs if PWA push is insufficient.

Each step = its own migration + entity + service + UI + feature flag + verify,
committed independently.

---

## 10. Open decisions (need owner input before building)

1. **Realtime transport** — polling MVP (fast) vs SSE/WebSocket self-hosted vs
   managed (Pusher/Ably/Supabase)?
2. **Push** — PWA Web Push first (accept iOS "add to home screen" caveat)? Or
   commit to a native app sooner?
3. **Chat reach** — can everyone DM everyone org-wide (recommended for
   coordination), or restrict by branch/team?
4. **Performance visibility** — exactly which roles see it (Director only? +
   Branch Managers for their branch)?
5. **Jobdesk source** — reuse Accountability Chart seat roles as the jobdesk,
   or keep a separate per-employee jobdesk field?
6. **Attachment size limit** for chat (e.g. 10 MB) and allowed types.
