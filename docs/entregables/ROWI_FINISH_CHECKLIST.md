# ROWI — AUDITORÍA DE TERMINADO (FINISH)

## Regla maestra

No construir nada nuevo. Esta auditoría no autoriza módulos, productos, verticales, agentes IA, Education, EmoPower, Marketplace ni nuevas áreas de navegación.

El objetivo es evaluar si el loop principal funciona de punta a punta y queda medido:

```text
MÍRATE
↓
ELÍGETE
↓
ACCIONA
↓
ENTRÉGATE
↓
IMPACTA
```

## Veredicto de estado actual

**ROWI no está en FINISH todavía.** El repositorio tiene piezas importantes implementadas, pero el estado actual debe tratarse como **producto auditable, no producto terminado**.

La razón principal no es que falten más features; es que faltan pruebas operativas, medición completa y evidencia real de producción en el loop que crea el moat.

## North Star de auditoría

La auditoría no debe optimizar por usuarios, páginas vistas, descargas ni chats IA.

La auditoría debe medir, en este orden:

1. **Díadas activas**
2. **Outcomes registrados**
3. **D7 / D30 de usuarios con díada**
4. **Conversión Pre-SEI → Registro → Today → Invitación → ECO → Outcome**

Moat a validar:

```text
QUIÉN ERES
↓
QUÉ HICISTE
↓
QUÉ OCURRIÓ
```

---

## Cómo auditar Rowi ahora

Para cada punto, clasificar con uno de estos estados:

- **Verde:** existe en código, funciona en producción y tiene métrica.
- **Amarillo:** existe en código, pero falta prueba E2E, métrica o configuración productiva.
- **Rojo:** no existe, no está conectado o no se puede verificar.
- **Negro:** debe congelarse porque distrae del loop principal.

La auditoría debe producir evidencia, no opiniones: captura de pantalla, evento analytics, registro de base de datos, email recibido, log de Sentry, cohorte PostHog, transacción Stripe o resultado E2E.

---

## Fase 1 — Infraestructura crítica

### Email productivo — Estado esperado: Amarillo hasta demostrar deliverability

Auditar:

- Registro.
- Verificación de cuenta.
- Forgot Password.
- Invitación de Afinidad.
- Invitación de Workspace.
- Notificaciones ECO.
- SPF, DKIM, DMARC, Resend y dominio `rowiia.com`.

Criterio de FINISH:

- 20 correos reales enviados a Gmail, Outlook y dominio corporativo.
- 95% o más llegan a inbox.
- 0 flujos críticos dependen de copiar links manualmente.

### DNS / SSL — Estado esperado: Amarillo hasta verificación externa

Auditar:

- Dominio principal.
- `www`.
- Subdominios usados por producto.
- DNS de Resend.
- Certificados SSL.

Criterio de FINISH:

- Resolución limpia desde al menos dos redes externas.
- SSL válido para dominio principal y `www`.
- No hay warnings del proveedor de email.

### Push notifications — Estado esperado: Amarillo

El schema contiene suscripciones push y preferencias de notificación, pero la auditoría debe comprobar navegador real, permisos, VAPID y envío del recordatorio diario.

Criterio de FINISH:

- Usuario acepta permiso.
- Se guarda la suscripción.
- Llega recordatorio diario.
- El click abre Today.

### Sentry — Estado esperado: Amarillo

El código ya tiene inicialización server/edge/client y carga de source maps condicionada a variables de entorno. Falta confirmar DSN productivo, evento real, sourcemap y alerta.

Criterio de FINISH:

- Error frontend capturado.
- Error backend/API capturado.
- Stack trace legible.
- Alerta recibida por el equipo.

### PostHog / Product analytics — Estado esperado: Rojo o no verificable en código

No debe considerarse terminado hasta que existan eventos mínimos de funnel y retención visibles en un dashboard diario.

Criterio de FINISH:

- Evento por cada paso del loop.
- Dashboard CEO diario.
- Cohortes D1, D7 y D30.
- Segmentación por usuario con díada vs. sin díada.

---

## Fase 2 — Loop MÍRATE

### Pre-SEI — Estado esperado: Amarillo

Existe modelo persistente para `PreSeiSession` con token, respuestas, resultado y `claimedByUserId`. La auditoría debe demostrar que nunca se pierde el resultado durante registro/login.

Auditar:

- Inicio.
- Preguntas.
- Resultado.
- Persistencia.
- Claim a cuenta creada.

Criterio de FINISH:

- 10 usuarios nuevos completan Pre-SEI.
- 10/10 conservan resultado después de registro.
- 10/10 ven ese resultado desde perfil/Today.

### Registro / login — Estado esperado: Amarillo

Auditar:

- Email.
- Google.
- Login existente.
- Transferencia `preSeiToken` → cuenta.

Criterio de FINISH:

- No hay cuentas duplicadas por el mismo email.
- El claim del Pre-SEI ocurre una sola vez.
- El usuario aterriza en Today, no en una ruta secundaria.

### Perfil personal — Estado esperado: Amarillo

Auditar:

- Mirror.
- Drivers.
- Strengths.
- Growth Areas.
- Comprensión por usuario nuevo.

Criterio de FINISH:

- 8/10 usuarios pueden explicar en una frase quién son hoy y qué practicar.

---

## Fase 3 — Loop ELÍGETE / ACCIONA

### Today — Estado esperado: Amarillo

Today debe ser la casa principal y no competir con otras rutas.

Auditar:

- Intención.
- Práctica.
- Reflexión.
- Cierre del día.
- Navegación post-login.

Criterio de FINISH:

- 80% de nuevos usuarios entiende qué hacer en menos de 30 segundos.
- Evento `today_completed` existe y alimenta retención.

### Daily Practice / Reflexión / Becoming — Estado esperado: Amarillo

Auditar:

- Selección de práctica.
- Guardado.
- Finalización.
- Journal.
- Historial.
- Memoria y evolución.

Criterio de FINISH:

- Usuario ve progreso real, no solo pantallas bonitas.
- Becoming muestra memoria del viaje y no compite con Today.

---

## Fase 4 — Loop ENTRÉGATE

### Invitaciones — Estado esperado: Amarillo

El schema tiene `RelationshipInvite` con token, status, opened/accepted y deep link. La auditoría debe confirmar envío real, aceptación y claim.

Auditar:

- Email enviado.
- Link `/r/[token]` abierto.
- Estado `opened`.
- Aceptación.
- Conexión de dos personas.

Criterio de FINISH:

- 20 invitaciones reales.
- 10 aceptadas.
- 0 links rotos.

### Afinidad / Brecha — Estado esperado: Amarillo

El schema tiene `RelationshipDyad` y cache de brecha (`lastGapSummary`, `lastGapAt`). La auditoría debe validar cálculo, explicación y acción derivada.

Criterio de FINISH:

- El usuario entiende la diferencia relacional.
- La brecha alimenta ECO.
- La brecha no se presenta como veredicto de compatibilidad.

### ECO — Estado esperado: Amarillo

El schema tiene hilos y mensajes ECO por díada, incluyendo `gapUsed`, `ecoLevel` y texto generado. La auditoría debe demostrar que ECO usa contexto real y no responde como chatbot genérico.

Auditar:

- Generación de mensaje.
- Contexto real.
- `dyadId`.
- Brecha aplicada.
- Registro de envío.

Criterio de FINISH:

- 30 mensajes ECO generados con dyadId real.
- 20 enviados.
- 15 con outcome posterior.

### Outcome — Estado esperado: Amarillo / Rojo según evidencia productiva

El schema tiene tracking de outcomes en áreas generales, pero la auditoría debe confirmar el outcome específico de ECO: funcionó, no funcionó o parcialmente.

Criterio de FINISH:

- Cada ECO enviado genera follow-up.
- El outcome queda guardado y consultable.
- El dataset permite aprender perfil → brecha → mensaje → outcome.

---

## Fase 5 — Loop IMPACTA

### SEI completo / Checkout — Estado esperado: Amarillo

Auditar:

- Compra.
- Webhook.
- Verificación checkout.
- Acceso posterior.
- Resultado completo.

Criterio de FINISH:

- 5 pagos reales o modo live controlado.
- 0 accesos otorgados sin pago válido.
- 0 pagos sin acceso.

### Workspaces — Estado esperado: Amarillo

Existen rutas API para workspaces, miembros, invitaciones, stats, campañas, CSV y acceso cliente. La auditoría debe validar permisos reales y flujo mínimo de equipo.

Criterio de FINISH:

- Crear workspace.
- Invitar miembro.
- Aceptar miembro.
- Validar permisos por rol.
- Ver stats básicas.

### Vital Signs / Consultant — Estado esperado: Amarillo

Auditar:

- Upload.
- Visualización.
- Benchmark.
- Reportes.
- Propuesta consultor.
- Onboarding comercial.

Criterio de FINISH:

- 1 consultor puede vender y entregar un piloto sin ayuda del equipo técnico.

---

## Fase 6 — Data moat / Research layer

### Dataset longitudinal — Estado esperado: Amarillo

Auditar que cada usuario pueda conectar:

- Quién era.
- Qué eligió.
- Qué hizo.
- Qué dijo.
- Qué ocurrió.

Criterio de FINISH:

- La base permite reconstruir el viaje completo de una díada sin depender de notas manuales.

### Consentimiento / anonimización / auditoría — Estado esperado: Amarillo

El schema incluye niveles de acceso de investigación, consentimientos y auditoría de acceso. La auditoría debe comprobar experiencia de consentimiento, revocación y logs.

Criterio de FINISH:

- Consentimiento apagado por defecto.
- Revocación funciona.
- Todo acceso research queda auditado.
- Texto ECO privado no se contribuye al dataset anónimo.

---

## Fase 7 — Dashboard CEO

Debe existir un dashboard diario con:

- Activación: Pre-SEI → Registro.
- Conversión: Registro → Today.
- Retención: D1, D7, D30.
- Relación: invitaciones enviadas.
- Afinidad: díadas activas.
- ECO: mensajes enviados.
- Outcomes: outcomes registrados.
- Revenue: SEI vendidos.
- Coaches: activos semanalmente.

Criterio de FINISH:

- Eduardo puede abrir un solo dashboard cada mañana y saber si Rowi está ganando o perdiendo.

---

## Fase 8 — Comercial

### Pricing — Estado esperado: Amarillo

Auditar claridad de:

- Free.
- SEI.
- Consultant.
- Workspace.

Criterio de FINISH:

- Usuario entiende qué es gratis y qué se paga.
- Coach entiende qué vender mañana.
- No hay ambigüedad entre app, consultoría y workspace.

### Pilotos — Estado esperado: Rojo hasta evidencia real

Criterio de FINISH:

- 10 coaches activos.
- Luego 25 coaches activos.
- 100 usuarios reales.
- 50 díadas activas.
- 100 outcomes registrados.

---

## E2E obligatorios antes de declarar FINISH

Ejecutar y grabar evidencia de:

1. Pre-SEI → Registro → Today.
2. Invitación → Afinidad → Brecha.
3. Brecha → ECO → Mensaje.
4. Mensaje → Outcome.
5. Checkout → Pago → Acceso.
6. Workspace → Invitación → Miembro activo.
7. Consultant → Upload → Reporte → Propuesta.

Cada E2E debe terminar con:

- ID de usuario.
- ID de díada si aplica.
- Evento analytics.
- Registro en base de datos.
- Screenshot o video corto.
- Resultado esperado / resultado observado.

---

## Lista final de decisión FINISH

Rowi solo está terminado cuando todo esto sea verdadero:

- [ ] Email funcionando en producción.
- [ ] DNS funcionando sin warnings.
- [ ] Sentry captura errores reales.
- [ ] PostHog o analytics equivalente mide funnel y retención.
- [ ] Push abre Today.
- [ ] Pre-SEI persiste y se reclama en cuenta.
- [ ] Today guía intención, práctica y reflexión.
- [ ] Becoming muestra memoria real.
- [ ] Invitaciones conectan dos personas.
- [ ] Afinidad muestra brecha entendible.
- [ ] ECO usa dyadId y contexto real.
- [ ] Outcome se guarda después de ECO.
- [ ] Checkout otorga acceso correctamente.
- [ ] Consultant es vendible por un coach.
- [ ] Dashboard CEO existe.
- [ ] E2E core pasan en producción.
- [ ] 10 coaches activos.
- [ ] 100 usuarios reales.
- [ ] 50 díadas activas.
- [ ] 100 outcomes registrados.
- [ ] D7 medible.
- [ ] D30 medible.

## Qué hacer ahora

1. No construir nuevas áreas.
2. Auditar producción con usuarios reales.
3. Instrumentar lo que no se pueda medir.
4. Corregir solo blockers del loop principal.
5. Congelar cualquier cosa que no aumente díadas activas u outcomes registrados.
