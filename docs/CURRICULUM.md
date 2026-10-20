# Curriculum map

Statistics with R is a statistics course built around small, editable experiments. The recurring sequence is a statistical question, a short explanation, an R experiment, its output, and an exercise. Programming serves the statistical question.

## Implemented notebooks

The six core notebooks are complete lessons, with worked examples, unfinished exercise starters, optional answers, and verification checks. Duration ranges shown in the application are estimates for each notebook, not a promise about completion time or measured learning outcomes.

| Notebook | Preparation | Statistical focus | Main experiments |
| --- | --- | --- | --- |
| 0. R essentials for statistical experiments | Ordinary arithmetic; no programming experience | Record observations, describe events, distinguish a stored value from a random variable | Calculate observed fractions; work with vectors and logical values; count die outcomes with a loop; reuse sampling steps in a function; reproduce draws with a seed |
| 1. Probability through simulation | Notebook 0 | Sample spaces, events, conditional probability, independence; exact probabilities versus observed frequencies | Define a fair random mechanism; enumerate possible outcomes; estimate event probabilities; compare conditional and unconditional frequencies |
| 2. Distributions, expectation, and variability | Notebook 0 and basic probability from Notebook 1 | Random variables; discrete mass and continuous density; expectation, variance, quantiles | Explore binomial, Poisson, and normal models; vary explicit parameters; compare theoretical quantities with simulated estimates; connect R’s d/p/q/r functions |
| 3. Sampling and the central limit theorem | Notebooks 0 and 2 | Population, sample, statistic, sampling distribution; bias, standard deviation, standard error | Sample skewed exponential waiting times; repeat sample-mean calculations; vary sample size; contrast the population with its sampling distributions; examine biased sampling |
| 4. Confidence intervals | Notebooks 0, 2, and 3 | A fixed parameter and a random interval procedure; long-run coverage; width versus confidence | Construct exact normal intervals with known population standard deviation; repeat sampling; inspect a plot and matching numerical table; vary sample size and confidence level |
| 5. Hypothesis tests, false positives, and power | Notebooks 0, 2, 3, and 4 | Null/alternative hypotheses, test statistics, p-values, significance thresholds, Type I/II errors, power, practical significance | Simulate a known-standard-deviation normal test under a null and alternatives; vary sample size and effect size; compare false-positive rates and power |

The recommended reading order is 0–5. Notebook 4 was implemented first as the complete application slice; it is not the recommended first statistical lesson for a learner without the listed preparation.

## Statistical through-lines

- **Mechanism before simulation.** Define what can happen and how outcomes are sampled, including independence and replacement assumptions.
- **Parameter versus observation.** Population quantities, random variables, realized observations, and stored R objects play different roles.
- **Two kinds of repetition.** More simulated experiments improve the precision of a simulation estimate. More observations in one sample change the experiment being simulated.
- **Assumptions remain visible.** Normality, known versus estimated variability, finite variance, independent sampling, and representative sampling determine what conclusions are justified.
- **Evidence versus proof.** A simulation can illustrate behavior and reveal mistakes. It does not prove a probability theorem or establish independence.
- **Uncertainty has several meanings.** Spread of observations, standard error of a statistic, Monte Carlo error, confidence coverage, and a test’s error rates are not interchangeable.

All examples use synthetic teaching observations or generated random samples; no external observational dataset is required. The model and units, where applicable, appear in the lesson. No estimate of educational effectiveness or independent educator approval is claimed.

## Advanced roadmap — upcoming

These are outlines only. They have no runnable notebooks, exercises, or completion status in this release.

| Upcoming topic | Intended questions and experiments |
| --- | --- |
| Joint, marginal, and conditional distributions | Build joint probability tables; recover marginals by summing; condition on an event and renormalize; compare tables with joint continuous models. |
| Covariance, correlation, and multivariate distributions | Measure linear association; compare covariance and correlation; explore why zero correlation need not imply independence; simulate multivariate normal observations. |
| Transformations of random variables | Derive a transformed distribution from its cumulative distribution function; distinguish discrete transformations from continuous density changes; verify with simulation. |
| Monte Carlo methods and bootstrap procedures | Estimate quantities by random sampling; quantify Monte Carlo error; resample observed data to approximate sampling behavior; examine when bootstrap assumptions are credible. |
| Convergence and the delta method | Distinguish convergence in probability and in distribution; study smooth transformations of estimators; compare first-order approximations with simulated sampling distributions. |
| Maximum likelihood and estimator efficiency | Construct likelihoods; compare maximizers and sampling behavior; introduce information and efficiency under explicit regularity conditions. |
| Sufficiency, completeness, and exponential families | Explore data reduction without loss of parameter information; introduce factorization and completeness; connect exponential-family structure with estimator construction. |
| Optimal tests and likelihood-ratio tests | Compare tests at a fixed Type I error level; develop simple-hypothesis likelihood-ratio reasoning; introduce composite hypotheses and approximation conditions. |
| Regression and ANOVA | Model conditional means; interpret coefficients and group comparisons; examine residuals, design assumptions, uncertainty, and prediction. |
| Nonparametric and robust methods | Explore rank-based procedures and resistant estimators; compare sensitivity to outliers and model misspecification; explain what assumptions remain. |
| Bayesian updating and introductory computational methods | Combine a prior and likelihood; interpret a posterior and credible interval; introduce simulation-based posterior summaries and basic computational diagnostics. |

These topics can extend a mathematical-statistics curriculum. Their presence on this roadmap does not imply they are implemented.


## Working with data in R — implemented practical track

| Notebook | Preparation | Main work |
| --- | --- | --- |
| P1 Import and inspect a CSV | R essentials | read.csv, types, row/column selection, missingness and quality audit |
| P2 Prepare and summarize data | P1 | documented exclusions, derived variables, grouped summaries, denominators |
| P3 Explore data with plots | P2 | histograms, boxplots, scatterplots, numerical alternatives, correlation |
| P4 Build visualizations with ggplot2 | P1–P3 | mappings/layers, group encodings, histograms, boxplots, counts versus means, facets, labels and PNG export |
| P5 Compare groups with uncertainty | P2 and core CI/tests | contrast direction, Welch interval, p-value, practical threshold, composition |
| P6 Fit and check linear regression | P3–P5 | simple/additive models, reference groups, residuals, prediction intervals, holdout error |
| P7 From question to a reproducible report | P1–P6 | planned analysis, audit trail, adjusted estimate, diagnostics, bounded conclusion |

The first three can follow R essentials directly. Group inference follows the
core confidence-interval and testing lessons. Advanced mathematical statistics
is a parallel future path, not a gate to practical analysis. P1–P3 and P5 estimate 45–65 minutes; P4 estimates 60–90; P6–P7 estimate 60–80. The seven practical notebooks contain 34 worked examples and 34 editable exercises with optional answers.

All seven use the same bundled original synthetic orders CSV, independently
imported in each notebook. Its documentation identifies units, generation,
intentional defects, missing values, and license. Practical regression is
implemented; advanced regression theory and ANOVA remain upcoming.
