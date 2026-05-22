# ROWIIA — Scope integrado

> **Status:** v0.2 — mapa de integración entre los tres frentes del producto
> **Última revisión:** 2026-05-21

ROWIIA opera **tres frentes integrados** sobre el mismo stack y la misma metodología Six Seconds:

1. **Emotional Budgeting** — sistema personal/empresarial. Documento maestro: [`EMOTIONAL_BUDGETING.md`](./EMOTIONAL_BUDGETING.md).
2. **EmoPower Schools (K-12)** — sistema escolar para educación primaria y secundaria. Documento maestro: [`EMOPOWER_SCHOOLS.md`](./EMOPOWER_SCHOOLS.md).
3. **Rowi Education / Higher Ed** — universidades (pre-grado, post-grado, formación técnica). Foco: preparar al estudiante para inserción laboral con LVS, BBP, SEI. Capítulo dedicado en este documento (sección 9).

Adicional, todo el frente de educación tiene un **sub-hub paralelo**:
- **Rowi Student** — espacio del estudiante (todas las edades, K-12 + Higher Ed) con journal privado, herramientas SEL por banda, contacto con adultos de confianza. Comparte data con familias vía multi-hubs (mismo Rowiverse, distintos espacios).

Este documento describe **cómo se conectan los tres frentes** y **qué se construye una vez para servir a todos**.

---

## 1. Visión unificada

Los dos productos comparten:

- **El modelo Six Seconds** — KCG (Know yourself / Choose yourself / Give yourself), 8 competencias SEI, 18 Brain Talents.
- **El framework Vital Signs** — 5 drivers (Trust / Motivation / Change / Teamwork / Execution) y 15 Pulse Points (BE2GROW).
- **El stack** — Next.js 16 + Prisma + Postgres + NextAuth + Vercel.
- **El operador local** — Brain Up Ecuador, Country Partner oficial de Six Seconds.
- **La plataforma única** — rowiia.com. No hay dos productos separados con dos URLs; un usuario que es a la vez coach personal y Quality Coach de escuela ve los dos contextos en su misma sesión.

Lo que cambia es el **objeto medido**:

| Producto | Objeto | Instrumento principal | Output |
|---|---|---|---|
| Emotional Budgeting | Persona / equipo / organización | SEI, BBP, BTP, OVS, TVS, LVS, FVS | 15 PPs personales/de equipo, debriefs |
| EmoPower Schools | Institución educativa | **EVS** (clima escolar), SEI, SEI-YV, BBP, BTP, BDP | 4 dim. clima, observaciones aula, ciclo mensual QC |

---

## 2. Lo que ya está construido y que sirve a ambos

Inventario tras los sprints VS + EmoPower previos:

### Modelos Prisma reutilizables

| Modelo | Uso en Emotional Budgeting | Uso en EmoPower Schools |
|---|---|---|
| `User` | persona física | docente, estudiante, QC, director, autoridad |
| `Tenant` | empresa cliente | **colegio o sistema educativo** |
| `EmployeeProfile.managerId` | jerarquía empresa | jerarquía escolar (docente→jefe área, QC→coord SEL) |
| `FamilyRelation` | familia personal | familia del estudiante (vínculo legal/consentimiento) |
| `ServiceEngagement` | provider→cliente | Brain Up→colegio, QC→docente |
| `EqSnapshot` | 8 SEI adulto | SEI docente + SEI-YV adaptado |
| `TalentSnapshot` | 18 BT | BTP/BBP/BDP |
| `VitalSignsAssessment` | OVS/TVS/LVS/FVS | EVS, observación de aula |
| `PulsePointInference` + `GroundTruth` | inferencia v0 + calibración | igual; el modelo BE2GROW sirve a ambos |
| `PulsePointWeights` (nuevo) | modelo v0→v1 calibrado | igual; un benchmark escolar genera su propia v1 |
| `DebriefSession` (7 pasos) | debrief individual/equipo | devolución 1:1 docente↔QC |
| `ActionCommitment` | Expectancy Theory commitments | compromisos firmados docente↔QC |
| `HypothesisFeedback` (OWN/CONSIDER/REJECT) | calibración del modelo | refinamiento de la rúbrica de aula |
| `PulsePointSignal` | microsignal personal | check-in del estudiante en journal |
| `UserConsent` (5 granulares) | personal | estudiante / familia / docente con sus 5 consents |
| `ResearchAccessAudit` | acceso auditado | acceso de autoridades a data agregada |
| `ResearchAccessLevel` enum | founder/scientific_lead/rowi_team/six_seconds_team/invited | + brainup_team, school_admin, mineduc (a añadir) |

### Lentes existentes que se extienden a EmoPower

| Lente actual | Extensión a Schools |
|---|---|
| `coach` (ServiceEngagement) | **Quality Coach** (especialización: 10–15 docentes, ciclo mensual) |
| `mentor` | mentor docente, mentor estudiante (DECE) |
| `team_aggregated` (HR, N≥5) | aula, grupo, ciclo |
| `org_aggregated` (org GM, N≥5) | colegio, distrito, MINEDUC |
| `family` | familia del estudiante (gating distinto: estudiante decide qué se comparte) |
| `research` | investigación Six Seconds + organismos internacionales |

### Privacidad ya soportada

- 5 consents granulares (basic_processing, analytics, research_lens, benchmarking_contribution, marketing_communications) versionados.
- ConsentGate enforcement client-side en los layouts (app)/hub/research.
- DSR portal completo en /hub/account/privacy (export Art. 15 GDPR + audit log + revocaciones).
- Privacy floor GDPR adaptable a PIPL (China), LGPD (Brasil), CCPA, etc.
- **Para estudiantes menores**: aplica gating adicional vía FamilyRelation + consent parental. La privacidad del estudiante es absoluta dentro del colegio (el rector NO ve el journal del estudiante).

---

## 3. Lo que falta construir específicamente para EmoPower Schools

### Modelos Prisma nuevos

```
Institution                    // colegio
  id, name, country, region, distritoId, type (private/public), modality,
  levels (inicial/primaria/secundaria/bachillerato), sealStatus,
  tenantId (link al Tenant existente), createdAt

InstitutionLevel               // ciclo dentro del colegio
  id, institutionId, code (preK/K/primary/middle/high), bandKey (1-7)

Cohort                         // grupo/aula por año
  id, institutionId, levelId, year, name (e.g. "5º A"), homeroomTeacherId

QualityCoachAssignment         // QC ↔ docentes (10-15)
  id, qcUserId, teacherUserId, institutionId, startedAt, endedAt?

ClassroomObservation           // rúbrica de aula 3 dimensiones
  id, qcUserId, teacherUserId, institutionId, observedAt, durationMin,
  d1OpennessScore (1-4), d1Evidence (text),
  d2ConnectionScore (1-4), d2Evidence,
  d3TransferScore (1-4), d3Evidence,
  overallScore (computed), strengthAreas, growthAreas

FeedbackSession                // devolución 1:1 semana 2
  id, observationId, scheduledAt, conductedAt, durationMin,
  teacherReadingNote, qcEvidenceNote, coDesignedImprovements,
  teacherSignedAt, qcSignedAt, status (scheduled/completed/skipped)

CommunityOfPractice            // encuentro grupal semana 3
  id, qcUserId, institutionId, scheduledAt, durationMin,
  attendanceUserIds[], casesDiscussed (text), practicesEmerged (text),
  recordingUrl?, transcriptUrl?

SupervisionSession             // semana 4 QC ↔ Brain Up
  id, qcUserId, supervisorUserId (BrainUp), scheduledAt, conductedAt,
  casesEscalated, dataReviewed, methodologyQuestions, supervisorResponse,
  adjustmentsAgreed

EducationVitalSigns            // EVS institucional (4 dim)
  id, institutionId, wave (1|2|3), measuredAt,
  safetyScore, connectionScore, belongingScore, purposeScore,
  participantCount, dataset (json)

EvsResponse                    // respuesta individual a EVS
  id, evsId, respondentUserId, role (teacher/student/parent/staff),
  answers (json), submittedAt

CertificationProgress          // EQE1/2/3 + UEQ/EQAC/BPC
  id, userId, certification (EQE1|EQE2|EQE3|UEQ|EQAC|BPC),
  status (enrolled/in_progress/certified/expired),
  hoursAccrued, startedAt, completedAt?, certificateUrl?

StudentJournal                 // diario privado del estudiante
  id, studentUserId, week, emotionsNamed[], freeText (encrypted),
  selToolsUsed[], requestedAdultContact (bool), crisisFlag (bool),
  visibility ("self_only" | "shared_with_dece" | "shared_with_tutor")

SelLesson                      // banco de lecciones por banda
  id, band (1-7), title, durationMin, materials[], objectives,
  competenciesTargeted[], language

EmbeddedSelMapping             // SEL por materia
  id, subject, gradeLevel, lessonId, suggestions (text)

PopUpFestivalEvent             // eventos globales Six Seconds
  id, year, theme, scheduledAt, microActivities (json)

ParentCommunication            // 4 comunicaciones anuales
  id, institutionId, kind (launch|evs_debrief|workshop|showcase),
  scheduledAt, contentRefs

ImplementationPhase            // tracking de las 6 fases
  id, institutionId, phase (1-6), startedAt, completedAt?, status,
  milestones (json)
```

### Endpoints API nuevos

```
# Institución y cohortes
POST   /api/admin/institutions
GET    /api/admin/institutions/[id]
POST   /api/admin/institutions/[id]/cohorts

# Ciclo mensual del QC
POST   /api/qc/observations                     # Semana 1
GET    /api/qc/observations?teacherId=
POST   /api/qc/feedback-sessions                # Semana 2 (devolución 1:1)
GET    /api/qc/feedback-sessions/[id]
POST   /api/qc/community-of-practice            # Semana 3
GET    /api/qc/community-of-practice
POST   /api/qc/supervision                      # Semana 4
GET    /api/qc/supervision

# EVS — Education Vital Signs
POST   /api/evs/launch                          # arranca una ola
POST   /api/evs/respond                         # respuesta individual
GET    /api/evs/[id]/report                     # reporte agregado
GET    /api/evs/wave-comparison?inst=X          # Ola 1 vs 3

# Estudiante
POST   /api/student/journal                     # entrada privada
GET    /api/student/journal/me                  # solo del propio estudiante
POST   /api/student/contact-adult               # solicitar contacto
GET    /api/student/insights                    # patrones detectados

# Certificaciones
POST   /api/certifications/enroll
PATCH  /api/certifications/[id]/progress
GET    /api/certifications/me

# Dashboards estratégicos
GET    /api/dashboards/teacher/me
GET    /api/dashboards/qc/me
GET    /api/dashboards/principal/[institutionId]
GET    /api/dashboards/brainup/national
GET    /api/dashboards/mineduc/system
GET    /api/dashboards/six-seconds/global

# Family
GET    /api/parents/dashboard
POST   /api/parents/acknowledge-communication
```

### Páginas hub nuevas

```
# Vista pública / usuario
/hub/student/journal                   # diario privado (estudiante)
/hub/student/tools                     # herramientas SEL según banda
/hub/teacher/observations              # mis observaciones recibidas
/hub/teacher/sel-lessons               # banco de lecciones de mi banda
/hub/teacher/community                 # comunidad de práctica de mi QC
/hub/parent/dashboard                  # 4 comunicaciones + materiales
/hub/parent/popup-festival             # Pop-Up Festival

# Quality Coach
/hub/qc/dashboard                      # 10-15 docentes asignados
/hub/qc/observations/new               # nueva observación (móvil-first)
/hub/qc/observations/[id]              # detalle + ciclo de mejora
/hub/qc/feedback/[id]                  # devolución 1:1 con firma
/hub/qc/community-of-practice          # gestión de encuentros
/hub/qc/supervision                    # supervisión Brain Up

# Directivo / Coord SEL
/hub/principal/dashboard               # estado institucional
/hub/principal/evs-report              # informe EVS
/hub/principal/alerts                  # alertas que requieren decisión
/hub/coord-sel/committee               # comité SEL interno
/hub/coord-sel/workbook                # workbook de integración

# Brain Up (Country Partner)
/hub/brainup/national                  # mapa nacional de colegios
/hub/brainup/early-warnings            # colegios sin actividad N semanas
/hub/brainup/qc-supervision            # supervisión semanal
/hub/brainup/reports                   # reportes trimestrales

# Six Seconds + MINEDUC
/hub/six-seconds/global                # datos agregados anonimizados
/hub/mineduc/system                    # cobertura geográfica + KPIs país
/hub/mineduc/policy-evidence           # evidencia para política pública
```

### Catálogos y constantes

- `BANDS`: 7 bandas etarias (inicial / primaria baja / media / preadolescencia / secundaria baja / media / bachillerato).
- `RUBRIC_INDICATORS`: indicadores conductuales por nivel 1-4 de cada dimensión.
- `EVS_DIMENSIONS`: las 4 dimensiones del clima escolar.
- `SIX_SECONDS_INSTRUMENTS`: SEI, SEI-YV, BBP, BTP, BDP, EVS.
- `CERTIFICATIONS`: EQE1/2/3 + UEQ + EQAC + BPC con horas requeridas.
- `CRISIS_KEYWORDS`: palabras que activan protocolo en el journal (multilingüe).

---

## 4. Plan de implementación por fases

Calcado del Capítulo 14 de la spec.

### MVP v1.0 — Ciclo del Quality Coach (núcleo operativo)

Lo mínimo viable para entregar el programa con tecnología real:

- **Models:** Institution, Cohort, QualityCoachAssignment, ClassroomObservation, FeedbackSession, CommunityOfPractice, SupervisionSession, EducationVitalSigns, EvsResponse, ImplementationPhase.
- **APIs:** `/api/qc/*` (observation/feedback/community/supervision), `/api/evs/*`, `/api/admin/institutions/*`.
- **Páginas:** dashboard QC, observation digital móvil, devolución 1:1 con firma, comunidad de práctica, dashboards diferenciados (docente / QC / director / Brain Up).
- **EVS:** aplicación digital + reporte agregado automatizado.
- **Cross-cutting:** rúbrica auto-calculable, signatures digitales, audit trail.

**Costo aproximado:** 6-8 semanas de desarrollo focalizado.

### v2.0 — Estudiante + Familia + Pedagogía

- **Models:** StudentJournal (encriptado), SelLesson, EmbeddedSelMapping, ParentCommunication, PopUpFestivalEvent, CertificationProgress.
- **APIs:** `/api/student/journal/*`, `/api/parents/*`, `/api/certifications/*`.
- **Páginas:** journal del estudiante (privacidad absoluta + crisis protocol), banco de lecciones por banda, repositorio SEL embebido, dashboards de familia, integración Pop-Up Festival.
- **Privacy:** encryption at rest del journal, crisis keyword detection con escalación inmediata, consent flow especial para menores (parental + assent).

**Costo aproximado:** 6-8 semanas adicionales.

### v3.0 — Inteligencia + Escala sistémica

- **AI Analytics:** análisis cualitativo asistido por LLM sobre los reportes del QC (qué temas se repiten en comunidades de práctica, qué casos complejos están escalando).
- **Predictive models:** machine learning para señales tempranas de problemas (caída sostenida en rúbrica, ausencia de check-in del estudiante, patrones de crisis en journal agregado).
- **Integración SIS:** sincronización con sistemas administrativos del colegio.
- **Certificaciones blockchain:** EQE1/2/3 emitidas como credenciales verificables.
- **Dashboards MINEDUC:** cobertura geográfica, KPIs por distrito, modelaje de costos de escalamiento.

**Costo aproximado:** 8-12 semanas adicionales + integración con servicios externos.

---

## 5. Decisiones de arquitectura pendientes

Estas son las decisiones que ROWIIA necesita tomar antes de empezar el MVP:

1. **Multi-tenancy:** ¿cada colegio es un `Tenant` separado o un grupo dentro de un Tenant del distrito/sistema? **Recomendado:** colegio = Tenant. El distrito y el MINEDUC se modelan vía `SuperHub` o un nuevo `EducationalSystem` que agrupa Tenants.
2. **SSO con colegios:** ¿conectamos con sistemas de identidad del MINEDUC ecuatoriano (Mineduc Online) o solo email/Google?
3. **App móvil:** el QC necesita app nativa móvil para observación en aula sin wifi. ¿PWA con offline-first o app nativa React Native?
4. **Crisis protocol:** ¿quién recibe el alert cuando el journal del estudiante dispara una crisis keyword? El DECE del colegio + escalación a 1800-… (línea de ayuda). Esto requiere acuerdo con Ministerio de Salud.
5. **Integración Six Seconds Assessments:** ¿API directa o aplicación nativa en ROWIIA? Six Seconds tiene su propio sistema de assessments — definir la línea entre lo que vive en su lado y lo que vive en ROWIIA.
6. **i18n:** ES default. ¿Lanzamos primero solo Ecuador (ES) y agregamos EN/PT/IT en v2? El producto ya está en 4 idiomas en la capa de Emotional Budgeting; mantener esa paridad.
7. **Datos del estudiante al graduarse:** export portable JSON del journal y SEI-YV evolutivo. ¿Formato propio o estándar abierto (e.g. JSON-LD de credenciales académicas)?
8. **Modelo de negocio del módulo Schools:** licencias institucionales anuales por colegio vs licencias sistémicas a gobiernos. ¿Pricing tiers?

---

## 6. Lo que esto NO es

Para evitar scope creep:

- **No es un LMS** (Moodle, Canvas, Google Classroom). No reemplaza la plataforma académica del colegio.
- **No es un SIS** (sistema de información estudiantil). No gestiona matrículas, notas, asistencia académica.
- **No es un sistema de salud mental clínico.** Detecta señales y escala, pero no diagnostica ni trata.
- **No es un sistema de evaluación de desempeño docente.** Los datos del QC NO se cruzan con la evaluación administrativa del docente — esa separación es crítica para la confianza.

---

## 7. Mapeo: roles ROWIIA actuales ↔ EmoPower Schools

| Rol ROWIIA hoy | Rol EmoPower equivalente | Lente / contexto |
|---|---|---|
| Personal (sin rol) | Estudiante | self only, journal privado |
| Coach (ServiceEngagement) | Quality Coach | client narrowing por assignment |
| Mentor | Mentor docente / mentor estudiante | igual |
| HR Manager | Coordinador SEL del colegio | tenant scope = colegio |
| Exec / GM | Director / Rector | tenant scope = colegio |
| Consultant | Brain Up consultor | service provider |
| Family | Familia del estudiante | gating estricto: estudiante decide |
| Research (founder/scientific_lead) | Six Seconds investigación global | sin cambio |
| Research (rowi_team) | Brain Up Ecuador / Country Partners | sin cambio |
| **(nuevo)** brainup_team | Equipo Brain Up Ecuador | nivel intermedio entre rowi_team y mineduc |
| **(nuevo)** school_admin | Director + Coordinador SEL del colegio | tenant scope = colegio |
| **(nuevo)** mineduc | Autoridad educativa (MINEDUC / distrito) | superhub scope = sistema |

---

## 8. Próximos pasos concretos

Para entrar al MVP del módulo Schools, ROWIIA necesita:

1. **Decisiones del Capítulo 5** de este documento (lista numerada).
2. **Aprobación del modelo de tenancy** (colegio = Tenant).
3. **Acuerdo con Six Seconds** sobre la línea de integración con sus assessments.
4. **Validación con Brain Up Ecuador** del flujo del QC tal como está digitalizado en este documento (que coincida con cómo opera hoy en papel).
5. **Compromiso de tiempo** del equipo de desarrollo: el MVP requiere 6-8 semanas con foco. Si se hace en paralelo con Emotional Budgeting, sumar 50%.

Hasta que esas 5 piezas estén resueltas, el trabajo de implementación queda en pausa pero el documento queda como source of truth para que cualquier conversación de stakeholders (Six Seconds, Brain Up, colegios piloto, MINEDUC, equipo dev) hable el mismo lenguaje.

---

## 9. Rowi Education — Educación Superior (universidades, pre/post grado)

EmoPower Schools cubre K-12 (inicial → bachillerato). El frente de Higher
Ed es una extensión natural con foco distinto: ya no formar al niño, sino
**preparar al joven adulto para su inserción laboral** y al profesional en
formación para los desafíos emocionales de su carrera.

### Diferencias clave vs K-12

| Eje | K-12 (EmoPower Schools) | Higher Ed (Rowi Education) |
|---|---|---|
| Edad | 3-18 años | 18-35+ años |
| Instrumento Vital Signs | EVS institucional + SEI-YV | **LVS** (Leadership Vital Signs) + SEI + BBP |
| Foco | desarrollo emocional, clima escolar | inserción laboral, employability, liderazgo |
| Modelo familiar | familia activa + consent parental | familia con visibilidad opcional (mayores de edad) |
| Quality Coach | DECE de la institución | Coordinador de Carrera + Bienestar Universitario |
| Certificaciones | EQE1/2/3 docentes | EQE1/2/3 + UEQ profesores; **employability certificate** estudiantes |
| Output del estudiante | journal + check-in semanal | journal + portafolio profesional + perfil empleabilidad |

### Casos de uso específicos

- **Pre-grado**: usar LVS para mapear las competencias de liderazgo del
  estudiante a lo largo de la carrera. Comparativos Año 1 vs Año Final.
  Plan de desarrollo individual conectado con el syllabus de cada
  programa.
- **Post-grado (MBA, maestrías profesionales)**: SEI + BBP en cohortes
  ejecutivas. Debriefs grupales con LVS aplicado a casos reales del
  estudiante. Integración con bolsas de empleo del programa.
- **Vinculación con empresas**: el estudiante puede compartir su perfil
  LVS/SEI (con consent explícito) con empresas que buscan talento. ROWIIA
  se convierte en infraestructura del proceso de contratación con
  evidencia emocional, no solo CV.
- **Formación técnica y tecnológica**: focos específicos en autonomía,
  resiliencia y trabajo en equipo — competencias críticas en oficios y
  carreras técnicas.

### Reutilización con K-12

Todo el ciclo del Quality Coach (observación → devolución → comunidad →
supervisión) aplica con adaptación: en Higher Ed el "QC" es Coordinador
de Carrera, los "docentes" son profesores titulares, las "clases" son
seminarios o ateneos. La rúbrica de aula necesita ajustes (apertura
emocional + conexión + transferencia siguen siendo válidas, pero los
indicadores conductuales se calibran para adultos).

### Modelos Prisma adicionales para Higher Ed

```
EducationalProgram             // carrera / programa
  id, institutionId, name, level (preGrade/postGrade/technical),
  durationYears, language

StudentEnrollment              // matrícula del estudiante en un programa
  id, studentUserId, programId, cohortYear, status (active/graduated/dropped),
  expectedGraduation

EmployabilityProfile           // perfil de empleabilidad del estudiante
  id, studentUserId, lvsScore (json), seiScore (json), bbpScore (json),
  portfolioItems (json), preferredSectors[], visibleToEmployers (bool)

EmployerEngagement             // empresa vinculada al programa
  id, programId, companyName, contactEmail, contactName,
  rolesPosted (json), accessLevel (browse/contact/full)
```

### MVP de Higher Ed (sumar al MVP de Schools)

Si Higher Ed entra como módulo paralelo al MVP K-12, el incremento es:
- LVS digital adaptado a contexto universitario.
- Dashboards de Coordinador de Carrera (espejo del QC).
- EmployabilityProfile básico (sin marketplace de empresas todavía).
- Comparativos Año 1 vs Año Final.

**Costo extra estimado:** 3-4 semanas si se hace en paralelo con K-12.

---

## 10. Rowi Student — sub-hub del estudiante (todas las edades)

Rowi Student es un **hub diferenciado** dentro del mismo Rowiverse para
todo lo que toca al estudiante directamente, sin importar si está en
K-12 o Higher Ed. Es donde el estudiante vive su experiencia personal y
donde su familia puede acompañarlo (con consent del estudiante).

### Principios

- **Multi-hub con un solo Rowiverse**: el estudiante puede estar a la vez
  en /hub/student (su espacio) y en /hub (espacio adulto si tiene rol
  laboral). Su data no se duplica. Modelos compartidos.
- **Privacidad absoluta del journal**: el colegio / la universidad NO ven
  el journal. Solo el estudiante. La familia ve **lo que el estudiante
  decida compartir** (no acceso por default, ni siquiera para menores —
  el colegio sí puede notificar a familia pero el contenido es del
  estudiante).
- **Crisis protocol con escalación**: keyword detection → DECE/Bienestar
  Universitario → línea de ayuda nacional (1800-XXXXXX en EC). Esto NO
  rompe privacidad; solo escala la señal, no el contenido.
- **Padres en multi-hub**: la familia tiene su propio espacio en /hub
  (que ya existe — `/hub/family/vital-signs`) y desde ahí puede
  ver lo que el estudiante le comparte. Si el estudiante decide
  compartir su evolución SEI-YV con su madre, esa data aparece en el
  dashboard de la madre. Si no, no aparece. Estudiante decide.

### Páginas del sub-hub /hub/student

```
/hub/student                          # home del estudiante
/hub/student/journal                  # diario privado (encriptado)
/hub/student/tools                    # herramientas SEL según banda
/hub/student/vital-signs              # SEI-YV / SEI propio Ola 1 vs 3
/hub/student/contact                  # contactar DECE / Bienestar
/hub/student/popup-festival           # eventos globales
/hub/student/sharing                  # control granular de qué comparte
                                      # con familia, tutor, etc.
```

### Cómo conviven con los hubs existentes

| Estudiante | Estudiante adulto trabajando |
|---|---|
| /hub/student/* | /hub/* (todo lo de ROWIIA adulto disponible) |
| Familia ve solo lo compartido | Empresa ve solo lo de su tenant |

El usuario alterna contextos con el mismo `AccountContextChip` que ya
existe (cookie `rowi_active_context`). Esto está soportado por el modelo
multi-hat (ver `docs/CONTEXTS_MODEL.md`).

---

## 11. Convención i18n: ES no se regionaliza

**Decisión Eduardo, 2026-05-21**: el español en ROWIIA es **uno solo**.
No hay `es-EC`, `es-CO`, `es-MX`, `es-ES`. Un único `es.json` que sirve
a todo el ecosistema hispanohablante.

Razones:
- Mantener 4 locales (es / en / pt / it) es manejable. Multiplicar el
  español por 20+ variantes regionales sería inmanejable.
- Las diferencias regionales son léxicas (computadora vs ordenador) y se
  resuelven con elección de vocabulario neutro.
- Cuando un término regional es necesario (ej. "DECE" en Ecuador), se
  documenta como término del programa, no como variante de idioma.

Si en el futuro Ecuador, México o Colombia requieren versiones legales
distintas (consentimientos según LOPD local), se maneja **dentro del
mismo `es.json`** con keys condicionadas por `Tenant.country`, no con
locales separados.

Catálogo final de idiomas:
- `es` — español (todas las regiones)
- `en` — inglés (todas las regiones)
- `pt` — portugués (Brasil + Portugal)
- `it` — italiano

Roadmap futuro (sin urgencia):
- `zh` — chino (entrada a China, requiere PIPL compliance)
- `ar` — árabe (Medio Oriente, RTL)
- `fr` — francés (Europa + África francófona)
- `de` — alemán (DACH)
- `ja` — japonés

