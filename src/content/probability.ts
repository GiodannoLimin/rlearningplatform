import type { Notebook } from './schema';

export const probability: Notebook = {
  id: 'probability', number: 1, title: 'Probability through simulation',
  question: 'How can repeated experiments reveal a probability?',
  estimatedMinutes: '45–60',
  prerequisites: ["Notebook 0: vectors, comparisons, indexing, for loops, and `set.seed()`."],
  introduction: [
    "A probability describes a random mechanism. A simulation asks R to repeat that mechanism and counts how often an event occurs. The observed fraction is an estimate, so it can vary even when the mechanism stays the same.",
    "We begin with fair, independent die rolls. Later we change what information is available and whether a drawn card is replaced. These details belong to the probability model; changing them can change the answer.",
  ],
  sections: [
    {
      id: 'prob-outcomes', title: 'List the possible outcomes',
      paragraphs: [
        "The sample space is the set of possible outcomes. For one six-sided die it is \\(\\{1,2,3,4,5,6\\}\\); fairness means each face has probability \\(\\frac{1}{6}\\). An event is a subset, such as \\(A=\\{2,4,6\\}\\), the event that the face is even.",
        "\\(P(A)\\) means the probability of event \\(A\\). Here it is the number of favorable faces divided by six. R’s `%%` computes a remainder, so `faces %% 2 == 0` checks which faces divide evenly by two; `mean()` treats `TRUE` as 1 and `FALSE` as 0.",
        "`sum()` adds entries, and `length()` counts entries. `data.frame()` puts named columns side by side in a table; `print()` displays an object explicitly.",
      ],
      chunks: [
        {
          id: 'prob-exact-die', title: 'An exact probability from six equally likely faces', kind: 'example',
          code: `faces <- 1:6
even_face <- faces %% 2 == 0
data.frame(face = faces, is_even = even_face)
exact_even <- sum(even_face) / length(faces)
print(exact_even)
print(mean(even_face))`,
          explanation: "Three of the six equally likely outcomes belong to \\(A\\), so \\(P(A) = \\frac{3}{6} = 0.5\\). This is an exact enumeration of the model, not a simulation estimate. Counting outcomes this way would be wrong for a loaded die with unequal face probabilities.",
          checks: ['sum(even_face) == 3', 'exact_even == 0.5', 'mean(even_face) == exact_even'],
        },
        {
          id: 'prob-small-face', title: 'Exercise: a roll of at most two', kind: 'exercise',
          code: `# TODO: compare faces with 2 using <=; save exercise_small_event.
# TODO: calculate exercise_small_probability with mean().
# TODO: print the logical vector and its probability.`,
          answer: `exercise_small_event <- faces <= 2
exercise_small_probability <- mean(exercise_small_event)
print(exercise_small_event)
print(exercise_small_probability)`,
          explanation: "The event includes 1 and 2. Its exact probability is \\(\\frac{2}{6} = \\frac{1}{3}\\), which R displays as a rounded decimal.",
          checks: ['identical(exercise_small_event, c(TRUE, TRUE, FALSE, FALSE, FALSE, FALSE))', 'abs(exercise_small_probability - 1/3) < 1e-12'],
        },
      ],
    },
    {
      id: 'prob-repeated-rolls', title: 'Estimate by repeating the mechanism',
      paragraphs: [
        "`sample()` draws from the supplied faces. `replace = TRUE` returns each selected face to the pool, so every new roll has the same six possible outcomes; with no probability weights, the faces are equally likely. This models independent rolls, not taking faces out of a bag.",
        "The relative frequency is the event count divided by the number of rolls. `set.seed()` makes this sequence reproducible; removing it or changing its number lets a new sequence produce a different estimate.",
      ],
      chunks: [
        {
          id: 'prob-simulate-die', title: 'Roll a fair die 1,200 times', kind: 'example',
          code: `set.seed(1101)
roll_count <- 1200
rolls <- sample(1:6, size = roll_count, replace = TRUE)
even_roll <- rolls %% 2 == 0
estimated_even <- mean(even_roll)
data.frame(rolls = roll_count, even_count = sum(even_roll),
           relative_frequency = estimated_even, exact_probability = 0.5)`,
          explanation: "The estimated probability should be near 0.5, not necessarily equal to it. At 1,200 independent rolls, the Monte Carlo standard error of this fraction is \\(\\sqrt{\\frac{0.5\\times0.5}{1200}}\\), about 0.014. It describes simulation variability, not uncertainty about our stipulated fair-die model.",
          // 0.075 is over five Monte Carlo SEs: sqrt(0.5 * 0.5 / 1200).
          checks: ['length(rolls) == 1200', 'all(rolls %in% 1:6)', 'abs(estimated_even - 0.5) < 0.075'],
        },
        {
          id: 'prob-simulate-large-face', title: 'Exercise: estimate a different event from the same rolls', kind: 'exercise',
          code: `# TODO: calculate exercise_large_estimate for rolls >= 5.
# TODO: calculate exercise_large_exact from faces >= 5.
# TODO: put the estimate and exact probability in a data.frame().`,
          answer: `exercise_large_estimate <- mean(rolls >= 5)
exercise_large_exact <- mean(faces >= 5)
data.frame(estimate = exercise_large_estimate, exact = exercise_large_exact)`,
          explanation: "The favorable faces are 5 and 6, so the exact probability is \\(\\frac{1}{3}\\). One simulated sequence can answer several event questions, although estimates based on that same sequence need not be independent of each other.",
          // 0.075 exceeds five MC SEs for p = 1/3, B = 1200.
          checks: ['abs(exercise_large_exact - 1/3) < 1e-12', 'abs(exercise_large_estimate - 1/3) < 0.075'],
        },
      ],
    },
    {
      id: 'prob-frequency-trace', title: 'Watch an estimate develop',
      paragraphs: [
        "`cumsum()` counts successes up to each position and `seq_along()` supplies the positions 1, 2, … through the vector’s length. Dividing them gives the estimated probability after every roll.",
        "The $ operator selects a named table column. `plot(..., type = \"b\")` joins points with lines; `abline(h = 0.5)` adds a horizontal reference. The table below contains every plotted checkpoint.",
      ],
      chunks: [
        {
          id: 'prob-running-frequency', title: 'Watch the estimate as rolls accumulate', kind: 'example',
          code: `running_even <- cumsum(even_roll) / seq_along(even_roll)
shown_rolls <- c(20, 50, 100, 200, 500, 1200)
frequency_table <- data.frame(rolls = shown_rolls,
                             estimate = running_even[shown_rolls], exact = 0.5)
plot(frequency_table$rolls, frequency_table$estimate, type = "b",
     ylim = c(0, 1), xlab = "Number of independent rolls",
     ylab = "Estimated probability of an even face",
     main = "One sequence, six checkpoints", pch = 16)
abline(h = 0.5, lty = 2)
print(frequency_table, row.names = FALSE)`,
          explanation: "The dashed reference is 0.5. More rolls generally stabilize an estimate, but a particular next roll can move it farther from the truth. This one simulated path illustrates variability; it does not prove a convergence theorem.",
          plotAlt: 'Estimated probability of an even die face at 20, 50, 100, 200, 500, and 1,200 rolls, with a horizontal reference at the exact probability 0.5. The adjacent six-row table gives every plotted estimate.',
          checks: ['nrow(frequency_table) == 6', 'abs(tail(running_even, 1) - estimated_even) < 1e-12', 'all(running_even >= 0 & running_even <= 1)'],
        },
      ],
    },
    {
      id: 'prob-simulation-variability', title: 'Repeat the whole simulation',
      paragraphs: [
        "A second batch of rolls usually gives a different estimate. The loop below repeats the entire estimation exercise 12 times, using 400 rolls for each estimate of \\(P(\\text{face}=6) = \\frac{1}{6}\\).",
        "`numeric(12)` reserves 12 storage places, and `seq_len(batches)` supplies the integers from one through the number of batches. The loop fills one place per batch. Put the seed before the loop: resetting the same seed inside every iteration would repeat the same batch.",
      ],
      chunks: [
        {
          id: 'prob-independent-batches', title: 'Twelve estimates of the same probability', kind: 'example',
          code: `set.seed(1102)
batches <- 12
rolls_per_batch <- 400
batch_estimates <- numeric(batches)
for (j in seq_len(batches)) {
  batch_rolls <- sample(1:6, rolls_per_batch, replace = TRUE)
  batch_estimates[j] <- mean(batch_rolls == 6)
}
data.frame(batch = seq_len(batches), estimate = batch_estimates, exact = 1/6)
mc_se <- sqrt((1/6) * (5/6) / rolls_per_batch)
print(mc_se)`,
          explanation: "Here \\(B\\), the rolls per batch, controls the precision of each probability estimate. For independent event indicators with probability \\(p\\), the Monte Carlo standard error is \\(\\sqrt{\\frac{p(1-p)}{B}}\\). More batches reveal that variability; more rolls in each batch reduce it. Neither operation proves the underlying probability.",
          // Each estimate has MC SE about 0.0186; 0.10 exceeds five SEs.
          checks: ['length(batch_estimates) == 12', 'all(abs(batch_estimates - 1/6) < 0.10)', 'abs(mc_se - sqrt((1/6) * (5/6) / 400)) < 1e-12'],
        },
        {
          id: 'prob-larger-batches', title: 'Exercise: use four times as many rolls per estimate', kind: 'exercise',
          code: `set.seed(1103)
exercise_batch_size <- 1600
# TODO: create exercise_estimates with 12 storage places.
# TODO: repeat the sampling loop with exercise_batch_size rolls per batch.
# TODO: calculate exercise_mc_se and compare it with mc_se.`,
          answer: `set.seed(1103)
exercise_batch_size <- 1600
exercise_estimates <- numeric(12)
for (j in seq_len(12)) {
  exercise_rolls <- sample(1:6, exercise_batch_size, replace = TRUE)
  exercise_estimates[j] <- mean(exercise_rolls == 6)
}
exercise_mc_se <- sqrt((1/6) * (5/6) / exercise_batch_size)
data.frame(batch = seq_len(12), estimate = exercise_estimates)
print(c(old_mc_se = mc_se, new_mc_se = exercise_mc_se))`,
          explanation: "The theoretical Monte Carlo standard error is halved when the number of rolls is quadrupled. Compare the estimates, but do not require every new estimate to be closer than every old estimate: random variation can still reverse an individual comparison.",
          // At B=1600 the MC SE is about 0.00932; 0.055 exceeds five SEs.
          checks: ['length(exercise_estimates) == 12', 'all(abs(exercise_estimates - 1/6) < 0.055)', 'abs(exercise_mc_se / mc_se - 0.5) < 1e-12'],
        },
      ],
    },
    {
      id: 'prob-conditioning', title: 'Change the information, change the denominator',
      paragraphs: [
        "Roll two independent fair dice and keep their order. `expand.grid()` lists all 36 ordered pairs, each with probability \\(\\frac{1}{36}\\), and `nrow()` counts the table’s rows. Let \\(A\\) mean their sum is eight, and let \\(B\\) mean the first die is even.",
        "\\(P(A \\mid B)\\), read “probability of \\(A\\) given \\(B\\),” restricts attention to outcomes in \\(B\\). It equals \\(\\frac{P(A \\cap B)}{P(B)}\\) when \\(P(B)>0\\). In R, `event_a[event_b]` selects \\(A\\)’s logical values only for those pairs satisfying \\(B\\).",
      ],
      chunks: [
        {
          id: 'prob-exact-conditional', title: 'A sum of eight, given an even first die', kind: 'example',
          code: `pairs <- expand.grid(first = 1:6, second = 1:6)
event_a <- pairs$first + pairs$second == 8
event_b <- pairs$first %% 2 == 0
unconditional <- mean(event_a)
conditional <- mean(event_a[event_b])
data.frame(question = c("Sum is 8", "Sum is 8, given first is even"),
           favorable = c(sum(event_a), sum(event_a & event_b)),
           possible = c(nrow(pairs), sum(event_b)),
           probability = c(unconditional, conditional))`,
          explanation: "The unconditional probability is \\(\\frac{5}{36}\\). Given an even first die, three of the 18 remaining pairs sum to eight, so the conditional probability is \\(\\frac{3}{18} = \\frac{1}{6}\\). The & operator means that both event conditions must hold.",
          checks: ['nrow(pairs) == 36', 'sum(event_a) == 5', 'sum(event_a & event_b) == 3', 'abs(unconditional - 5/36) < 1e-12', 'abs(conditional - 1/6) < 1e-12'],
        },
        {
          id: 'prob-condition-odd', title: 'Exercise: condition on an odd first die instead', kind: 'exercise',
          code: `# ! changes TRUE to FALSE and FALSE to TRUE.
# TODO: save !event_b as exercise_first_odd.
# TODO: calculate exercise_given_odd for a sum of 8.
# TODO: print the favorable count, denominator, and probability.`,
          answer: `exercise_first_odd <- !event_b
exercise_given_odd <- mean(event_a[exercise_first_odd])
data.frame(favorable = sum(event_a & exercise_first_odd),
           possible = sum(exercise_first_odd), probability = exercise_given_odd)`,
          explanation: "Only (3, 5) and (5, 3) remain favorable among the 18 pairs with an odd first die. Its conditional probability is \\(\\frac{2}{18} = \\frac{1}{9}\\). Conditioning changes which outcomes are relevant; it does not reroll the second die.",
          checks: ['sum(event_a & exercise_first_odd) == 2', 'abs(exercise_given_odd - 1/9) < 1e-12'],
        },
        {
          id: 'prob-simulate-conditional', title: 'Estimate conditional probability from paired rolls', kind: 'example',
          code: `set.seed(1104)
pair_count <- 6000
first_die <- sample(1:6, pair_count, replace = TRUE)
second_die <- sample(1:6, pair_count, replace = TRUE)
sum_eight <- first_die + second_die == 8
first_even <- first_die %% 2 == 0
estimated_unconditional <- mean(sum_eight)
estimated_conditional <- mean(sum_eight[first_even])
data.frame(question = c("Unconditional", "Given first is even"),
           relevant_rolls = c(pair_count, sum(first_even)),
           estimate = c(estimated_unconditional, estimated_conditional),
           exact = c(5/36, 1/6))`,
          explanation: "The conditional denominator is the number of simulated pairs with an even first die, not 6,000. It is random and usually near 3,000. Simulated answers fluctuate around the different exact probabilities; their difference is explained by enumeration, not established by this one simulation.",
          // Unconditional MC SE is about .00446; conditional SE near .00680.
          // Tolerances .03 and .04 exceed five corresponding MC SEs.
          checks: ['sum(first_even) > 2500 & sum(first_even) < 3500', 'abs(estimated_unconditional - 5/36) < 0.03', 'abs(estimated_conditional - 1/6) < 0.04'],
        },
        {
          id: 'prob-conditional-simulation-exercise', title: 'Exercise: use the odd-first-die simulated subset', kind: 'exercise',
          code: `# TODO: calculate exercise_odd_count from !first_even.
# TODO: calculate exercise_odd_estimate using sum_eight[!first_even].
# TODO: compare with the exact probability 1/9.`,
          answer: `exercise_odd_count <- sum(!first_even)
exercise_odd_estimate <- mean(sum_eight[!first_even])
data.frame(relevant_rolls = exercise_odd_count,
           estimate = exercise_odd_estimate, exact = 1/9)`,
          explanation: "You are reusing the same paired-roll experiment with a different condition. More repetitions would improve the precision of this conditional probability estimate; they would not change the exact model probability.",
          // For roughly 3000 selected pairs, MC SE is about .00574; .04 > 6 SEs.
          checks: ['exercise_odd_count == sum(!first_even)', 'abs(exercise_odd_estimate - 1/9) < 0.04'],
        },
      ],
    },
    {
      id: 'prob-independence', title: 'When information leaves a probability unchanged',
      paragraphs: [
        "Events \\(A\\) and \\(B\\) are independent when \\(P(A \\cap B) = P(A) \\times  P(B)\\). If \\(P(B)>0\\), this is equivalent to \\(P(A \\mid B) = P(A)\\). Independence concerns particular events under a specified mechanism.",
        "For independent fair dice, knowing that the first die is even leaves the probability of an even second die at \\(\\frac{1}{2}\\). Exact enumeration can check this claim for our 36-outcome model; a simulation can illustrate it but cannot prove independence.",
      ],
      chunks: [
        {
          id: 'prob-independent-events', title: 'Compare a joint probability with a product', kind: 'example',
          code: `first_is_even <- pairs$first %% 2 == 0
second_is_even <- pairs$second %% 2 == 0
joint_exact <- mean(first_is_even & second_is_even)
product_exact <- mean(first_is_even) * mean(second_is_even)
given_exact <- mean(second_is_even[first_is_even])
joint_simulated <- mean(first_even & (second_die %% 2 == 0))
data.frame(quantity = c("Both even", "Product of marginals", "Second even given first even"),
           exact = c(joint_exact, product_exact, given_exact))
data.frame(simulated_both_even = joint_simulated, exact_both_even = joint_exact)`,
          explanation: "A marginal probability describes one event without conditioning on the other. Both even has probability \\(\\frac{1}{4}\\), the product of two probabilities of \\(\\frac{1}{2}\\). By contrast, “sum is eight” and “first is even” above were dependent, even though the dice themselves were rolled independently.",
          // Joint indicator p=.25, B=6000 has MC SE .00559; .035 > 6 SEs.
          checks: ['joint_exact == 0.25', 'joint_exact == product_exact', 'given_exact == 0.5', 'abs(joint_simulated - 0.25) < 0.035'],
        },
        {
          id: 'prob-exclusive-events', title: 'Exercise: are mutually exclusive events independent?', kind: 'exercise',
          code: `# Mutually exclusive events cannot both occur on one roll.
# TODO: create exercise_one = faces == 1 and exercise_six = faces == 6.
# TODO: compare exercise_joint with exercise_product.
# TODO: print the two exact probabilities.`,
          answer: `exercise_one <- faces == 1
exercise_six <- faces == 6
exercise_joint <- mean(exercise_one & exercise_six)
exercise_product <- mean(exercise_one) * mean(exercise_six)
data.frame(joint = exercise_joint, product = exercise_product)`,
          explanation: "The joint probability is zero, whereas the product is \\(\\frac{1}{36}\\). These positive-probability events are dependent: learning that the die shows one rules out six. Mutually exclusive and independent describe different relationships.",
          checks: ['exercise_joint == 0', 'abs(exercise_product - 1/36) < 1e-12', 'exercise_joint != exercise_product'],
        },
      ],
    },
    {
      id: 'prob-replacement', title: 'Replacement is part of the model',
      paragraphs: [
        "Consider a four-card deck with distinct cards R1, R2, B1, and B2: two red and two black. Shuffle uniformly and draw two cards. With replacement and reshuffling, \\(P(\\text{both red})=\\frac{2}{4}\\times\\frac{2}{4}=\\frac{1}{4}\\); without replacement it is \\(\\frac{2}{4}\\times\\frac{1}{3}=\\frac{1}{6}\\).",
        "The second factors condition on a red first card. Without replacement only one red card remains among three. %in% checks membership in a vector, and `all()` is `TRUE` only when every supplied logical value is `TRUE`.",
        "`logical(card_experiments)` creates storage for one `TRUE`/`FALSE` flag per experiment. We fill those places with the results of each draw.",
      ],
      chunks: [
        {
          id: 'prob-card-mechanisms', title: 'Simulate the same question under two drawing rules', kind: 'example',
          code: `set.seed(1105)
deck <- c("R1", "R2", "B1", "B2")
red_cards <- c("R1", "R2")
card_experiments <- 1000
without_replacement <- logical(card_experiments)
with_replacement <- logical(card_experiments)
for (j in seq_len(card_experiments)) {
  draw <- sample(deck, 2, replace = FALSE)
  without_replacement[j] <- all(draw %in% red_cards)
  draw <- sample(deck, 2, replace = TRUE)
  with_replacement[j] <- all(draw %in% red_cards)
}
data.frame(rule = c("Without replacement", "With replacement"),
           estimate = c(mean(without_replacement), mean(with_replacement)),
           exact = c(1/6, 1/4))`,
          explanation: "Each loop iteration starts again with the full four-card deck. The draws inside one without-replacement experiment are dependent; the separate experiments are newly randomized. Setting `replace = FALSE` changes the mechanism, rather than merely changing simulation accuracy.",
          // The larger MC SE is sqrt(.25*.75/1000)=.0137; .07 > 5 SEs.
          checks: ['length(without_replacement) == 1000', 'abs(mean(without_replacement) - 1/6) < 0.07', 'abs(mean(with_replacement) - 1/4) < 0.07'],
        },
      ],
    },
  ],
  closing: [
    "An exact probability follows from the stated mechanism and its assumptions. A simulated relative frequency estimates that probability with Monte Carlo variability. Seeds reproduce a sequence; more independent repetitions usually give a more precise estimate.",
    "Conditioning restricts the relevant sample space and changes the denominator. Independence means that learning one event leaves the other event’s probability unchanged. Neither a close numerical match nor a larger simulation proves independence or a probability theorem.",
    "Before calculating, specify outcomes, fairness, independence assumptions, and replacement. The next notebook assigns numerical values to outcomes and studies the resulting distributions.",
  ],
};
