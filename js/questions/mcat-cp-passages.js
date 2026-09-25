// Original passage sets for the MCAT's Chemical and Physical Foundations section, written for this app: the AAMC
// publishes no question bank, and its practice material may not be copied.
//
// The real section is mostly passages, each a short account of an experiment or a clinical situation followed by
// four to seven questions, with some stand-alone questions besides (those are in js/questions/mcat-cp.js). These
// are five sets of four. Every question carries its whole passage, so it makes sense when it comes up on its own
// in practice, and the questions from one passage share a `set`.
//
// Planned before writing: five answers on each letter, and seven Foundation, seven Intermediate and six Exam-level
// questions. Every calculated answer is worked out again from the passage in tests/mcat-questions.test.js.

const FC4 = 'Physical principles of living systems (Foundational Concept 4)';
const FC5 = 'Chemical principles of living systems (Foundational Concept 5)';

const SKILL = {
  '4B': '4B: Importance of fluids for the circulation of blood, gas movement, and gas exchange',
  '4C': '4C: Electrochemistry and electrical circuits and their elements',
  '4D': '4D: How light and sound interact with matter',
  '5A': '5A: Unique nature of water and its solutions',
  '5C': '5C: Separation and purification methods',
  '5D': '5D: Structure, function, and reactivity of biologically relevant molecules',
  '5E': '5E: Principles of chemical thermodynamics and kinetics',
};

// A passage and its questions. Each question is [number, content category, tier, stem, choices, answer, rationale].
const set = (id, passage, questions) => questions.map(([n, code, difficulty, stem, choices, answer, rationale]) => ({
  id: `mcat-cp-${id}-${n}`, exam: 'mcat', section: 'CP', domain: code.startsWith('4') ? FC4 : FC5, skill: SKILL[code],
  difficulty, set: `mcat-cp-${id}`, passage, stem, choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
}));

const HYPERBARIC = `Hyperbaric oxygen therapy has a patient breathe pure oxygen inside a sealed chamber held above atmospheric pressure. It is used for carbon monoxide poisoning, decompression sickness and some wounds that are slow to heal. Chamber pressures are given in atmospheres absolute (ATA): 1 ATA is the pressure at sea level, 760 mmHg.

At sea level, a person breathing air carries about 20 mL of O₂ in every 100 mL of arterial blood. Nearly all of it is bound to hemoglobin, which is already about 98% saturated; only about 0.3 mL is dissolved in the plasma. The dissolved amount follows Henry’s law. It is proportional to the partial pressure of O₂, at about 0.003 mL of O₂ per 100 mL of blood for each mmHg.

In one clinic’s protocol, patients breathe 100% O₂ at 2.5 ATA in 30-minute periods separated by 5-minute breaks on air, which lower the risk of oxygen toxicity. The chamber is pressurized over several minutes, because gas trapped in the middle ear and the sinuses has to be equalized with the rising pressure around it.

In carbon monoxide poisoning, the aim is to clear carbon monoxide from hemoglobin, which binds it about 200 times more strongly than it binds O₂. The half-life of carboxyhemoglobin, the complex of hemoglobin with carbon monoxide, is about 300 minutes in a patient breathing room air, about 90 minutes on 100% O₂ at 1 ATA, and about 30 minutes on 100% O₂ at 2.5 ATA.`;

const CONCENTRATION_CELL = `Living cells store energy as differences in ion concentration across their membranes. To model this with a simple device, a student built a concentration cell. Each of two beakers held a strip of pure copper standing in copper(II) sulfate solution: 1.0 M in beaker 1 and 0.010 M in beaker 2. A salt bridge filled with potassium nitrate solution joined the two solutions, and a wire through a voltmeter joined the two copper strips.

Because both electrodes are copper, the standard cell potential, E°, is zero. The voltage comes only from the difference in concentration, and at 25 °C it is given by the Nernst equation:

E = E° − (0.0592 V / n) log Q

where n is the number of electrons transferred for each copper ion, and Q is the concentration of Cu²⁺ in the anode’s beaker divided by the concentration of Cu²⁺ in the cathode’s beaker.

When the circuit was closed, the voltmeter read about 0.06 V. The reading fell slowly over several hours, and when the student finally lifted the strips out and weighed them, one had gained mass and the other had lost it.`;

const GLYCINE = `An amino acid carries both an acidic and a basic group, so its charge depends on pH. A student titrated 20 mL of 0.10 M glycine in its fully protonated form, H₃N⁺–CH₂–COOH, with 0.10 M NaOH, recording the pH after each addition. The curve showed two buffering regions, centered at pH 2.34 and pH 9.60: the pKa values of glycine’s carboxyl group and of its amino group. Halfway between them lies the isoelectric point (pI), the pH at which glycine’s average net charge is zero.

The student then separated three amino acids by electrophoresis on paper soaked in a buffer at pH 6.0. A spot of each was placed on a line midway between the two electrodes, and a voltage was applied across the paper for an hour. The isoelectric points of the three amino acids are:

Aspartic acid: 2.77
Glycine: 5.97
Lysine: 9.74

In a buffer below its pI an amino acid carries a net positive charge, and in a buffer above its pI it carries a net negative charge.`;

const EYE = `Most of the eye’s focusing is done by the cornea, whose curved front surface bends light as it enters from the air; the lens behind it adds a smaller, adjustable amount. The cornea has a refractive index of about 1.376.

Opticians describe a lens by its power, P = 1/f, measured in diopters (D) when the focal length f is in meters. Converging lenses have positive power and diverging lenses negative power. In the thin-lens equation, 1/f = 1/dₒ + 1/dᵢ, a virtual image has a negative image distance. For simplicity, the corrective lenses below are treated as sitting right at the eye.

A patient with myopia (nearsightedness) can focus only on objects closer than their far point. A patient with hyperopia (farsightedness) cannot focus on objects closer than their near point. A corrective lens works by forming a virtual image of the object at a distance where the patient’s eye can focus.

Patient 1 has a far point of 50 cm. Patient 2 has a near point of 100 cm and wants to read a page held 25 cm away.`;

const HEXOKINASE = `Many reactions in cells are unfavorable on their own and happen only because they are coupled to the hydrolysis of ATP. The first step of glycolysis is an example. Joining phosphate directly to glucose,

glucose + Pᵢ → glucose-6-phosphate + H₂O    ΔG°′ = +13.8 kJ/mol

does not proceed by itself. Instead, the enzyme hexokinase transfers a phosphate group from ATP, so that the reaction above is coupled to

ATP + H₂O → ADP + Pᵢ    ΔG°′ = −30.5 kJ/mol

ΔG°′ is the standard free-energy change at pH 7, with every other species at 1 M. Under the conditions actually found in a cell, the free-energy change is

ΔG = ΔG°′ + RT ln Q

where R = 8.314 J/(mol·K), T is the temperature in kelvins, and Q is the product of the products’ concentrations divided by the product of the reactants’ concentrations, all in M, with water left out.

Measurements in resting mammalian muscle at 37 °C (310 K) found [ATP] = 8.0 mM, [ADP] = 0.90 mM and [Pᵢ] = 8.0 mM.`;

export const MCAT_CP_PASSAGE_QUESTIONS = [
  ...set('p1', HYPERBARIC, [
    [1, '4B', 'Easy', 'What is the partial pressure of O₂ in the gas a patient breathes during the clinic’s protocol?',
      ['160 mmHg', '400 mmHg', '760 mmHg', '1,900 mmHg'], 'D',
      'In pure O₂ the partial pressure of O₂ is the whole pressure: 2.5 ATA × 760 mmHg = 1,900 mmHg. Air, which is 21% O₂, would give 160 mmHg at 1 ATA and 400 mmHg at 2.5 ATA, and 760 mmHg is pure O₂ at sea level.'],
    [2, '5A', 'Medium', 'Suppose that during treatment a patient’s arterial blood reaches an O₂ partial pressure of 1,700 mmHg. Using the passage’s figures, about how much O₂ is dissolved in each 100 mL of that blood?',
      ['0.3 mL', '1.7 mL', '5.1 mL', '25 mL'], 'C',
      'Henry’s law makes the dissolved O₂ proportional to its partial pressure, at 0.003 mL per 100 mL for each mmHg: 0.003 × 1,700 = 5.1 mL, about 17 times the 0.3 mL dissolved at sea level. 25 mL would be the total, adding the roughly 20 mL bound to hemoglobin, but the question asks only for the dissolved O₂.'],
    [3, '4B', 'Easy', 'According to the passage, breathing 100% O₂ at 2.5 ATA raises the O₂ content of arterial blood mainly by:',
      ['raising hemoglobin’s saturation far above its sea-level value',
        'adding binding sites for O₂ to each hemoglobin molecule',
        'making hemoglobin bind O₂ more strongly than carbon monoxide',
        'increasing the O₂ dissolved in the plasma'], 'D',
      'Hemoglobin is already about 98% saturated at sea level, so it can take up very little more, and each molecule has four binding sites whatever the pressure. Nothing in the passage changes the relative affinities: carbon monoxide still binds about 200 times more strongly. The gain comes from dissolved O₂, which Henry’s law makes proportional to the partial pressure.'],
    [4, '5E', 'Hard', 'A poisoned patient starts treatment with 40% of their hemoglobin bound to carbon monoxide. According to the passage’s half-lives, how much longer would it take for this to fall to 5% on 100% O₂ at 1 ATA than on 100% O₂ at 2.5 ATA?',
      ['60 minutes', '90 minutes', '180 minutes', '270 minutes'], 'C',
      'Falling from 40% to 20% to 10% to 5% takes three half-lives. At 1 ATA that is 3 × 90 = 270 minutes, and at 2.5 ATA it is 3 × 30 = 90 minutes, so the difference is 180 minutes. 270 and 90 minutes are the two times themselves, and 60 minutes is the difference for a single half-life.'],
  ]),

  ...set('p2', CONCENTRATION_CELL, [
    [1, '4C', 'Easy', 'At which electrode does oxidation take place when the circuit is closed?',
      ['The copper strip in beaker 1, in the more concentrated solution',
        'Neither: two identical electrodes cannot make an anode and a cathode',
        'Both equally, because E° for the cell is zero',
        'The copper strip in beaker 2, in the more dilute solution'], 'D',
      'The cell runs so as to even out the two concentrations. Copper dissolves (Cu → Cu²⁺ + 2e⁻, an oxidation) where Cu²⁺ is scarce, raising its concentration, and Cu²⁺ plates out as copper (a reduction) where it is plentiful. So the strip in the dilute beaker is the anode. E° is zero, but E is not, because the concentrations differ.'],
    [2, '4C', 'Medium', 'What voltage does the Nernst equation predict when the circuit is first closed?',
      ['0.030 V', '0.059 V', '0.118 V', '0.592 V'], 'B',
      'The anode is in the dilute beaker, so Q = 0.010 / 1.0 = 0.010 and log Q = −2. Each Cu²⁺ takes two electrons (n = 2), so E = 0 − (0.0592 / 2)(−2) = 0.059 V, matching the reading of about 0.06 V. Taking n = 1 gives 0.118 V, and using log 10 instead of log 100 gives 0.030 V.'],
    [3, '5E', 'Medium', 'Which of the following best describes the cell after it has run for several hours?',
      ['The strip in beaker 1 has gained mass, and the voltage has fallen as the two concentrations have moved closer together.',
        'The strip in beaker 2 has gained mass, because copper ions from beaker 1 have crossed the salt bridge and plated onto it.',
        'The strip in beaker 1 has lost mass, and the voltage has fallen because the salt bridge has run out of ions.',
        'Neither strip has changed mass, and the voltage has fallen because the solutions have cooled.'], 'A',
      'Reduction at the cathode in beaker 1 deposits copper, so that strip gains mass, while the anode strip in beaker 2 dissolves and loses mass. Meanwhile [Cu²⁺] falls in beaker 1 and rises in beaker 2, so Q climbs toward 1 and E = −(0.0592 / 2) log Q shrinks toward zero. The salt bridge carries K⁺ and NO₃⁻ ions, not Cu²⁺.'],
    [4, '5E', 'Hard', 'What is ΔG for the cell reaction, per mole of copper transferred, when the circuit is first closed? (F = 96,500 C/mol)',
      ['−114 kJ/mol', '−11.4 kJ/mol', '−5.7 kJ/mol', '+11.4 kJ/mol'], 'B',
      'ΔG = −nFE = −2 × 96,500 C/mol × 0.0592 V = −11,400 J/mol, or −11.4 kJ/mol. It is negative because the cell runs by itself. Using n = 1 halves it to −5.7 kJ/mol, and a positive sign would describe the reverse, non-spontaneous direction.'],
  ]),

  ...set('p3', GLYCINE, [
    [1, '5D', 'Easy', 'According to the passage, what is the isoelectric point of glycine?',
      ['2.34', '5.97', '7.00', '9.60'], 'B',
      'The pI lies halfway between the two pKa values: (2.34 + 9.60) ÷ 2 = 5.97. At that pH nearly every molecule is the zwitterion H₃N⁺–CH₂–COO⁻, with no net charge. 2.34 and 9.60 are the pKa values themselves, and 7.00 is simply neutral pH.'],
    [2, '5C', 'Medium', 'In the electrophoresis at pH 6.0, which amino acid moved toward the positive electrode?',
      ['Aspartic acid', 'Glycine', 'Lysine', 'All three, at the same speed'], 'A',
      'At pH 6.0, above aspartic acid’s pI of 2.77, aspartic acid carries a net negative charge, so it is drawn to the positive electrode. Lysine, with a pI of 9.74, is positively charged at pH 6.0 and moves the other way. Glycine’s pI of 5.97 is almost exactly the buffer’s pH, so it has almost no net charge and stays near the starting line.'],
    [3, '5A', 'Medium', 'During the titration, when the pH reached 3.34, what was the ratio of glycine molecules with a deprotonated carboxyl group (COO⁻) to those with a protonated one (COOH)?',
      ['1 : 10', '1 : 1', '2 : 1', '10 : 1'], 'D',
      'By the Henderson–Hasselbalch equation, pH = pKa + log([COO⁻] / [COOH]). Here 3.34 = 2.34 + log(ratio), so log(ratio) = 1 and the ratio is 10 : 1. The pH is above the carboxyl group’s pKa, so the deprotonated form is the larger share; 1 : 1 would hold at pH 2.34 exactly.'],
    [4, '5D', 'Hard', 'What volume of the NaOH solution had been added when the titration reached glycine’s isoelectric point?',
      ['10 mL', '20 mL', '30 mL', '40 mL'], 'B',
      'The sample holds 20 mL × 0.10 M = 2.0 mmol of glycine, each molecule with a net charge of +1. Reaching the pI, where the neutral zwitterion dominates, takes one proton off each: 2.0 mmol of NaOH, which is 20 mL of the 0.10 M solution. 10 mL reaches pH 2.34 (half of the first proton removed), 30 mL reaches pH 9.60, and 40 mL removes both protons.'],
  ]),

  ...set('p4', EYE, [
    [1, '4D', 'Easy', 'What is the power of the lens that lets Patient 1 see distant objects clearly?',
      ['−2.0 D', '−0.5 D', '+0.5 D', '+2.0 D'], 'A',
      'The lens must take light from a very distant object (1/dₒ ≈ 0) and form a virtual image at the far point, dᵢ = −0.50 m. So P = 1/f = 0 + 1/(−0.50 m) = −2.0 D, a diverging lens, as myopia needs.'],
    [2, '4D', 'Medium', 'What is the power of the lens that lets Patient 2 read the page?',
      ['−3.0 D', '+1.0 D', '+3.0 D', '+4.0 D'], 'C',
      'The page is the object, at dₒ = 0.25 m, and the lens must place its virtual image at the near point, dᵢ = −1.00 m. Then P = 1/0.25 + 1/(−1.00) = 4 − 1 = +3.0 D, a converging lens. +4.0 D forgets the image term, and −3.0 D has the sign reversed.'],
    [3, '4D', 'Medium', 'What kind of image does Patient 1’s corrective lens form of a distant tree?',
      ['A real, inverted image on the retina',
        'A real, upright image 50 cm in front of the eye',
        'A virtual, upright image at the patient’s far point',
        'A virtual, inverted image at the patient’s near point'], 'C',
      'A diverging lens always forms a virtual, upright, reduced image of a real object. The correction places that image at the far point, 50 cm away, where the patient’s own eye can focus it. The lens does not form an image on the retina; the eye does that, working from the lens’s virtual image.'],
    [4, '4D', 'Hard', 'Light from the air strikes the cornea at an angle of incidence of 60°. What is its angle of refraction inside the cornea?',
      ['39°', '44°', '60°', 'No light enters; it is all reflected.'], 'A',
      'Snell’s law gives sin θ = sin 60° ÷ 1.376 = 0.866 ÷ 1.376 = 0.629, so θ = 39°. Light bends toward the normal on entering a denser medium. Dividing the angle itself by 1.376 gives 44°, which is not how refraction works, and total internal reflection happens only going from a higher index to a lower one.'],
  ]),

  ...set('p5', HEXOKINASE, [
    [1, '5E', 'Easy', 'What is ΔG°′ for the overall reaction that hexokinase catalyzes, glucose + ATP → glucose-6-phosphate + ADP?',
      ['−44.3 kJ/mol', '−30.5 kJ/mol', '−16.7 kJ/mol', '+16.7 kJ/mol'], 'C',
      'Free-energy changes of coupled reactions add: +13.8 + (−30.5) = −16.7 kJ/mol, so the coupled reaction is favorable. −44.3 kJ/mol adds the sizes without their signs, and −30.5 kJ/mol leaves out the phosphorylation step.'],
    [2, '5E', 'Easy', 'What does hexokinase change about the reaction it catalyzes?',
      ['It makes ΔG°′ more negative, so more glucose-6-phosphate forms at equilibrium',
        'It raises the equilibrium constant by stabilizing the products',
        'It supplies the free energy that the reaction requires',
        'It lowers the activation energy, speeding the reaction without changing ΔG°′'], 'D',
      'An enzyme speeds up a reaction by lowering its activation energy, and so speeds the forward and reverse reactions alike. It changes neither ΔG°′ nor the equilibrium constant, and it supplies no energy: the favorable free energy here comes from ATP.'],
    [3, '5E', 'Hard', 'Using the concentrations measured in muscle, what is ΔG for the hydrolysis of ATP there?',
      ['−48.6 kJ/mol', '−38.4 kJ/mol', '−30.5 kJ/mol', '−12.4 kJ/mol'], 'A',
      'Q = [ADP][Pᵢ] / [ATP] = (0.00090)(0.0080) / (0.0080) = 0.00090, and ln Q = −7.01. RT = 8.314 × 310 = 2,577 J/mol, so RT ln Q = −18.1 kJ/mol and ΔG = −30.5 − 18.1 = −48.6 kJ/mol. Using log instead of ln gives −38.4 kJ/mol, and subtracting the term the wrong way gives −12.4 kJ/mol.'],
    [4, '5E', 'Hard', 'If the ADP concentration in the muscle rose tenfold while the other concentrations stayed the same, ΔG for the hydrolysis of ATP would:',
      ['become more negative, by about 5.9 kJ/mol', 'become less negative, by about 5.9 kJ/mol',
        'become less negative, by about 59 kJ/mol', 'stay the same, because ΔG°′ does not change'], 'B',
      'ADP is a product, so a tenfold rise multiplies Q by 10 and adds RT ln 10 = 2,577 J/mol × 2.303 = 5.9 kJ/mol to ΔG, making it less negative. ΔG°′ is indeed fixed, but ΔG depends on the actual concentrations through Q.'],
  ]),
];
