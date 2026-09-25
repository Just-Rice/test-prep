// Lessons for the MCAT's Biological and Biochemical Foundations section, one per AAMC content category.
//
// Each is a short, plain-language pass over what the category covers: enough to answer its Foundation questions
// and to know what to read next. The links go to the free OpenStax Biology textbook (every chapter address checked
// to exist, and to be the chapter named, when written) and to Khan Academy's MCAT course, made with the AAMC. The
// worked examples are re-checked by tests/mcat-questions.test.js.

const biology = (chapter, label) => ({ label: `OpenStax Biology 2e: ${label}`, url: `https://openstax.org/books/biology-2e/pages/${chapter}-introduction` });
const khan = (unit, label) => ({ label: `Khan Academy: ${label}`, url: `https://www.khanacademy.org/test-prep/mcat/${unit}` });
const BIOMOLECULES = khan('biomolecules', 'MCAT biomolecules');
const CELLS = khan('cells', 'MCAT cells');
const ORGANS = khan('organ-systems', 'MCAT organ systems');

export const MCAT_BB_LESSONS = [
  {
    id: '1a', skill: '1A: Structure and function of proteins and their constituent amino acids',
    title: 'Amino acids and proteins',
    body: [
      'Proteins are chains of amino acids. Each of the 20 standard amino acids has the same backbone, an amino group, a carboxyl group and a hydrogen on a central carbon (the α-carbon), and differs in its side chain, which may be nonpolar, polar, acidic or basic. A peptide bond forms between the carboxyl group of one amino acid and the amino group of the next, releasing water, so a chain of n amino acids has n − 1 peptide bonds.',
      'Structure is described at four levels. Primary structure is the sequence. Secondary structure, the α-helix and the β-sheet, is held by hydrogen bonds between backbone C=O and N–H groups. Tertiary structure, the overall fold, comes from the side chains: nonpolar ones cluster away from water, and hydrogen bonds, salt bridges and covalent disulfide bonds between cysteines hold the fold in place. Quaternary structure is the assembly of several chains, as in hemoglobin. Heat, extreme pH and some chemicals unfold proteins (denaturation) without breaking peptide bonds.',
      'Because amino acids carry acidic and basic groups, their charge depends on pH. At the isoelectric point (pI) the average net charge is zero. For an amino acid without an ionizable side chain, the pI is the average of its two pKa values; with an acidic or basic side chain, it is the average of the two pKa values on either side of the neutral form. Enzymes are proteins, and their activity depends on this fold and these charges.',
    ],
    terms: [
      ['Peptide bond', 'The amide bond joining two amino acids, formed with the loss of water.'],
      ['Primary structure', 'A protein’s sequence of amino acids.'],
      ['α-helix', 'A coiled secondary structure held by backbone hydrogen bonds between residues four apart.'],
      ['Disulfide bond', 'A covalent S–S link between two cysteine side chains.'],
      ['Zwitterion', 'A molecule with both a positive and a negative charge and no net charge.'],
      ['Denaturation', 'Loss of a protein’s shape, and usually its function, without breaking peptide bonds.'],
    ],
    example: {
      problem: 'Lysine has pKa values of 2.2 (α-carboxyl), 9.0 (α-amino) and 10.5 (side-chain amino group). What is its isoelectric point?',
      steps: [
        'At very low pH lysine carries +2: both amino groups are protonated and the carboxyl is neutral.',
        'Losing the carboxyl proton (pKa 2.2) gives +1, and losing the α-amino proton (pKa 9.0) gives the neutral form; losing the side-chain proton (pKa 10.5) then gives −1.',
        'The neutral form lies between pKa 9.0 and 10.5, so pI = (9.0 + 10.5) ÷ 2 = 9.75.',
      ],
      answer: 'pI = 9.75',
    },
    links: [biology(3, 'biological macromolecules'), BIOMOLECULES],
  },
  {
    id: '1b', skill: '1B: Transmission of genetic information from the gene to the protein',
    title: 'From gene to protein',
    body: [
      'DNA is a double helix of two antiparallel strands, held by hydrogen bonds between paired bases: A with T and G with C, so a DNA molecule has as much A as T and as much G as C. It is copied semiconservatively: each new double helix keeps one old strand. DNA polymerase builds new strands only 5′ to 3′, so one strand (the leading strand) is made continuously and the other (the lagging strand) in short Okazaki fragments that ligase joins.',
      'In transcription, RNA polymerase binds a promoter and reads the template strand to build RNA 5′ to 3′. In eukaryotes the pre-mRNA is then processed in the nucleus: a 5′ cap and a poly(A) tail are added, and the spliceosome removes introns and joins the exons. In translation, ribosomes read the mRNA three bases (a codon) at a time; tRNAs bring the matching amino acids, starting at AUG (methionine) and ending at a stop codon (UAA, UAG or UGA).',
      'Mutations can be silent (same amino acid), missense (a different amino acid), nonsense (a new stop codon) or frameshifts (an insertion or deletion that is not a multiple of three). Gene expression is regulated at many points. In bacteria, genes are often grouped in operons controlled together, like the lac operon; in eukaryotes, transcription factors, enhancers and chemical marks on DNA and histones decide which genes are on.',
    ],
    terms: [
      ['Semiconservative replication', 'Copying in which each new double helix keeps one original strand.'],
      ['Okazaki fragment', 'A short piece of the lagging strand, made 5′ to 3′ and later joined by ligase.'],
      ['Promoter', 'The DNA sequence where RNA polymerase binds to start transcription.'],
      ['Codon', 'Three mRNA bases that specify one amino acid or a stop.'],
      ['Splicing', 'Removal of introns from pre-mRNA and joining of the exons.'],
      ['Operon', 'A group of bacterial genes transcribed together under one promoter and operator.'],
    ],
    example: {
      problem: 'A sample of double-stranded DNA is 22% cytosine. What percentage of its bases is adenine?',
      steps: [
        'C pairs with G, so G is also 22%, and C + G = 44%.',
        'A + T makes up the rest: 100% − 44% = 56%.',
        'A pairs with T, so each is half of that: 56% ÷ 2 = 28%.',
      ],
      answer: '28% adenine',
    },
    links: [biology(14, 'DNA structure and function'), biology(15, 'genes and proteins'), biology(16, 'gene regulation'), BIOMOLECULES],
  },
  {
    id: '1c', skill: '1C: Transmission of heritable information from generation to generation and the processes that increase genetic diversity',
    title: 'Heredity and genetic diversity',
    body: [
      'Genes come in versions called alleles. Mendel’s law of segregation says each parent passes on one of its two alleles for a gene, chosen at random; his law of independent assortment says genes on different chromosomes are inherited independently, so their probabilities multiply. Dominance is not always complete: in incomplete dominance heterozygotes are intermediate, and in codominance both alleles show, as in AB blood type. Genes on the X chromosome show sex-linked patterns, because males have only one X.',
      'Genes close together on one chromosome are linked and tend to be inherited together. Crossing over in prophase I of meiosis can separate them, and the farther apart two genes are, the more often it does: a 1% recombination frequency is defined as 1 centimorgan (cM). Meiosis also shuffles whole chromosomes, since each pair of homologs lines up independently, which with crossing over makes every gamete genetically unique.',
      'A population is in Hardy–Weinberg equilibrium when allele frequencies stay constant: a large population with random mating and no mutation, migration or selection. Then, for two alleles with frequencies p and q (p + q = 1), the genotype frequencies are p², 2pq and q². Evolution is change in allele frequencies, driven by natural selection, genetic drift (chance, strongest in small populations), gene flow and mutation.',
    ],
    terms: [
      ['Allele', 'One version of a gene.'],
      ['Genotype', 'The alleles an individual has; the phenotype is the trait that shows.'],
      ['Independent assortment', 'Genes on different chromosomes are passed on independently of each other.'],
      ['Crossing over', 'Exchange of segments between homologous chromosomes in prophase I.'],
      ['Hardy–Weinberg equilibrium', 'Unchanging allele frequencies, with genotypes at p², 2pq and q².'],
      ['Genetic drift', 'Random change in allele frequencies, strongest in small populations.'],
    ],
    example: {
      problem: 'In a population in Hardy–Weinberg equilibrium, 16% of people show a recessive trait. What fraction of the population are heterozygous carriers?',
      steps: [
        'The recessive phenotype is q², so q² = 0.16 and q = 0.4.',
        'p = 1 − q = 0.6.',
        'Carriers are 2pq = 2 × 0.6 × 0.4 = 0.48.',
      ],
      answer: '0.48, or 48% of the population',
    },
    links: [biology(11, 'meiosis and sexual reproduction'), biology(12, 'Mendel’s experiments and heredity'), biology(19, 'the evolution of populations'), BIOMOLECULES],
  },
  {
    id: '1d', skill: '1D: Principles of bioenergetics and fuel molecule metabolism',
    title: 'Metabolism and enzymes',
    body: [
      'Cells capture energy from fuel in ATP. Glycolysis, in the cytosol, splits glucose into two pyruvate, with a net gain of 2 ATP and 2 NADH. Without oxygen, pyruvate is reduced to lactate (or, in yeast, ethanol) to regenerate NAD⁺. With oxygen, pyruvate enters the mitochondrion and is converted to acetyl-CoA, which the citric acid cycle oxidizes to CO₂, making 3 NADH, 1 FADH₂ and 1 GTP per turn.',
      'NADH and FADH₂ give their electrons to the electron transport chain in the inner mitochondrial membrane. As electrons pass to O₂, the final acceptor, the chain pumps protons out of the matrix, and ATP synthase uses their flow back in to make ATP (oxidative phosphorylation), about 30 to 32 ATP per glucose in all. Between meals the liver makes glucose from other molecules (gluconeogenesis) and breaks down glycogen; fats are broken down by β-oxidation. Insulin favors storage and glucagon favors release.',
      'Enzymes speed reactions by lowering their activation energy without changing ΔG. Their kinetics follow the Michaelis–Menten equation, v = Vmax[S] / (Km + [S]), where Km is the substrate concentration giving half the maximum rate. A competitive inhibitor raises Km and leaves Vmax alone; a noncompetitive inhibitor lowers Vmax without changing Km; an uncompetitive inhibitor lowers both.',
    ],
    terms: [
      ['Glycolysis', 'The cytosolic breakdown of glucose to two pyruvate, netting 2 ATP and 2 NADH.'],
      ['Citric acid cycle', 'The mitochondrial cycle that oxidizes acetyl-CoA to CO₂, making NADH, FADH₂ and GTP.'],
      ['Oxidative phosphorylation', 'ATP synthesis driven by the proton gradient built by the electron transport chain.'],
      ['Michaelis constant (Km)', 'The substrate concentration at which an enzyme works at half its maximum rate.'],
      ['Competitive inhibition', 'Inhibition by a molecule that competes for the active site: Km rises, Vmax is unchanged.'],
      ['Gluconeogenesis', 'Making glucose from other molecules, mainly in the liver, between meals.'],
    ],
    example: {
      problem: 'An enzyme has a Km of 4 mM. At what substrate concentration does it work at 80% of its maximum rate?',
      steps: [
        'Set v / Vmax = [S] / (Km + [S]) = 0.8.',
        'Then [S] = 0.8 × Km + 0.8 × [S], so 0.2 × [S] = 0.8 × 4 mM.',
        '[S] = 3.2 ÷ 0.2 = 16 mM, four times the Km.',
      ],
      answer: '16 mM',
    },
    links: [biology(6, 'metabolism'), biology(7, 'cellular respiration'), BIOMOLECULES],
  },
  {
    id: '2a', skill: '2A: Assemblies of molecules, cells, and groups of cells within single cellular and multicellular organisms',
    title: 'Cells, membranes and tissues',
    body: [
      'Eukaryotic cells are divided into organelles. The nucleus holds the DNA; the rough endoplasmic reticulum makes secreted and membrane proteins, which the Golgi apparatus modifies and sorts; the smooth ER makes lipids; mitochondria make most of the ATP; lysosomes digest material; and peroxisomes break down fatty acids and toxins. The cytoskeleton gives shape and movement: microfilaments (actin), microtubules (tubulin, which also form the mitotic spindle, cilia and flagella) and intermediate filaments.',
      'The plasma membrane is a fluid mosaic: a phospholipid bilayer with proteins moving within it, and cholesterol that buffers its fluidity. Small nonpolar molecules cross by simple diffusion; ions and polar molecules need channels or carriers (facilitated diffusion). Moving a substance against its gradient takes energy, either directly from ATP (primary active transport, like the Na⁺/K⁺ pump) or from another ion’s gradient (secondary active transport). Water follows solute by osmosis: a cell shrinks in a hypertonic solution and swells in a hypotonic one.',
      'In multicellular organisms, cells are joined by junctions, tight junctions that seal, desmosomes that anchor and gap junctions that connect, and organized into four tissue types: epithelial (covering and lining), connective (support, including bone and blood), muscle and nervous.',
    ],
    terms: [
      ['Fluid mosaic model', 'The membrane as a fluid lipid bilayer with proteins moving within it.'],
      ['Facilitated diffusion', 'Passive movement down a gradient through a channel or carrier protein.'],
      ['Secondary active transport', 'Transport against a gradient powered by another ion’s gradient, not directly by ATP.'],
      ['Tonicity', 'How a solution affects a cell’s volume: hypertonic shrinks it, hypotonic swells it.'],
      ['Tight junction', 'A seal between neighboring cells that stops fluid leaking between them.'],
      ['Microtubule', 'A hollow tubulin filament of the cytoskeleton; it builds the spindle, cilia and flagella.'],
    ],
    example: {
      problem: 'A cell whose contents are 0.3 Osm is placed in 0.2 M NaCl. Which way does water move?',
      steps: [
        'NaCl dissolves into two ions, so 0.2 M NaCl is 0.2 × 2 = 0.4 Osm.',
        'The outside, at 0.4 Osm, is more concentrated than the inside, at 0.3 Osm: the solution is hypertonic.',
        'Water moves out of the cell by osmosis, and the cell shrinks.',
      ],
      answer: 'Out of the cell: the solution is 0.4 Osm against 0.3 Osm inside',
    },
    links: [biology(4, 'cell structure'), biology(5, 'structure and function of plasma membranes'), biology(33, 'the animal body'), CELLS],
  },
  {
    id: '2b', skill: '2B: The structure, growth, physiology, and genetics of prokaryotes and viruses',
    title: 'Bacteria and viruses',
    body: [
      'Prokaryotes, the bacteria and archaea, have no nucleus or membrane-bound organelles. Their DNA is a single circular chromosome in a region called the nucleoid, often with small extra circles called plasmids, and their ribosomes are 70S rather than the 80S of eukaryotes. Most bacteria have a peptidoglycan cell wall: thick in Gram-positive bacteria, which stain purple, and thin beneath an outer membrane in Gram-negative bacteria, which stain pink.',
      'Bacteria reproduce by binary fission, and in good conditions the population doubles at a steady rate. A culture passes through a lag phase, a log (exponential) phase, a stationary phase and a death phase. Although they do not reproduce sexually, bacteria exchange genes: by taking up free DNA (transformation), through a virus (transduction), or through a pilus from a cell with an F plasmid (conjugation), which is how antibiotic resistance spreads.',
      'Viruses are not cells: they are genetic material, DNA or RNA, in a protein capsid, sometimes inside a lipid envelope, and they can reproduce only inside a host cell. In the lytic cycle a virus makes copies of itself and bursts the cell; in the lysogenic cycle its genome is built into the host’s and copied along with it until something triggers the lytic cycle. Retroviruses such as HIV carry reverse transcriptase to copy their RNA genome into DNA.',
    ],
    terms: [
      ['Gram stain', 'A stain that tells thick-walled Gram-positive bacteria (purple) from Gram-negative ones (pink).'],
      ['Plasmid', 'A small circle of DNA, separate from the chromosome, that bacteria can share.'],
      ['Transduction', 'Transfer of bacterial DNA from one cell to another by a virus.'],
      ['Lytic cycle', 'Viral reproduction that ends with the host cell bursting.'],
      ['Lysogenic cycle', 'A viral genome built into the host’s and copied quietly with it.'],
      ['Reverse transcriptase', 'The enzyme that copies RNA into DNA, carried by retroviruses.'],
    ],
    example: {
      problem: 'A culture of 1,000 bacteria in log phase doubles every 30 minutes. How many cells are there after 3 hours?',
      steps: [
        '3 hours is 180 minutes, or 180 ÷ 30 = 6 doubling times.',
        'Each doubling multiplies the number by 2, so the factor is 2⁶ = 64.',
        '1,000 × 64 = 64,000 cells.',
      ],
      answer: '64,000 cells',
    },
    links: [biology(21, 'viruses'), biology(22, 'prokaryotes: bacteria and archaea'), CELLS],
  },
  {
    id: '2c', skill: '2C: Processes of cell division, differentiation, and specialization',
    title: 'Cell division and development',
    body: [
      'The cell cycle runs through G1 (growth), S (DNA replication), G2 (preparation) and M (mitosis and cytokinesis). Cyclins and cyclin-dependent kinases drive it forward, and checkpoints stop it when something is wrong: p53, a tumor suppressor, halts the cycle in G1 when DNA is damaged. Cancer arises when oncogenes, overactive versions of genes that drive the cycle, and faulty tumor suppressors let cells divide unchecked.',
      'Mitosis gives two cells identical to the parent: chromosomes condense (prophase), line up (metaphase), their sister chromatids separate (anaphase), and new nuclei form (telophase). Meiosis makes gametes in two divisions. Meiosis I separates homologous chromosomes, after crossing over in prophase I, halving the chromosome number; meiosis II separates sister chromatids. Failure to separate (nondisjunction) gives gametes with too many or too few chromosomes. In humans, spermatogenesis yields four sperm per cell, while oogenesis yields one egg and polar bodies.',
      'After fertilization, the zygote divides (cleavage) into a blastula, which folds during gastrulation into three germ layers. The ectoderm forms the nervous system and skin; the mesoderm forms muscle, bone, blood and the kidneys; and the endoderm forms the lining of the gut and the lungs, and the liver. As cells specialize they lose potency, from the totipotent zygote to pluripotent embryonic stem cells to more limited adult stem cells. Cells that are no longer needed die by apoptosis, an orderly, programmed death.',
    ],
    terms: [
      ['Cyclin-dependent kinase', 'An enzyme that, bound to a cyclin, pushes the cell cycle to its next stage.'],
      ['Cytokinesis', 'Division of the cytoplasm into two daughter cells.'],
      ['Nondisjunction', 'Failure of chromosomes or chromatids to separate, giving gametes with extra or missing chromosomes.'],
      ['Gastrulation', 'The folding of the early embryo that forms the three germ layers.'],
      ['Germ layers', 'Ectoderm, mesoderm and endoderm, the three layers that every organ develops from.'],
      ['Apoptosis', 'Programmed, orderly cell death.'],
    ],
    example: {
      problem: 'A cell with 8 chromosomes (2n = 8) goes through meiosis. How many chromosomes and chromatids does each cell have after meiosis I, and after meiosis II?',
      steps: [
        'Meiosis I separates homologous pairs, so each cell gets 4 chromosomes, each still made of 2 sister chromatids: 4 chromosomes, 8 chromatids.',
        'Meiosis II separates the sister chromatids, so each cell ends with 4 chromosomes of 1 chromatid each.',
      ],
      answer: 'After meiosis I: 4 chromosomes, 8 chromatids. After meiosis II: 4 chromosomes, 4 chromatids.',
    },
    links: [biology(10, 'cell reproduction'), biology(43, 'animal reproduction and development'), CELLS],
  },
  {
    id: '3a', skill: '3A: Structure and functions of the nervous and endocrine systems and ways in which these systems coordinate the organ systems',
    title: 'Nervous and endocrine systems',
    body: [
      'A neuron receives signals on its dendrites and cell body, sums them at the axon hillock, and sends an action potential down its axon. At rest the inside of the membrane is about −70 mV, set up by the Na⁺/K⁺ pump and by K⁺ leaking out. At threshold, voltage-gated Na⁺ channels open and Na⁺ rushes in (depolarization); then Na⁺ channels close and K⁺ channels open (repolarization). Action potentials are all-or-none, and myelin speeds them up by letting them jump between nodes of Ranvier.',
      'At a chemical synapse, the arriving action potential lets Ca²⁺ in, triggering the release of neurotransmitter, which binds receptors on the next cell. The nervous system has central (brain and spinal cord) and peripheral parts; the peripheral autonomic system has a sympathetic division (“fight or flight”: faster heart, dilated pupils, glucose released) and a parasympathetic division (“rest and digest”).',
      'Endocrine glands release hormones into the blood. Peptide hormones bind receptors on the cell surface and act quickly through second messengers such as cAMP; steroid hormones cross the membrane and change gene transcription. The hypothalamus controls the anterior pituitary through releasing hormones, and the pituitary’s tropic hormones control other glands, such as the thyroid and adrenal cortex. Most of these axes are held steady by negative feedback: the final hormone suppresses the hypothalamus and pituitary.',
    ],
    terms: [
      ['Resting membrane potential', 'The voltage across a resting neuron’s membrane, about −70 mV.'],
      ['Action potential', 'An all-or-none electrical signal: Na⁺ rushes in, then K⁺ flows out.'],
      ['Saltatory conduction', 'Action potentials jumping between nodes of Ranvier along a myelinated axon.'],
      ['Sympathetic nervous system', 'The “fight or flight” division of the autonomic nervous system.'],
      ['Negative feedback', 'A system’s output damping its own production, keeping a quantity steady.'],
      ['Tropic hormone', 'A hormone that controls another endocrine gland, such as TSH or ACTH.'],
    ],
    example: {
      problem: 'A patient’s thyroid gland, damaged by disease, makes too little thyroid hormone. What happens to the level of TSH from the pituitary?',
      steps: [
        'Thyroid hormone normally feeds back to suppress TRH from the hypothalamus and TSH from the anterior pituitary.',
        'With less thyroid hormone, that suppression weakens.',
        'So the pituitary releases more TSH, trying to stimulate the failing gland.',
      ],
      answer: 'TSH rises, because negative feedback from thyroid hormone is lost',
    },
    links: [biology(35, 'the nervous system'), biology(37, 'the endocrine system'), ORGANS],
  },
  {
    id: '3b', skill: '3B: Structure and integrative functions of the main organ systems',
    title: 'The main organ systems',
    body: [
      'The heart pumps blood through two circuits: the right side to the lungs and the left side to the body. Cardiac output is heart rate × stroke volume, about 5 L/min at rest. Arteries carry blood at high pressure, capillaries exchange materials with the tissues, and veins return blood to the heart. In the lungs, O₂ and CO₂ cross the thin alveolar walls by diffusion; most O₂ is carried bound to hemoglobin, whose grip loosens where CO₂, H⁺ and temperature are high, and most CO₂ travels as bicarbonate.',
      'Each kidney has about a million nephrons. Blood is filtered at the glomerulus, about 125 mL/min in all (the glomerular filtration rate); most of the filtrate is reabsorbed along the tubule, and some substances are secreted into it. ADH makes the collecting duct reabsorb more water, and aldosterone makes the distal tubule reabsorb more Na⁺. Digestion breaks down starch (amylase), proteins (pepsin in the stomach, trypsin from the pancreas) and fats (lipase, helped by bile), and the small intestine absorbs most of the products.',
      'The immune system has an innate part (skin, phagocytes, inflammation) and an adaptive part: B cells make antibodies, helper T cells (CD4) coordinate, and cytotoxic T cells (CD8) kill infected cells. Skeletal muscle contracts as myosin pulls actin filaments within each sarcomere, once Ca²⁺ binds troponin and moves tropomyosin aside. Mean arterial pressure is roughly diastolic pressure plus a third of the difference between systolic and diastolic.',
    ],
    terms: [
      ['Stroke volume', 'The volume of blood the heart pumps with each beat.'],
      ['Mean arterial pressure', 'The average arterial pressure over a cardiac cycle, about diastolic + (systolic − diastolic) ÷ 3.'],
      ['Glomerular filtration rate', 'The volume of plasma filtered by the kidneys each minute, about 125 mL/min.'],
      ['Bohr effect', 'CO₂ and acid lowering hemoglobin’s affinity for O₂, so it unloads O₂ in active tissue.'],
      ['Sarcomere', 'The repeating unit of a muscle fiber, where actin and myosin slide past each other.'],
      ['Antibody', 'A protein made by B cells that binds a specific antigen.'],
    ],
    example: {
      problem: 'A patient’s blood pressure is 120/80 mmHg. What is their approximate mean arterial pressure?',
      steps: [
        'The heart spends about two thirds of each cycle in diastole, so the mean is closer to the diastolic value.',
        'Mean arterial pressure ≈ diastolic + (systolic − diastolic) ÷ 3 = 80 + 40 ÷ 3.',
        '80 + 13.3 ≈ 93 mmHg.',
      ],
      answer: 'About 93 mmHg',
    },
    links: [biology(40, 'the circulatory system'), biology(39, 'the respiratory system'), biology(41, 'osmotic regulation and excretion'), biology(34, 'animal nutrition and the digestive system'), ORGANS],
  },
];
