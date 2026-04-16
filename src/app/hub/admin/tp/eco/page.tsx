"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, MessageSquare, Mail, MessageCircle, Phone,
  Sparkles, Send, RefreshCw, Copy, Check, Shield, Brain, Globe, Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP ECO — Emotional Communication Optimizer
   Bilingual ES/EN
========================================================= */

const translations = {
  es: {
    backToHub: "TP Hub",
    badgeEco: "ECO",
    title: "ECO — Comunicación TP",
    subtitle: "Optimizador de Comunicación Emocional",
    description: "Mensajería adaptada por IA para la fuerza laboral global de TP — consciente del estilo cerebral, culturalmente sensible",
    recipientTitle: "Destinatario",
    channelTitle: "Canal",
    optimizationsFor: "Optimizaciones para",
    optimizedMessage: "Mensaje Optimizado",
    adaptedFor: "Adaptado para el perfil",
    profileOf: "de",
    sendVia: "Enviar vía",
    infoCommunicationTitle: "Comunicación ECO de TP",
    infoCommunicationDesc: "Los mensajes se adaptan según el perfil cerebral SEI del destinatario, el contexto cultural y las preferencias de comunicación. Impulsado por Rowi AI × Six Seconds.",
    navAffinity: "Afinidad",
    navCoach: "Coach",
    // Channel labels
    channelEmail: "Email",
    channelWhatsApp: "WhatsApp",
    channelSMS: "SMS",
    channelTeams: "Teams",
    // Roles
    roleSarah: "Líder de Equipo — Ventas NA",
    roleMarcus: "Éxito del Cliente — LATAM",
    roleAiko: "Operaciones — APAC",
    roleEmma: "Directora de RRHH — EMEA",
    // Brain styles
    brainStrategist: "Estratega",
    brainDeliverer: "Ejecutor",
    brainScientist: "Científico",
    brainVisionary: "Visionario",
    // Regions
    regionNA: "Norteamérica",
    regionLATAM: "Latinoamérica",
    regionAPAC: "Asia Pacífico",
    regionEMEA: "EMEA",
    // Optimization tips — Sarah (Strategist)
    tipSarah1: "Lenguaje enfocado en estrategia para el perfil Estratega",
    tipSarah2: "Enfoque basado en datos con resultados claros",
    tipSarah3: "Invitación a co-crear soluciones",
    tipSarah4: "Respeta su perspectiva de liderazgo",
    // Optimization tips — Marcus (Deliverer)
    tipMarcus1: "Orientado a la acción para el perfil Ejecutor",
    tipMarcus2: "Reconoce su experiencia práctica",
    tipMarcus3: "Enfoque en implementación práctica",
    tipMarcus4: "Tono colaborativo y cálido",
    // Optimization tips — Aiko (Scientist)
    tipAiko1: "Enfoque analítico para el perfil Científico",
    tipAiko2: "Metodología y enfoque centrado en datos",
    tipAiko3: "Respeto por el pensamiento sistemático",
    tipAiko4: "Tono formal pero colegial",
    // Optimization tips — Emma (Visionary)
    tipEmma1: "Lenguaje visionario para pensador global",
    tipEmma2: "Enfoque aspiracional e inspirador",
    tipEmma3: "Enfoque en impacto y transformación",
    tipEmma4: "Comunicación orientada por valores",
    // Messages — Sarah
    msgSarahEmail: `Hola Sarah,

Espero que estés teniendo una semana productiva. He estado analizando los datos de rendimiento de ventas del Q4 junto con nuestros benchmarks de IE, y encontré algunos patrones fascinantes que me encantaría compartir contigo.

Los mejores desempeños de tu equipo obtienen consistentemente puntajes altos en Pensamiento Consecuente — lo cual se alinea perfectamente con tu perfil de Estratega. Creo que podríamos construir un programa de coaching dirigido en torno a esto.

¿Te gustaría agendar una llamada de 30 minutos esta semana para explorar la estrategia? Creo que tu perspectiva sobre escalar esto en NA sería invaluable.

Saludos cordiales`,
    msgSarahWhatsApp: `Hola Sarah! 👋

Encontré algunos patrones geniales en los datos del Q4 + benchmarks de IE que podrían ayudar a escalar el rendimiento de tu equipo 📊

Los mejores desempeños de tu equipo se alinean con el perfil Estratega. ¿Quieres hacer una llamada rápida para discutir una estrategia de coaching? ♟️`,
    msgSarahSMS: `Hola Sarah! Encontré patrones interesantes Q4+IE para tu equipo. Los mejores desempeños coinciden con el perfil Estratega. ¿Llamada rápida esta semana?`,
    msgSarahChat: `Hola Sarah! Tengo algunos insights emocionantes de datos que vinculan el rendimiento de ventas de tu equipo con sus perfiles de IE. ¡Tus Estrategas están superando las expectativas! ¿Tienes 15 min para discutir una estrategia de coaching? ♟️📈`,
    // Messages — Marcus
    msgMarcusEmail: `Hola Marcus,

Quería contactarte sobre las métricas de éxito del cliente que hemos estado rastreando en LATAM. Los resultados son impresionantes — la entrega consistente de tu equipo se alinea perfectamente con el perfil cerebral Ejecutor que predomina en tu región.

Me encantaría colaborar en la creación de una guía de mejores prácticas que podamos compartir entre regiones. Tu experiencia práctica con la implementación sería clave.

¿Cuándo sería un buen momento para conectar?

Saludos`,
    msgMarcusWhatsApp: `Hola Marcus! 👋

¡Las métricas de CS de tu equipo LATAM se ven geniales! 📦 El perfil Ejecutor realmente se refleja en los resultados.

¿Quieres colaborar en una guía de mejores prácticas? Tu experiencia en implementación sería perfecta para esto 🚀`,
    msgMarcusSMS: `Hola Marcus! Las métricas de CS en LATAM son excelentes - se nota el perfil Ejecutor. ¿Colaboramos en una guía de mejores prácticas?`,
    msgMarcusChat: `Hola Marcus! Tus números en LATAM son sólidos 💪 Veo el perfil Ejecutor reflejándose claramente en la ejecución. ¿Quieres asociarte en un documento de mejores prácticas inter-regional? Tus insights de implementación serían oro 📦`,
    // Messages — Aiko
    msgAikoEmail: `Estimada Aiko,

He estado revisando los datos de eficiencia operativa en APAC, y apreciaría tu perspectiva analítica sobre algunos hallazgos.

Los datos muestran una fuerte correlación entre los perfiles cerebrales Científico y la excelencia en QA en tu región. He preparado un análisis detallado con notas metodológicas que creo serían de tu interés.

¿Podríamos programar una reunión para revisar los datos juntos? Valoraría mucho tu enfoque científico para validar estos patrones.

Saludos cordiales`,
    msgAikoWhatsApp: `Hola Aiko! 🔬

Tengo datos operativos detallados de APAC que muestran correlaciones interesantes entre QA + perfiles cerebrales. Preparé un análisis con notas metodológicas.

¿Te gustaría revisar los datos juntos? Tu perspectiva analítica sería de gran ayuda 📊`,
    msgAikoSMS: `Hola Aiko! Tengo datos de correlación QA + perfil cerebral en APAC para revisar. Valoraría tu aporte analítico. ¿Reunión esta semana?`,
    msgAikoChat: `Hola Aiko! He preparado un análisis de datos sobre el rendimiento de QA en APAC correlacionado con perfiles cerebrales Científico. La metodología está documentada. ¿Te gustaría revisarlo juntos? 🔬📋`,
    // Messages — Emma
    msgEmmaEmail: `Hola Emma,

He estado pensando en cómo podríamos aprovechar nuestros datos de IE para transformar la estrategia de desarrollo de talento de TP en EMEA. Dada tu visión de liderazgo centrado en las personas, creo que te emocionará lo que revelan los datos.

Los datos de la evaluación muestran que los empleados que mejoran sus puntajes de IE en solo un 10% ven mejoras medibles tanto en rendimiento como en métricas de bienestar. Imagina lo que un programa dirigido podría lograr en EMEA.

Me encantaría hacer una lluvia de ideas juntos sobre una hoja de ruta que podría establecer un nuevo estándar para el desarrollo de talento en la industria.

Un abrazo`,
    msgEmmaWhatsApp: `Hola Emma! 🔮

Tengo una visión emocionante para compartir — nuestros datos de IE podrían transformar el desarrollo de talento en EMEA. ¡Un 10% de mejora en IE = mejoras medibles en rendimiento + bienestar!

¿Quieres hacer lluvia de ideas sobre una hoja de ruta juntas? Creo que esto podría ser líder en la industria ✨`,
    msgEmmaSMS: `Hola Emma! Los datos de IE muestran que 10% de mejora = ganancia en rendimiento + bienestar. ¿Quieres idear un programa transformador de talento para EMEA?`,
    msgEmmaChat: `Hola Emma! 🔮 He estado pensando en grande — ¿qué tal si usamos nuestros insights de IE para construir un programa de desarrollo de talento de primer nivel para EMEA? Los datos muestran un potencial increíble. ¿Lista para soñar en grande juntas? ✨`,
  },
  en: {
    backToHub: "TP Hub",
    badgeEco: "ECO",
    title: "ECO — TP Communication",
    subtitle: "Emotional Communication Optimizer",
    description: "AI-adapted messaging for TP's global workforce — brain style aware, culturally sensitive",
    recipientTitle: "Recipient",
    channelTitle: "Channel",
    optimizationsFor: "Optimizations for",
    optimizedMessage: "Optimized Message",
    adaptedFor: "Adapted for",
    profileOf: "'s",
    sendVia: "Send via",
    infoCommunicationTitle: "TP ECO Communication",
    infoCommunicationDesc: "Messages are adapted based on the recipient's SEI brain profile, cultural context, and communication preferences. Powered by Rowi AI × Six Seconds.",
    navAffinity: "Affinity",
    navCoach: "Coach",
    // Channel labels
    channelEmail: "Email",
    channelWhatsApp: "WhatsApp",
    channelSMS: "SMS",
    channelTeams: "Teams",
    // Roles
    roleSarah: "Team Lead — Sales NA",
    roleMarcus: "Customer Success — LATAM",
    roleAiko: "Operations — APAC",
    roleEmma: "HR Director — EMEA",
    // Brain styles
    brainStrategist: "Strategist",
    brainDeliverer: "Deliverer",
    brainScientist: "Scientist",
    brainVisionary: "Visionary",
    // Regions
    regionNA: "North America",
    regionLATAM: "Latin America",
    regionAPAC: "Asia Pacific",
    regionEMEA: "EMEA",
    // Optimization tips — Sarah (Strategist)
    tipSarah1: "Strategy-focused language for Strategist profile",
    tipSarah2: "Data-driven approach with clear outcomes",
    tipSarah3: "Invitation to co-create solutions",
    tipSarah4: "Respects her leadership perspective",
    // Optimization tips — Marcus (Deliverer)
    tipMarcus1: "Action-oriented for Deliverer profile",
    tipMarcus2: "Acknowledges hands-on expertise",
    tipMarcus3: "Focus on practical implementation",
    tipMarcus4: "Collaborative and warm tone",
    // Optimization tips — Aiko (Scientist)
    tipAiko1: "Analytical framing for Scientist profile",
    tipAiko2: "Methodology and data-first approach",
    tipAiko3: "Respect for systematic thinking",
    tipAiko4: "Formal yet collegial tone",
    // Optimization tips — Emma (Visionary)
    tipEmma1: "Visionary language for big-picture thinker",
    tipEmma2: "Aspirational and inspiring framing",
    tipEmma3: "Focus on impact and transformation",
    tipEmma4: "Values-driven communication",
    // Messages — Sarah
    msgSarahEmail: `Hi Sarah,

I hope you're having a productive week. I've been analyzing the Q4 sales performance data alongside our EQ benchmarks, and I found some fascinating patterns I'd love to share with you.

Your team's top performers consistently score high in Consequential Thinking — which aligns perfectly with your Strategist profile. I think we could build a targeted coaching program around this.

Would you like to schedule a 30-minute call this week to explore the strategy? I believe your perspective on scaling this across NA would be invaluable.

Best regards`,
    msgSarahWhatsApp: `Hi Sarah! 👋

I found some great patterns in the Q4 data + EQ benchmarks that could help scale your team's performance 📊

Your team's top performers align with the Strategist profile. Want to do a quick call to discuss a coaching strategy? ♟️`,
    msgSarahSMS: `Hi Sarah! Found interesting Q4+EQ patterns for your team. Top performers match Strategist profile. Quick call this week?`,
    msgSarahChat: `Hey Sarah! I've got some exciting data insights linking your team's sales performance with their EQ profiles. Your Strategists are outperforming! Do you have 15 min to discuss a coaching strategy? ♟️📈`,
    // Messages — Marcus
    msgMarcusEmail: `Hola Marcus,

I wanted to reach out about the customer success metrics we've been tracking in LATAM. The results are impressive — your team's consistent delivery aligns perfectly with the Deliverer brain profile that's dominant in your region.

I'd love to collaborate on creating a best practices guide that we could share across regions. Your hands-on experience with implementation would be key.

When would be a good time to connect?

Regards`,
    msgMarcusWhatsApp: `Hey Marcus! 👋

Your LATAM team's CS metrics are looking great! 📦 The Deliverer profile really shows in the results.

Want to collaborate on a best practices guide? Your implementation experience would be perfect for this 🚀`,
    msgMarcusSMS: `Hi Marcus! LATAM CS metrics are great - Deliverer profile shows. Let's collaborate on a best practices guide?`,
    msgMarcusChat: `Hey Marcus! Your LATAM numbers are solid 💪 I see the Deliverer profile really showing through in execution. Want to partner on a cross-region best practices doc? Your implementation insights would be gold 📦`,
    // Messages — Aiko
    msgAikoEmail: `Dear Aiko,

I've been reviewing the operational efficiency data across APAC, and I'd appreciate your analytical perspective on some findings.

The data shows a strong correlation between Scientist brain profiles and QA excellence in your region. I've prepared a detailed analysis with methodology notes that I believe would interest you.

Could we schedule a meeting to review the data together? I'd value your scientific approach to validating these patterns.

Best regards`,
    msgAikoWhatsApp: `Hi Aiko! 🔬

I have some detailed APAC operational data showing interesting QA + brain profile correlations. I've prepared analysis with methodology notes.

Would you like to review the data together? Your analytical perspective would be very helpful 📊`,
    msgAikoSMS: `Hi Aiko! Have APAC QA + brain profile correlation data to review. Would value your analytical input. Meeting this week?`,
    msgAikoChat: `Hi Aiko! I've prepared a data analysis on APAC QA performance correlated with Scientist brain profiles. The methodology is documented. Would you like to review together? 🔬📋`,
    // Messages — Emma
    msgEmmaEmail: `Hi Emma,

I've been thinking about how we could leverage our EQ data to transform TP's talent development strategy across EMEA. Given your vision for people-first leadership, I think you'll be excited about what the data reveals.

The assessment data shows that employees who improve their EQ scores by just 10% see measurable improvements in both performance and wellbeing metrics. Imagine what a targeted program could achieve across EMEA.

I'd love to brainstorm together on a roadmap that could set a new standard for talent development in the industry.

Warm regards`,
    msgEmmaWhatsApp: `Hi Emma! 🔮

I have an exciting vision to share — our EQ data could transform EMEA talent development. A 10% EQ improvement = measurable performance + wellbeing gains!

Want to brainstorm a roadmap together? I think this could be industry-leading ✨`,
    msgEmmaSMS: `Hi Emma! EQ data shows 10% improvement = performance + wellbeing gains. Want to brainstorm a transformative EMEA talent program?`,
    msgEmmaChat: `Hey Emma! 🔮 I've been thinking big — what if we used our EQ insights to build a best-in-class talent development program for EMEA? The data shows incredible potential. Ready to dream big together? ✨`,
  },
  pt: {
    backToHub: "TP Hub",
    badgeEco: "ECO",
    title: "ECO — TP Communication",
    subtitle: "Emotional Communication Optimizer",
    description: "AI-adapted messaging for TP's global workforce — brain style aware, culturally sensitive",
    recipientTitle: "Recipient",
    channelTitle: "Channel",
    optimizationsFor: "Optimizations for",
    optimizedMessage: "Optimized Message",
    adaptedFor: "Adapted for",
    profileOf: "'s",
    sendVia: "Send via",
    infoCommunicationTitle: "TP ECO Communication",
    infoCommunicationDesc: "Messages are adapted based on the recipient's SEI brain profile, cultural context, and communication preferences. Powered by Rowi AI × Six Seconds.",
    navAffinity: "Affinity",
    navCoach: "Coach",
    // Channel labels
    channelEmail: "Email",
    channelWhatsApp: "WhatsApp",
    channelSMS: "SMS",
    channelTeams: "Teams",
    // Roles
    roleSarah: "Team Lead — Sales NA",
    roleMarcus: "Customer Success — LATAM",
    roleAiko: "Operations — APAC",
    roleEmma: "HR Director — EMEA",
    // Brain styles
    brainStrategist: "Strategist",
    brainDeliverer: "Deliverer",
    brainScientist: "Scientist",
    brainVisionary: "Visionary",
    // Regions
    regionNA: "North America",
    regionLATAM: "Latin America",
    regionAPAC: "Asia Pacific",
    regionEMEA: "EMEA",
    // Optimization tips — Sarah (Strategist)
    tipSarah1: "Strategy-focused language for Strategist profile",
    tipSarah2: "Data-driven approach with clear outcomes",
    tipSarah3: "Invitation to co-create solutions",
    tipSarah4: "Respects her leadership perspective",
    // Optimization tips — Marcus (Deliverer)
    tipMarcus1: "Action-oriented for Deliverer profile",
    tipMarcus2: "Acknowledges hands-on expertise",
    tipMarcus3: "Focus on practical implementation",
    tipMarcus4: "Collaborative and warm tone",
    // Optimization tips — Aiko (Scientist)
    tipAiko1: "Analytical framing for Scientist profile",
    tipAiko2: "Methodology and data-first approach",
    tipAiko3: "Respect for systematic thinking",
    tipAiko4: "Formal yet collegial tone",
    // Optimization tips — Emma (Visionary)
    tipEmma1: "Visionary language for big-picture thinker",
    tipEmma2: "Aspirational and inspiring framing",
    tipEmma3: "Focus on impact and transformation",
    tipEmma4: "Values-driven communication",
    // Messages — Sarah
    msgSarahEmail: `Hi Sarah,

I hope you're having a productive week. I've been analyzing the Q4 sales performance data alongside our EQ benchmarks, and I found some fascinating patterns I'd love to share with you.

Your team's top performers consistently score high in Consequential Thinking — which aligns perfectly with your Strategist profile. I think we could build a targeted coaching program around this.

Would you like to schedule a 30-minute call this week to explore the strategy? I believe your perspective on scaling this across NA would be invaluable.

Best regards`,
    msgSarahWhatsApp: `Hi Sarah! 👋

I found some great patterns in the Q4 data + EQ benchmarks that could help scale your team's performance 📊

Your team's top performers align with the Strategist profile. Want to do a quick call to discuss a coaching strategy? ♟️`,
    msgSarahSMS: `Hi Sarah! Found interesting Q4+EQ patterns for your team. Top performers match Strategist profile. Quick call this week?`,
    msgSarahChat: `Hey Sarah! I've got some exciting data insights linking your team's sales performance with their EQ profiles. Your Strategists are outperforming! Do you have 15 min to discuss a coaching strategy? ♟️📈`,
    // Messages — Marcus
    msgMarcusEmail: `Hola Marcus,

I wanted to reach out about the customer success metrics we've been tracking in LATAM. The results are impressive — your team's consistent delivery aligns perfectly with the Deliverer brain profile that's dominant in your region.

I'd love to collaborate on creating a best practices guide that we could share across regions. Your hands-on experience with implementation would be key.

When would be a good time to connect?

Regards`,
    msgMarcusWhatsApp: `Hey Marcus! 👋

Your LATAM team's CS metrics are looking great! 📦 The Deliverer profile really shows in the results.

Want to collaborate on a best practices guide? Your implementation experience would be perfect for this 🚀`,
    msgMarcusSMS: `Hi Marcus! LATAM CS metrics are great - Deliverer profile shows. Let's collaborate on a best practices guide?`,
    msgMarcusChat: `Hey Marcus! Your LATAM numbers are solid 💪 I see the Deliverer profile really showing through in execution. Want to partner on a cross-region best practices doc? Your implementation insights would be gold 📦`,
    // Messages — Aiko
    msgAikoEmail: `Dear Aiko,

I've been reviewing the operational efficiency data across APAC, and I'd appreciate your analytical perspective on some findings.

The data shows a strong correlation between Scientist brain profiles and QA excellence in your region. I've prepared a detailed analysis with methodology notes that I believe would interest you.

Could we schedule a meeting to review the data together? I'd value your scientific approach to validating these patterns.

Best regards`,
    msgAikoWhatsApp: `Hi Aiko! 🔬

I have some detailed APAC operational data showing interesting QA + brain profile correlations. I've prepared analysis with methodology notes.

Would you like to review the data together? Your analytical perspective would be very helpful 📊`,
    msgAikoSMS: `Hi Aiko! Have APAC QA + brain profile correlation data to review. Would value your analytical input. Meeting this week?`,
    msgAikoChat: `Hi Aiko! I've prepared a data analysis on APAC QA performance correlated with Scientist brain profiles. The methodology is documented. Would you like to review together? 🔬📋`,
    // Messages — Emma
    msgEmmaEmail: `Hi Emma,

I've been thinking about how we could leverage our EQ data to transform TP's talent development strategy across EMEA. Given your vision for people-first leadership, I think you'll be excited about what the data reveals.

The assessment data shows that employees who improve their EQ scores by just 10% see measurable improvements in both performance and wellbeing metrics. Imagine what a targeted program could achieve across EMEA.

I'd love to brainstorm together on a roadmap that could set a new standard for talent development in the industry.

Warm regards`,
    msgEmmaWhatsApp: `Hi Emma! 🔮

I have an exciting vision to share — our EQ data could transform EMEA talent development. A 10% EQ improvement = measurable performance + wellbeing gains!

Want to brainstorm a roadmap together? I think this could be industry-leading ✨`,
    msgEmmaSMS: `Hi Emma! EQ data shows 10% improvement = performance + wellbeing gains. Want to brainstorm a transformative EMEA talent program?`,
    msgEmmaChat: `Hey Emma! 🔮 I've been thinking big — what if we used our EQ insights to build a best-in-class talent development program for EMEA? The data shows incredible potential. Ready to dream big together? ✨`,
  },
  it: {
    backToHub: "TP Hub",
    badgeEco: "ECO",
    title: "ECO — TP Communication",
    subtitle: "Emotional Communication Optimizer",
    description: "AI-adapted messaging for TP's global workforce — brain style aware, culturally sensitive",
    recipientTitle: "Recipient",
    channelTitle: "Channel",
    optimizationsFor: "Optimizations for",
    optimizedMessage: "Optimized Message",
    adaptedFor: "Adapted for",
    profileOf: "'s",
    sendVia: "Send via",
    infoCommunicationTitle: "TP ECO Communication",
    infoCommunicationDesc: "Messages are adapted based on the recipient's SEI brain profile, cultural context, and communication preferences. Powered by Rowi AI × Six Seconds.",
    navAffinity: "Affinity",
    navCoach: "Coach",
    // Channel labels
    channelEmail: "Email",
    channelWhatsApp: "WhatsApp",
    channelSMS: "SMS",
    channelTeams: "Teams",
    // Roles
    roleSarah: "Team Lead — Sales NA",
    roleMarcus: "Customer Success — LATAM",
    roleAiko: "Operations — APAC",
    roleEmma: "HR Director — EMEA",
    // Brain styles
    brainStrategist: "Strategist",
    brainDeliverer: "Deliverer",
    brainScientist: "Scientist",
    brainVisionary: "Visionary",
    // Regions
    regionNA: "North America",
    regionLATAM: "Latin America",
    regionAPAC: "Asia Pacific",
    regionEMEA: "EMEA",
    // Optimization tips — Sarah (Strategist)
    tipSarah1: "Strategy-focused language for Strategist profile",
    tipSarah2: "Data-driven approach with clear outcomes",
    tipSarah3: "Invitation to co-create solutions",
    tipSarah4: "Respects her leadership perspective",
    // Optimization tips — Marcus (Deliverer)
    tipMarcus1: "Action-oriented for Deliverer profile",
    tipMarcus2: "Acknowledges hands-on expertise",
    tipMarcus3: "Focus on practical implementation",
    tipMarcus4: "Collaborative and warm tone",
    // Optimization tips — Aiko (Scientist)
    tipAiko1: "Analytical framing for Scientist profile",
    tipAiko2: "Methodology and data-first approach",
    tipAiko3: "Respect for systematic thinking",
    tipAiko4: "Formal yet collegial tone",
    // Optimization tips — Emma (Visionary)
    tipEmma1: "Visionary language for big-picture thinker",
    tipEmma2: "Aspirational and inspiring framing",
    tipEmma3: "Focus on impact and transformation",
    tipEmma4: "Values-driven communication",
    // Messages — Sarah
    msgSarahEmail: `Hi Sarah,

I hope you're having a productive week. I've been analyzing the Q4 sales performance data alongside our EQ benchmarks, and I found some fascinating patterns I'd love to share with you.

Your team's top performers consistently score high in Consequential Thinking — which aligns perfectly with your Strategist profile. I think we could build a targeted coaching program around this.

Would you like to schedule a 30-minute call this week to explore the strategy? I believe your perspective on scaling this across NA would be invaluable.

Best regards`,
    msgSarahWhatsApp: `Hi Sarah! 👋

I found some great patterns in the Q4 data + EQ benchmarks that could help scale your team's performance 📊

Your team's top performers align with the Strategist profile. Want to do a quick call to discuss a coaching strategy? ♟️`,
    msgSarahSMS: `Hi Sarah! Found interesting Q4+EQ patterns for your team. Top performers match Strategist profile. Quick call this week?`,
    msgSarahChat: `Hey Sarah! I've got some exciting data insights linking your team's sales performance with their EQ profiles. Your Strategists are outperforming! Do you have 15 min to discuss a coaching strategy? ♟️📈`,
    // Messages — Marcus
    msgMarcusEmail: `Hola Marcus,

I wanted to reach out about the customer success metrics we've been tracking in LATAM. The results are impressive — your team's consistent delivery aligns perfectly with the Deliverer brain profile that's dominant in your region.

I'd love to collaborate on creating a best practices guide that we could share across regions. Your hands-on experience with implementation would be key.

When would be a good time to connect?

Regards`,
    msgMarcusWhatsApp: `Hey Marcus! 👋

Your LATAM team's CS metrics are looking great! 📦 The Deliverer profile really shows in the results.

Want to collaborate on a best practices guide? Your implementation experience would be perfect for this 🚀`,
    msgMarcusSMS: `Hi Marcus! LATAM CS metrics are great - Deliverer profile shows. Let's collaborate on a best practices guide?`,
    msgMarcusChat: `Hey Marcus! Your LATAM numbers are solid 💪 I see the Deliverer profile really showing through in execution. Want to partner on a cross-region best practices doc? Your implementation insights would be gold 📦`,
    // Messages — Aiko
    msgAikoEmail: `Dear Aiko,

I've been reviewing the operational efficiency data across APAC, and I'd appreciate your analytical perspective on some findings.

The data shows a strong correlation between Scientist brain profiles and QA excellence in your region. I've prepared a detailed analysis with methodology notes that I believe would interest you.

Could we schedule a meeting to review the data together? I'd value your scientific approach to validating these patterns.

Best regards`,
    msgAikoWhatsApp: `Hi Aiko! 🔬

I have some detailed APAC operational data showing interesting QA + brain profile correlations. I've prepared analysis with methodology notes.

Would you like to review the data together? Your analytical perspective would be very helpful 📊`,
    msgAikoSMS: `Hi Aiko! Have APAC QA + brain profile correlation data to review. Would value your analytical input. Meeting this week?`,
    msgAikoChat: `Hi Aiko! I've prepared a data analysis on APAC QA performance correlated with Scientist brain profiles. The methodology is documented. Would you like to review together? 🔬📋`,
    // Messages — Emma
    msgEmmaEmail: `Hi Emma,

I've been thinking about how we could leverage our EQ data to transform TP's talent development strategy across EMEA. Given your vision for people-first leadership, I think you'll be excited about what the data reveals.

The assessment data shows that employees who improve their EQ scores by just 10% see measurable improvements in both performance and wellbeing metrics. Imagine what a targeted program could achieve across EMEA.

I'd love to brainstorm together on a roadmap that could set a new standard for talent development in the industry.

Warm regards`,
    msgEmmaWhatsApp: `Hi Emma! 🔮

I have an exciting vision to share — our EQ data could transform EMEA talent development. A 10% EQ improvement = measurable performance + wellbeing gains!

Want to brainstorm a roadmap together? I think this could be industry-leading ✨`,
    msgEmmaSMS: `Hi Emma! EQ data shows 10% improvement = performance + wellbeing gains. Want to brainstorm a transformative EMEA talent program?`,
    msgEmmaChat: `Hey Emma! 🔮 I've been thinking big — what if we used our EQ insights to build a best-in-class talent development program for EMEA? The data shows incredible potential. Ready to dream big together? ✨`,
  },

};

/* Main Page */
export default function TPEcoPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [selectedRecipient, setSelectedRecipient] = useState("sarah");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  /* --- Translated data objects --- */
  const TP_RECIPIENTS = [
    { id: "sarah", name: "Sarah Chen", role: t.roleSarah, avatar: "/rowivectors/Rowi-05.png", brainStyle: t.brainStrategist, emoji: "♟️", region: t.regionNA },
    { id: "marcus", name: "Marcus Rivera", role: t.roleMarcus, avatar: "/rowivectors/Rowi-04.png", brainStyle: t.brainDeliverer, emoji: "📦", region: t.regionLATAM },
    { id: "aiko", name: "Aiko Tanaka", role: t.roleAiko, avatar: "/rowivectors/Rowi-03.png", brainStyle: t.brainScientist, emoji: "🔬", region: t.regionAPAC },
    { id: "emma", name: "Emma Schmidt", role: t.roleEmma, avatar: "/rowivectors/Rowi-02.png", brainStyle: t.brainVisionary, emoji: "🔮", region: t.regionEMEA },
  ];

  const CHANNELS = [
    { key: "email", icon: Mail, label: t.channelEmail },
    { key: "whatsapp", icon: MessageCircle, label: t.channelWhatsApp },
    { key: "sms", icon: Phone, label: t.channelSMS },
    { key: "chat", icon: MessageSquare, label: t.channelTeams },
  ];

  const MESSAGES: Record<string, Record<string, string>> = {
    sarah: {
      email: t.msgSarahEmail,
      whatsapp: t.msgSarahWhatsApp,
      sms: t.msgSarahSMS,
      chat: t.msgSarahChat,
    },
    marcus: {
      email: t.msgMarcusEmail,
      whatsapp: t.msgMarcusWhatsApp,
      sms: t.msgMarcusSMS,
      chat: t.msgMarcusChat,
    },
    aiko: {
      email: t.msgAikoEmail,
      whatsapp: t.msgAikoWhatsApp,
      sms: t.msgAikoSMS,
      chat: t.msgAikoChat,
    },
    emma: {
      email: t.msgEmmaEmail,
      whatsapp: t.msgEmmaWhatsApp,
      sms: t.msgEmmaSMS,
      chat: t.msgEmmaChat,
    },
  };

  const OPTIMIZATION_TIPS: Record<string, string[]> = {
    sarah: [t.tipSarah1, t.tipSarah2, t.tipSarah3, t.tipSarah4],
    marcus: [t.tipMarcus1, t.tipMarcus2, t.tipMarcus3, t.tipMarcus4],
    aiko: [t.tipAiko1, t.tipAiko2, t.tipAiko3, t.tipAiko4],
    emma: [t.tipEmma1, t.tipEmma2, t.tipEmma3, t.tipEmma4],
  };

  const recipient = TP_RECIPIENTS.find((r) => r.id === selectedRecipient)!;
  const currentMessage = MESSAGES[selectedRecipient]?.[selectedChannel] || "";
  const tips = OPTIMIZATION_TIPS[selectedRecipient] || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t.badgeEco}
        </span>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-emerald-500" /> {t.title}
        </h1>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t.subtitle}</p>
        <p className="text-[var(--rowi-muted)]">{t.description}</p>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recipient Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> {t.recipientTitle}</h2>
            <div className="space-y-2">
              {TP_RECIPIENTS.map((r) => (
                <button key={r.id} onClick={() => setSelectedRecipient(r.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedRecipient === r.id ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500" : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800"}`}>
                  <div className="relative w-10 h-10 shrink-0"><Image src={r.avatar} alt={r.name} fill className="object-contain" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-[10px] text-[var(--rowi-muted)] truncate">{r.role}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 shrink-0">{r.emoji}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Channel Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold mb-4">{t.channelTitle}</h2>
            <div className="grid grid-cols-2 gap-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannel === channel.key;
                return (
                  <button key={channel.key} onClick={() => setSelectedChannel(channel.key)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-500" : "text-[var(--rowi-muted)]"}`} />
                    <span className={`text-xs font-medium ${isSelected ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{channel.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Brain Style Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> {t.optimizationsFor} {recipient.brainStyle}
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />{tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right Column — Message */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{t.optimizedMessage}</h2>
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t.adaptedFor} {recipient.brainStyle} {t.profileOf} {recipient.name} ({recipient.region})
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRegenerate} disabled={isRegenerating} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  <RefreshCw className={`w-5 h-5 ${isRegenerating ? "animate-spin" : ""}`} />
                </button>
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-4 overflow-auto min-h-[300px]">
              <motion.pre key={`${selectedRecipient}-${selectedChannel}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {currentMessage}
              </motion.pre>
            </div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Send className="w-5 h-5" /> {t.sendVia} {CHANNELS.find((c) => c.key === selectedChannel)?.label}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">{t.infoCommunicationTitle}</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t.infoCommunicationDesc}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/affinity" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navAffinity}
        </Link>
        <Link href="/hub/admin/tp/coach" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navCoach} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
