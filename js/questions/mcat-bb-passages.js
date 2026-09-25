// Original passage sets for the MCAT's Biological and Biochemical Foundations section, written for this app: the
// AAMC publishes no question bank, and its practice material may not be copied.
//
// Three sets of four, each built on an experiment or a clinical account, as in the real section. Every question
// carries its whole passage, and the questions from one passage share a `set`. Planned before writing: three
// answers on each letter and four questions at each tier. The data in the first passage, and every calculated
// answer, are checked in tests/mcat-questions.test.js.

const SKILL = {
  '1A': '1A: Structure and function of proteins and their constituent amino acids',
  '1B': '1B: Transmission of genetic information from the gene to the protein',
  '1C': '1C: Transmission of heritable information from generation to generation and the processes that increase genetic diversity',
  '1D': '1D: Principles of bioenergetics and fuel molecule metabolism',
  '3A': '3A: Structure and functions of the nervous and endocrine systems and ways in which these systems coordinate the organ systems',
  '3B': '3B: Structure and integrative functions of the main organ systems',
};
const DOMAIN = { 1: 'Biomolecules (Foundational Concept 1)', 3: 'Organ systems (Foundational Concept 3)' };

// A passage and its questions. Each question is [number, content category, tier, stem, choices, answer, rationale].
const set = (id, passage, questions) => questions.map(([n, code, difficulty, stem, choices, answer, rationale]) => ({
  id: `mcat-bb-${id}-${n}`, exam: 'mcat', section: 'BB', domain: DOMAIN[code[0]], skill: SKILL[code],
  difficulty, set: `mcat-bb-${id}`, passage, stem, choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
}));

const INHIBITOR = `An enzyme from a soil bacterium converts a substrate, S, into a product. To characterize it, researchers measured the initial rate of the reaction, v, at five substrate concentrations: first with no inhibitor, and then with 5.0 μM of a compound, I, that was being tested as an inhibitor. The temperature, the pH and the amount of enzyme were the same in every run. The rates, in μmol of product per minute, were:

[S] = 0.5 mM: 20.0 without I, 11.1 with I
[S] = 1.0 mM: 33.3 without I, 20.0 with I
[S] = 2.0 mM: 50.0 without I, 33.3 with I
[S] = 4.0 mM: 66.7 without I, 50.0 with I
[S] = 8.0 mM: 80.0 without I, 66.7 with I

Both sets of results fit the Michaelis–Menten equation, v = Vmax[S] / (Km + [S]), with the same Vmax of 100 μmol/min. The researchers confirmed this by showing that at very high substrate concentrations the rates with and without I became indistinguishable.

For a competitive inhibitor, the apparent Km measured in its presence is Km(1 + [I] / Ki), where Ki is the dissociation constant of the enzyme–inhibitor complex. The smaller Ki is, the more tightly the inhibitor binds.`;

const DYSTROPHY = `Duchenne muscular dystrophy (DMD) is a severe, progressive muscle-wasting disease that affects about 1 in every 3,500 to 5,000 boys. It is caused by mutations in the DMD gene on the X chromosome, which encodes dystrophin, a large protein that links the cytoskeleton of a muscle fiber to the matrix around it and protects the fiber from damage as it contracts. Mutations in the same gene also cause Becker muscular dystrophy, a milder disease whose symptoms begin later and progress more slowly.

The DMD gene is one of the largest known, with 79 exons, and most disease-causing mutations delete one or more whole exons. Whether a deletion causes Duchenne or Becker dystrophy is usually predicted by the reading-frame rule. If the total length of the deleted exons is a multiple of three nucleotides, the deletion is in frame: the mRNA after it is still read correctly, and a shortened but partly working dystrophin is made, giving Becker dystrophy. If not, the deletion shifts the reading frame, a premature stop codon soon follows, and little or no dystrophin is made, giving Duchenne dystrophy.

The rule has suggested a treatment. Exon-skipping drugs are short antisense oligonucleotides that bind to a chosen exon in the pre-mRNA and hide it from the splicing machinery, so that the exon is left out of the mature mRNA along with the introns. Skipping an exon next to a deletion can restore the reading frame, turning a Duchenne-type deletion into a Becker-type one. The first such drug to be approved skips exon 51.

Lengths of some exons of the DMD gene:

Exon 49: 102 nucleotides
Exon 50: 109 nucleotides
Exon 51: 233 nucleotides
Exon 52: 118 nucleotides`;

const WATER_TEST = `Antidiuretic hormone (ADH, also called vasopressin) controls how much water the kidneys return to the blood. It is made by neurons in the hypothalamus and released from their endings in the posterior pituitary when the osmolality of the plasma rises. In the collecting ducts of the kidney, ADH binds V2 receptors, which raises cAMP and causes vesicles carrying aquaporin-2 water channels to fuse with the membrane facing the urine. Water then moves out of the duct into the concentrated tissue around it, and a small volume of concentrated urine is produced.

In diabetes insipidus, the kidneys produce large volumes of dilute urine. In the central form, too little ADH is released; in the nephrogenic form, ADH is released but the kidney does not respond to it. The two are told apart with a water deprivation test. The patient stops drinking for several hours while the osmolality of the urine is followed; then desmopressin, a synthetic hormone that acts on V2 receptors like ADH, is given, and the urine is measured again.

Three patients were tested. Their urine osmolality, in mOsm/kg, at the end of water deprivation and one hour after desmopressin was:

Patient A: 750, then 780
Patient B: 150, then 600
Patient C: 160, then 180`;

export const MCAT_BB_PASSAGE_QUESTIONS = [
  ...set('p1', INHIBITOR, [
    [1, '1D', 'Easy', 'What is the Km of the enzyme when no inhibitor is present?',
      ['0.5 mM', '1.0 mM', '2.0 mM', '4.0 mM'], 'C',
      'Km is the substrate concentration at which the rate is half of Vmax. Without I, v reaches 50.0 μmol/min, half of 100, at [S] = 2.0 mM. With I, half of Vmax is reached only at 4.0 mM, which is the apparent Km.'],
    [2, '1D', 'Medium', 'What kind of inhibitor is compound I?',
      ['Competitive', 'Noncompetitive', 'Uncompetitive', 'Irreversible'], 'A',
      'I raises the apparent Km from 2.0 to 4.0 mM but leaves Vmax at 100 μmol/min, and enough substrate overcomes it entirely: the signature of competitive inhibition. A noncompetitive inhibitor would lower Vmax, an uncompetitive one would lower both Vmax and Km, and an irreversible one would not be outcompeted by substrate.'],
    [3, '1A', 'Easy', 'Based on the results, compound I most likely:',
      ['binds only to the enzyme–substrate complex', 'binds an allosteric site and slows the enzyme’s turnover',
        'denatures the enzyme permanently', 'binds the active site, competing with the substrate'], 'D',
      'Because high substrate concentrations overcome I completely, I and S must compete for the same site: I most likely resembles the substrate and occupies the active site. Binding only the enzyme–substrate complex, or slowing turnover from an allosteric site, would lower Vmax, and permanent denaturation could not be reversed by adding substrate.'],
    [4, '1D', 'Hard', 'What is the Ki of compound I?',
      ['1.0 μM', '2.5 μM', '5.0 μM', '10 μM'], 'C',
      'The apparent Km with 5.0 μM I is 4.0 mM, so 4.0 = 2.0 × (1 + 5.0 / Ki). Then 1 + 5.0 / Ki = 2, and Ki = 5.0 μM. At an inhibitor concentration equal to Ki, the apparent Km always doubles.'],
  ]),

  ...set('p2', DYSTROPHY, [
    [1, '1C', 'Easy', 'A woman who carries a DMD mutation on one of her X chromosomes has a son with a man who does not have the disease. What is the probability that the son has DMD?',
      ['0', '1/4', '1/2', '1'], 'C',
      'A son inherits one of his mother’s two X chromosomes, each with probability 1/2, and his Y chromosome from his father. So he has a 1/2 chance of receiving the X with the mutation, and a boy with it has the disease. The 1/4 figure is the chance that a child of unknown sex is an affected son.'],
    [2, '1B', 'Medium', 'A patient’s only mutation is a deletion of exon 52. Which form of the disease does the reading-frame rule predict?',
      ['Duchenne, because 118 is not a multiple of three', 'Becker, because only one exon is missing',
        'Becker, because an even number of nucleotides is removed', 'Neither, because removing a whole exon leaves the frame intact'], 'A',
      'Exon 52 is 118 nucleotides long, and 118 ÷ 3 leaves a remainder of 1, so its loss shifts the reading frame, leading to a premature stop codon and Duchenne dystrophy. What matters is whether the length is a multiple of three, not the number of exons lost or whether the length is even; removing a whole exon keeps the frame only when the exon’s length is a multiple of three.'],
    [3, '1B', 'Medium', 'Exon-skipping drugs act at which step in the expression of the DMD gene?',
      ['Replication of the DNA', 'Transcription of the gene', 'Translation of the mRNA', 'Splicing of the pre-mRNA'], 'D',
      'The drugs bind the pre-mRNA and hide an exon from the splicing machinery, so that the exon is removed along with the introns. The DNA and its transcription are unchanged, and the mature mRNA is translated normally, just without that exon.'],
    [4, '1B', 'Hard', 'A patient’s deletion removes exon 50 alone. Skipping which neighboring exon would be expected to restore the reading frame?',
      ['Exon 49', 'Exon 51', 'Exon 52', 'None; a shifted frame cannot be restored this way'], 'B',
      'Exon 50 is 109 nucleotides long, which leaves a remainder of 1 when divided by 3. Skipping exon 51 removes another 233 nucleotides, for 342 in all, which is 3 × 114, so the frame is restored. Skipping exon 49 would remove 211 nucleotides, not a multiple of three, and exon 52 is not next to the deletion. This is why the first approved exon-skipping drug targets exon 51.'],
  ]),

  ...set('p3', WATER_TEST, [
    [1, '3A', 'Easy', 'According to the passage, where is ADH made, and where is it released?',
      ['Made in the hypothalamus; released from the posterior pituitary', 'Made in the anterior pituitary; released from the anterior pituitary',
        'Made in the kidney; released into the collecting ducts', 'Made in the adrenal cortex; released into the blood'], 'A',
      'ADH is made by neurons whose cell bodies lie in the hypothalamus and released from their axon endings in the posterior pituitary. The anterior pituitary makes its own hormones, such as ACTH and TSH, under hypothalamic control.'],
    [2, '3B', 'Medium', 'Which patient most likely has central diabetes insipidus?',
      ['Patient A', 'Patient B', 'Patient C', 'None of the three'], 'B',
      'Patient B cannot concentrate urine during water deprivation (150 mOsm/kg) but responds strongly to desmopressin (600 mOsm/kg), so the kidney works and the hormone is missing. Patient A concentrates urine normally, and Patient C barely responds to desmopressin, which points to the nephrogenic form.'],
    [3, '3B', 'Hard', 'Which of the following best explains Patient C’s results?',
      ['A pituitary that cannot release ADH', 'Collecting-duct cells that do not respond to ADH, such as through a faulty V2 receptor',
        'A normal response to going without water', 'A dose of desmopressin that was too small to act'], 'B',
      'Patient C’s urine stays dilute both during deprivation and after desmopressin, so the kidney is not responding to the hormone: the nephrogenic form, which can be caused by a faulty V2 receptor or aquaporin-2. A pituitary problem would be corrected by desmopressin, as in Patient B, and a normal response looks like Patient A’s.'],
    [4, '3A', 'Hard', 'At the end of water deprivation, how would Patient B’s plasma osmolality and plasma ADH most likely compare with Patient A’s?',
      ['Lower plasma osmolality and lower ADH', 'The same plasma osmolality and the same ADH',
        'Higher plasma osmolality and higher ADH', 'Higher plasma osmolality and lower ADH'], 'D',
      'Patient B keeps losing dilute urine while not drinking, so the plasma becomes more concentrated than Patient A’s; and in central diabetes insipidus the pituitary releases too little ADH despite that stimulus. Higher osmolality with higher ADH is what Patient C, with the nephrogenic form, would show.'],
  ]),
];
