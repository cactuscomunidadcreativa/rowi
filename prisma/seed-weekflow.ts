// prisma/seed-weekflow.ts
// ============================================================
// ROWI - Seed de datos simulados para WeekFlow
// ============================================================
// Crea datos demo para el usuario eduardo.gonzalez@6seconds.org:
// - WeekFlowConfig para su comunidad Be2Grow
// - Sesión actual con mood checkins de miembros
// - Contribuciones en las 3 secciones (Show & Tell, To Discuss, Focus)
// - Tareas preseteadas incluyendo "Objetivo reconexión"
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getISOWeekData(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

function getWeekBounds(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  WEEKFLOW - SEED DE DATOS SIMULADOS");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. Encontrar al usuario Eduardo
  // ============================================================
  console.log("1. Buscando usuario eduardo.gonzalez@6seconds.org...");

  const eduardo = await prisma.user.findUnique({
    where: { email: "eduardo.gonzalez@6seconds.org" },
    select: { id: true, name: true, email: true, primaryTenantId: true, image: true },
  });

  if (!eduardo) {
    console.error("❌ Usuario eduardo.gonzalez@6seconds.org no encontrado");
    process.exit(1);
  }
  console.log(`   ✅ Eduardo encontrado: ${eduardo.id} (${eduardo.name})`);

  // ============================================================
  // 2. Encontrar su comunidad Be2Grow y sus miembros
  // ============================================================
  console.log("\n2. Buscando comunidad Be2Grow...");

  let community = await prisma.rowiCommunity.findFirst({
    where: {
      OR: [
        { slug: { contains: "be2grow", mode: "insensitive" } },
        { name: { contains: "Be2Grow", mode: "insensitive" } },
        { createdById: eduardo.id },
      ],
    },
    include: {
      members: {
        where: { status: "active" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!community) {
    // Si no tiene comunidad, buscar cualquier hub donde participe
    console.log("   ⚠️ No se encontró Be2Grow, buscando comunidades del usuario...");

    const userCommunities = await prisma.rowiCommunityUser.findMany({
      where: { userId: eduardo.id },
      include: {
        community: {
          include: {
            members: {
              where: { status: "active" },
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
      },
    });

    if (userCommunities.length > 0) {
      community = userCommunities[0].community;
    }
  }

  // Si no hay comunidad, crear una de demo
  if (!community) {
    console.log("   ⚠️ No se encontró comunidad, creando Be2Grow demo...");
    community = await prisma.rowiCommunity.create({
      data: {
        name: "Be2Grow",
        slug: "be2grow",
        description: "Comunidad de práctica para el crecimiento personal y la inteligencia emocional",
        type: "coaching",
        visibility: "private",
        createdById: eduardo.id,
        tenantId: eduardo.primaryTenantId,
        language: "es",
      },
      include: {
        members: {
          where: { status: "active" },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    // Agregar a Eduardo como owner
    await prisma.rowiCommunityUser.create({
      data: {
        userId: eduardo.id,
        communityId: community.id,
        name: eduardo.name,
        email: eduardo.email,
        role: "owner",
        status: "active",
      },
    });
  }
  console.log(`   ✅ Comunidad: ${community.name} (${community.id})`);
  console.log(`   👥 Miembros actuales: ${community.members.length}`);

  // Obtener el Hub ID real (WeekFlowConfig tiene FK a Hub, no a RowiCommunity)
  // La comunidad puede tener un hubId, o buscamos el hub del tenant
  let hubId = community.hubId;
  if (!hubId) {
    const hub = await prisma.hub.findFirst({
      where: { tenantId: eduardo.primaryTenantId },
      select: { id: true },
    });
    hubId = hub?.id || null;
  }
  if (!hubId) {
    console.error("❌ No se encontró Hub para crear WeekFlowConfig");
    process.exit(1);
  }
  console.log(`   🔗 Hub ID para config: ${hubId}`);

  // ============================================================
  // 3. Crear miembros simulados si la comunidad tiene pocos
  // ============================================================
  console.log("\n3. Configurando miembros simulados...");

  // Datos de miembros simulados (nombres latinos)
  const simulatedMembers = [
    { name: "Valentina Rodríguez", email: "valentina.rodriguez@example.com" },
    { name: "Santiago Herrera", email: "santiago.herrera@example.com" },
    { name: "Camila Fernández", email: "camila.fernandez@example.com" },
    { name: "Mateo López", email: "mateo.lopez@example.com" },
    { name: "Isabella García", email: "isabella.garcia@example.com" },
  ];

  // Crear usuarios simulados si no existen
  const memberUserIds: string[] = [eduardo.id];

  for (const member of simulatedMembers) {
    let user = await prisma.user.findUnique({
      where: { email: member.email },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: member.email,
          name: member.name,
          primaryTenantId: eduardo.primaryTenantId,
        },
        select: { id: true },
      });
      console.log(`   ✅ Usuario creado: ${member.name}`);
    } else {
      console.log(`   ✔️ Usuario existente: ${member.name}`);
    }

    memberUserIds.push(user.id);

    // Agregar a la comunidad si no está
    const existingMember = await prisma.rowiCommunityUser.findFirst({
      where: { userId: user.id, communityId: community.id },
    });

    if (!existingMember) {
      await prisma.rowiCommunityUser.create({
        data: {
          userId: user.id,
          communityId: community.id,
          name: member.name,
          email: member.email,
          role: "member",
          status: "active",
          invitedById: eduardo.id,
        },
      });
      console.log(`   ✅ Agregado a comunidad: ${member.name}`);
    }
  }

  console.log(`   👥 Total miembros con acceso: ${memberUserIds.length}`);

  // ============================================================
  // 4. Crear o obtener WeekFlowConfig
  // ============================================================
  console.log("\n4. Configurando WeekFlow...");

  let config = await prisma.weekFlowConfig.findFirst({
    where: { hubId },
  });

  if (!config) {
    config = await prisma.weekFlowConfig.create({
      data: {
        hubId,
        tenantId: eduardo.primaryTenantId,
        name: `WeekFlow - ${community.name}`,
        enableShowTell: true,
        enableToDiscuss: true,
        enableFocus: true,
        enableTasks: true,
        enableMoodCheckin: true,
        requireMoodCheckin: true,
      },
    });
    console.log(`   ✅ Config creado: ${config.id}`);
  } else {
    console.log(`   ✔️ Config existente: ${config.id}`);
  }

  // ============================================================
  // 5. Crear sesión de la semana actual
  // ============================================================
  console.log("\n5. Creando sesión de la semana actual...");

  const now = new Date();
  const { weekNumber, year } = getISOWeekData(now);
  const { weekStart, weekEnd } = getWeekBounds(now);

  // Limpiar sesión existente para recrear datos frescos
  const existingSession = await prisma.weekFlowSession.findFirst({
    where: { configId: config.id, year, weekNumber },
  });

  if (existingSession) {
    // Borrar datos de la sesión existente para recrear
    await prisma.weekFlowMoodCheckin.deleteMany({ where: { sessionId: existingSession.id } });
    await prisma.weekFlowContribution.deleteMany({ where: { sessionId: existingSession.id } });
    await prisma.weekFlowSession.delete({ where: { id: existingSession.id } });
    console.log("   🔄 Sesión existente limpiada para recrear datos");
  }

  const session = await prisma.weekFlowSession.create({
    data: {
      configId: config.id,
      tenantId: config.tenantId,
      hubId: config.hubId,
      year,
      weekNumber,
      weekStart,
      weekEnd,
      status: "ACTIVE",
    },
  });
  console.log(`   ✅ Sesión creada: Semana ${weekNumber} del ${year} (${session.id})`);

  // ============================================================
  // 6. Crear mood check-ins para todos los miembros
  // ============================================================
  console.log("\n6. Creando mood check-ins...");

  const moodCheckins = [
    // Eduardo - Esperanza (de la Rueda de Sentimientos)
    {
      userId: memberUserIds[0],
      emotion: "ESPERANZA",
      intensity: 7,
      note: "Esta semana siento muchas ganas de reconectar con personas clave. El proyecto va tomando forma.",
    },
    // Valentina - Alegría
    {
      userId: memberUserIds[1],
      emotion: "ENTUSIASMO",
      intensity: 8,
      note: "Cerré un proyecto importante la semana pasada, me siento llena de energía.",
    },
    // Santiago - Curiosidad
    {
      userId: memberUserIds[2],
      emotion: "CURIOSIDAD",
      intensity: 6,
      note: "Explorando nuevas metodologías de coaching, me tiene muy enganchado.",
    },
    // Camila - Tranquilidad
    {
      userId: memberUserIds[3],
      emotion: "SERENIDAD",
      intensity: 7,
      note: "Logré organizar mi agenda y por fin siento que tengo espacio para pensar.",
    },
    // Mateo - Ansiedad (vulnerable)
    {
      userId: memberUserIds[4],
      emotion: "ANSIEDAD",
      intensity: 6,
      note: "Tengo una presentación importante el viernes y no me siento del todo preparado.",
    },
    // Isabella - Confianza
    {
      userId: memberUserIds[5],
      emotion: "CONFIANZA",
      intensity: 8,
      note: "Los resultados del último trimestre me dan seguridad de que vamos por buen camino.",
    },
  ];

  for (const checkin of moodCheckins) {
    await prisma.weekFlowMoodCheckin.create({
      data: {
        sessionId: session.id,
        userId: checkin.userId,
        emotion: checkin.emotion,
        intensity: checkin.intensity,
        note: checkin.note,
      },
    });
    console.log(`   ✅ Check-in: ${checkin.emotion} (intensidad ${checkin.intensity})`);
  }

  // ============================================================
  // 7. Crear contribuciones (Show & Tell, To Discuss, Focus)
  // ============================================================
  console.log("\n7. Creando contribuciones...");

  // -- SHOW & TELL --
  const showTellItems = [
    {
      userId: memberUserIds[0], // Eduardo
      content: "Completé el diseño del programa de reconexión PRO. Ya tenemos el framework de 6 sesiones listo para pilotear.",
      order: 0,
    },
    {
      userId: memberUserIds[1], // Valentina
      content: "Lancé la encuesta de clima emocional en mi equipo. Participación del 85% en las primeras 24 horas.",
      order: 1,
    },
    {
      userId: memberUserIds[2], // Santiago
      content: "Terminé la certificación de facilitador en EQ. Ya puedo dar talleres oficiales de Six Seconds.",
      order: 2,
    },
    {
      userId: memberUserIds[5], // Isabella
      content: "Publiqué un artículo sobre inteligencia emocional en el blog corporativo. Ya tiene 2.3k views.",
      order: 3,
    },
  ];

  for (const item of showTellItems) {
    await prisma.weekFlowContribution.create({
      data: {
        sessionId: session.id,
        userId: item.userId,
        type: "SHOW_TELL",
        content: item.content,
        order: item.order,
        status: "ACTIVE",
      },
    });
  }
  console.log(`   ✅ Show & Tell: ${showTellItems.length} contribuciones`);

  // -- TO DISCUSS --
  const toDiscussItems = [
    {
      userId: memberUserIds[0], // Eduardo
      content: "¿Cómo podemos medir el impacto emocional de las sesiones de reconexión PRO? Necesito métricas tangibles.",
      order: 0,
    },
    {
      userId: memberUserIds[3], // Camila
      content: "Propongo crear un sistema de 'buddy pairs' para accountability semanal. ¿Les parece?",
      order: 1,
    },
    {
      userId: memberUserIds[4], // Mateo
      content: "¿Alguien tiene experiencia con facilitación virtual de grupos grandes (+50 personas)? Tengo un reto la próxima semana.",
      order: 2,
    },
  ];

  for (const item of toDiscussItems) {
    await prisma.weekFlowContribution.create({
      data: {
        sessionId: session.id,
        userId: item.userId,
        type: "TO_DISCUSS",
        content: item.content,
        order: item.order,
        status: "ACTIVE",
      },
    });
  }
  console.log(`   ✅ Para Discutir: ${toDiscussItems.length} contribuciones`);

  // -- FOCUS --
  const focusItems = [
    {
      userId: memberUserIds[0], // Eduardo
      content: "Objetivo reconexión: hacer 3 llamadas de reconexión con PRO para esta semana",
      order: 0,
      isTask: true,
      priority: "HIGH" as const,
      dueDate: weekEnd,
    },
    {
      userId: memberUserIds[0], // Eduardo
      content: "Revisar y dar feedback al plan de talleres Q2",
      order: 1,
      isTask: true,
      priority: "MEDIUM" as const,
      dueDate: weekEnd,
    },
    {
      userId: memberUserIds[1], // Valentina
      content: "Analizar resultados de la encuesta de clima emocional y preparar presentación",
      order: 2,
      isTask: true,
      priority: "HIGH" as const,
      dueDate: weekEnd,
    },
    {
      userId: memberUserIds[2], // Santiago
      content: "Diseñar el taller piloto de EQ para líderes de operaciones",
      order: 3,
      isTask: true,
      priority: "MEDIUM" as const,
      dueDate: weekEnd,
    },
    {
      userId: memberUserIds[3], // Camila
      content: "Implementar el sistema de buddy pairs — crear documento y proponerlo al equipo",
      order: 4,
      isTask: true,
      priority: "MEDIUM" as const,
      dueDate: weekEnd,
    },
    {
      userId: memberUserIds[4], // Mateo
      content: "Preparar la presentación del viernes con estructura de storytelling emocional",
      order: 5,
      isTask: true,
      priority: "URGENT" as const,
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
    },
    {
      userId: memberUserIds[5], // Isabella
      content: "Contactar a 5 líderes para el programa de mentoría en EQ",
      order: 6,
      isTask: true,
      priority: "MEDIUM" as const,
      dueDate: weekEnd,
    },
  ];

  for (const item of focusItems) {
    await prisma.weekFlowContribution.create({
      data: {
        sessionId: session.id,
        userId: item.userId,
        type: "FOCUS",
        content: item.content,
        order: item.order,
        status: "ACTIVE",
        isTask: item.isTask,
        priority: item.priority,
        dueDate: item.dueDate,
        // Marcar algunos como completados
        isCompleted: false,
      },
    });
  }
  console.log(`   ✅ Mi Foco: ${focusItems.length} contribuciones`);

  // ============================================================
  // 8. Crear RowiTasks preseteados para Eduardo
  // ============================================================
  console.log("\n8. Creando tareas preseteadas para Eduardo...");

  const eduardoTasks = [
    {
      title: "Objetivo reconexión: hacer 3 llamadas de reconexión con PRO para esta semana",
      description: "Reconectar con profesionales clave del programa PRO. Agendar y realizar al menos 3 llamadas de seguimiento para fortalecer la relación y explorar oportunidades de colaboración.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      dueDate: weekEnd,
      category: "Reconexión",
      tags: ["PRO", "reconexión", "networking"],
      sourceType: "weekflow",
      emotionAtCreation: "ESPERANZA",
      visibility: "TEAM" as const,
    },
    {
      title: "Revisar plan de talleres Q2 y dar feedback a Valentina",
      description: "Revisar el documento de planificación de talleres para el segundo trimestre. Dar feedback constructivo y asegurar alineación con objetivos estratégicos.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
      category: "Planificación",
      tags: ["talleres", "Q2", "feedback"],
      sourceType: "weekflow",
      emotionAtCreation: "ESPERANZA",
      visibility: "TEAM" as const,
    },
    {
      title: "Preparar agenda del próximo WeekFlow",
      description: "Definir temas clave para la próxima sesión de WeekFlow incluyendo: seguimiento de reconexión PRO, revisión de métricas de impacto, y planificación del mes.",
      status: "TODO" as const,
      priority: "LOW" as const,
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
      category: "WeekFlow",
      tags: ["agenda", "planificación"],
      sourceType: "manual",
      emotionAtCreation: "SERENIDAD",
      visibility: "PRIVATE" as const,
    },
    {
      title: "Grabar video testimonial sobre el impacto del EQ en liderazgo",
      description: "Crear un video corto (3-5 min) compartiendo experiencia personal con inteligencia emocional y cómo ha impactado mi estilo de liderazgo.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      category: "Contenido",
      tags: ["video", "EQ", "liderazgo"],
      sourceType: "manual",
      emotionAtCreation: "ENTUSIASMO",
      visibility: "TEAM" as const,
    },
    {
      title: "Llamada completada con Ana Martínez (PRO)",
      description: "Excelente conversación sobre nuevas oportunidades de colaboración en LATAM. Quedamos en agendar un taller conjunto.",
      status: "DONE" as const,
      priority: "HIGH" as const,
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      category: "Reconexión",
      tags: ["PRO", "reconexión", "LATAM"],
      sourceType: "weekflow",
      emotionAtCreation: "ESPERANZA",
      emotionAtCompletion: "ALEGRÍA",
      visibility: "TEAM" as const,
    },
    {
      title: "Actualizar perfil y bio en la plataforma Rowi",
      description: "Revisar y actualizar la información del perfil, agregar foto reciente y actualizar la biografía profesional.",
      status: "DONE" as const,
      priority: "LOW" as const,
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      category: "Administración",
      tags: ["perfil", "plataforma"],
      sourceType: "manual",
      emotionAtCreation: "SERENIDAD",
      emotionAtCompletion: "SATISFACCIÓN",
      visibility: "PRIVATE" as const,
    },
  ];

  // Limpiar tareas existentes de weekflow para Eduardo
  await prisma.rowiTask.deleteMany({
    where: {
      userId: eduardo.id,
      sourceType: { in: ["weekflow", "manual"] },
      category: { in: ["Reconexión", "Planificación", "WeekFlow", "Contenido", "Administración"] },
    },
  });

  for (const task of eduardoTasks) {
    await prisma.rowiTask.create({
      data: {
        userId: eduardo.id,
        tenantId: eduardo.primaryTenantId,
        hubId: hubId!,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        category: task.category,
        tags: task.tags,
        sourceType: task.sourceType,
        weekFlowSessionId: session.id,
        emotionAtCreation: task.emotionAtCreation,
        emotionAtCompletion: task.emotionAtCompletion,
        visibility: task.visibility,
      },
    });
    console.log(`   ✅ Tarea: ${task.title.substring(0, 50)}...`);
  }

  // ============================================================
  // 9. Crear también una sesión anterior (semana pasada) para historial
  // ============================================================
  console.log("\n9. Creando sesión de la semana pasada para historial...");

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekData = getISOWeekData(lastWeek);
  const lastWeekBounds = getWeekBounds(lastWeek);

  // Limpiar sesión anterior si existe
  const existingLastWeek = await prisma.weekFlowSession.findFirst({
    where: { configId: config.id, year: lastWeekData.year, weekNumber: lastWeekData.weekNumber },
  });
  if (existingLastWeek) {
    await prisma.weekFlowMoodCheckin.deleteMany({ where: { sessionId: existingLastWeek.id } });
    await prisma.weekFlowContribution.deleteMany({ where: { sessionId: existingLastWeek.id } });
    await prisma.weekFlowSession.delete({ where: { id: existingLastWeek.id } });
  }

  const lastWeekSession = await prisma.weekFlowSession.create({
    data: {
      configId: config.id,
      tenantId: config.tenantId,
      hubId: config.hubId,
      year: lastWeekData.year,
      weekNumber: lastWeekData.weekNumber,
      weekStart: lastWeekBounds.weekStart,
      weekEnd: lastWeekBounds.weekEnd,
      status: "COMPLETED",
      summary: "Semana productiva con enfoque en planificación Q2. El equipo mostró alta energía y compromiso. Se destacó la colaboración entre Santiago e Isabella para el programa de mentoría.",
    },
  });

  // Checkins de la semana pasada
  const lastWeekCheckins = [
    { userId: memberUserIds[0], emotion: "DETERMINACIÓN", intensity: 8, note: "Arrancamos Q2 con todo." },
    { userId: memberUserIds[1], emotion: "ALEGRÍA", intensity: 9, note: "¡Resultados increíbles en la encuesta!" },
    { userId: memberUserIds[2], emotion: "ORGULLO", intensity: 7, note: "Completé mi certificación." },
    { userId: memberUserIds[3], emotion: "OPTIMISMO", intensity: 7, note: "La organización de la agenda fue un éxito." },
    { userId: memberUserIds[5], emotion: "GRATITUD", intensity: 8, note: "El equipo me apoyó mucho esta semana." },
  ];

  for (const checkin of lastWeekCheckins) {
    await prisma.weekFlowMoodCheckin.create({
      data: {
        sessionId: lastWeekSession.id,
        userId: checkin.userId,
        emotion: checkin.emotion,
        intensity: checkin.intensity,
        note: checkin.note,
      },
    });
  }

  // Contribuciones de la semana pasada (algunas completadas)
  const lastWeekContribs = [
    { userId: memberUserIds[0], type: "SHOW_TELL" as const, content: "Definí el framework de reconexión PRO con 6 etapas.", isCompleted: true },
    { userId: memberUserIds[1], type: "SHOW_TELL" as const, content: "Diseñé la encuesta de clima emocional.", isCompleted: true },
    { userId: memberUserIds[0], type: "FOCUS" as const, content: "Contactar al equipo de PRO para validar el framework", isTask: true, isCompleted: true },
    { userId: memberUserIds[2], type: "FOCUS" as const, content: "Estudiar para el examen final de certificación EQ", isTask: true, isCompleted: true },
    { userId: memberUserIds[3], type: "TO_DISCUSS" as const, content: "¿Qué herramientas usamos para seguimiento de tareas emocionales?" },
  ];

  for (let i = 0; i < lastWeekContribs.length; i++) {
    const contrib = lastWeekContribs[i];
    await prisma.weekFlowContribution.create({
      data: {
        sessionId: lastWeekSession.id,
        userId: contrib.userId,
        type: contrib.type,
        content: contrib.content,
        order: i,
        status: "ACTIVE",
        isTask: contrib.isTask || false,
        isCompleted: contrib.isCompleted || false,
        completedAt: contrib.isCompleted ? lastWeekBounds.weekEnd : undefined,
      },
    });
  }
  console.log(`   ✅ Sesión semana ${lastWeekData.weekNumber}: ${lastWeekContribs.length} contribuciones, ${lastWeekCheckins.length} check-ins`);

  // ============================================================
  // 10. Agregar reacciones a contribuciones de la sesión actual
  // ============================================================
  console.log("\n10. Agregando reacciones a contribuciones...");

  const currentContribs = await prisma.weekFlowContribution.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  // Agregar reacciones variadas
  if (currentContribs.length > 0) {
    // Primera contribución: múltiples reacciones
    await prisma.weekFlowContribution.update({
      where: { id: currentContribs[0].id },
      data: {
        reactions: {
          "👏": [memberUserIds[1], memberUserIds[2], memberUserIds[5]],
          "🔥": [memberUserIds[3], memberUserIds[4]],
          "💪": [memberUserIds[1]],
        },
      },
    });

    // Segunda contribución
    if (currentContribs.length > 1) {
      await prisma.weekFlowContribution.update({
        where: { id: currentContribs[1].id },
        data: {
          reactions: {
            "🎉": [memberUserIds[0], memberUserIds[2]],
            "👍": [memberUserIds[3]],
          },
        },
      });
    }

    // Contribución de Santiago
    if (currentContribs.length > 2) {
      await prisma.weekFlowContribution.update({
        where: { id: currentContribs[2].id },
        data: {
          reactions: {
            "🏆": [memberUserIds[0], memberUserIds[1], memberUserIds[3], memberUserIds[4], memberUserIds[5]],
          },
        },
      });
    }
  }
  console.log("   ✅ Reacciones agregadas");

  // ============================================================
  // Resumen final
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ✅ WEEKFLOW SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log(`
  📋 Resumen:
  - Comunidad: ${community.name} (${community.id})
  - Miembros: ${memberUserIds.length} (Eduardo + 5 simulados)
  - Config: ${config.id}
  - Sesión actual: Semana ${weekNumber}/${year} (${session.id})
  - Sesión anterior: Semana ${lastWeekData.weekNumber}/${lastWeekData.year} (${lastWeekSession.id})
  - Check-ins actuales: ${moodCheckins.length}
  - Contribuciones actuales: ${showTellItems.length + toDiscussItems.length + focusItems.length}
  - Tareas de Eduardo: ${eduardoTasks.length}

  🔗 URL para acceder: /weekflow/${hubId}
  `);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
