// Grid positions and categories follow the supplied teaching layout.
const EMOTION_CATEGORIES = {
  love: 'Love & Empathy',
  joy: 'Joy',
  anger: 'Anger',
  sadness: 'Sadness',
  fear: 'Fear',
  disgust: 'Disgust',
};

// row | column | symbol | category | noun | adjective or phrase | German | client | German context | exploratory prompt
const EMOTION_ELEMENTS = `
1|1|Lo|love|love|loving|Liebe / liebevoll|I feel a lot of love for my son.|Ich empfinde viel Liebe für meinen Sohn.|As you talk about your son, what do you notice in yourself?
1|14|Fe|fear|fear|afraid|Angst / ängstlich|I am afraid to be alone tonight.|Ich habe Angst, heute Abend allein zu sein.|Would it feel okay to notice how that fear shows up right now?
2|1|Em|love|empathy|empathetic|Einfühlungsvermögen / einfühlsam|I can understand why she feels that way.|Ich kann verstehen, warum sie sich so fühlt.|As you make room for her feelings, what do you notice about your own?
2|13|Ne|fear|nervousness|nervous|Nervosität / nervös|I get nervous before I make a phone call.|Vor einem Anruf werde ich nervös.|Where do you first notice the nervousness, if anywhere?
2|14|Dr|fear|dread|full of dread|Grauen / voller Angst vor etwas|I dread going back to work tomorrow.|Mir graut davor, morgen wieder zur Arbeit zu gehen.|As you think of tomorrow, what helps you stay aware of being here now?
3|1|Se|love|serenity|serene|innere Ruhe / innerlich ruhig|For a moment, I felt completely calm.|Für einen Moment war ich ganz ruhig.|What lets you know there is some calm right now?
3|2|Te|love|tenderness|tender|Zärtlichkeit / zärtlich|I feel tender toward my partner today.|Ich empfinde heute Zärtlichkeit für meinen Partner.|What is it like to notice that tenderness as you speak?
3|3|Jo|joy|joy|joyful|Freude / freudig|I feel so much joy when I sing.|Beim Singen empfinde ich große Freude.|As you picture yourself singing, what do you notice in your body?
3|4|Ho|joy|hope|hopeful|Hoffnung / hoffnungsvoll|For the first time, I feel things might get better.|Zum ersten Mal habe ich das Gefühl, dass es besser werden könnte.|What is it like to make a little room for that possibility?
3|5|Su|joy|surprise|surprised|Überraschung / überrascht|I was surprised that she called me.|Ich war überrascht, dass sie mich angerufen hat.|What do you notice now as you remember getting that call?
3|6|It|anger|interest|interested|Interesse / interessiert|I want to know more about this.|Ich möchte mehr darüber erfahren.|What draws your attention as you say that?
3|7|Ag|anger|aggression|aggressive|Aggression / aggressiv|When he interrupted me, I wanted to shout.|Als er mich unterbrach, wollte ich schreien.|Can we notice the urge to shout without needing to act on it?
3|8|Rb|anger|rebellion|rebellious|Aufbegehren / rebellisch|I don't want to do what they tell me anymore.|Ich will nicht mehr tun, was sie mir sagen.|As you say that, what feels important for you to decide for yourself?
3|9|Sa|sadness|sadness|sad|Traurigkeit / traurig|I feel sad when I look at those photos.|Ich werde traurig, wenn ich diese Fotos anschaue.|How do you notice the sadness here with me?
3|10|Bo|sadness|boredom|bored|Langeweile / gelangweilt|Every day feels the same. I'm bored.|Jeder Tag fühlt sich gleich an. Mir ist langweilig.|When you say every day feels the same, what do you notice in yourself?
3|11|Sh|fear|shyness|shy|Schüchternheit / schüchtern|I want to say hello, but I feel too shy.|Ich würde gern Hallo sagen, bin aber zu schüchtern.|Can you notice both the wish to say hello and what makes it hard?
3|12|In|fear|insecurity|insecure|Unsicherheit / unsicher|I feel unsure of myself around new people.|Bei neuen Leuten fühle ich mich unsicher.|What is it like to tell me about that uncertainty right now?
3|14|Ss|fear|stress|stressed|Stress / gestresst|I feel stressed when I have too much to do.|Ich fühle mich gestresst, wenn ich zu viel zu tun habe.|Would it help to slow down for a moment and see what you notice?
4|1|Co|love|compassion|compassionate|Mitgefühl / mitfühlend|I feel for her. She's having a hard time.|Ich fühle mit ihr. Sie macht eine schwere Zeit durch.|As you notice your compassion for her, what is it like to include yourself for a moment?
4|2|Sy|love|sympathy|sympathetic|Anteilnahme / anteilnehmend|I feel sorry for him after what happened.|Nach dem, was passiert ist, tut er mir leid.|What happens in you as you notice how much his situation matters to you?
4|3|St|joy|satisfaction|satisfied|Zufriedenheit / zufrieden|I'm satisfied with how I handled that talk.|Ich bin zufrieden damit, wie ich das Gespräch geführt habe.|What tells you that the way you handled it felt right to you?
4|4|Pl|joy|pleasure|pleased|Genuss / erfreut|I really enjoyed sitting in the sun today.|Ich habe es heute sehr genossen, in der Sonne zu sitzen.|What do you notice as you remember how that felt?
4|5|Ec|joy|ecstasy|ecstatic|Entzücken / außer sich vor Freude|When I heard the news, I was overjoyed.|Als ich die Nachricht hörte, war ich außer mir vor Freude.|How is it to notice that much joy, at a pace that feels comfortable?
4|6|An|anger|anger|angry|Wut / wütend|I'm angry that she ignored my no.|Ich bin wütend, weil sie mein Nein ignoriert hat.|As you say no now, what do you notice about that boundary?
4|7|Re|anger|resentment|resentful|Groll / nachtragend|I still feel bitter about doing all the work alone.|Ich bin immer noch verbittert darüber, dass ich die ganze Arbeit allein gemacht habe.|What feels unfinished for you when you think about what happened?
4|8|Hs|anger|hostility|hostile|Feindseligkeit / feindselig|I feel hostile toward him whenever he comes near me.|Sobald er in meine Nähe kommt, empfinde ich Feindseligkeit ihm gegenüber.|What do you notice about the distance you want between you and him?
4|9|Ln|sadness|loneliness|lonely|Einsamkeit / einsam|I feel lonely even when other people are around.|Ich fühle mich einsam, selbst wenn andere Menschen da sind.|What kind of contact would feel welcome to you right now?
4|10|Ab|sadness|abandonment|abandoned|Verlassenwerden / sich verlassen fühlend|When she left, I felt abandoned.|Als sie ging, fühlte ich mich im Stich gelassen.|What is it like to talk about feeling left behind while we're here together?
4|11|Cf|fear|confusion|confused|Verwirrung / verwirrt|I feel confused. I don't know what I want.|Ich bin verwirrt. Ich weiß nicht, was ich möchte.|Is there anything you do know right now, even if it is something small?
4|12|Sp|fear|suspicion|suspicious|Argwohn / argwöhnisch|I think he might be hiding something from me.|Ich glaube, er verheimlicht mir vielleicht etwas.|What do you notice yourself looking for when you're unsure whether to trust him?
4|14|Sb|fear|submission|submissive|Unterordnung / sich unterordnend|I go along with what he wants, even when I disagree.|Ich mache mit, was er will, auch wenn ich anderer Meinung bin.|When you imagine having a choice, what do you notice about what you want?
5|1|Gr|love|gratitude|grateful|Dankbarkeit / dankbar|I'm grateful she stayed with me.|Ich bin dankbar, dass sie bei mir geblieben ist.|What is it like to notice that you received support from her?
5|2|Ts|love|truthfulness|truthful|Ehrlichkeit / ehrlich|I want to tell you how I really feel.|Ich möchte Dir sagen, wie ich mich wirklich fühle.|What is it like to say what feels true for you here?
5|3|En|joy|enthusiasm|enthusiastic|Begeisterung / begeistert|I'm really excited to start this project.|Ich bin richtig begeistert, mit diesem Projekt anzufangen.|As you think about starting, what feels most alive or interesting to you?
5|4|Ea|joy|ease|at ease|Ungezwungenheit / sich wohlfühlend|I feel at ease with my friend.|Bei meiner Freundin fühle ich mich ganz ungezwungen.|How can you tell that you feel at ease with her?
5|5|Op|joy|optimism|optimistic|Zuversicht / zuversichtlich|I think we can find a way through this.|Ich glaube, wir können einen Weg da hindurch finden.|What do you notice as you hear yourself say that a way might be possible?
5|6|Ht|anger|hate|hateful|Hass / hasserfüllt|I feel so much hate when I think about him.|Ich empfinde so viel Hass, wenn ich an ihn denke.|How is it to name that feeling here, without having to do anything with it?
5|7|Fr|anger|frustration|frustrated|Frustration / frustriert|I keep trying, and it still doesn't work.|Ich versuche es immer wieder, und es klappt trotzdem nicht.|What matters to you about getting this to work?
5|8|Ir|anger|irritation|irritated|Genervtheit / genervt|That noise really gets on my nerves.|Dieses Geräusch geht mir wirklich auf die Nerven.|What do you notice just before the irritation gets stronger?
5|9|Gf|sadness|grief|grieving / heartbroken|Trauer / trauernd oder tief getroffen|I miss my dad every day since he died.|Seit mein Vater gestorben ist, vermisse ich ihn jeden Tag.|As you speak about your dad, what feels possible to share right now?
5|10|No|sadness|nostalgia|nostalgic|Nostalgie / nostalgisch|I miss the summers we spent at my grandmother's house.|Ich vermisse die Sommer, die wir bei meiner Großmutter verbracht haben.|When you remember those summers, what feels warm, and what feels painful, if anything?
5|11|Tr|fear|terror|terrified|blankes Entsetzen / von Angst überwältigt|I was terrified. I couldn't move.|Ich hatte panische Angst. Ich konnte mich nicht bewegen.|Would you like to pause and notice something in the room before we go on?
5|12|Sm|fear|shame|ashamed|Scham / beschämt|I feel ashamed. I just want to hide.|Ich schäme mich. Ich möchte mich am liebsten verstecken.|What would make it feel a little easier to stay here together while we talk about this?
5|14|Di|disgust|disgust|disgusted|Ekel / angewidert|I feel sick when I remember the smell.|Mir wird übel, wenn ich mich an den Geruch erinnere.|What distance from that memory feels manageable right now?
6|1|Ad|love|admiration|admiring|Bewunderung / bewundernd|I admire how she speaks up for herself.|Ich bewundere, wie sie für sich eintritt.|What feels meaningful to you about the way she speaks up?
6|2|Pr|love|pride|proud|Stolz / stolz|I'm proud that I asked for help.|Ich bin stolz darauf, dass ich um Hilfe gebeten habe.|How is it to give yourself credit for asking?
6|3|Eu|joy|euphoria|euphoric|Euphorie / euphorisch|After the show, I felt like I was on top of the world.|Nach der Aufführung fühlte ich mich, als könnte ich die ganze Welt umarmen.|How do you notice that energy now as you remember the show?
6|4|De|joy|desire|desirous / wanting|Verlangen / voller Verlangen|I really want to be close to her.|Ich wünsche mir sehr, ihr nahe zu sein.|What is it like to notice that wish before deciding what to do with it?
6|5|Ha|joy|happiness|happy|Glück / glücklich|I'm happy when we spend time together.|Ich bin glücklich, wenn wir Zeit miteinander verbringen.|What about being together feels good to you?
6|6|Ra|anger|rage|enraged|rasende Wut / außer sich vor Wut|I was so angry that I could barely speak.|Ich war so wütend, dass ich kaum sprechen konnte.|Would it help to pause and notice the support of the chair before we go on?
6|7|Je|anger|jealousy|jealous|Eifersucht / eifersüchtig|I get jealous when my partner talks about his ex.|Ich werde eifersüchtig, wenn mein Partner von seiner Ex spricht.|When that feeling comes up, what feels most important to you in the relationship?
6|8|Ev|anger|envy|envious|Neid / neidisch|I wish I had the freedom she has.|Ich wünschte, ich hätte so viel Freiheit wie sie.|What does the freedom you see in her life bring up about what you want for yourself?
6|9|Id|sadness|indignation|indignant|Empörung / empört|I'm upset because they treated her unfairly.|Ich bin empört, weil sie unfair behandelt wurde.|What feels most important to you about how she was treated?
6|10|Hp|sadness|helplessness|helpless|Hilflosigkeit / hilflos|I feel helpless. I don't know how to help him.|Ich fühle mich hilflos. Ich weiß nicht, wie ich ihm helfen kann.|What is it like to notice what you can and cannot do in this situation?
6|11|Rs|sadness|resignation|resigned|Resignation / resigniert|I've stopped trying. I don't think anything will change.|Ich habe aufgehört, es zu versuchen. Ich glaube nicht, dass sich etwas ändern wird.|What is it like to notice that you no longer expect things to change?
6|12|Me|sadness|melancholy|melancholy / melancholic|Melancholie / melancholisch|Some evenings I feel quietly sad and don't know why.|An manchen Abenden bin ich leise traurig und weiß nicht, warum.|What do you notice about that quiet sadness when you don't have to explain it?
6|14|Ct|disgust|contempt|contemptuous|Verachtung / verächtlich|I look down on him after what he did.|Seit dem, was er getan hat, sehe ich auf ihn herab.|What do you notice in yourself as you describe how you see him now?
7|9|Ds|sadness|disappointment|disappointed|Enttäuschung / enttäuscht|I'm disappointed that she didn't come.|Ich bin enttäuscht, dass sie nicht gekommen ist.|What had you hoped for when you thought she might come?
7|10|We|sadness|weariness|weary|Erschöpfung / erschöpft|I'm tired of having the same fight again and again.|Ich bin es leid, immer wieder denselben Streit zu führen.|What do you notice about what you need as you name how tired you feel?
7|11|Pe|sadness|pessimism|pessimistic|Pessimismus / pessimistisch|I expect things to go wrong again.|Ich erwarte, dass wieder alles schiefläuft.|What is it like to notice that expectation here with me?
`.trim().split('\n').map(line => {
  const [row, column, sym, cat, noun, adj, de, client, context, narm] = line.split('|');
  return {r: Number(row), c: Number(column), sym, cat, noun, adj, de, client, context, narm};
});
