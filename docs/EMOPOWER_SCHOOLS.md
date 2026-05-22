# EmoPower Schools — Especificación funcional completa para ROWIIA

> **Status:** v1.0 — documento maestro del programa
> **Owners:** Eduardo González (Brain Up Ecuador · Country Partner Six Seconds), Joshua Freedman (Six Seconds CEO)
> **Source of truth:** Six Seconds (metodología) + Brain Up (operación territorial)
> **Integración con ROWIIA:** ver `docs/ROWIIA_INTEGRATED_SCOPE.md` para el mapa técnico de plataforma.

---

## Para qué sirve este documento

Este texto define EmoPower Schools en toda su profundidad operativa: qué mide, qué observa, qué retroalimenta, qué ganan los actores en cada nivel, qué datos se mueven, qué reportes se generan, qué decisiones se habilitan. El objetivo es que ROWIIA pueda diseñar la plataforma digital que sostenga el programa de extremo a extremo — desde la captura de datos en aula hasta los tableros estratégicos para autoridades educativas — con claridad total sobre los flujos de información que tiene que soportar.

ROWIIA no es un complemento del programa. Es el sistema nervioso que permite que el programa escale. Sin plataforma, EmoPower Schools depende de hojas de cálculo, archivos sueltos y reportes manuales. Con ROWIIA, el programa se convierte en un sistema vivo que el Ministerio de Educación, las direcciones de colegio, los Quality Coaches y los propios docentes pueden operar con la misma profesionalidad con la que se opera una empresa moderna.

---

## Capítulo 1. Qué es EmoPower Schools

EmoPower Schools es un programa integral de inteligencia emocional para sistemas educativos, propiedad de Six Seconds — la organización internacional líder en aprendizaje socioemocional con 25 años de experiencia, presencia en más de 35 países y más de un millón de estudiantes formados con su metodología.

No es un curso. No es un taller. No es un servicio externo que llega al colegio, hace una intervención y se va. EmoPower Schools es un sistema operativo completo que transforma la manera en que una escuela —o todo un sistema educativo— vive, enseña y sostiene el bienestar emocional de sus estudiantes, docentes y familias durante doce meses, con capacidad permanente que queda instalada para los años siguientes.

En Ecuador, EmoPower Schools se entrega a través de la alianza entre Six Seconds y Brain Up, su Country Partner oficial. Six Seconds aporta la metodología internacional, las herramientas de evaluación, las certificaciones oficiales y la supervisión técnica. Brain Up aporta el conocimiento del sistema educativo ecuatoriano, la relación con autoridades locales, los Quality Coaches certificados que operan en territorio, la adaptación cultural del contenido y el soporte día a día en zona horaria local.

## Capítulo 2. La filosofía que define toda la arquitectura

Hay dos formas de implementar SEL en un sistema educativo. La primera es la tradicional: una organización externa entrega el programa, hace las evaluaciones individuales, capacita a los docentes y se queda como operador permanente. Funciona en pilotos. Fracasa en escala. Y crea dependencia perpetua.

La segunda es la que EmoPower Schools propone: Six Seconds y Brain Up acompañan al sistema a construir su propia capacidad interna, mientras proveen la metodología, las herramientas, la certificación, el aseguramiento de calidad y el marco de medición. El sistema educativo no contrata un servicio — recibe una transferencia técnica.

Esta filosofía tiene implicancias directas para ROWIIA. La plataforma no puede estar diseñada para que un consultor externo la administre. Tiene que estar diseñada para que el propio sistema educativo la use, con roles diferenciados para autoridades, directivos de colegio, Quality Coaches, docentes, estudiantes y familias. La plataforma transfiere capacidad porque pone el control en quienes operan, no en quienes consultan.

## Capítulo 3. Las seis fases del programa y qué necesita la plataforma en cada una

El programa se desarrolla en seis fases durante doce meses. ROWIIA debe soportar cada fase con funcionalidad específica.

**Fase 1: piloto y diagnóstico.** Durante los primeros dos meses se aplica Education Vital Signs (EVS), se hacen evaluaciones de línea base con SEI, SEI-YV y BBP en muestras representativas, se analiza la cultura institucional y se co-crea el plan con las autoridades. La plataforma debe permitir aplicación digital de los instrumentos de Six Seconds (o integración vía API con Six Seconds Assessments), construcción de muestras representativas con criterios estadísticos, captura de datos cualitativos del diagnóstico institucional, y generación automatizada del primer informe sistémico.

**Fase 2: construcción de capacidad interna.** Se identifican los educadores líderes, los DECEs y los líderes institucionales que serán el equipo permanente. ROWIIA debe permitir registro de actores del sistema con sus roles, asignación de docentes a Quality Coaches, mapeo institucional de capacidades existentes, y gestión del comité SEL interno con sus funciones, cadencia de reuniones y actas.

**Fase 3: certificación local.** Se entregan los embudos formativos EQE1, EQE2 y EQE3 más las certificaciones UEQ, EQAC y BPC. ROWIIA debe llevar el tracking de progreso de cada participante en cada certificación, integración con el sistema de credenciales internacionales de Six Seconds, gestión de horas formativas acumuladas, y emisión digital de constancias.

**Fase 4: implementación escolar.** Aquí entran las clases Self-Science, el SEL embebido por materia, el Pop-Up Festival y el trabajo con familias. ROWIIA debe operar como el banco de lecciones vivo (las siete bandas + las adaptaciones EQE2), el repositorio de embedded SEL por materia, el calendario de actividades por aula, el sistema de notificaciones a familias, y la integración con el Pop-Up Festival global.

**Fase 5: aseguramiento de calidad.** El Quality Coach interno trabaja con docentes en un ciclo mensual (observación, devolución, comunidad, supervisión). ROWIIA debe ser el corazón operativo de esta fase con módulos completos de observación digital, rúbricas auto-calculables, gestión de devoluciones 1:1, foros de comunidades de práctica, y dashboards de supervisión técnica para Six Seconds y Brain Up.

**Fase 6: medición, aprendizaje y escalamiento.** Las tres olas de medición se procesan, comparan y publican. ROWIIA debe entregar comparativos Ola 1 vs Ola 3 automáticos, análisis cualitativo asistido por inteligencia artificial sobre los reportes de Quality Coach, identificación de escuelas listas para Año 2 autónomo según criterios objetivos, y modelaje de costos de escalamiento.

## Capítulo 4. Qué mide el programa — el panel completo de instrumentos

EmoPower Schools opera con un conjunto integrado de instrumentos de medición que se aplican en tres olas durante el año. ROWIIA debe administrar todos estos instrumentos en su flujo natural.

**Education Vital Signs (EVS) — el clima emocional institucional.** Es el instrumento principal de diagnóstico de Six Seconds para escuelas. No mide individuos: mide la salud del ecosistema escolar. Evalúa cuatro grandes dimensiones del clima escolar (seguridad emocional, conexión, sentido de pertenencia y propósito compartido) en una escala institucional. Se aplica a toda la comunidad educativa (docentes, estudiantes desde tercero de primaria, padres, personal administrativo). El reporte que entrega es agregado, comparativo y benchmarked contra normas internacionales. Se aplica en las tres olas. ROWIIA debe permitir su aplicación digital masiva con flujos amigables para distintas edades y roles.

**SEI — Six Seconds Emotional Intelligence (adultos).** Mide ocho competencias de inteligencia emocional en docentes y personal: enhance emotional literacy, recognize patterns, apply consequential thinking, navigate emotions, engage intrinsic motivation, exercise optimism, increase empathy y pursue noble goals. Tiene benchmarks internacionales por edad, género y rol. Se aplica en Ola 1 y Ola 3 a muestras representativas, no en censo masivo. Entrega un perfil individual confidencial al docente más datos agregados al sistema.

**SEI-YV — versión Youth.** Adaptación del SEI para estudiantes desde 7 hasta 18 años, con versiones diferenciadas por edad. Las mismas ocho competencias adaptadas pedagógicamente. Se aplica a muestras representativas. El reporte individual se entrega de forma confidencial (es propiedad del estudiante y su familia, no del colegio), mientras que el reporte agregado alimenta los datos del sistema.

**BBP — Brain Brilliance Profile.** Mide cómo procesa información el cerebro de cada persona: estilo de toma de decisiones, foco de atención, motivadores intrínsecos, tendencia a la acción versus reflexión. Se usa principalmente para docentes y líderes institucionales en EQE2 y EQE3. Permite formar equipos balanceados y diseñar acompañamiento personalizado.

**BTP — Brain Talent Profile.** Identifica los talentos cerebrales naturales de cada persona en seis dimensiones. Útil para conocer las fortalezas del equipo docente y asignar roles que potencien lo que cada uno tiene.

**BDP — Brain Discovery Profile.** Versión introductoria para estudiantes y familias que quieren empezar a explorar su perfil cerebral sin la profundidad clínica del BBP.

Cada uno de estos instrumentos tiene su propio flujo de aplicación, procesamiento, reporte y conexión con planes de acción. ROWIIA debe orquestarlos sin que el usuario tenga que entender la complejidad técnica detrás. Para el docente, aplicar el SEI debe ser tan simple como contestar una encuesta. Para el coordinador del sistema, ver el comparativo Ola 1 vs Ola 3 debe ser un clic.

## Capítulo 5. Qué hace el Quality Coach — el ciclo mensual completo

Esta es la parte más operativamente densa del programa y donde ROWIIA tiene el mayor potencial de transformación. El Quality Coach interno (en Ecuador, típicamente el profesional del DECE de cada institución, certificado en EQE2 y EQAC) trabaja con un promedio de 10 a 15 docentes activos en un ciclo de cuatro semanas que se repite cada mes.

**Semana 1 — observación.** El Quality Coach hace cuatro o cinco visitas presenciales de aula a sus docentes asignados. La visita dura entre 20 y 45 minutos. Durante la observación, llena la rúbrica de aula sobre tres dimensiones: la apertura emocional con la que el docente conduce el espacio, la conexión que establece con los estudiantes y la transferencia de aprendizaje que logra. Cada dimensión se evalúa en escala de uno a cuatro con anclajes conductuales específicos. La rúbrica NO califica al docente — describe lo observado. Es evidencia, no juicio. ROWIIA debe permitir esta observación digital desde el celular o tablet del QC, con captura de evidencias específicas (frases textuales, descripciones de momentos), foto opcional del aula (sin estudiantes identificables) y timestamp automático.

**Semana 2 — devolución 1:1.** El Quality Coach se reúne individualmente con cada docente observado durante treinta a cuarenta y cinco minutos. La devolución sigue una estructura: primero el docente comparte su propia lectura de la clase, después el QC comparte lo observado sin opinar, juntos co-construyen una o dos mejoras concretas para implementar en las próximas dos semanas, y se acuerda un compromiso explícito. ROWIIA debe registrar el acta de la devolución, los compromisos firmados digitalmente por ambos, los próximos pasos con fecha, y vincular esa devolución con la siguiente observación para cerrar el ciclo de mejora.

**Semana 3 — comunidad de práctica.** Encuentro grupal de 90 minutos con todos los docentes del Quality Coach. Es la semana donde el aprendizaje se vuelve horizontal. Los docentes traen casos reales del aula. Se analizan colectivamente. Se diseñan respuestas. Se sale con próximos pasos. El QC facilita pero no domina. ROWIIA debe permitir agendar la comunidad, gestionar asistencia, capturar los casos discutidos (texto, audio si se autoriza), las prácticas emergentes que el grupo identifica, y conservarlas en un repositorio creciente de casos del sistema.

**Semana 4 — supervisión.** El Quality Coach mismo recibe supervisión técnica de Brain Up con respaldo de Six Seconds. Aquí el QC sube los casos complejos que no supo manejar, los datos del mes, las dudas metodológicas. Brain Up responde, ajusta y a veces escala a Six Seconds internacional para casos que requieren consultoría especializada. ROWIIA debe ser el espacio donde el QC documenta su semana, registra los casos para supervisión, recibe la respuesta del supervisor y captura los ajustes acordados.

A lo largo del ciclo mensual, el Quality Coach genera datos cuantitativos y cualitativos enormemente valiosos. ROWIIA convierte esos datos en información de inteligencia operativa: cuántos docentes están en escala alta vs baja, dónde están las brechas, qué temas se repiten en comunidades de práctica, qué casos complejos están escalando, qué cohortes muestran progreso y cuáles están estancadas.

## Capítulo 6. Qué se observa en aula — la rúbrica completa

La rúbrica de observación de aula que utiliza el Quality Coach tiene tres dimensiones, cada una con indicadores específicos y escala uno a cuatro. Esta es la rúbrica que ROWIIA debe digitalizar y hacer fluida.

**Dimensión 1: apertura emocional del espacio.** Evalúa si el docente abre la clase con atención emocional, no solo cognitiva. Indicadores: hace check-in al inicio, nombra emociones presentes, valida lo que aparece sin corregir, modela su propia regulación, permite silencio sin llenarlo con voz docente. Escala: nivel uno indica ausente o evitado, nivel dos indica mecánico sin profundidad, nivel tres indica genuino y consistente, nivel cuatro indica integrado naturalmente al tejido pedagógico.

**Dimensión 2: conexión con los estudiantes.** Evalúa si el docente lee y responde al estado emocional del grupo. Indicadores: hace contacto visual distribuido, llama a los estudiantes por nombre, ajusta el ritmo cuando el grupo lo necesita, suspende el contenido cuando algo emocional emerge, recoge señales no verbales, hace preguntas que invitan voz no solo respuesta. Misma escala uno a cuatro.

**Dimensión 3: transferencia de aprendizaje.** Evalúa si la clase deja herramientas aplicables y no solo conceptos. Indicadores: nombra explícitamente las habilidades SEL que se trabajaron, conecta el contenido con la vida del estudiante, propone una práctica concreta para fuera del aula, cierra con un compromiso o reflexión, vincula con el aprendizaje anterior y el siguiente.

Cada observación produce una puntuación por dimensión, una puntuación global ponderada, evidencias textuales específicas (las frases que el QC anotó), y áreas de fortaleza y crecimiento. ROWIIA debe permitir que el docente vea su propia evolución observación por observación a lo largo del año, que el coordinador del sistema vea las tendencias agregadas, y que Brain Up identifique a docentes en alto o bajo desempeño para acompañamiento diferenciado.

## Capítulo 7. Qué retroalimenta el programa a cada actor

Esta es la pregunta clave para ROWIIA: ¿qué información recibe cada actor y qué hace con ella? Porque un sistema que captura datos pero no los devuelve transformados en acción no sirve para nada. EmoPower Schools tiene flujos de retroalimentación bien diseñados que ROWIIA debe automatizar.

**El estudiante recibe.** En la versión actual del programa (sin plataforma) los estudiantes reciben muy poco directamente. Con ROWIIA esto cambia radicalmente. El estudiante puede tener su propio journal digital donde registra su check-in semanal, ve la evolución de sus emociones a lo largo del tiempo, recibe pequeños insights personalizados ("notamos que las últimas dos semanas has registrado más frustración los lunes — ¿qué pasa los domingos?"), accede a las herramientas SEL que está aprendiendo según su banda de desarrollo (la pausa de 6 segundos, el mapa de emociones, la pregunta de empatía), y tiene un espacio seguro para escribir a su tutor o al DECE cuando lo necesita. Importante: lo que el estudiante escribe es SUYO. El colegio no lo ve. Solo se notifica al adulto de confianza si el estudiante explícitamente lo solicita, o si aparecen señales de crisis configuradas (palabras específicas que activan protocolo). La privacidad del estudiante es absoluta y diferenciadora.

**El docente recibe.** Su propio reporte SEI confidencial al inicio y al final del año (puede compararlos). Las observaciones que el QC le hizo, organizadas por dimensión y con la evolución mes a mes. Los compromisos que firmó con el QC y su estado (cumplido, en proceso, pendiente). El banco de lecciones de su banda, con los materiales descargables. Las clases de SEL embebido para sus materias específicas. El feed de la comunidad de práctica con los casos discutidos. Notificaciones de cuándo viene la próxima observación. Y un indicador personal de progreso que NO es ranking ni competencia, sino simplemente "dónde estás vs dónde empezaste".

**El Quality Coach recibe.** El dashboard de sus 10 a 15 docentes asignados con el estado de cada uno: cuándo fue la última observación, en qué nivel de la rúbrica está cada dimensión, qué compromisos están vigentes, qué docentes muestran progreso y cuáles están estancados, casos complejos pendientes de supervisión, próximas comunidades de práctica agendadas. También recibe el calendario operativo del mes con las visitas programadas, plantillas digitales para sus devoluciones, y acceso al chat con su supervisor de Brain Up para consultas técnicas.

**El director o rector del colegio recibe.** El estado general del programa en su institución: porcentaje de docentes activos, cobertura por nivel, evolución de los indicadores clave del EVS, casos críticos abiertos (sin identificar personas, solo contando). Las alertas que requieren su decisión específica como autoridad. Los resultados de las olas de medición con interpretación ejecutiva. El presupuesto y avance del cronograma del programa. Una vista institucional comparativa con el promedio del sistema (su colegio vs el resto).

**El coordinador SEL del colegio recibe.** Información operativa para gestionar el comité interno: agendas y actas de reuniones, indicadores propios del colegio (los que el colegio definió en su Workbook de Integración Institucional, complementarios a los del programa), tracker mensual de actividades planeadas vs realizadas, reporte mensual consolidado para llevar a dirección, y comunicación con el coordinador Brain Up asignado.

**Brain Up Ecuador recibe.** El dashboard nacional con todos los colegios que opera, su estado operativo, alertas tempranas (un colegio que dejó de subir observaciones tres semanas seguidas, un QC con sobrecarga de casos complejos, un docente con caída sostenida en la rúbrica). Datos para sus reuniones de supervisión semanales con cada QC. Métricas para sus reportes trimestrales a Six Seconds internacional. Análisis comparativo entre colegios para identificar prácticas a replicar.

**Six Seconds internacional recibe.** Acceso a los datos agregados anonimizados para sus reportes globales, sus benchmarks internacionales y su investigación longitudinal. Aporta a la red mundial de evidencia.

**Las autoridades educativas (MINEDUC, distritos, municipios) reciben.** Cuando el programa se opera a nivel sistémico, las autoridades reciben dashboards estratégicos con datos del sistema: cobertura geográfica, evolución de indicadores nacionales, escuelas con mejor desempeño, escuelas que requieren apoyo, costos por estudiante atendido, proyecciones de escalamiento. Información para tomar decisiones de política pública con base en evidencia real, no en intuiciones.

**Las familias reciben.** Esto es un puente delicado pero crítico. Las familias reciben las cuatro comunicaciones del año (lanzamiento, devolución EVS, taller vivencial, showcase), acceso a los materiales pedagógicos para padres (la Guía Pedagógica de EmoPower), notificaciones sobre eventos del Pop-Up Festival donde pueden participar, e información agregada sobre el clima del colegio (no datos individuales de su hijo, salvo lo que el propio estudiante decida compartir).

## Capítulo 8. Qué ganan los estudiantes — el cambio concreto

Esta es la pregunta más importante. Si ROWIIA va a sostener este programa, tiene que tener absoluta claridad de qué le pasa al estudiante. Porque sin transformación medible y experiencial del estudiante, todo lo demás es teatro.

**Ganan vocabulario emocional.** El estudiante de primaria que entra al programa diciendo "estoy mal" sale del año diciendo "tengo frustración porque no entendí esa parte de la clase y no sé cómo pedir ayuda sin que mis compañeros se rían". La diferencia entre esas dos frases es la diferencia entre estar atrapado en una emoción y tener herramientas para procesarla. ROWIIA puede medir esto: el journal digital del estudiante captura su vocabulario emocional a lo largo del año, y se puede mostrar visualmente cómo crece (cuántas emociones distintas nombra, qué precisión emocional desarrolla).

**Ganan capacidad de pausa.** La habilidad de los seis segundos — respirar, nombrar, elegir — antes de reaccionar automáticamente. Esto es habilidad neurológica, no concepto intelectual. Se mide en cambios concretos: menos conflictos con compañeros, mejor regulación frente a frustraciones académicas, decisiones más reflexivas en situaciones cargadas. ROWIIA puede medir tendencias agregadas en reportes disciplinarios del colegio comparados antes y después del programa.

**Ganan herramientas específicas según su edad.** Un niño de inicial gana caritas para reconocer emociones y un rincón emocional en su aula. Un niño de primaria media gana la pausa de seis segundos y el lenguaje "no entiendo todavía". Un preadolescente gana el mapa de sus disparadores y respuestas. Un adolescente de secundaria baja gana la pregunta de empatía ("¿qué le importa a esta persona que yo no veo?"). Un adolescente de secundaria media gana un borrador de propósito personal. Un estudiante de bachillerato gana la carta al yo del futuro y la integración de las tres dimensiones KCG.

**Ganan que el adulto en el aula es diferente.** Esto es lo que muchos diseños SEL olvidan. El estudiante no cambia porque le enseñen contenido SEL — cambia porque el adulto que tiene delante todos los días empieza a comportarse con inteligencia emocional. Un docente certificado en EQE1 y observado mensualmente por un QC ya no le grita igual al estudiante, ya no minimiza igual la emoción que aparece, ya no etiqueta igual al "alumno problema". El estudiante gana una experiencia cotidiana distinta. Y eso es lo que transforma cerebros en desarrollo.

**Ganan datos sobre sí mismos que son suyos.** Con ROWIIA, el estudiante adolescente puede ver la evolución de su propia inteligencia emocional medida con SEI-YV en Ola 1 vs Ola 3. Puede ver dónde creció. Puede ver qué dimensiones siguen siendo terreno de trabajo. Es información que le pertenece y que se lleva al graduarse. No es propiedad del colegio.

**Ganan acceso a adultos cuando los necesitan.** El estudiante en crisis no espera al tutor del jueves. Tiene un canal directo con el DECE de su colegio a través de la plataforma, con protocolos de respuesta de 24 horas para casos no críticos y respuesta inmediata para señales de crisis. ROWIIA convierte el bienestar emocional en un derecho accesible, no en un servicio que se busca.

**Ganan, eventualmente, ser parte de algo más grande que su colegio.** El Pop-Up Festival anual los conecta con 1.5 millones de personas en todo el mundo haciendo las mismas microactividades en simultáneo. El sentido de pertenencia trasciende su escuela.

## Capítulo 9. Qué ganan los docentes

El docente es a la vez agente de cambio y beneficiario directo. Y esto es algo que el sistema educativo subestima sistemáticamente. ROWIIA debe hacer visible este beneficio para que la adopción sea genuina.

**Ganan competencia técnica certificada internacionalmente.** EQE1 al 100% de los docentes. EQE2 al top 30%. EQE3 al núcleo de 8 a 20 líderes. Y para algunos, las certificaciones complementarias UEQ, EQAC y BPC. Esto no son cursos sueltos — son credenciales internacionales reconocidas por Six Seconds que el docente lleva en su currículum profesional para toda la vida.

**Ganan vocabulario propio para gestionar su práctica emocionalmente.** El docente promedio en Ecuador (y en cualquier país) recibió formación pedagógica pero NO recibió formación emocional sistemática. Cuando un estudiante grita en su aula, opera por intuición. EmoPower le da un sistema operativo: el modelo KCG, el método Self-Science de seis pasos, los protocolos de tres niveles, la rúbrica de observación. Su práctica se profesionaliza.

**Ganan acompañamiento personalizado mensual.** Cada docente tiene un Quality Coach que lo visita en aula, le devuelve evidencias específicas, co-construye con él mejoras concretas. Esto NO es supervisión administrativa que califica para retener o despedir. Es acompañamiento técnico que ayuda a crecer. La diferencia es clave y debe estar protegida en ROWIIA: los datos del QC NO se cruzan con la evaluación formal de desempeño del docente. Si se mezclan, los docentes esconden problemas y el QC pierde su rol.

**Ganan una comunidad de práctica.** El aislamiento del docente es uno de los grandes problemas del sistema educativo. Tres veces al mes (semana 3) el docente se encuentra con sus pares facilitados por el QC. Habla de su aula. Escucha otras aulas. Co-diseña. Esto reduce burnout en porcentajes significativos según los estudios.

**Ganan su propio reporte SEI confidencial.** El docente conoce sus propias fortalezas y áreas de crecimiento emocional. No el colegio. Él. Es un regalo profesional que se lleva.

**Ganan reducción medible de agotamiento.** Los estudios de Six Seconds muestran reducción del 30% en escalas de burnout profesional en docentes activos en el programa. ROWIIA puede tracking esto longitudinalmente.

## Capítulo 10. Qué ganan los Quality Coaches

Los Quality Coaches son típicamente profesionales del DECE de cada institución (en Ecuador) o equivalentes. Profesionales que ya estaban en el sistema pero que tradicionalmente operan en modo reactivo (atender al estudiante en crisis, mediar conflictos, intervenir cuando algo estalla). EmoPower los transforma en agentes proactivos del cambio sistémico.

**Ganan rol estratégico, no solo reactivo.** Su trabajo deja de ser apagar incendios y se convierte en construir capacidad. Esto cambia la naturaleza misma de su trabajo profesional.

**Ganan certificación internacional EQE2 + EQAC.** Credenciales que hasta entonces no estaban a su alcance, y que valen mucho en el mercado profesional educativo.

**Ganan supervisión técnica permanente.** Nunca están solos. Brain Up los acompaña semanalmente. Six Seconds está disponible para casos complejos. Esto es algo que los profesionales del DECE rara vez tienen en el sistema tradicional.

**Ganan herramientas digitales profesionales.** ROWIIA les da rúbricas, plantillas, dashboards, repositorios. Su trabajo se profesionaliza al nivel de cualquier consultoría internacional.

**Ganan datos de su trabajo.** Cuántos docentes han crecido, en qué dimensiones, qué casos complejos resolvieron, qué comunidades de práctica facilitaron. Construyen evidencia objetiva de su impacto profesional.

## Capítulo 11. Qué gana el directivo y la institución

El director o rector del colegio recibe algo que rara vez tiene: datos objetivos sobre el clima emocional de su institución, comparables con benchmarks internacionales y con otros colegios del sistema.

**Ganan radiografía objetiva del clima.** El EVS no es opinión. Es medición. El directivo sabe dónde está su escuela en seguridad emocional, conexión, pertenencia y propósito. Sabe si mejoró Ola 1 vs Ola 3. Sabe qué dimensiones requieren atención.

**Ganan reducción de conflictos disciplinarios.** Reportes históricos de 25% a 40% de reducción en incidentes Nivel 2 y 3. Esto es tiempo de gestión recuperado para temas estratégicos.

**Ganan satisfacción de familias mejorada.** +20% en NPS institucional medido. Esto se traduce en retención, en referidos, en valoración de la marca del colegio.

**Ganan equipo docente más sólido.** Burnout reducido, capacidad profesionalizada, rotación más baja, equipo cohesionado por comunidades de práctica.

**Ganan posicionamiento competitivo.** Un colegio EmoPower certificado tiene un diferenciador real en el mercado educativo ecuatoriano frente a otros colegios que solo dicen "trabajamos lo emocional" sin sistema operativo detrás.

**Ganan plan estratégico SEL Año 2 y 3.** No reciben un servicio que termina al año 1. Reciben una hoja de ruta de crecimiento de tres años que pueden compartir con su consejo directivo, sus dueños o sus autoridades distritales.

## Capítulo 12. Qué gana el sistema educativo a nivel macro

Si EmoPower opera a nivel sistémico (un distrito, una región, todo el país), las ganancias se amplifican exponencialmente.

**Ganan capacidad técnica nacional permanente.** Quinientos, mil o cinco mil docentes certificados EQE1. Cientos en EQE2. Decenas en EQE3. Esto es un activo nacional que NO desaparece cuando termina el contrato. Es transferencia técnica real.

**Ganan datos para política pública basada en evidencia.** El sistema deja de operar SEL por intuición o por presión política. Tiene datos comparativos por región, por nivel socioeconómico, por tipo de gestión, por modalidad. Puede decidir dónde invertir y dónde no con argumentos objetivos.

**Ganan reducción de demanda en sistemas de salud mental.** Estudios internacionales muestran que sistemas con SEL bien implementado reducen la demanda de servicios de salud mental infantil y adolescente entre 15% y 25%. Esto se traduce en ahorro fiscal directo en el presupuesto de salud pública.

**Ganan mejora en rendimiento académico nacional.** La correlación está documentada: +5 a 11 percentiles. En pruebas estandarizadas nacionales o internacionales (Ser Bachiller en Ecuador, PISA en el rango regional), esto puede mover indicadores país.

**Ganan capacidad de mostrar resultados.** Cada año, el sistema puede publicar un Informe de Impacto SEL con datos verificables. Esto es activo político, comunicacional y de gestión.

## Capítulo 13. Qué oportunidad real existe para ROWIIA

ROWIIA no es una plataforma educativa más. ROWIIA puede ser la primera plataforma latinoamericana que opera SEL a nivel sistémico con respaldo metodológico Six Seconds. Esto tiene implicancias estratégicas enormes.

**Diferenciación competitiva absoluta.** Hay plataformas EdTech para gestión académica, para tareas, para comunicación con padres. No hay plataformas SEL sistémicas con metodología internacional certificada. Este es un océano azul con barreras de entrada altas (la metodología Six Seconds no es replicable sin licencia).

**Mercado verificado y creciente.** Ecuador tiene 3,109 instituciones particulares con 794,279 estudiantes. Si ROWIIA captura el 10% del mercado privado ecuatoriano en tres años, son 80,000 estudiantes en la plataforma. Y eso es solo Ecuador, solo privadas. El mercado regional latinoamericano es exponencialmente más grande, y el público (gobiernos, ministerios) más grande aún.

**Modelo de ingresos multi-stream.** Licencias institucionales anuales por colegio. Licencias sistémicas para gobiernos. Servicios premium de analytics avanzados. Marketplace de recursos pedagógicos. Certificaciones digitales reconocidas. Cada uno de estos es un stream válido.

**Producto que se vende solo.** Cuando un colegio EmoPower-Brain Up entra al programa, ROWIIA se vuelve OBLIGATORIA para operar bien. No es upsell — es infraestructura del programa. La adopción está garantizada por la lógica del producto principal.

**Datos como activo estratégico.** A medida que ROWIIA crece, acumula el mayor dataset socioemocional de habla hispana en escuelas. Este dataset tiene valor de investigación (academia, organismos internacionales como UNICEF, BID, UNESCO), valor de benchmarking (otros sistemas educativos quieren comparar) y valor predictivo (machine learning para identificar señales tempranas de problemas).

## Capítulo 14. Funcionalidades núcleo que ROWIIA debe priorizar para el MVP

Si tuviera que construir ROWIIA en fases, las funcionalidades núcleo del primer MVP serían las que sostienen el ciclo mensual del Quality Coach, porque ahí está el corazón operativo del programa.

**MVP versión 1.0** debería incluir el módulo de observación digital de aula con rúbrica en tres dimensiones, el módulo de devolución 1:1 con captura de compromisos firmados, el módulo de comunidad de práctica para gestión de los encuentros grupales, el módulo de supervisión técnica QC ↔ Brain Up, los dashboards diferenciados por rol (docente, QC, directivo, coordinador Brain Up), y la aplicación digital de EVS con generación automatizada de reportes institucionales.

**La versión 2.0** sumaría el journal digital del estudiante con privacidad absoluta, el banco de lecciones Self-Science por banda, el repositorio de SEL embebido por materia, las notificaciones automatizadas a familias, y la integración con el Pop-Up Festival global.

**La versión 3.0** traería los analytics avanzados con inteligencia artificial sobre los reportes cualitativos del QC, los modelos predictivos de identificación temprana de casos en riesgo, la integración con sistemas administrativos del colegio, las certificaciones digitales blockchain de docentes, y los dashboards estratégicos para autoridades sistémicas.

Cada fase del producto debe poder venderse independientemente como mejora del programa, pero las tres juntas componen la plataforma completa que hace de EmoPower Schools un sistema realmente escalable.

## Capítulo 15. Por qué este es el momento

El bienestar emocional en escuelas dejó de ser tema marginal hace una década. Es agenda nacional en 27 países. Es exigencia de las familias. Es preocupación de las autoridades. Es discurso de los colegios. Pero entre el discurso y la operación hay un abismo enorme. Nadie está cerrando ese abismo con plataforma tecnológica seria, metodología internacional certificada y operación local profesional.

Six Seconds tiene la metodología. Brain Up tiene la operación territorial. EmoPower Schools tiene el modelo escalable. Y ROWIIA puede tener la plataforma. Las cuatro piezas juntas componen un sistema que ningún competidor regional tiene completo.

Este documento sirve para que ROWIIA diseñe la plataforma con conocimiento total del programa que va a sostener. Cada funcionalidad descrita responde a una necesidad real verificada en la operación. Cada rol descrito tiene un dolor real que resolver. Cada dato descrito tiene un usuario específico que lo necesita.

ROWIIA puede convertirse en el sistema nervioso digital del bienestar emocional escolar en Latinoamérica. Este es el proyecto.
