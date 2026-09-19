// 50 original Problem-Solving and Data Analysis questions, written for this app rather than taken from the
// College Board bank, so they can ship in the repo and reach every visitor.
//
// This domain has seven skills, so the split is 8/8/7/7/7/7/6. Several of these skills are normally asked
// against a chart or table. Since the app cannot draw one here, the data is described precisely in words
// instead, which keeps the reasoning identical.
//
// Every numerical answer is re-derived from the problem statement in tests/questions.test.js.

const DOMAIN = 'Problem-Solving and Data Analysis';

const mc = (id, skill, difficulty, stem, choices, answer, rationale) => ({
  id: `og-${id}`, section: 'MATH', domain: DOMAIN, skill, difficulty, stem,
  choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
});

const spr = (id, skill, difficulty, stem, answer, rationale) => ({
  id: `og-${id}`, section: 'MATH', domain: DOMAIN, skill, difficulty, stem,
  choices: null, answer, rationale, source: 'original',
});

const RAT = 'Ratios, rates, proportional relationships, and units';
const PCT = 'Percentages';
const ONE = 'One-variable data: Distributions and measures of center and spread';
const TWO = 'Two-variable data: Models and scatterplots';
const PRB = 'Probability and conditional probability';
const INF = 'Inference from sample statistics and margin of error';
const CLM = 'Evaluating statistical claims: Observational studies and experiments';

export const PROBLEM_SOLVING_QUESTIONS = [
  // ---- Ratios, rates, proportional relationships, and units ----
  mc('psda-01', RAT, 'Easy', 'A car travels 150 miles in 3 hours at a constant speed. At this speed, how many miles will it travel in 5 hours?',
    ['200', '225', '250', '300'], 'C',
    'The speed is 150 ÷ 3 = 50 miles per hour, so in 5 hours the car travels 50 × 5 = 250 miles.'),
  spr('psda-02', RAT, 'Easy', 'Two quantities are in the ratio 3 to 5. If the smaller quantity is 12, what is the larger quantity?', ['20'],
    'Each part is worth 12 ÷ 3 = 4, so the larger quantity is 5 × 4 = 20.'),
  mc('psda-03', RAT, 'Medium', 'A recipe uses 2 cups of flour to make 18 cookies. How many cups of flour are needed to make 45 cookies?',
    ['4', '4.5', '5', '6'], 'C',
    'Each cookie needs 2 ÷ 18 = 1/9 cup, so 45 cookies need 45 ÷ 9 = 5 cups.'),
  mc('psda-04', RAT, 'Medium', 'A car travels at 60 miles per hour. What is this speed in feet per second? (1 mile = 5,280 feet)',
    ['44', '60', '88', '176'], 'C',
    'Multiply by 5,280 feet per mile and divide by 3,600 seconds per hour: 60 × 5,280 ÷ 3,600 = 88 feet per second.'),
  spr('psda-05', RAT, 'Medium', 'On a map, 1 inch represents 25 miles. How many miles does 3.5 inches represent?', ['87.5'],
    'Multiply the number of inches by the miles each inch stands for: 3.5 × 25 = 87.5 miles.'),
  mc('psda-06', RAT, 'Hard', 'A machine fills 480 bottles in 8 minutes. At this rate, how many bottles does it fill in 45 minutes?',
    ['2,400', '2,700', '3,000', '3,600'], 'B',
    'The rate is 480 ÷ 8 = 60 bottles per minute, so in 45 minutes it fills 60 × 45 = 2,700 bottles.'),
  mc('psda-07', RAT, 'Medium', 'Working at the same steady rate, 5 workers build a wall in 12 days. How many days would 4 workers take to build the same wall?',
    ['9.6', '10', '15', '20'], 'C',
    'The job takes 5 × 12 = 60 worker-days. With 4 workers that is 60 ÷ 4 = 15 days. Fewer workers means more days, so choices A and B must be wrong.'),
  spr('psda-08', RAT, 'Hard', 'A drink is mixed with 3 parts water to 2 parts syrup. How many litres of syrup are in 45 litres of the drink?', ['18'],
    'The mixture has 3 + 2 = 5 parts in total, so syrup is 2/5 of it: 45 × 2/5 = 18 litres.'),

  // ---- Percentages ----
  mc('psda-09', PCT, 'Easy', 'What is 20% of 150?',
    ['15', '25', '30', '50'], 'C',
    '20% means 0.20, and 0.20 × 150 = 30.'),
  spr('psda-10', PCT, 'Easy', 'What percent of 50 is 15?', ['30'],
    'Divide the part by the whole and convert to a percent: 15 ÷ 50 = 0.3, which is 30%.'),
  mc('psda-11', PCT, 'Medium', 'A jacket costs $80. If the price is increased by 25%, what is the new price, in dollars?',
    ['85', '95', '100', '105'], 'C',
    'An increase of 25% multiplies the price by 1.25, and 80 × 1.25 = 100. Adding 25 dollars rather than 25 percent gives choice D.'),
  mc('psda-12', PCT, 'Medium', 'A bicycle priced at $120 is discounted by 20%. What is the sale price, in dollars?',
    ['96', '100', '102', '144'], 'A',
    'A 20% discount leaves 80% of the price: 120 × 0.80 = 96. Choice D adds 20% instead of subtracting it.'),
  spr('psda-13', PCT, 'Medium', 'After a 25% discount, a shirt costs $36. What was the original price, in dollars?', ['48'],
    'The sale price is 75% of the original, so the original is 36 ÷ 0.75 = 48 dollars.'),
  mc('psda-14', PCT, 'Hard', 'A population of 200 increases by 10% and then decreases by 10%. Compared with 200, what is the overall change?',
    ['Increase of 1%', 'No change', 'Decrease of 1%', 'Decrease of 10%'], 'C',
    'The population becomes 200 × 1.10 = 220, then 220 × 0.90 = 198. That is 2 fewer than 200, a decrease of 1%. The second percentage is taken from the larger number, so the two changes do not cancel.'),
  mc('psda-15', PCT, 'Medium', '45 is what percent of 180?',
    ['20%', '25%', '30%', '40%'], 'B',
    'Divide the part by the whole: 45 ÷ 180 = 0.25, which is 25%.'),
  spr('psda-16', PCT, 'Hard', 'After a 12% increase, a salary is $56,000. What was the salary before the increase, in dollars?', ['50000', '50,000'],
    'The new salary is 1.12 times the old one, so the old salary is 56,000 ÷ 1.12 = 50,000 dollars.'),

  // ---- One-variable data: distributions and measures of center and spread ----
  mc('psda-17', ONE, 'Easy', 'What is the mean of the data set 4, 8, 10, 14?',
    ['8', '9', '10', '12'], 'B',
    'The sum is 36 and there are 4 values, so the mean is 36 ÷ 4 = 9.'),
  spr('psda-18', ONE, 'Easy', 'What is the median of the data set 3, 7, 9, 12, 20?', ['9'],
    'The values are already in order and there are five of them, so the median is the third value, 9.'),
  mc('psda-19', ONE, 'Medium', 'What is the median of the data set 2, 5, 7, 10?',
    ['5', '6', '7', '8.5'], 'B',
    'With an even number of values the median is the mean of the two middle ones: (5 + 7) ÷ 2 = 6.'),
  mc('psda-20', ONE, 'Medium', 'For the data set 5, 5, 6, 9, 15, which measure is greatest?',
    ['Mean', 'Median', 'Mode', 'They are all equal'], 'A',
    'The mean is 40 ÷ 5 = 8, the median is 6 and the mode is 5, so the mean is greatest. The single large value of 15 pulls the mean above the middle of the data.'),
  spr('psda-21', ONE, 'Medium', 'What is the range of the data set 12, 4, 19, 7?', ['15'],
    'The range is the largest value minus the smallest: 19 − 4 = 15.'),
  mc('psda-22', ONE, 'Hard', 'A value far larger than every other value is added to a data set. Which is affected more?',
    ['The median', 'Both change by the same amount', 'Neither changes', 'The mean'], 'D',
    'The mean uses every value, so one extreme value shifts it a long way. The median only depends on position in the ordered list, so it moves very little if at all.'),
  mc('psda-23', ONE, 'Hard', 'Set A is 10, 10, 10, 10 and Set B is 4, 8, 12, 16. Both have a mean of 10. Which has the greater standard deviation?',
    ['Set A', 'Set B', 'They are equal', 'It cannot be determined'], 'B',
    'Standard deviation measures spread about the mean. Every value in Set A equals the mean, so its standard deviation is 0, while Set B is spread out and so has a larger one.'),

  // ---- Two-variable data: models and scatterplots ----
  mc('psda-24', TWO, 'Easy', 'The line of best fit for a set of data is y = 3x + 5. What value does the model predict for y when x = 4?',
    ['12', '15', '17', '20'], 'C',
    'Substitute x = 4: y = 3(4) + 5 = 12 + 5 = 17.'),
  mc('psda-25', TWO, 'Medium', 'A model is given by y = −2x + 30. What does the slope indicate?',
    ['y increases by 2 for each increase of 1 in x', 'y decreases by 2 for each increase of 1 in x', 'y is 30 when x is 0', 'y decreases by 30 for each increase of 1 in x'], 'B',
    'The slope is the change in y for a one-unit increase in x. Here it is −2, so y falls by 2. Choice C describes the y-intercept, which is true of the model but is not what the slope tells you.'),
  spr('psda-26', TWO, 'Medium', 'The line of best fit for a data set is y = 1.5x + 2. What value does the model predict for y when x = 10?', ['17'],
    'Substitute x = 10: y = 1.5(10) + 2 = 15 + 2 = 17.'),
  mc('psda-27', TWO, 'Medium', 'In a scatterplot, the points tend to rise from left to right. How are the two variables associated?',
    ['Negatively', 'Not at all', 'Exponentially', 'Positively'], 'D',
    'Rising from left to right means larger values of one variable go with larger values of the other, which is a positive association.'),
  mc('psda-28', TWO, 'Hard', 'A model predicts y = 4x + 9. For a data point with x = 5, the actual value of y is 32. What is the residual for that point?',
    ['−3', '3', '29', '32'], 'B',
    'The model predicts 4(5) + 9 = 29. The residual is the actual value minus the predicted value: 32 − 29 = 3. A positive residual means the point lies above the line.'),
  mc('psda-29', TWO, 'Medium', 'The total cost of a repair is modelled by y = 0.5x + 12, where x is the number of minutes worked. What does the model predict the cost to be before any work is done?',
    ['0.5', '6', '12', '12.5'], 'C',
    'Before any work, x = 0, so y = 0.5(0) + 12 = 12. The y-intercept is the starting value, here a fixed call-out charge.'),
  spr('psda-30', TWO, 'Hard', 'A line of best fit passes through the points (2, 11) and (6, 23). What is the slope of the line?', ['3'],
    'The slope is the change in y over the change in x: (23 − 11)/(6 − 2) = 12/4 = 3.'),

  // ---- Probability and conditional probability ----
  mc('psda-31', PRB, 'Easy', 'A bag holds 3 red marbles and 5 blue marbles. If one marble is chosen at random, what is the probability that it is red?',
    ['3/8', '3/5', '5/8', '1/3'], 'A',
    'There are 3 + 5 = 8 marbles in total and 3 of them are red, so the probability is 3/8. Choice B compares red with blue rather than with the total.'),
  spr('psda-32', PRB, 'Easy', 'A fair six-sided die is rolled once. What is the probability of rolling an even number?', ['1/2', '0.5', '.5'],
    'Three of the six faces are even (2, 4 and 6), so the probability is 3/6 = 1/2.'),
  mc('psda-33', PRB, 'Medium', 'In a class of 20 students, 12 play a sport. If one student is chosen at random, what is the probability that the student does not play a sport?',
    ['2/5', '3/5', '1/4', '8/12'], 'A',
    'The number who do not play is 20 − 12 = 8, so the probability is 8/20 = 2/5. Choice B is the probability that the student does play.'),
  mc('psda-34', PRB, 'Medium', 'Of 50 people surveyed, 30 like tea, and 18 of those 30 also like coffee. If a person who likes tea is chosen at random, what is the probability that the person also likes coffee?',
    ['3/5', '18/50', '30/50', '12/30'], 'A',
    'A conditional probability uses only the group being conditioned on. Among the 30 tea drinkers, 18 like coffee, so the probability is 18/30 = 3/5. Choice B wrongly uses all 50 people as the denominator.'),
  mc('psda-35', PRB, 'Hard', 'A fair coin is flipped twice. What is the probability that both flips land heads?',
    ['1/8', '1/4', '1/2', '3/4'], 'B',
    'The flips are independent, so multiply the probabilities: 1/2 × 1/2 = 1/4. Equivalently, of the four equally likely outcomes only one is two heads.'),
  spr('psda-36', PRB, 'Medium', 'A jar holds 25 marbles, 10 of which are green. If one marble is chosen at random, what is the probability that it is not green?', ['3/5', '0.6', '.6'],
    'The number that are not green is 25 − 10 = 15, so the probability is 15/25 = 3/5.'),
  mc('psda-37', PRB, 'Hard', 'In a class of 40 students there are 24 girls and 16 boys. Of these, 18 girls and 10 boys passed a test. If a boy is chosen at random, what is the probability that he passed?',
    ['5/8', '10/40', '16/40', '28/40'], 'A',
    'Only the 16 boys matter, and 10 of them passed, so the probability is 10/16 = 5/8. Choice B uses the whole class as the denominator instead of just the boys.'),

  // ---- Inference from sample statistics and margin of error ----
  mc('psda-38', INF, 'Medium', 'A poll estimates that 62% of voters support a measure, with a margin of error of 3 percentage points. Which range is most plausible for the true percentage?',
    ['59% to 65%', '62% to 65%', '56% to 68%', '60% to 64%'], 'A',
    'The margin of error extends in both directions from the estimate: 62 − 3 = 59 and 62 + 3 = 65.'),
  mc('psda-39', INF, 'Medium', 'If everything else stays the same, what usually happens to the margin of error when the sample size is increased?',
    ['It increases', 'It stays the same', 'It doubles', 'It decreases'], 'D',
    'A larger sample gives a more precise estimate, so the margin of error shrinks.'),
  mc('psda-40', INF, 'Hard', 'A random sample of 200 residents of a town of 12,000 finds that 35% support a proposal. What is the best estimate of the number of residents in the whole town who support it?',
    ['70', '700', '4,200', '1,200'], 'C',
    'Apply the sample percentage to the whole population: 0.35 × 12,000 = 4,200. Choice A is 35% of the sample rather than of the town.'),
  mc('psda-41', INF, 'Medium', 'A principal wants to estimate how many hours students at the school study each week. Which sample best supports a conclusion about all students at the school?',
    ['Students in one honours class', 'Students who volunteered to answer online', 'A random sample of all students at the school', 'Students leaving a football game'], 'C',
    'Only a random sample of the whole population avoids favouring one kind of student, so only it supports a conclusion about every student at the school.'),
  spr('psda-42', INF, 'Hard', 'A poll reports that 48% of people agree, with a margin of error of 4 percentage points. What is the upper end of the plausible range, as a percent?', ['52'],
    'Add the margin of error to the estimate: 48 + 4 = 52 percent.'),
  mc('psda-43', INF, 'Medium', 'A survey reports a 95% confidence interval of 40% to 46% for the proportion of a population that agrees with a statement. Which conclusion is best supported?',
    ['Exactly 43% of the population agrees', 'It is plausible that the population value lies between 40% and 46%', '95% of those surveyed chose 43%', 'The sample size was 95'], 'B',
    'A confidence interval gives a range of plausible values for the population, not an exact figure and not a statement about how individuals answered.'),
  mc('psda-44', INF, 'Hard', 'If a survey doubles its sample size, what happens to the margin of error?',
    ['It is cut exactly in half', 'It decreases, but by less than half', 'It doubles', 'It does not change'], 'B',
    'The margin of error shrinks in proportion to the square root of the sample size, so doubling the sample multiplies it by about 1/√2, which is roughly 0.71. Cutting it in half would need four times the sample.'),

  // ---- Evaluating statistical claims: observational studies and experiments ----
  mc('psda-45', CLM, 'Medium', 'An observational study finds that people who drink more coffee sleep fewer hours. Can the study conclude that coffee causes less sleep?',
    ['Yes, because the sample was large', 'Yes, because the association was strong', 'No, because it was observational with no random assignment', 'No, because the sample was randomly selected'], 'C',
    'Without random assignment to groups, some other difference between coffee drinkers and non-drinkers could explain the gap. Observational studies can show association but not cause.'),
  mc('psda-46', CLM, 'Medium', 'Which study design allows a conclusion about cause and effect?',
    ['An observational study', 'A survey', 'A convenience sample', 'A randomized controlled experiment'], 'D',
    'Randomly assigning subjects to treatments balances other differences between the groups, so a difference in outcome can reasonably be attributed to the treatment.'),
  mc('psda-47', CLM, 'Hard', 'Subjects are randomly assigned to receive either a new drug or a placebo, and the drug group improves significantly more. Which conclusion is best supported?',
    ['The drug causes improvement in everyone', 'The drug causes improvement among subjects like those studied', 'The drug is associated with improvement, but cause cannot be inferred', 'Nothing can be concluded from the study'], 'B',
    'Random assignment supports a cause-and-effect conclusion, but only for the kind of people who took part. Generalising beyond them would need the subjects to have been randomly selected from a wider population.'),
  mc('psda-48', CLM, 'Medium', 'A website asks its own visitors to answer a survey about how much time people spend online. What is the main problem with this claim about the general public?',
    ['The sample is too large', 'The sample is not representative of the population', 'The margin of error is too small', 'It used random assignment'], 'B',
    'People who visit that website and choose to answer are likely to be unusually heavy internet users, so the sample does not reflect the general public no matter how many replies it collects.'),
  mc('psda-49', CLM, 'Hard', 'Which feature of a study is what allows its results to be generalized to a larger population?',
    ['Random assignment to groups', 'Neither random selection nor random assignment', 'Both, equally', 'Random selection of subjects'], 'D',
    'Random selection makes the sample resemble the population, which is what supports generalising. Random assignment is a different thing: it supports conclusions about cause and effect.'),
  mc('psda-50', CLM, 'Medium', 'A company claims its supplement causes weight loss, based on surveying people who chose to take it. What is the main flaw?',
    ['Too few variables were measured', 'Participants chose their own group, so the groups may differ in other ways', 'The survey was anonymous', 'The population studied was too small'], 'B',
    'When people choose whether to take the supplement, those who do may already differ in diet, exercise or motivation, and any of those could explain the weight loss instead.'),
];
