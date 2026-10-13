import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-compare",
  "number": 10,
  "track": "practical",
  "title": "Compare groups with uncertainty",
  "question": "How much faster is the priority rule, and how uncertain is that estimate?",
  "estimatedMinutes": "45–65",
  "prerequisites": [
    "Prepare and summarize data; core confidence intervals and hypothesis tests."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "The target is mean service time for standard orders minus mean time for priority orders in the synthetic generating process. Positive differences favor priority. For the inferential exercise, treat orders as independent draws from that process with the same rules and random priority assignment."
  ],
  "sections": [
    {
      "id": "compare-estimate",
      "title": "Define the contrast before calculating",
      "paragraphs": [
        "A comparison needs a direction and units. We use standard minus priority, in minutes. The generator assigns priority independently and reduces its conditional mean by four minutes; the observed marginal difference need not equal four because groups have finite, different samples."
      ],
      "chunks": [
        {
          "id": "compare-load",
          "title": "Calculate the observed difference",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\nstandard <- orders$service_minutes[orders$priority == \"standard\"]\npriority <- orders$service_minutes[orders$priority == \"priority\"]\ndifference <- mean(standard) - mean(priority)\nprint(data.frame(group = c(\"standard\", \"priority\"), n = c(length(standard), length(priority)),\n                 mean_minutes = c(mean(standard), mean(priority))))\nprint(difference)",
          "explanation": "Keep both group counts beside the means. The contrast summarizes all orders in each group, without adjusting for size.",
          "checks": [
            "length(standard) + length(priority) == 120",
            "difference > 0"
          ]
        },
        {
          "id": "compare-reverse",
          "title": "Exercise: reverse the comparison",
          "kind": "exercise",
          "code": "# TODO: calculate priority minus standard as exercise_difference.",
          "explanation": "Changing the direction flips the sign; it does not change which service rule has the lower observed mean.",
          "checks": [
            "abs(exercise_difference + difference) < 1e-12"
          ],
          "answer": "exercise_difference <- mean(priority) - mean(standard)\nprint(exercise_difference)"
        }
      ]
    },
    {
      "id": "compare-interval",
      "title": "Use a method that allows different group spreads",
      "paragraphs": [
        "For independent groups, estimate the standard error by \\(\\sqrt{s_S^2/n_S+s_P^2/n_P}\\), where \\(s_S,s_P\\) are sample standard deviations and \\(n_S,n_P\\) are group sizes. Welch’s method estimates uncertainty without assuming equal variances.",
        "The normal-population Welch interval is approximate; here the groups are mixtures over order sizes, so its use relies on a reasonable large-sample approximation. Extreme skew, dependence, or very small samples would require more care."
      ],
      "chunks": [
        {
          "id": "compare-welch",
          "title": "Estimate a 95% interval",
          "kind": "example",
          "code": "se_difference <- sqrt(var(standard)/length(standard) + var(priority)/length(priority))\ncomparison <- t.test(standard, priority, conf.level = 0.95)\nprint(data.frame(difference_minutes = difference, estimated_se = se_difference,\n                 lower = comparison$conf.int[1], upper = comparison$conf.int[2]))",
          "explanation": "`t.test()` uses Welch’s method for two independent vectors by default. The interval refers to the mean contrast, not the spread of individual order times or a posterior probability for this particular parameter.",
          "checks": [
            "abs(se_difference - comparison$stderr) < 1e-10",
            "comparison$conf.int[1] < difference",
            "comparison$conf.int[2] > difference"
          ]
        },
        {
          "id": "compare-level",
          "title": "Exercise: request a 90% interval",
          "kind": "exercise",
          "code": "# TODO: run t.test(standard, priority, conf.level = 0.90) as exercise_test.\n# TODO: print its conf.int field.",
          "explanation": "Use the same data. Lower nominal coverage gives a narrower interval under the same method.",
          "checks": [
            "diff(exercise_test$conf.int) < diff(comparison$conf.int)",
            "abs(exercise_test$conf.int[1] + exercise_test$conf.int[2] - 2*difference) < 1e-10"
          ],
          "answer": "exercise_test <- t.test(standard, priority, conf.level = 0.90)\nprint(exercise_test$conf.int)"
        }
      ]
    },
    {
      "id": "compare-test",
      "title": "Separate evidence from importance",
      "paragraphs": [
        "The null hypothesis is zero mean difference; the two-sided alternative is a nonzero difference. The statistic divides the observed contrast by its estimated standard error. A p-value is a tail probability under the null model and its assumptions, not the probability that the null is true.",
        "Suppose two minutes is the smallest worthwhile improvement for this teaching decision. Compare the whole interval with that threshold, not only the p-value with 0.05."
      ],
      "chunks": [
        {
          "id": "compare-decision",
          "title": "Inspect effect, evidence, and a practical threshold",
          "kind": "example",
          "code": "print(data.frame(t_statistic = unname(comparison$statistic), p_value = comparison$p.value,\n                 reject_at_005 = comparison$p.value < 0.05,\n                 estimate_above_two = difference > 2,\n                 interval_entirely_above_two = comparison$conf.int[1] > 2))",
          "explanation": "Statistical evidence against zero and evidence for an improvement exceeding two minutes are different claims. Failure to reject zero would not show the rules are equivalent.",
          "checks": [
            "abs(unname(comparison$statistic) - difference/se_difference) < 1e-10",
            "comparison$p.value >= 0",
            "comparison$p.value <= 1"
          ]
        },
        {
          "id": "compare-practical",
          "title": "Exercise: change the practical threshold",
          "kind": "exercise",
          "code": "# TODO: save whether both confidence limits exceed 4 as exercise_worthwhile.",
          "explanation": "Use this to compare possible decision requirements, not to choose a threshold after seeing which one gives a favorable result.",
          "checks": [
            "identical(exercise_worthwhile, comparison$conf.int[1] > 4)"
          ],
          "answer": "exercise_worthwhile <- unname(comparison$conf.int[1]) > 4\nprint(exercise_worthwhile)"
        }
      ]
    },
    {
      "id": "compare-sensitivity",
      "title": "Check composition and scope",
      "paragraphs": [
        "Random assignment balances other variables on average across experiments, not perfectly within each realized dataset. Look at mean item counts before moving to a regression that compares rules at the same size. These diagnostics do not license repeatedly trying analyses until one is significant."
      ],
      "chunks": [
        {
          "id": "compare-composition",
          "title": "Inspect a possible source of variation",
          "kind": "example",
          "code": "composition <- aggregate(items ~ priority, data = orders, FUN = mean)\nprint(composition)\nprint(table(orders$priority, orders$shift))",
          "explanation": "The group averages can reflect finite differences in size composition. Our synthetic assignment supports a causal interpretation within its stipulated mechanism; an observational priority label in a real business would not automatically do so.",
          "checks": [
            "nrow(composition) == 2",
            "sum(table(orders$priority, orders$shift)) == 120"
          ]
        },
        {
          "id": "compare-stratum",
          "title": "Exercise: describe one order size",
          "kind": "exercise",
          "code": "# TODO: select orders with items == 4 into exercise_four.\n# TODO: print mean time by priority for that subset.",
          "explanation": "This is a descriptive subgroup check. Smaller groups give less stable estimates; it is not a replacement for a prespecified full analysis.",
          "checks": [
            "all(exercise_four$items == 4)",
            "nrow(exercise_four) > 0"
          ],
          "answer": "exercise_four <- orders[orders$items == 4, ]\naggregate(service_minutes ~ priority, data = exercise_four, FUN = mean)"
        }
      ]
    }
  ],
  "closing": [
    "Report the contrast, units, uncertainty, practical criterion, and sampling assumptions together. The t-test does not fix selection bias or dependence. The next notebook models size and priority jointly and examines whether that model is adequate."
  ],
  "references": [
    {
      "title": "R Data Import/Export manual",
      "url": "https://cran.r-project.org/doc/manuals/r-release/R-data.html"
    },
    {
      "title": "R statistical model documentation",
      "url": "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html"
    }
  ]
};
