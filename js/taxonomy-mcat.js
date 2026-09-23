// MCAT content, from the AAMC's "What's on the MCAT Exam?" outline. In the three science sections a
// foundational concept is a domain and each of its content categories is a skill, named with the AAMC's own
// code (4A, 5E, ...) so a student can match it to the official outline. CARS has no content categories; its
// three reasoning skills stand in for them.
//
// The MCAT is taken during or after college, so minGrade here counts years of schooling: 13 is a first-year
// undergraduate. Every category is open from the start, because the exam assumes the introductory courses.

const FROM_COLLEGE = 13;
// The AAMC's titles run to 130 characters, too long for a list or a menu, so each also has a short name for
// display. The full title stays the skill's name, which is what questions are filed under.
const skills = list => list.map(([code, name, short]) => ({ code, name: `${code}: ${name}`, short: `${code}: ${short}`, minGrade: FROM_COLLEGE }));

export const MCAT_DOMAINS = [
  {
    section: 'CP', code: 'FC4', name: 'Physical principles of living systems (Foundational Concept 4)',
    skills: skills([
      ['4A', 'Translational motion, forces, work, energy, and equilibrium in living systems', 'Motion, forces and energy'],
      ['4B', 'Importance of fluids for the circulation of blood, gas movement, and gas exchange', 'Fluids and gas exchange'],
      ['4C', 'Electrochemistry and electrical circuits and their elements', 'Circuits and electrochemistry'],
      ['4D', 'How light and sound interact with matter', 'Light and sound'],
      ['4E', 'Atoms, nuclear decay, electronic structure, and atomic chemical behavior', 'Atoms and nuclear decay'],
    ]),
  },
  {
    section: 'CP', code: 'FC5', name: 'Chemical principles of living systems (Foundational Concept 5)',
    skills: skills([
      ['5A', 'Unique nature of water and its solutions', 'Water and solutions'],
      ['5B', 'Nature of molecules and intermolecular interactions', 'Molecules and intermolecular forces'],
      ['5C', 'Separation and purification methods', 'Separation and purification'],
      ['5D', 'Structure, function, and reactivity of biologically relevant molecules', 'Biological molecules'],
      ['5E', 'Principles of chemical thermodynamics and kinetics', 'Thermodynamics and kinetics'],
    ]),
  },
  {
    section: 'CARS', code: 'CARS', name: 'Critical analysis and reasoning',
    skills: skills([
      ['C1', 'Foundations of comprehension', 'Comprehension'],
      ['C2', 'Reasoning within the text', 'Reasoning within the text'],
      ['C3', 'Reasoning beyond the text', 'Reasoning beyond the text'],
    ]),
  },
  {
    section: 'BB', code: 'FC1', name: 'Biomolecules (Foundational Concept 1)',
    skills: skills([
      ['1A', 'Structure and function of proteins and their constituent amino acids', 'Proteins and amino acids'],
      ['1B', 'Transmission of genetic information from the gene to the protein', 'From gene to protein'],
      ['1C', 'Transmission of heritable information from generation to generation and the processes that increase genetic diversity', 'Heredity and genetic diversity'],
      ['1D', 'Principles of bioenergetics and fuel molecule metabolism', 'Bioenergetics and metabolism'],
    ]),
  },
  {
    section: 'BB', code: 'FC2', name: 'Cells (Foundational Concept 2)',
    skills: skills([
      ['2A', 'Assemblies of molecules, cells, and groups of cells within single cellular and multicellular organisms', 'Cells and tissues'],
      ['2B', 'The structure, growth, physiology, and genetics of prokaryotes and viruses', 'Prokaryotes and viruses'],
      ['2C', 'Processes of cell division, differentiation, and specialization', 'Cell division and differentiation'],
    ]),
  },
  {
    section: 'BB', code: 'FC3', name: 'Organ systems (Foundational Concept 3)',
    skills: skills([
      ['3A', 'Structure and functions of the nervous and endocrine systems and ways in which these systems coordinate the organ systems', 'Nervous and endocrine systems'],
      ['3B', 'Structure and integrative functions of the main organ systems', 'Organ systems'],
    ]),
  },
  {
    section: 'PS', code: 'FC6', name: 'Sensing and processing (Foundational Concept 6)',
    skills: skills([['6A', 'Sensing the environment', 'Sensing the environment'], ['6B', 'Making sense of the environment', 'Making sense of the environment'], ['6C', 'Responding to the world', 'Responding to the world']]),
  },
  {
    section: 'PS', code: 'FC7', name: 'Individual behavior (Foundational Concept 7)',
    skills: skills([['7A', 'Individual influences on behavior', 'Individual influences on behavior'], ['7B', 'Social processes that influence human behavior', 'Social influences on behavior'], ['7C', 'Attitude and behavior change', 'Attitude and behavior change']]),
  },
  {
    section: 'PS', code: 'FC8', name: 'Self and others (Foundational Concept 8)',
    skills: skills([['8A', 'Self-identity', 'Self-identity'], ['8B', 'Social thinking', 'Social thinking'], ['8C', 'Social interactions', 'Social interactions']]),
  },
  {
    section: 'PS', code: 'FC9', name: 'Social structure and demographics (Foundational Concept 9)',
    skills: skills([['9A', 'Understanding social structure', 'Social structure'], ['9B', 'Demographic characteristics and processes', 'Demographics']]),
  },
  {
    section: 'PS', code: 'FC10', name: 'Social inequality (Foundational Concept 10)',
    skills: skills([['10A', 'Social inequality', 'Social inequality']]),
  },
];
