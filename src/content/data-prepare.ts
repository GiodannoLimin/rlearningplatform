import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-prepare",
  "number": 7,
  "track": "practical",
  "title": "Prepare and summarize data",
  "question": "How can we produce a trustworthy summary?",
  "estimatedMinutes": "45–65",
  "prerequisites": [
    "Import and inspect a CSV."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "This notebook imports its own copy. Cleaning decisions must follow documented meanings, not whether removing a row makes the result more attractive. The dataset notes identify the appended duplicate and impossible negative time as deliberate errors."
  ],
  "sections": [
    {
      "id": "prepare-clean",
      "title": "Keep a record of exclusions",
      "paragraphs": [
        "An exact duplicate can count an order twice. Remove the repeated ID here only because the dataset documentation confirms it is a duplicate; in real records, repeated IDs might instead represent multiple legitimate events. Exclude the impossible time, retaining rows with a missing rating."
      ],
      "chunks": [
        {
          "id": "prepare-load",
          "title": "Apply the documented rules",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\ndata.frame(imported = nrow(raw), retained = nrow(orders), removed = nrow(raw) - nrow(orders))",
          "explanation": "There should be 120 retained orders. `!` reverses a logical value and `&` requires both conditions. Keep raw unchanged so the cleaning decision remains inspectable.",
          "checks": [
            "nrow(orders) == 120",
            "!anyDuplicated(orders$order_id)",
            "sum(is.na(orders$rating)) == 12"
          ]
        },
        {
          "id": "prepare-excluded",
          "title": "Exercise: show the invalid time",
          "kind": "exercise",
          "code": "# TODO: select the negative-time row from raw into exercise_invalid.",
          "explanation": "Inspect the record you excluded instead of only reporting a count. Do not infer that all unusual but possible values should be removed.",
          "checks": [
            "nrow(exercise_invalid) == 1",
            "exercise_invalid$order_id == \"O121\""
          ],
          "answer": "exercise_invalid <- raw[!is.na(raw$service_minutes) & raw$service_minutes < 0, ]\nprint(exercise_invalid)"
        }
      ]
    },
    {
      "id": "prepare-derived",
      "title": "Create a meaningful variable",
      "paragraphs": [
        "Suppose 25 minutes is a prespecified service target. `<=` includes orders exactly on the target. A derived logical column records the rule and can be summarized with `mean()` because TRUE counts as one and FALSE as zero."
      ],
      "chunks": [
        {
          "id": "prepare-target",
          "title": "Calculate the on-time fraction",
          "kind": "example",
          "code": "orders$on_time <- orders$service_minutes <= 25\nsummary_table <- data.frame(n = nrow(orders), mean_minutes = mean(orders$service_minutes),\n                           median_minutes = median(orders$service_minutes),\n                           sd_minutes = sd(orders$service_minutes), on_time_fraction = mean(orders$on_time))\nprint(summary_table)",
          "explanation": "Mean and median describe center; standard deviation describes spread among orders. The on-time fraction is a descriptive proportion in these records, not a guaranteed future success rate.",
          "checks": [
            "summary_table$n == 120",
            "summary_table$on_time_fraction > 0",
            "summary_table$on_time_fraction < 1"
          ]
        },
        {
          "id": "prepare-target-ex",
          "title": "Exercise: tighten the target",
          "kind": "exercise",
          "code": "# TODO: calculate the fraction completed within 20 minutes as exercise_fraction.",
          "explanation": "A tighter target can only reduce or leave unchanged the on-time fraction for the same records. It changes the question, not the measurements.",
          "checks": [
            "abs(exercise_fraction - mean(orders$service_minutes <= 20)) < 1e-12",
            "exercise_fraction <= mean(orders$on_time)"
          ],
          "answer": "exercise_fraction <- mean(orders$service_minutes <= 20)\nprint(exercise_fraction)"
        }
      ]
    },
    {
      "id": "prepare-groups",
      "title": "Summarize groups with their denominators",
      "paragraphs": [
        "`aggregate()` applies a function separately to each group. In `service_minutes ~ priority`, the tilde means summarize the left variable by the right grouping variable. Group counts belong next to averages: they show how much data each average represents."
      ],
      "chunks": [
        {
          "id": "prepare-aggregate",
          "title": "Group counts and averages",
          "kind": "example",
          "code": "counts <- table(orders$priority)\ngroup_means <- aggregate(service_minutes ~ priority, data = orders, FUN = mean)\nprint(counts)\nprint(group_means)",
          "explanation": "The priority labels describe two service rules. A difference in observed averages alone does not explain its cause; differences in order size can also affect service time.",
          "checks": [
            "sum(counts) == 120",
            "nrow(group_means) == 2"
          ]
        },
        {
          "id": "prepare-shift",
          "title": "Exercise: summarize by shift",
          "kind": "exercise",
          "code": "# TODO: use aggregate() to save mean service time by shift as exercise_shift.",
          "explanation": "Use the same response column and change only the grouping variable. This is a descriptive comparison, not a test.",
          "checks": [
            "nrow(exercise_shift) == 2",
            "abs(mean(exercise_shift$service_minutes) - mean(aggregate(service_minutes ~ shift, orders, mean)$service_minutes)) < 1e-12"
          ],
          "answer": "exercise_shift <- aggregate(service_minutes ~ shift, data = orders, FUN = mean)\nprint(exercise_shift)"
        }
      ]
    },
    {
      "id": "prepare-missing",
      "title": "State which records support a result",
      "paragraphs": [
        "Missing ratings are unrelated to rating values by construction in this synthetic file. Real nonresponse may be selective. `na.rm = TRUE` changes the calculation’s denominator; always report the number observed and avoid claiming that removing missing entries fixes selection bias."
      ],
      "chunks": [
        {
          "id": "prepare-rating",
          "title": "Describe observed ratings",
          "kind": "example",
          "code": "rating_counts <- table(orders$rating, useNA = \"ifany\")\nprint(rating_counts)\nprint(data.frame(observed = sum(!is.na(orders$rating)), missing = sum(is.na(orders$rating)),\n                 median_observed = median(orders$rating, na.rm = TRUE)))",
          "explanation": "For this ordinal response, show category counts and a median rather than assuming equally spaced rating levels. There are 108 observed ratings.",
          "checks": [
            "sum(!is.na(orders$rating)) == 108",
            "sum(rating_counts) == 120"
          ]
        },
        {
          "id": "prepare-rating-ex",
          "title": "Exercise: proportion of high observed ratings",
          "kind": "exercise",
          "code": "# TODO: among observed ratings, calculate the fraction at least 4 as exercise_high.",
          "explanation": "Report the observed-rating denominator. This fraction describes respondents, not necessarily all customers.",
          "checks": [
            "abs(exercise_high - mean(orders$rating >= 4, na.rm = TRUE)) < 1e-12"
          ],
          "answer": "exercise_high <- mean(orders$rating >= 4, na.rm = TRUE)\nprint(data.frame(observed = sum(!is.na(orders$rating)), high_fraction = exercise_high))"
        }
      ]
    }
  ],
  "closing": [
    "A reproducible summary leaves a trail from the imported rows through exclusions, derived variables, denominators, and group summaries. Next, plots will reveal structure that a single average can hide."
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
