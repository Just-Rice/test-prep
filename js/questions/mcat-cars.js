// Original passages and questions for the MCAT's Critical Analysis and Reasoning Skills section (CARS), written
// for this app: the AAMC publishes no question bank, and its practice material may not be copied.
//
// Like the real section, the passages come from the humanities and social sciences and need no outside knowledge:
// each argues a position, and the questions ask what it says, how its argument works, and how its ideas would
// apply beyond it. Nine passages of six questions each: as many passages as the real section, and 54 questions,
// one more than its 53, so a full-length timed section can be built from them.
//
// Planned before writing, after the AAMC's split of the section (30% comprehension, 30% reasoning within the
// text, 40% reasoning beyond it): 16, 16 and 22 questions on the three skills, eighteen at each tier, and 14, 13,
// 14 and 13 answers on A to D. Reading answers can't be re-solved like a calculation, so tests/mcat-questions.test.js
// holds them to the properties a fair question needs instead, including that the length of a choice gives
// nothing away.

const DOMAIN = 'Critical analysis and reasoning';
const SKILL = {
  C1: 'C1: Foundations of comprehension',
  C2: 'C2: Reasoning within the text',
  C3: 'C3: Reasoning beyond the text',
};

// A passage and its questions. Each question is [number, skill, tier, stem, choices, answer, rationale].
const set = (id, passage, questions) => questions.map(([n, code, difficulty, stem, choices, answer, rationale]) => ({
  id: `mcat-cars-${id}-${n}`, exam: 'mcat', section: 'CARS', domain: DOMAIN, skill: SKILL[code],
  difficulty, set: `mcat-cars-${id}`, passage, stem, choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
}));

const MUSEUMS = `The great encyclopedic museums, which gather the art of every continent under one roof, have long defended their collections with a single idea: that an object belongs to humanity, and so is best kept where the greatest number of people can see it beside the achievements of other cultures. A bronze head from West Africa, on this view, says more in a gallery that also holds Greek marble and Chinese porcelain than it would in the city where it was cast. The argument has the appeal of generosity. It asks us to think of culture as shared rather than owned.

Yet the argument proves either too much or too little. If objects belong to humanity and should be seen by as many people as possible, then the museums’ own storerooms, where most of their holdings sit unseen, are an embarrassment to it. And if the value of an object lies in its placement beside others, that value does not depend on which city the placement happens in. Nothing in the principle explains why the gathering place must be London or Paris or New York; it explains only why there should be gathering places. The principle was most often invoked, moreover, by the institutions that already held the objects, and seldom by anyone asking to borrow them.

The strongest case for return is not, as its critics sometimes suppose, a claim that every object must go home. It is a claim about how the objects left. Many were bought, traded or given in circumstances that no one now disputes. Others were seized in punitive expeditions, carried off as the spoils of war, or removed under colonial arrangements in which the people who made or kept them had no say. For these, the question is not where an object would be best appreciated but whether its present owner has any title to it at all. A museum that would refuse a painting stolen from a private house last year has difficulty explaining why the passage of a century should cleanse a theft from a palace.

Museums have answered that return is impractical: that the rightful claimants are hard to identify, that the objects might be poorly kept, that a precedent would empty the galleries. Each objection has some force, and none is decisive. Communities, governments and institutions have, in recent cases, proved perfectly able to identify themselves, and the worry about care has too often been raised by institutions whose own records of what they hold are incomplete. As for precedent, a rule that returned only what was taken by force would not empty the galleries. It would empty some rooms.

What restitution asks of museums, in the end, is less a sacrifice than a change in how they understand themselves. An institution that sees itself as a guardian of objects will feel every return as a loss. One that sees itself as a place where the histories of objects are told, including the history of how they arrived, may find that returning a bronze, and telling that story, serves its purpose better than keeping it silently ever could.`;

const TRANSLATION = `Every translator of poetry is asked, sooner or later, whether a translation is faithful, and the question is usually meant as a test of how closely the English follows the original, word by word. It is the wrong test, though not for the reason usually given. The usual objection is that a word-for-word version is unreadable: that a poem rendered this way loses its music and so ceases to be a poem. That is true, but it concedes too much, for it implies that the literal version is at least faithful to the sense and has merely failed as art. In fact the literal version is often unfaithful to the sense as well.

Consider what a word in a poem does. It denotes something, but it also sounds a certain way, belongs to a certain register of speech, carries echoes of other poems in the same language, and falls at a particular point in the line, where it may be stressed or muted. A translator who keeps the denotation and discards the rest has not kept the meaning of the word; she has kept one of its meanings and exchanged the others for whatever the English equivalent happens to carry. When a formal word in the original becomes a plain one in English, or a word worn smooth with use becomes a strange one, the reader receives a different statement, not merely a less beautiful one.

The alternative is sometimes called fidelity to effect: the translator asks what the poem does to a reader of the original, and tries to make the English do the same. This has its own dangers. A translator who believes she understands the effect of a poem better than its words may end up translating her own reading instead of the poem, smoothing away its difficulties because she takes them for accidents. Some poems are meant to resist their readers, and a translation that makes a difficult poem easy is unfaithful in the most basic sense.

The two approaches are less opposed than they appear. Both assume that a translation must choose, at every point, which of the original’s properties to preserve, because no translation can preserve them all. They differ only in how the choice is made: the literalist by a rule fixed in advance, the translator of effects by judgment exercised line by line. Put this way, the literalist’s position looks less like fidelity than like a refusal to take responsibility for choices that must be made anyway. A rule that says “always keep the denotation” does not avoid choosing. It simply makes the same choice every time, whether or not it suits the line.

It follows that the right question to ask of a translation is not “Is it faithful?” but “Faithful to what, and at what cost?” A good translation is one whose losses were chosen with care, and whose translator could say why this sound was given up to keep that image, or this image blurred to keep the poem’s tone. Readers who want to judge such choices have one reliable resource: a second translation of the same poem, made by someone who chose differently.`;

const STREETS = `For most of history, a city street was not a road. It was a place where children played, merchants set out their goods, neighbors talked and processions passed, and where vehicles, when they came, moved at the pace of a walking horse and made their way among everyone else. The idea that the street belongs first of all to traffic, and that people on foot are intruders who must cross it at marked places, is little more than a century old. In American cities it was established in the 1920s, and not without a fight.

The fight began with the deaths. As automobiles multiplied, so did the number of people, many of them children, killed in the streets. Newspapers at first treated these deaths as the fault of drivers, and public opinion cast the motorist as a menace who had invaded a space that belonged to others. Citizens in at least one city petitioned for devices that would have kept cars from exceeding about 25 miles per hour. Automobile clubs and manufacturers answered with a campaign that historians have described as a redefinition of the street. They popularized the word “jaywalker” (a jay being a rural simpleton) to cast pedestrians who walked where they pleased as ignorant of city ways. They sponsored safety lessons that taught schoolchildren to keep out of the road. They promoted traffic codes that confined pedestrians to crosswalks and gave vehicles the rest of the street.

What is striking in this history is not that the automobile won; given its usefulness, that was perhaps inevitable. It is that the victory was presented, and has since been remembered, as a matter of safety and efficiency rather than of allocation. To give the street to cars was to take it from other uses, and the people who lost it, such as children, the elderly, and the poor who could not afford a car, had little voice in the decision. The language of the campaign obscured this. A child killed while playing in the street became, under the new understanding, a child who should not have been there.

It would be a mistake to romanticize the older street. It was often filthy, congested and dangerous in its own ways, and horse-drawn traffic killed people too. Nor could modern cities do without motor vehicles. But the recent spread of “shared streets,” where curbs are removed and drivers, cyclists and pedestrians mix at low speeds, suggests that the arrangement of the 1920s was a choice that can be revisited. Where such designs have been tried, drivers tend to slow down, because the road no longer tells them that it is theirs.

The lesson of this history is not that streets should be taken back from cars, but that the question of whom a street is for is a political one, and should be decided as such. A decision presented as purely technical is harder to question, and the people it disadvantages may not even recognize that a decision was made.`;

const ILLUSTRATION = `When photography arrived in the middle of the nineteenth century, many naturalists expected it to put scientific illustrators out of work. A camera, after all, could record a specimen without the draftsman’s errors, fancies or fatigue. The expectation proved mistaken, and the reasons it did say something about what a scientific image is for.

A photograph shows one specimen as it happened to be on the day it was photographed: this beetle, with its left antenna broken; this flower, a little past its prime; this skull, stained where it lay in the ground. An illustration can show what no single specimen does. A botanical artist who worked from dozens of plants could draw the leaf in its typical shape, the flower at the moment its structure was clearest, and the stem cut away to reveal what the eye would otherwise miss. What the naturalist wanted was often not a record of an individual but a picture of a kind: an image from which a reader could recognize any member of the species, including one that looked quite unlike the specimen a camera happened to catch. Early photographs had practical limits as well: long exposures blurred anything that moved, and a lens could hold only a thin slice of a specimen in focus at once. But better equipment would in time remove those limits, and the illustrator’s advantage did not depend on them.

To call such an image idealized is accurate, but the word can mislead. The illustrator was not inventing a perfection that nature lacked. She was judging which features were characteristic and which accidental, and that judgment rested on knowledge the camera did not have. In this sense a good illustration was not less objective than a photograph but differently objective: it was answerable to the whole range of specimens rather than to one.

The difficulty, of course, is that judgment can err. An illustrator who believes she knows what is characteristic may draw what her theory expects rather than what the specimens show, and an error in a standard reference work will be copied for generations. The photograph’s great virtue was precisely that it made no such judgments. For this reason some scientists came to prize images that seemed to record nature without human intervention, even when these were harder to read.

The two kinds of image settled, eventually, into a division of labor. In fields where the variation among individuals is itself the object of study, or where a finding must be shown to be free of the observer’s expectations, the photograph prevailed. In field guides and anatomical atlases, where the reader must learn to recognize a kind, drawing survived, and in many cases it still does. That the two coexist is not a failure of either technology. It reflects two different answers to the question of what an image is supposed to be faithful to.`;

const IMPROVISATION = `Audiences at a jazz concert often speak of improvisation as a kind of magic: the musician, freed from the written score, simply plays whatever the moment inspires. Musicians themselves tend to describe it differently. What sounds spontaneous is, in their accounts, the product of years spent learning tunes, practicing patterns in every key, transcribing the solos of earlier players, and absorbing the conventions of a style so thoroughly that they no longer need to be thought about. The improviser does not escape preparation; she has prepared so much that it no longer shows.

This account is sometimes taken to debunk improvisation, as if the discovery that it rests on practice revealed it to be a fraud. That conclusion does not follow. A conversationalist who answers a remark she has never heard before with a witty reply is drawing on a vocabulary, a grammar and a store of stock phrases that she did not invent in the moment, yet nobody says her reply was not spontaneous. What is new in the reply is the combination, and the fit between the reply and the remark that provoked it. The same is true of a solo. Its materials are learned; its choices are made in the moment, in response to what the other musicians are doing, and they could not have been written in advance, because the situation they answer did not yet exist.

If this is right, then the usual contrast between improvisation and composition is misdrawn. Composers, too, work with learned materials and conventions. The difference is that a composer may revise at leisure, while the improviser must commit to each choice as it is made. Improvisation is composition under a particular constraint, time, and the constraint is not merely a handicap. It forces a kind of attention that revision allows one to postpone, and it makes audible something that a finished score conceals: the process of choosing itself. Listeners who follow an improvised solo are not only hearing the results of decisions. They are hearing the decisions being made, with their hesitations, recoveries and surprises.

This also explains why recordings of improvisation have an odd status. A solo recorded in 1959 can be learned note for note by a student today and played exactly. Yet when the student plays it, it is no longer an improvisation, though every note is the same. What has been lost is not in the notes. It is the relation between the notes and the situation they answered, a relation that the recording keeps only as a trace, and that the listener must imagine back into it. The same point explains why collectors prize the alternate takes from a recording session, the versions of a tune that a record company once discarded. Each take differs, and a listener who compares them can hear the players answering one another differently each time.`;

const GIFTS = `Ask people why they give gifts, and most will answer in terms of generosity: a gift is given freely, expecting nothing in return, and to give in the hope of reward is to have given something else, a bribe perhaps, or an investment. Yet anthropologists who have studied gift-giving across many societies have been struck by how rarely gifts are free in this sense. A gift received creates an obligation, and the recipient who fails to return one in due course, and in due proportion, loses standing. In some societies the obligation is explicit and elaborately managed. In ours it is mostly unspoken, but hardly absent, as anyone who has worried over the price of a present for someone who once gave them an expensive one can attest. The rules are rarely taught, yet they are widely known: people who would never write down what they owe a friend can still say, with some precision, whose turn it is to host dinner.

It is tempting to conclude that the gift is simply a disguised exchange, and that talk of generosity is a polite fiction covering what is really a trade. That conclusion misses what is distinctive about gifts. In a market exchange, the transaction is complete when payment is made; buyer and seller owe each other nothing further and may never meet again. A gift works the other way. Because its return is delayed and never exactly equal, an exchange of gifts is never finished, and the parties remain bound to each other. The imbalance is the point: it sustains the relationship. To repay a gift at once and exactly, handing back its cash value on the spot, is not to settle a debt but to refuse the relationship, and it is felt as an insult.

On this view, the language of free giving is not a fiction but a necessary part of the practice. If gifts were openly acknowledged as obligations with a price, they would become loans, and the relationship would take on the character of a contract. The ideal of the free gift, though seldom realized, protects the gift from being reduced to a calculation, and so preserves the bond that calculation would dissolve. This is why a thank-you note, which acknowledges a gift without repaying it, is welcome, while a check for the same amount would not be.

None of this means that the obligations gifts create are always benign. A gift too large to be returned can humiliate its recipient or place him in the giver’s power, and gifts have long served as instruments of patronage and control. The same features that let a gift bind friends also let it bind dependents. Whether a particular gift expresses affection or domination cannot be read from the gift itself. It depends on whether the recipient can, in time, reciprocate.`;

const RESTORATION = `When a medieval church or an ancient temple is damaged, those responsible for it face a choice that looks technical but is really philosophical. They can restore it: rebuild what was lost so that the building looks as it once did, or as they believe it once did. Or they can conserve it: stabilize what survives, repair only what is needed to keep it standing, and let the marks of its history remain visible. For much of the nineteenth century, restoration was the ruling ideal. Architects stripped later additions from old buildings, rebuilt collapsed vaults and carved new statues in the style of the old, aiming to return each building to a single moment of supposed perfection.

The reaction against this practice was fierce. Its critics charged that restoration destroyed exactly what made an old building valuable. A cathedral altered by six centuries of builders was, they argued, a document of those centuries, and to scrape it back to its thirteenth-century form was to erase most of the record in favor of a guess about its beginning. Some restorers went further still, pulling down sound medieval work because it did not match their idea of the building’s original style. Worse, the guess was often wrong. Restorers working from fragments filled the gaps with their own ideas of what the past should have been, so that many “restored” buildings tell us more about the nineteenth century than about the Middle Ages.

The critics’ alternative, to protect a building from decay by steady care and to make any necessary repair frankly new, has become the leading principle of conservation. It has its own difficulties. A repair that announces itself can disfigure a building as surely as a false one deceives. And there are cases in which the principle seems to demand too much: when a building’s meaning to the people who use it depends on its being whole, a carefully visible patch may preserve the stones while failing the community for whom the stones matter. Conservators have also learned that some old repairs are themselves historic, so that deciding what counts as damage and what counts as history is rarely simple.

What the long argument has established is not that one answer is always right, but what the question is. Every intervention on an old building makes a claim about which of its histories deserves to be seen. The restorer who rebuilds a fallen spire claims that the building’s original design matters more than its later life; the conservator who leaves the stump claims the opposite. Neither claim is neutral, and neither can be settled by technical skill alone. The honest course is to make the claim openly: to record what was done and why, so that the next generation, which will surely disagree, can see what it is disagreeing with.`;

const DIALECTS = `Most people who have been to school can say which forms of their language are correct. “He doesn’t know anything” is right; “he don’t know nothing” is wrong. Linguists, who study how languages actually work, tend to find such judgments puzzling, and not because they are careless about precision. The double negative, for example, is not a failure of logic. It was standard in English for centuries, it is standard today in French and Spanish, and in the English dialects that use it, it follows rules as regular as any in the grammar books. Nor are its speakers confused about what they mean: no listener takes “I didn’t see nobody” to mean that the speaker saw somebody. What such judgments rank is not the logic or clarity of a form but the social standing of the people who use it.

The “standard” variety of a language is, on this view, one dialect among many, set apart by history rather than by merit. It is usually the speech of a capital, a court or an educated class, which became the model for printing, schooling and official business and so took on the prestige of those institutions. Other dialects did not decay from it; many are as old, and some keep features the standard has lost. Had history gone differently, and the court settled in another city, a different dialect would now be the standard, and today’s standard might be the one marked wrong. To call them incorrect is to confuse a social fact about their speakers with a linguistic fact about their grammar.

It does not follow, as critics of linguists sometimes assume, that anything goes, or that schools should stop teaching the standard. A shared standard has real uses: it lets people from many regions read the same newspapers, draft the same laws and understand one another in writing. A student who has not mastered it is at a genuine disadvantage, and a teacher who pretends otherwise does the student no favor. The linguist’s point is narrower. The standard should be taught as an additional variety, suited to certain settings, not as the correction of a broken one. A child who is told that the way her family speaks is wrong learns not only a new grammar but a low opinion of her family, and may learn the first less readily because of the second.

The difference may sound like a matter of tact, but it has consequences. Where teachers have treated the home dialect as a system to be compared with the standard, pointing out, say, where the two form their past tenses differently, students have often learned the standard more readily than when the home dialect was simply marked wrong. Knowing two varieties, and when each is expected, is itself a linguistic skill, and one that speakers of the standard alone may never need to develop.`;

const FORGERY = `In 1945, a Dutch painter was arrested for having sold a painting by Vermeer to one of the leaders of the Nazi regime, a charge of collaboration that could have cost him his life. His defense was unusual: the painting was not by Vermeer. He had painted it himself, along with several other “Vermeers” that experts had hailed as masterpieces, and to prove it he painted another while under observation. The case poses a question that has troubled philosophers of art ever since. If a forgery is good enough to deceive the experts, so that no one can tell it from the real thing by looking, why is it worth so much less? What exactly has been lost?

One answer is that nothing has been lost, and that the fall in value is snobbery: we pay for a name, not for what we see. If the pleasure a painting gives is visual, then two paintings that look the same should please us equally, and a collector who values one far above the other is responding to something other than the art. Some philosophers have gone further, arguing that since a perfect copy gives the same experience, the rational response to discovering a forgery is to stop caring who painted it. This answer has the appeal of honesty, and it is true that the art market often rewards names more than merit. But it assumes that what we value in a painting is only how it looks, and that assumption is doubtful.

Consider what we admire in a real Vermeer. It is not only an arrangement of colors but an achievement: the solution, by a particular painter at a particular moment, of problems of light and space that no one before him had solved in that way. The forger solves no such problem. He copies a solution already found, and his skill, however great, is the skill of imitation. This is why we speak of Vermeer’s discoveries and not merely of his pictures: the pictures are the record of the discoveries. Two results that look alike can come from different kinds of act. A student who copies out a proof has written down a correct proof, but has not proved anything.

On this view the forgery is not a worse painting but a different thing, and its lower value reflects a real difference, not an illusion. The view also explains why our judgment can change without any change in what we see. When the painter’s fakes were exposed, experts who had praised them began to notice stiff faces and awkward drawing that they had overlooked before. They were not only revising a price. They were looking at each painting as what it was, the work of a twentieth-century man imitating the seventeenth century, and seeing it more accurately than before.`;

export const MCAT_CARS_QUESTIONS = [
  ...set('p1', MUSEUMS, [
    [1, 'C1', 'Easy', 'Which of the following best expresses the main idea of the passage?',
      ['Objects are best appreciated where they can be seen beside the achievements of many other cultures, as in the great museums.',
        'Museums have little claim to objects taken by force, whatever the merits of gathering many cultures’ art in one place.',
        'Every object in an encyclopedic museum should be returned to the community that made it.',
        'The practical obstacles to returning objects outweigh the moral case for doing so.'], 'B',
      'The author grants the appeal of gathering art from many cultures but argues that, for objects seized by force, the real question is title, and that museums’ objections to returning them are not decisive. The first choice is the museums’ argument, which the author rejects; the third is the claim the author says critics wrongly attribute to the case for return; and the fourth reverses the author’s verdict on the practical objections.'],
    [2, 'C1', 'Easy', 'According to the passage, the museums’ storerooms are an embarrassment to the argument for keeping objects because:',
      ['they hold objects whose ownership is disputed',
        'they show that museums acquire more than they can care for',
        'they reveal how many objects arrived through punitive expeditions and as spoils of war',
        'the argument values being seen, yet most holdings are never displayed'], 'D',
      'The argument says objects should be kept where the greatest number of people can see them. If most of a museum’s holdings sit unseen in storage, the museum fails its own standard. The passage makes no claim, in this connection, about disputed ownership, care, or how the stored objects were acquired.'],
    [3, 'C2', 'Medium', 'The author mentions a painting “stolen from a private house last year” in order to:',
      ['suggest that the age of a theft does not decide whether its present owner has title',
        'show that museums today check carefully where each of their new acquisitions has come from',
        'argue that private collectors keep art more responsibly than museums do',
        'illustrate how hard it can be to identify the rightful owner of an object'], 'A',
      'The comparison asks why a museum would refuse a recently stolen painting yet keep something taken from a palace a century ago. The point is that time does not turn a theft into a legitimate title. The example is not about museums’ care in acquiring objects, private collectors, or difficulty identifying owners.'],
    [4, 'C2', 'Hard', 'The author’s reply to the objection that returning objects would set a precedent that empties the galleries depends on which assumption?',
      ['Most claimants would decline to take their objects back.',
        'Museums could fill any empty rooms with objects on loan.',
        'Few museum holdings were taken by force.',
        'Legal precedents seldom affect how museums set their policies.'], 'C',
      'The reply is that a rule returning only what was taken by force “would empty some rooms,” not the galleries. That holds only if objects taken by force are a minority of the holdings. If most had been seized, the rule would empty the galleries after all. Nothing in the reply relies on claimants declining, loans, or how precedent works in law.'],
    [5, 'C3', 'Medium', 'Which of the following, if true, would most weaken the author’s reply to the worry that returned objects might be poorly cared for?',
      ['Returned objects have, on the whole, deteriorated faster than similar ones kept in museums.',
        'Several museums have lost track of objects listed in their own catalogs.',
        'Visitors to encyclopedic museums rarely spend long in any one gallery.',
        'Some returned objects have since been lent back to the museums that once held them.'], 'A',
      'The author answers the worry about care by pointing out that the museums raising it keep incomplete records themselves, which suggests the worry is not well founded. Evidence that returned objects really have fared worse would support the worry directly. Museums losing track of objects supports the author, and time spent in galleries and later loans say nothing about care.'],
    [6, 'C3', 'Hard', 'A museum holds a sculpture it bought legally from a dealer in 1950; nothing is known of the sculpture’s history before then. Which course of action would the author most likely favor?',
      ['Returning it at once to the country where it was made, since every such object belongs where it was made',
        'Keeping it, since buying it legally from a dealer settles the question of title',
        'Keeping it in storage until someone comes forward to claim it',
        'Finding out how it left its place of origin, and returning it if it was taken by force'], 'D',
      'For the author, the case for return turns on how an object left, and the museum’s purpose is served by telling the history of how its objects arrived. That calls for finding out the sculpture’s history. The author explicitly denies that every object must go home, and the stolen-painting comparison implies that a later legal purchase does not by itself cleanse a theft.'],
  ]),

  ...set('p2', TRANSLATION, [
    [1, 'C1', 'Easy', 'The author’s primary purpose in the passage is to:',
      ['defend word-for-word translation as the only faithful method',
        'show that poems cannot be translated without destroying them',
        'argue that a translation should be judged by what it keeps of the original, and at what cost',
        'explain why translating a poem’s effect always gives a better result than translating its words'], 'C',
      'The passage ends by replacing “Is it faithful?” with “Faithful to what, and at what cost?”, and everything before builds toward that. The author criticizes literal translation, warns that fidelity to effect has its own dangers (so it is not always better), and never says poems cannot be translated.'],
    [2, 'C1', 'Medium', 'According to the author, the usual objection to word-for-word translation “concedes too much” because it:',
      ['grants that a literal version keeps the poem’s sense',
        'admits that no poem can ever be translated well by anyone',
        'assumes that readers care more for a poem’s music than for its meaning',
        'accepts that a translator ought to follow a rule fixed in advance'], 'A',
      'The objection says literal versions lose their music, which “implies that the literal version is at least faithful to the sense.” The author denies exactly this: literal versions are often unfaithful to the sense as well. The objection says nothing about translation being impossible, about readers’ priorities, or about rules.'],
    [3, 'C2', 'Easy', 'The example of “a formal word in the original” becoming “a plain one in English” mainly serves to:',
      ['show that English has fewer formal words than other languages',
        'illustrate how keeping a word’s denotation can still change what a line says',
        'criticize translators who choose plain, everyday language even where the original is formal',
        'demonstrate that the sound of a poem matters more than its sense'], 'B',
      'The paragraph argues that a word’s meaning includes its register and associations, not only what it denotes. The example shows a translation that keeps the denotation but changes the register, so that “the reader receives a different statement.” The author makes no claim about English vocabulary and does not rank sound above sense.'],
    [4, 'C2', 'Hard', 'Which of the following best describes the author’s view of the relationship between literal translation and translation of effect?',
      ['They are opposed in principle, but in practice they usually end up producing very similar translations.',
        'Translation of effect avoids the choices that literal translation is forced to make.',
        'Literal translation is more responsible, because it applies one rule consistently.',
        'Both choose which properties of the original to keep, one by a fixed rule and one by judgment.'], 'D',
      'The fourth paragraph says both approaches must choose which of the original’s properties to preserve and “differ only in how the choice is made”: by a rule fixed in advance or by judgment line by line. The author calls the literalist’s consistency a refusal of responsibility, not a virtue, and says nothing about the two producing similar results.'],
    [5, 'C3', 'Medium', 'Suppose a translator turns a deliberately obscure poem into clear, flowing English. Based on the passage, the author would most likely consider this translation:',
      ['faithful to effect, since English readers will enjoy it more',
        'unfaithful, since it removes an intended difficulty',
        'faithful, provided that the denotation of every word in the original has been preserved',
        'acceptable, since every translation must give up something'], 'B',
      'The author warns that some poems are meant to resist their readers, and “a translation that makes a difficult poem easy is unfaithful in the most basic sense.” Every translation does give something up, but the author wants losses chosen with care, not a poem’s defining quality smoothed away.'],
    [6, 'C3', 'Hard', 'Which of the following findings would most strengthen the author’s claim that literal translations are often unfaithful to the sense of a poem?',
      ['Readers generally prefer translations that rhyme, even when the original does not.',
        'Literal translations usually take less time to produce than free ones do.',
        'Readers of literal translations often misjudge the original’s tone, taking formal speech for casual.',
        'Bilingual readers judge most literal translations accurate in what their words denote.'], 'C',
      'For the author, a word’s sense includes its register, so a literal version that keeps denotations but shifts the tone delivers “a different statement.” Readers misjudging the tone of literal translations would be evidence of exactly that. Accuracy of denotation is conceded by the author, and preferences for rhyme or speed of production are beside the point.'],
  ]),

  ...set('p3', STREETS, [
    [1, 'C1', 'Easy', 'Which of the following best states the main point of the passage?',
      ['Deciding whom a street is for is a political choice, which talk of safety and efficiency has tended to hide.',
        'Cars should be banned from city streets and replaced with shared public spaces.',
        'The street before the automobile was safer and more pleasant than the street today.',
        'Automobile makers and clubs were to blame for most of the traffic deaths that occurred in American cities during the 1920s.'], 'A',
      'The final paragraph states the lesson: the question of whom a street is for is political and should be decided as such, while the third paragraph shows how the 1920s campaign presented it as a matter of safety and efficiency. The author says streets need not be taken back from cars, warns against romanticizing the older street, and does not assign blame for the deaths.'],
    [2, 'C1', 'Easy', 'According to the passage, the word “jaywalker” was popularized in order to:',
      ['warn drivers against speeding near schools',
        'describe children who played in the road',
        'portray pedestrians who walked where they pleased as unsophisticated',
        'mark the safest places for people on foot to cross'], 'C',
      'A jay was a rural simpleton, and the word was used “to cast pedestrians who walked where they pleased as ignorant of city ways.” It was aimed at pedestrians, not drivers, and it was a label of disapproval, not a way of marking safe crossings.'],
    [3, 'C2', 'Medium', 'The statement that a child killed while playing in the street became “a child who should not have been there” is best understood as:',
      ['the author’s own view of where children belong',
        'a quotation from a safety lesson given in schools',
        'evidence that the number of deaths fell once the new traffic codes had been adopted by cities',
        'a description of how the new understanding of the street shifted blame onto pedestrians'], 'D',
      'The sentence follows the claim that the campaign’s language “obscured” the loss of the street, and it is framed as the view “under the new understanding.” The author is describing how responsibility moved from driver to victim, not endorsing it, quoting a lesson, or reporting a fall in deaths.'],
    [4, 'C2', 'Hard', 'The author’s remark that “it would be a mistake to romanticize the older street” serves mainly to:',
      ['show that, once horse-drawn traffic is counted, the automobile actually made city streets safer overall',
        'make clear that the argument is about who decided how streets are used, not a wish to return to the past',
        'cast doubt on the case for the shared streets that the author goes on to describe in the same paragraph',
        'explain why the automobile clubs’ campaign of the 1920s succeeded so quickly'], 'B',
      'The concession heads off a misreading: the author is not claiming the old street was better, only that its loss was a political allocation presented as something else. The author never compares overall safety, goes on to cite shared streets approvingly, and does not use the remark to explain the campaign’s success.'],
    [5, 'C3', 'Medium', 'Which of the following findings, if true, would most strengthen the author’s claim about shared streets?',
      ['Shared streets cost more to build than conventional streets.',
        'Pedestrians on shared streets report feeling less safe after dark.',
        'Many cities have widened their main roads since the 1990s.',
        'Measured driving speeds fell on streets converted to shared designs, even where speed limits did not change.'], 'D',
      'The claim is that drivers on shared streets slow down because the road no longer tells them it is theirs. Speeds falling without any change in the limit supports that the design itself is doing the work. Cost, pedestrians’ feelings at night, and road widening elsewhere do not bear on drivers’ behavior on shared streets.'],
    [6, 'C3', 'Hard', 'A city engineer describes adding a traffic lane to a busy street as a purely technical way to reduce congestion. The author would most likely respond that:',
      ['adding the lane gives more of the street to vehicles, which is a political choice, not only a technical one',
        'congestion is caused mainly by pedestrians who cross between intersections',
        'the engineer is right, since questions of traffic efficiency are best settled by experts rather than by voters',
        'the lane should be added only if speed governors are installed in cars'], 'A',
      'The author’s lesson is that allocating the street is political, and that presenting such a decision as “purely technical” hides it from the people it disadvantages. A new lane takes space from other uses, so the author would call it an allocation. The author nowhere blames pedestrians, defers to experts, or proposes speed governors.'],
  ]),

  ...set('p4', ILLUSTRATION, [
    [1, 'C1', 'Easy', 'The passage is primarily concerned with:',
      ['arguing that photographs are less objective than drawings',
        'describing the techniques used by botanical artists',
        'criticizing naturalists who were slow to adopt photography',
        'explaining why scientific illustration survived the arrival of photography'], 'D',
      'The passage opens with the expectation that photography would replace illustrators and spends the rest explaining why it did not: illustration shows a kind rather than an individual, and each kind of image found its own fields. The author calls illustration “differently objective,” not more objective, and describes no artistic techniques in detail.'],
    [2, 'C1', 'Easy', 'According to the passage, an illustration could show “what no single specimen does” because the illustrator:',
      ['worked faster than early photographers could',
        'drew a typical form from features seen across many specimens',
        'was trained to correct the imperfections of nature',
        'could draw species from descriptions even before any specimen of them had been collected'], 'B',
      'The artist “worked from dozens of plants” to draw the leaf “in its typical shape,” producing a picture of a kind. The author denies that illustrators invented a perfection nature lacked, and says nothing about speed or drawing from descriptions.'],
    [3, 'C2', 'Medium', 'The author’s claim that a good illustration was “differently objective” depends on the idea that:',
      ['a photograph and an illustration of one specimen record exactly the same information',
        'illustrators made fewer mistakes than the cameras of the time did',
        'an image can answer to many specimens, not just one',
        'being objective requires removing all human judgment'], 'C',
      'The author explains the phrase directly: an illustration “was answerable to the whole range of specimens rather than to one.” The idea that objectivity requires removing judgment is the rival view that favored photographs, and the passage says illustrators’ judgment could err.'],
    [4, 'C2', 'Hard', 'Which of the following best describes the role of the fourth paragraph (“The difficulty, of course …”) in the passage?',
      ['It concedes a weakness of illustration that explains why photography was valued in some fields.',
        'It refutes the earlier claim that a good illustration can be objective.',
        'It introduces a new argument against the use of photographs in science, based on their cost and difficulty.',
        'It shows that scientific illustrators rarely made errors.'], 'A',
      'The paragraph admits that an illustrator’s judgment can err and that errors get copied, which is why some scientists prized images free of human intervention. That sets up the division of labor in the last paragraph. It qualifies the earlier claim rather than refuting it, and it says illustrators could err, not that they rarely did.'],
    [5, 'C3', 'Medium', 'A biologist is studying how much beak size varies among the finches on one island. Based on the passage, which kind of image would best suit the study?',
      ['A single drawing of a typical beak, since it is the easiest to recognize',
        'Drawings made from many different birds, since drawings are the more objective record',
        'Photographs of individual birds, since the variation itself is being studied',
        'Either kind, since the two are equally faithful to their subjects'], 'C',
      'The passage says that in fields “where the variation among individuals is itself the object of study,” the photograph prevailed, because it records individuals as they are. A typical drawing would hide the very variation being measured, and the author treats the two kinds of image as faithful to different things, not equally suited to every purpose.'],
    [6, 'C3', 'Hard', 'Which of the following is most similar to the illustrator’s work as the passage describes it?',
      ['A court reporter taking down testimony word for word',
        'A lexicographer writing a definition that fits the many ways a word is actually used',
        'A painter inventing an imaginary landscape from memory',
        'A photographer retouching a portrait to flatter the sitter'], 'B',
      'The illustrator studied many specimens and judged which features were characteristic in order to depict a kind. A lexicographer does the same with many uses of a word. The court reporter records one instance exactly, as a photograph does; the painter invents, which the author says the illustrator did not; and retouching to flatter is idealization for its own sake.'],
  ]),

  ...set('p5', IMPROVISATION, [
    [1, 'C1', 'Easy', 'The author’s main purpose in the passage is to:',
      ['show that improvisation’s reliance on practice does not make it any less spontaneous',
        'expose improvisation as a fraud practiced on audiences',
        'compare the training and careers of jazz musicians with those of classical composers in the same period',
        'explain how students can learn famous solos from old recordings'], 'A',
      'The passage grants that improvisation rests on long preparation, then argues that this “does not follow” to make it a fraud: its materials are learned but its choices are made in the moment. Careers and the learning of solos come up only in passing, if at all.'],
    [2, 'C1', 'Medium', 'According to the passage, what is new in a witty conversational reply?',
      ['Its words, which the speaker invents on the spot',
        'Its grammar, which each speaker adjusts to suit the particular conversation and listener',
        'Its stock phrases, which the speaker has never used before',
        'The combination of learned materials, and its fit to the remark it answers'], 'D',
      'The passage says the speaker’s vocabulary, grammar and stock phrases are not invented in the moment. “What is new in the reply is the combination, and the fit between the reply and the remark that provoked it.”'],
    [3, 'C2', 'Easy', 'The author uses the example of the conversationalist mainly to:',
      ['suggest that conversation is itself a kind of music',
        'show that using learned materials is compatible with spontaneity',
        'argue that improvisers practice less than audiences believe',
        'illustrate the difference between composing music and improvising it on stage'], 'B',
      'The example answers the claim that practice makes improvisation a fraud: nobody thinks a witty reply is not spontaneous just because its words and phrases were learned. The author does not equate conversation with music, says improvisers practice a great deal, and takes up composition only in the next paragraph.'],
    [4, 'C3', 'Hard', 'A composer writes a piece by improvising at the piano, keeping only the passages she likes and then revising them. Based on the passage, the author would most likely say that the finished piece is:',
      ['an improvisation, because every passage in it began as something she played at the keyboard',
        'an improvisation, because its materials were learned',
        'a composition, because she could revise before committing to it',
        'a composition, because it contains no learned materials'], 'C',
      'For the author, what separates composition from improvisation is not where the material comes from but whether the maker can revise at leisure or must commit to each choice as it is made. This composer selected and revised, so the finished piece is a composition. Both composers and improvisers use learned materials, so neither the second nor the fourth choice fits the passage.'],
    [5, 'C3', 'Medium', 'Which of the following findings would most challenge the author’s account of improvisation?',
      ['Improvising musicians report practicing for several hours a day.',
        'Audiences say they enjoy improvised music more than composed music.',
        'Many composers revise their scores several times before a first performance, and again after hearing it played.',
        'Most supposedly improvised solos in one style were in fact planned in full before each performance.'], 'D',
      'The author’s account depends on a solo’s choices being made in the moment, in response to a situation that did not yet exist. Solos planned in full beforehand would contradict that. Heavy practice fits the account, composers revising is what the author says they do, and audience preference is beside the point.'],
    [6, 'C3', 'Hard', 'Based on the passage, a student who plays a famous recorded solo note for note is most like someone who:',
      ['repeats, word for word, a witty reply that another person once made in a conversation',
        'revises a score several times before it is first performed',
        'invents a new solo over the chords of a familiar tune',
        'translates a poem from one language into another'], 'A',
      'The student reproduces every note but loses “the relation between the notes and the situation they answered.” Repeating someone else’s witty reply outside its original conversation keeps the words but loses the fit to the remark that provoked it, which is the author’s own conversational analogy. Inventing a new solo is improvisation itself.'],
  ]),

  ...set('p6', GIFTS, [
    [1, 'C1', 'Easy', 'Which of the following best states the author’s central claim?',
      ['Gifts are trades disguised by the language of generosity.',
        'Generous people give gifts without expecting anything in return.',
        'Gifts create lasting obligations, which is what sets them apart from market exchanges.',
        'Gift-giving is far more elaborate and explicitly managed in other societies than it is in our own.'], 'C',
      'The author argues that gifts create obligations and that, unlike market exchanges, an exchange of gifts is never finished, which keeps the parties bound. The author rejects the idea that gifts are disguised trades, doubts that gifts are free in the sense of expecting nothing, and mentions other societies only in passing.'],
    [2, 'C2', 'Easy', 'The author’s example of handing back a gift’s “cash value on the spot” is meant to show that:',
      ['gifts ought to be valued in money, so that neither party misunderstands what is owed',
        'exact, immediate repayment refuses the relationship that a gift sustains',
        'recipients are often unsure how much a gift cost',
        'markets and gifts both depend on prompt payment'], 'B',
      'The passage says that repaying a gift at once and exactly “is not to settle a debt but to refuse the relationship, and it is felt as an insult.” The example contrasts gifts with markets rather than likening them, and it is not about pricing gifts or recipients’ uncertainty.'],
    [3, 'C2', 'Hard', 'The author’s claim that the language of free giving is “a necessary part of the practice” assumes that:',
      ['openly pricing an obligation would change how the people involved understand their relationship',
        'most people do not realize that gifts create obligations',
        'every society manages its gifts in the explicit and elaborate way that some societies do',
        'societies that exchange gifts have no loans, contracts or other arrangements that carry a stated price'], 'A',
      'The argument runs: if gifts were openly priced they would become loans, and the relationship would become a contract. That only follows if putting a price on the obligation changes how the parties understand what is between them. The author says people are well aware of gift obligations, that the explicit management happens only in some societies, and nothing about loans being absent.'],
    [4, 'C3', 'Medium', 'Based on the passage, which of the following would the author most likely regard as a gift used as an instrument of control?',
      ['Two old friends exchanging birthday presents of roughly similar value, as they have done for years',
        'A customer paying a baker for a loaf of bread',
        'A neighbor returning a borrowed ladder the next day',
        'A landlord giving a tenant a present far beyond the tenant’s means to return'], 'D',
      'The last paragraph says a gift too large to be returned can humiliate its recipient or place him in the giver’s power, and a present the tenant can never return does exactly that. The friends’ exchange is the reciprocity that binds friends, buying bread is a completed market exchange, and returning a ladder is repaying a loan.'],
    [5, 'C3', 'Hard', 'Which of the following findings would most weaken the author’s account of gifts?',
      ['In some societies, gifts are exchanged only on fixed ceremonial occasions.',
        'Where gifts are always repaid at once and in full, bonds between givers last just as long.',
        'People spend more on gifts for close relatives than for acquaintances.',
        'Gifts that cannot be returned are often resented by those who receive them, especially by people of lower status.'], 'B',
      'The author holds that the delay and imbalance in returning gifts are what keep the relationship alive, and that exact, immediate repayment refuses it. If bonds lasted just as long where gifts are always repaid at once and in full, the imbalance would not be doing that work. Resentment of gifts that cannot be returned fits the author’s last paragraph, and the other two findings are neutral.'],
    [6, 'C3', 'Medium', 'A company gives its employees a holiday bonus described as “a gift from the owners.” According to the passage, whether the bonus expresses goodwill or control depends mainly on:',
      ['how large the bonus is compared with each employee’s pay',
        'whether the owners sincerely mean what they say when they describe the bonus as a gift',
        'whether the employees can, in time, give something back in return',
        'whether it is paid in cash or given as goods'], 'C',
      'The passage ends by saying that whether a gift expresses affection or domination “cannot be read from the gift itself. It depends on whether the recipient can, in time, reciprocate.” The size of the bonus and whether it is cash or goods are features of the gift itself, and the owners’ sincerity is not the test the author gives.'],
  ]),
  ...set('p7', RESTORATION, [
    [1, 'C1', 'Easy', 'Which of the following best states the main point of the passage?',
      ['Every intervention on an old building favors one of its histories, and that choice should be made openly.',
        'Restoration is preferable to conservation, because it returns a building to the form its original builders intended it to have.',
        'Conservation is always the right choice, because a visible repair does no harm to a building.',
        'Decisions about old buildings are technical questions, best left to trained architects.'], 'A',
      'The final paragraph states the lesson: no answer is always right, every intervention makes a claim about which history deserves to be seen, and the honest course is to make that claim openly. The author criticizes restoration, says visible repairs can disfigure a building, and insists the question cannot be settled by technical skill alone.'],
    [2, 'C1', 'Easy', 'According to the passage, critics of nineteenth-century restoration objected mainly that it:',
      ['used new materials that decayed faster than the original stone and timber they replaced', 'cost more than most of the communities that owned the buildings could afford',
        'erased most of a building’s recorded history in favor of a guess about its beginning', 'left many buildings unsafe'], 'C',
      'The critics saw an old building as “a document” of the centuries that shaped it, and charged that scraping it back to its original form erased most of that record in favor of a guess, which was often wrong. The passage says nothing about materials, cost or safety.'],
    [3, 'C2', 'Medium', 'The author’s remark that many restored buildings “tell us more about the nineteenth century than about the Middle Ages” suggests that:',
      ['nineteenth-century builders were more skilled than the medieval builders they followed',
        'the restorers built their own era’s ideas into the buildings',
        'most medieval buildings had to be rebuilt in the nineteenth century to remain safe',
        'historians now value nineteenth-century architecture above medieval work'], 'B',
      'The remark follows the point that restorers “filled the gaps with their own ideas of what the past should have been.” What they built therefore records nineteenth-century taste rather than medieval fact. The remark does not compare skill, safety or historians’ preferences.'],
    [4, 'C3', 'Medium', 'A town’s war memorial, damaged in a storm, is the focus of a yearly ceremony, and the residents want it to look whole again. Based on the passage, the author would most likely:',
      ['insist that any repair be plainly visible, whatever the residents want', 'recommend leaving the damage untouched as a record of the storm',
        'say that experts alone should decide, since the question is a technical one', 'accept making it whole, provided the work and the reasons for it are recorded'], 'D',
      'The author notes that when a building’s meaning to a community depends on its being whole, a visible patch may fail that community, and concludes that no answer is always right as long as the choice is made openly and recorded. Insisting on visible repair is the principle the author says can demand too much, and the author denies the question is merely technical.'],
    [5, 'C3', 'Hard', 'Which of the following, if true, would most weaken the critics’ claim that restoration destroyed a valuable record?',
      ['Drawings and descriptions made before each restoration preserve the evidence of its earlier state.',
        'Some restored buildings attract more visitors than similar buildings that were left unrestored.',
        'Many of the restorers had been trained as architects rather than as historians of the Middle Ages.',
        'Visible repairs usually cost more than repairs designed to blend in with the old work.'], 'A',
      'The critics’ objection is that restoration erased the record of a building’s history. If that evidence survived in thorough drawings and descriptions, the record would not be lost, even if the building changed. Visitor numbers and cost are beside the point, and restorers lacking historical training would, if anything, support the critics.'],
    [6, 'C3', 'Hard', 'The author’s recommendation to “record what was done and why” most closely resembles which of the following practices?',
      ['A museum that displays only objects in perfect condition, hiding any that are damaged', 'An editor who silently corrects the errors in an old manuscript before publishing it',
        'A scientist who publishes her methods with her results so others can check them', 'A translator who smooths a difficult poem so that readers will enjoy it more'], 'C',
      'The author wants each intervention’s choices made visible so that later generations “can see what it is disagreeing with.” Publishing methods alongside results does the same: it exposes the choices behind a result to scrutiny. Silent correction and smoothing hide the choices that were made, which is the opposite.'],
  ]),

  ...set('p8', DIALECTS, [
    [1, 'C1', 'Easy', 'The author’s main purpose is to argue that:',
      ['schools should stop teaching the standard variety of English to students who speak another dialect', 'nonstandard dialects are older and more logical than the standard',
        'the standard is one dialect among many and should be taught as an addition, not a correction', 'double negatives make speech harder to understand'], 'C',
      'The passage argues that the standard is “one dialect among many, set apart by history rather than by merit,” and that it “should be taught as an additional variety … not as the correction of a broken one.” The author explicitly denies that schools should stop teaching it, and does not claim other dialects are more logical.'],
    [2, 'C1', 'Easy', 'According to the passage, what sets the standard variety apart from other dialects?',
      ['Its history and the prestige it gained', 'Its greater logical consistency and clarity',
        'Its age, since the other dialects descended from it', 'Its larger, more precise vocabulary of words'], 'A',
      'The standard is usually the speech of a capital, court or educated class that became the model for printing, schooling and official business, and so “took on the prestige of those institutions.” The author says other dialects did not decay from it and are often as old, and that it is not more logical.'],
    [3, 'C2', 'Medium', 'The author mentions French and Spanish mainly to:',
      ['show that English borrowed the double negative from those languages long ago', 'suggest that English speakers should adopt the grammar of French and Spanish',
        'illustrate how languages decay over time', 'show that the double negative is not illogical in itself'], 'D',
      'The mention supports the claim that the double negative “is not a failure of logic”: a construction that is standard in major languages cannot be inherently illogical. The author says nothing about borrowing or adopting grammar, and argues against the idea that dialects decay.'],
    [4, 'C2', 'Medium', 'In the third paragraph, the author responds to critics of linguists mainly by:',
      ['denying that a shared standard has any practical value', 'granting that the standard is useful, while denying that other dialects are broken',
        'arguing that teachers should stop correcting students’ writing', 'claiming that students who speak the standard learn more slowly'], 'B',
      'The author concedes that a shared standard has real uses and that a student without it is at a disadvantage, then narrows the claim: the standard should be taught as an addition, not as a correction of a broken dialect. The author does not deny its value, oppose all correction, or claim standard speakers learn more slowly.'],
    [5, 'C3', 'Hard', 'Which of the following findings would most support the author’s claim in the final paragraph?',
      ['Students taught only the standard variety score higher on grammar tests than students taught both varieties side by side.',
        'Most teachers already treat their students’ home dialects as systems with rules of their own.',
        'Students taught by comparing the two varieties wrote more standard English than those whose dialect was marked wrong.',
        'Speakers of the standard variety rarely learn to use a second dialect.'], 'C',
      'The final paragraph claims that comparing the home dialect with the standard helps students learn the standard more readily than marking the dialect wrong. A finding that such students wrote more standard English supports this directly. Higher scores for students taught only the standard would cut against it, and the other two findings do not bear on the claim about teaching.'],
    [6, 'C3', 'Hard', 'Based on the passage, how would the author most likely view a job applicant who speaks his home dialect with friends and the standard variety in interviews?',
      ['As skilled in knowing when each variety fits', 'As inconsistent in a way that suggests an incomplete education',
        'As giving up his home dialect under social pressure', 'As speaking incorrectly when he is with his friends'], 'A',
      'The passage ends by calling the ability to use two varieties, and to know when each is expected, “itself a linguistic skill.” The author rejects the idea that a home dialect is incorrect, and the applicant has kept his dialect rather than giving it up.'],
  ]),

  ...set('p9', FORGERY, [
    [1, 'C1', 'Easy', 'The passage is primarily concerned with:',
      ['describing how a forger deceived the art experts of his time', 'arguing that the art market values famous names more than merit',
        'explaining how experts detect a forgery by looking closely at it', 'explaining why a forgery can be worth less than an original even when the two look alike'], 'D',
      'The passage uses the forger’s case to pose its question, why a forgery that deceives the eye is worth less, and spends the rest answering it: the forgery lacks the original’s achievement. The market’s love of names is conceded in passing, and the case itself is only the starting point.'],
    [2, 'C2', 'Easy', 'The author grants that the “snobbery” answer has “the appeal of honesty” but rejects it because it:',
      ['ignores how much forgers are paid for their work', 'assumes that only the look of a painting is valued',
        'exaggerates how skillful most forgers really are', 'depends on the experts having been fooled by the forgeries'], 'B',
      'The author says the snobbery answer “assumes that what we value in a painting is only how it looks, and that assumption is doubtful,” then argues that we also value the achievement a painting represents. The other choices raise points the passage never makes.'],
    [3, 'C2', 'Medium', 'The example of a student who copies out a proof is used to show that:',
      ['the same result can come from different acts', 'copying the work of another person is always a form of cheating',
        'students learn mathematics mainly by imitating their teachers', 'forgers are more skillful than the painters they copy'], 'A',
      'The example follows the sentence “Two results that look alike can come from different kinds of act”: the copied proof is correct, yet copying it is not proving. So too a forgery can look like a Vermeer without being the achievement a Vermeer is. The example is not about cheating in general or how mathematics is learned.'],
    [4, 'C3', 'Medium', 'Based on the passage, how would the author most likely regard a skillful copy of a famous painting that is openly sold as a copy?',
      ['As a fraud, since it imitates another painter’s solution to the problems of light and space', 'As equal in value to the original, since the two look the same',
        'As an honest imitation, admirable for its skill but not the original’s kind of achievement', 'As worthless, since only original works have any value'], 'C',
      'For the author, the forger’s skill is real but is “the skill of imitation,” and the forgery is “not a worse painting but a different thing.” An openly sold copy has that same kind of skill without the deception, so it is an honest imitation. The author does not call imitation worthless or equate it with the original.'],
    [5, 'C3', 'Hard', 'Which of the following, if true, would most weaken the author’s explanation of why the experts’ judgments changed after the forgeries were exposed?',
      ['The forger had studied Vermeer’s methods closely for many years.', 'A few experts had doubted the paintings from the start.',
        'Prices for the forger’s own paintings rose again decades later.', 'Experts who were falsely told that a genuine Vermeer was a forgery soon found stiff faces and awkward drawing in it too.'], 'D',
      'The author says the experts, once they knew the truth, saw the fakes “more accurately than before.” If experts find the same flaws in a genuine painting merely because they are told it is fake, the flaws they noticed are more likely produced by the label than discovered, which undercuts the claim of greater accuracy. The other findings leave that explanation untouched.'],
    [6, 'C3', 'Hard', 'Which of the following is most similar to a forgery, as the author understands it?',
      ['A pianist who plays a famous sonata from the printed score', 'A runner who finishes a marathon after secretly riding a bus for part of the course',
        'A painter who works in the style of an earlier school', 'A scholar who translates an old poem into modern English'], 'B',
      'For the author, a forgery presents the look of an achievement without the achievement itself. The runner’s finish looks like a marathon completed but is not one. The pianist, the painter in an earlier style and the translator make no false claim to someone else’s achievement.'],
  ]),
];
