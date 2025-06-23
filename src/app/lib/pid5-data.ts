// Dati del test PID-5 (Personality Inventory for DSM-5)

export interface PID5Question {
  id: number;
  text: string;
  reverse?: boolean; // Per gli item da invertire
}

export interface PID5Facet {
  id: string;
  name: string;
  items: number[];
}

export interface PID5Domain {
  id: string;
  name: string;
  facets: string[];
}

// Domande del PID-5
export const pid5Questions: PID5Question[] = [
  { id: 1, text: "Non traggo così tanto piacere dalle cose come gli altri sembrano trarne." },
  { id: 2, text: "Un sacco di gente ce l'ha con me." },
  { id: 3, text: "La gente mi descriverebbe come spericolato/a." },
  { id: 4, text: "Mi sento come se agissi completamente d'impulso." },
  { id: 5, text: "Spesso ho idee che sono troppo insolite per poterle spiegare a chiunque." },
  { id: 6, text: "Perdo il filo del discorso perché altre cose catturano la mia attenzione." },
  { id: 7, text: "Evito le situazioni rischiose.", reverse: true },
  { id: 8, text: "Quando si arriva alle mie emozioni, la gente mi dice che sono 'freddo/a come il marmo'." },
  { id: 9, text: "Modifico quello che faccio in base a quello che vogliono gli altri." },
  { id: 10, text: "Preferisco non entrare troppo in intimità con le persone." },
  { id: 11, text: "Spesso do inizio a scontri fisici." },
  { id: 12, text: "Sono terrorizzato/a dal restare senza qualcuno che mi ama." },
  { id: 13, text: "Essere scortese e ostile è proprio parte di ciò che sono." },
  { id: 14, text: "Faccio cose per essere certo che le persone mi notino." },
  { id: 15, text: "Solitamente faccio ciò che gli altri pensano che io dovrei fare." },
  { id: 16, text: "Solitamente faccio cose impulsivamente senza pensare a ciò che potrebbe accadere come conseguenza." },
  { id: 17, text: "Anche se avessi più buon senso, non riuscirei a smettere di prendere decisioni avventate." },
  { id: 18, text: "Talvolta le mie emozioni cambiano senza un valido motivo." },
  { id: 19, text: "Non m'importa nulla se faccio soffrire gli altri." },
  { id: 20, text: "Sto sulle mie." },
  { id: 21, text: "Spesso dico cose che gli altri trovano bizzarre o strane." },
  { id: 22, text: "Spesso faccio cose sull'impulso del momento." },
  { id: 23, text: "Nulla sembra interessarmi granché." },
  { id: 24, text: "Le altre persone sembrano considerare bizzarro il mio comportamento." },
  { id: 25, text: "Delle persone mi hanno detto che penso in modo davvero strano sulle cose." },
  { id: 26, text: "Non traggo quasi mai piacere dalla vita." },
  { id: 27, text: "Spesso mi sento come se nulla di ciò che faccio avesse importanza." },
  { id: 28, text: "Tratto male le persone quando fanno cose da poco che mi irritano." },
  { id: 29, text: "Non riesco a concentrarmi su alcunché." },
  { id: 30, text: "Sono una persona energica.", reverse: true },
  { id: 31, text: "Gli altri mi considerano irresponsabile." },
  { id: 32, text: "Quando mi serve, so essere cattivo." },
  { id: 33, text: "Spesso i miei pensieri se ne vanno in direzioni bizzarre o insolite." },
  { id: 34, text: "Mi è stato detto che impiego troppo tempo nell'assicurarmi che le cose siano esattamente al loro posto." },
  { id: 35, text: "Evito gli sport e le attività rischiose.", reverse: true },
  { id: 36, text: "Posso avere delle difficoltà a indicare la differenza tra i sogni e la vita reale." },
  { id: 37, text: "Talvolta ho la strana sensazione che parti del mio corpo sembrino come se fossero morte o come se non fossero mie." },
  { id: 38, text: "Mi arrabbio facilmente." },
  { id: 39, text: "Non ho limiti quando si tratta di fare cose pericolose." },
  { id: 40, text: "Per essere onesto, sono semplicemente più importante delle altre persone." },
  { id: 41, text: "Creo storie che si dà il caso che siano completamente false." },
  { id: 42, text: "La gente spesso dice che faccio delle cose di cui io non mi ricordo per nulla." },
  { id: 43, text: "Faccio delle cose affinché le persone debbano ammirarmi per forza." },
  { id: 44, text: "È strano, ma a volte oggetti usuali sembrano avere una forma diversa dalla solita." },
  { id: 45, text: "Non ho reazioni emotive verso le cose particolarmente durature." },
  { id: 46, text: "Mi riesce difficile interrompere un'attività, anche quando è il momento di farlo." },
  { id: 47, text: "Non sono bravo/a a fare piani per il futuro." },
  { id: 48, text: "Faccio un sacco di cose che gli altri considerano pericolose." },
  { id: 49, text: "La gente mi dice che mi focalizzo troppo su dettagli trascurabili." },
  { id: 50, text: "Mi preoccupo un sacco di essere solo/a." },
  { id: 51, text: "Mi sono perso/a delle cose perché ero impegnato nel cercare di svolgere quello che stavo facendo nel modo esatto." },
  { id: 52, text: "Spesso i miei pensieri non hanno senso per gli altri." },
  { id: 53, text: "Spesso invento delle cose su di me affinché mi aiutino a ottenere quello che voglio." },
  { id: 54, text: "Vedere che altre persone vengono ferite non mi tocca per nulla." },
  { id: 55, text: "Spesso la gente mi guarda come se avessi detto qualcosa di davvero bizzarro." },
  { id: 56, text: "Le persone non si rendono conto che le sto adulando per ottenere qualcosa." },
  { id: 57, text: "Piuttosto che essere solo/a, preferirei avere una relazione insoddisfacente." },
  { id: 58, text: "Di solito penso prima di agire.", reverse: true },
  { id: 59, text: "Spesso vedo delle immagini irreali molto vivide quando mi sto addormentando o mi sto svegliando." },
  { id: 60, text: "Continuo ad approcciare le cose allo stesso modo, anche quando questo non funziona." },
  { id: 61, text: "Sono insoddisfattissimo/a di me." },
  { id: 62, text: "Ho reazioni emotive più forti della maggior parte delle altre persone." },
  { id: 63, text: "Faccio quello che le altre persone mi dicono di fare." },
  { id: 64, text: "Non sopporto di essere lasciato da solo/a, anche per poche ore." },
  { id: 65, text: "Ho qualità eccezionali che pochi altri possiedono." },
  { id: 66, text: "Il futuro mi sembra davvero senza speranza." },
  { id: 67, text: "Mi piace assumermi dei rischi." },
  { id: 68, text: "Non riesco a raggiungere degli obiettivi perché altre cose catturano la mia attenzione." },
  { id: 69, text: "Quando voglio fare qualcosa di potenzialmente rischioso non permetto che questo mi fermi." },
  { id: 70, text: "Gli altri sembrano ritenere che io sia un po' strano o insolito." },
  { id: 71, text: "I miei pensieri sono strani e imprevedibili." },
  { id: 72, text: "Non m'importa dei sentimenti delle altre persone." },
  { id: 73, text: "Nella vita devi pestare i piedi a un po' di persone per ottenere quello che vuoi." },
  { id: 74, text: "Adoro ottenere l'attenzione delle altre persone." },
  { id: 75, text: "Faccio l'impossibile per evitare qualsiasi attività di gruppo." },
  { id: 76, text: "So essere subdolo/a se questo significa ottenere ciò che voglio." },
  { id: 77, text: "A volte, quando guardo un oggetto familiare, in qualche modo è come se lo vedessi per la prima volta." },
  { id: 78, text: "Mi riesce difficile passare da un'attività a un'altra." },
  { id: 79, text: "Mi preoccupo molto per cose terribili che potrebbero accadere." },
  { id: 80, text: "Ho difficoltà a cambiare il modo in cui sto facendo qualcosa anche se ciò che sto facendo non sta andando bene." },
  { id: 81, text: "Il mondo sarebbe senz'altro migliore se fossi morto/a." },
  { id: 82, text: "Mi tengo a distanza dalle persone." },
  { id: 83, text: "Spesso non riesco a controllare quello che penso." },
  { id: 84, text: "Non divento emotivo/a." },
  { id: 85, text: "Mi risento se mi si dice quello che devo fare, anche se sono i responsabili a farlo." },
  { id: 86, text: "Mi vergogno così tanto dei molti modi meschini con cui ho deluso le persone." },
  { id: 87, text: "Evito di fare qualsiasi cosa che possa essere anche solo un po' rischiosa.", reverse: true },
  { id: 88, text: "Ho difficoltà a perseguire scopi specifici anche solo per brevi periodi di tempo." },
  { id: 89, text: "Preferisco tenere il romanticismo fuori dalla mia vita." },
  { id: 90, text: "Non farei mai del male a un'altra persona.", reverse: true },
  { id: 91, text: "Non manifesto intensamente le emozioni." },
  { id: 92, text: "Sono molto irritabile." },
  { id: 93, text: "Spesso mi preoccupo che avverrà qualcosa di brutto a causa di errori che ho commesso in passato." },
  { id: 94, text: "Ho delle capacità insolite, come per esempio sapere esattamente ciò che uno sta pensando." },
  { id: 95, text: "Quando penso al futuro, divento molto preoccupato/a." },
  { id: 96, text: "Raramente mi preoccupo per qualcosa.", reverse: true },
  { id: 97, text: "Trovo piacevole essere innamorato/a.", reverse: true },
  { id: 98, text: "Preferisco andare sul sicuro piuttosto che assumermi dei rischi non necessari.", reverse: true },
  { id: 99, text: "Talvolta ho sentito cose che gli altri non erano in grado di sentire." },
  { id: 100, text: "Mi fisso su certe cose e non riesco a smettere." },
  { id: 101, text: "La gente mi dice che è difficile conoscere ciò che provo." },
  { id: 102, text: "Sono una persona altamente emotiva." },
  { id: 103, text: "Se solo potessero, gli altri si approfitterebbero di me." },
  { id: 104, text: "Spesso mi sento come un/una fallito/a." },
  { id: 105, text: "Se qualcosa che faccio non è assolutamente perfetta, semplicemente è inaccettabile." },
  { id: 106, text: "Spesso ho esperienze insolite, come avvertire la presenza di qualcuno che non c'è realmente." },
  { id: 107, text: "Sono bravo a far fare alle persone ciò che voglio che facciano." },
  { id: 108, text: "Interrompo le relazioni se iniziano a diventare intime." },
  { id: 109, text: "Mi preoccupo sempre di qualcosa." },
  { id: 110, text: "Mi preoccupo pressoché di tutto." },
  { id: 111, text: "Mi piace distinguermi dalla massa." },
  { id: 112, text: "Ogni tanto un po' di rischio non mi dispiace." },
  { id: 113, text: "Il mio comportamento è spesso spavaldo e cattura l'attenzione delle persone." },
  { id: 114, text: "Sono migliore pressoché di chiunque altro." },
  { id: 115, text: "Le persone si lamentano del mio bisogno di avere ogni cosa completamente organizzata." },
  { id: 116, text: "Mi assicuro sempre di vendicarmi delle persone che mi hanno fatto un torto." },
  { id: 117, text: "Sto sempre in guardia per qualcuno che prova a imbrogliarmi o a farmi del male." },
  { id: 118, text: "Trovo difficile mantenere la mia mente concentrata su ciò che è necessario fare." },
  { id: 119, text: "Parlo molto del suicidio." },
  { id: 120, text: "Non sono granché interessato/a ad avere relazioni sessuali." },
  { id: 121, text: "Persevero un sacco nelle cose." },
  { id: 122, text: "Divento emotivo/a facilmente, spesso per un motivo da poco." },
  { id: 123, text: "Insisto per la perfezione assoluta in tutto ciò che faccio, anche se questo fa impazzire le altre persone." },
  { id: 124, text: "Non mi sento quasi mai felice delle mie attività quotidiane." },
  { id: 125, text: "Sviolinare gli altri mi aiuta a ottenere ciò che voglio." },
  { id: 126, text: "A volte c'è bisogno di fare affermazioni esagerate per fare strada." },
  { id: 127, text: "Temo il restare solo nella vita più di qualsiasi altra cosa." },
  { id: 128, text: "Persevero nel fare le cose in un certo modo, anche quando è chiaro che non funzionerà." },
  { id: 129, text: "Spesso sono piuttosto noncurante delle mie e delle altrui cose." },
  { id: 130, text: "Sono una persona molto ansiosa." },
  { id: 131, text: "Le persone sono sostanzialmente degne di fiducia.", reverse: true },
  { id: 132, text: "Vengo distratto/a facilmente." },
  { id: 133, text: "Sembra che io venga sempre trattato/a ingiustamente dagli altri." },
  { id: 134, text: "Non esito a barare se questo può farmi fare strada." },
  { id: 135, text: "Controllo le cose diverse volte per assicurarmi che siano perfette." },
  { id: 136, text: "Non mi piace passare il tempo con gli altri." },
  { id: 137, text: "Mi sento obbligato/a a continuare le cose anche quando ha poco senso fare così." },
  { id: 138, text: "Non so mai dove andranno le mie emozioni da un momento all'altro." },
  { id: 139, text: "Ho visto cose che non c'erano realmente." },
  { id: 140, text: "Per me è importante che le cose siano fatte in un certo modo." },
  { id: 141, text: "Mi aspetto sempre che accada il peggio." },
  { id: 142, text: "Cerco sempre di dire la verità anche quando è difficile.", reverse: true },
  { id: 143, text: "Credo che alcune persone possano muovere gli oggetti usando la loro mente." },
  { id: 144, text: "Non riesco a concentrarmi sulle cose molto a lungo." },
  { id: 145, text: "Mi tengo alla larga dalle relazioni sentimentali." },
  { id: 146, text: "Non mi interessa fare amicizie." },
  { id: 147, text: "Quando tratto con le persone, dico il meno possibile." },
  { id: 148, text: "Sono una persona inutile." },
  { id: 149, text: "Farei pressoché di tutto per impedire a una persona di abbandonarmi." },
  { id: 150, text: "A volte riesco a influenzare le altre persone inviando loro i miei pensieri." },
  { id: 151, text: "La vita mi sembra piuttosto deprimente." },
  { id: 152, text: "Penso alle cose in modi talmente strani che per la maggior parte delle persone non hanno senso." },
  { id: 153, text: "Non m'importa se le mie azioni fanno del male agli altri." },
  { id: 154, text: "A volte mi sento 'controllato/a' da pensieri che appartengono a qualcun altro." },
  { id: 155, text: "Vivo la vita davvero appienissimo.", reverse: true },
  { id: 156, text: "Faccio promesse che non ho davvero intenzione di mantenere." },
  { id: 157, text: "Niente sembra farmi sentire bene." },
  { id: 158, text: "Vengo irritato/a facilmente da ogni sorta di cose." },
  { id: 159, text: "Faccio ciò che voglio senza badare a quanto possa essere pericoloso." },
  { id: 160, text: "Spesso dimentico di pagare i miei conti." },
  { id: 161, text: "Non mi piace entrare troppo in intimità con le persone." },
  { id: 162, text: "Sono bravo/a a raggirare le persone." },
  { id: 163, text: "Tutto mi sembra inutile." },
  { id: 164, text: "Non rischio mai.", reverse: true },
  { id: 165, text: "Divento emotivo/a per ogni cosa da poco." },
  { id: 166, text: "Se ferisco i sentimenti delle altre persone non è nulla di eccezionale." },
  { id: 167, text: "Non mostro mai le emozioni agli altri." },
  { id: 168, text: "Spesso mi sento proprio infelice." },
  { id: 169, text: "Non valgo nulla come persona." },
  { id: 170, text: "Di solito sono piuttosto ostile." },
  { id: 171, text: "Sono 'sparito/a' per evitare delle responsabilità." },
  { id: 172, text: "Mi è stato detto più di una volta che ho parecchie strane manie o abitudini." },
  { id: 173, text: "Mi piace essere una persona che viene notata." },
  { id: 174, text: "Sono sempre timoroso/a o nervoso/a per delle brutte cose che potrebbero verificarsi." },
  { id: 175, text: "Non voglio mai essere solo/a." },
  { id: 176, text: "Continuo a cercare di rendere le cose perfette, anche quando le ho fatte tanto bene quanto è verosimile farle." },
  { id: 177, text: "È raro che io abbia la sensazione che le persone che conosco stiano tentando di approfittarsi di me.", reverse: true },
  { id: 178, text: "So che prima o poi mi suiciderò." },
  { id: 179, text: "Ho avuto molto più successo pressoché di chiunque altro io conosca." },
  { id: 180, text: "So tirar fuori tutto il mio fascino se mi serve per averla vinta." },
  { id: 181, text: "Le mie emozioni sono imprevedibili." },
  { id: 182, text: "Non ho a che fare con le persone a meno che non sia necessario." },
  { id: 183, text: "Non mi interessano i problemi delle altre persone." },
  { id: 184, text: "Non reagisco molto a cose che sembrano rendere emotivi gli altri." },
  { id: 185, text: "Ho svariate abitudini che gli altri trovano eccentriche o strane." },
  { id: 186, text: "Evito gli eventi sociali." },
  { id: 187, text: "Merito un trattamento speciale." },
  { id: 188, text: "Mi fa davvero arrabbiare quando le persone mi offendono anche in modo trascurabile." },
  { id: 189, text: "Raramente mi entusiasmo per qualcosa." },
  { id: 190, text: "Sospetto che persino i miei cosiddetti 'amici' mi tradiscano molto." },
  { id: 191, text: "Bramo l'attenzione." },
  { id: 192, text: "Talvolta penso che qualcun altro stia sottraendo dei pensieri dalla mia testa." },
  { id: 193, text: "Ho periodi in cui mi sento disconnesso/a dal mondo o da me stesso/a." },
  { id: 194, text: "Spesso vedo delle connessioni insolite tra le cose che la maggior parte delle persone non nota." },
  { id: 195, text: "Quando sto facendo delle cose che potrebbero essere pericolose non penso alla possibilità di farmi male." },
  { id: 196, text: "Semplicemente non sopporto che le cose siano fuori dal loro posto corretto." },
  { id: 197, text: "Spesso devo avere a che fare con persone che sono meno importanti di me." },
  { id: 198, text: "Talvolta colpisco le persone per ricordare loro chi comanda." },
  { id: 199, text: "Vengo distolto/a da un compito anche da distrazioni trascurabili." },
  { id: 200, text: "Provo piacere a fare apparire stupide le persone in autorità." },
  { id: 201, text: "Se non sono in vena, salto gli appuntamenti o gli incontri." },
  { id: 202, text: "Cerco di fare ciò che gli altri vogliono che io faccia." },
  { id: 203, text: "Preferisco essere solo/a che avere un partner sentimentale intimo." },
  { id: 204, text: "Sono molto impulsivo." },
  { id: 205, text: "Spesso ho pensieri che per me hanno senso, ma che le altre persone dicono che sono strani." },
  { id: 206, text: "Uso le persone per ottenere ciò che voglio." },
  { id: 207, text: "Non vedo il senso di sentirmi in colpa su delle cose che ho fatto che hanno ferito altre persone." },
  { id: 208, text: "La maggior parte delle volte non vedo il senso di essere cordiale." },
  { id: 209, text: "Ho avuto alcune esperienze davvero strane che sono molto difficili da spiegare." },
  { id: 210, text: "Porto a compimento gli impegni.", reverse: true },
  { id: 211, text: "Mi piace attirare l'attenzione su di me." },
  { id: 212, text: "Molte volte mi sento in colpa." },
  { id: 213, text: "Spesso 'mi estraneo' e poi all'improvviso torno presente e mi rendo conto che è passato un sacco di tempo." },
  { id: 214, text: "Mi riesce facile mentire." },
  { id: 215, text: "Detesto correre rischi.", reverse: true },
  { id: 216, text: "Sono sgradevole e sgarbato/a con chiunque se lo meriti." },
  { id: 217, text: "Spesso le cose intorno a me sembrano irreali, o più reali del solito." },
  { id: 218, text: "Ingigantisco le cose se è a mio vantaggio." },
  { id: 219, text: "Mi riesce facile approfittare degli altri." },
  { id: 220, text: "Ho un modo rigoroso di fare le cose." }
];

// Facet del PID-5
export const pid5Facets: PID5Facet[] = [
  { id: "affettivita_ridotta", name: "Affettività ridotta", items: [8, 45, 84, 91, 101, 167, 184] },
  { id: "anedonia", name: "Anedonia", items: [1, 23, 26, 30, 124, 155, 157, 189] },
  { id: "angoscia_separazione", name: "Angoscia di separazione", items: [12, 50, 57, 64, 127, 149, 175] },
  { id: "ansia", name: "Ansia", items: [79, 93, 95, 96, 109, 110, 130, 141, 174] },
  { id: "convinzioni_esperienze_inusuali", name: "Convinzioni ed esperienze inusuali", items: [94, 99, 106, 139, 143, 150, 194, 209] },
  { id: "depressivita", name: "Depressività", items: [27, 61, 66, 81, 86, 104, 119, 148, 151, 163, 168, 169, 178, 212] },
  { id: "disregolazione_percettiva", name: "Disregolazione percettiva", items: [36, 37, 42, 44, 59, 77, 83, 154, 192, 193, 213, 217] },
  { id: "distraibilita", name: "Distraibilità", items: [6, 29, 47, 68, 88, 118, 132, 144, 199] },
  { id: "eccentricita", name: "Eccentricità", items: [5, 21, 24, 25, 33, 52, 55, 70, 71, 152, 172, 185, 205] },
  { id: "evitamento_intimita", name: "Evitamento dell'intimità", items: [89, 97, 108, 120, 145, 203] },
  { id: "grandiosita", name: "Grandiosità", items: [40, 65, 114, 179, 187, 197] },
  { id: "impulsivita", name: "Impulsività", items: [4, 16, 17, 22, 58, 204] },
  { id: "inganno", name: "Inganno", items: [41, 53, 56, 76, 126, 134, 142, 206, 214, 218] },
  { id: "insensibilita", name: "Insensibilità", items: [11, 13, 19, 54, 72, 73, 90, 153, 166, 183, 198, 200, 207, 208] },
  { id: "irresponsabilita", name: "Irresponsabilità", items: [31, 129, 156, 160, 171, 201, 210] },
  { id: "labilita_emotiva", name: "Labilità emotiva", items: [18, 62, 102, 122, 138, 165, 181] },
  { id: "manipolativita", name: "Manipolatività", items: [107, 125, 162, 180, 219] },
  { id: "ostilita", name: "Ostilità", items: [28, 32, 38, 85, 92, 116, 158, 170, 188, 216] },
  { id: "perfezionismo_rigido", name: "Perfezionismo rigido", items: [34, 49, 105, 115, 123, 135, 140, 176, 196, 220] },
  { id: "perseverazione", name: "Perseverazione", items: [46, 51, 60, 78, 80, 100, 121, 128, 137] },
  { id: "ricerca_attenzione", name: "Ricerca di attenzione", items: [14, 43, 74, 111, 113, 173, 191, 211] },
  { id: "ritiro", name: "Ritiro", items: [10, 20, 75, 82, 136, 146, 147, 161, 182, 186] },
  { id: "sospettosita", name: "Sospettosità", items: [2, 103, 117, 131, 133, 177, 190] },
  { id: "sottomissione", name: "Sottomissione", items: [9, 15, 63, 202] },
  { id: "tendenza_correre_rischi", name: "Tendenza a correre rischi", items: [3, 7, 35, 39, 48, 67, 69, 87, 98, 112, 159, 164, 195, 215] }
];

// Domini del PID-5
export const pid5Domains: PID5Domain[] = [
  { 
    id: "affettivita_negativa", 
    name: "Affettività negativa", 
    facets: ["labilita_emotiva", "ansia", "angoscia_separazione"] 
  },
  { 
    id: "distacco", 
    name: "Distacco", 
    facets: ["ritiro", "anedonia", "evitamento_intimita"] 
  },
  { 
    id: "antagonismo", 
    name: "Antagonismo", 
    facets: ["manipolativita", "inganno", "grandiosita"] 
  },
  { 
    id: "disinibizione", 
    name: "Disinibizione", 
    facets: ["irresponsabilita", "impulsivita", "distraibilita"] 
  },
  { 
    id: "psicoticismo", 
    name: "Psicoticismo", 
    facets: ["convinzioni_esperienze_inusuali", "eccentricita", "disregolazione_percettiva"] 
  }
];

// Istruzioni del test
export const pid5Instructions = `Questo è un elenco di affermazioni che persone differenti potrebbero fare a proposito di loro stesse. Siamo interessati a sapere in quale modo lei si descriverebbe. Non ci sono risposte "giuste" o "sbagliate". Quindi, cerchi di descriversi nel modo più sincero possibile; considereremo le sue risposte confidenziali. La invitiamo a usare tutto il tempo che le è necessario e a leggere attentamente ciascuna affermazione, scegliendo la risposta che la descrive nel modo migliore.`;

// Opzioni di risposta
export const pid5ResponseOptions = [
  { value: 0, label: "Sempre o spesso falso" },
  { value: 1, label: "Talvolta o abbastanza falso" },
  { value: 2, label: "Talvolta o abbastanza vero" },
  { value: 3, label: "Sempre o spesso vero" }
];

// Funzione per calcolare i punteggi
export function calculatePID5Scores(answers: { [key: number]: number }) {
  // Step 1: Inverti i punteggi degli item reverse
  const reversedAnswers = { ...answers };
  const reverseItems = [7, 30, 35, 58, 87, 90, 96, 97, 98, 131, 142, 155, 164, 177, 210, 215];
  
  reverseItems.forEach(itemId => {
    if (reversedAnswers[itemId] !== undefined) {
      reversedAnswers[itemId] = 3 - reversedAnswers[itemId];
    }
  });

  // Step 2: Calcola i punteggi delle facet
  const facetScores: { [key: string]: { raw: number, mean: number, items: number } } = {};
  
  pid5Facets.forEach(facet => {
    let sum = 0;
    let count = 0;
    
    facet.items.forEach(itemId => {
      if (reversedAnswers[itemId] !== undefined) {
        sum += reversedAnswers[itemId];
        count++;
      }
    });
    
    facetScores[facet.id] = {
      raw: sum,
      mean: count > 0 ? sum / count : 0,
      items: count
    };
  });

  // Step 3: Calcola i punteggi dei domini
  const domainScores: { [key: string]: { sum: number, mean: number } } = {};
  
  pid5Domains.forEach(domain => {
    let sum = 0;
    let count = 0;
    
    domain.facets.forEach(facetId => {
      if (facetScores[facetId]) {
        sum += facetScores[facetId].mean;
        count++;
      }
    });
    
    domainScores[domain.id] = {
      sum: sum,
      mean: count > 0 ? sum / count : 0
    };
  });

  return {
    facetScores,
    domainScores,
    reversedAnswers
  };
} 