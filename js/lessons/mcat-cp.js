// Lessons for the MCAT's Chemical and Physical Foundations section, one per AAMC content category.
//
// Each is a short, plain-language pass over what the category covers: enough to answer its Foundation questions
// and to know what to read next. The links go to the free OpenStax textbooks for depth (every address checked to
// exist when written) and to Khan Academy's MCAT course, made with the AAMC. The worked examples are re-checked
// by tests/mcat-questions.test.js.

const OPENSTAX = 'https://openstax.org/books';
const KHAN = { label: 'Khan Academy: MCAT course', url: 'https://www.khanacademy.org/test-prep/mcat' };
const physics = (page, label) => ({ label: `OpenStax College Physics 2e: ${label}`, url: `${OPENSTAX}/college-physics-2e/pages/${page}` });
const chemistry = (chapter, label) => ({ label: `OpenStax Chemistry 2e: ${label}`, url: `${OPENSTAX}/chemistry-2e/pages/${chapter}-introduction` });
const organic = (chapter, label) => ({ label: `OpenStax Organic Chemistry: ${label}`, url: `${OPENSTAX}/organic-chemistry/pages/${chapter}-why-this-chapter` });
const biology = (chapter, label) => ({ label: `OpenStax Biology 2e: ${label}`, url: `${OPENSTAX}/biology-2e/pages/${chapter}-introduction` });

export const MCAT_CP_LESSONS = [
  {
    id: '4a', skill: '4A: Translational motion, forces, work, energy, and equilibrium in living systems',
    title: 'Motion, forces, work and energy',
    body: [
      'Motion in a straight line with steady acceleration follows three equations: v = v₀ + at, Δx = v₀t + ½at², and v² = v₀² + 2aΔx. Pick the one that leaves out the quantity you are not given. Near Earth, falling objects accelerate at g ≈ 9.8 m/s², which MCAT arithmetic usually rounds to 10.',
      'Forces change motion: the net force equals mass times acceleration (F = ma). An object is in equilibrium when the forces on it cancel and the turning effects, or torques (τ = rF sin θ), cancel too. On a slope, gravity splits into mg sin θ along the surface and mg cos θ into it.',
      'Work is force times distance moved in the direction of the force, W = Fd cos θ. Kinetic energy is ½mv² and gravitational potential energy is mgh. The net work done on an object equals its change in kinetic energy, and without friction, mechanical energy is conserved. Power is work per second: P = W/t, in watts.',
    ],
    terms: [
      ['Displacement', 'Change in position, with a direction. Distance travelled has no direction.'],
      ['Net force', 'The sum of all forces on an object; it sets the acceleration (F = ma).'],
      ['Normal force', 'The push of a surface on an object, at right angles to the surface.'],
      ['Torque', 'The turning effect of a force: τ = rF sin θ.'],
      ['Work', 'Energy transferred by a force: W = Fd cos θ, in joules.'],
      ['Power', 'The rate of doing work: P = W/t, in watts (joules per second).'],
    ],
    example: {
      problem: 'A 70 kg person climbs a staircase 3 m high in 5 s. Taking g = 10 m/s², how much power do they produce against gravity?',
      steps: ['Work against gravity = mgh = 70 × 10 × 3 = 2,100 J.', 'Power = work ÷ time = 2,100 J ÷ 5 s = 420 W.'],
      answer: '420 W',
    },
    links: [
      physics('2-introduction-to-one-dimensional-kinematics', 'kinematics'),
      physics('4-introduction-to-dynamics-newtons-laws-of-motion', 'Newton’s laws'),
      physics('7-introduction-to-work-energy-and-energy-resources', 'work and energy'),
      KHAN,
    ],
  },
  {
    id: '4b', skill: '4B: Importance of fluids for the circulation of blood, gas movement, and gas exchange',
    title: 'Fluids, blood flow and gases',
    body: [
      'Pressure is force per area (P = F/A). In a still fluid it grows with depth: P = P₀ + ρgh. An object in a fluid is pushed up by a buoyant force equal to the weight of the fluid it displaces, F = ρ(fluid) × V(submerged) × g, which is why an object floats when it is less dense than the fluid.',
      'A moving fluid obeys continuity: A₁v₁ = A₂v₂, so it speeds up where a pipe narrows. Bernoulli’s equation, P + ½ρv² + ρgh = constant, says faster flow means lower pressure. For blood in a vessel, Poiseuille’s law makes flow proportional to the fourth power of the radius, so halving a vessel’s radius cuts flow to 1/16 at the same pressure difference.',
      'Gases follow PV = nRT. In a mixture each gas contributes its own partial pressure (Dalton’s law), and how much of a gas dissolves in a liquid is proportional to its partial pressure above it (Henry’s law), which is what drives oxygen into blood in the lungs.',
    ],
    terms: [
      ['Density (ρ)', 'Mass per volume, ρ = m/V. Water is about 1,000 kg/m³.'],
      ['Hydrostatic pressure', 'Pressure from the weight of fluid above: ρgh.'],
      ['Buoyant force', 'The upward force equal to the weight of displaced fluid (Archimedes’ principle).'],
      ['Continuity equation', 'A₁v₁ = A₂v₂ for a fluid that cannot be compressed.'],
      ['Poiseuille’s law', 'Flow rate ∝ r⁴ΔP / (ηL): radius matters most.'],
      ['Partial pressure', 'The share of a mixture’s pressure from one gas: its mole fraction × total pressure.'],
    ],
    example: {
      problem: 'An artery narrows to half its original radius. If the pressure difference along it stays the same, what fraction of the original blood flow gets through?',
      steps: ['Poiseuille’s law makes flow proportional to r⁴.', 'Halving r multiplies flow by (1/2)⁴ = 1/16.'],
      answer: '1/16 of the original flow',
    },
    links: [
      physics('11-introduction-to-fluid-statics', 'fluid statics'),
      physics('12-introduction-to-fluid-dynamics-and-its-biological-and-medical-applications', 'fluid dynamics'),
      chemistry(9, 'gases'),
      KHAN,
    ],
  },
  {
    id: '4c', skill: '4C: Electrochemistry and electrical circuits and their elements',
    title: 'Circuits and electrochemistry',
    body: [
      'Current (I) is charge flowing per second; voltage (V) is the energy per charge that pushes it; resistance (R) opposes it. Ohm’s law ties them together: V = IR, and the power used is P = IV = I²R = V²/R. Resistors in series add (R = R₁ + R₂); in parallel their reciprocals add (1/R = 1/R₁ + 1/R₂), so the total is smaller than either.',
      'A capacitor stores charge: C = Q/V, holding energy ½CV². Capacitors combine the opposite way to resistors: they add in parallel. Placing an insulating material (a dielectric) between the plates raises the capacitance.',
      'In an electrochemical cell, oxidation (loss of electrons) happens at the anode and reduction (gain of electrons) at the cathode, whatever the kind of cell. A galvanic cell runs by itself: E°cell is positive and ΔG° = −nFE° is negative. An electrolytic cell needs an outside power source to drive a reaction that would not happen on its own.',
    ],
    terms: [
      ['Ohm’s law', 'V = IR.'],
      ['Equivalent resistance', 'Series: add. Parallel: 1/R = Σ 1/Rᵢ.'],
      ['Capacitance', 'Charge stored per volt, C = Q/V, in farads.'],
      ['Anode', 'Where oxidation happens (in a galvanic cell, the negative terminal).'],
      ['Cathode', 'Where reduction happens (in a galvanic cell, the positive terminal).'],
      ['ΔG° = −nFE°', 'Links cell voltage to free energy; F is Faraday’s constant, about 96,500 C per mole of electrons.'],
    ],
    example: {
      problem: 'Two 6 Ω resistors are connected in parallel across a 12 V battery. What current does the battery supply, and what power do the resistors use?',
      steps: ['Parallel: 1/R = 1/6 + 1/6 = 1/3, so R = 3 Ω.', 'I = V/R = 12/3 = 4 A.', 'P = IV = 4 × 12 = 48 W.'],
      answer: '4 A and 48 W',
    },
    links: [
      physics('20-introduction-to-electric-current-resistance-and-ohms-law', 'current and resistance'),
      physics('21-introduction-to-circuits-and-dc-instruments', 'circuits'),
      chemistry(17, 'electrochemistry'),
      KHAN,
    ],
  },
  {
    id: '4d', skill: '4D: How light and sound interact with matter',
    title: 'Light and sound',
    body: [
      'Every wave obeys v = fλ: speed equals frequency times wavelength. Sound is a longitudinal pressure wave that travels faster through solids and liquids than through air (about 343 m/s). Loudness is measured in decibels, β = 10 log(I/I₀), so every 10 dB step means ten times the intensity. A source moving towards you sounds higher-pitched (the Doppler effect).',
      'Light is an electromagnetic wave. A photon’s energy is E = hf, so higher frequency (shorter wavelength) means more energy: ultraviolet carries more than visible light. Light slows in a material by its index of refraction, n = c/v, and bends at a boundary according to Snell’s law, n₁ sin θ₁ = n₂ sin θ₂.',
      'Lenses and mirrors follow 1/f = 1/dₒ + 1/dᵢ, with magnification m = −dᵢ/dₒ. A converging lens has a positive focal length and forms a real, upside-down image of an object beyond its focal point. A lens’s power in diopters is 1/f with f in metres; nearsightedness is corrected with a diverging lens.',
    ],
    terms: [
      ['Wave speed', 'v = fλ.'],
      ['Decibel scale', 'β = 10 log(I/I₀); +10 dB is 10× the intensity.'],
      ['Photon energy', 'E = hf = hc/λ.'],
      ['Index of refraction', 'n = c/v; always at least 1.'],
      ['Total internal reflection', 'Complete reflection when light meets a lower-index material beyond the critical angle.'],
      ['Thin lens equation', '1/f = 1/dₒ + 1/dᵢ; real images have positive dᵢ.'],
    ],
    example: {
      problem: 'An object stands 30 cm in front of a converging lens with a focal length of 10 cm. Where is the image, and how large is it?',
      steps: ['1/dᵢ = 1/f − 1/dₒ = 1/10 − 1/30 = 2/30, so dᵢ = 15 cm.', 'm = −dᵢ/dₒ = −15/30 = −0.5.'],
      answer: 'A real, upside-down image 15 cm behind the lens, half the size',
    },
    links: [
      physics('17-introduction-to-the-physics-of-hearing', 'sound and hearing'),
      physics('25-introduction-to-geometric-optics', 'geometric optics'),
      KHAN,
    ],
  },
  {
    id: '4e', skill: '4E: Atoms, nuclear decay, electronic structure, and atomic chemical behavior',
    title: 'Atoms, decay and electron structure',
    body: [
      'An atom’s atomic number Z counts its protons and its mass number A counts protons plus neutrons; isotopes share Z but differ in A. Unstable nuclei decay: alpha decay removes 2 protons and 2 neutrons (A − 4, Z − 2); beta-minus decay turns a neutron into a proton (Z + 1); positron emission and electron capture turn a proton into a neutron (Z − 1); gamma emission changes neither.',
      'Decay is described by a half-life: after each one, half of what remained is left, so N = N₀(½)^(t/t½).',
      'Electrons fill orbitals from lowest energy up (the Aufbau principle), two per orbital with opposite spins (Pauli), spreading out singly before pairing (Hund). Across a period, atoms get smaller and hold their electrons more tightly, so ionization energy and electronegativity rise; down a group the opposite happens. When an electron drops to a lower level it emits a photon carrying exactly the energy difference.',
    ],
    terms: [
      ['Isotope', 'Same element (same Z), different number of neutrons.'],
      ['Alpha particle', 'A helium-4 nucleus: 2 protons, 2 neutrons.'],
      ['Half-life', 'The time for half of a radioactive sample to decay.'],
      ['Ionization energy', 'Energy needed to remove an electron; rises across a period and up a group.'],
      ['Electronegativity', 'How strongly an atom pulls shared electrons; fluorine is highest.'],
      ['Valence electrons', 'The outermost electrons, which set how an atom bonds.'],
    ],
    example: {
      problem: 'A radioactive tracer has a half-life of 6 hours. How much of an 80 mg dose remains after 18 hours?',
      steps: ['18 hours is 18 ÷ 6 = 3 half-lives.', '80 × (½)³ = 80 ÷ 8 = 10 mg.'],
      answer: '10 mg',
    },
    links: [
      physics('31-introduction-to-radioactivity-and-nuclear-physics', 'radioactivity'),
      chemistry(6, 'electronic structure and periodic properties'),
      KHAN,
    ],
  },
  {
    id: '5a', skill: '5A: Unique nature of water and its solutions',
    title: 'Water, acids, bases and solutions',
    body: [
      'Water is polar and forms hydrogen bonds, which gives it a high specific heat, a high boiling point for its size, and its power to dissolve ions and other polar substances.',
      'Acidity is measured by pH = −log[H⁺]. At 25 °C, [H⁺][OH⁻] = 1.0 × 10⁻¹⁴, so pH + pOH = 14. Strong acids ionize completely; weak acids only partly, measured by Ka (a larger Ka, or smaller pKa, means a stronger acid). A buffer, a weak acid with its conjugate base, resists changes in pH, following the Henderson–Hasselbalch equation pH = pKa + log([A⁻]/[HA]). It works best within about one unit of its pKa.',
      'Dissolved particles change a solution’s properties in proportion to how many there are, not what they are: they raise the boiling point, lower the freezing point (ΔT = iKm) and create osmotic pressure (π = iMRT). The van ’t Hoff factor i counts particles per formula unit, so NaCl gives about 2.',
    ],
    terms: [
      ['pH', '−log[H⁺]; each unit is a tenfold change in [H⁺].'],
      ['Ka and pKa', 'An acid’s ionization constant; pKa = −log Ka.'],
      ['Buffer', 'A weak acid and its conjugate base, which together resist pH change.'],
      ['Henderson–Hasselbalch', 'pH = pKa + log([A⁻]/[HA]).'],
      ['Colligative property', 'A property set by the number of dissolved particles: boiling point, freezing point, osmotic pressure.'],
      ['Ksp', 'The solubility product of a sparingly soluble salt.'],
    ],
    example: {
      problem: 'A buffer contains acetic acid (pKa 4.76) and ten times as much acetate as acetic acid. What is its pH?',
      steps: ['pH = pKa + log([A⁻]/[HA]) = 4.76 + log 10.', 'log 10 = 1, so pH = 5.76.'],
      answer: 'pH 5.76',
    },
    links: [chemistry(11, 'solutions and colloids'), chemistry(14, 'acid–base equilibria'), KHAN],
  },
  {
    id: '5b', skill: '5B: Nature of molecules and intermolecular interactions',
    title: 'Molecules, shapes and the forces between them',
    body: [
      'Atoms in a molecule arrange their bonds and lone pairs as far apart as possible (VSEPR): two groups make a line (180°), three a flat triangle (120°), four a tetrahedron (109.5°). Lone pairs squeeze the bond angles a little, which is why water is bent at about 104.5°. A single bond is one sigma bond; a double bond adds a pi bond, which stops rotation.',
      'Molecules attract each other through intermolecular forces. From weakest to strongest: London dispersion forces (in everything, and larger for bigger molecules), dipole–dipole forces between polar molecules, and hydrogen bonds, where H bonded to N, O or F is drawn to a lone pair on another N, O or F. Stronger forces mean higher boiling points.',
      'Isomers share a formula but differ in structure. Stereoisomers differ only in 3D arrangement: enantiomers are non-superimposable mirror images, which share physical properties except the direction they rotate plane-polarized light; diastereomers are stereoisomers that are not mirror images. A molecule with n chiral centres has at most 2ⁿ stereoisomers.',
    ],
    terms: [
      ['VSEPR', 'Electron groups around an atom spread out as far as possible.'],
      ['Hybridization', 'sp (linear), sp² (trigonal planar), sp³ (tetrahedral).'],
      ['Hydrogen bond', 'Attraction between H on N, O or F and a lone pair on N, O or F.'],
      ['Chiral centre', 'Usually a carbon bonded to four different groups.'],
      ['Enantiomers', 'Non-superimposable mirror-image stereoisomers.'],
      ['Diastereomers', 'Stereoisomers that are not mirror images of each other.'],
    ],
    example: {
      problem: 'A molecule has 3 chiral centres and no internal plane of symmetry. How many stereoisomers can it have?',
      steps: ['The maximum is 2ⁿ for n chiral centres.', '2³ = 8, and with no symmetry none of them are identical (no meso forms).'],
      answer: '8 stereoisomers',
    },
    links: [chemistry(7, 'chemical bonding and molecular geometry'), chemistry(10, 'liquids and solids'), organic(5, 'stereochemistry'), KHAN],
  },
  {
    id: '5c', skill: '5C: Separation and purification methods',
    title: 'Separating and purifying compounds',
    body: [
      'Extraction splits compounds between two liquids that do not mix, usually water and an organic solvent. Charge moves a compound into water: adding base deprotonates a carboxylic acid into its water-soluble salt, and adding acid does the same for an amine.',
      'Distillation separates liquids by boiling point. Simple distillation works when the boiling points differ by more than about 25 °C; closer than that needs fractional distillation. Recrystallization purifies a solid by dissolving it hot and letting pure crystals form as it cools.',
      'Chromatography separates by how strongly compounds stick to a stationary phase. On a silica TLC plate, which is polar, less polar compounds travel farther and have a higher Rf (distance travelled by the compound ÷ distance travelled by the solvent). In size-exclusion chromatography the largest molecules come out first, because they cannot enter the pores. Gel electrophoresis with SDS separates proteins by size alone; isoelectric focusing separates them by their isoelectric point (pI).',
    ],
    terms: [
      ['Extraction', 'Separating compounds between two immiscible liquids.'],
      ['Fractional distillation', 'Distillation for liquids whose boiling points are close together.'],
      ['Rf value', 'Distance the compound moved ÷ distance the solvent front moved.'],
      ['Size-exclusion chromatography', 'Large molecules elute first; small ones are slowed by the pores.'],
      ['SDS-PAGE', 'Electrophoresis that separates denatured proteins by mass.'],
      ['Isoelectric point (pI)', 'The pH at which a molecule carries no net charge.'],
    ],
    example: {
      problem: 'On a TLC plate the solvent front moves 8.0 cm and a compound moves 3.0 cm. What is the compound’s Rf?',
      steps: ['Rf = compound distance ÷ solvent distance.', '3.0 ÷ 8.0 = 0.375.'],
      answer: 'Rf = 0.375',
    },
    links: [chemistry(11, 'solutions and colloids'), chemistry(10, 'liquids and solids'), KHAN],
  },
  {
    id: '5d', skill: '5D: Structure, function, and reactivity of biologically relevant molecules',
    title: 'Biological molecules and how they react',
    body: [
      'Amino acids join through peptide bonds, made by condensation (a water is released) and broken by hydrolysis (a water is added). All amino acids in proteins are the L form, and all but glycine are chiral. Carbohydrates are aldoses or ketoses that close into rings; the new chiral carbon made by ring-closing (the anomeric carbon) gives α and β forms. Fats store energy as triacylglycerols; phospholipids, with a polar head and nonpolar tails, build membranes.',
      'Most biological reactions are a nucleophile (electron-rich) attacking an electrophile (electron-poor). Aldehydes and ketones undergo nucleophilic addition at the carbonyl carbon. Carboxylic acid derivatives undergo nucleophilic acyl substitution, most readily for the least stable: acid chlorides, then anhydrides, esters and, least reactive, amides, which is why peptide bonds are so stable.',
      'Substitution at a saturated carbon runs by SN2 (one step, backside attack, inversion of configuration, favoured at primary carbons) or SN1 (a carbocation first, giving a mixture of configurations, favoured at tertiary carbons). Primary alcohols oxidize to aldehydes and then carboxylic acids; secondary alcohols oxidize to ketones.',
    ],
    terms: [
      ['Condensation', 'Joining two molecules with the loss of water.'],
      ['Hydrolysis', 'Breaking a bond by adding water.'],
      ['Anomers', 'Sugar ring forms differing only at the anomeric carbon (α and β).'],
      ['Nucleophile', 'An electron-rich species that attacks.'],
      ['Nucleophilic acyl substitution', 'The reaction of carboxylic acid derivatives: acid chloride > anhydride > ester > amide.'],
      ['SN2', 'One-step substitution with backside attack and inversion.'],
    ],
    example: {
      problem: 'How many water molecules are used up in completely hydrolysing a pentapeptide (five amino acids) into free amino acids?',
      steps: ['Five amino acids in a chain are joined by 4 peptide bonds.', 'Each hydrolysis breaks one bond and uses one water.'],
      answer: '4 water molecules',
    },
    links: [organic(26, 'amino acids, peptides and proteins'), biology(3, 'biological macromolecules'), KHAN],
  },
  {
    id: '5e', skill: '5E: Principles of chemical thermodynamics and kinetics',
    title: 'Energy, equilibrium and reaction rates',
    body: [
      'Whether a reaction can happen on its own depends on its Gibbs free energy: ΔG = ΔH − TΔS, and a negative ΔG means spontaneous. When ΔH and ΔS have the same sign, temperature decides: a reaction that releases heat but loses disorder (both negative) is spontaneous only below T = ΔH/ΔS. At equilibrium ΔG° = −RT ln K, so K > 1 goes with a negative ΔG°.',
      'Comparing the reaction quotient Q with K shows which way a reaction will shift: if Q < K it runs forward. Le Châtelier’s principle says a system at equilibrium shifts to undo a change, such as adding a reactant, removing a product, or changing the temperature.',
      'How fast a reaction goes is a separate question from whether it goes. Rates follow a rate law, rate = k[A]ᵐ[B]ⁿ, whose orders come from experiment, not the balanced equation. Raising the temperature or lowering the activation energy speeds it up. A catalyst lowers the activation energy for both directions, so it speeds up reaching equilibrium without changing ΔG, ΔH or K.',
    ],
    terms: [
      ['Gibbs free energy', 'ΔG = ΔH − TΔS; negative means spontaneous.'],
      ['Equilibrium constant (K)', 'The ratio of products to reactants at equilibrium; ΔG° = −RT ln K.'],
      ['Reaction quotient (Q)', 'The same ratio at any moment; compare with K to predict the shift.'],
      ['Le Châtelier’s principle', 'A system at equilibrium shifts to counteract a change.'],
      ['Activation energy', 'The energy barrier a reaction must cross.'],
      ['Catalyst', 'Lowers the activation energy without changing ΔG or K.'],
    ],
    example: {
      problem: 'A reaction has ΔH = −40 kJ/mol and ΔS = −100 J/(mol·K). Below what temperature is it spontaneous?',
      steps: ['Spontaneous when ΔG = ΔH − TΔS < 0.', 'Both are negative, so it holds while T < ΔH/ΔS = (−40,000 J/mol) ÷ (−100 J/(mol·K)).', 'That is T < 400 K.'],
      answer: 'Below 400 K',
    },
    links: [chemistry(16, 'thermodynamics'), chemistry(12, 'kinetics'), KHAN],
  },
];
