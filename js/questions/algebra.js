// 50 original Algebra questions, written for this app. These are not College Board content, so unlike the
// PDF exports they can live in the repo and ship to everyone who opens the site.
//
// They follow College Board's Algebra skills (see js/taxonomy.js) and the same shape as every other question
// in the app: either four choices with one correct letter, or a student-produced response whose `answer` is a
// list of accepted spellings of the same value.
//
// Every answer here is checked independently in tests/questions.test.js, which re-solves each problem from its
// own statement rather than trusting the letter recorded below.

const DOMAIN = 'Algebra';

const mc = (id, skill, difficulty, stem, choices, answer, rationale) => ({
  id: `og-${id}`, section: 'MATH', domain: DOMAIN, skill, difficulty, stem,
  choices: choices.map((text, i) => ({ letter: 'ABCD'[i], text })),
  answer, rationale, source: 'original',
});

const spr = (id, skill, difficulty, stem, answer, rationale) => ({
  id: `og-${id}`, section: 'MATH', domain: DOMAIN, skill, difficulty, stem,
  choices: null, answer, rationale, source: 'original',
});

const ONE = 'Linear equations in one variable';
const FUN = 'Linear functions';
const TWO = 'Linear equations in two variables';
const SYS = 'Systems of two linear equations in two variables';
const INQ = 'Linear inequalities in one or two variables';

export const ALGEBRA_QUESTIONS = [
  // ---- Linear equations in one variable ----
  mc('alg-01', ONE, 'Easy', 'If 3x + 7 = 22, what is the value of x?', ['3', '5', '7', '15'], 'B',
    'Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5. Choice D is the value of 3x, not x.'),
  mc('alg-02', ONE, 'Easy', 'If 5x − 12 = 3x + 8, what is the value of x?', ['4', '6', '10', '14'], 'C',
    'Subtract 3x from both sides to get 2x − 12 = 8, add 12 to get 2x = 20, so x = 10.'),
  mc('alg-03', ONE, 'Medium', 'If 4(x − 3) = 2x + 6, what is the value of x?', ['3', '6', '9', '12'], 'C',
    'Distribute to get 4x − 12 = 2x + 6. Subtract 2x and add 12: 2x = 18, so x = 9. Choice B comes from forgetting to distribute the 4 across the −3.'),
  spr('alg-04', ONE, 'Medium', 'If x/3 + 4 = 10, what is the value of x?', ['18'],
    'Subtract 4 from both sides to get x/3 = 6, then multiply both sides by 3 to get x = 18.'),
  mc('alg-05', ONE, 'Medium', 'If 2(3x + 1) − 4 = 5x + 9, what is the value of x?', ['7', '9', '11', '13'], 'C',
    'The left side becomes 6x + 2 − 4 = 6x − 2. Then 6x − 2 = 5x + 9, so subtracting 5x and adding 2 gives x = 11.'),
  mc('alg-06', ONE, 'Hard', 'If 7 − 2(x − 5) = 3x + 2, what is the value of x?', ['1', '3', '5', '7'], 'B',
    'Distributing the −2 gives 7 − 2x + 10 = 17 − 2x. Setting 17 − 2x = 3x + 2 gives 15 = 5x, so x = 3. A common error is writing 7 − 2x − 10, which drops the sign of the −5.'),
  spr('alg-07', ONE, 'Easy', 'If 9x = 63, what is the value of x?', ['7'],
    'Divide both sides by 9 to get x = 7.'),
  mc('alg-08', ONE, 'Medium', 'The equation 5(x + 2) = 5x + c has infinitely many solutions. What is the value of c?',
    ['0', '2', '5', '10'], 'D',
    'The left side expands to 5x + 10. Two sides that are identical for every x must match term for term, so c = 10.'),
  mc('alg-09', ONE, 'Hard', 'For what value of k does the equation 3(2x − 4) = 6x + k have infinitely many solutions?',
    ['−12', '−4', '4', '12'], 'A',
    'The left side expands to 6x − 12. For the equation to hold for every x, the constant terms must match, so k = −12. Any other value leaves 6x − 12 = 6x + k with no solution at all.'),
  spr('alg-10', ONE, 'Hard', 'If (2x + 5)/3 = (x + 9)/2, what is the value of x?', ['17'],
    'Multiply both sides by 6: 2(2x + 5) = 3(x + 9), so 4x + 10 = 3x + 27, giving x = 17.'),

  // ---- Linear functions ----
  mc('alg-11', FUN, 'Easy', 'The function f is defined by f(x) = 2x + 5. What is the value of f(4)?',
    ['9', '11', '13', '21'], 'C',
    'Substitute 4 for x: f(4) = 2(4) + 5 = 8 + 5 = 13.'),
  mc('alg-12', FUN, 'Easy', 'What is the slope of the line that passes through the points (1, 3) and (5, 11)?',
    ['1/2', '2', '4', '8'], 'B',
    'Slope is the change in y over the change in x: (11 − 3)/(5 − 1) = 8/4 = 2. Choice D uses only the change in y.'),
  mc('alg-13', FUN, 'Medium', 'The function f is defined by f(x) = 3x − 7. If f(a) = 8, what is the value of a?',
    ['1', '5', '15', '17'], 'B',
    'Set 3a − 7 = 8, so 3a = 15 and a = 5. Choice C is the value of 3a.'),
  mc('alg-14', FUN, 'Medium', 'A linear function f satisfies f(0) = 4 and f(3) = 13. What is the value of f(5)?',
    ['16', '19', '22', '25'], 'B',
    'The slope is (13 − 4)/(3 − 0) = 3, and f(0) = 4 is the y-intercept, so f(x) = 3x + 4. Then f(5) = 15 + 4 = 19.'),
  spr('alg-15', FUN, 'Medium', 'A line has slope −2 and passes through the point (3, 1). What is the y-coordinate of its y-intercept?', ['7'],
    'Write y = −2x + b and substitute the point: 1 = −2(3) + b = −6 + b, so b = 7.'),
  mc('alg-16', FUN, 'Easy', 'Which equation represents a line with slope 5 and y-intercept −2?',
    ['y = 5x − 2', 'y = −2x + 5', 'y = 2x − 5', 'y = 5x + 2'], 'A',
    'In the form y = mx + b, m is the slope and b is the y-intercept, so m = 5 and b = −2 gives y = 5x − 2. Choice B swaps the two.'),
  mc('alg-17', FUN, 'Medium', 'The function f is defined by f(x) = mx + b. If f(2) = 9 and f(6) = 21, what is the value of m + b?',
    ['3', '6', '9', '12'], 'B',
    'The slope is (21 − 9)/(6 − 2) = 3, so m = 3. Then 9 = 3(2) + b gives b = 3, and m + b = 6.'),
  mc('alg-18', FUN, 'Hard', 'The function g is linear, with g(1) = −2 and g(4) = 7. What is the value of g(10)?',
    ['16', '19', '22', '25'], 'D',
    'The slope is (7 − (−2))/(4 − 1) = 9/3 = 3. Using g(1) = −2: −2 = 3(1) + b, so b = −5 and g(x) = 3x − 5. Then g(10) = 30 − 5 = 25.'),
  mc('alg-19', FUN, 'Medium', 'A gym charges a $30 joining fee plus $15 for each month of membership. What is the total cost, in dollars, of joining and holding the membership for 8 months?',
    ['120', '135', '150', '165'], 'C',
    'The total is 15m + 30 with m = 8, which is 120 + 30 = 150. Choice A forgets the joining fee.'),
  spr('alg-20', FUN, 'Hard', 'A line passes through the points (−2, 5) and (4, −7). What is the value of y when x = 1?', ['-1', '−1'],
    'The slope is (−7 − 5)/(4 − (−2)) = −12/6 = −2. Using the point (−2, 5): y − 5 = −2(x + 2), so y = −2x + 1. At x = 1, y = −1.'),

  // ---- Linear equations in two variables ----
  mc('alg-21', TWO, 'Easy', 'The point (3, k) lies on the line y = 4x − 5. What is the value of k?',
    ['2', '7', '12', '17'], 'B',
    'Substitute x = 3: k = 4(3) − 5 = 12 − 5 = 7. Choice C is 4(3) without subtracting 5.'),
  mc('alg-22', TWO, 'Easy', 'What is the x-coordinate of the x-intercept of the line 2x + 3y = 12?',
    ['3', '4', '6', '12'], 'C',
    'At an x-intercept, y = 0, so 2x = 12 and x = 6. Choice B is the y-intercept, found by setting x = 0.'),
  mc('alg-23', TWO, 'Medium', 'Which equation is equivalent to 3x − 2y = 12?',
    ['y = (3/2)x − 6', 'y = (3/2)x + 6', 'y = (2/3)x − 6', 'y = −(3/2)x + 6'], 'A',
    'Subtract 3x to get −2y = −3x + 12, then divide by −2, which flips both signs: y = (3/2)x − 6.'),
  spr('alg-24', TWO, 'Medium', 'If 5x + 2y = 20 and x = 2, what is the value of y?', ['5'],
    'Substitute x = 2: 10 + 2y = 20, so 2y = 10 and y = 5.'),
  mc('alg-25', TWO, 'Medium', 'A line has slope 2 and passes through the point (0, −3). Which point also lies on this line?',
    ['(1, 1)', '(2, 0)', '(3, 4)', '(4, 5)'], 'D',
    'The line is y = 2x − 3. Testing (4, 5): 2(4) − 3 = 5, which matches. None of the other points satisfy the equation.'),
  mc('alg-26', TWO, 'Hard', 'The line 4x + ky = 10 passes through the point (2, 1). What is the value of k?',
    ['1', '2', '4', '8'], 'B',
    'Substitute the point: 4(2) + k(1) = 10, so 8 + k = 10 and k = 2.'),
  mc('alg-27', TWO, 'Medium', 'What is the y-coordinate of the y-intercept of the line through (2, 7) and (5, 16)?',
    ['0', '1', '2', '3'], 'B',
    'The slope is (16 − 7)/(5 − 2) = 3. Using y = 3x + b with the point (2, 7): 7 = 6 + b, so b = 1.'),
  spr('alg-28', TWO, 'Easy', 'If 2x + y = 11 and x = 4, what is the value of y?', ['3'],
    'Substitute x = 4: 8 + y = 11, so y = 3.'),
  mc('alg-29', TWO, 'Hard', 'A line is parallel to y = −3x + 4 and passes through the point (1, 2). What is the y-coordinate of its y-intercept?',
    ['2', '3', '5', '7'], 'C',
    'Parallel lines have equal slopes, so this line is y = −3x + b. Substituting (1, 2): 2 = −3 + b, so b = 5.'),
  spr('alg-30', TWO, 'Hard', 'What is the slope of the line 6x − 2y = 18?', ['3'],
    'Solve for y: −2y = −6x + 18, so y = 3x − 9. The coefficient of x is the slope, 3.'),

  // ---- Systems of two linear equations in two variables ----
  mc('alg-31', SYS, 'Easy', 'If x + y = 10 and x − y = 2, what is the value of x?',
    ['4', '5', '6', '8'], 'C',
    'Adding the two equations eliminates y: 2x = 12, so x = 6. Choice A is the value of y.'),
  spr('alg-32', SYS, 'Medium', 'If 2x + y = 13 and y = x + 1, what is the value of xy?', ['20'],
    'Substituting gives 2x + (x + 1) = 13, so 3x = 12 and x = 4. Then y = 5, and xy = 20.'),
  mc('alg-33', SYS, 'Medium', 'If 3x + 2y = 16 and x = 2, what is the value of y?',
    ['2', '3', '4', '5'], 'D',
    'Substitute x = 2: 6 + 2y = 16, so 2y = 10 and y = 5.'),
  mc('alg-34', SYS, 'Medium', 'If x + 2y = 8 and 3x − 2y = 4, what is the value of x?',
    ['2', '3', '4', '5'], 'B',
    'Adding the equations eliminates y: 4x = 12, so x = 3.'),
  mc('alg-35', SYS, 'Hard', 'If 3x + y = 14 and 2x − y = 6, what is the value of x + y?',
    ['4', '5', '6', '7'], 'C',
    'Adding eliminates y: 5x = 20, so x = 4. Then y = 14 − 12 = 2, and x + y = 6.'),
  spr('alg-36', SYS, 'Medium', 'If 5x − 2y = 4 and y = 2x, what is the value of y?', ['8'],
    'Substituting gives 5x − 4x = 4, so x = 4. Then y = 2(4) = 8.'),
  mc('alg-37', SYS, 'Hard', 'For what value of k does the system 2x + 3y = 7 and 4x + 6y = k have infinitely many solutions?',
    ['7', '10', '14', '21'], 'C',
    'The second equation must be the first multiplied by 2, since 4x + 6y is exactly 2(2x + 3y). That requires k = 2(7) = 14.'),
  mc('alg-38', SYS, 'Medium', 'A shop sells pens for $2 each and notebooks for $5 each. A customer buys 12 items in total and pays $39. How many notebooks did the customer buy?',
    ['3', '4', '5', '7'], 'C',
    'If n is the number of notebooks, there are 12 − n pens, so 2(12 − n) + 5n = 39. That gives 24 + 3n = 39, so n = 5. Choice D is the number of pens.'),
  spr('alg-39', SYS, 'Hard', 'If 3x + 4y = 10 and 5x − 4y = 6, what is the value of x + y?', ['3'],
    'Adding eliminates y: 8x = 16, so x = 2. Then 6 + 4y = 10 gives y = 1, and x + y = 3.'),
  mc('alg-40', SYS, 'Medium', 'What is the solution (x, y) to the system y = 2x − 1 and y = −x + 8?',
    ['(3, 5)', '(2, 3)', '(4, 4)', '(5, 3)'], 'A',
    'Set the right sides equal: 2x − 1 = −x + 8, so 3x = 9 and x = 3. Then y = 2(3) − 1 = 5.'),

  // ---- Linear inequalities in one or two variables ----
  mc('alg-41', INQ, 'Easy', 'Which value of x satisfies the inequality 3x − 5 > 7?',
    ['2', '3', '4', '6'], 'D',
    'Add 5 to get 3x > 12, so x > 4. Only 6 is greater than 4. Choice C gives 7 > 7, which is false for a strict inequality.'),
  mc('alg-42', INQ, 'Easy', 'What is the greatest integer value of x that satisfies x + 4 ≤ 9?',
    ['4', '5', '6', '9'], 'B',
    'Subtract 4 to get x ≤ 5, so the greatest integer allowed is 5 itself, since the inequality is not strict.'),
  mc('alg-43', INQ, 'Medium', 'Which inequality is equivalent to −2x > 8?',
    ['x < −4', 'x > −4', 'x > 4', 'x < 4'], 'A',
    'Divide both sides by −2. Dividing by a negative number reverses the direction of the inequality, giving x < −4.'),
  spr('alg-44', INQ, 'Medium', 'What is the greatest integer value of x that satisfies 5x + 3 ≤ 28?', ['5'],
    'Subtract 3 to get 5x ≤ 25, so x ≤ 5 and the greatest integer value is 5.'),
  mc('alg-45', INQ, 'Medium', 'A fair charges $8 for entry plus $3.50 for each ride. If a student has $50, what is the greatest number of rides the student can take?',
    ['10', '11', '12', '14'], 'C',
    'Solve 8 + 3.5r ≤ 50, so 3.5r ≤ 42 and r ≤ 12. Since 12 rides cost exactly $42 on top of the $8 entry, 12 is affordable.'),
  mc('alg-46', INQ, 'Hard', 'Which inequality is equivalent to 4 − 3x ≥ 19?',
    ['x ≥ −5', 'x ≤ −5', 'x ≥ 5', 'x ≤ 5'], 'B',
    'Subtract 4 to get −3x ≥ 15, then divide by −3, which reverses the inequality: x ≤ −5.'),
  mc('alg-47', INQ, 'Medium', 'Which point satisfies the inequality y > 2x + 1?',
    ['(0, 3)', '(−1, −2)', '(1, 2)', '(2, 4)'], 'A',
    'At (0, 3) the inequality reads 3 > 1, which is true. At (1, 2) it reads 2 > 3 and at (2, 4) it reads 4 > 5, both false.'),
  spr('alg-48', INQ, 'Hard', 'What is the greatest integer value of x that satisfies 2(x − 3) < x + 4?', ['9'],
    'Distribute to get 2x − 6 < x + 4, then subtract x and add 6 to get x < 10. Because the inequality is strict, the greatest integer value is 9.'),
  mc('alg-49', INQ, 'Medium', 'A van weighs 3,200 pounds when empty and carries boxes weighing 40 pounds each. A bridge allows a maximum total weight of 5,000 pounds. What is the greatest number of boxes the van can carry across the bridge?',
    ['40', '42', '45', '50'], 'C',
    'Solve 3,200 + 40b ≤ 5,000, so 40b ≤ 1,800 and b ≤ 45.'),
  mc('alg-50', INQ, 'Hard', 'Which value of x satisfies −1 ≤ 2x + 3 ≤ 9?',
    ['−3', '−2', '4', '5'], 'B',
    'Subtract 3 from all three parts to get −4 ≤ 2x ≤ 6, then divide by 2 to get −2 ≤ x ≤ 3. Only −2 lies in that range.'),
];
