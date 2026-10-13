import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-report",
  "number": 12,
  "track": "practical",
  "title": "From question to a reproducible report",
  "question": "Can someone else follow and rerun the analysis?",
  "estimatedMinutes": "60–80",
  "prerequisites": [
    "All earlier practical notebooks; confidence intervals and hypothesis tests."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "This final notebook assembles a small analysis from the original CSV. Our prespecified question is whether priority reduces mean service time by more than two minutes at the same order size. We use the additive size-and-priority model, retain all valid service times, and report an interval alongside the estimate."
  ],
  "sections": [
    {
      "id": "report-plan",
      "title": "Write the analysis decision into executable steps",
      "paragraphs": [
        "A plan identifies the target, variables, exclusions, model, and practical criterion before looking for favorable results. Here the target is standard minus priority at a fixed size in the synthetic process. The model assumes a common slope; the dataset was generated that way, but this assumption needs checking in real work."
      ],
      "chunks": [
        {
          "id": "report-clean",
          "title": "Rebuild the analysis table",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\norders$priority <- factor(orders$priority, levels = c(\"standard\", \"priority\"))\nflow <- data.frame(imported = nrow(raw), duplicate_rows = sum(duplicated(raw$order_id)),\n                   invalid_times = sum(raw$service_minutes < 0, na.rm = TRUE), analyzed = nrow(orders))\nprint(flow)\nstopifnot(nrow(orders) == 120, !anyDuplicated(orders$order_id))",
          "explanation": "`stopifnot()` stops execution if a quality check fails. These counts describe this particular dataset, so an unexpected count should trigger investigation when the input changes. The two exclusion categories are disjoint in this file; that is not guaranteed in other data.",
          "checks": [
            "flow$analyzed == 120",
            "flow$imported - flow$duplicate_rows - flow$invalid_times == flow$analyzed"
          ]
        },
        {
          "id": "report-audit-ex",
          "title": "Exercise: document retained missing ratings",
          "kind": "exercise",
          "code": "# TODO: save sum(is.na(orders$rating)) as exercise_missing_retained.",
          "explanation": "The outcome is service time; excluding otherwise valid orders just because a different column is missing would change the analysis population unnecessarily.",
          "checks": [
            "exercise_missing_retained == 12"
          ],
          "answer": "exercise_missing_retained <- sum(is.na(orders$rating))\nprint(exercise_missing_retained)"
        }
      ]
    },
    {
      "id": "report-estimate",
      "title": "Keep the estimate and its uncertainty together",
      "paragraphs": [
        "Fit the planned model and reverse the priority-minus-standard coefficient to express improvement. Negating interval endpoints also reverses their order: the new lower bound is the negative old upper bound."
      ],
      "chunks": [
        {
          "id": "report-result",
          "title": "Build a compact results table",
          "kind": "example",
          "code": "fit <- lm(service_minutes ~ items + priority, data = orders)\npriority_interval <- confint(fit, \"prioritypriority\", level = 0.95)\nresult <- data.frame(orders = nrow(orders), improvement_minutes = -unname(coef(fit)[\"prioritypriority\"]),\n                     lower_95 = -priority_interval[1, 2], upper_95 = -priority_interval[1, 1])\nprint(result, row.names = FALSE)",
          "explanation": "The interval is for the adjusted mean improvement, conditional on this model and its sampling assumptions. It is not an interval containing 95% of individual orders.",
          "checks": [
            "result$lower_95 < result$improvement_minutes",
            "result$upper_95 > result$improvement_minutes",
            "result$orders == 120"
          ]
        },
        {
          "id": "report-precision",
          "title": "Exercise: report without excessive digits",
          "kind": "exercise",
          "code": "# TODO: use round(result, digits = 2) to create exercise_rounded.",
          "explanation": "Keep the full precision for calculations and round only the displayed report. Decimal places should serve the units and decision, not suggest spurious certainty.",
          "checks": [
            "identical(exercise_rounded, round(result, 2))"
          ],
          "answer": "exercise_rounded <- round(result, digits = 2)\nprint(exercise_rounded, row.names = FALSE)"
        }
      ]
    },
    {
      "id": "report-checks",
      "title": "Check the model and the claim before reporting",
      "paragraphs": [
        "Summaries of residuals can reveal gross scale problems, but they cannot establish linearity, normality, or independence. Inspect a residual plot as well and connect it to the earlier regression notebook. Sampling design and subject-matter knowledge remain essential."
      ],
      "chunks": [
        {
          "id": "report-diagnostics",
          "title": "Inspect model residuals",
          "kind": "example",
          "code": "residual_table <- data.frame(fitted_minutes = fitted(fit), residual_minutes = residuals(fit))\nplot(residual_table$fitted_minutes, residual_table$residual_minutes, pch = 19,\n     xlab = \"Fitted time (minutes)\", ylab = \"Residual (minutes)\", main = \"Report model check\", col = \"#397c72\")\nabline(h = 0, lty = 2)\nprint(residual_table, row.names = FALSE)\nprint(summary(residuals(fit)))",
          "explanation": "Look for structure rather than expecting every point to sit near zero. The full coordinate table makes the plot inspectable without relying on its image. Our synthetic model is favorable; real analyses may need revisions that must be disclosed.",
          "checks": [
            "nrow(residual_table) == 120",
            "abs(mean(residuals(fit))) < 1e-10"
          ],
          "plotAlt": "Residuals versus fitted service time for the report model, with a zero reference line. Every plotted coordinate and residual summary are printed."
        },
        {
          "id": "report-threshold",
          "title": "Exercise: assess the two-minute criterion",
          "kind": "exercise",
          "code": "# TODO: save result$lower_95 > 2 as exercise_supported.",
          "explanation": "Requiring the whole 95% interval above two is a more demanding criterion than requiring a positive point estimate. This reports evidence under the model, not a guaranteed future saving.",
          "checks": [
            "identical(exercise_supported, result$lower_95 > 2)"
          ],
          "answer": "exercise_supported <- result$lower_95 > 2\nprint(exercise_supported)"
        }
      ]
    },
    {
      "id": "report-write",
      "title": "Create a reproducible, bounded conclusion",
      "paragraphs": [
        "`sprintf()` inserts formatted numbers into text; `%.2f` displays two decimal places. A useful report identifies the data source, exclusions, contrast, method, uncertainty, and scope. Do not describe generated data as a real experiment."
      ],
      "chunks": [
        {
          "id": "report-text",
          "title": "Print the analysis note",
          "kind": "example",
          "code": "note <- sprintf(\"Synthetic teaching data: %d valid orders. Adjusting for item count, estimated standard-minus-priority time is %.2f minutes (95%% model-based confidence interval %.2f to %.2f).\",\n                nrow(orders), result$improvement_minutes, result$lower_95, result$upper_95)\ncat(note, \"\\n\")\ncat(\"Removed one duplicate and one impossible time; retained missing ratings. The additive normal-error model assumes independent observations and constant residual variance.\\n\")\ncat(\"This illustrates an analysis workflow, not evidence about a real business.\\n\")\ncat(\"Entire interval above a two-minute improvement:\", result$lower_95 > 2, \"\\n\")",
          "explanation": "The printed note states exactly what was estimated. Use Download .R script to keep this notebook’s code and explanations, and download the CSV separately. Running that script with the data folder beside your working directory reproduces the numerical analysis.",
          "checks": [
            "grepl(\"Synthetic teaching data\", note)",
            "grepl(\"confidence interval\", note)"
          ]
        },
        {
          "id": "report-note-ex",
          "title": "Exercise: add a factual missing-data note",
          "kind": "exercise",
          "code": "# TODO: use sprintf() to create exercise_note stating the number of missing ratings.\n# TODO: print it with cat().",
          "explanation": "State that these rows were retained for the service-time analysis. This is a code-editing exercise; there is no required written reflection form.",
          "checks": [
            "grepl(\"12\", exercise_note)",
            "is.character(exercise_note)"
          ],
          "answer": "exercise_note <- sprintf(\"%d ratings were missing; those orders were retained for service-time analysis.\", sum(is.na(orders$rating)))\ncat(exercise_note, \"\\n\")"
        }
      ]
    }
  ],
  "closing": [
    "A reproducible report connects a question to a transparent chain of data, decisions, code, checks, and interpretation. Keep the original input, export your script and saved work, and state limitations alongside findings. Advanced theory can deepen this workflow, but it is not a prerequisite for beginning careful practical analysis."
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
