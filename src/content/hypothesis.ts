import type { Notebook } from './schema';

export const hypothesis: Notebook = {
  id: 'hypothesis-tests',
  number: 5,
  title: 'Hypothesis tests, false positives, and power',
  question: 'How can a test make errors, and what makes a real difference easier to detect?',
  estimatedMinutes: '50–70',
  prerequisites: [
    "Notebook 0: comparisons, loops, functions, and seeds.",
    "Notebook 2: normal distributions, tail probabilities, and quantiles.",
    "Notebooks 3–4: sample means, standard error, and repeated-sampling procedures.",
  ],
  introduction: [
    "A hypothesis test compares observed data with what a specified null model predicts. We will simulate the same study when the null is true and when it is false, then count how often the procedure rejects it.",
    "Our synthetic measurements are independent and normally distributed with unknown population mean \\(\\mu\\) and known population standard deviation \\(\\sigma = 10\\) measurement units. The null hypothesis \\(H_0\\) is \\(\\mu = \\mu_0 = 50\\); the two-sided alternative \\(H_1\\) is \\(\\mu\\ne50\\). We keep the normal model and known \\(\\sigma\\) throughout so the \\(z\\) test is exactly justified.",
    "A rejection is evidence against this null model under its assumptions. It is not a proof of an effect, and it says nothing by itself about whether the effect is useful. Run worked examples in order; unfinished exercises are optional.",
  ],
  sections: [
    {
      id: 'testing-rule', title: 'Choose a rule before seeing the data',
      paragraphs: [
        "Let \\(n\\) be the number of observations and \\(\\bar{x}\\) the observed sample mean. The statistic \\(z = \\frac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}\\) measures the mean’s distance from the null value in standard errors. Under \\(H_0\\) and our sampling assumptions, \\(z\\) has a standard normal distribution.",
        "Choose the significance threshold \\(\\alpha = 0.05\\). For this exact test under its assumptions, the probability of rejecting \\(H_0\\) when \\(H_0\\) is true equals \\(\\alpha\\). A two-sided test rejects when \\(|z|\\) exceeds `qnorm(1 - alpha/2)`; `abs()` takes an absolute value so departures in either direction count.",
      ],
      chunks: [
        {
          id: 'testing-settings', title: 'Specify a two-sided z test', kind: 'example',
          code: `mu0 <- 50
sigma <- 10
n <- 25
alpha <- 0.05
standard_error <- sigma / sqrt(n)
critical_z <- qnorm(1 - alpha / 2)
data.frame(null_mean = mu0, known_sd = sigma, sample_size = n,
           standard_error = standard_error, alpha = alpha,
           reject_below_z = -critical_z, reject_above_z = critical_z)`,
          explanation: "The standard error is 2 units. A sample mean more than about 3.92 units from 50 crosses the rejection threshold. These cutoffs are chosen before observing the sample, not adjusted to obtain a desired conclusion.",
          checks: ['abs(standard_error - 2) < 1e-12', 'abs(critical_z - 1.95996398454005) < 1e-10'],
        },
        {
          id: 'testing-one-sample', title: 'A statistic, a p-value, and a decision', kind: 'example',
          code: `set.seed(5101)
observations <- rnorm(n, mean = 53, sd = sigma)
observed_mean <- mean(observations)
observed_z <- (observed_mean - mu0) / standard_error
# pnorm(-abs(z)) is the smaller tail under the standard normal null.
p_value <- 2 * pnorm(-abs(observed_z))
reject_null <- p_value < alpha
data.frame(sample_mean = observed_mean, z = observed_z,
           p_value = p_value, reject_at_005 = reject_null)`,
          explanation: "The \\(p\\)-value is the probability, under \\(H_0\\) and its assumptions, of a statistic at least as far from zero as the one observed, in either direction. It is not the probability that \\(H_0\\) is true. We know this simulated population mean is 53, but the test calculation uses the null value 50.",
          checks: ['length(observations) == n', 'p_value >= 0 && p_value <= 1', 'identical(reject_null, abs(observed_z) > critical_z)'],
        },
        {
          id: 'testing-alpha-exercise', title: 'Exercise: apply a stricter threshold', kind: 'exercise',
          code: `exercise_alpha <- 0.01
# TODO: calculate exercise_cutoff = qnorm(1 - exercise_alpha/2).
# TODO: calculate exercise_reject using the existing p_value.
# TODO: print both values.`,
          answer: `exercise_alpha <- 0.01
exercise_cutoff <- qnorm(1 - exercise_alpha / 2)
exercise_reject <- p_value < exercise_alpha
data.frame(alpha = exercise_alpha, cutoff = exercise_cutoff,
           reject = exercise_reject)`,
          explanation: "This exercise compares prespecified rules using the same data. A smaller \\(\\alpha\\) requires stronger evidence to reject. In a study, choose the threshold in advance; selecting it after inspecting the result changes the procedure being evaluated.",
          checks: ['exercise_cutoff > critical_z', 'identical(exercise_reject, abs(observed_z) > exercise_cutoff)'],
        },
      ],
    },
    {
      id: 'testing-null-experiments', title: 'When the null is true: false positives',
      paragraphs: [
        "A Type I error occurs when the test rejects a true null hypothesis. Generate \\(B = 600\\) separate studies under \\(\\mu = 50\\), keeping \\(n = 25\\) and \\(\\sigma = 10\\). The loop repeats sampling and calculation; it does not reuse the same data.",
        "The seed is set once before the loop. `numeric(B)` stores a \\(p\\)-value for each study. Comparing the resulting vector with \\(\\alpha\\) produces `TRUE`/`FALSE` rejection decisions, and `mean()` turns them into a rejection fraction.",
      ],
      chunks: [
        {
          id: 'testing-null-loop', title: 'Simulate 600 studies with no effect', kind: 'example',
          code: `set.seed(5102)
B <- 600
null_p_values <- numeric(B)
for (i in seq_len(B)) {
  null_sample <- rnorm(n, mean = mu0, sd = sigma)
  null_z <- (mean(null_sample) - mu0) / (sigma / sqrt(n))
  null_p_values[i] <- 2 * pnorm(-abs(null_z))
}
null_rejections <- null_p_values < alpha
data.frame(studies = B, false_positives = sum(null_rejections),
           rejection_rate = mean(null_rejections))`,
          explanation: "Every rejection here is a false positive because every study comes from the null population. A rate near 0.05 is expected; zero false positives is not a property of a 5% test.",
          checks: ['length(null_p_values) == 600', 'all(null_p_values >= 0 & null_p_values <= 1)', 'abs(mean(null_rejections) - 0.05) < 0.05'],
        },
        {
          id: 'testing-exact-type-one', title: 'Compare the simulated and exact Type I error rates', kind: 'example',
          code: `exact_type_one <- 2 * pnorm(-critical_z)
null_mc_se <- sqrt(alpha * (1 - alpha) / B)
data.frame(exact_type_one = exact_type_one,
           simulated_type_one = mean(null_rejections),
           monte_carlo_se = null_mc_se)`,
          explanation: "The mathematical rejection probability is exactly \\(\\alpha = 0.05\\) under this continuous normal null model. The Monte Carlo standard error is about 0.009: it describes fluctuations in a 600-study simulation estimate. Simulation illustrates the false-positive rate; it does not prove the exact result.",
          // A 0.05 tolerance is over five null Monte Carlo SEs at B = 600.
          checks: ['abs(exact_type_one - alpha) < 1e-12', 'abs(null_mc_se - sqrt(0.05 * 0.95 / 600)) < 1e-12'],
        },
        {
          id: 'testing-false-positive-exercise', title: 'Exercise: compare thresholds under the null', kind: 'exercise',
          code: `# TODO: create exercise_reject_001 with null_p_values < 0.01.
# TODO: print its false-positive count and rate.
# TODO: compare its count with the count at alpha = 0.05.`,
          answer: `exercise_reject_001 <- null_p_values < 0.01
data.frame(alpha = c(0.01, 0.05),
           false_positives = c(sum(exercise_reject_001), sum(null_rejections)),
           rate = c(mean(exercise_reject_001), mean(null_rejections)))`,
          explanation: "Using the same simulated studies makes the decisions directly comparable. Every rejection at 0.01 must also be a rejection at 0.05; the stricter threshold cannot add false positives in this comparison.",
          checks: ['sum(exercise_reject_001) <= sum(null_rejections)', 'abs(mean(exercise_reject_001) - 0.01) < 0.025'],
        },
      ],
    },
    {
      id: 'testing-power-experiments', title: 'When the null is false: power and missed effects',
      paragraphs: [
        "Now let the true mean be \\(\\mu_1 = 55\\), an effect of \\(\\delta = \\mu_1 - \\mu_0 = 5\\) measurement units. Power is the probability of rejecting \\(H_0\\) for a specified alternative. A Type II error is failure to reject at that alternative; its probability is \\(\\beta=1-\\operatorname{power}\\).",
        "Power depends on the true effect, sample size, variability, test, and threshold. There is no single power value for every possible false null. Failure to reject does not establish that \\(H_0\\) is true.",
      ],
      chunks: [
        {
          id: 'testing-alternative-loop', title: 'Simulate studies with a 5-unit effect', kind: 'example',
          code: `set.seed(5103)
mu1 <- 55
effect <- mu1 - mu0
alternative_p_values <- numeric(B)
for (i in seq_len(B)) {
  alternative_sample <- rnorm(n, mean = mu1, sd = sigma)
  alternative_z <- (mean(alternative_sample) - mu0) / (sigma / sqrt(n))
  alternative_p_values[i] <- 2 * pnorm(-abs(alternative_z))
}
alternative_rejections <- alternative_p_values < alpha
simulated_power <- mean(alternative_rejections)
data.frame(true_mean = mu1, effect_units = effect,
           power_estimate = simulated_power,
           type_two_estimate = 1 - simulated_power)`,
          explanation: "A rejection is now a detection; a non-rejection is a missed effect. The test can miss a real difference because samples fluctuate. These two rates refer specifically to \\(\\mu = 55\\) and the present study design.",
          checks: ['length(alternative_p_values) == B', 'simulated_power > 0.55 && simulated_power < 0.85'],
        },
        {
          id: 'testing-exact-power', title: 'Calculate power from the normal model', kind: 'example',
          code: `shift <- effect / standard_error
# Under mu1, Z is normal with mean shift and standard deviation 1.
# lower.tail = FALSE requests probability ABOVE the supplied value.
exact_power <- pnorm(-critical_z, mean = shift, sd = 1) +
               pnorm(critical_z, mean = shift, sd = 1, lower.tail = FALSE)
power_mc_se <- sqrt(exact_power * (1 - exact_power) / B)
data.frame(standardized_shift = shift, exact_power = exact_power,
           simulated_power = simulated_power, monte_carlo_se = power_mc_se)`,
          explanation: "Under the alternative, the statistic’s distribution shifts by \\(\\frac{\\delta}{\\mathrm{SE}}=2.5\\). Adding the two rejection-tail probabilities gives power of about 0.705. Its complement is the chance of a missed 5-unit effect, not the probability that a non-rejected null is true.",
          // The difference tolerance 0.10 is over five MC SEs at this power.
          checks: ['abs(shift - 2.5) < 1e-12', 'abs(exact_power - 0.7054180011) < 1e-8', 'abs(simulated_power - exact_power) < 0.10'],
        },
        {
          id: 'testing-type-two-exercise', title: 'Exercise: count the missed effects', kind: 'exercise',
          code: `# ! reverses TRUE and FALSE.
# TODO: count sum(!alternative_rejections) as exercise_missed.
# TODO: calculate exercise_beta = exercise_missed/B.
# TODO: print exercise_beta beside 1 - exact_power.`,
          answer: `exercise_missed <- sum(!alternative_rejections)
exercise_beta <- exercise_missed / B
data.frame(missed_effects = exercise_missed, estimated_beta = exercise_beta,
           exact_beta = 1 - exact_power)`,
          explanation: "A Type II error requires a particular true alternative. The false-positive rate was measured at \\(\\mu = 50\\); this missed-effect rate is measured at \\(\\mu = 55\\). They are not complementary probabilities from the same population.",
          checks: ['exercise_missed + sum(alternative_rejections) == B', 'abs(exercise_beta + simulated_power - 1) < 1e-12'],
        },
      ],
    },
    {
      id: 'testing-design', title: 'Change sample size and effect size',
      paragraphs: [
        "The function below packages the same loop. `sample_size` is \\(n\\), `true_mean` determines the effect relative to 50, and repetitions is \\(B\\). Known \\(\\sigma = 10\\) and \\(\\alpha = 0.05\\) remain fixed. Each call returns a single row that `rbind()` can stack.",
        "More repetitions improve the precision of an estimated rejection rate. More observations per study reduce its standard error and change its power. Increasing \\(B\\) is not a substitute for increasing \\(n\\).",
      ],
      chunks: [
        {
          id: 'testing-design-function', title: 'Compare two sample sizes at the same alternative', kind: 'example',
          code: `simulate_test <- function(sample_size, true_mean, repetitions) {
  se <- 10 / sqrt(sample_size)
  cutoff <- qnorm(0.975)
  rejections <- logical(repetitions)
  for (j in seq_len(repetitions)) {
    observed <- mean(rnorm(sample_size, mean = true_mean, sd = 10))
    statistic <- (observed - 50) / se
    rejections[j] <- abs(statistic) > cutoff
  }
  shift <- (true_mean - 50) / se
  model_rate <- pnorm(-cutoff, mean = shift) +
                pnorm(cutoff, mean = shift, lower.tail = FALSE)
  data.frame(n = sample_size, true_mean = true_mean,
             effect = true_mean - 50, repetitions = repetitions,
             estimated_rejection_rate = mean(rejections),
             exact_rejection_rate = model_rate)
}
set.seed(5104)
design_25 <- simulate_test(25, 55, 600)
design_100 <- simulate_test(100, 55, 600)
print(rbind(design_25, design_100), row.names = FALSE)`,
          explanation: "With the same 5-unit effect, \\(n = 100\\) has higher power because its \\(\\mathrm{SE}\\) is smaller. This improvement assumes the same valid sampling mechanism; collecting more biased or dependent observations does not automatically preserve the test’s guarantees.",
          checks: ['design_100$exact_rejection_rate > design_25$exact_rejection_rate', 'abs(design_25$estimated_rejection_rate - design_25$exact_rejection_rate) < 0.10', 'abs(design_100$estimated_rejection_rate - design_100$exact_rejection_rate) < 0.025'],
        },
        {
          id: 'testing-large-null-exercise', title: 'Exercise: does a larger study raise the false-positive rate?', kind: 'exercise',
          code: `set.seed(5105)
# TODO: use simulate_test() with sample_size = 100, true_mean = 50,
# and repetitions = 600. Store the row as exercise_large_null.
# TODO: print the result.`,
          answer: `set.seed(5105)
exercise_large_null <- simulate_test(100, 50, 600)
print(exercise_large_null, row.names = FALSE)`,
          explanation: "The exact null rejection rate stays 0.05 when the test remains calibrated under the model. Larger samples improve power against a fixed nonzero effect; they do not raise \\(\\alpha\\).",
          checks: ['abs(exercise_large_null$exact_rejection_rate - 0.05) < 1e-12', 'abs(exercise_large_null$estimated_rejection_rate - 0.05) < 0.05'],
        },
        {
          id: 'testing-effect-curve', title: 'See rejection rates as the true effect changes', kind: 'example',
          code: `set.seed(5106)
effects <- c(0, 1, 2, 3, 5, 7)
# Start with the first effect, then add rows for the remaining effects.
effect_results <- simulate_test(25, 50 + effects[1], 600)
for (k in 2:length(effects)) {
  next_result <- simulate_test(25, 50 + effects[k], 600)
  effect_results <- rbind(effect_results, next_result)
}
print(effect_results, row.names = FALSE)
# type = "b" draws both points and connecting lines; ylim sets axis limits.
plot(effect_results$effect, effect_results$exact_rejection_rate,
     type = "b", pch = 16, col = "#126861", ylim = c(0, 1),
     xlab = "True effect above 50 (measurement units)",
     ylab = "Rejection probability", main = "Power at n = 25 and alpha = 0.05")
# points() adds simulation estimates; pch = 1 uses open circles.
points(effect_results$effect, effect_results$estimated_rejection_rate, pch = 1)
legend("bottomright", legend = c("Exact model rate", "Simulation estimate"),
       pch = c(16, 1), col = c("#126861", "black"), bty = "n")`,
          explanation: "At effect zero, the rejection probability is the Type I error rate. At each nonzero effect it is power. The full table provides a numerical alternative to the plot. The test is two-sided, so equal-sized negative effects have the same theoretical power in this symmetric model.",
          plotAlt: 'A graph compares exact and simulated rejection probabilities at effects 0, 1, 2, 3, 5, and 7 measurement units for n = 25. The exact rate starts at 0.05 at zero effect and rises with effect size. The printed table gives every effect, sample size, repetition count, and rejection rate shown.',
          checks: ['nrow(effect_results) == 6', 'all(diff(effect_results$exact_rejection_rate) > 0)', 'all(abs(effect_results$estimated_rejection_rate - effect_results$exact_rejection_rate) < 0.10)'],
        },
        {
          id: 'testing-negative-effect-exercise', title: 'Exercise: detect a difference in the other direction', kind: 'exercise',
          code: `set.seed(5107)
# TODO: simulate n = 25, true_mean = 45, repetitions = 600.
# Store the row as exercise_negative_effect and print it.
# TODO: compare its exact rejection rate with design_25.`,
          answer: `set.seed(5107)
exercise_negative_effect <- simulate_test(25, 45, 600)
print(exercise_negative_effect, row.names = FALSE)
data.frame(negative_effect_power = exercise_negative_effect$exact_rejection_rate,
           positive_effect_power = design_25$exact_rejection_rate)`,
          explanation: "The −5 and +5 effects have identical theoretical power for this two-sided normal test. Their simulation estimates can differ because each call uses different random observations.",
          checks: ['abs(exercise_negative_effect$exact_rejection_rate - design_25$exact_rejection_rate) < 1e-12', 'abs(exercise_negative_effect$estimated_rejection_rate - exact_power) < 0.10'],
        },
      ],
    },
    {
      id: 'testing-practical-importance', title: 'A detectable difference may still be unimportant',
      paragraphs: [
        "Statistical significance means a result crosses the chosen rejection threshold. Practical significance asks whether the size and consequences of the difference matter in the application. For this illustrative measurement process, suppose a change smaller than 2 units would not alter a decision; that is a contextual criterion, not a universal statistical rule.",
        "The next calculation holds an observed mean at 50.5 to isolate how the \\(p\\)-value depends on sample size. These rows are hypothetical summaries, not fresh simulated datasets. Effect estimates, uncertainty, and study design deserve attention alongside a \\(p\\)-value.",
      ],
      chunks: [
        {
          id: 'testing-small-effect', title: 'The same small observed effect in two study sizes', kind: 'example',
          code: `reported_mean <- 50.5
study_sizes <- c(25, 10000)
reported_effect <- reported_mean - mu0
reported_z <- reported_effect / (sigma / sqrt(study_sizes))
reported_p <- 2 * pnorm(-abs(reported_z))
practical_threshold <- 2
data.frame(n = study_sizes, observed_effect = reported_effect,
           z = reported_z, p_value = reported_p,
           statistically_significant = reported_p < 0.05,
           reaches_practical_threshold = abs(reported_effect) >= practical_threshold)`,
          explanation: "The observed difference is 0.5 units in both rows. With many observations it can be statistically significant while remaining below the stated 2-unit practical criterion. A small \\(p\\)-value measures incompatibility with the null under the model; it does not measure effect size or importance.",
          checks: ['reported_p[1] > 0.05', 'reported_p[2] < 0.05', 'abs(reported_effect) < practical_threshold'],
        },
        {
          id: 'testing-tiny-effect-exercise', title: 'Exercise: calculate detectability for an even smaller difference', kind: 'exercise',
          code: `exercise_observed_effect <- 0.2
exercise_study_sizes <- c(100, 100000)
# TODO: calculate exercise_z from effect / (sigma/sqrt(n)).
# TODO: calculate two-sided exercise_p_values.
# TODO: print sample size, observed effect, and p-value.`,
          answer: `exercise_observed_effect <- 0.2
exercise_study_sizes <- c(100, 100000)
exercise_z <- exercise_observed_effect / (sigma / sqrt(exercise_study_sizes))
exercise_p_values <- 2 * pnorm(-abs(exercise_z))
data.frame(n = exercise_study_sizes, effect = exercise_observed_effect,
           p_value = exercise_p_values)`,
          explanation: "Only two formula calculations are needed; no 100,000-observation simulation runs here. The effect stays 0.2 units while the standard error shrinks. Whether 0.2 matters needs the application’s units and consequences, not just the test decision.",
          checks: ['exercise_p_values[1] > 0.05', 'exercise_p_values[2] < 0.05', 'length(exercise_p_values) == 2'],
        },
      ],
    },
  ],
  closing: [
    "A test statistic describes departure from \\(H_0\\), and a \\(p\\)-value evaluates that departure using the null sampling distribution. It is not the probability that \\(H_0\\) is true. Failure to reject leaves uncertainty; it does not establish equality or the absence of a meaningful effect.",
    "Type I error is rejection under a true null. Power is rejection at a specified alternative; Type II error is its complement at that alternative. Our loops estimate these operating characteristics by repeated sampling, while the normal model provides their exact probabilities under the stated assumptions.",
    "The known-\\(\\sigma\\) normal test is a deliberately transparent starting point. Estimating \\(\\sigma\\), dependent observations, biased recruitment, multiple testing, or choosing analyses after seeing results require additional methods and reasoning. A useful conclusion considers effect size, uncertainty, practical consequences, and design as well as a rejection decision.",
  ],
};
