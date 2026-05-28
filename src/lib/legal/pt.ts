// src/lib/legal/pt.ts
// ============================================================
// CONTEÚDO LEGAL — PORTUGUÊS
// Tradução derivada de es.ts (LEGAL_ES, master / fonte de verdade).
// Manter estrutura, chaves, ordem das seções e lastUpdated em sincronia com es.ts.
// ============================================================

import type { LegalDocSet } from "./types";

const LAST_UPDATED = "2026-05-28";

export const LEGAL_PT: LegalDocSet = {
  privacy: {
    title: "Política de Privacidade",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Esta Política de Privacidade descreve como a Rowi coleta, usa, compartilha e protege seus dados pessoais. A Rowi opera a plataforma de Emotional Budgeting e Vital Signs baseada na metodologia Six Seconds. Sua privacidade é um princípio central do nosso produto, não uma formalidade.",
    sections: [
      {
        heading: "1. Quem é responsável pelos seus dados",
        body: [
          "A Rowi, com operações geridas a partir do Peru, é a responsável pelo tratamento dos dados pessoais que coleta por meio desta plataforma para usuários individuais.",
          "Quando você usa a Rowi como parte da sua empresa, instituição educacional ou organização (conta B2B), essa organização é a responsável pelo tratamento (controladora) dos seus dados, e a Rowi atua como operadora do tratamento (processadora) seguindo suas instruções. Nesse caso, as políticas de privacidade da sua organização também se aplicam.",
          "A Six Seconds é uma entidade independente que fornece a metodologia científica (SEI, Brain Talents, Vital Signs) e dados de referência (benchmark). A Six Seconds não é responsável pela operação desta plataforma. Veja o 'Aviso sobre a Six Seconds' para mais detalhes.",
        ],
      },
      {
        heading: "2. Quais dados coletamos",
        body: [
          "- Dados de conta: nome, e-mail, idioma preferido, país, foto de perfil.",
          "- Dados de medição emocional: respostas a avaliações (Vital Signs, pulse points), competências SEI, Brain Talents, debriefs.",
          "- Dados de relacionamentos: vínculos familiares, relações de trabalho (gestor/subordinados), engagements de serviço que você declarar.",
          "- Dados técnicos: endereço IP, tipo de dispositivo, navegador, logs de acesso.",
          "- Dados de pagamento: geridos pela Stripe; a Rowi não armazena números de cartão.",
        ],
      },
      {
        heading: "3. Para que usamos seus dados (bases legais)",
        body: [
          "- Prestar o serviço (execução do contrato): mostrar suas medições, gerar relatórios, habilitar as funções que você ativa.",
          "- Melhorar o produto e a pesquisa (interesse legítimo e/ou consentimento explícito): refinar o modelo BE2GROW e os frameworks. O uso para pesquisa é regido pelo 'Aviso de Pesquisa' e requer seu consentimento explícito e revogável.",
          "- Comunicações transacionais (execução do contrato): confirmações, convites, lembretes.",
          "- Cumprimento legal e segurança (obrigação legal e interesse legítimo).",
        ],
      },
      {
        heading: "4. Uso de dados para pesquisa",
        body: [
          "A Rowi é também uma plataforma de pesquisa sobre inteligência emocional. Seus dados podem contribuir para refinar nossos modelos, SEMPRE sob salvaguardas:",
          "- Consentimento explícito e separado do uso básico do produto. Você pode revogá-lo a qualquer momento.",
          "- Anonimização ou pseudonimização antes de qualquer análise agregada.",
          "- Regra de N≥5: nenhum dado agregado de equipe ou organização é exibido se houver menos de 5 pessoas, para evitar reidentificação.",
          "- Cinco níveis de visibilidade: pessoal, agregado de equipe, agregado de organização, comunidade pública e lente de pesquisa.",
          "- Toda consulta de pesquisa fica registrada em uma auditoria de acessos (ResearchAccessAudit).",
          "Veja o 'Aviso de Pesquisa' para o detalhe completo e o fluxo de consentimento.",
        ],
      },
      {
        heading: "5. Com quem compartilhamos dados",
        body: [
          "- Provedores de serviço (operadores): Stripe (pagamentos), Resend (e-mail), provedores de infraestrutura (Vercel, Neon), sob contratos de tratamento de dados.",
          "- Six Seconds: em seu papel de parceira metodológica e científica, pode acessar dados anonimizados/agregados para fins de pesquisa, conforme o nível de visibilidade 'six_seconds_team' e sempre sob auditoria.",
          "- Sua organização: se você usa uma conta B2B, os dados agregados (N≥5) podem ser visíveis para administradores da sua organização conforme o papel.",
          "- Nunca vendemos seus dados pessoais.",
        ],
      },
      {
        heading: "6. Transferências internacionais",
        body: [
          "A Rowi opera com infraestrutura que pode processar dados fora do seu país de residência. Aplicamos como piso de proteção o Regulamento Geral de Proteção de Dados da UE (GDPR), adaptado por jurisdição (Peru: Lei N° 29733; Equador: LOPDP). Quando entrarmos em mercados com requisitos de residência de dados (por exemplo, China sob a PIPL), implementaremos as medidas correspondentes.",
        ],
      },
      {
        heading: "7. Seus direitos",
        body: [
          "Você tem o direito de: acessar seus dados, retificá-los, suprimi-los, opor-se ao seu tratamento, solicitar a portabilidade e revogar consentimentos.",
          "Você pode exercer a maioria desses direitos diretamente na seção de Privacidade da sua conta, incluindo a exportação dos seus dados.",
          "Para solicitações adicionais, escreva para privacidad@rowiia.com.",
        ],
      },
      {
        heading: "8. Retenção",
        body: [
          "Conservamos seus dados enquanto sua conta estiver ativa e pelo período necessário para cumprir obrigações legais. Ao excluir sua conta, seus dados pessoais são excluídos ou anonimizados, salvo o que devamos conservar por lei.",
        ],
      },
      {
        heading: "9. Segurança",
        body: [
          "Aplicamos criptografia em trânsito e em repouso para dados sensíveis, controle de acesso por papéis e registro de auditoria. Nenhum sistema é 100% infalível, mas tratamos a segurança como prioridade.",
        ],
      },
      {
        heading: "10. Contato",
        body: [
          "Responsável: Rowi, com operações geridas a partir do Peru. Contato de privacidade: privacidad@rowiia.com. Para consultas legais: legal@rowiia.com.",
        ],
      },
    ],
  },

  terms: {
    title: "Termos de Serviço",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Estes Termos regem o uso da plataforma Rowi. Ao criar uma conta ou usar o serviço, você aceita estes Termos.",
    sections: [
      {
        heading: "1. Quem somos",
        body: [
          "A Rowi é uma plataforma de Emotional Budgeting e Vital Signs baseada na metodologia Six Seconds, com operações geridas a partir do Peru. A Rowi é uma entidade independente, única responsável pela operação desta plataforma.",
        ],
      },
      {
        heading: "2. Uso do serviço",
        body: [
          "Você deve ser maior de idade ou ter autorização do seu representante legal. Você é responsável pela veracidade dos dados que insere e por manter a confidencialidade das suas credenciais.",
          "Você não pode usar a Rowi para fins ilícitos, para violar a privacidade de terceiros, nem para extrair dados de forma automatizada sem autorização.",
        ],
      },
      {
        heading: "3. Propriedade intelectual",
        body: [
          "A metodologia Six Seconds (SEI, Brain Talents, Vital Signs e marcas associadas) é propriedade da Six Seconds e é usada sob licença/aliança. 'Six Seconds' é uma marca registrada de seu titular e não é traduzida nem usada fora dos termos dessa licença.",
          "O software, design e implementação da plataforma Rowi são propriedade da Rowi. Você não adquire nenhum direito sobre eles além do uso do serviço.",
        ],
      },
      {
        heading: "4. Não é aconselhamento profissional",
        body: [
          "A Rowi é uma ferramenta de desenvolvimento e medição de inteligência emocional. NÃO substitui aconselhamento médico, psicológico, psiquiátrico nem terapêutico. Se você estiver passando por uma crise, contate um profissional de saúde ou uma linha de ajuda. As funções de detecção de crise escalam sinais, mas não constituem atendimento clínico.",
        ],
      },
      {
        heading: "5. Pagamentos e assinaturas",
        body: [
          "Os planos pagos são geridos por meio da Stripe. As assinaturas são renovadas automaticamente, salvo cancelamento. Você pode gerenciar ou cancelar sua assinatura a partir da sua conta. Os reembolsos são regidos pela política vigente no momento da compra.",
        ],
      },
      {
        heading: "6. Limitação de responsabilidade",
        body: [
          "A Rowi é fornecida 'como está'. Na máxima medida permitida pela lei, a Rowi não será responsável por danos indiretos, incidentais ou consequentes decorrentes do uso do serviço.",
          "A Rowi é responsável unicamente pela operação da sua própria plataforma. A Six Seconds, como fornecedora de metodologia e entidade independente, não é responsável pela operação, disponibilidade nem pelas decisões de tratamento de dados da plataforma Rowi.",
        ],
      },
      {
        heading: "7. Suspensão e rescisão",
        body: [
          "Podemos suspender ou encerrar contas que violem estes Termos. Você pode encerrar sua conta a qualquer momento nas configurações.",
        ],
      },
      {
        heading: "8. Lei aplicável e arbitragem",
        body: [
          "Estes Termos são regidos pelas leis da República do Peru.",
          "Toda controvérsia decorrente destes Termos será resolvida de maneira definitiva por meio de arbitragem de direito, com sede em Lima, Peru, administrada conforme o regulamento do centro de arbitragem correspondente. A arbitragem será conduzida em espanhol perante um árbitro único.",
        ],
      },
      {
        heading: "9. Alterações",
        body: [
          "Podemos atualizar estes Termos. Notificaremos você sobre as alterações materiais. O uso continuado após a notificação implica aceitação.",
        ],
      },
    ],
  },

  "six-seconds": {
    title: "Aviso sobre a Six Seconds",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Este aviso esclarece a relação entre a Rowi e a Six Seconds, e a separação de responsabilidades entre ambas as entidades.",
    sections: [
      {
        heading: "1. Entidades independentes",
        body: [
          "A Rowi, com operações geridas a partir do Peru, e a Six Seconds são entidades legalmente independentes.",
          "A Rowi opera sua plataforma em aliança com a Six Seconds, utilizando sua metodologia e dados de referência sob licença. Cada entidade mantém sua própria personalidade jurídica e responde de forma independente por suas respectivas obrigações.",
        ],
      },
      {
        heading: "2. Papel da Six Seconds",
        body: [
          "A Six Seconds fornece: a metodologia científica (SEI — as 8 competências de inteligência emocional, os 18 Brain Talents, o framework Vital Signs), dados de referência (benchmark) e orientação científica.",
          "Six Seconds é uma marca registrada de seu titular. A Rowi a usa conforme os termos da sua licença/aliança e não a traduz.",
        ],
      },
      {
        heading: "3. Respeito às políticas da Six Seconds",
        body: [
          "A Rowi se compromete a respeitar as políticas de privacidade e uso de dados da Six Seconds aplicáveis à metodologia e dados que ela fornece. Qualquer acesso da Six Seconds a dados da plataforma se limita a informação anonimizada/agregada com fins de pesquisa e sob auditoria.",
        ],
      },
      {
        heading: "4. Responsabilidade",
        body: [
          "A Rowi é a única responsável pela operação desta plataforma: disponibilidade, segurança, atendimento aos usuários e decisões de tratamento de dados pessoais dos usuários.",
          "A Six Seconds, como fornecedora de metodologia e entidade independente, não é responsável pela operação da plataforma Rowi nem pelo tratamento de dados que a Rowi realiza como responsável.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de Cookies",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Usamos cookies e tecnologias similares para operar a plataforma e, com seu consentimento, para análise.",
    sections: [
      {
        heading: "1. O que são cookies",
        body: [
          "Os cookies são pequenos arquivos que se guardam no seu dispositivo para lembrar informações entre visitas.",
        ],
      },
      {
        heading: "2. Categorias que usamos",
        body: [
          "- Essenciais: necessárias para iniciar sessão e manter sua sessão segura. Não requerem consentimento.",
          "- Funcionais: lembram preferências como idioma e contexto ativo.",
          "- Analíticas: nos ajudam a entender o uso da plataforma (por exemplo, Google Analytics). Só são ativadas com seu consentimento.",
        ],
      },
      {
        heading: "3. Seu controle",
        body: [
          "Ao entrar, mostramos um banner para aceitar, rejeitar ou configurar os cookies não essenciais. Você pode mudar sua escolha a qualquer momento. Se rejeitar as analíticas, não carregamos esses scripts.",
        ],
      },
    ],
  },

  research: {
    title: "Aviso de Pesquisa e Consentimento",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "A Rowi é também uma plataforma de pesquisa sobre inteligência emocional, em colaboração com a Six Seconds. Este aviso explica como os dados são usados para pesquisa e como você controla sua participação.",
    sections: [
      {
        heading: "1. Participação voluntária e revogável",
        body: [
          "O uso dos seus dados para pesquisa é opcional e requer seu consentimento explícito, separado do uso básico do produto. Você pode concedê-lo ou revogá-lo a qualquer momento nas configurações de privacidade, sem afetar seu acesso ao serviço.",
        ],
      },
      {
        heading: "2. Quais dados e como são protegidos",
        body: [
          "Para pesquisa usamos dados de medição emocional (Vital Signs, competências SEI, Brain Talents, debriefs) de forma anonimizada ou pseudonimizada.",
          "Regra de N≥5: nenhum resultado agregado é publicado ou exibido se representar menos de 5 pessoas.",
          "O modelo BE2GROW (relação entre pulse points, competências SEI e Brain Talents) é uma hipótese em calibração; suas contribuições ajudam a refiná-lo, sempre de forma agregada e anonimizada.",
        ],
      },
      {
        heading: "3. Níveis de visibilidade",
        body: [
          "- Pessoal: somente você vê seus dados individuais.",
          "- Agregado de equipe (N≥5): visível para sua equipe, sem identificar indivíduos.",
          "- Agregado de organização (N≥5): visível em nível organizacional, sem identificar indivíduos.",
          "- Comunidade pública: estatísticas anônimas da comunidade.",
          "- Lente de pesquisa: acesso restrito e auditado para fins científicos.",
        ],
      },
      {
        heading: "4. Quem acessa a lente de pesquisa",
        body: [
          "O acesso de pesquisa é concedido por níveis definidos e é sempre registrado em uma auditoria (ResearchAccessAudit): equipe fundadora da Rowi, liderança científica, equipes da Rowi e da Six Seconds (sobre dados anonimizados) e pessoas que você convide explicitamente (seu coach ou mentor).",
        ],
      },
      {
        heading: "5. Seus direitos sobre a pesquisa",
        body: [
          "Você pode revogar seu consentimento, solicitar que seus dados deixem de ser usados em análises futuras e consultar o registro de quem acessou seus dados. A revogação não afeta análises já anonimizadas e irreversíveis.",
        ],
      },
    ],
  },
};
