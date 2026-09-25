// Original passage sets for the MCAT's Psychological, Social, and Biological Foundations section, written for this
// app: the AAMC publishes no question bank, and its practice material may not be copied. The studies and places
// described are invented for these questions, though each reflects well-established findings.
//
// Three sets of four, each built on a study, as in the real section, which leans heavily on research design.
// Every question carries its whole passage, and the questions from one passage share a `set`. Planned before
// writing: three answers on each letter and four questions at each tier.

const DOMAIN = {
  6: 'Sensing and processing (Foundational Concept 6)',
  7: 'Individual behavior (Foundational Concept 7)',
  9: 'Social structure and demographics (Foundational Concept 9)',
  10: 'Social inequality (Foundational Concept 10)',
};
const SKILL = {
  '6B': '6B: Making sense of the environment',
  '7B': '7B: Social processes that influence human behavior',
  '9A': '9A: Understanding social structure',
  '9B': '9B: Demographic characteristics and processes',
  '10A': '10A: Social inequality',
};

// A passage and its questions. Each question is [number, content category, tier, stem, choices, answer, rationale].
const set = (id, passage, questions) => questions.map(([n, code, difficulty, stem, choices, answer, rationale]) => ({
  id: `mcat-ps-${id}-${n}`, exam: 'mcat', section: 'PS', domain: DOMAIN[parseInt(code, 10)], skill: SKILL[code],
  difficulty, set: `mcat-ps-${id}`, passage, stem, choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
}));

const SLEEP = `Researchers asked whether sleep after learning helps people keep what they have learned, and whether one kind of sleep matters more than another. Sixty adult volunteers each learned a list of 40 pairs of unrelated words at 9 p.m. and were tested on it at 9 p.m. the next day, by being shown the first word of each pair and asked for the second.

The volunteers were randomly assigned to spend the night in the laboratory in one of three ways. Group 1 slept normally. Group 2 stayed awake all night under supervision. Group 3 slept, but was woken briefly each time the recordings showed REM sleep beginning, which removed most REM sleep while leaving deep, slow-wave sleep largely intact. After the night, all three groups went about their usual activities during the day, without napping, before returning for the test.

The mean number of pairs recalled was 31 in group 1, 22 in group 2 and 29 in group 3.

The researchers concluded that sleep helps to consolidate newly learned word pairs. Because removing most REM sleep made little difference, they suggested that slow-wave sleep may matter more than REM sleep for this kind of memory.`;

const NEIGHBORHOODS = `Two neighborhoods in one city lie about three miles apart. In Northgate, the median household income is $38,000, 31% of households have no car, and the nearest full-service grocery store is 2.4 miles away. Life expectancy at birth is 71 years. In Lakeview, the median household income is $112,000, 4% of households have no car, and three grocery stores lie within a mile. Life expectancy at birth is 83 years.

The gap has a history. In the 1930s, federal maps used by mortgage lenders marked Northgate and several nearby neighborhoods as hazardous for lending, a practice later called redlining. For decades residents found it hard to get loans to buy or repair homes, property values stagnated, and businesses and wealthier families moved elsewhere. Lending by race was outlawed in 1968, but the neighborhoods that were redlined remain poorer today on average than those that were not.

A city health team is deciding how to respond. One proposal is to open a free clinic in Northgate. Another is to fund a grocery store there and a bus route linking it to the job centers in Lakeview. Before deciding, the team plans to gather more data, since Northgate’s residents are also younger on average than Lakeview’s.`;

const BYSTANDERS = `Researchers studied helping in a university library. A student who sat down to work alone at a large study table was assigned at random to one of six conditions. In every condition, a young woman (a confederate) walked past, dropped a stack of papers, and began slowly picking them up. The researchers recorded whether the student helped within 30 seconds.

In three conditions, the student was the only person at the table, or had one or four other people at the table with them. The others were also confederates, who glanced at the spill and went on studying. The share of students who helped was 78% when alone, 55% with one other person present and 29% with four others present.

The other three conditions were the same, except that the woman looked directly at the student and said, “Could you give me a hand?” In these conditions, about 90% of students helped, whether they were alone, with one other person or with four others.`;

export const MCAT_PS_PASSAGE_QUESTIONS = [
  ...set('p1', SLEEP, [
    [1, '6B', 'Easy', 'What is the independent variable in this study?',
      ['How participants spent the night after learning', 'The number of word pairs each participant recalled',
        'The time of day at which participants were tested', 'The list of word pairs that participants learned'], 'A',
      'The independent variable is what the researchers manipulated: the kind of night each group had (normal sleep, no sleep, or sleep with REM removed). The number of pairs recalled is the dependent variable, and the time of testing and the word list were kept the same for everyone.'],
    [2, '6B', 'Medium', 'Which conclusion do the results best support?',
      ['REM sleep is essential for remembering new word pairs.', 'Staying awake after learning makes new word pairs easier to recall the next day.',
        'Sleep after learning aids recall, and losing most REM sleep costs little.', 'Slow-wave sleep plays no part in remembering word pairs.'], 'C',
      'Group 1 recalled far more than group 2 (31 against 22), so sleep helped, while group 3, which lost most of its REM sleep, still recalled 29. If REM sleep were essential, group 3 should have done about as badly as group 2. Nothing in the results rules out slow-wave sleep, which group 3 kept.'],
    [3, '6B', 'Hard', 'A critic argues that group 2 recalled less not because they missed sleep after learning, but because they were exhausted at the test. Which change to the design would best answer this criticism?',
      ['Giving group 2 more word pairs to learn', 'Letting all groups sleep normally for a night before the test',
        'Testing group 2 early in the morning, when people are most alert', 'Using pictures instead of word pairs'], 'B',
      'The criticism is that tiredness at the test, not the missing sleep after learning, lowered group 2’s scores. Giving every group a night of recovery sleep before testing would leave the groups differing only in the night right after learning. Testing group 2 at a different time would add a new difference between groups, and changing the materials does not address fatigue.'],
    [4, '6B', 'Easy', 'Recalling the second word of a learned pair is an example of which kind of memory?',
      ['Implicit (procedural) memory', 'Sensory memory', 'Priming', 'Explicit (declarative) memory'], 'D',
      'Consciously recalling information such as facts or word pairs uses explicit, or declarative, memory. Implicit memory shows itself in performance without conscious recall, as in skills (procedural memory) or priming, and sensory memory lasts only a second or two.'],
  ]),

  ...set('p2', NEIGHBORHOODS, [
    [1, '10A', 'Easy', 'The difference in life expectancy between Northgate and Lakeview is best described as:',
      ['a demographic transition', 'a health disparity linked to social class and place', 'a cohort effect', 'an error caused by sampling'], 'B',
      'A health disparity is a difference in health between groups that follows social advantage and disadvantage, here income and neighborhood. The demographic transition describes changing birth and death rates as a society develops, and a cohort effect is a difference between people born at different times.'],
    [2, '9A', 'Medium', 'Which sociological perspective would most likely describe redlining as a way for more powerful groups to use institutions to protect their own advantages?',
      ['Conflict theory', 'Functionalism', 'Symbolic interactionism', 'Rational choice theory'], 'A',
      'Conflict theory analyzes society as competition over scarce resources, in which dominant groups shape institutions, such as lending, to keep their advantages. Functionalism would ask what function a practice serves for society as a whole, symbolic interactionism would focus on meanings in everyday interaction, and rational choice theory on individuals weighing costs and benefits.'],
    [3, '10A', 'Hard', 'Which statement about the data in the passage is best supported?',
      ['The lack of grocery stores is the cause of Northgate’s shorter life expectancy.', 'Income is unrelated to health in this city.',
        'Redlining stopped affecting these neighborhoods once lending by race was outlawed in 1968.', 'They differ in several ways at once, so these data cannot show which causes the gap.'], 'D',
      'The two neighborhoods differ in income, car ownership, access to food and history all together, so comparing them cannot separate the effect of any one factor: the data are correlational. The passage itself says the redlined neighborhoods remain poorer today, and the data show health and income going together, not unrelated.'],
    [4, '9B', 'Hard', 'Northgate’s residents are younger on average than Lakeview’s. If the team wants to compare how often people die in the two neighborhoods, they should use:',
      ['the total number of deaths recorded in each neighborhood', 'the crude death rate of each neighborhood',
        'age-adjusted death rates for the two neighborhoods', 'the birth rate of each neighborhood'], 'C',
      'Older people die at higher rates, so a younger neighborhood can have a lower crude death rate even if its people are less healthy at every age. Age adjustment compares the neighborhoods as if they had the same age structure. Total deaths also depend on population size, and birth rates do not measure deaths at all.'],
  ]),

  ...set('p3', BYSTANDERS, [
    [1, '7B', 'Easy', 'The fall in helping as more people were present is known as:',
      ['social loafing', 'groupthink', 'the bystander effect', 'deindividuation'], 'C',
      'The bystander effect is the finding that each person is less likely to help when others are present. Social loafing is reduced effort on group tasks, groupthink is a group’s push for agreement overriding judgment, and deindividuation is a loss of self-awareness in a crowd.'],
    [2, '7B', 'Medium', 'Why did a direct request raise helping to about 90% at every group size?',
      ['It increased the number of people who saw the spill.', 'It made the students afraid of being punished if they did not help.',
        'It made the woman seem more attractive to the students.', 'It put responsibility on one person, so it could not be diffused.'], 'D',
      'Without a request, responsibility for helping is shared among everyone present, so each person feels less of it: diffusion of responsibility. Asking one student directly gave that student the whole responsibility, which is why group size stopped mattering. Nothing in the passage suggests fear of punishment or attraction.'],
    [3, '7B', 'Medium', 'The confederates who glanced at the spill and went on studying probably reduced helping further by:',
      ['signaling through their inaction that no help was needed', 'making the student feel anonymous and less self-aware',
        'improving the student’s performance through social facilitation', 'creating a sense that the student owed them a favor'], 'A',
      'In an ambiguous situation people look to others to decide what is happening. Onlookers who do nothing suggest that help is not needed, a form of informational social influence sometimes called pluralistic ignorance. Anonymity, social facilitation and reciprocity do not explain why others’ inaction would lower helping here.'],
    [4, '7B', 'Hard', 'Which feature of the study most allows the researchers to conclude that the number of people present caused the change in helping?',
      ['The confederates were trained to act the same way every time.', 'Each student was assigned at random to a condition.',
        'Helping was measured within a fixed 30 seconds.', 'The study took place in a quiet library.'], 'B',
      'Random assignment spreads students’ personal differences, such as how helpful they are, evenly across the conditions, so the only systematic difference is the one the researchers created. The confederates’ consistency and the fixed time limit make the measurements comparable, but without random assignment the groups might have differed from the start.'],
  ]),
];
