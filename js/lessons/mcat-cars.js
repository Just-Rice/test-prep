// Lessons for the MCAT's Critical Analysis and Reasoning Skills section (CARS), one for each of the three skills
// the AAMC tests there.
//
// CARS has no content to learn, so these teach ways of reading instead: what each kind of question asks, how to
// find its answer in the passage, and the traps its wrong answers tend to set. Each worked example is a short
// original passage with one question, answered step by step. The links go to Khan Academy’s CARS practice,
// which was made with the AAMC.

const KHAN_CARS = 'https://www.khanacademy.org/test-prep/mcat/critical-analysis-and-reasoning-skills-practice-questions';
const PRACTICE = { label: 'Khan Academy: CARS practice passages', url: KHAN_CARS };
const tutorial = (video, label) => ({ label: `Khan Academy: ${label}`, url: `${KHAN_CARS}/critical-analysis-and-reasoning-skills-tutorial/v/${video}` });

export const MCAT_CARS_LESSONS = [
  {
    id: 'c1', skill: 'C1: Foundations of comprehension',
    title: 'Reading for the argument',
    body: [
      'The CARS section has nine passages from the humanities and social sciences, each followed by five to seven questions, 53 in all. It tests reasoning, not knowledge: everything you need is in the passage, and outside facts can mislead you. About 30% of the questions check comprehension. They ask for the main idea, the meaning of a word or phrase as the author uses it, or a detail from a particular paragraph.',
      'Read for the argument rather than for facts. As you go, notice what the author claims, what evidence or examples back it up, and where the author concedes a point or turns against one. Words like “yet”, “but”, “however” and “it would be a mistake” usually mark the turn to the author’s own view. A one-line summary of each paragraph, kept in your head or on the noteboard, makes most comprehension questions quick.',
      'For a main-idea question, the right answer covers the whole passage and matches the author’s view. Wrong answers are often too narrow (true of one paragraph only), too extreme (“always”, “every”, “only”), or a view the author describes in order to reject it. For a detail question, go back to the paragraph and check each choice against the text, not against your memory of it.',
    ],
    terms: [
      ['Main idea', 'The central claim that the whole passage supports, not a point from one paragraph.'],
      ['Thesis', 'The position the author argues for, often stated after the views the author rejects.'],
      ['Concession', 'A point the author grants to the other side before answering it.'],
      ['Tone', 'The author’s attitude toward the subject: approving, skeptical, neutral, ironic.'],
      ['Paraphrase', 'The same idea in different words; right answers are usually paraphrases, not quotations.'],
      ['Scope', 'How much a claim covers. Answers that go beyond the passage’s scope are wrong.'],
    ],
    example: {
      problem: 'Passage: “Critics often dismiss detective fiction as formula. Yet the formula is the point: readers who know the rules can compete with the detective, and a writer who breaks a rule without warning has cheated them. The genre’s pleasures are those of a game, not those of a failed novel.” Which choice states the author’s main point? (A) Detective fiction is inferior to the serious novel. (B) The formula of detective fiction is what makes it enjoyable. (C) Critics misunderstand all popular fiction. (D) Readers prefer detective fiction to other novels.',
      steps: [
        'Find the turn: “Yet the formula is the point” marks the author’s own view, after the critics’ view it answers.',
        'Check that the rest supports it: readers compete with the detective, and breaking the rules cheats them, so the formula is the source of the pleasure.',
        'Rule out the others: (A) is the critics’ view, which the author rejects; (C) goes beyond the passage, which is about one genre; (D) is never claimed.',
      ],
      answer: '(B) The formula of detective fiction is what makes it enjoyable.',
    },
    links: [tutorial('foc', 'Foundations of comprehension'), PRACTICE],
  },
  {
    id: 'c2', skill: 'C2: Reasoning within the text',
    title: 'How the argument works',
    body: [
      'About 30% of CARS questions ask how the parts of a passage fit together: why the author includes an example, what a paragraph contributes, which claims are backed by evidence and which are simply asserted, and what the author must be assuming for the argument to hold.',
      'For a question of the form “the author mentions X in order to”, ask what the argument needed at that point: an illustration, a counterexample, a concession, or a step toward the conclusion. For an assumption question, look for the missing link between the evidence and the conclusion. A good test is to deny a choice: if the argument falls apart when that choice is false, it is the assumption.',
      'Support questions ask whether a claim rests on evidence in the passage. Separate what the author shows, with examples, data or reasoning, from what the author merely states. Notice, too, when the passage reports someone else’s view without endorsing it; a view the author describes is not a view the author holds.',
    ],
    terms: [
      ['Function', 'The job a sentence, example or paragraph does in the argument.'],
      ['Assumption', 'An unstated claim that the argument needs in order to reach its conclusion.'],
      ['Evidence', 'The examples, data or reasoning offered in support of a claim.'],
      ['Counterexample', 'A case that contradicts a general claim.'],
      ['Inference', 'A conclusion the passage supports without stating it outright.'],
      ['Qualification', 'A limit the author places on a claim, such as “often” or “in most cases”.'],
    ],
    example: {
      problem: 'Passage: “Officials say the city’s new bicycle lanes have reduced accidents, pointing to a 20% fall in reported collisions on those streets since the lanes opened. But the same year saw months of construction detours that sharply cut the number of cyclists using those streets.” What does the second sentence mainly do? (A) It confirms the officials’ conclusion. (B) It offers another explanation for the fall in collisions. (C) It shows that the lanes caused the detours. (D) It argues that bicycle lanes are unsafe.',
      steps: [
        'Identify the claim being examined: the lanes caused the fall in collisions.',
        'Ask what the second sentence adds: fewer cyclists on those streets would mean fewer collisions whether or not the lanes helped.',
        'So it weakens the officials’ reasoning by offering an alternative cause. It does not say the lanes are unsafe or that they caused the detours.',
      ],
      answer: '(B) It offers another explanation for the fall in collisions.',
    },
    links: [tutorial('rwt', 'Reasoning within the text'), PRACTICE],
  },
  {
    id: 'c3', skill: 'C3: Reasoning beyond the text',
    title: 'Taking the argument further',
    body: [
      'The largest share of CARS questions, about 40%, asks you to take the passage somewhere new: apply its ideas to a situation it never mentions, judge how a new fact would affect its argument, or pick the case that best matches its reasoning.',
      'For an application question, first state the passage’s principle in general terms, then apply it to the new case as the author would, even if you disagree. For a question about strengthening or weakening, pin down exactly which claim is at stake. The right answer bears on the link between that claim and its support; wrong answers are often about the same topic but leave the argument untouched.',
      'Beware of answers that are true in the world but not supported by the passage, and of answers that go further than the author would. The test is always what follows from the passage, not what you know or believe. When two choices both seem to fit, prefer the one that depends on the passage’s central reasoning rather than on a passing detail.',
    ],
    terms: [
      ['Application', 'Using the passage’s principle to judge a case it does not discuss.'],
      ['Strengthen', 'Make an argument’s conclusion more likely, usually by supporting a weak link.'],
      ['Weaken', 'Make an argument’s conclusion less likely, often by supplying another explanation.'],
      ['Analogy', 'A case with the same structure of reasoning as the passage, in a different setting.'],
      ['Extrapolation', 'Extending a passage’s reasoning to new circumstances.'],
      ['Principle', 'A general rule that an argument relies on, which can be applied elsewhere.'],
    ],
    example: {
      problem: 'Passage: “A library that measures its success by the number of books it lends will favor bestsellers, which are borrowed often, over the reference works and rare titles that only a library would keep. The measure rewards the library for doing what bookshops already do.” Which situation is most analogous? (A) A bookshop that stocks only bestsellers. (B) A hospital judged by the number of patients it sees that favors quick routine visits over complex care that only it provides. (C) A school library that lends more books after extending its hours. (D) A reader who prefers rare books to bestsellers.',
      steps: [
        'State the reasoning in general terms: a measure of volume pushes an institution toward what is common, away from what only it can offer.',
        'Look for the same structure elsewhere: the hospital’s measure of patient numbers pushes it toward routine visits and away from the complex care only it provides.',
        'The others share the topic of books but not the structure: (A) has no distorting measure, (C) involves no trade-off, and (D) is a personal preference.',
      ],
      answer: '(B) A hospital judged by the number of patients it sees that favors quick routine visits over complex care that only it provides.',
    },
    links: [{ label: 'Khan Academy: CARS tutorial and worked examples', url: `${KHAN_CARS}/critical-analysis-and-reasoning-skills-tutorial` }, PRACTICE],
  },
];
