import type { Notebook } from './schema';

export const essentials: Notebook = {
  id: 'r-essentials',
  number: 0,
  title: 'R essentials for statistical experiments',
  question: 'How do we turn a chance experiment into a few lines of R?',
  estimatedMinutes: '70–90',
  prerequisites: ["No programming experience. Familiarity with ordinary arithmetic is enough."],
  introduction: [
    "A code chunk is a small set of instructions. You can run it, inspect the result below it, and change an instruction to explore a different experiment. We will learn the R we need by recording and repeating throws of a fair six-sided die.",
    "All observations here are synthetic teaching data. Generated throws follow the fair-die model stated in each experiment.",
    "Use the Run button, or press Command+Enter on macOS or Ctrl+Enter on Windows/Linux while the cursor is in a chunk. Tab moves out of the editor. Run the worked examples in order because later chunks can use objects created earlier.",
    "Exercise chunks contain unfinished instructions marked `# TODO`. Run all skips these exercises so you can explore the worked examples first; remove the TODO comments when your exercise is ready to join Run all. Showing an answer leaves your own code intact.",
  ],
  sections: [
    {
      id: 'r-first-run',
      title: 'Run a calculation and read its output',
      paragraphs: [
        "R uses + for addition, - for subtraction, * for multiplication, / for division, and ^ for a power. Parentheses group calculations, just as in arithmetic. A # begins a comment: R ignores the rest of that line.",
        "Run the chunk below. Each calculation prints a result; the prefix [1] means the first displayed value starts at position 1, rather than being part of your answer. The separate execution number in the chunk toolbar records when you ran it.",
      ],
      chunks: [
        {
          id: 'r-arithmetic',
          title: 'R as a calculator',
          kind: 'example',
          code: `# Two dice show 4 and 6. What is their average?
(4 + 6) / 2

# Compare a square and a multiplication.
3^2
3 * 2`,
          explanation: "The three results are 5, 9, and 6. Code is executed from top to bottom. Edit a number and run again: the output belongs to the code that was actually executed.",
          checks: ['(4 + 6) / 2 == 5', '3^2 == 9', '3 * 2 == 6'],
        },
        {
          id: 'r-arithmetic-exercise',
          title: 'Exercise: calculate an even-face fraction',
          kind: 'exercise',
          code: `# A fair die has three even faces among six equally likely faces.
# TODO: calculate the fraction 3 divided by 6.
# TODO: multiply that fraction by 100 to display a percentage.`,
          answer: `3 / 6
(3 / 6) * 100`,
          explanation: "Use division and multiplication to display 0.5 and 50. These are two ways to describe the same fraction: one half, or 50%.",
          checks: ['3 / 6 == 0.5', '(3 / 6) * 100 == 50'],
        },
      ],
    },
    {
      id: 'r-objects-and-names',
      title: 'Give results names',
      paragraphs: [
        "The assignment arrow `<-` stores the value on its right in an object named on its left. You can type it as a less-than sign followed by a hyphen. Writing an object’s name on a line retrieves and prints its current value; an assignment normally prints nothing.",
        "Names are case-sensitive: hits and Hits would name different objects. Use readable names beginning with a letter, with underscores between words. Reassigning an object replaces its old value.",
      ],
      chunks: [
        {
          id: 'r-assignment',
          title: 'Store the result of an experiment',
          kind: 'example',
          code: `hits <- 7
trials <- 20
observed_fraction <- hits / trials
observed_fraction`,
          explanation: "Suppose an event occurred in 7 of 20 trials. The object `observed_fraction` stores 0.35. If you later change hits, you must rerun the `observed_fraction` assignment to recalculate it; R does not treat the arrow as a permanent spreadsheet formula.",
          checks: ['hits == 7', 'trials == 20', 'observed_fraction == 0.35'],
        },
        {
          id: 'r-assignment-exercise',
          title: 'Exercise: store another observed fraction',
          kind: 'exercise',
          code: `exercise_hits <- 9
exercise_trials <- 12
# TODO: assign their ratio to exercise_fraction.
# TODO: write exercise_fraction on its own line to display it.`,
          answer: `exercise_hits <- 9
exercise_trials <- 12
exercise_fraction <- exercise_hits / exercise_trials
exercise_fraction`,
          explanation: "Use the object names in your calculation. Your new fraction should be 0.75; the worked example’s `observed_fraction` stays 0.35 because these are separate objects.",
          checks: ['exercise_fraction == 0.75', 'observed_fraction == 0.35'],
        },
        {
          id: 'r-names-and-strings',
          title: 'An object name is different from quoted text',
          kind: 'example',
          code: `experiment_label <- "twenty die throws"
experiment_label
"experiment_label"`,
          explanation: "Double quotes create a string, which is a piece of text. The unquoted name `experiment_label` retrieves the stored text “twenty die throws”; the quoted string \"`experiment_label`\" is literally those characters. A name that has not been assigned a value produces an “object not found” error when you try to retrieve it.",
          checks: ['experiment_label == "twenty die throws"', 'experiment_label != "experiment_label"'],
        },
      ],
    },
    {
      id: 'r-calling-functions',
      title: 'Ask a function to do a job',
      paragraphs: [
        "A function is a reusable instruction with inputs called arguments. Write its name followed by parentheses, and separate multiple arguments with commas. `round(0.3567, digits = 2)` asks `round()` to round the first argument to two decimal places.",
        "An argument name followed by = labels an input to the function. Here digits = 2 describes how to round; it is different from using `<-` to store a result. You can pass an object as an argument and assign the function’s result to a new object.",
      ],
      chunks: [
        {
          id: 'r-function-call',
          title: 'Round a calculated fraction',
          kind: 'example',
          code: `unrounded_fraction <- 5 / 14
rounded_fraction <- round(unrounded_fraction, digits = 2)
unrounded_fraction
rounded_fraction`,
          explanation: "The original fraction is approximately 0.3571429, while its rounded version is 0.36. R prints a manageable number of digits; use the unrounded object for later calculations when you want to avoid extra rounding error.",
          checks: ['rounded_fraction == 0.36', 'abs(unrounded_fraction - 5 / 14) < 1e-12'],
        },
        {
          id: 'r-function-call-exercise',
          title: 'Exercise: choose a named argument',
          kind: 'exercise',
          code: `exercise_ratio <- 9 / 14
# TODO: use round() with digits = 3 and save exercise_rounded.
# TODO: display exercise_rounded.`,
          answer: `exercise_ratio <- 9 / 14
exercise_rounded <- round(exercise_ratio, digits = 3)
exercise_rounded`,
          explanation: "Keep three digits after the decimal point. Changing the argument changes the operation, while `exercise_ratio` retains its original value.",
          checks: ['exercise_rounded == 0.643', 'exercise_ratio == 9 / 14'],
        },
      ],
    },
    {
      id: 'r-vectors',
      title: 'Keep observations together in a vector',
      paragraphs: [
        "A vector is an ordered collection of values. `c()` combines values into a vector, and square brackets select positions: rolls[2] retrieves the second value. R starts counting positions at 1.",
        "`length()` counts entries, `sum()` adds them, and `mean()` computes their arithmetic average. We will use these functions to summarize repeated measurements.",
      ],
      chunks: [
        {
          id: 'r-vector-and-index',
          title: 'Record five observed die faces',
          kind: 'example',
          code: `rolls <- c(2, 6, 1, 6, 3)
rolls
rolls[2]
length(rolls)
sum(rolls)
mean(rolls)`,
          explanation: "The selected value is 6, the vector has 5 entries, their sum is 18, and their mean is 3.6. The mean need not be a possible die face: it summarizes several observations.",
          checks: ['length(rolls) == 5', 'rolls[2] == 6', 'sum(rolls) == 18', 'mean(rolls) == 3.6'],
        },
        {
          id: 'r-vector-exercise',
          title: 'Exercise: record and inspect your own observations',
          kind: 'exercise',
          code: `# TODO: make exercise_rolls contain 6, 1, 4, and 2, in that order.
# TODO: save its fourth entry as exercise_last.
# TODO: display exercise_last and mean(exercise_rolls).`,
          answer: `exercise_rolls <- c(6, 1, 4, 2)
exercise_last <- exercise_rolls[4]
exercise_last
mean(exercise_rolls)`,
          explanation: "Use `c()` to create the vector, then square brackets to select a position. The fourth value is 2 and the average of the four observations is 3.25.",
          checks: ['identical(exercise_rolls, c(6, 1, 4, 2))', 'exercise_last == 2', 'mean(exercise_rolls) == 3.25'],
        },
        {
          id: 'r-vector-arithmetic',
          title: 'Calculate a game’s payoff for every recorded throw',
          kind: 'example',
          code: `# The game pays the die face minus 3 points.
payoffs <- rolls - 3
payoffs
mean(payoffs)`,
          explanation: "Vectorized arithmetic applies an operation to every entry: subtracting 3 from rolls produces −1, 3, −2, 3, and 0. You do not need to write the subtraction five times. The mean payoff in this recorded set is 0.6 points.",
          checks: ['identical(payoffs, c(-1, 3, -2, 3, 0))', 'abs(mean(payoffs) - 0.6) < 1e-12'],
        },
        {
          id: 'r-vector-arithmetic-exercise',
          title: 'Exercise: change the payoff rule',
          kind: 'exercise',
          code: `# A different game pays twice the die face, minus 5 points.
# TODO: calculate exercise_payoffs from rolls using * and -.
# TODO: display the payoff vector and its mean.`,
          answer: `exercise_payoffs <- 2 * rolls - 5
exercise_payoffs
mean(exercise_payoffs)`,
          explanation: "Use one expression for all five observations. Multiplication happens before subtraction, so `2 * rolls - 5` doubles each face before subtracting five.",
          checks: ['identical(exercise_payoffs, c(-1, 7, -3, 7, 1))', 'abs(mean(exercise_payoffs) - 2.2) < 1e-12'],
        },
      ],
    },
    {
      id: 'r-logical-values',
      title: 'Describe an event with TRUE and FALSE',
      paragraphs: [
        "A comparison produces a logical value: `TRUE` or `FALSE`. Use `==` to ask whether two values are equal, != for not equal, > or < for greater or less, and `>=` or `<=` when equality is included. Comparisons also work entry by entry on a vector.",
        "`sum()` treats `TRUE` as 1 and `FALSE` as 0, so it counts successes; `mean()` then gives the fraction of successes. A logical vector inside square brackets selects entries where the condition is `TRUE`.",
      ],
      chunks: [
        {
          id: 'r-comparisons',
          title: 'Which recorded throws were sixes?',
          kind: 'example',
          code: `is_six <- rolls == 6
is_six
sum(is_six)
mean(is_six)
rolls[is_six]`,
          explanation: "The result `FALSE` `TRUE` `FALSE` `TRUE` `FALSE` marks two successes among five throws, an observed fraction of 0.4. This is a description of these five observations, not a claim that a fair die has probability 0.4 of showing six.",
          checks: ['sum(is_six) == 2', 'mean(is_six) == 0.4', 'identical(rolls[is_six], c(6, 6))'],
        },
        {
          id: 'r-comparisons-exercise',
          title: 'Exercise: select throws of at least four',
          kind: 'exercise',
          code: `# TODO: use >= to create exercise_high from rolls.
# TODO: display exercise_high, sum(exercise_high), and rolls[exercise_high].`,
          answer: `exercise_high <- rolls >= 4
exercise_high
sum(exercise_high)
rolls[exercise_high]`,
          explanation: "The condition includes 4, 5, and 6, although only sixes happen to occur among those values in our recorded vector. Your logical condition describes the event; the selected entries describe what was observed.",
          checks: ['identical(exercise_high, c(FALSE, TRUE, FALSE, TRUE, FALSE))', 'sum(exercise_high) == 2'],
        },
        {
          id: 'r-missing-values',
          title: 'A missing measurement is not zero',
          kind: 'example',
          code: `incomplete_rolls <- c(2, NA, 6)
incomplete_rolls
mean(incomplete_rolls)
is.na(incomplete_rolls)
mean(incomplete_rolls, na.rm = TRUE)`,
          explanation: "`NA` means a missing or unknown value. `is.na()` identifies missing entries; `mean()` returns `NA` when a needed value is missing. The named argument `na.rm = TRUE` removes missing entries for that calculation, leaving an average of 4 for the two observed throws. This does not recover the missing throw or guarantee an unbiased estimate; missingness can matter.",
          checks: ['is.na(mean(incomplete_rolls))', 'sum(is.na(incomplete_rolls)) == 1', 'mean(incomplete_rolls, na.rm = TRUE) == 4'],
        },
      ],
    },
    {
      id: 'r-decisions',
      title: 'Choose a step with if and else',
      paragraphs: [
        "if (condition) runs a group of instructions only when a single condition is `TRUE`. Curly braces { } group those instructions; else supplies the alternative when it is `FALSE`. Put } else { on the same line, as shown below.",
        "Use one known `TRUE` or `FALSE` value as the condition. A vector of several conditions, or `NA`, does not tell if which single branch to take.",
      ],
      chunks: [
        {
          id: 'r-if-else',
          title: 'Label one throw',
          kind: 'example',
          code: `one_throw <- 6
if (one_throw == 6) {
  outcome_label <- "six"
} else {
  outcome_label <- "not six"
}
outcome_label`,
          explanation: "With `one_throw` set to 6, R follows the first branch and prints \"six\". Change it to another face and rerun to see the other branch. The comparison uses `==`; the assignments inside the branches use `<-`.",
          checks: ['one_throw == 6', 'outcome_label == "six"'],
        },
        {
          id: 'r-if-else-exercise',
          title: 'Exercise: label a high or low throw',
          kind: 'exercise',
          code: `exercise_throw <- 4
# TODO: use if and else to set exercise_label to "high" for
# a throw >= 4, and "low" otherwise. Then display exercise_label.`,
          answer: `exercise_throw <- 4
if (exercise_throw >= 4) {
  exercise_label <- "high"
} else {
  exercise_label <- "low"
}
exercise_label`,
          explanation: "Your initial result should be \"high\". Then try `exercise_throw <- 2` and rerun the whole chunk to check the other branch. Both labels are strings, so both need quotes.",
          checks: ['exercise_throw == 4', 'exercise_label == "high"'],
        },
      ],
    },
    {
      id: 'r-random-sampling',
      title: 'Let R carry out a chance experiment',
      paragraphs: [
        "The expression `1:6` creates the whole-number sequence 1, 2, 3, 4, 5, 6. `sample(faces, size = 12, replace = TRUE)` draws 12 entries from `faces`. With no probabilities supplied, every face is equally likely.",
        "`replace = TRUE` puts each drawn entry back before the next draw, allowing repetitions and modeling independent throws of a fair die. Without replacement, a face cannot be selected again during that sample; that would describe a different experiment. `set.seed()` chooses a reproducible starting state for R’s random-number generator.",
        "A programming variable such as `die_draws` is a named object holding values already computed. A mathematical random variable is a rule assigning a number to an uncertain outcome: for example, \\(X\\) can denote the face on the next die throw. Once a throw is generated and stored, that stored number is an observed value of \\(X\\).",
      ],
      chunks: [
        {
          id: 'r-sampling',
          title: 'Simulate twelve independent die throws',
          kind: 'example',
          code: `faces <- 1:6
set.seed(17)
die_draws <- sample(faces, size = 12, replace = TRUE)
die_draws
mean(die_draws == 6)`,
          explanation: "The vector shows twelve generated faces. The final line first compares every face with 6, then averages the `TRUE`/`FALSE` values to find the observed fraction of sixes. The fair-die probability is \\(\\frac{1}{6}\\), but twelve throws can easily give a different fraction.",
          checks: ['length(die_draws) == 12', 'all(die_draws >= 1 & die_draws <= 6)', 'mean(die_draws == 6) == sum(die_draws == 6) / 12'],
        },
        {
          id: 'r-reproducible-seed',
          title: 'Reproduce an experiment, then allow it to change',
          kind: 'example',
          code: `set.seed(17)
first_draws <- sample(faces, size = 12, replace = TRUE)
next_draws <- sample(faces, size = 12, replace = TRUE)
set.seed(17)
repeated_draws <- sample(faces, size = 12, replace = TRUE)
first_draws
next_draws
identical(first_draws, repeated_draws)`,
          explanation: "`identical(a, b)` asks whether a and b are exactly the same object values and type. The first and next draws use different positions in the random sequence; resetting the seed reproduces the first draws, so the comparison prints `TRUE`. Reproducibility assumes the same R random-generator settings and code. A seed controls repeatability, not whether a small experiment resembles its theoretical probability.",
          checks: ['identical(first_draws, repeated_draws)', '!identical(first_draws, next_draws)'],
        },
        {
          id: 'r-sampling-exercise',
          title: 'Exercise: simulate fifty throws',
          kind: 'exercise',
          code: `set.seed(23)
# TODO: use sample() with replacement to create exercise_draws
# containing 50 fair die throws.
# TODO: display mean(exercise_draws == 6).`,
          answer: `set.seed(23)
exercise_draws <- sample(faces, size = 50, replace = TRUE)
mean(exercise_draws == 6)`,
          explanation: "Use `size = 50` and `replace = TRUE`. Rerun to reproduce the same fifty throws, then deliberately change the seed to try another set. Even a larger set need not have a fraction exactly equal to \\(\\frac{1}{6}\\).",
          checks: ['length(exercise_draws) == 50', 'all(exercise_draws >= 1 & exercise_draws <= 6)', 'mean(exercise_draws == 6) >= 0 & mean(exercise_draws == 6) <= 1'],
        },
      ],
    },
    {
      id: 'r-repeat-with-loop',
      title: 'Repeat an experiment with a for loop',
      paragraphs: [
        "A for loop repeats the instructions inside braces once for each value in a sequence. In for (trial in 1:20), trial takes the values 1 through 20 in order. We will use each turn of the loop to throw a die and update a count.",
        "The expression `six_count` `<-` `six_count` + 1 reads the old count, adds one, and stores the new count. Start the count at zero before the loop. Set the seed once before the entire experiment; resetting the same seed inside the loop would repeat the same first draw.",
      ],
      chunks: [
        {
          id: 'r-for-loop',
          title: 'Count sixes one throw at a time',
          kind: 'example',
          code: `set.seed(31)
loop_trials <- 20
six_count <- 0
for (trial in 1:loop_trials) {
  current_throw <- sample(faces, size = 1, replace = TRUE)
  if (current_throw == 6) {
    six_count <- six_count + 1
  }
}
six_count
six_count / loop_trials`,
          explanation: "The if statement adds one only when a six appears; with no else, other throws leave the count unchanged. The outputs are the number of sixes and their observed fraction. The loop makes the repeated experiment explicit, even though `sample()` can also generate a whole vector at once.",
          checks: ['loop_trials == 20', 'trial == loop_trials', 'six_count >= 0 & six_count <= loop_trials', 'six_count == round(six_count)'],
        },
        {
          id: 'r-for-loop-exercise',
          title: 'Exercise: count high throws in thirty trials',
          kind: 'exercise',
          code: `set.seed(37)
exercise_loop_trials <- 30
exercise_high_count <- 0
# TODO: write a for loop that generates one throw per trial.
# TODO: add one to exercise_high_count when the throw is >= 4.
# TODO: display the count and its fraction of all 30 throws.`,
          answer: `set.seed(37)
exercise_loop_trials <- 30
exercise_high_count <- 0
for (exercise_trial in 1:exercise_loop_trials) {
  exercise_current <- sample(faces, size = 1, replace = TRUE)
  if (exercise_current >= 4) {
    exercise_high_count <- exercise_high_count + 1
  }
}
exercise_high_count
exercise_high_count / exercise_loop_trials`,
          explanation: "Repeat the structure of the worked example with a different event and number of trials. This fair-die event has probability \\(\\frac{3}{6}\\), while its observed fraction in thirty trials is allowed to vary.",
          // Exact seeded result verifies the event and all 30 loop iterations.
          checks: ['exercise_trial == 30', 'exercise_high_count >= 0 & exercise_high_count <= 30', 'exercise_high_count == 16'],
        },
      ],
    },
    {
      id: 'r-write-a-function',
      title: 'Reuse the steps of an experiment',
      paragraphs: [
        "`function(sample_size)` defines a reusable set of instructions with an input named `sample_size`. Assign that function to a name, then call it using parentheses, just as you called `mean()`. `return()` specifies the result of the function call.",
        "Inside our function, `sample_size` is the supplied input and draws is a local object used for that call. Each call generates a fresh sample and calculates its mean. Defining the function stores its instructions; calling it carries them out.",
      ],
      chunks: [
        {
          id: 'r-custom-function',
          title: 'Generate a sample mean with one function call',
          kind: 'example',
          code: `simulate_die_mean <- function(sample_size) {
  draws <- sample(1:6, size = sample_size, replace = TRUE)
  return(mean(draws))
}
set.seed(41)
mean_of_twenty <- simulate_die_mean(sample_size = 20)
mean_of_two_hundred <- simulate_die_mean(sample_size = 200)
mean_of_twenty
mean_of_two_hundred`,
          explanation: "The two calls reuse the same steps with different sample sizes. Both return a single sample mean. Later notebooks will repeat this whole experiment to study how sample means vary; one pair of results is not enough to establish a general pattern.",
          checks: ['is.function(simulate_die_mean)', 'length(mean_of_twenty) == 1', 'mean_of_twenty >= 1 & mean_of_twenty <= 6', 'mean_of_two_hundred >= 1 & mean_of_two_hundred <= 6'],
        },
        {
          id: 'r-custom-function-exercise',
          title: 'Exercise: write a function for the total of several dice',
          kind: 'exercise',
          code: `set.seed(43)
# TODO: define exercise_die_total <- function(number_of_dice) { ... }
# Inside, sample that many faces with replacement and return their sum.
# TODO: call it with number_of_dice = 2, save exercise_total, and display it.`,
          answer: `set.seed(43)
exercise_die_total <- function(number_of_dice) {
  exercise_faces <- sample(1:6, size = number_of_dice, replace = TRUE)
  return(sum(exercise_faces))
}
exercise_total <- exercise_die_total(number_of_dice = 2)
exercise_total`,
          explanation: "Reuse `sample()` and `sum()` inside your function. With two dice the total must be between 2 and 12. Then try a call with five dice to see how an argument can change an experiment without rewriting its steps.",
          checks: ['is.function(exercise_die_total)', 'length(exercise_total) == 1', 'exercise_total >= 2 & exercise_total <= 12', 'exercise_total == round(exercise_total)'],
        },
      ],
    },
  ],
  closing: [
    "You can now store observations, select events, summarize results, and repeat a random experiment. A vector keeps outcomes together, a loop makes repetition explicit, and a function gives repeated steps a reusable name. These are tools for asking statistical questions.",
    "An observed fraction comes from a particular set of trials. A probability describes the random mechanism we have assumed. Our seeds make experiments reproducible, but neither a seed nor a simulation proves a probability theorem; the next notebook compares experimental results with exact reasoning.",
    "If a chunk gives an error, read its message, check names and punctuation, and rerun the earlier chunks that create its objects. Restarting R clears those objects while preserving your editor contents; Run all rebuilds the worked examples in order. Your downloaded script and exported backup let you keep the code you explored.",
  ],
};
