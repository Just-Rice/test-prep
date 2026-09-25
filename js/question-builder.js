// Turns what the readers find on a page into the questions the app practices with.
//
// The same questions are built in two places — by scripts/build-questions.js, from PDFs the owner keeps in
// exports/, and in the browser by js/import-pdf.js, from a PDF a student picks themselves — and they have to
// come out identical, or a question would behave differently depending on where it was read. Only the drawing
// differs: `picture(spans, name)` cuts a piece out of the PDF and gives back something the app can show. In
// Node that is a file under data/img; in the browser it is a picture kept on the device. Everything else,
// including every id, is decided here.

// ACT booklets have no per-question id of their own, so one is made from the booklet's name and the question's
// own number, which is what the booklet's scoring key indexes it by.
export const slug = name => name.replace(/\.pdf$/i, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40);

// One question from a College Board Question Bank export.
export async function questionFromExport(parsed, picture) {
  const name = part => `${parsed.cbId}-${part}`;
  const q = {
    id: `cb-${parsed.cbId}`, cbId: parsed.cbId, source: 'cb-export', assessment: parsed.assessment,
    section: parsed.section, domain: parsed.domain, skill: parsed.skill, difficulty: parsed.difficulty, answer: parsed.answer,
  };
  if (parsed.prompt.needsImage) q.promptImage = await picture(parsed.prompt.spans, name('prompt'));
  else Object.assign(q, { passage: parsed.prompt.passage, stem: parsed.prompt.stem });

  q.choices = null;
  if (parsed.choices) {
    q.choices = [];
    for (const choice of parsed.choices) {
      q.choices.push(choice.needsImage
        ? { letter: choice.letter, image: await picture(choice.spans, name(`choice-${choice.letter}`)) }
        : { letter: choice.letter, text: choice.text });
    }
  }
  if (parsed.answer === null) q.answerImage = await picture(parsed.answerRegion.spans, name('answer'));
  if (parsed.rationale) {
    if (parsed.rationale.needsImage) q.rationaleImage = await picture(parsed.rationale.spans, name('rationale'));
    else q.rationale = parsed.rationale.text;
  }
  q.original = await picture(parsed.original.spans, name('original'));
  return q;
}

// One question from an ACT practice test booklet. `shared` carries pictures more than one question uses, so
// a science passage is cut out once however many questions ask about it.
export async function questionFromBooklet(parsed, picture, source, shared) {
  const base = `act-${slug(source)}-${parsed.section.toLowerCase()}-${parsed.number}`;
  const q = {
    id: base, source: 'act-export', actNumber: parsed.number,
    section: parsed.section, domain: parsed.domain, skill: parsed.skill, answer: parsed.answer,
    // ACT does not publish a difficulty for individual questions, and the booklets do not imply one, so every
    // question sits at the middle of the scale rather than at an invented one.
    difficulty: 'Medium',
  };
  if (parsed.passage?.text) q.passage = parsed.passage.text;
  if (parsed.passage?.underline) q.underline = parsed.passage.underline;
  if (parsed.passage?.spans) {
    const name = `act-${slug(source)}-${parsed.section.toLowerCase()}-passage-${parsed.passage.id}`;
    if (!shared.has(name)) shared.set(name, await picture(parsed.passage.spans, name));
    q.passageImage = shared.get(name);
  }
  if (parsed.stem.needsImage) q.promptImage = await picture(parsed.stem.spans, `${base}-prompt`);
  else q.stem = parsed.stem.paragraphs.join('\n\n');

  q.choices = [];
  for (const choice of parsed.choices) {
    q.choices.push(choice.needsImage
      ? { letter: choice.letter, image: await picture(choice.spans, `${base}-choice-${choice.letter}`) }
      : { letter: choice.letter, text: choice.paragraphs.join(' ') });
  }
  q.original = await picture(parsed.original.spans, `${base}-original`);
  return q;
}
