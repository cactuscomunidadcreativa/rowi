// src/lib/legal/it.ts
// ============================================================
// CONTENUTO LEGALE — ITALIANO
// Traduzione derivata da es.ts (LEGAL_ES, master / fonte di verità).
// Mantenere struttura, chiavi, ordine delle sezioni e lastUpdated in sincronia con es.ts.
// ============================================================

import type { LegalDocSet } from "./types";

const LAST_UPDATED = "2026-05-28";

export const LEGAL_IT: LegalDocSet = {
  privacy: {
    title: "Informativa sulla Privacy",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Questa Informativa sulla Privacy descrive come Rowi raccoglie, usa, condivide e protegge i tuoi dati personali. Rowi gestisce la piattaforma di Emotional Budgeting e Vital Signs basata sulla metodologia Six Seconds. La tua privacy è un principio centrale del nostro prodotto, non una formalità.",
    sections: [
      {
        heading: "1. Chi è responsabile dei tuoi dati",
        body: [
          "Rowi, con operazioni gestite dal Perù, è il titolare del trattamento dei dati personali che raccoglie attraverso questa piattaforma per gli utenti individuali.",
          "Quando usi Rowi come parte della tua azienda, istituzione educativa o organizzazione (account B2B), tale organizzazione è il titolare del trattamento (controller) dei tuoi dati, e Rowi agisce come responsabile del trattamento (processor) seguendo le sue istruzioni. In tal caso, si applicano anche le politiche sulla privacy della tua organizzazione.",
          "Six Seconds è un'entità indipendente che fornisce la metodologia scientifica (SEI, Brain Talents, Vital Signs) e i dati di riferimento (benchmark). Six Seconds non è responsabile del funzionamento di questa piattaforma. Vedi l''Avviso su Six Seconds' per maggiori dettagli.",
        ],
      },
      {
        heading: "2. Quali dati raccogliamo",
        body: [
          "- Dati dell'account: nome, indirizzo e-mail, lingua preferita, paese, foto del profilo.",
          "- Dati di misurazione emotiva: risposte alle valutazioni (Vital Signs, pulse points), competenze SEI, Brain Talents, debrief.",
          "- Dati relazionali: legami familiari, rapporti di lavoro (manager/collaboratori), engagement di servizio che dichiari.",
          "- Dati tecnici: indirizzo IP, tipo di dispositivo, browser, log di accesso.",
          "- Dati di pagamento: gestiti da Stripe; Rowi non memorizza i numeri di carta.",
        ],
      },
      {
        heading: "3. Per cosa usiamo i tuoi dati (basi legali)",
        body: [
          "- Fornire il servizio (esecuzione del contratto): mostrarti le tue misurazioni, generare report, abilitare le funzioni che attivi.",
          "- Migliorare il prodotto e la ricerca (interesse legittimo e/o consenso esplicito): perfezionare il modello BE2GROW e i framework. L'uso per ricerca è regolato dall''Avviso di Ricerca' e richiede il tuo consenso esplicito e revocabile.",
          "- Comunicazioni transazionali (esecuzione del contratto): conferme, inviti, promemoria.",
          "- Conformità legale e sicurezza (obbligo legale e interesse legittimo).",
        ],
      },
      {
        heading: "4. Uso dei dati per ricerca",
        body: [
          "Rowi è anche una piattaforma di ricerca sull'intelligenza emotiva. I tuoi dati possono contribuire a perfezionare i nostri modelli, SEMPRE con tutele:",
          "- Consenso esplicito e separato dall'uso di base del prodotto. Puoi revocarlo in qualsiasi momento.",
          "- Anonimizzazione o pseudonimizzazione prima di qualsiasi analisi aggregata.",
          "- Regola di N≥5: nessun dato aggregato di team od organizzazione viene mostrato se ci sono meno di 5 persone, per evitare la reidentificazione.",
          "- Cinque livelli di visibilità: personale, aggregato di team, aggregato di organizzazione, comunità pubblica e lente di ricerca.",
          "- Ogni query di ricerca viene registrata in un audit degli accessi (ResearchAccessAudit).",
          "Vedi l''Avviso di Ricerca' per il dettaglio completo e il flusso di consenso.",
        ],
      },
      {
        heading: "5. Con chi condividiamo i dati",
        body: [
          "- Fornitori di servizio (responsabili): Stripe (pagamenti), Resend (e-mail), fornitori di infrastruttura (Vercel, Neon), in base a contratti di trattamento dei dati.",
          "- Six Seconds: nel suo ruolo di partner metodologico e scientifico, può accedere a dati anonimizzati/aggregati per fini di ricerca, conformemente al livello di visibilità 'six_seconds_team' e sempre sotto audit.",
          "- La tua organizzazione: se usi un account B2B, i dati aggregati (N≥5) possono essere visibili agli amministratori della tua organizzazione in base al ruolo.",
          "- Non vendiamo mai i tuoi dati personali.",
        ],
      },
      {
        heading: "6. Trasferimenti internazionali",
        body: [
          "Rowi opera con un'infrastruttura che può elaborare dati al di fuori del tuo paese di residenza. Applichiamo come soglia minima di protezione il Regolamento Generale sulla Protezione dei Dati dell'UE (GDPR), adattato per giurisdizione (Perù: Legge N° 29733; Ecuador: LOPDP). Quando entreremo in mercati con requisiti di residenza dei dati (ad esempio, Cina sotto la PIPL), implementeremo le misure corrispondenti.",
        ],
      },
      {
        heading: "7. I tuoi diritti",
        body: [
          "Hai il diritto di: accedere ai tuoi dati, rettificarli, cancellarli, opporti al loro trattamento, richiedere la portabilità e revocare i consensi.",
          "Puoi esercitare la maggior parte di questi diritti direttamente dalla sezione Privacy del tuo account, inclusa l'esportazione dei tuoi dati.",
          "Per richieste aggiuntive, scrivi a privacidad@rowiia.com.",
        ],
      },
      {
        heading: "8. Conservazione",
        body: [
          "Conserviamo i tuoi dati finché il tuo account è attivo e per il periodo necessario ad adempiere agli obblighi legali. Quando elimini il tuo account, i tuoi dati personali vengono eliminati o anonimizzati, salvo quanto dobbiamo conservare per legge.",
        ],
      },
      {
        heading: "9. Sicurezza",
        body: [
          "Applichiamo la crittografia in transito e a riposo per i dati sensibili, il controllo degli accessi per ruoli e la registrazione di audit. Nessun sistema è infallibile al 100%, ma trattiamo la sicurezza come una priorità.",
        ],
      },
      {
        heading: "10. Contatto",
        body: [
          "Titolare: Rowi, con operazioni gestite dal Perù. Contatto per la privacy: privacidad@rowiia.com. Per richieste legali: legal@rowiia.com.",
        ],
      },
    ],
  },

  terms: {
    title: "Termini di Servizio",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Questi Termini regolano l'uso della piattaforma Rowi. Creando un account o usando il servizio, accetti questi Termini.",
    sections: [
      {
        heading: "1. Chi siamo",
        body: [
          "Rowi è una piattaforma di Emotional Budgeting e Vital Signs basata sulla metodologia Six Seconds, con operazioni gestite dal Perù. Rowi è un'entità indipendente, unica responsabile del funzionamento di questa piattaforma.",
        ],
      },
      {
        heading: "2. Uso del servizio",
        body: [
          "Devi essere maggiorenne o disporre dell'autorizzazione del tuo rappresentante legale. Sei responsabile della veridicità dei dati che inserisci e del mantenimento della riservatezza delle tue credenziali.",
          "Non puoi usare Rowi per fini illeciti, per violare la privacy di terzi, né per estrarre dati in modo automatizzato senza autorizzazione.",
        ],
      },
      {
        heading: "3. Proprietà intellettuale",
        body: [
          "La metodologia Six Seconds (SEI, Brain Talents, Vital Signs e marchi associati) è di proprietà di Six Seconds ed è usata in licenza/alleanza. 'Six Seconds' è un marchio registrato del suo titolare e non viene tradotto né usato al di fuori dei termini di tale licenza.",
          "Il software, il design e l'implementazione della piattaforma Rowi sono di proprietà di Rowi. Non acquisisci alcun diritto su di essi oltre all'uso del servizio.",
        ],
      },
      {
        heading: "4. Non è consulenza professionale",
        body: [
          "Rowi è uno strumento di sviluppo e misurazione dell'intelligenza emotiva. NON sostituisce la consulenza medica, psicologica, psichiatrica né terapeutica. Se stai attraversando una crisi, contatta un professionista della salute o una linea di aiuto. Le funzioni di rilevamento di crisi inoltrano segnali ma non costituiscono assistenza clinica.",
        ],
      },
      {
        heading: "5. Pagamenti e abbonamenti",
        body: [
          "I piani a pagamento sono gestiti tramite Stripe. Gli abbonamenti si rinnovano automaticamente salvo cancellazione. Puoi gestire o cancellare il tuo abbonamento dal tuo account. I rimborsi sono regolati dalla politica vigente al momento dell'acquisto.",
        ],
      },
      {
        heading: "6. Limitazione di responsabilità",
        body: [
          "Rowi è fornita 'così com'è'. Nella massima misura consentita dalla legge, Rowi non sarà responsabile per danni indiretti, incidentali o consequenziali derivanti dall'uso del servizio.",
          "Rowi è responsabile unicamente del funzionamento della propria piattaforma. Six Seconds, come fornitore di metodologia ed entità indipendente, non è responsabile del funzionamento, della disponibilità né delle decisioni di trattamento dei dati della piattaforma Rowi.",
        ],
      },
      {
        heading: "7. Sospensione e cessazione",
        body: [
          "Possiamo sospendere o chiudere account che violano questi Termini. Puoi chiudere il tuo account in qualsiasi momento dalle impostazioni.",
        ],
      },
      {
        heading: "8. Legge applicabile e arbitrato",
        body: [
          "Questi Termini sono regolati dalle leggi della Repubblica del Perù.",
          "Ogni controversia derivante da questi Termini sarà risolta in modo definitivo mediante arbitrato di diritto, con sede a Lima, Perù, amministrato conformemente al regolamento del centro di arbitrato corrispondente. L'arbitrato si svolgerà in spagnolo davanti a un arbitro unico.",
        ],
      },
      {
        heading: "9. Modifiche",
        body: [
          "Possiamo aggiornare questi Termini. Ti notificheremo le modifiche sostanziali. L'uso continuato dopo la notifica implica accettazione.",
        ],
      },
    ],
  },

  "six-seconds": {
    title: "Avviso su Six Seconds",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Questo avviso chiarisce il rapporto tra Rowi e Six Seconds, e la separazione delle responsabilità tra le due entità.",
    sections: [
      {
        heading: "1. Entità indipendenti",
        body: [
          "Rowi, con operazioni gestite dal Perù, e Six Seconds sono entità legalmente indipendenti.",
          "Rowi gestisce la sua piattaforma in alleanza con Six Seconds, utilizzando la sua metodologia e i dati di riferimento in licenza. Ciascuna entità mantiene la propria personalità giuridica e risponde in modo indipendente per le rispettive obbligazioni.",
        ],
      },
      {
        heading: "2. Ruolo di Six Seconds",
        body: [
          "Six Seconds fornisce: la metodologia scientifica (SEI — le 8 competenze di intelligenza emotiva, i 18 Brain Talents, il framework Vital Signs), i dati di riferimento (benchmark) e l'orientamento scientifico.",
          "Six Seconds è un marchio registrato del suo titolare. Rowi lo usa conformemente ai termini della sua licenza/alleanza e non lo traduce.",
        ],
      },
      {
        heading: "3. Rispetto delle politiche di Six Seconds",
        body: [
          "Rowi si impegna a rispettare le politiche di privacy e uso dei dati di Six Seconds applicabili alla metodologia e ai dati che fornisce. Qualsiasi accesso di Six Seconds ai dati della piattaforma è limitato a informazioni anonimizzate/aggregate a fini di ricerca e sotto audit.",
        ],
      },
      {
        heading: "4. Responsabilità",
        body: [
          "Rowi è l'unica responsabile del funzionamento di questa piattaforma: disponibilità, sicurezza, assistenza agli utenti e decisioni sul trattamento dei dati personali degli utenti.",
          "Six Seconds, come fornitore di metodologia ed entità indipendente, non è responsabile del funzionamento della piattaforma Rowi né del trattamento dei dati che Rowi effettua in qualità di titolare.",
        ],
      },
    ],
  },

  cookies: {
    title: "Politica sui Cookie",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Usiamo cookie e tecnologie simili per gestire la piattaforma e, con il tuo consenso, per l'analisi.",
    sections: [
      {
        heading: "1. Cosa sono i cookie",
        body: [
          "I cookie sono piccoli file che vengono salvati sul tuo dispositivo per ricordare informazioni tra una visita e l'altra.",
        ],
      },
      {
        heading: "2. Categorie che usiamo",
        body: [
          "- Essenziali: necessari per accedere e mantenere sicura la tua sessione. Non richiedono consenso.",
          "- Funzionali: ricordano preferenze come la lingua e il contesto attivo.",
          "- Analitici: ci aiutano a comprendere l'uso della piattaforma (ad esempio, Google Analytics). Si attivano solo con il tuo consenso.",
        ],
      },
      {
        heading: "3. Il tuo controllo",
        body: [
          "Quando accedi, ti mostriamo un banner per accettare, rifiutare o configurare i cookie non essenziali. Puoi cambiare la tua scelta in qualsiasi momento. Se rifiuti gli analitici, non carichiamo quegli script.",
        ],
      },
    ],
  },

  research: {
    title: "Avviso di Ricerca e Consenso",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Rowi è anche una piattaforma di ricerca sull'intelligenza emotiva, in collaborazione con Six Seconds. Questo avviso spiega come i dati vengono usati per la ricerca e come controlli la tua partecipazione.",
    sections: [
      {
        heading: "1. Partecipazione volontaria e revocabile",
        body: [
          "L'uso dei tuoi dati per la ricerca è opzionale e richiede il tuo consenso esplicito, separato dall'uso di base del prodotto. Puoi concederlo o revocarlo in qualsiasi momento dalle impostazioni di privacy, senza compromettere il tuo accesso al servizio.",
        ],
      },
      {
        heading: "2. Quali dati e come sono protetti",
        body: [
          "Per la ricerca usiamo dati di misurazione emotiva (Vital Signs, competenze SEI, Brain Talents, debrief) in modo anonimizzato o pseudonimizzato.",
          "Regola di N≥5: nessun risultato aggregato viene pubblicato o mostrato se rappresenta meno di 5 persone.",
          "Il modello BE2GROW (relazione tra pulse points, competenze SEI e Brain Talents) è un'ipotesi in calibrazione; i tuoi contributi aiutano a perfezionarlo, sempre in modo aggregato e anonimizzato.",
        ],
      },
      {
        heading: "3. Livelli di visibilità",
        body: [
          "- Personale: solo tu vedi i tuoi dati individuali.",
          "- Aggregato di team (N≥5): visibile al tuo team, senza identificare gli individui.",
          "- Aggregato di organizzazione (N≥5): visibile a livello organizzativo, senza identificare gli individui.",
          "- Comunità pubblica: statistiche anonime della comunità.",
          "- Lente di ricerca: accesso ristretto e sottoposto ad audit per fini scientifici.",
        ],
      },
      {
        heading: "4. Chi accede alla lente di ricerca",
        body: [
          "L'accesso di ricerca è concesso per livelli definiti ed è sempre registrato in un audit (ResearchAccessAudit): team fondatore di Rowi, leadership scientifica, team di Rowi e di Six Seconds (su dati anonimizzati) e persone che inviti esplicitamente (il tuo coach o mentore).",
        ],
      },
      {
        heading: "5. I tuoi diritti sulla ricerca",
        body: [
          "Puoi revocare il tuo consenso, richiedere che i tuoi dati non vengano più usati in analisi future e consultare il registro di chi ha avuto accesso ai tuoi dati. La revoca non riguarda le analisi già anonimizzate e irreversibili.",
        ],
      },
    ],
  },
};
