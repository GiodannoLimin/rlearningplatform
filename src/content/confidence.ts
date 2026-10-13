import type { Notebook } from './schema';

export const confidence: Notebook = {
  id: 'confidence-intervals',
  number: 4,
  title: 'Confidence intervals',
  question: 'What does a 95% confidence interval mean?',
  estimatedMinutes: '50–65',
  prerequisites: [
    "Notebook 0: objects, vectors, logical comparisons, for loops, functions, and `set.seed()`.",
    "Notebook 2: a normal distribution, its mean and standard deviation, and `qnorm()`.",
    "Notebook 3: sample means, repeated sampling, and standard error.",
  ],
  introduction: [
    "An interval estimate gives a range around an estimate of a population parameter. Its confidence level describes how often the procedure captures that parameter across repeated samples, under its assumptions.",
    "Our synthetic population contains independent normal measurements with mean \\(\\mu = 50\\) units and standard deviation \\(\\sigma = 10\\) units. We know \\(\\mu\\) only because we created this experiment; an investigator would use sample data to estimate it. We assume \\(\\sigma\\) is known from the measurement process, so a normal, or \\(z\\), interval is exactly justified at every sample size here.",
    "Run worked examples in order: their chunks share R objects. Exercises use separate object names and are optional during Run all. Press Command+Enter on macOS or Ctrl+Enter on Windows/Linux to run the focused chunk; Tab leaves the editor.",
  ],
  sections: [
    {
      id: 'ci-procedure',
      title: 'Specify the procedure before collecting data',
      paragraphs: [
        "Let \\(n\\) be the sample size, \\(\\bar{x}\\) the sample mean, and \\(c\\) the confidence level. The standard error of the sample mean is \\(\\mathrm{SE} = \\frac{\\sigma}{\\sqrt{n}}\\). Choose \\(z\\) so that the central proportion \\(c\\) of a standard normal distribution lies between \\(-z\\) and \\(z\\); in R, \\(z\\) is `qnorm((1 + c) / 2)`.",
        "Our interval is \\([\\bar{x}-z\\,\\mathrm{SE},\\;\\bar{x}+z\\,\\mathrm{SE}]\\). The two endpoints vary with the random sample; \\(\\mu\\) is fixed. For \\(c = 0.95\\), the remaining 0.05 is split into two tails of 0.025 each, which explains the 0.975 quantile.",
        "`sqrt()` calculates a square root. `data.frame()` places named columns side by side in a table, making the ingredients of the interval easy to inspect.",
      ],
      chunks: [
        {
          id: 'ci-settings',
          title: 'A 95% interval recipe',
          kind: 'example',
          code: `mu <- 50
sigma <- 10
n <- 25
level <- 0.95
critical_z <- qnorm((1 + level) / 2)
standard_error <- sigma / sqrt(n)
margin <- critical_z * standard_error
data.frame(confidence = level, z = critical_z,
           standard_error = standard_error, margin = margin)`,
          explanation: "The margin is about 3.92 measurement units, so the interval extends that far on either side of the sample mean. It estimates the population mean, not the range containing 95% of individual measurements.",
          checks: [
            'identical(n, 25)',
            'abs(standard_error - 2) < 1e-12',
            'abs(critical_z - 1.95996398454005) < 1e-10',
          ],
        },
        {
          id: 'ci-confidence-cutoff',
          title: 'Exercise: find the cutoff for 90% confidence',
          kind: 'exercise',
          code: `exercise_level <- 0.90
# TODO: calculate exercise_z with qnorm().
# TODO: print exercise_z and compare it with critical_z.`,
          answer: `exercise_level <- 0.90
exercise_z <- qnorm((1 + exercise_level) / 2)
print(exercise_z)
print(exercise_z < critical_z)`,
          explanation: "Edit the chunk to calculate its cutoff. A smaller central probability needs a smaller cutoff; for the same sample and known \\(\\sigma\\), it gives a narrower interval.",
          checks: ['abs(exercise_z - 1.64485362695147) < 1e-10'],
        },
      ],
    },
    {
      id: 'ci-observed-interval',
      title: 'Generate one sample and its interval',
      paragraphs: [
        "`rnorm(n, mean, sd)` draws \\(n\\) independent measurements from the specified normal population. A seed makes this simulated sample reproducible. `lower <= mu & mu <= upper` uses & to require both endpoint comparisons to be `TRUE`.",
        "After the sample is observed, this interval either contains \\(\\mu\\) or misses it. The frequentist model does not assign a 95% posterior probability to \\(\\mu\\) being inside these particular endpoints. The 95% belongs to the procedure used before seeing the data.",
      ],
      chunks: [
        {
          id: 'ci-one-sample',
          title: 'One observed interval',
          kind: 'example',
          code: `set.seed(4101)
measurements <- rnorm(n, mean = mu, sd = sigma)
sample_mean <- mean(measurements)
lower <- sample_mean - margin
upper <- sample_mean + margin
data.frame(sample_mean = sample_mean, lower = lower, upper = upper,
           contains_mu = lower <= mu & mu <= upper,
           width = upper - lower)`,
          explanation: "The sample mean is the interval center. `contains_mu` can be checked only because the true mean is known in this simulation. In an actual study, the unknown \\(\\mu\\) prevents us from labeling the observed interval a success or a miss.",
          checks: [
            'length(measurements) == n',
            'abs((lower + upper) / 2 - sample_mean) < 1e-12',
            'abs((upper - lower) - 2 * margin) < 1e-12',
          ],
        },
        {
          id: 'ci-larger-single-sample',
          title: 'Exercise: construct a fresh interval with 100 measurements',
          kind: 'exercise',
          code: `set.seed(4102)
exercise_n <- 100
exercise_sample <- rnorm(exercise_n, mean = mu, sd = sigma)
# TODO: calculate exercise_margin using exercise_n.
# TODO: calculate exercise_lower and exercise_upper.
# TODO: print the endpoints and their width.`,
          answer: `set.seed(4102)
exercise_n <- 100
exercise_sample <- rnorm(exercise_n, mean = mu, sd = sigma)
exercise_margin <- qnorm(0.975) * sigma / sqrt(exercise_n)
exercise_lower <- mean(exercise_sample) - exercise_margin
exercise_upper <- mean(exercise_sample) + exercise_margin
data.frame(lower = exercise_lower, upper = exercise_upper,
           width = exercise_upper - exercise_lower)`,
          explanation: "Use a new sample, keeping \\(\\sigma = 10\\) and confidence = 95%. The new interval will have half the earlier width, although its center also changes. One interval alone cannot tell us a procedure’s coverage.",
          checks: [
            'length(exercise_sample) == 100',
            'abs((exercise_upper - exercise_lower) - margin) < 1e-10',
          ],
        },
      ],
    },
    {
      id: 'ci-repeated-sampling',
      title: 'Repeat the entire sampling experiment',
      paragraphs: [
        "We now collect a fresh sample and construct an interval 400 times. \\(B\\) is the number of simulated experiments; \\(n\\) is the number of measurements in each experiment. Increasing \\(B\\) makes our simulation estimate more precise; changing \\(n\\) changes the study itself.",
        "`numeric(B)` creates \\(B\\) storage slots, and the loop fills one slot per experiment. Set the seed once before the loop: resetting the same seed inside it would repeatedly draw the same sample.",
        "`seq_len(B)` supplies experiment numbers from 1 to \\(B\\). `head(table, 6)` displays only the first six rows while preserving the full table.",
      ],
      chunks: [
        {
          id: 'ci-repeated-intervals',
          title: 'Collect 400 intervals',
          kind: 'example',
          code: `set.seed(4107)
B <- 400
means <- numeric(B)
for (i in seq_len(B)) {
  new_sample <- rnorm(n, mean = mu, sd = sigma)
  means[i] <- mean(new_sample)
}
lowers <- means - margin
uppers <- means + margin
covered <- lowers <= mu & mu <= uppers
intervals <- data.frame(experiment = seq_len(B), sample_mean = means,
                        lower = lowers, upper = uppers,
                        contains_mu = covered)
head(intervals, 6)`,
          explanation: "The first six rows are displayed; all 400 remain in intervals. Every experiment uses a fresh sample from the same population and the same interval rule.",
          checks: [
            'nrow(intervals) == 400',
            'all(abs((uppers - lowers) - 2 * margin) < 1e-10)',
            'all(covered == (abs(means - mu) <= margin))',
          ],
        },
        {
          id: 'ci-coverage',
          title: 'Estimate the procedure’s coverage',
          kind: 'example',
          code: `empirical_coverage <- mean(covered)
mc_standard_error <- sqrt(level * (1 - level) / B)
exact_coverage <- pnorm(critical_z) - pnorm(-critical_z)
data.frame(experiments = B, covered = sum(covered),
           empirical_coverage = empirical_coverage,
           exact_coverage = exact_coverage,
           monte_carlo_standard_error = mc_standard_error)`,
          explanation: "`mean()` counts `TRUE` as 1 and `FALSE` as 0, giving the fraction of intervals that contain \\(\\mu\\). Under the stated model, the mathematical coverage is exactly 0.95 because the standardized sample mean is standard normal; simulation illustrates this result. With \\(B = 400\\), Monte Carlo standard error is about 0.011, so the simulated fraction need not equal 0.95.",
          // A 0.06 coverage tolerance exceeds five Monte Carlo standard errors.
          checks: [
            'abs(exact_coverage - 0.95) < 1e-12',
            'abs(empirical_coverage - 0.95) < 0.06',
            'abs(mc_standard_error - sqrt(0.95 * 0.05 / 400)) < 1e-12',
          ],
        },
        {
          id: 'ci-coverage-count',
          title: 'Exercise: count the missed intervals',
          kind: 'exercise',
          code: `# ! changes TRUE to FALSE and FALSE to TRUE.
# TODO: use sum(!covered) to create exercise_misses.
# TODO: calculate exercise_miss_rate and print both.`,
          answer: `exercise_misses <- sum(!covered)
exercise_miss_rate <- exercise_misses / B
data.frame(missed = exercise_misses, miss_rate = exercise_miss_rate)`,
          explanation: "The observed miss rate is near 0.05, with simulation variability. A valid 95% procedure is designed to miss sometimes; a miss in one experiment is not, by itself, a calculation error.",
          checks: [
            'exercise_misses + sum(covered) == B',
            'abs(exercise_miss_rate + empirical_coverage - 1) < 1e-12',
          ],
        },
      ],
    },
    {
      id: 'ci-see-coverage',
      title: 'See the moving intervals and the fixed parameter',
      paragraphs: [
        "The next plot displays the first 30 experiments. Each horizontal line is one interval; the vertical line stays at \\(\\mu = 50\\). Misses use triangles and dashed orange lines, so color is not the only distinction.",
        "The printed table contains every endpoint and containment label used in the plot. It is a numerical alternative to the image, and the coverage estimate still uses all 400 experiments.",
        "`ifelse(condition, yes, no)` chooses a value for each logical condition. `plot()` draws axes and points, `segments()` adds interval lines, and `abline(v = mu)` draws a vertical reference; pch chooses point shapes and lty chooses line styles. A blank column position in `intervals[shown, ]` keeps every table column.",
      ],
      chunks: [
        {
          id: 'ci-interval-plot',
          title: 'Plot and inspect 30 intervals',
          kind: 'example',
          code: `shown <- seq_len(30)
line_color <- ifelse(covered[shown], "#126861", "#9C4616")
line_type <- ifelse(covered[shown], 1, 2)
point_shape <- ifelse(covered[shown], 16, 17)
# range() finds minimum and maximum; xlim and ylim set axis limits.
# xlab and ylab label axes; main sets the title; col sets color.
plot(means[shown], shown, xlim = range(lowers[shown], uppers[shown], mu),
     ylim = c(0, 36), xlab = "Population mean estimate (measurement units)",
     ylab = "Experiment number", main = "30 intervals from a 95% procedure",
     pch = point_shape, col = line_color)
segments(lowers[shown], shown, uppers[shown], shown,
         col = line_color, lty = line_type)
# lwd sets line thickness.
abline(v = mu, lty = 3, lwd = 2)
# legend() labels the symbols; NA omits a point for the reference line.
# cex scales text and bg sets the background.
legend("topleft", legend = c("Contains mean", "Misses mean", "True mean = 50"),
       col = c("#126861", "#9C4616", "black"), lty = c(1, 2, 3),
       pch = c(16, 17, NA), cex = 0.7, bg = "white")
# Hide redundant row numbers: experiment is already a column.
print(intervals[shown, ], row.names = FALSE)`,
          explanation: "The interval centers and endpoints move from sample to sample; the population mean stays at 50. The table’s `contains_mu` column describes the same successes and misses without requiring the plot.",
          plotAlt: 'Thirty horizontal confidence intervals for a fixed population mean of 50 measurement units. Solid teal lines with circles contain 50; dashed orange lines with triangles miss it. The printed 30-row table lists experiment number, sample mean, lower endpoint, upper endpoint, and TRUE/FALSE containment for every plotted interval.',
          checks: [
            'length(shown) == 30',
            'all(intervals$contains_mu[shown] == covered[shown])',
          ],
        },
        {
          id: 'ci-inspect-misses',
          title: 'Exercise: display only intervals that missed',
          kind: 'exercise',
          code: `# In table[rows, columns], a blank column position keeps all columns.
# TODO: use intervals[!covered, ] to create exercise_missed_intervals.
# TODO: print the resulting table.`,
          answer: `exercise_missed_intervals <- intervals[!covered, ]
print(exercise_missed_intervals, row.names = FALSE)`,
          explanation: "Select failures across all 400 experiments. For each row, both endpoints are either below 50 or above 50. We can diagnose this only because the experiment supplies the true parameter.",
          checks: [
            'nrow(exercise_missed_intervals) == sum(!covered)',
            'all(!exercise_missed_intervals$contains_mu)',
          ],
        },
      ],
    },
    {
      id: 'ci-width-and-level',
      title: 'Separate interval width from coverage',
      paragraphs: [
        "Width is the distance between an interval’s endpoints, in measurement units. Coverage is the probability that the procedure captures \\(\\mu\\), measured across repeated samples. They answer different questions.",
        "Hold the observed sample fixed and increase the confidence level: the interval gets wider. Hold confidence fixed and increase \\(n\\): the interval gets narrower because \\(\\mathrm{SE}\\) decreases, while the exact coverage remains at the chosen level under our assumptions.",
      ],
      chunks: [
        {
          id: 'ci-width-levels',
          title: 'Three confidence levels for the same sample',
          kind: 'example',
          code: `levels <- c(0.90, 0.95, 0.99)
level_margins <- qnorm((1 + levels) / 2) * sigma / sqrt(n)
level_comparison <- data.frame(confidence = levels,
                               lower = sample_mean - level_margins,
                               upper = sample_mean + level_margins,
                               width = 2 * level_margins)
print(level_comparison, row.names = FALSE)`,
          explanation: "`qnorm()` works on the whole vector of levels. These intervals share a center and are nested: the 99% interval contains the 95% interval, which contains the 90% interval. Higher confidence comes with less precision for this same sample.",
          checks: [
            'all(diff(level_comparison$width) > 0)',
            'abs(level_comparison$width[2] - 2 * margin) < 1e-10',
          ],
        },
        {
          id: 'ci-sample-size',
          title: 'Sample size changes precision',
          kind: 'example',
          code: `sample_sizes <- c(25, 100, 400)
widths <- 2 * qnorm(0.975) * sigma / sqrt(sample_sizes)
data.frame(sample_size = sample_sizes, confidence = 0.95,
           interval_width = widths, exact_coverage = 0.95)`,
          explanation: "This table is calculated from the formula, without simulation. Quadrupling \\(n\\) halves interval width. A 95% interval remains a 95% procedure; a larger sample makes its estimate more precise, not its nominal confidence higher. Larger \\(n\\) does not repair biased sampling or a wrongly specified model.",
          checks: [
            'abs(widths[1] / widths[2] - 2) < 1e-12',
            'abs(widths[2] / widths[3] - 2) < 1e-12',
          ],
        },
        {
          id: 'ci-width-target',
          title: 'Exercise: find a sample size for width at most 4 units',
          kind: 'exercise',
          code: `exercise_target_width <- 4
# Width = 2 * z * sigma / sqrt(n).
# Rearranging gives n >= (2 * z * sigma / target_width)^2.
# ceiling() rounds up to a whole number.
# TODO: calculate exercise_required_n at 95% confidence.
# TODO: calculate and print exercise_achieved_width.`,
          answer: `exercise_target_width <- 4
exercise_required_n <- ceiling((2 * qnorm(0.975) * sigma /
                                exercise_target_width)^2)
exercise_achieved_width <- 2 * qnorm(0.975) * sigma /
                           sqrt(exercise_required_n)
data.frame(required_n = exercise_required_n,
           achieved_width = exercise_achieved_width)`,
          explanation: "Choose the smallest whole-number \\(n\\) that satisfies the width requirement under this known-\\(\\sigma\\) model. Sample-size planning needs an assumed variability and a sampling design as well as a desired width.",
          checks: [
            'exercise_required_n == 97',
            'exercise_achieved_width <= 4',
            '2 * qnorm(0.975) * sigma / sqrt(exercise_required_n - 1) > 4',
          ],
        },
      ],
    },
    {
      id: 'ci-vary-the-experiment',
      title: 'Reuse the experiment with a function',
      paragraphs: [
        "The function below packages the same sampling loop so we can compare study designs without copying its steps. `sample_size`, confidence, and repetitions are inputs; a one-row results table is its output. Population mean 50 and known standard deviation 10 stay fixed.",
        "`logical(repetitions)` reserves storage for `TRUE`/`FALSE` results, and `rbind()` stacks the result tables by rows. A function returns its last expression, which here is the one-row table.",
        "We use 400 repetitions for responsiveness. Try 1,000 deliberately if you want a steadier simulation estimate. The Monte Carlo standard error concerns uncertainty in simulated coverage; \\(\\frac{\\sigma}{\\sqrt{n}}\\) concerns the sampling variability of a single study’s sample mean.",
      ],
      chunks: [
        {
          id: 'ci-experiment-function',
          title: 'Compare two sample sizes by repeated sampling',
          kind: 'example',
          code: `simulate_intervals <- function(sample_size, confidence, repetitions) {
  half_width <- qnorm((1 + confidence) / 2) * 10 / sqrt(sample_size)
  captures <- logical(repetitions)
  for (j in seq_len(repetitions)) {
    center <- mean(rnorm(sample_size, mean = 50, sd = 10))
    captures[j] <- center - half_width <= 50 & 50 <= center + half_width
  }
  data.frame(sample_size = sample_size, confidence = confidence,
             repetitions = repetitions, width = 2 * half_width,
             empirical_coverage = mean(captures))
}
set.seed(4104)
small_study <- simulate_intervals(25, 0.95, 400)
large_study <- simulate_intervals(100, 0.95, 400)
size_comparison <- rbind(small_study, large_study)
print(size_comparison, row.names = FALSE)`,
          explanation: "Both estimated coverages should be near 0.95, while \\(n = 100\\) has half the width of \\(n = 25\\). Their simulated coverages need not be identical or ordered by sample size; the two rows use different random samples.",
          checks: [
            'abs(small_study$width / large_study$width - 2) < 1e-12',
            'all(abs(size_comparison$empirical_coverage - 0.95) < 0.06)',
          ],
        },
        {
          id: 'ci-level-experiment',
          title: 'Exercise: compare 90% and 99% procedures',
          kind: 'exercise',
          code: `set.seed(4105)
# TODO: call simulate_intervals() at n = 25, confidence = 0.90,
# and 400 repetitions; save the result as exercise_90.
# TODO: repeat for confidence = 0.99 as exercise_99.
# TODO: stack and print both rows with rbind().`,
          answer: `set.seed(4105)
exercise_90 <- simulate_intervals(25, 0.90, 400)
exercise_99 <- simulate_intervals(25, 0.99, 400)
print(rbind(exercise_90, exercise_99), row.names = FALSE)`,
          explanation: "Compare both width and coverage. The 99% procedure has wider intervals and higher theoretical coverage; finite simulation estimates fluctuate. Try another seed, then restore this seed to reproduce the original experiment.",
          // Tolerances allow over four MC standard errors at 90%, about five at 99%.
          checks: [
            'exercise_99$width > exercise_90$width',
            'abs(exercise_90$empirical_coverage - 0.90) < 0.07',
            'abs(exercise_99$empirical_coverage - 0.99) < 0.025',
          ],
        },
      ],
    },
  ],
  closing: [
    "A 95% confidence procedure captures the fixed population parameter in 95% of repeated samples under its assumptions. After observing an interval, the parameter has not become random: those endpoints either contain it or do not. Our repeated-sampling experiment makes the long-run statement visible.",
    "We deliberately used independent normal observations and a known population standard deviation. When \\(\\sigma\\) must be estimated, an independent normal sample instead supports a Student t interval with estimated standard error; replacing \\(\\sigma\\) by the sample standard deviation in this \\(z\\) formula does not preserve exact coverage. Dependence, biased sampling, or an unsuitable population model also require reconsidering the method.",
    "Width describes precision; coverage describes the reliability of the procedure. More observations per sample can narrow an appropriate interval. More simulated experiments merely let us estimate that procedure’s behavior more accurately. Simulation is evidence about behavior, not a proof of the mathematical coverage result.",
  ],
  references: [
    {
      title: 'R documentation: normal distribution functions',
      url: 'https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Normal.html',
    },
    {
      title: 'NIST: interpreting confidence limits for the mean',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm',
    },
  ],
};
