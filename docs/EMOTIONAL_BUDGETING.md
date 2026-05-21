# Emotional Budgeting on Rowi — Project Context

**Version:** v0.2 (planning) · **Date:** 2026-05-20 · **Owner:** Eduardo González (eduardo@cactuscomunidadcreativa.com) · **Scientific lead:** Joshua Freedman (Six Seconds)

This document is the single source of truth for the Emotional Budgeting product line on Rowi. It exists so any new contributor (engineer, designer, lawyer, scientific advisor, investor) can pick up the project in six months without losing context. Update the version and date when meaningful changes happen.

---

## 1. Vision and positioning

Rowi is the operational platform where **Emotional Budgeting** — the framework developed by Six Seconds and articulated in Eduardo González's book of the same name — is practiced. The book explicitly names the technical project as **ROWIIA** (chapter 16):

> *"From that question matured in conversations with the Six Seconds team, with Joshua Freedman, with people working at the intersection of emotional intelligence, applied linguistics and artificial intelligence ended up coming a project that bears the name ROWIIA."*

This defines product identity: a **systemic emotional observability platform with AI**, not a mood-tracking app and not a traditional climate survey. We work across five complementary Six Seconds frameworks:

1. **Vital Signs** — yearly diagnostic of the five climate drivers
2. **Pulse Points** — the 15 operational levers of daily life
3. **KCG (Know · Choose · Give)** — personal operating system with 8 SEI competencies
4. **Brain Talents** — 18 "brain apps" across 3 dimensions
5. **ROWIIA** — the systemic observability layer that Rowi materializes

Central thesis: *"ROI is the outcome. ROE is the engine."* Rowi measures ROE (Return on Emotion) and connects it to organizational ROI.

**Geographic scope:** global. Initial operations in LATAM (Colombia, Mexico), expansion to Europe, North America, Asia (including China), Middle East, Africa, and Caribbean. Technical and legal design takes **GDPR as the floor** and adapts to stricter regimes per jurisdiction (notably PIPL in China).

---

## 2. The Six Seconds model — complete reference

### 2.1 Five Vital Signs (climate drivers)

| Driver | Human need | Vertical axis | Horizontal axis | TVS quadrant |
|---|---|---|---|---|
| **Trust / Confianza** | Safety — to be oneself | Center | Center | (pivot, not a quadrant) |
| **Motivation / Motivación** | Meaning — sense of work | Strategy | People | Map |
| **Change / Cambio** | Growth — to evolve | Strategy | Organization | Lantern |
| **Teamwork / Trabajo en Equipo** | Belonging — to be in something together | Operations | People | First Aid Kit |
| **Execution / Ejecución** | Achievement — to feel progress | Operations | Organization | Hiking Boots |

**Clinical diagnostic patterns** (sign combinations):
- **Productive-but-empty** — high Execution, low Trust and Motivation. The body works, the soul empties. Most dangerous because financial KPIs can hold for years before breaking.
- **Change-averse** — Trust + Execution reasonable, Change critical. Typical of long-running family businesses or protected markets.
- **Fragmented** — low Teamwork + uneven Trust between areas. Frequent after acquisitions without cultural integration.

### 2.2 Fifteen Pulse Points (daily operational levers)

Three per driver. Each Pulse Point is observed across **three simultaneous planes** (book ch. 8):
- **Bodily sensation of the leader** entering the team space
- **Observed team behavior**
- **Direct conversation** with the team

| Driver | Pulse Point | Function |
|---|---|---|
| Trust | Transparency | Share truth |
| | Coherence | Align discourse and action |
| | Care | Generate human connection |
| Motivation | Meaning | Create purpose |
| | Mastery | Build strengths |
| | Autonomy | Generate ownership |
| Change | Imagination | Create emotion to innovate |
| | Exploration | Prototype and learn |
| | Celebration | Integrate learning |
| Teamwork | Divergence | Seek different perspectives |
| | Connection | Create common ground |
| | Joy | Amplify emotional energy |
| Execution | Focus | Concentrate on the essential |
| | Accountability | Make results visible |
| | Feedback | Continuous awareness |

### 2.3 Outcomes per instrument

**OVS — Organizational Vital Signs.** Measures the 5 drivers at organization scale, connects them to 4 business outcomes. The aggregate read CEOs and boards need.

> Organizational climate is like the "weather" inside the organization — is this an organization where people fear rain, or one where they arrive expecting lovely weather? Feelings and expectations are tied to relationships, the leadership team, individual fit, and the organization's evolution.

OVS outcomes:
- **Future Success** (Strategy) — Is the organization moving in a sustainable and valuable direction?
- **Customer Focus** (Organization) — Do people perceive genuine commitment to the customer to generate loyalty?
- **Productivity** (Operations) — Are people doing both the immediate work and the work that matters?
- **Retention** (People) — Is the organization retaining talented people?

Use OVS for: strategic diagnosis, cultural transformation, employer branding, baseline for 12–24 month change programs, executive committee planning input.

**TVS — Team Vital Signs.** Measures team climate across the 5 drivers, identifies opportunities and obstacles for optimal group performance.

> TVS applies to **Teams**, not Groups or Squads. A Team has: shared purpose, real interdependence, mutual accountability, sense of "we."
> If applied to a Group (people sharing space without common objectives) or a Squad (operational coordination without deep purpose), data will be invalid.

TVS classifies teams into one of four archetypes (Lantern / Map / First Aid Kit / Hiking Boots) according to where their profile dominates.

Use TVS for: team development, team building interventions, organizational change.

**LVS — Leadership Vital Signs.** 360° leadership evaluation. Compares the leader's self-perception with the perception of supervisors, direct reports, peers, and clients.

LVS outcomes (different from OVS — these are leadership-role outcomes):
- **Direction** — Establish a viable and powerful vision. Where are we going?
- **Design** — Plan and manage a fluid workflow. How do we get there?
- **Efficacy** — Generate useful results. Are we making progress?
- **Influence** — Build solid relationships to engage. Are others joining?

Use LVS for: leader development, high-potential programs, executive coaching.

Debrief process: two meetings. Meeting 1 (45–75 min, review + assign 3 highlighters OWN/CONSIDER/REJECT to each feedback item). Meeting 2 (50 min, mining + Future Focus with Expectancy Theory + Close).

**FVS — Family Vital Signs (Rowi-original extension)**

> FVS adapts the Vital Signs model to family systems. Measures how it feels to live in this family today, what sustains it, what depletes it.

The 5 drivers adapted to family context:
- **Trust** → emotional safety at home, capacity to speak honestly without consequences
- **Motivation** → shared sense of the family project, what we value together
- **Change** → how the family processes transitions (moves, births, grief, stages)
- **Teamwork** → daily cooperation, division of loads, quality of "we"
- **Execution** → how shared routines and commitments are sustained

The 15 Pulse Points keep names and function, with examples contextualized for family life (Transparency at the dinner table, not in a meeting room).

FVS outcomes (provisional — to validate with Joshua after internal definition):
- **Cohesion** — does the family feel like a solid "we"?
- **Mutual care** — are each member's needs seen and attended?
- **Growth** — can each member evolve within the system?
- **Resilience** — does the family process external shocks without breaking?

Use FVS for: couples in transition, families with adolescents, post-pandemic, post-relocation, post-loss, family therapy, parental coaching.

Technical implementation: uses the existing `FamilyRelation` model. An FVS assessment has `scope: "FVS"` and `subjectType: "family"`, where `subjectId` points to the `ownerId` of the `FamilyRelation` set with `consentStatus: accepted`.

Commercial vehicle: the existing `Plan` model with `planType: "family"` and `allowFamilyMembers: true` (max 6 users) is the natural distribution channel.

### 2.4 KCG and the 8 SEI competencies

Three circular movements (not linear) — personal operating system:

| Movement | Human question | SEI competencies | Rowi key |
|---|---|---|---|
| **Know Yourself** | What's happening inside me? | Enhance Emotional Literacy · Recognize Patterns | EL, RP |
| **Choose Yourself** | How do I choose to respond? | Apply Consequential Thinking · Navigate Emotions · Engage Intrinsic Motivation · Exercise Optimism | ACT, NE, IM, OP |
| **Give Yourself** | What for? | Increase Empathy · Pursue Noble Goals | EMP, NG |

Rowi already stores the 8 competencies in `EqSnapshot.{EL, RP, ACT, NE, IM, OP, EMP, NG}`.

### 2.5 Brain Talents (18 brain apps)

| Dimension | Rational/evaluative/practical pole | Emotional/innovative/idealistic pole |
|---|---|---|
| **Focus** (process info) | Data Exploration · Data Mapping · Prioritization | Connection · Emotional Perception · Collaboration |
| **Decision** (navigate uncertainty) | Reflection · Adaptation · Critical Thinking | Resilience · Risk Tolerance · Imagination |
| **Motivation** (sustain energy) | Proactivity · Commitment · Problem Solving | Vision · Design · Entrepreneur |

Key insight from book ch. 10: *"Burnout doesn't always come from doing too much. Sometimes it comes from doing the same thing with very few apps."* — brain "screen time" metrics.

### 2.6 Engagement Index and Cohesion

Two metrics from the official reports that Rowi must calculate:

- **Engagement Index 0–100** (per team/org): composite. Normative = 25% Engaged / 50% Neutral / 25% Disengaged. World class (per Gallup) = 67/26/7 → Index ≥ 80.
- **Standard Deviation (SD)** per driver and per Pulse Point. SD < 12 = strong consensus. SD < 15 = more consistent than norm. SD = 15 = norm. SD > 18 = subgroups disagree dramatically.
- **Distribution graph** (Strength × Cohesion): each driver and outcome positions in one of 4 quadrants based on (mean score, SD). This quadrant is **not** the TVS team quadrant — they are two different concepts sharing the visual.

### 2.7 Change MAP — methodological intervention cycle

Three phases applied fractally (from 60 min to year-long projects):
- **Engage / Atraer** — From frustration to enthusiasm. Configure assessment, debrief, co-create plan.
- **Activate / Activar** — From fear to courage. Coaching and training. Try, fail, adjust.
- **Reflect / Reflexionar** — From judgment to curiosity. Re-evaluate, capture learnings.

Each turn does not return to the same point — it ascends in a spiral.

### 2.8 Debrief process — 7 steps

Common structure across OVS/TVS/LVS — the mechanism where the report becomes learning:

1. **Set the Context** — review Why/What/Who/How from the Engage phase
2. **Overview** — model + report highlights
3. **Orientation** — quadrant (org / team / leader)
4. **Engagement & Scores** — Index 0–100, distribution, SD/cohesion
5. **Drivers & Outcomes** — relationship, variance, gaps
6. **Pulse Points + Comparisons + Additional questions** — depth by subgroup
7. **Action Plan & Conclusions** — Change MAP, commitments

LVS specific (2 meetings):
- *Meeting 1* (45–75 min) — review + assignment of **3 highlighters** (OWN / CONSIDER / REJECT) over each item
- *Meeting 2* (50 min) — Recap · Mining · Future Focus with **Expectancy Theory** (importance · clarity · believability) · Close

LVS opening principles: **Feedback** (not reality) · **Snapshot** (not permanent) · **Perspectives** (not truth) · **Ownership** (the client's).

---

## 3. The BE2GROW hypothesis layer

Each Pulse Point in the model is **hypothetically** activated by a specific set of SEI competencies and supported by specific Brain Talents. The full matrix comes from the BE2GROW program (PPTX EQ Latam, slides 55–74). **This matrix is the `v0-hypothesis` of Rowi's inference model. It is not calibrated truth.**

| Pulse Point | SEI competencies | Brain Talents | Success Factors |
|---|---|---|---|
| Transparency | EMP · ACT · EL · NG | Emotional Insight · Connection · Critical Thinking · Reflection · Collaboration | Relationships · Effectiveness |
| Coherence | IM · ACT · RP | Commitment · Prioritizing · Proactivity · Design | Effectiveness · Wellbeing |
| Care | EMP · NE · NG | Connection · Collaboration · Emotional Insight · Adaptability | Relationships · Wellbeing |
| Meaning | NG · IM · EL | Vision · Commitment · Design | Quality of Life · Effectiveness |
| Mastery | RP · IM · ACT | Data Mining · Modeling · Problem Solving | Effectiveness · Quality of Life |
| Autonomy | IM · ACT · OP | Proactivity · Prioritizing · Problem Solving | Effectiveness · Wellbeing |
| Imagination | OP · NE · NG | Imagination · Design · Vision | Effectiveness · Quality of Life |
| Exploration | OP · ACT · RP | Risk Tolerance · Entrepreneurship · Adaptability | Effectiveness · Wellbeing |
| Celebration | EL · OP · EMP | Collaboration · Emotional Insight · Resilience | Relationships · Quality of Life |
| Divergence | EMP · NE · RP | Adaptability · Collaboration · Critical Thinking | Relationships · Effectiveness |
| Connection | EMP · EL · NE | Connection · Emotional Insight · Collaboration | Relationships · Wellbeing |
| Joy | OP · IM · NE | Resilience · Collaboration · Proactivity | Wellbeing · Relationships |
| Accountability | ACT · IM · RP | Commitment · Proactivity · Prioritizing | Effectiveness |
| Feedback | EMP · EL · ACT | Emotional Insight · Critical Thinking · Reflection | Relationships · Effectiveness |
| Focus | RP · ACT · NE | Prioritizing · Data Mining · Modeling | Effectiveness · Wellbeing |

**Inference formula v0:**

```
PP_score(user) = mean(
    avg(SEI[c] for c in PP.competencies),
    avg(BT[t] for t in PP.talents),
    [optional] signal_aggregate(user, PP)
)
```

Subsequent versions (v1, v2…) use weights calibrated by regression over real data (see section 6).

---

## 4. The Lenses system

Rowi serves many user types over the same data. Each lens is a combination of **(role, scope, purpose)** that is mostly already modeled in Rowi.

### 4.1 Full catalog of lenses

| Lens | Technical role (existing or new) | Scope | What it sees | How granted |
|---|---|---|---|---|
| **Self / Employee** | `user` | self | Full profile, PPs, inferences, action plan | Default |
| **Team Leader** | `EmployeeProfile` with reports + `CommunityMember.role=owner` | team_aggregated | TVS team aggregate (N≥5), quadrant, driver–outcome gap | Inherited from manager hierarchy |
| **HR Generalist** | tenant admin + HR module access | org_aggregated | OVS aggregate, comparison by unit, pattern alerts | Permission `vital-signs.hr` |
| **General Manager / CEO** | tenant admin + executive role | org_aggregated | Executive dashboard with ROE, 4 outcomes, engagement index, vs. Six Seconds Network benchmark | Permission `vital-signs.executive` |
| **External Coach** | `ServiceEngagement(serviceRole=coach, clientUserId=X)` | coachee | LVS + KCG + Brain Talents + coaching action — only what the coachee consented to share | `coachAccessGranted: true` on coachee's profile |
| **Mentor** | `ServiceEngagement(serviceRole=mentor, clientUserId=X)` | mentee | Same as coach but focused on growth/exploration | `mentorAccessGranted: true` |
| **Organizational Consultant** | `ServiceEngagement(serviceRole=consultant, clientOrganizationId=Y)` | org_aggregated | OVS + TVS for teams in engagement scope, facilitates debriefs | Granted by client |
| **Recruiter / Talent** | tenant admin + new `vital-signs.recruiting` permission | post-offer candidates | Limited VS profile for fit prediction and onboarding (with candidate consent) | Separate permission, candidate consent |
| **Coaching Session (live)** | Coach with active `ServiceEngagement` + `liveSession: true` flag | coachee + temporary assessment | Shared view during session: coach navigates report with coachee in real time | Time-limited session |
| **Family Member** | `FamilyRelation(consentStatus=accepted)` | familyAggregated or specific relative | Family FVS aggregate + specific reading of the relative who consented | Existing bilateral consent |
| **Research lens — Rowi team** | `ResearchAccessLevel = rowi_team` | global, with consent | Model calibration, anonymous case studies by code | Only Rowi tenant super-admin can grant |
| **Research lens — Six Seconds team** | `ResearchAccessLevel = six_seconds_team` | global, with consent | Same as rowi_team | Only Joshua can grant to his team |
| **Research lens — Founder** | `ResearchAccessLevel = founder` | global, with PII | Full access, nominal cases | Eduardo (only) |
| **Research lens — Scientific lead** | `ResearchAccessLevel = scientific_lead` | global, with PII | Full access | Joshua Freedman (only) |
| **External coach/mentor invited by user** | Subset authorized by the user | self of inviting user | User can invite their own coach/mentor to see their complete emotional data | User action in their privacy panel |

### 4.2 Technical materialization

The above reduces to four combined mechanisms:

1. **`ServiceEngagement`** (existing) — for external coaches/mentors/consultants. No new model needed.
2. **Scope-aware admin permissions** (existing) — add keys `vital-signs.executive`, `vital-signs.hr`, `vital-signs.recruiting`. Just add to seed.
3. **`ResearchAccessLevel` enum** (new) on `User`:
   ```prisma
   enum ResearchAccessLevel {
     none
     founder
     scientific_lead
     rowi_team
     six_seconds_team
     invited_personal
     invited_observer
   }
   ```
4. **`PersonalResearchInvite`** (new) for user-coach/mentor invitations (bidirectional + marketplace flow):
   ```prisma
   model PersonalResearchInvite {
     id             String   @id @default(cuid())
     subjectUserId  String   // the inviting user
     inviteeUserId  String?  // the invited coach/mentor (if already on Rowi)
     inviteeEmail   String?  // if not yet on Rowi
     direction      String   // user_to_coach | coach_to_user
     scope          String   // vital_signs | kcg | brain_talents | full
     status         String   // pending | accepted | revoked | expired
     grantedAt      DateTime?
     revokedAt      DateTime?
     expiresAt      DateTime?
   }
   ```

### 4.3 Universal rule

> **What is measured is one. What is seen depends on who looks and what the subject consented to.**

This means the endpoint `/api/vital-signs/team/:id` returns the correct aggregate according to the caller's role. There are no per-lens endpoints — there is **one** that applies visibility policies according to viewer and minimum N.

### 4.4 Coach/Mentor marketplace

The user can:
- Invite an existing personal coach (by email, even if they're not yet on Rowi)
- Accept an invitation from a coach who reached out
- Choose a coach from the **Rowi marketplace** — a directory of certified coaches/mentors who registered as service providers

Coaches in the marketplace appear with public profile + specialty + Six Seconds certification level + reviews. The user picks → triggers a `ServiceEngagement` proposal → both confirm → access begins.

This activates the existing `ServiceEngagement` model with new public profile metadata. A new model `CoachProfile` will be added for marketplace listings.

---

## 5. Privacy architecture — global design

### 5.1 Regulatory base

Rowi operates under **GDPR floor + local adaptation by jurisdiction**. Emotional data almost certainly falls under "special categories" or equivalent in every relevant regime (data about mental health, emotional state, deep personal identity). This implies **explicit consent and elevated security standards** in all geographies.

Regimes covered by design:

| Region | Regime | Note |
|---|---|---|
| European Union | GDPR + ePrivacy Directive | Global design floor |
| United Kingdom | UK GDPR + DPA 2018 | GDPR mirror post-Brexit |
| EEA | GDPR | Same as EU |
| Brazil | LGPD | Nearly identical to GDPR. ANPD as authority |
| Colombia | Law 1581 + Decree 1377 | HABEAS DATA. SIC authority |
| Mexico | LFPDPPP + LGPDPPSO | ARCO rights. INAI |
| Argentina | Law 25.326 | EU-adequate |
| Chile, Peru, Uruguay | Local laws, GDPR-aligned | |
| Caribbean | Variable by country | Some without specific law — we apply GDPR by default |
| USA | CCPA/CPRA (CA), state-by-state | "Sensitive Personal Information" |
| Canada | PIPEDA, Quebec Law 25 | |
| **China** | **PIPL** | **Stricter than GDPR on cross-border transfer and sensitive data. Requires data localization for "important data" and "personal information at scale" (>1M users)** |
| Japan | APPI | Recent strict reform |
| Singapore, Hong Kong | PDPA | |
| India | DPDPA 2023 | |
| South Korea | PIPA | Strict |
| South Africa | POPIA | GDPR-similar |
| Nigeria, Kenya | NDPR / DPA | Evolving |
| UAE | DIFC DP Law + Federal DP Law | |
| Saudi Arabia | PDPL | Recent |
| Israel | Privacy Protection Law | |
| Australia | Privacy Act + APPs | |

Operational implication: any engineering decision must pass the GDPR + PIPL filter. PIPL is the strictest on cross-border transfer — China will likely require data localization or formal security assessment when we enter.

### 5.2 Five visibility levels

| Level | Who | Sees |
|---|---|---|
| `self` | The user themselves | Everything theirs, no restriction |
| `team_aggregated` | Team Leader (TVS scope) | Team average + SD, no names. **Minimum N = 5** respondents |
| `org_aggregated` | HR / SuperHub admins (OVS scope) | Organizational average + SD, aggregated by subgroups with N ≥ 5 |
| `community_public` | Other members, peers | Nothing individual. Only what the user explicitly chose to share |
| `research_lens` | Eduardo + Joshua exclusively (founder + scientific_lead); Rowi team and Six Seconds team in `rowi_team` / `six_seconds_team` modes (anonymized) | Full access with PII (founder/scientific_lead) or anonymized (teams) — **with immutable audit log and explicit user consent** |

### 5.3 Granular consent management

Five independent consents at onboarding, each opt-in (default `false`):

1. **basic_processing** — use of the product itself (required). If declined, cannot use Rowi.
2. **analytics** — use of my aggregated anonymous data to improve the product.
3. **research_lens** — Eduardo + Joshua + their respective teams (Rowi/Six Seconds) can access my complete data for case studies and model refinement. My identity never leaves that circle. Each access is logged.
4. **benchmarking_contribution** — my anonymized data can contribute to the Six Seconds Network benchmark.
5. **marketing_communications** — Rowi can send me news, use cases, invitations.

Each consent has: explicit text in 4 languages (ES/EN/PT/IT initially, then ZH/JA/AR/FR/DE), version (when text changes, re-ask), timestamp + IP at grant, mechanism to revoke at any time (≤ 30 days to propagate).

### 5.4 Data Subject Rights — integrated portal

In `/hub/account/privacy`, every user can:
- **Access (Art. 15 GDPR)** — download JSON with all their data
- **Rectification (Art. 16)** — correct any personal field
- **Erasure (Art. 17 / "right to be forgotten")** — delete account and data. Caveat: data already anonymized in benchmarks is not individually recoverable
- **Restriction (Art. 18)** — pause processing without deleting
- **Portability (Art. 20)** — export in standard format
- **Objection (Art. 21)** — to processing based on legitimate interest
- **Who accessed my data (transparency)** — log of each research lens access
- **No automated decision-making** — opt-out of automatic inferences

### 5.5 Pseudonymization per layer

| Layer | PII visible | Notes |
|---|---|---|
| `self` view | yes (own data) | |
| `team_aggregated`, `org_aggregated` | no | Any subgroup < 5 is suppressed |
| `research_lens` (founder + scientific_lead inside Rowi) | yes | Only in UI within Rowi |
| `research_lens` exports (PDFs, external case studies) | replaced by code `Case-001` | Mapping table accessible only via DPO |
| `research_lens` (rowi_team, six_seconds_team) | no — codes only | Plus aggregated stats |
| Six Seconds Network benchmarks | never PII | Only aggregated scores, hashed identifiers |

### 5.6 Cross-border transfers

- **Adequacy (GDPR Art. 45)** — where the EU has declared adequacy (UK, Switzerland, Japan, etc.) — free transfer.
- **SCCs (Art. 46)** — Standard Contractual Clauses for rest of EU → other countries.
- **PIPL China** — options: (a) CAC security assessment, (b) personal information protection certification, (c) Chinese standard contract. Likely will require **data residency in China** (Alibaba Cloud / Tencent Cloud) when we enter.
- **Data residency per region** — future design: cluster per region (EU, US, China, LATAM) with selective replication.

### 5.7 DPIA — Data Protection Impact Assessment

Because we process sensitive emotional data at scale, GDPR Art. 35 requires DPIA before productive launch. The DPIA must cover:
- Description of processing (5 frameworks)
- Necessity and proportionality
- Risks to user rights
- Mitigation measures (those listed in 5.3–5.6)
- Consultation with DPO

**Pending**: contract external DPO (or appoint internal) and complete DPIA before significant productive traffic in the EU.

### 5.8 Immutable audit log

Model `ResearchAccessAudit` records each access by Eduardo, Joshua, or their teams to identifiable data:
- `viewerUserId`, `subjectUserId`, `action`, `contextPath`, `at`, `metadata`
- Append-only, no DELETE permitted
- Visible to the affected user on demand (Art. 15)
- Off-site backup with 7-year retention

### 5.9 Breach notification

If there is a breach:
- **72 hours** to notify the competent supervisory authority (GDPR Art. 33)
- To affected users "without undue delay" if high risk (Art. 34)
- Documented plan: detection · containment · evaluation · notification · post-mortem
- Cyber-insurance recommended for financial coverage

### 5.10 Children's data

Rowi requires **18+ by default** to avoid regulatory complexity of minors (PIPL <14 requires separate parental consent; GDPR varies 13–16 by member state). If future integrations require minors, extend architecture then, not before.

---

## 6. Data model

### 6.1 What we reuse from Rowi (no new code)

- `User`, `Account`, `Session` — auth and profile
- `EqSnapshot` with `K`, `C`, `G`, and the 8 competencies
- `EqCompetencySnapshot`, `EqOutcomeSnapshot`, `EqSubfactorSnapshot`, `EqSuccessFactorSnapshot`
- `TalentSnapshot` — the 18 Brain Talents
- `EqMoodSnapshot`, `EqProgress`
- `EmotionalEvent` — base for microsignals
- `AssessmentCampaign` — extend with types VS_OVS, VS_TVS, VS_LVS, VS_FVS
- `WorkspaceAlert` — extend with VS types
- `CsvUpload` — ingest infrastructure
- `RowiCommunity`, `CommunityMember` — multi-tenant
- `policy.hierarchy.ts` + `policy.scope.ts` — visibility routing
- `ServiceEngagement` — all external lenses (coach, mentor, consultant)
- `EmployeeProfile.managerId` — team leader lens
- `FamilyRelation` — full FVS
- `HR admin module` (`/hub/admin/hr/*`) — where the HR lens for VS is inserted
- `Coaching admin module` (`/hub/admin/coaching/*`) — where the coach lens for VS is inserted
- `EQ dictionary` (`src/domains/eq/lib/dictionary.ts`) — base SEI lexicon
- `Plan` model with tier `family` — commercial vehicle for FVS
- i18n provider + dictionaries
- `ContextSwitcher` + `rowi_active_context` cookie

### 6.2 New static catalog (TypeScript, no tables)

`src/lib/vital-signs/catalog.ts` — the 5 drivers, 15 PPs, 8 SEI, 18 BT, 4 OVS outcomes, 4 LVS outcomes, 4 FVS outcomes (provisional), 4 quadrants, BE2GROW v0 matrix, outcome→drivers matrix.

### 6.3 New Prisma models

See section 6 of the in-chat plan for full models. Summary list:

**Diagnostic:**
- `VitalSignsAssessment` — one instance per measurement (OVS/TVS/LVS/FVS/native/continuous)
- `VitalSignsResponse` — individual responses
- `VitalSignsScore` — aggregated scores by dimension/level with SD

**Learning loop:**
- `PulsePointInference` — what BE2GROW predicted
- `PulsePointGroundTruth` — measured vs inferred delta
- `HypothesisFeedback` — OWN/CONSIDER/REJECT verdicts

**Debrief:**
- `DebriefSession` — 7-step wizard
- `ActionCommitment` — with Expectancy Theory scores

**Privacy:**
- `UserConsent` — granular versioned consents
- `ResearchAccessAudit` — immutable log
- `PersonalResearchInvite` — bidirectional + marketplace
- `User.researchAccessLevel` (new enum)

**Marketplace:**
- `CoachProfile` — public profile for marketplace listings (new)

**Microsignals:**
- `PulsePointSignal` — interaction-tagged signals

### 6.4 Planned API endpoints

| Endpoint | Purpose | Access |
|---|---|---|
| `GET /api/vital-signs/me` | User's 15 PPs (v0 inference) | self |
| `GET /api/vital-signs/team/:id` | Team aggregate with SD | team_aggregated, N ≥ 5 |
| `GET /api/vital-signs/org/:id` | Org aggregate | org_aggregated, N ≥ 5 |
| `GET /api/vital-signs/family/me` | Family FVS | self with family consent |
| `POST /api/vital-signs/upload` | Upload OVS/TVS/LVS CSV | scope admin |
| `POST /api/vital-signs/signal` | Record microsignal | self |
| `POST /api/vital-signs/debrief/:id/step/:n` | Advance debrief | facilitator + subject |
| `POST /api/vital-signs/feedback` | OWN/CONSIDER/REJECT per PP | self of scope |
| `GET /api/account/privacy/export` | Data subject access | self |
| `POST /api/account/privacy/delete` | Right to erasure | self |
| `GET /api/account/privacy/audit-log` | Research access log of my data | self |
| `POST /api/account/consent` | Grant/revoke consent | self |
| `GET /api/coaches/marketplace` | Public coach directory | any authenticated |
| `POST /api/account/invites/coach` | Invite a coach (bidirectional) | self |
| `GET /api/research/cases` | List of cases (codes) | research_lens |
| `GET /api/research/cases/:code` | Case detail with PII | research_lens (audited) |
| `GET /api/research/calibration` | Suggested v1 weights | research_lens |
| `POST /api/research/weights/promote` | Promote v0 → v1 | founder only |

### 6.5 Planned pages

| Route | Purpose |
|---|---|
| `/hub/vital-signs` | My VS profile (15 PPs + 5 drivers + quadrant) |
| `/hub/vital-signs/history` | Temporal evolution |
| `/hub/vital-signs/team/:id` | Team view (leader or member) |
| `/hub/family/vital-signs` | FVS view for the user and their family |
| `/hub/admin/vital-signs/upload` | CSV upload |
| `/hub/admin/vital-signs/assessments` | Assessment listing |
| `/hub/admin/hr/vital-signs` | HR lens |
| `/hub/admin/coaching/clients/[id]/vital-signs` | Coach lens per client |
| `/hub/exec/health` | Executive dashboard |
| `/hub/debrief/:id` | 7-step wizard |
| `/hub/account/privacy` | Full DSR portal |
| `/hub/account/connections` | Coach marketplace + personal invites |
| `/research` | Research lens landing (2FA) |
| `/research/cases` | Anonymous case listing |
| `/research/cases/:code` | Nominal detail (audited) |
| `/research/calibration` | v0 hypothesis vs observed reality comparison |

---

## 7. Learning loop

The system improves through four states:

```
1. INFERENCE                    Rowi calculates PPs from SEI + BT + signals
        ↓
2. GROUND TRUTH                 Real OVS/TVS/LVS (CSV or native survey)
                                Calculates delta inferred vs measured per PP
        ↓
3. HUMAN VALIDATION             Debrief with 3 highlighters (OWN/CONSIDER/REJECT)
                                + Expectancy Theory in action plan
                                + Qualitative comments
        ↓
4. MODEL REFINEMENT             Weekly job: multivariate regression
                                Calculates α/β/γ weights per PP
                                Versions as v1, v2, v3...
                                Promotion requires Eduardo's approval
        ↑
        └── back to 1 with calibrated weights
```

Loop metrics:
- **Hit rate** per PP — % of OWN hypotheses out of total OWN+CONSIDER+REJECT
- **Calibration delta** per PP — mean(|inferred − measured|) per cohort
- **Stability** — variance of calibrated weights between cohorts (industry, country, size)
- **Coverage** — % of PPs with sufficient data to calibrate (N respondents)

Weight versioning:
- `v0-hypothesis` — direct BE2GROW matrix from PPTX
- `v1-YYYYMM` — first calibration with sufficient real data
- Each upgrade requires: ≥ 30 assessments, ≥ 100 highlighter responses per PP, explicit approval by Eduardo in `/research/calibration`

---

## 8. Roadmap

| Sprint | Phases | Deliverable |
|---|---|---|
| **0** | 0.1–0.7 | Léxico + catálogo + definitions + Prisma models + `/hub/vital-signs` (Self lens) + `/hub/family/vital-signs` (FVS preliminary) + browser verification |
| **1** | privacy + consent + marketplace | Models for consent/audit/invite + onboarding panel + `/hub/account/privacy` + `/hub/account/connections` |
| **2** | CSV ingest | OVS/TVS/LVS parsers + comparison inferred vs measured + admin assessments view |
| **3** | lenses Team/HR/Exec/Coach | Permission keys + sub-views in HR/Coaching admin + executive dashboard |
| **4** | debrief wizard | 7-step component reusable across OVS/TVS/LVS/FVS + 3 highlighters + Expectancy Theory |
| **5** | research lens | `/research/*` + audit log + Joshua's account |
| **6** | microsignals + Engagement Index | Tag interactions + intelligent check-in + SD + Index 0–100 |
| **7** | model calibration | Weekly regression job + propose/promote workflow |
| **8** | longitudinal + recruiter + live session | Re-evaluation at 90 days + recruiter lens + live coaching session view |
| **9** | i18n Asia + data residency | ZH/JA/AR/FR/DE locale + regional clusters EU/China/LATAM |

---

## 9. Stakeholders and roles

| Person / team | Role | Access |
|---|---|---|
| **Eduardo González** | Founder, sole super-admin, product owner | `research_lens: founder` + super-admin |
| **Joshua Freedman** | Scientific lead, model author, mentor | `research_lens: scientific_lead` |
| **Rowi team** | Internal engineering and product | `research_lens: rowi_team` (anonymized) |
| **Six Seconds team** | Network of certified practitioners | `research_lens: six_seconds_team` (anonymized) |
| **BE2GROW team (Six Seconds Latam)** | Authors of the v0 hypothesis matrix | read access to `research/calibration`, no PII |
| **DPO (TBD)** | Data Protection Officer | access to audit logs, not the product |
| **Client organization leaders** | Consume TVS reports of their teams | `team_aggregated` |
| **HR / Executive committee** | Consume OVS reports | `org_aggregated` |
| **Members / team employees** | Take assessments, fill check-ins | `self` |
| **Personal account users** | Personal KCG + VS tracking | `self` |
| **Family members** | Members of declared family systems | `self` + `family_aggregated` with mutual consent |

---

## 10. Decisions made

| # | Decision | Justification |
|---|---|---|
| 1 | Start with Phase 0+1 (visible) before privacy phase | Without visualization there's nothing to validate |
| 2 | Consent opt-in (default false) | More conservative, legally defensible |
| 3 | Joshua account created when phase 5 is ready | Before that nothing to see |
| 4 | Sample CSVs marked as `dataset: "sample"` | Don't contaminate real calibration |
| 5 | PII visible for Eduardo+Joshua inside Rowi; codes in exports | Balance research utility and privacy |
| 6 | 3 highlighters per role per scope: leader marks LVS, team marks TVS, HR marks OVS | Each validates their own |
| 7 | GDPR as global floor, PIPL as strictest reference | Covers all operational jurisdictions |
| 8 | Data residency per region when entering China | PIPL likely requires it |
| 9 | DPIA before significant productive EU traffic | Art. 35 compliance |
| 10 | 18+ default, no children's data in v1 | Reduces regulatory complexity |
| 11 | FVS moved to Sprint 0 (was phase 7) | Commercial family product, immediate differentiator |
| 12 | FVS definitions defined internally first, shown to Joshua after | Speed to market without losing scientific rigor |
| 13 | Coach/mentor invite is bidirectional + marketplace | User autonomy + practitioner ecosystem |
| 14 | Research lens extended to Rowi team + Six Seconds team (anonymized) | Distributed model refinement |

---

## 11. Open questions

- **Q1**: Internal or external DPO? Recommendation: external (privacy-specific consultancy) until 5k+ users.
- **Q2**: EU hosting from day 1 or when first European clients arrive? Recommendation: EU parallel setup from day 1 (Neon has EU regions), geo routing.
- **Q3**: "Lite" version without research lens for clients with extreme regulations? Possibly required for Saudi Arabia or sectors like health/banking.
- **Q4**: Specific legal agreement Six Seconds — Cactus Comunidad on model IP and shared data? Required before production promotion.
- **Q5**: Cyber-insurance? Recommended, typical USD 1–5M for a startup with sensitive data.
- **Q6**: External security audit (SOC2 Type 2)? Recommended on reaching first enterprise clients.

---

## 12. References

- **Book**: González, Eduardo. *Emotional Budgeting: How Emotional Energy Became the Most Valuable Resource in the Age of AI.* Six Seconds, first edition. Especially chs. 6 (EQ→ROE), 7 (Vital Signs), 8 (Pulse Points), 9 (KCG), 10 (Brain Talents), 13 (lagging indicators), 16 (ROWIIA), 18 (distributed capacities).
- **PPTX**: *Programa Vital Signs EQPM · 1.5 días* (EQ Latam · Six Seconds Network). BE2GROW annexes slides 55–74.
- **PDFs**: *Suggested Process for OVS/TVS/LVS debrief* (Six Seconds Network).
- **Sample CSVs**: OVS (583 respondents), TVS (30 respondents), LVS xlsx (97–99 rows).
- **State of the Heart** (Six Seconds, published annually).
- **Six Seconds research base**: FedEx, Komatsu, Siemens, Amadori, Sheraton cases.
