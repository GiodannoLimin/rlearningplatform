import type { Notebook } from './schema';

export const sampling: Notebook = {
  id: 'sampling-and-clt',
  number: 3,
  title: 'Sampling and the central limit theorem',
  question: 'Why can averages be predictable when individual observations are not?',
  estimatedMinutes: '50–70',
  prerequisites: [
    "Notebook 0: vectors, logical indexing, loops, functions, and reproducible seeds.",
    "Notebook 2: distributions, expected value, variance, and quantiles.",
  ],
  introduction: [
    "A population distribution describes individual observations. One sample is a set of observations from that population. A statistic is a number calculated from that sample. Its sampling distribution describes how that number varies across fresh samples collected by the same procedure.",
    "Our first synthetic model describes waiting times in minutes: independent exponential observations with rate \\(\\lambda = 0.1\\) per minute. The population mean is \\(\\mu=\\frac{1}{\\lambda}=10\\) minutes, its standard deviation is \\(\\sigma=\\frac{1}{\\lambda}=10\\) minutes, and its variance is \\(\\sigma^2 = 100\\) minutes squared. This is a right-skewed distribution with finite variance.",
    "An R object stores a realized sample or a calculated value; a mathematical random variable describes what could vary before sampling. Run the worked examples in order so the objects needed by later chunks exist.",
  ],
  sections: [
    {
      id: 'sampling-population',
      title: 'Start with individual waiting times',
      paragraphs: [
        "`rexp(n, rate)` generates \\(n\\) independent exponential observations. Here the mean is 10 minutes, so rate is \\(\\frac{1}{10}\\), not 10. A collection of simulated observations illustrates the model; it is not the full theoretical population.",
        "`quantile(x, probs)` reports sample quantiles at the requested proportions. The median separates the lower and upper halves of a distribution; in this skewed model it is smaller than the mean.",
      ],
      chunks: [
        {
          id: 'sampling-individual-waits', title: 'Inspect the skewed population model', kind: 'example',
          code: `set.seed(3101)
mu <- 10
sigma <- 10
rate <- 1 / mu
individual_waits <- rexp(2000, rate = rate)
data.frame(quantity = c("mean", "median", "standard deviation"),
           theoretical = c(mu, qexp(0.5, rate = rate), sigma),
           simulated = c(mean(individual_waits),
                         quantile(individual_waits, 0.5),
                         sd(individual_waits)))`,
          explanation: "A few large waits pull the mean above the median. The sample summaries approach the model quantities as the number of simulated individual observations grows, but they are not required to match exactly.",
          checks: ['length(individual_waits) == 2000', 'abs(mean(individual_waits) - mu) < 1', 'qexp(0.5, rate = rate) < mu'],
        },
        {
          id: 'sampling-change-rate', title: 'Exercise: change the population mean', kind: 'exercise',
          code: `set.seed(3102)
exercise_mu <- 5
# TODO: define exercise_rate for a mean wait of 5 minutes.
# TODO: draw 2000 waits as exercise_waits and print their mean.`,
          answer: `set.seed(3102)
exercise_mu <- 5
exercise_rate <- 1 / exercise_mu
exercise_waits <- rexp(2000, rate = exercise_rate)
mean(exercise_waits)`,
          explanation: "Halving the mean requires doubling the rate. This changes the population model itself; it does not change the number of observations in a sample.",
          checks: ['abs(exercise_rate - 0.2) < 1e-12', 'length(exercise_waits) == 2000', 'abs(mean(exercise_waits) - 5) < 0.5'],
        },
      ],
    },
    {
      id: 'sampling-one-study', title: 'One sample produces one statistic',
      paragraphs: [
        "Let \\(X_1,\\ldots,X_n\\) represent \\(n\\) independent waits from the same population; \\(n\\) is the sample size. The sample mean is \\(\\bar{X}=\\frac{X_1+\\cdots+X_n}{n}\\). After sampling, `mean(waits)` calculates its observed value.",
        "`sd(waits)` measures spread among the individual observations in this sample. It is not the spread of means across repeated samples.",
      ],
      chunks: [
        {
          id: 'sampling-single-sample', title: 'Collect 25 waits and calculate their mean', kind: 'example',
          code: `set.seed(3103)
n <- 25
waits <- rexp(n, rate = rate)
print(waits)
sample_mean <- mean(waits)
data.frame(sample_size = n, sample_mean = sample_mean,
           individual_sample_sd = sd(waits), population_mean = mu)`,
          explanation: "There are 25 observations but only one sample mean. Another sample of 25 usually produces another mean. The population mean stays fixed at 10 minutes.",
          checks: ['length(waits) == 25', 'abs(sample_mean - sum(waits) / n) < 1e-12'],
        },
        {
          id: 'sampling-median-exercise', title: 'Exercise: calculate a different statistic', kind: 'exercise',
          code: `# median() calculates the middle value of a sorted sample.
# TODO: calculate exercise_median from waits.
# TODO: print the sample median and sample mean side by side.`,
          answer: `exercise_median <- median(waits)
data.frame(sample_median = exercise_median, sample_mean = mean(waits))`,
          explanation: "Both numbers are statistics of the same sample. The median estimates the population median, which is about 6.93 minutes here; it is not generally an estimator of the population mean.",
          checks: ['abs(exercise_median - median(waits)) < 1e-12'],
        },
      ],
    },
    {
      id: 'sampling-repeat-study', title: 'Build a sampling distribution',
      paragraphs: [
        "Repeat the whole study \\(B = 600\\) times, drawing \\(n = 25\\) fresh waits each time. `numeric(B)` makes storage for one mean per study, and `seq_len(B)` supplies the loop indices 1 through \\(B\\).",
        "The standard error of a statistic is its standard deviation across repeated samples. For an independent, identically distributed sample with population standard deviation \\(\\sigma\\), the sample mean has \\(\\mathrm{SE} = \\frac{\\sigma}{\\sqrt{n}}\\). Here `sqrt()` computes the square root.",
      ],
      chunks: [
        {
          id: 'sampling-mean-loop', title: 'Keep one mean from each of 600 samples', kind: 'example',
          code: `set.seed(3104)
B <- 600
sample_means <- numeric(B)
for (i in seq_len(B)) {
  fresh_waits <- rexp(n, rate = rate)
  sample_means[i] <- mean(fresh_waits)
}
theoretical_se <- sigma / sqrt(n)
data.frame(population_mean = mu,
           mean_of_sample_means = mean(sample_means),
           theoretical_se = theoretical_se,
           simulated_se = sd(sample_means),
           empirical_bias = mean(sample_means) - mu)`,
          explanation: "The 600 stored means approximate the sampling distribution. The sample mean is mathematically unbiased under this sampling model: its expected value is \\(\\mu\\). The small empirical bias in a finite simulation is Monte Carlo variability, not evidence that the theoretical bias is nonzero.",
          // The mean-of-means has SE 2/sqrt(600); 0.5 allows over six MC SEs.
          checks: ['length(sample_means) == 600', 'abs(theoretical_se - 2) < 1e-12', 'abs(mean(sample_means) - mu) < 0.5', 'abs(sd(sample_means) - theoretical_se) < 0.4'],
        },
        {
          id: 'sampling-distribution-plot', title: 'Compare observations with sample means', kind: 'example',
          code: `# par(mfrow = c(1, 2)) places two plots beside each other.
old_settings <- par(mfrow = c(1, 2))
# breaks sets the approximate bin count; xlim sets axis limits.
# xlab labels the horizontal axis; main provides a title.
hist(individual_waits, breaks = 30, xlim = c(0, 70),
     main = "Individual waits", xlab = "Waiting time (minutes)",
     col = "#90BBB1", border = "white")
hist(sample_means, breaks = 20, xlim = c(0, 70),
     main = "Means of 25 waits", xlab = "Sample mean (minutes)",
     col = "#90BBB1", border = "white")
par(old_settings)
# This table is a numerical alternative, using the same units.
probs <- c(0.1, 0.25, 0.5, 0.75, 0.9)
plot_summary <- data.frame(proportion = probs,
  individual_wait_quantile = quantile(individual_waits, probs),
  sample_mean_quantile = quantile(sample_means, probs))
print(plot_summary, row.names = FALSE)`,
          explanation: "Both horizontal axes use the same minute scale. Individual waits remain skewed and widely spread; sample means cluster more tightly around 10. The printed quantiles show this difference without requiring the plots. The theoretical exponential population extends beyond the plotted range.",
          plotAlt: 'Two histograms on the same 0–70 minute horizontal scale compare skewed individual exponential waits with more concentrated means of 25 waits. A printed table supplies the 10th, 25th, 50th, 75th, and 90th percentiles for both collections, in minutes.',
          checks: ['nrow(plot_summary) == 5', 'sd(sample_means) < sd(individual_waits)'],
        },
        {
          id: 'sampling-repetitions-exercise', title: 'Exercise: estimate the Monte Carlo uncertainty', kind: 'exercise',
          code: `# The average of B independent sample means has SE = theoretical_se/sqrt(B).
# TODO: calculate exercise_mc_se for B = 600.
# TODO: calculate exercise_mc_se_larger for B = 2400.
# TODO: print both and their ratio.`,
          answer: `exercise_mc_se <- theoretical_se / sqrt(B)
exercise_mc_se_larger <- theoretical_se / sqrt(2400)
data.frame(repetitions = c(B, 2400),
           monte_carlo_se = c(exercise_mc_se, exercise_mc_se_larger))
exercise_mc_se / exercise_mc_se_larger`,
          explanation: "Quadrupling the number of simulated studies halves uncertainty in the simulation’s average. It does not reduce the \\(\\mathrm{SE}\\) of one study’s mean: each study still has \\(n = 25\\) and \\(\\mathrm{SE} = 2\\) minutes.",
          checks: ['abs(exercise_mc_se - 2 / sqrt(600)) < 1e-12', 'abs(exercise_mc_se / exercise_mc_se_larger - 2) < 1e-12'],
        },
      ],
    },
    {
      id: 'sampling-size-and-clt', title: 'Change the sample size, not the population',
      paragraphs: [
        "The central limit theorem says that, for independent observations with the same distribution, finite mean \\(\\mu\\), and finite positive variance \\(\\sigma^2\\), the standardized mean \\(\\frac{\\bar{X}-\\mu}{\\sigma/\\sqrt{n}}\\) approaches a standard normal distribution as \\(n\\) grows. Equivalently, the mean is approximately normal with center \\(\\mu\\) and \\(\\mathrm{SE}\\) \\(\\frac{\\sigma}{\\sqrt{n}}\\) for sufficiently large \\(n\\).",
        "How large is sufficient depends on the population shape and the accuracy needed; there is no universal “\\(n = 30\\)” guarantee. The theorem concerns the sampling distribution of a mean. The original exponential population does not become normal.",
        "This function reuses our explicit loop and returns the simulated means. Without an explicit `return()`, an R function returns its last expression, here means. Inputs `sample_size` and repetitions control different parts of the experiment. `rbind()` stacks the comparison rows; `length()` counts values.",
      ],
      chunks: [
        {
          id: 'sampling-size-function', title: 'Compare means from small and larger samples', kind: 'example',
          code: `simulate_means <- function(sample_size, repetitions) {
  means <- numeric(repetitions)
  for (j in seq_len(repetitions)) {
    means[j] <- mean(rexp(sample_size, rate = 0.1))
  }
  means
}
set.seed(3105)
means_5 <- simulate_means(5, 600)
means_100 <- simulate_means(100, 600)
size_summary <- rbind(
  data.frame(n = 5, estimated_center = mean(means_5),
             estimated_se = sd(means_5), theoretical_se = 10 / sqrt(5)),
  data.frame(n = 100, estimated_center = mean(means_100),
             estimated_se = sd(means_100), theoretical_se = 10 / sqrt(100)))
print(size_summary, row.names = FALSE)
# Central 95% quantiles of a normal approximation for each sample mean.
data.frame(n = c(5, 100),
  normal_lower = 10 + qnorm(0.025) * 10 / sqrt(c(5, 100)),
  normal_upper = 10 + qnorm(0.975) * 10 / sqrt(c(5, 100)),
  simulated_lower = c(quantile(means_5, 0.025), quantile(means_100, 0.025)),
  simulated_upper = c(quantile(means_5, 0.975), quantile(means_100, 0.975)))`,
          explanation: "The \\(n = 100\\) means have a narrower distribution. At \\(n = 5\\), the mean’s distribution still has substantial skew, so the symmetric normal quantiles can be poor approximations. These are quantiles of repeated sample means, not confidence intervals calculated from one observed sample.",
          checks: ['all(abs(size_summary$estimated_center - 10) < 0.8)', 'sd(means_100) < sd(means_5)', 'abs(sd(means_100) - 1) < 0.2'],
        },
        {
          id: 'sampling-size-exercise', title: 'Exercise: investigate samples of 400 waits', kind: 'exercise',
          code: `set.seed(3106)
# TODO: call simulate_means(400, 600) as exercise_means_400.
# TODO: calculate exercise_theoretical_se for n = 400.
# TODO: print the simulated and theoretical standard errors.`,
          answer: `set.seed(3106)
exercise_means_400 <- simulate_means(400, 600)
exercise_theoretical_se <- 10 / sqrt(400)
data.frame(simulated_se = sd(exercise_means_400),
           theoretical_se = exercise_theoretical_se)`,
          explanation: "The theoretical \\(\\mathrm{SE}\\) is half the \\(\\mathrm{SE}\\) at \\(n = 100\\). The observations still come from exactly the same skewed exponential population. More observations improve precision here because the sampling assumptions remain intact.",
          checks: ['length(exercise_means_400) == 600', 'abs(exercise_theoretical_se - 0.5) < 1e-12', 'abs(sd(exercise_means_400) - 0.5) < 0.1'],
        },
        {
          id: 'sampling-sd-se', title: 'Estimate a standard error from one sample', kind: 'example',
          code: `individual_sd <- sd(waits)
estimated_se <- individual_sd / sqrt(length(waits))
data.frame(individual_sample_sd = individual_sd,
           estimated_se_of_mean = estimated_se,
           true_se_of_mean = sigma / sqrt(n))`,
          explanation: "When \\(\\sigma\\) is unknown, \\(\\frac{s}{\\sqrt{n}}\\) estimates the mean’s \\(\\mathrm{SE}\\), where \\(s\\) is the sample standard deviation. SD describes differences among individual waits; \\(\\mathrm{SE}\\) describes variability of the estimated mean across samples. Both use minutes, but they describe different distributions.",
          checks: ['abs(estimated_se * sqrt(n) - individual_sd) < 1e-12', 'estimated_se < individual_sd'],
        },
        {
          id: 'sampling-standardize-exercise', title: 'Exercise: put repeated means on the CLT scale', kind: 'exercise',
          code: `# TODO: subtract 10 from means_100 and divide by 10/sqrt(100).
# Save the vector as exercise_standardized.
# TODO: print its mean and standard deviation.`,
          answer: `exercise_standardized <- (means_100 - 10) / (10 / sqrt(100))
data.frame(center = mean(exercise_standardized),
           standard_deviation = sd(exercise_standardized))`,
          explanation: "The standardized means should have center near 0 and spread near 1. Those two summaries alone cannot establish normality; the theorem supplies the limiting result under its assumptions, and our finite simulation only illustrates behavior.",
          checks: ['length(exercise_standardized) == 600', 'abs(mean(exercise_standardized)) < 0.2', 'abs(sd(exercise_standardized) - 1) < 0.2'],
        },
      ],
    },
    {
      id: 'sampling-biased-selection', title: 'A large sample can precisely estimate the wrong target',
      paragraphs: [
        "For this final experiment, create a fixed synthetic roster of 20,000 waiting times. The target parameter is now the mean of all entries in this finite roster. Keeping the roster fixed makes its true target mean available for comparison.",
        "Suppose recruitment includes only waits longer than 10 minutes. Logical indexing selects those entries. Sampling with replacement from that eligible group gives independent draws from the selected group, not from the full target roster; repeating an entry is allowed.",
      ],
      chunks: [
        {
          id: 'sampling-biased-roster', title: 'Define the target and the selected group', kind: 'example',
          code: `set.seed(3107)
roster <- rexp(20000, rate = 0.1)
target_mean <- mean(roster)
eligible <- roster[roster > 10]
selected_mean <- mean(eligible)
data.frame(group = c("All roster entries: target", "Waits above 10: eligible"),
           entries = c(length(roster), length(eligible)),
           mean_minutes = c(target_mean, selected_mean))`,
          explanation: "These are synthetic values generated here, not collected data. The eligible group has a higher mean by construction. Increasing its sample size cannot make its mean equal the full roster’s mean.",
          checks: ['length(roster) == 20000', 'all(eligible > 10)', 'selected_mean - target_mean > 8'],
        },
        {
          id: 'sampling-biased-loop', title: 'Increase sample size under biased recruitment', kind: 'example',
          code: `set.seed(3108)
biased_25 <- numeric(400)
biased_400 <- numeric(400)
for (i in seq_len(400)) {
  biased_25[i] <- mean(sample(eligible, size = 25, replace = TRUE))
  biased_400[i] <- mean(sample(eligible, size = 400, replace = TRUE))
}
data.frame(n = c(25, 400), target_mean = target_mean,
           estimated_center = c(mean(biased_25), mean(biased_400)),
           simulated_se = c(sd(biased_25), sd(biased_400)),
           bias_from_selection = selected_mean - target_mean)`,
          explanation: "At \\(n = 400\\) the means fluctuate less but remain far from the target. The procedure is precise about the selected group. The CLT can describe its mean around the selected group’s center; it cannot repair the mismatch between that group and the target population.",
          checks: ['sd(biased_400) < sd(biased_25)', 'abs(mean(biased_400) - selected_mean) < 0.4', 'mean(biased_400) - target_mean > 8'],
        },
        {
          id: 'sampling-unbiased-roster-exercise', title: 'Exercise: change the sampling mechanism', kind: 'exercise',
          code: `set.seed(3109)
exercise_fair_means <- numeric(400)
# TODO: loop 400 times. Each time, sample 400 entries with replacement
# from the FULL roster and save the sample mean in exercise_fair_means[i].
# TODO: print the average of these means beside target_mean.`,
          answer: `set.seed(3109)
exercise_fair_means <- numeric(400)
for (i in seq_len(400)) {
  exercise_fair_means[i] <- mean(sample(roster, size = 400, replace = TRUE))
}
data.frame(estimated_center = mean(exercise_fair_means),
           target_mean = target_mean, simulated_se = sd(exercise_fair_means))`,
          explanation: "Sampling uniformly from the full roster fixes the selection problem in this synthetic experiment. In a real study, obtaining access to the full target population can be harder than simply collecting more observations from an available subgroup.",
          checks: ['length(exercise_fair_means) == 400', 'abs(mean(exercise_fair_means) - target_mean) < 0.2'],
        },
      ],
    },
  ],
  closing: [
    "Keep four objects separate: the population distribution, an observed sample, its statistic, and that statistic’s sampling distribution. The standard deviation of individual observations and the standard error of a mean refer to different levels of this sequence.",
    "For independent, identically distributed observations with finite variance, averaging reduces standard error as \\(\\frac{1}{\\sqrt{n}}\\). The central limit theorem explains an approximately normal sampling distribution for sufficiently large \\(n\\); it leaves the original population distribution unchanged. Neither averaging nor the CLT fixes biased sampling.",
    "More repetitions \\(B\\) reduce Monte Carlo uncertainty about a simulated procedure. More observations \\(n\\) change the procedure being studied. The next notebook uses the standard error of a mean to build confidence intervals and asks what their long-run coverage means.",
  ],
};
