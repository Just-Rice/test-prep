// Lessons for the MCAT's Psychological, Social, and Biological Foundations section, one per AAMC content category.
//
// Each is a short, plain-language pass over what the category covers: enough to answer its Foundation questions
// and to know what to read next. The links go to the free OpenStax Psychology and Introduction to Sociology
// textbooks (every chapter address checked to exist, and to be the chapter named, when written) and to Khan
// Academy's MCAT course, made with the AAMC. The worked examples are re-checked by tests/mcat-questions.test.js.

const psychology = (chapter, label) => ({ label: `OpenStax Psychology 2e: ${label}`, url: `https://openstax.org/books/psychology-2e/pages/${chapter}-introduction` });
const sociology = (chapter, label) => ({ label: `OpenStax Introduction to Sociology 3e: ${label}`, url: `https://openstax.org/books/introduction-sociology-3e/pages/${chapter}-introduction` });
const khan = (unit, label) => ({ label: `Khan Academy: ${label}`, url: `https://www.khanacademy.org/test-prep/mcat/${unit}` });
const PROCESSING = khan('processing-the-environment', 'MCAT processing the environment');
const BEHAVIOR = khan('behavior', 'MCAT behavior');
const INDIVIDUALS = khan('individuals-and-society', 'MCAT individuals and society');
const SOCIETY = khan('society-and-culture', 'MCAT society and culture');
const INEQUALITY = khan('social-inequality', 'MCAT social inequality');

export const MCAT_PS_LESSONS = [
  {
    id: '6a', skill: '6A: Sensing the environment',
    title: 'Sensation and perception',
    body: [
      'Sensation is detecting energy with sensory receptors and converting it into nerve signals (transduction); perception is organizing and interpreting those signals. The absolute threshold is the weakest stimulus detected half of the time. The difference threshold, or just-noticeable difference, follows Weber’s law: it is a constant fraction of the original stimulus. Signal detection theory adds that whether we report a faint signal also depends on expectation and motivation, giving hits, misses, false alarms and correct rejections. Unchanging stimuli fade from notice (sensory adaptation).',
      'In vision, light passes through the cornea, pupil and lens to the retina. Rods work in dim light but see no color; cones, packed into the fovea, give color and fine detail. Signals pass through bipolar and ganglion cells into the optic nerve. At the optic chiasm, fibers from the inner half of each retina cross, so each side of the brain receives the opposite half of the visual field, relayed through the thalamus to the occipital lobe. Feature detectors respond to edges, angles and motion, and color, form, motion and depth are processed in parallel.',
      'In hearing, sound vibrates the eardrum and three small bones (the ossicles), which pass the vibration into the cochlea, where hair cells on the basilar membrane transduce it. By place theory, pitch depends on where along the membrane the hair cells are most stimulated; frequency theory explains low pitches by the rate of firing. The vestibular system (the semicircular canals, utricle and saccule) senses rotation and balance. Smell and taste are chemical senses, and the somatosenses cover touch, temperature, pain and the position of the body (kinesthesia).',
    ],
    terms: [
      ['Sensory transduction', 'Converting a stimulus’s energy into nerve signals at a receptor.'],
      ['Absolute threshold', 'The weakest stimulus that can be detected half of the time.'],
      ['Weber’s law', 'The just-noticeable difference is a constant fraction of the original stimulus.'],
      ['Signal detection theory', 'Detection depends on the signal and on the observer’s expectations: hits, misses, false alarms, correct rejections.'],
      ['Fovea', 'The center of the retina, packed with cones, where vision is sharpest.'],
      ['Place theory', 'Pitch is coded by where along the basilar membrane hair cells are most stimulated.'],
    ],
    example: {
      problem: 'A person can just tell a light of 50 lux from one of 52 lux. By Weber’s law, how bright must a light be to look noticeably brighter than one of 200 lux?',
      steps: [
        'The Weber fraction is the just-noticeable difference divided by the original: 2 ÷ 50 = 0.04.',
        'At 200 lux the just-noticeable difference is 0.04 × 200 = 8 lux.',
        'So the light must be at least 200 + 8 = 208 lux.',
      ],
      answer: '208 lux',
    },
    links: [psychology(5, 'sensation and perception'), PROCESSING],
  },
  {
    id: '6b', skill: '6B: Making sense of the environment',
    title: 'Attention, thinking, sleep and memory',
    body: [
      'Attention is limited: selective attention picks out one stream (the cocktail party effect), and we can miss obvious events outside it (inattentional blindness). Piaget described cognitive development in four stages: sensorimotor (object permanence), preoperational (symbolic thought, egocentrism), concrete operational (conservation) and formal operational (abstract reasoning). In solving problems we use algorithms, which are sure but slow, and heuristics, which are fast but can mislead: the availability heuristic judges likelihood by how easily examples come to mind, and the representativeness heuristic by resemblance to a prototype.',
      'Sleep cycles about every 90 minutes through stages N1 and N2, deep slow-wave sleep (N3) and REM sleep, when most vivid dreaming occurs and the muscles are nearly paralyzed. The sleep–wake cycle follows a circadian rhythm set by the suprachiasmatic nucleus of the hypothalamus, which controls melatonin. Drugs alter consciousness: depressants such as alcohol, stimulants such as caffeine and cocaine, opioids and hallucinogens, and many act on the brain’s dopamine reward pathway.',
      'Memory has three stages: encoding, storage and retrieval. Information passes from sensory memory into working (short-term) memory, which holds about seven items, and then into long-term memory, which is explicit (facts and events) or implicit (skills and priming). The hippocampus helps form new explicit memories, and repeated activity strengthens synapses (long-term potentiation). Forgetting comes from decay and from interference: proactive, when old learning disrupts new, and retroactive, when new learning disrupts old. Broca’s area supports producing language and Wernicke’s area understanding it.',
    ],
    terms: [
      ['Selective attention', 'Focusing on one stream of information while filtering out others.'],
      ['Heuristic', 'A mental shortcut that speeds judgment but can cause errors.'],
      ['Circadian rhythm', 'The body’s roughly 24-hour cycle, set by the suprachiasmatic nucleus.'],
      ['Working memory', 'Short-term memory used actively, holding about seven items for seconds.'],
      ['Retroactive interference', 'New learning disrupting the recall of older memories.'],
      ['Long-term potentiation', 'Lasting strengthening of synapses by repeated activity, a basis of learning.'],
    ],
    example: {
      problem: 'A student learns French vocabulary one term and Spanish the next. Now Spanish words keep coming to mind when she tries to recall French. What kind of interference is this?',
      steps: [
        'Proactive interference is old learning disrupting new; retroactive interference is new learning disrupting old.',
        'Spanish was learned after French, and it is disrupting her recall of French.',
        'New learning disrupting old is retroactive interference.',
      ],
      answer: 'Retroactive interference',
    },
    links: [psychology(4, 'states of consciousness'), psychology(7, 'thinking and intelligence'), psychology(8, 'memory'), psychology(9, 'lifespan development'), PROCESSING],
  },
  {
    id: '6c', skill: '6C: Responding to the world',
    title: 'Emotion and stress',
    body: [
      'An emotion has physiological (arousal), behavioral (expression) and cognitive (feeling and appraisal) parts. Six basic emotions, happiness, sadness, fear, anger, surprise and disgust, are expressed and recognized in similar ways across cultures. Theories differ on their order. In the James–Lange theory, the body reacts first and the emotion is the experience of that reaction; in the Cannon–Bard theory, arousal and emotion happen together; in the Schachter–Singer two-factor theory, emotion is arousal plus a cognitive label taken from the situation; and in Lazarus’s theory, appraisal of the situation comes first.',
      'Emotion depends on the limbic system: the amygdala detects threats and drives fear, the hippocampus supplies context, the hypothalamus triggers the autonomic nervous system, and the prefrontal cortex regulates emotional responses. Stress is the response to events appraised as threatening. In primary appraisal we judge whether an event threatens us; in secondary appraisal, whether we can cope. Stressors range from catastrophes through major life changes to daily hassles.',
      'Stress activates the sympathetic nervous system and the hypothalamic–pituitary–adrenal axis, which releases cortisol. Selye’s general adaptation syndrome has three stages: alarm, resistance and, if stress continues, exhaustion, when illness becomes more likely. Long-lasting stress weakens the immune system and raises the risk of heart disease. Coping may be problem-focused (changing the situation) or emotion-focused (managing the feelings), and social support, exercise and a sense of control all reduce the harm stress does.',
    ],
    terms: [
      ['Universal emotions', 'Six basic emotions expressed and recognized similarly across cultures.'],
      ['James–Lange theory', 'Emotion is the experience of the body’s physiological response.'],
      ['Two-factor theory', 'Emotion is physiological arousal plus a cognitive label for it (Schachter and Singer).'],
      ['General adaptation syndrome', 'Selye’s three stages of the stress response: alarm, resistance, exhaustion.'],
      ['Primary appraisal', 'Judging whether a situation is irrelevant, harmless or threatening.'],
      ['Problem-focused coping', 'Dealing with stress by acting to change its source.'],
    ],
    example: {
      problem: 'A student faces an exam that she believes will decide her place in medical school, and she feels well prepared for it. Using Lazarus’s appraisal theory, how is she likely to experience the exam?',
      steps: [
        'In primary appraisal she judges the exam important and demanding, so it matters to her.',
        'In secondary appraisal she judges that she has the resources to cope, because she is prepared.',
        'An important event judged manageable tends to be felt as a challenge rather than as a threat.',
      ],
      answer: 'As a challenge: primary appraisal finds it important, and secondary appraisal finds it manageable',
    },
    links: [psychology(10, 'emotion and motivation'), psychology(14, 'stress, lifestyle, and health'), PROCESSING],
  },
  {
    id: '7a', skill: '7A: Individual influences on behavior',
    title: 'Biology, personality, disorders and motivation',
    body: [
      'Behavior has biological roots. Dopamine is central to reward and movement, serotonin to mood, GABA to inhibition and glutamate to excitation. Heritability, estimated from twin and adoption studies, is the share of variation in a trait in a population that is due to genes; it describes populations, not individuals, and genes and environment interact. Personality has been explained in several ways: psychoanalytic (Freud’s id, ego and superego, and the defense mechanisms), humanistic (Maslow and Rogers, and the drive to self-actualize), trait theories such as the Big Five, and social cognitive theory (Bandura’s interplay of person, behavior and environment).',
      'Psychological disorders are classified in the DSM-5 and understood through the biopsychosocial model; the diathesis–stress model holds that a vulnerability becomes a disorder under stress. Major depressive disorder brings persistent low mood and loss of interest; schizophrenia brings positive symptoms (hallucinations, delusions), linked to excess dopamine activity, and negative symptoms (flat affect, withdrawal). Other categories include anxiety disorders, obsessive-compulsive disorder, trauma-related disorders, bipolar disorder, dissociative disorders and personality disorders.',
      'Theories of motivation include drive reduction (restoring balance, as with hunger), arousal theory (the Yerkes–Dodson inverted U), incentive theory, Maslow’s hierarchy of needs and self-determination theory (autonomy, competence and relatedness). Rewarding an activity people already enjoy can weaken their intrinsic motivation (the overjustification effect). Attitudes have affective, behavioral and cognitive parts, and behavior can change attitudes: when actions and beliefs conflict, cognitive dissonance often shifts the belief.',
    ],
    terms: [
      ['Heritability', 'The share of a trait’s variation in a population that is due to genetic differences.'],
      ['Big Five', 'Openness, conscientiousness, extraversion, agreeableness and neuroticism.'],
      ['Diathesis–stress model', 'A disorder arises when an underlying vulnerability meets enough stress.'],
      ['Drive reduction theory', 'Motivation arises from the need to relieve internal tension and restore balance.'],
      ['Yerkes–Dodson law', 'Performance is best at a moderate level of arousal.'],
      ['Cognitive dissonance', 'Discomfort from conflicting beliefs or actions, often resolved by changing a belief.'],
    ],
    example: {
      problem: 'For a certain disorder, identical twins have a concordance rate of 50% (if one has it, the other does half the time), and fraternal twins have a rate of 15%. What does this suggest about its causes?',
      steps: [
        'Identical twins share all their genes and fraternal twins about half, so the higher concordance for identical twins points to a genetic contribution.',
        'If genes alone decided the disorder, identical twins would match 100% of the time, not 50%.',
        'So the environment matters too, consistent with the diathesis–stress model.',
      ],
      answer: 'Both genes and environment contribute',
    },
    links: [psychology(3, 'biopsychology'), psychology(11, 'personality'), psychology(15, 'psychological disorders'), BEHAVIOR],
  },
  {
    id: '7b', skill: '7B: Social processes that influence human behavior',
    title: 'Social influence',
    body: [
      'Other people change how we act. In front of an audience, people do better on simple, well-practiced tasks and worse on hard or new ones (social facilitation). In a group whose members’ efforts cannot be told apart, people put in less effort (social loafing), and anonymity in a crowd can loosen self-restraint (deindividuation). In an emergency, each of several onlookers is less likely to help than a lone witness (the bystander effect), because responsibility is diffused and others’ inaction suggests that nothing is wrong.',
      'Group discussion tends to push a group’s views further in the direction they already leaned (group polarization), and a close-knit group eager for agreement may silence doubts and skip over alternatives (groupthink). Asch found that people often conform to a group’s obviously wrong judgment, whether to be accepted (normative influence) or because they assume the group knows better (informational influence). Milgram found that most people obeyed an authority’s orders to give what they believed were dangerous shocks, and that obedience fell when the authority was absent or the victim was close by.',
      'Socialization teaches the norms of a culture, through agents such as family, peers, school and the media. Norms range from folkways (customs) to mores (moral rules) and taboos. Deviance is behavior that breaks norms: strain theory explains it by a gap between approved goals and the means to reach them, and labeling theory by the effect of being publicly labeled deviant.',
    ],
    terms: [
      ['Social facilitation', 'Doing simple tasks better, and hard tasks worse, in front of others.'],
      ['Deindividuation', 'Loss of self-awareness and restraint in an anonymous group.'],
      ['Diffusion of responsibility', 'Each person feels less responsible to act when others are present.'],
      ['Group polarization', 'Discussion pushing a group toward a more extreme version of its initial view.'],
      ['Normative social influence', 'Conforming in order to be accepted by a group.'],
      ['Labeling theory', 'Being labeled deviant can lead a person to take on a deviant identity.'],
    ],
    example: {
      problem: 'In a meeting, a new employee voices support for a plan she privately thinks is flawed, because everyone else supports it and she wants to fit in. What kind of social influence is this?',
      steps: [
        'Informational influence is conforming because others seem to know better.',
        'Normative influence is conforming to be liked and accepted.',
        'She still thinks the plan is flawed but wants to fit in, so this is normative influence.',
      ],
      answer: 'Normative social influence',
    },
    links: [psychology(12, 'social psychology'), sociology(5, 'socialization'), sociology(6, 'groups and organization'), BEHAVIOR],
  },
  {
    id: '7c', skill: '7C: Attitude and behavior change',
    title: 'Learning and persuasion',
    body: [
      'In classical conditioning, a neutral stimulus is paired with an unconditioned stimulus (such as food) that naturally causes an unconditioned response (salivation), until the neutral stimulus alone causes a conditioned response. Without further pairing, the response dies out (extinction) but can briefly return (spontaneous recovery). Similar stimuli can trigger it too (generalization), unless the learner learns to tell them apart (discrimination).',
      'In operant conditioning, consequences change behavior. Reinforcement makes a behavior more likely, and punishment less likely; “positive” means adding something and “negative” means taking something away. Reinforcement can follow a set number of responses (ratio schedules) or a set time (interval schedules), fixed or variable; variable-ratio schedules, like gambling, give the fastest and most persistent responding. Complex behaviors can be built by reinforcing closer and closer approximations (shaping).',
      'People also learn by watching others (observational learning), a process Bandura showed needs attention, retention, the ability to reproduce the behavior, and motivation. The elaboration likelihood model describes two routes to persuasion: the central route, through careful thought about strong arguments, which produces lasting change; and the peripheral route, through surface cues such as an attractive speaker, used when people are unmotivated or distracted.',
    ],
    terms: [
      ['Conditioned stimulus', 'A once-neutral stimulus that triggers a response after being paired with an unconditioned stimulus.'],
      ['Spontaneous recovery', 'The brief return of an extinguished conditioned response.'],
      ['Negative reinforcement', 'Increasing a behavior by removing something unpleasant.'],
      ['Variable-ratio schedule', 'Reinforcement after an unpredictable number of responses: fast, persistent responding.'],
      ['Shaping', 'Reinforcing successive approximations of a desired behavior.'],
      ['Elaboration likelihood model', 'Persuasion by a central route (arguments) or a peripheral route (surface cues).'],
    ],
    example: {
      problem: 'A student takes aspirin when a headache starts, the headache goes away, and afterward she takes aspirin more readily at the first sign of one. What kind of learning is this?',
      steps: [
        'Taking aspirin has become more frequent, so it has been reinforced.',
        'The reinforcer is the removal of something unpleasant, the headache, which makes it negative.',
        'Removing an unpleasant stimulus to increase a behavior is negative reinforcement.',
      ],
      answer: 'Negative reinforcement',
    },
    links: [psychology(6, 'learning'), psychology(12, 'social psychology'), BEHAVIOR],
  },
  {
    id: '8a', skill: '8A: Self-identity',
    title: 'The self and identity',
    body: [
      'The self-concept is the set of beliefs we hold about ourselves, and self-esteem is how we value them. Self-efficacy is confidence in our ability to succeed at a particular task, and locus of control is where we believe outcomes come from: our own actions (internal) or luck and other people (external). We hold many identities, of gender, ethnicity, religion and more, which come to the fore in different settings.',
      'Theories of development describe how identity forms. Freud proposed psychosexual stages (oral, anal, phallic, latent, genital), with fixation if a stage is not resolved. Erikson proposed eight psychosocial stages across life, each a conflict to resolve: trust versus mistrust in infancy, identity versus role confusion in adolescence, intimacy versus isolation in young adulthood and integrity versus despair in old age. Kohlberg described moral reasoning moving from avoiding punishment (preconventional) to upholding social rules (conventional) to universal principles (postconventional).',
      'Identity is also social. Vygotsky stressed learning with help from more skilled people, within the zone of proximal development. Cooley’s looking-glass self says we see ourselves as we imagine others see us, and Mead distinguished the spontaneous “I” from the “me” formed by taking the attitudes of others. Reference groups, the groups we compare ourselves with, shape how we judge ourselves.',
    ],
    terms: [
      ['Self-efficacy', 'Belief in one’s ability to succeed at a specific task.'],
      ['Locus of control', 'Whether a person sees outcomes as caused by themselves or by outside forces.'],
      ['Psychosocial stages', 'Erikson’s eight life stages, each defined by a conflict to resolve.'],
      ['Zone of proximal development', 'What a learner can do with help but not yet alone (Vygotsky).'],
      ['Looking-glass self', 'Seeing oneself as one imagines others see one (Cooley).'],
      ['Reference group', 'A group a person uses as a standard for judging themselves.'],
    ],
    example: {
      problem: 'A 75-year-old looks back on her life with a sense of satisfaction and accepts what she cannot change. Which of Erikson’s stages is she in, and how is she resolving it?',
      steps: [
        'Erikson’s last stage, in late adulthood, is integrity versus despair.',
        'Satisfaction with one’s life and acceptance of its limits mark integrity; regret and bitterness mark despair.',
      ],
      answer: 'Integrity versus despair, resolved toward integrity',
    },
    links: [psychology(9, 'lifespan development'), psychology(11, 'personality'), INDIVIDUALS],
  },
  {
    id: '8b', skill: '8B: Social thinking',
    title: 'Attribution, prejudice and bias',
    body: [
      'We explain behavior by the person (a dispositional attribution) or by the situation (a situational attribution). We tend to overrate personality and underrate the situation when explaining others’ behavior (the fundamental attribution error), to explain our own behavior by the situation but others’ by their character (the actor–observer bias), and to credit ourselves for success but blame circumstances for failure (the self-serving bias). The fundamental attribution error is weaker in collectivist cultures, which pay more attention to context.',
      'A stereotype is a belief about a group, prejudice is an attitude toward it, and discrimination is behavior against its members. People favor their in-group over out-groups. Knowing a negative stereotype about one’s own group can itself lower performance (stereotype threat), and expectations can bring about what they predict (a self-fulfilling prophecy). The just-world hypothesis, the belief that people get what they deserve, can lead to blaming victims.',
      'Ethnocentrism judges other cultures by the standards of one’s own; cultural relativism judges each culture on its own terms. Prejudice tends to fall with contact between groups when they meet as equals and work toward shared goals, the contact hypothesis, as in cooperative “jigsaw” classrooms.',
    ],
    terms: [
      ['Dispositional attribution', 'Explaining behavior by a person’s traits rather than the situation.'],
      ['Fundamental attribution error', 'Overrating personality and underrating the situation when explaining others’ behavior.'],
      ['Self-serving bias', 'Crediting oneself for success and blaming circumstances for failure.'],
      ['Stereotype threat', 'Worry about confirming a negative stereotype about one’s group, which lowers performance.'],
      ['Contact hypothesis', 'Prejudice falls with equal-status contact between groups working toward shared goals.'],
      ['Just-world hypothesis', 'The belief that people get what they deserve, which can lead to blaming victims.'],
    ],
    example: {
      problem: 'When Sam gets an A, he credits his hard work; when he fails the next exam, he blames the unfair questions. Which bias is this?',
      steps: [
        'He explains his success by something internal (his effort) and his failure by something external (the test).',
        'Taking credit for successes and deflecting blame for failures is the self-serving bias.',
      ],
      answer: 'The self-serving bias',
    },
    links: [psychology(12, 'social psychology'), sociology(11, 'race and ethnicity'), INDIVIDUALS],
  },
  {
    id: '8c', skill: '8C: Social interactions',
    title: 'Interaction, groups and relationships',
    body: [
      'Social life is organized by statuses and roles. A status is a position, ascribed at birth or achieved, and a master status overshadows the rest. A role is the behavior expected of a status: role conflict is tension between two roles, role strain is tension within one, and role exit is leaving a role. Primary groups are small and close, like families; secondary groups are larger and goal-directed, like workplaces. Weber described bureaucracy, with its hierarchy, rules and division of labor, and Michels argued that organizations drift toward rule by a few (the iron law of oligarchy).',
      'People manage the impressions they give. Goffman’s dramaturgical approach compares this to a performance, with a “front stage” where we play our roles and a “backstage” where we relax. Cultures also set display rules for when and how emotions may be shown.',
      'Attraction grows with proximity, similarity and familiarity (the mere exposure effect). Aggression is shaped by biology, such as the amygdala and testosterone, and by frustration and learning. Ainsworth’s Strange Situation classified children’s attachment as secure, avoidant, ambivalent or disorganized. Altruism, helping at a cost to oneself, has been explained by empathy and by kin selection. Discrimination can be individual, or institutional, built into an organization’s practices.',
    ],
    terms: [
      ['Ascribed status', 'A position given at birth or without effort, such as age or race.'],
      ['Role strain', 'Tension among the demands of a single role.'],
      ['Primary group', 'A small, close, lasting group, such as a family.'],
      ['Impression management', 'Controlling how others see us; Goffman’s dramaturgy.'],
      ['Mere exposure effect', 'Liking something more the more familiar it becomes.'],
      ['Secure attachment', 'A child who uses the caregiver as a safe base and is readily comforted on reunion.'],
    ],
    example: {
      problem: 'A college student who is also on the swim team must miss practice to attend a required lab. Is this role strain or role conflict?',
      steps: [
        'Role strain is tension within a single role; role conflict is tension between two roles.',
        'Being a student and being an athlete are two different roles making clashing demands.',
      ],
      answer: 'Role conflict',
    },
    links: [sociology(4, 'society and social interaction'), sociology(6, 'groups and organization'), INDIVIDUALS],
  },
  {
    id: '9a', skill: '9A: Understanding social structure',
    title: 'Social structure, institutions and culture',
    body: [
      'Sociology has several broad perspectives. Functionalism, from Durkheim, sees society as parts that keep it stable, with manifest (intended) and latent (unintended) functions, in Merton’s terms. Conflict theory, from Marx and Weber, sees groups competing for scarce resources and power. Symbolic interactionism studies how people create meaning in everyday interaction. Social constructionism examines how shared understandings create social realities such as race or money, and rational choice theory models behavior as weighing costs and benefits.',
      'Social institutions organize social life. Education teaches skills and also a hidden curriculum of values and obedience, and teachers’ expectations can shape outcomes. The family, religion, government and the economy each have their own forms and changes, such as secularization in religion. In medicine, Parsons described the sick role, in which a person is excused from normal duties but expected to seek help, and medicalization describes problems coming to be treated as medical.',
      'Culture includes material objects and nonmaterial, or symbolic, elements: values, beliefs, norms, symbols and language. When technology changes faster than norms and values, the gap is called cultural lag. Meeting an unfamiliar culture can cause culture shock. Groups may assimilate into a dominant culture or keep distinct identities in a multicultural society, and subcultures and countercultures exist within larger ones.',
    ],
    terms: [
      ['Latent function', 'An unintended consequence of a social institution or practice.'],
      ['Conflict theory', 'The view of society as competition among groups over scarce resources and power.'],
      ['Social constructionism', 'The view that many categories, such as race, are created by shared social understandings.'],
      ['Hidden curriculum', 'The values and behaviors that schools teach without stating them.'],
      ['Sick role', 'Parsons’s term for the rights and duties of a person who is ill.'],
      ['Cultural lag', 'The delay between new technology and the norms and values that fit it.'],
    ],
    example: {
      problem: 'A sociologist notes that schools, besides teaching reading and mathematics, teach students to be punctual, wait their turn and obey authority. What is this called, and which kind of function is it?',
      steps: [
        'Values and habits that schools teach without stating them make up the hidden curriculum.',
        'They are not the stated purpose of schooling, so they are a latent function rather than a manifest one.',
      ],
      answer: 'The hidden curriculum, a latent function of education',
    },
    links: [sociology(1, 'an introduction to sociology'), sociology(3, 'culture'), sociology(19, 'health and medicine'), SOCIETY],
  },
  {
    id: '9b', skill: '9B: Demographic characteristics and processes',
    title: 'Demographics and social change',
    body: [
      'Demography studies the size and makeup of populations: their age, gender, race and ethnicity, immigration status and sexual orientation. Many of these categories are socially constructed, and their meanings change over time and between societies. Populations change through three processes only: fertility, mortality and migration, with migration driven by push factors at home and pull factors elsewhere.',
      'In the demographic transition model, a society starts with high birth and death rates and a stable population; death rates fall with better food, sanitation and medicine, and the population grows rapidly; birth rates then fall too; and finally both are low and the population is stable or shrinking. Population pyramids show age structure: a wide base means many children. The dependency ratio compares the young and old with the working-age population, and the rule of 70 estimates a population’s doubling time as 70 divided by its percent growth rate.',
      'Societies also change through social movements, which arise from relative deprivation and succeed by mobilizing resources, through globalization, which ties economies and cultures together, and through urbanization, including suburbanization and gentrification, in which wealthier newcomers move into poorer neighborhoods and raise their costs.',
    ],
    terms: [
      ['Total fertility rate', 'The average number of children a woman would have over her lifetime at current birth rates.'],
      ['Demographic transition', 'The shift from high birth and death rates to low ones as a society develops.'],
      ['Dependency ratio', 'People under 15 and over 64 per 100 people aged 15 to 64.'],
      ['Push factors', 'Conditions that drive people to leave a place, such as war or poverty.'],
      ['Relative deprivation', 'Feeling deprived compared with others, which can fuel social movements.'],
      ['Gentrification', 'Wealthier residents moving into a poorer neighborhood, raising its costs.'],
    ],
    example: {
      problem: 'A country has 20 million people aged 15 to 64, 8 million under 15 and 4 million aged 65 or older. What is its total dependency ratio?',
      steps: [
        'The dependent population is 8 + 4 = 12 million.',
        'Divide by the working-age population and multiply by 100: 12 ÷ 20 × 100 = 60.',
      ],
      answer: '60 dependents for every 100 people of working age',
    },
    links: [sociology(20, 'population, urbanization, and the environment'), SOCIETY],
  },
  {
    id: '10a', skill: '10A: Social inequality',
    title: 'Social inequality',
    body: [
      'Societies are stratified into layers of unequal wealth, power and prestige. Socioeconomic status combines income, education and occupation. Besides money (economic capital), people draw on social capital, the value of their networks, and cultural capital, the knowledge, tastes and credentials valued by dominant groups, which Bourdieu argued help pass advantage from parents to children (social reproduction). A meritocracy, where position reflects only ability and effort, is an ideal that real societies meet imperfectly.',
      'Social mobility is movement between strata: upward or downward, within one person’s life (intragenerational) or between parents and children (intergenerational). Absolute poverty is lacking basic necessities; relative poverty is having much less than others in one’s society. Inequality is also spatial: residential segregation concentrates disadvantage, and environmental injustice places pollution and other hazards near poorer communities.',
      'Health follows social position. The social gradient in health means health improves at every step up the socioeconomic ladder, not only between the poor and everyone else. Health and health-care disparities by class, race and ethnicity, and gender arise from the social determinants of health: income, education, neighborhood, working conditions and access to care.',
    ],
    terms: [
      ['Socioeconomic status', 'Social standing measured by income, education and occupation.'],
      ['Social capital', 'The resources that come from a person’s social networks.'],
      ['Cultural capital', 'Knowledge, tastes and credentials valued by dominant groups (Bourdieu).'],
      ['Intergenerational mobility', 'A change in social position between parents and their children.'],
      ['Relative poverty', 'Having much less than others in one’s society, even if basic needs are met.'],
      ['Social gradient in health', 'Health improving step by step with each rise in socioeconomic status.'],
    ],
    example: {
      problem: 'A country defines its poverty line as half of the median household income. Is this an absolute or a relative measure of poverty?',
      steps: [
        'An absolute measure uses a fixed standard: the cost of basic necessities.',
        'A relative measure compares households with others in the same society.',
        'A line set at half the median moves with typical incomes, so it measures poverty relative to others.',
      ],
      answer: 'A relative measure of poverty',
    },
    links: [sociology(9, 'social stratification in the United States'), sociology(19, 'health and medicine'), INEQUALITY],
  },
];
