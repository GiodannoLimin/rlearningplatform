import type { Notebook } from './schema';

export const distributions: Notebook = {
  id: 'distributions', number: 2, title: 'Distributions, expectation, and variability',
  question: 'What does a distribution tell us about the values an experiment can produce?',
  estimatedMinutes: '60–75',
  prerequisites: ["Notebook 0: objects, functions, vectors, and random sampling.", "Notebook 1: events, probability, independence, and simulation estimates."],
  introduction: [
    "A mathematical random variable assigns a number to each outcome of a random experiment. Its distribution tells us which numerical values are possible and how probability is allocated among them. An R object stores a particular value or collection of simulated values; it is not itself the mathematical random variable.",
    "We will connect four questions about a distribution: probability at or below a value, a cutoff for a desired probability, simulated observations, and summaries of center and variability. Every model below states its parameters and assumptions before calling an R distribution function.",
  ],
  sections: [
    {
      id: 'dist-payout', title: 'A random variable and its long-run summaries',
      paragraphs: [
        "A fair coin selects a payout \\(X\\): zero dollars for tails and three dollars for heads. \\(X\\) is discrete because it takes a countable set of values, here just 0 and 3. Its probability mass function assigns probability \\(\\frac{1}{2}\\) to each of those values.",
        "The expected value \\(E(X)\\) is the probability-weighted average: sum each value times its probability. Variance \\(\\operatorname{Var}(X)\\) is the probability-weighted average squared distance from \\(E(X)\\); its units are squared dollars. Standard deviation is the square root of variance, in dollars.",
      ],
      chunks: [
        {
          id: 'dist-exact-moments', title: 'An expected value that cannot be an individual payout', kind: 'example',
          code: `payout_values <- c(0, 3)
payout_probabilities <- c(0.5, 0.5)
payout_mean <- sum(payout_values * payout_probabilities)
payout_variance <- sum((payout_values - payout_mean)^2 * payout_probabilities)
data.frame(payout_dollars = payout_values, probability = payout_probabilities)
data.frame(expected_dollars = payout_mean, variance_dollars_squared = payout_variance,
           standard_deviation_dollars = sqrt(payout_variance))`,
          explanation: "The expected payout is $1.50, although each actual payout is $0 or $3. An expectation describes a weighted center, not necessarily the most common or even a possible observation. The variance is 2.25 squared dollars and the standard deviation is $1.50.",
          checks: ['sum(payout_probabilities) == 1', 'payout_mean == 1.5', 'payout_variance == 2.25', '!payout_mean %in% payout_values'],
        },
        {
          id: 'dist-change-payout', title: 'Exercise: favor the larger payout', kind: 'exercise',
          code: `exercise_probabilities <- c(0.25, 0.75)
# TODO: calculate exercise_mean for the same payout_values.
# TODO: calculate exercise_variance around the new mean.
# TODO: print the mean and variance with their units.`,
          answer: `exercise_probabilities <- c(0.25, 0.75)
exercise_mean <- sum(payout_values * exercise_probabilities)
exercise_variance <- sum((payout_values - exercise_mean)^2 * exercise_probabilities)
data.frame(expected_dollars = exercise_mean, variance_dollars_squared = exercise_variance)`,
          explanation: "The new expected payout is $2.25, still not a possible individual payout. Recalculate distances from the new center when calculating variance; changing the probabilities can change both center and spread.",
          checks: ['exercise_mean == 2.25', 'exercise_variance == 1.6875'],
        },
      ],
    },
    {
      id: 'dist-binomial-model', title: 'Count successes in a fixed number of trials',
      paragraphs: [
        "Let \\(K\\) count successes in \\(n = 10\\) independent trials, each with the same success probability \\(p = 0.3\\). Then \\(K\\) has a binomial distribution, written \\(\\operatorname{Binomial}(n,p)\\). Its possible values are 0 through \\(n\\); \\(E(K) = np\\) and \\(\\operatorname{Var}(K)=np(1-p)\\).",
        "In R, size names \\(n\\) and prob names \\(p\\). `dbinom(k, size, prob)` gives \\(P(K = k)\\), a probability mass; `pbinom(k, size, prob)` gives the cumulative probability \\(P(K \\le  k)\\). The initial d and \\(p\\) identify different questions about the same distribution.",
      ],
      chunks: [
        {
          id: 'dist-binomial-mass', title: 'Read a complete binomial probability table', kind: 'example',
          code: `trial_count <- 10
success_probability <- 0.3
success_counts <- 0:trial_count
binomial_mass <- dbinom(success_counts, size = trial_count,
                       prob = success_probability)
data.frame(successes = success_counts, probability = binomial_mass)
binomial_mean <- trial_count * success_probability
binomial_variance <- trial_count * success_probability * (1 - success_probability)
data.frame(total_probability = sum(binomial_mass),
           expected_successes = binomial_mean, variance = binomial_variance)`,
          explanation: "Every table entry is a probability, and the entries sum to one apart from possible rounding. The expectation is three successes, with variance 2.1. The binomial model would need reconsideration if trials influenced each other or had different success probabilities.",
          checks: ['abs(sum(binomial_mass) - 1) < 1e-12', 'binomial_mean == 3', 'abs(binomial_variance - 2.1) < 1e-12', 'abs(sum(success_counts * binomial_mass) - binomial_mean) < 1e-12'],
        },
        {
          id: 'dist-binomial-tail', title: 'Exercise: the probability of at least four successes', kind: 'exercise',
          code: `# pbinom(k, ...) includes k: it returns P(K <= k).
# TODO: calculate exercise_at_least_four as 1 - pbinom(3, ...).
# TODO: also sum binomial_mass for success_counts >= 4.
# TODO: print both answers.`,
          answer: `exercise_at_least_four <- 1 - pbinom(3, size = trial_count,
                                    prob = success_probability)
exercise_summed_tail <- sum(binomial_mass[success_counts >= 4])
print(c(cumulative_method = exercise_at_least_four, sum_method = exercise_summed_tail))`,
          explanation: "The complement of “at least four” is “at most three,” so the cumulative cutoff is three. Summing the individual masses from four through ten answers the same question.",
          checks: ['abs(exercise_at_least_four - exercise_summed_tail) < 1e-12', 'abs(exercise_at_least_four - 0.3503892816) < 1e-10'],
        },
      ],
    },
    {
      id: 'dist-binomial-experiments', title: 'Compare theory with simulated counts',
      paragraphs: [
        "The r prefix generates random observations: `rbinom()` below draws 4,000 simulated counts, each from an experiment with ten trials and success probability 0.3. The first argument counts simulated experiments; size counts trials inside each experiment.",
        "`mean()` estimates the expected count and `var()` estimates its variance. `var()` calculates sample variance using a denominator one less than the number of observations, while our exact probability-weighted variance above used the full distribution.",
      ],
      chunks: [
        {
          id: 'dist-binomial-simulation', title: 'Compare a theoretical distribution with simulated counts', kind: 'example',
          code: `set.seed(2201)
simulated_counts <- rbinom(4000, size = trial_count, prob = success_probability)
estimated_count_mean <- mean(simulated_counts)
estimated_count_variance <- var(simulated_counts)
data.frame(quantity = c("Mean", "Variance"),
           theoretical = c(binomial_mean, binomial_variance),
           simulated = c(estimated_count_mean, estimated_count_variance))`,
          explanation: "The simulated summaries should be close to three and 2.1, with Monte Carlo variability. More simulated experiments improve estimation of this distribution without changing the ten trials inside each experiment.",
          // Mean MC SE=sqrt(2.1/4000)=.0229: tolerance .13 >5 SEs.
          // For this binomial, the fourth central moment is 12.684; the sample
          // variance SE is approximately sqrt((12.684 - 2.1^2)/4000)=.0455.
          checks: ['length(simulated_counts) == 4000', 'all(simulated_counts %in% 0:10)', 'abs(estimated_count_mean - 3) < 0.13', 'abs(estimated_count_variance - 2.1) < 0.3'],
        },
        {
          id: 'dist-binomial-new-parameter', title: 'Exercise: change success probability to 0.6', kind: 'exercise',
          code: `set.seed(2202)
exercise_p <- 0.6
# TODO: generate exercise_counts for 4000 experiments with size = 10.
# TODO: compare their mean and variance with 10*p and 10*p*(1-p).`,
          answer: `set.seed(2202)
exercise_p <- 0.6
exercise_counts <- rbinom(4000, size = 10, prob = exercise_p)
data.frame(quantity = c("Mean", "Variance"),
           theoretical = c(10 * exercise_p, 10 * exercise_p * (1 - exercise_p)),
           simulated = c(mean(exercise_counts), var(exercise_counts)))`,
          explanation: "The expected count becomes six and the variance becomes 2.4. Binomial variability depends on both parameters: moving \\(p\\) toward \\(\\frac{1}{2}\\) increases variance when the number of trials stays fixed.",
          // Mean SE=.0245; variance SE≈.0524. Both tolerances exceed 6 SEs.
          checks: ['length(exercise_counts) == 4000', 'abs(mean(exercise_counts) - 6) < 0.15', 'abs(var(exercise_counts) - 2.4) < 0.35'],
        },
      ],
    },
    {
      id: 'dist-poisson-model', title: 'Count arrivals during a fixed interval',
      paragraphs: [
        "Suppose arrivals follow a Poisson process: the average rate is constant, counts in disjoint time intervals are independent, and simultaneous arrivals have probability zero. For a one-minute interval with an average of three arrivals, the count \\(N\\) has a Poisson distribution with parameter \\(\\lambda = 3\\).",
        "The parameter \\(\\lambda\\) is the expected count in the chosen interval, not the number of simulation repetitions. \\(E(N) = \\lambda\\) and \\(\\operatorname{Var}(N) = \\lambda\\). Possible counts are 0, 1, 2, … without a fixed upper bound; `dpois()` gives a mass, `ppois()` a cumulative probability, and `rpois()` simulated counts.",
        "`plot(..., type = \"h\")` draws a vertical line at each plotted count, and `points()` adds a dot at its probability. The plot and table below show the same nine masses.",
      ],
      chunks: [
        {
          id: 'dist-poisson-mass', title: 'A Poisson distribution has an infinite tail', kind: 'example',
          code: `arrival_mean <- 3
shown_counts <- 0:8
arrival_mass <- dpois(shown_counts, lambda = arrival_mean)
arrival_table <- data.frame(arrivals_in_one_minute = shown_counts,
                            probability = arrival_mass)
plot(shown_counts, arrival_mass, type = "h", lwd = 3,
     xlab = "Arrivals in one minute", ylab = "Probability mass",
     main = "Poisson arrivals: mean 3 per minute")
points(shown_counts, arrival_mass, pch = 16)
print(arrival_table, row.names = FALSE)
unshown_tail <- 1 - ppois(8, lambda = arrival_mean)
print(c(probability_above_8 = unshown_tail))`,
          explanation: "Each vertical line represents probability at one integer count; the table supplies every plotted mass. Counts above eight are possible but not drawn. The printed tail probability accounts for their combined probability, so the displayed masses plus the tail sum to one.",
          plotAlt: 'Poisson probability masses for 0 through 8 arrivals in one minute, with mean 3. The adjacent nine-row table gives each plotted mass; a separate number gives the omitted probability of more than 8 arrivals.',
          checks: ['nrow(arrival_table) == 9', 'abs(sum(arrival_mass) + unshown_tail - 1) < 1e-12', 'unshown_tail > 0'],
        },
        {
          id: 'dist-poisson-two-minutes', title: 'Exercise: observe for two minutes', kind: 'exercise',
          code: `exercise_minutes <- 2
# TODO: calculate exercise_lambda from 3 arrivals per minute.
# TODO: use dpois() to calculate exercise_no_arrivals in two minutes.
# TODO: print the interval length, expected count, and probability.`,
          answer: `exercise_minutes <- 2
exercise_lambda <- 3 * exercise_minutes
exercise_no_arrivals <- dpois(0, lambda = exercise_lambda)
data.frame(minutes = exercise_minutes, expected_arrivals = exercise_lambda,
           probability_of_zero = exercise_no_arrivals)`,
          explanation: "At a constant rate of three per minute, the two-minute expected count is six. A longer observation interval changes the model parameter; it makes zero arrivals less likely. This scaling relies on the stated Poisson-process assumptions.",
          checks: ['exercise_lambda == 6', 'abs(exercise_no_arrivals - 0.00247875217666636) < 1e-12', 'exercise_no_arrivals < dpois(0, lambda = 3)'],
        },
        {
          id: 'dist-poisson-simulation', title: 'Simulate many one-minute intervals', kind: 'example',
          code: `set.seed(2203)
arrival_counts <- rpois(3000, lambda = arrival_mean)
data.frame(quantity = c("Mean count", "Variance", "Probability of zero"),
           theoretical = c(arrival_mean, arrival_mean, dpois(0, arrival_mean)),
           simulated = c(mean(arrival_counts), var(arrival_counts),
                         mean(arrival_counts == 0)))`,
          explanation: "`rpois()` draws counts directly from the model. The simulated mean and variance both approach three, but are not required to be identical. Real arrival data can have clustering or a changing rate; a Poisson model does not become appropriate merely because R can simulate it.",
          // Mean SE=sqrt(3/3000)=.0316; sample variance SE≈sqrt(21/3000)=.0837.
          // Zero-count fraction SE≈.00397. Tolerances exceed five respective SEs.
          checks: ['length(arrival_counts) == 3000', 'all(arrival_counts >= 0)', 'abs(mean(arrival_counts) - 3) < 0.16', 'abs(var(arrival_counts) - 3) < 0.5', 'abs(mean(arrival_counts == 0) - dpois(0, 3)) < 0.025'],
        },
        {
          id: 'dist-poisson-event', title: 'Exercise: at least one arrival at a lower rate', kind: 'exercise',
          code: `set.seed(2204)
exercise_rate <- 1
# TODO: calculate exercise_at_least_one with 1 - ppois(0, ...).
# TODO: generate 3000 counts as exercise_arrivals.
# TODO: compare mean(exercise_arrivals >= 1) with the exact probability.`,
          answer: `set.seed(2204)
exercise_rate <- 1
exercise_at_least_one <- 1 - ppois(0, lambda = exercise_rate)
exercise_arrivals <- rpois(3000, lambda = exercise_rate)
data.frame(exact = exercise_at_least_one,
           simulated = mean(exercise_arrivals >= 1))`,
          explanation: "For a one-minute expected count of one, the chance of at least one arrival is about 0.632. An expected count of one does not mean that one arrival is certain.",
          // Indicator MC SE≈.00881; tolerance .055 exceeds six SEs.
          checks: ['abs(exercise_at_least_one - 0.632120558828558) < 1e-12', 'abs(mean(exercise_arrivals >= 1) - exercise_at_least_one) < 0.055'],
        },
      ],
    },
    {
      id: 'dist-normal-density', title: 'For a continuous variable, probability is area',
      paragraphs: [
        "Now model a measurement \\(X\\) with a normal distribution: mean \\(\\mu = 100\\) measurement units and standard deviation \\(\\sigma = 15\\) units. Its variance is \\(\\sigma^2 = 225\\) squared units. This continuous model permits every real value, although values far from the mean have very small probabilities.",
        "`dnorm(x, mean, sd)` returns density height, not \\(P(X = x)\\). Density has units of inverse measurement units; probability is area over an interval. `pnorm(b) - pnorm(a)`, with the same mean and sd arguments, calculates \\(P(a \\le  X \\le  b)\\); a and b are the lower and upper endpoints.",
        "`seq(70, 130, by = 5)` supplies a grid of measurements in steps of five. The plot joins their density heights with lines and dots; `rnorm()` later generates individual measurements from the same model.",
      ],
      chunks: [
        {
          id: 'dist-normal-curve', title: 'Compare density heights with an interval probability', kind: 'example',
          code: `measurement_mean <- 100
measurement_sd <- 15
measurement_grid <- seq(70, 130, by = 5)
density_height <- dnorm(measurement_grid, mean = measurement_mean,
                        sd = measurement_sd)
density_table <- data.frame(measurement_units = measurement_grid,
                           density_per_unit = density_height)
plot(measurement_grid, density_height, type = "b", pch = 16,
     xlab = "Measurement (units)", ylab = "Density (per unit)",
     main = "Normal density: mean 100, standard deviation 15")
print(density_table, row.names = FALSE)
between_90_110 <- pnorm(110, 100, 15) - pnorm(90, 100, 15)
print(c(probability_between_90_and_110 = between_90_110))`,
          explanation: "The table lists every point joined in the plotted density. The interval probability is about 0.495; it is not a sum of these heights. Under the continuous model, the probability of exactly 100 is zero despite its positive density; rounded instruments instead record ranges of underlying values.",
          plotAlt: 'Normal density sampled at measurements 70 through 130 in steps of 5, symmetric around mean 100. The 13-row table gives every plotted density; the separate interval probability describes measurements from 90 to 110.',
          checks: ['nrow(density_table) == 13', 'abs(between_90_110 - 0.495014924906154) < 1e-12', 'which.max(density_height) == 7', 'all(density_height > 0)'],
        },
        {
          id: 'dist-density-above-one', title: 'Exercise: a density can be greater than one', kind: 'exercise',
          code: `exercise_narrow_sd <- 0.1
# TODO: calculate exercise_peak with dnorm() at mean = 100.
# TODO: calculate exercise_central_probability from 99.9 to 100.1.
# TODO: print the height and the interval probability separately.`,
          answer: `exercise_narrow_sd <- 0.1
exercise_peak <- dnorm(100, mean = 100, sd = exercise_narrow_sd)
exercise_central_probability <- pnorm(100.1, 100, exercise_narrow_sd) -
                                pnorm(99.9, 100, exercise_narrow_sd)
data.frame(density_per_unit = exercise_peak,
           probability_between_99_9_and_100_1 = exercise_central_probability)`,
          explanation: "A much narrower normal distribution has peak density about 3.99 per unit. That is allowed: its total area, rather than its maximum height, must equal one. The probability within one standard deviation of the mean remains about 0.683.",
          checks: ['exercise_peak > 1', 'abs(exercise_central_probability - 0.682689492137086) < 1e-10', 'exercise_central_probability >= 0 & exercise_central_probability <= 1'],
        },
        {
          id: 'dist-normal-simulation', title: 'Compare normal theory with simulated measurements', kind: 'example',
          code: `set.seed(2205)
measurements <- rnorm(5000, mean = measurement_mean, sd = measurement_sd)
data.frame(quantity = c("Mean (units)", "Variance (squared units)", "P(90 <= X <= 110)"),
           theoretical = c(100, 15^2, between_90_110),
           simulated = c(mean(measurements), var(measurements),
                         mean(measurements >= 90 & measurements <= 110)))`,
          explanation: "The 5,000 values are individual measurements from the chosen distribution. Their mean estimates \\(\\mu\\); their sample variance estimates \\(\\sigma^2\\). These simulated summaries fluctuate across seeds. They are not the sampling distribution of the mean, which the next notebook will construct by repeating whole samples.",
          // Normal sample mean SE=15/sqrt(5000)=.212; variance SE=225*sqrt(2/4999)=4.50.
          // The indicator fraction SE is at most .00708. Tolerances exceed five SEs.
          checks: ['length(measurements) == 5000', 'abs(mean(measurements) - 100) < 1.2', 'abs(var(measurements) - 225) < 25', 'abs(mean(measurements >= 90 & measurements <= 110) - between_90_110) < 0.04'],
        },
      ],
    },
    {
      id: 'dist-quantiles', title: 'Ask for the value at a probability cutoff',
      paragraphs: [
        "A quantile reverses a cumulative-probability question. For a continuous normal distribution, `qnorm(p, mean, sd)` gives the value with proportion \\(p\\) below it. The 0.5 quantile is the median; the 0.025 and 0.975 quantiles bound a central 95% range of individual measurements.",
        "R uses the same family of prefixes: d for mass (discrete) or density (continuous), \\(p\\) for cumulative probability, q for a quantile, and r for random generation. For a discrete distribution, q returns the smallest supported value whose cumulative probability is at least the requested level; jumps mean exact equality is not always possible.",
      ],
      chunks: [
        {
          id: 'dist-quantile-cutoffs', title: 'Find and check probability cutoffs', kind: 'example',
          code: `probability_levels <- c(0.025, 0.5, 0.975)
normal_cutoffs <- qnorm(probability_levels, mean = 100, sd = 15)
data.frame(probability_below = probability_levels, cutoff_units = normal_cutoffs,
           cumulative_check = pnorm(normal_cutoffs, mean = 100, sd = 15))
binomial_cutoff <- qbinom(0.95, size = 10, prob = 0.3)
data.frame(count_cutoff = binomial_cutoff,
           cumulative_at_cutoff = pbinom(binomial_cutoff, 10, 0.3),
           cumulative_one_below = pbinom(binomial_cutoff - 1, 10, 0.3))`,
          explanation: "The normal central 95% range is approximately 70.60 to 129.40 measurement units. It describes individual values from a known population distribution, not a 95% confidence interval for an unknown mean. The binomial 95th percentile is five: its cumulative probability crosses 0.95 rather than landing exactly on it.",
          checks: ['max(abs(pnorm(normal_cutoffs, 100, 15) - probability_levels)) < 1e-12', 'normal_cutoffs[2] == 100', 'binomial_cutoff == 5', 'pbinom(binomial_cutoff, 10, 0.3) >= 0.95', 'pbinom(binomial_cutoff - 1, 10, 0.3) < 0.95'],
        },
        {
          id: 'dist-central-eighty', title: 'Exercise: locate the central 80% of measurements', kind: 'exercise',
          code: `# A central 80% range leaves 10% in each tail.
# TODO: use qnorm(c(0.10, 0.90), ...) to create exercise_cutoffs.
# TODO: use pnorm() to calculate exercise_probability between them.
# TODO: compare the width with the central 95% range above.`,
          answer: `exercise_cutoffs <- qnorm(c(0.10, 0.90), mean = 100, sd = 15)
exercise_probability <- pnorm(exercise_cutoffs[2], 100, 15) -
                        pnorm(exercise_cutoffs[1], 100, 15)
exercise_width <- exercise_cutoffs[2] - exercise_cutoffs[1]
data.frame(lower = exercise_cutoffs[1], upper = exercise_cutoffs[2],
           probability = exercise_probability, width = exercise_width)
print(c(width_80 = exercise_width, width_95 = normal_cutoffs[3] - normal_cutoffs[1]))`,
          explanation: "The central 80% range is narrower because it excludes more of the distribution’s tails. This is an exact model calculation using quantiles, so no seed or Monte Carlo tolerance is needed apart from floating-point rounding.",
          checks: ['abs(exercise_probability - 0.8) < 1e-12', 'exercise_cutoffs[1] < 100 & exercise_cutoffs[2] > 100', 'exercise_width < normal_cutoffs[3] - normal_cutoffs[1]'],
        },
      ],
    },
  ],
  closing: [
    "A distribution connects a random mechanism to numerical values. Discrete masses are probabilities at individual values; a continuous density describes how probability accumulates over intervals. Expectation and variance summarize center and variability, but do not replace the distribution itself.",
    "Parameters determine which distribution we mean: binomial trial count and success probability, Poisson expected count for a specified interval, or normal mean and standard deviation. In R, d, \\(p\\), q, and r change the question being asked, not the assumptions of the model.",
    "Exact formulas and distribution functions describe the stipulated model; simulations provide numerical evidence about its behavior. More simulated observations improve the precision of estimated summaries. Next we will draw repeated samples and study a new random variable: the statistic calculated from each sample.",
  ],
};
