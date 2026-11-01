// Original practice prompts, not quotations or a clinical protocol.
const VOCAB_PACKS = [
  {name:'Körper wahrnehmen',entries:[
    ['Enge im Brustkorb','tightness in the chest','I notice some tightness in my chest.'],
    ['Ein Kloß im Hals','a lump in the throat','There is a lump in my throat.'],
    ['Was nehmen Sie gerade in Ihrem Körper wahr?','What are you noticing in your body right now?','Eine offene Frage nach der gegenwärtigen Wahrnehmung.'],
    ['Langsamer werden','to slow down',"Let's slow down for a moment."],
    ['Fühlt sich etwas anders an?','Does anything feel different?','Eine Veränderung darf auch ausbleiben.'],
    ['Den Boden unter den Füßen spüren','to feel the ground beneath your feet','Can you feel the ground beneath your feet?']
  ]},
  {name:'Kontakt halten',entries:[
    ['Sich zurückziehen','to withdraw','I tend to withdraw when someone gets close.'],
    ['Für sich einstehen','to speak up','It can be difficult to speak up for yourself.'],
    ['Habe ich Sie richtig verstanden?','Have I understood you correctly?','Einladung zur Korrektur.'],
    ['Können wir einen Moment dabei bleiben?','Can we stay with that for a moment?','Stay with something: bei einem Thema oder Erleben bleiben.'],
    ['Ich bin mir nicht sicher, wie ich das ausdrücken soll.','I am not sure how to put it into words.','To put something into words: etwas in Worte fassen.'],
    ['Was würde Ihnen gerade helfen?','What would help you right now?','Hilfreich für das Üben offener Gesprächsfragen.']
  ]},
  {name:'Wünsche klären',entries:[
    ['Was wünschen Sie sich für sich selbst?','What would you like for yourself?','Eine selbst formulierte Frage für das Sprachtraining.'],
    ['Was ist Ihnen daran wichtig?','What matters to you about that?','What matters: was wichtig ist oder Bedeutung hat.'],
    ['Sich nach Verbindung sehnen','to long for connection','I long for connection, but I also feel afraid.',[{text:'to yearn for connection',note:'Oft intensiver und gehobener.'}]],
    ['Freundlicher mit sich umgehen','to be kinder to yourself','What would it be like to be kinder to yourself?'],
    ['Was möchten Sie heute mitnehmen?','What would you like to take away from today?','To take away: hier eine Erkenntnis oder Erfahrung mitnehmen.'],
    ['Was wäre ein kleiner nächster Schritt?','What would be a small next step?','Ein Vorschlag zum Üben, kein vorgegebenes therapeutisches Vorgehen.']
  ]},
  {name:'Rahmen klären',entries:[
    ['Haben Sie gut hierhergefunden?','Did you find your way here okay?','Eine natürliche Frage zur Ankunft.'],
    ['Machen Sie es sich bequem.','Make yourself comfortable.','Einladung zu Beginn eines Gesprächs.'],
    ['Das Honorar','the fee','What is your fee for a session?'],
    ['Einen Termin verschieben','to reschedule an appointment','I need to reschedule our appointment.'],
    ['Eine Sitzung abschließen','to wrap up a session','We have a few minutes left to wrap up.'],
    ['Einen weiteren Termin vereinbaren','to schedule another appointment','Would you like to schedule another appointment?']
  ]},
  {name:'Gefühle unterscheiden',entries:[
    ['Verärgert / genervt','annoyed','I feel annoyed. Mildere Verärgerung.'],
    ['Frustriert','frustrated','I feel frustrated when I cannot make myself understood.'],
    ['Nachtragend / voller Groll','resentful','I feel resentful about how I was treated. Keine einfache Steigerungsstufe von annoyed.'],
    ['Verlegen','embarrassed','I felt embarrassed when everyone looked at me.'],
    ['Beschämt','ashamed','I felt ashamed of myself. Nicht in jedem Zusammenhang mit embarrassed austauschbar.'],
    ['Einsam','lonely','I can feel lonely even when other people are around.']
  ]},
  {name:'Freundlich nachfragen',entries:[
    ['Können Sie mir ein aktuelles Beispiel nennen?','Can you give me a recent example?','Recent bedeutet kürzlich geschehen.'],
    ['Was geschieht gerade in Ihnen?','What is happening inside you right now?','Eine eigene Formulierung für das Sprachtraining.'],
    ['Wie ist es für Sie, das auszusprechen?','What is it like for you to say that out loud?','Out loud: hörbar aussprechen.'],
    ['Passt diese Beschreibung für Sie?','Does that description fit for you?','Einladung zur Korrektur, keine Festlegung.'],
    ['Was verändert sich, wenn Sie das bemerken?','What changes when you notice that?','Die Frage lässt auch die Antwort zu, dass sich nichts verändert.'],
    ['Möchten Sie hier eine Pause machen?','Would you like to pause here?','Eine offene Einladung.']
  ]}
];
