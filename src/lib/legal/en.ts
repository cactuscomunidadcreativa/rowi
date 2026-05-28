// src/lib/legal/en.ts
// ============================================================
// LEGAL CONTENT — ENGLISH
// Derived translation of es.ts (LEGAL_ES, the master / source of truth).
// Keep structure, keys, section order and lastUpdated in sync with es.ts.
// ============================================================

import type { LegalDocSet } from "./types";

const LAST_UPDATED = "2026-05-28";

export const LEGAL_EN: LegalDocSet = {
  privacy: {
    title: "Privacy Policy",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "This Privacy Policy describes how Rowi collects, uses, shares and protects your personal data. Rowi operates the Emotional Budgeting and Vital Signs platform built on the Six Seconds methodology. Your privacy is a core principle of our product, not a formality.",
    sections: [
      {
        heading: "1. Who is responsible for your data",
        body: [
          "Rowi, with operations managed from Peru, is the controller of the personal data it collects through this platform for individual users.",
          "When you use Rowi as part of your company, educational institution or organization (B2B account), that organization is the controller of your data, and Rowi acts as a processor following its instructions. In that case, your organization's privacy policies also apply.",
          "Six Seconds is an independent entity that provides the scientific methodology (SEI, Brain Talents, Vital Signs) and reference data (benchmark). Six Seconds is not responsible for the operation of this platform. See the 'Notice about Six Seconds' for more detail.",
        ],
      },
      {
        heading: "2. What data we collect",
        body: [
          "- Account data: name, email address, preferred language, country, profile photo.",
          "- Emotional measurement data: responses to assessments (Vital Signs, pulse points), SEI competencies, Brain Talents, debriefs.",
          "- Relationship data: family ties, work relationships (manager/reports), service engagements you declare.",
          "- Technical data: IP address, device type, browser, access logs.",
          "- Payment data: handled by Stripe; Rowi does not store card numbers.",
        ],
      },
      {
        heading: "3. Why we use your data (legal bases)",
        body: [
          "- Providing the service (performance of the contract): showing you your measurements, generating reports, enabling the features you activate.",
          "- Improving the product and research (legitimate interest and/or explicit consent): refining the BE2GROW model and the frameworks. Use for research is governed by the 'Research Notice' and requires your explicit, revocable consent.",
          "- Transactional communications (performance of the contract): confirmations, invitations, reminders.",
          "- Legal compliance and security (legal obligation and legitimate interest).",
        ],
      },
      {
        heading: "4. Use of data for research",
        body: [
          "Rowi is also a research platform on emotional intelligence. Your data may contribute to refining our models, ALWAYS under safeguards:",
          "- Explicit consent, separate from the basic use of the product. You can revoke it at any time.",
          "- Anonymization or pseudonymization before any aggregate analysis.",
          "- N≥5 rule: no aggregate team or organization data is shown if there are fewer than 5 people, to prevent re-identification.",
          "- Five visibility levels: personal, team aggregate, organization aggregate, public community, and research lens.",
          "- Every research query is recorded in an access audit (ResearchAccessAudit).",
          "See the 'Research Notice' for the full detail and the consent flow.",
        ],
      },
      {
        heading: "5. Who we share data with",
        body: [
          "- Service providers (processors): Stripe (payments), Resend (email), infrastructure providers (Vercel, Neon), under data processing agreements.",
          "- Six Seconds: in its role as methodological and scientific partner, it may access anonymized/aggregated data for research purposes, in accordance with the 'six_seconds_team' visibility level and always under audit.",
          "- Your organization: if you use a B2B account, aggregate data (N≥5) may be visible to administrators of your organization according to their role.",
          "- We never sell your personal data.",
        ],
      },
      {
        heading: "6. International transfers",
        body: [
          "Rowi operates with infrastructure that may process data outside your country of residence. As a protection floor we apply the EU General Data Protection Regulation (GDPR), adapted by jurisdiction (Peru: Law No. 29733; Ecuador: LOPDP). When we enter markets with data residency requirements (for example, China under PIPL), we will implement the corresponding measures.",
        ],
      },
      {
        heading: "7. Your rights",
        body: [
          "You have the right to: access your data, rectify it, erase it, object to its processing, request portability and revoke consents.",
          "You can exercise most of these rights directly from the Privacy section of your account, including exporting your data.",
          "For additional requests, write to privacidad@rowiia.com.",
        ],
      },
      {
        heading: "8. Retention",
        body: [
          "We keep your data while your account is active and for the period necessary to comply with legal obligations. When you delete your account, your personal data is deleted or anonymized, except for what we must retain by law.",
        ],
      },
      {
        heading: "9. Security",
        body: [
          "We apply encryption in transit and at rest for sensitive data, role-based access control, and audit logging. No system is 100% infallible, but we treat security as a priority.",
        ],
      },
      {
        heading: "10. Contact",
        body: [
          "Controller: Rowi, with operations managed from Peru. Privacy contact: privacidad@rowiia.com. For legal inquiries: legal@rowiia.com.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "These Terms govern the use of the Rowi platform. By creating an account or using the service, you accept these Terms.",
    sections: [
      {
        heading: "1. Who we are",
        body: [
          "Rowi is an Emotional Budgeting and Vital Signs platform built on the Six Seconds methodology, with operations managed from Peru. Rowi is an independent entity, solely responsible for the operation of this platform.",
        ],
      },
      {
        heading: "2. Use of the service",
        body: [
          "You must be of legal age or have authorization from your legal representative. You are responsible for the accuracy of the data you enter and for keeping your credentials confidential.",
          "You may not use Rowi for unlawful purposes, to violate the privacy of third parties, or to extract data in an automated manner without authorization.",
        ],
      },
      {
        heading: "3. Intellectual property",
        body: [
          "The Six Seconds methodology (SEI, Brain Talents, Vital Signs and associated trademarks) is owned by Six Seconds and is used under license/partnership. 'Six Seconds' is a registered trademark of its owner and is not translated nor used outside the terms of that license.",
          "The software, design and implementation of the Rowi platform are owned by Rowi. You acquire no rights over them beyond the use of the service.",
        ],
      },
      {
        heading: "4. Not professional advice",
        body: [
          "Rowi is a tool for the development and measurement of emotional intelligence. It does NOT replace medical, psychological, psychiatric or therapeutic advice. If you are going through a crisis, contact a health professional or a helpline. The crisis detection features escalate signals but do not constitute clinical care.",
        ],
      },
      {
        heading: "5. Payments and subscriptions",
        body: [
          "Paid plans are handled through Stripe. Subscriptions renew automatically unless cancelled. You can manage or cancel your subscription from your account. Refunds are governed by the policy in effect at the time of purchase.",
        ],
      },
      {
        heading: "6. Limitation of liability",
        body: [
          "Rowi is provided 'as is'. To the maximum extent permitted by law, Rowi shall not be liable for indirect, incidental or consequential damages arising from the use of the service.",
          "Rowi is responsible solely for the operation of its own platform. Six Seconds, as a methodology provider and independent entity, is not responsible for the operation, availability or data processing decisions of the Rowi platform.",
        ],
      },
      {
        heading: "7. Suspension and termination",
        body: [
          "We may suspend or terminate accounts that violate these Terms. You can close your account at any time from the settings.",
        ],
      },
      {
        heading: "8. Governing law and arbitration",
        body: [
          "These Terms are governed by the laws of the Republic of Peru.",
          "Any dispute arising from these Terms shall be definitively resolved through arbitration at law, seated in Lima, Peru, administered in accordance with the rules of the relevant arbitration center. The arbitration shall be conducted in Spanish before a sole arbitrator.",
        ],
      },
      {
        heading: "9. Changes",
        body: [
          "We may update these Terms. We will notify you of material changes. Continued use after notification implies acceptance.",
        ],
      },
    ],
  },

  "six-seconds": {
    title: "Notice about Six Seconds",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "This notice clarifies the relationship between Rowi and Six Seconds, and the separation of responsibilities between both entities.",
    sections: [
      {
        heading: "1. Independent entities",
        body: [
          "Rowi, with operations managed from Peru, and Six Seconds are legally independent entities.",
          "Rowi operates its platform in partnership with Six Seconds, using its methodology and reference data under license. Each entity maintains its own legal personality and responds independently for its respective obligations.",
        ],
      },
      {
        heading: "2. Six Seconds' role",
        body: [
          "Six Seconds provides: the scientific methodology (SEI — the 8 emotional intelligence competencies, the 18 Brain Talents, the Vital Signs framework), reference data (benchmark) and scientific guidance.",
          "Six Seconds is a registered trademark of its owner. Rowi uses it in accordance with the terms of its license/partnership and does not translate it.",
        ],
      },
      {
        heading: "3. Respect for Six Seconds' policies",
        body: [
          "Rowi undertakes to respect the privacy and data use policies of Six Seconds applicable to the methodology and data it provides. Any access by Six Seconds to platform data is limited to anonymized/aggregated information for research purposes and under audit.",
        ],
      },
      {
        heading: "4. Responsibility",
        body: [
          "Rowi is solely responsible for the operation of this platform: availability, security, user support and decisions on the processing of users' personal data.",
          "Six Seconds, as a methodology provider and independent entity, is not responsible for the operation of the Rowi platform nor for the data processing that Rowi carries out as controller.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "We use cookies and similar technologies to operate the platform and, with your consent, for analytics.",
    sections: [
      {
        heading: "1. What cookies are",
        body: [
          "Cookies are small files stored on your device to remember information between visits.",
        ],
      },
      {
        heading: "2. Categories we use",
        body: [
          "- Essential: necessary to log in and keep your session secure. They do not require consent.",
          "- Functional: remember preferences such as language and active context.",
          "- Analytics: help us understand the use of the platform (for example, Google Analytics). They are only activated with your consent.",
        ],
      },
      {
        heading: "3. Your control",
        body: [
          "When you enter, we show you a banner to accept, reject or configure non-essential cookies. You can change your choice at any time. If you reject analytics, we do not load those scripts.",
        ],
      },
    ],
  },

  research: {
    title: "Research Notice and Consent",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Rowi is also a research platform on emotional intelligence, in collaboration with Six Seconds. This notice explains how data is used for research and how you control your participation.",
    sections: [
      {
        heading: "1. Voluntary and revocable participation",
        body: [
          "The use of your data for research is optional and requires your explicit consent, separate from the basic use of the product. You can grant or revoke it at any time from the privacy settings, without affecting your access to the service.",
        ],
      },
      {
        heading: "2. What data and how it is protected",
        body: [
          "For research we use emotional measurement data (Vital Signs, SEI competencies, Brain Talents, debriefs) in an anonymized or pseudonymized way.",
          "N≥5 rule: no aggregate result is published or shown if it represents fewer than 5 people.",
          "The BE2GROW model (relationship between pulse points, SEI competencies and Brain Talents) is a hypothesis under calibration; your contributions help refine it, always in an aggregate and anonymized way.",
        ],
      },
      {
        heading: "3. Visibility levels",
        body: [
          "- Personal: only you see your individual data.",
          "- Team aggregate (N≥5): visible to your team, without identifying individuals.",
          "- Organization aggregate (N≥5): visible at the organizational level, without identifying individuals.",
          "- Public community: anonymous community statistics.",
          "- Research lens: restricted and audited access for scientific purposes.",
        ],
      },
      {
        heading: "4. Who accesses the research lens",
        body: [
          "Research access is granted by defined levels and is always recorded in an audit (ResearchAccessAudit): Rowi founding team, scientific leadership, Rowi and Six Seconds teams (over anonymized data), and people you explicitly invite (your coach or mentor).",
        ],
      },
      {
        heading: "5. Your rights regarding research",
        body: [
          "You can revoke your consent, request that your data stop being used in future analyses, and consult the record of who accessed your data. Revocation does not affect analyses that are already anonymized and irreversible.",
        ],
      },
    ],
  },
};
