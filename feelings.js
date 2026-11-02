/* Original examples. Keep the requested 55 learning targets in their given order. */
const FEELINGS_ROWS = [
  ['müde','tired','I feel tired after a long day.','Nach einem langen Tag fühle ich mich müde.','Allgemeine Müdigkeit; nicht zwingend kurz vor dem Einschlafen.'],
  ['wach','awake','I am still awake.','Ich bin noch wach.','Nicht schlafend; hellwach ist stärker.'],
  ['ohnmächtig (bewusstlos)','unconscious','She was unconscious for a few seconds.','Sie war einige Sekunden bewusstlos.','Körperlicher Zustand ohne Bewusstsein; nicht machtlos.'],
  ['ohnmächtig (machtlos)','powerless','I felt powerless to change the situation.','Ich fühlte mich machtlos, die Situation zu verändern.','Keine Möglichkeit, Einfluss zu nehmen; bei Bewusstsein.'],
  ['wütend','angry','I felt angry when he ignored me.','Ich war wütend, als er mich ignorierte.','Wut; annoyed bezeichnet eher Verärgerung oder Genervtheit.'],
  ['traurig','sad','I felt sad when it was time to leave.','Ich war traurig, als es Zeit war zu gehen.','Traurigkeit; nicht automatisch Trauer nach einem Verlust.'],
  ['Mitgefühl','compassion','She showed compassion for her friend.','Sie zeigte Mitgefühl für ihren Freund.','Substantiv: Anteilnahme an Leid und der Wunsch zu helfen; nicht bloßes Mitleid.'],
  ['liebevoll','loving','She has a loving relationship with her daughter.','Sie hat eine liebevolle Beziehung zu ihrer Tochter.','Adjektiv: Liebe oder Wärme ausdrückend; das Adverb lautet lovingly.'],
  ['Hass','hatred','His words were full of hatred.','Seine Worte waren voller Hass.','Substantiv für ein starkes Gefühl; to hate ist das Verb.',['hate']],
  ['erschöpft','exhausted','I am exhausted after the journey.','Nach der Reise bin ich erschöpft.','Sehr müde oder völlig ohne Energie; körperlich oder emotional.'],
  ['schläfrig','sleepy','I feel sleepy after lunch.','Nach dem Mittagessen bin ich schläfrig.','Zum Einschlafen geneigt; spezifischer als tired.',['drowsy']],
  ['hellwach','wide awake','I was wide awake at three in the morning.','Um drei Uhr morgens war ich hellwach.','Völlig wach, ohne Schläfrigkeit; zwei Wörter.'],
  ['entspannt','relaxed','I feel relaxed after a warm bath.','Nach einem warmen Bad fühle ich mich entspannt.','Körperlich oder innerlich ohne Anspannung.'],
  ['gelassen','calm','She stayed calm during the difficult conversation.','Sie blieb während des schwierigen Gesprächs gelassen.','Innerlich ruhig, auch in einer schwierigen Situation; nicht gleichgültig.'],
  ['unruhig','restless','I feel restless and cannot sit still.','Ich bin unruhig und kann nicht still sitzen.','Innere oder körperliche Unruhe; nicht automatisch Angst.'],
  ['angespannt','tense','I felt tense before the meeting.','Vor dem Treffen war ich angespannt.','Körperliche oder innere Anspannung; nicht die grammatische Zeitform.'],
  ['ängstlich','anxious','I feel anxious about the exam.','Ich habe Angst vor der Prüfung.','Besorgt oder voller Angst; anxious to do something kann auch etwas unbedingt tun wollen heißen.'],
  ['verängstigt','frightened','The loud noise made me feel frightened.','Das laute Geräusch machte mir Angst.','Von etwas erschreckt oder in Angst versetzt; nicht nur überrascht.',['scared','afraid']],
  ['unsicher','insecure','I feel insecure about my abilities.','Ich bin unsicher, was meine Fähigkeiten angeht.','Hier: Selbstzweifel oder fehlendes inneres Sicherheitsgefühl. Bei Ungewissheit über eine Tatsache eher unsure oder uncertain.'],
  ['hilflos','helpless','I felt helpless because I did not know how to help.','Ich fühlte mich hilflos, weil ich nicht wusste, wie ich helfen konnte.','Nicht wissen oder nicht in der Lage sein, sich oder anderen zu helfen; nicht einfach bewusstlos.'],
  ['überfordert','overwhelmed','I feel overwhelmed by all the tasks I have to finish.','Ich fühle mich von all den Aufgaben, die ich erledigen muss, überfordert.','Belastung: Die Anforderungen werden zu viel. Karte 54 behandelt das Überwältigtsein von Gefühlen.'],
  ['verzweifelt','desperate','I felt desperate when nothing seemed to help.','Ich war verzweifelt, als nichts zu helfen schien.','Starke Verzweiflung; desperate for something kann dringend etwas brauchen bedeuten.'],
  ['hoffnungslos','hopeless','I felt hopeless about the future.','Beim Gedanken an die Zukunft fühlte ich mich hoffnungslos.','Hier: ohne Hoffnung. A hopeless situation bezeichnet eine aussichtslose Situation.'],
  ['frustriert','frustrated','I felt frustrated because I could not make myself understood.','Ich war frustriert, weil ich mich nicht verständlich machen konnte.','Unzufriedenheit über ein Hindernis oder ein unerreichtes Ziel; nicht dasselbe wie enttäuscht.'],
  ['enttäuscht','disappointed','I was disappointed when our plans fell through.','Ich war enttäuscht, als unsere Pläne scheiterten.','Eine Hoffnung oder Erwartung hat sich nicht erfüllt.'],
  ['verletzt','hurt','I felt hurt by what she said.','Ihre Worte haben mich verletzt.','Hier emotional verletzt; hurt kann auch körperlich verletzt heißen. Injured passt zu körperlichen Verletzungen.'],
  ['verletzlich','vulnerable','I feel vulnerable when I talk about my fears.','Ich fühle mich verletzlich, wenn ich über meine Ängste spreche.','Hier emotional offen und verletzbar; nicht bereits verletzt.'],
  ['beschämt','ashamed','I felt ashamed of how I had treated him.','Ich schämte mich dafür, wie ich ihn behandelt hatte.','Adjektiv: Scham empfinden. Embarrassed bedeutet eher verlegen oder peinlich berührt und ist nicht generell gleichbedeutend.'],
  ['Scham','shame','I felt a deep sense of shame.','Ich empfand tiefe Scham.','Substantiv; ashamed ist das Adjektiv. What a shame bedeutet dagegen wie schade.'],
  ['schuldig (sich schuldig fühlen)','guilty','I felt guilty about forgetting her birthday.','Ich fühlte mich schuldig, weil ich ihren Geburtstag vergessen hatte.','Hier ein Schuldgefühl; keine Aussage über juristische Schuld. Nicht mit ashamed gleichsetzen.'],
  ['einsam','lonely','I can feel lonely even when other people are around.','Ich kann mich einsam fühlen, selbst wenn andere Menschen da sind.','Gefühl fehlender Verbindung; alone heißt allein und muss nicht einsam bedeuten.'],
  ['verlassen (sich verlassen fühlen)','abandoned','I felt abandoned when no one came to see me.','Ich fühlte mich verlassen, als niemand mich besuchen kam.','Hier: sich im Stich gelassen fühlen. Kein objektiver Nachweis, dass andere jemanden absichtlich verlassen haben.'],
  ['Sehnsucht','longing','I felt a deep longing for home.','Ich empfand eine tiefe Sehnsucht nach Zuhause.','Substantiv: intensiver Wunsch nach jemandem oder etwas. Longing for: Sehnsucht nach.',['yearning']],
  ['vermissen','to miss','I miss my family when I am away.','Ich vermisse meine Familie, wenn ich weg bin.','Hier jemanden oder etwas vermissen; miss the train heißt den Zug verpassen.'],
  ['verbunden','connected','I feel connected to you when we talk openly.','Ich fühle mich mit dir verbunden, wenn wir offen miteinander sprechen.','Hier zwischenmenschlich verbunden; connected to oder connected with.'],
  ['geborgen','safe and secure','I feel safe and secure when I am with you.','Bei dir fühle ich mich geborgen.','Innere und zwischenmenschliche Sicherheit; kein einzelnes englisches Wort deckt geborgen immer vollständig ab.',['secure and safe']],
  ['Zuneigung','affection','I feel a lot of affection for her.','Ich empfinde viel Zuneigung für sie.','Substantiv für ein warmes Gefühl gegenüber jemandem; nicht zwingend romantisch.'],
  ['zärtlich','tender','He gave her a tender kiss.','Er gab ihr einen zärtlichen Kuss.','Hier liebevoll und sanft; a tender muscle bedeutet dagegen einen druckempfindlichen Muskel.'],
  ['einfühlsam','empathetic','She is an empathetic listener.','Sie ist eine einfühlsame Zuhörerin.','Die Gefühle anderer nachvollziehen können; compassion betont zusätzlich Anteilnahme an Leid.',['empathic']],
  ['fürsorglich','caring','He is a caring father.','Er ist ein fürsorglicher Vater.','Adjektiv: sich zugewandt um andere kümmern; nicht dasselbe wie careful, vorsichtig.'],
  ['dankbar','grateful','I am grateful for your support.','Ich bin dankbar für deine Unterstützung.','Grateful for something, grateful to someone: für etwas beziehungsweise jemandem dankbar.',['thankful']],
  ['erleichtert','relieved','I felt relieved when I heard the good news.','Ich war erleichtert, als ich die gute Nachricht hörte.','Eine Sorge oder Belastung lässt nach; nicht einfach entspannt.'],
  ['zuversichtlich','optimistic','I feel optimistic about the future.','Ich blicke zuversichtlich in die Zukunft.','Hier eine positive Erwartung; confident betont eher Vertrauen in eine Fähigkeit oder einen Ausgang.'],
  ['hoffnungsvoll','hopeful','I feel hopeful that things will get better.','Ich bin hoffnungsvoll, dass es besser wird.','Hoffnung auf eine günstige Entwicklung; keine sichere Erwartung.'],
  ['zufrieden','content','I feel content with my life.','Ich bin mit meinem Leben zufrieden.','Zufrieden und innerlich erfüllt; Adjektiv mit Betonung auf der zweiten Silbe, nicht das Substantiv content für Inhalt.',['contented']],
  ['glücklich','happy','I feel happy when we spend time together.','Ich bin glücklich, wenn wir Zeit miteinander verbringen.','Hier Freude oder Glück empfinden; nicht lucky im Sinn von Glück haben.'],
  ['begeistert','excited','I am excited about our trip.','Ich bin begeistert von unserer bevorstehenden Reise.','Hier positive Vorfreude und Aufregung; enthusiastic betont Begeisterung, excited ist nicht automatisch ängstlich.'],
  ['neugierig','curious','I am curious about how you see things.','Ich bin neugierig darauf, wie du die Dinge siehst.','Interesse am Entdecken; nosy bedeutet dagegen aufdringlich neugierig.'],
  ['eifersüchtig','jealous','I felt jealous when my partner flirted with someone else.','Ich war eifersüchtig, als mein Partner mit jemand anderem flirtete.','Hier die Angst, Zuneigung oder eine Beziehung an jemanden zu verlieren. Jealous kann umgangssprachlich auch neidisch heißen.'],
  ['neidisch','envious','I felt envious of her success.','Ich war neidisch auf ihren Erfolg.','Etwas haben wollen, das jemand anderes hat; zur Abgrenzung hier envious statt jealous.'],
  ['gleichgültig','indifferent','I felt indifferent to the result.','Das Ergebnis war mir gleichgültig.','Wenig Interesse oder Anteilnahme; nicht gelassen und nicht automatisch emotional taub.'],
  ['innerlich leer','empty inside','I feel empty inside, even though my day was full.','Ich fühle mich innerlich leer, obwohl mein Tag ausgefüllt war.','Subjektives inneres Erleben; keine Diagnose und nicht einfach hungrig oder gelangweilt.',['empty on the inside']],
  ['berührt (emotional)','moved','I was deeply moved by her kindness.','Ihre Freundlichkeit hat mich tief berührt.','Emotional berührt; moved kann sonst auch bewegt oder umgezogen bedeuten.',['touched']],
  ['überwältigt','overwhelmed','I felt overwhelmed with joy when we met again.','Ich war vor Freude überwältigt, als wir uns wiedersahen.','Starke Gefühle, hier positiv. Dasselbe englische Wort wie bei überfordert, aber ein anderer Kontext; auch negative Gefühle können überwältigen.'],
  ['wütend auf jemanden sein','to be angry with someone','I am angry with him for breaking his promise.','Ich bin wütend auf ihn, weil er sein Versprechen gebrochen hat.','Angry with someone und angry at someone sind beide natürlich; angry about something bezieht sich auf den Anlass.',['to be angry at someone']]
];
const FEELINGS_PACK = {
  id:'feelings-emotions-v1',
  name:'Gefühle, Emotionen und innere Zustände – Feelings & Emotions',
  entries:FEELINGS_ROWS.map(([front,back,example,translation,hint,alternatives=[]])=>[
    front,back,'Beispiel: '+example+'\nDeutsch: '+translation+'\nBedeutung: '+hint,alternatives
  ])
};
VOCAB_PACKS.push(FEELINGS_PACK);

// This complete module intentionally coexists with words in older topic packs.
// Stable IDs make first-time additions on separate devices converge on sync.
function feelingsPackCards(allCards) {
  const keys=new Set(FEELINGS_PACK.entries.map(([front,back])=>C.key({front,back})));
  return allCards.filter(c=>c.module===FEELINGS_PACK.name &&
    (keys.has(C.key(c)) || c.id.startsWith(FEELINGS_PACK.id+':')));
}
function planFeelingsImport(current,makeId,now) {
  const present=feelingsPackCards(current.cards.filter(c=>!c.deletedAt));
  const added=[];let duplicates=0;
  FEELINGS_PACK.entries.forEach(([front,back,notes,alternatives],i)=>{
    const stableId=FEELINGS_PACK.id+':'+String(i+1).padStart(2,'0');
    if(present.some(c=>c.id===stableId || C.key(c)===C.key({front,back}))){duplicates++;return;}
    // Explicitly re-adding a deleted or moved card never overwrites its history.
    const cardId=current.cards.some(c=>c.id===stableId)?makeId():stableId;
    let slot=0;
    const next=C.planImport(C.empty(),[{front,back,notes,alternatives,module:FEELINGS_PACK.name}],
      ()=>slot++===0?cardId:cardId+':alternative:'+slot,now);
    added.push(...next.added);
  });
  return {added,duplicates};
}
