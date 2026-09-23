// The original questions, gathered into one list: 400 for the SAT and, so far, 60 for the MCAT.
//
// These are written for this app rather than taken from the College Board bank, so unlike the PDF exports in
// exports/ they live in the repo and reach everyone who opens the site. Without them a visitor who has not
// exported anything sees only a handful of demo questions.
//
// Every answer here is checked by tests/questions.test.js, which re-solves each mathematical answer from the
// wording of its problem rather than trusting the recorded key, and holds the reading questions to properties
// a fair question must have.

import { ALGEBRA_QUESTIONS } from './algebra.js';
import { ADVANCED_MATH_QUESTIONS } from './advanced-math.js';
import { PROBLEM_SOLVING_QUESTIONS } from './problem-solving.js';
import { GEOMETRY_QUESTIONS } from './geometry.js';
import { INFORMATION_AND_IDEAS_QUESTIONS } from './information-and-ideas.js';
import { CRAFT_AND_STRUCTURE_QUESTIONS } from './craft-and-structure.js';
import { EXPRESSION_OF_IDEAS_QUESTIONS } from './expression-of-ideas.js';
import { STANDARD_ENGLISH_QUESTIONS } from './standard-english.js';
import { MCAT_CP_QUESTIONS } from './mcat-cp.js';

export const ORIGINAL_QUESTIONS = [
  ...ALGEBRA_QUESTIONS,
  ...ADVANCED_MATH_QUESTIONS,
  ...PROBLEM_SOLVING_QUESTIONS,
  ...GEOMETRY_QUESTIONS,
  ...INFORMATION_AND_IDEAS_QUESTIONS,
  ...CRAFT_AND_STRUCTURE_QUESTIONS,
  ...EXPRESSION_OF_IDEAS_QUESTIONS,
  ...STANDARD_ENGLISH_QUESTIONS,
  ...MCAT_CP_QUESTIONS,
];
