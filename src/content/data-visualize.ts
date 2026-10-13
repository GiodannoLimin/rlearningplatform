import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-visualize",
  "number": 8,
  "track": "practical",
  "title": "Explore data with plots",
  "question": "Which patterns disappear inside an average?",
  "estimatedMinutes": "45–65",
  "prerequisites": [
    "Prepare and summarize data."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "Every plot below has a printed numerical companion. We use base R graphics: the goal is to answer a question with a suitable display, clear labels, and explicit units."
  ],
  "sections": [
    {
      "id": "visual-load",
      "title": "Prepare a consistent analysis table",
      "paragraphs": [
        "Use the same documented cleaning rules before comparing plots with earlier summaries. The code below is self-contained and does not depend on objects in the previous notebook."
      ],
      "chunks": [
        {
          "id": "visual-read",
          "title": "Load the cleaned records",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\nsummary(orders$service_minutes)",
          "explanation": "Check the range before choosing axes. Negative times have been excluded; unusually large but plausible values remain.",
          "checks": [
            "nrow(orders) == 120",
            "min(orders$service_minutes) > 0"
          ]
        },
        {
          "id": "visual-range",
          "title": "Exercise: find the central half",
          "kind": "exercise",
          "code": "# TODO: save the 25th and 75th percentiles of service_minutes as exercise_quartiles.",
          "explanation": "`quantile(x, probs = c(0.25, 0.75))` returns the two quartiles. The interval between them contains roughly the middle half of ordered observations.",
          "checks": [
            "isTRUE(all.equal(unname(exercise_quartiles), unname(quantile(orders$service_minutes, c(.25, .75)))))"
          ],
          "answer": "exercise_quartiles <- quantile(orders$service_minutes, probs = c(0.25, 0.75))\nprint(exercise_quartiles)"
        }
      ]
    },
    {
      "id": "visual-hist",
      "title": "Show a distribution, not just its center",
      "paragraphs": [
        "A histogram groups a numeric variable into bins. Here height is a count of orders; it is not a probability density. `breaks` specifies bin boundaries, and changing those boundaries can change the apparent shape."
      ],
      "chunks": [
        {
          "id": "visual-histogram",
          "title": "Count orders in five-minute bins",
          "kind": "example",
          "code": "bins <- seq(0, 45, by = 5)\nh <- hist(orders$service_minutes, breaks = bins, col = \"#397c72\",\n          main = \"Service times for 120 synthetic orders\", xlab = \"Service time (minutes)\", ylab = \"Orders\")\nprint(data.frame(lower = head(h$breaks, -1), upper = tail(h$breaks, -1), orders = h$counts))",
          "explanation": "R uses intervals open on the left and closed on the right by default, including the lowest boundary in the first bin. The table gives every bin count, whose sum is 120.",
          "checks": [
            "sum(h$counts) == 120"
          ],
          "plotAlt": "Histogram of service time in minutes with five-minute bins. The printed table provides every bin boundary and order count."
        },
        {
          "id": "visual-bins",
          "title": "Exercise: compare narrower bins",
          "kind": "exercise",
          "code": "# TODO: compute a histogram with breaks = seq(0, 44, by = 2) and plot = FALSE.\n# TODO: store the result in exercise_hist and print its counts.",
          "explanation": "`plot = FALSE` computes the histogram without drawing it. Smaller bins show more local variation, which may include chance fluctuations.",
          "checks": [
            "sum(exercise_hist$counts) == 120",
            "length(exercise_hist$counts) == 22"
          ],
          "answer": "exercise_hist <- hist(orders$service_minutes, breaks = seq(0, 44, by = 2), plot = FALSE)\nprint(exercise_hist$counts)"
        }
      ]
    },
    {
      "id": "visual-box",
      "title": "Compare group distributions",
      "paragraphs": [
        "A boxplot shows a median and the middle half of a distribution, with whiskers and individually marked distant points. Marked points are not automatically data errors. Use group counts and quantiles as a numerical companion."
      ],
      "chunks": [
        {
          "id": "visual-boxplot",
          "title": "Compare priority groups",
          "kind": "example",
          "code": "boxplot(service_minutes ~ priority, data = orders, col = c(\"#d6aa71\", \"#397c72\"),\n        main = \"Service time by priority rule\", xlab = \"Rule\", ylab = \"Service time (minutes)\")\nprint(table(orders$priority))\ngroup_quantiles <- lapply(split(orders$service_minutes, orders$priority), quantile)\nprint(group_quantiles)",
          "explanation": "`split()` makes one vector per group, and `lapply()` runs the same function on each vector. Unlike a boxplot’s hinges, printed quantiles use R’s default quantile interpolation; both summarize the central spread but can differ slightly.",
          "checks": [
            "length(group_quantiles) == 2"
          ],
          "plotAlt": "Boxplots compare service-time distributions for priority and standard orders. Counts and five-number quantiles are printed beneath the plot."
        },
        {
          "id": "visual-box-ex",
          "title": "Exercise: compare order sizes by rule",
          "kind": "exercise",
          "code": "# TODO: split orders$items by orders$priority and apply mean with lapply().\n# TODO: save the result as exercise_sizes.",
          "explanation": "If groups differ in order size, their raw time difference combines more than the service rule. This check motivates adjusting for size in regression.",
          "checks": [
            "isTRUE(all.equal(exercise_sizes, lapply(split(orders$items, orders$priority), mean)))"
          ],
          "answer": "exercise_sizes <- lapply(split(orders$items, orders$priority), mean)\nprint(exercise_sizes)"
        }
      ]
    },
    {
      "id": "visual-scatter",
      "title": "Examine two numeric variables together",
      "paragraphs": [
        "A scatterplot gives each order a point: items on the horizontal axis and service minutes on the vertical axis. Repeated item counts can overlap; a table of all plotted coordinates remains available. Correlation measures linear association and does not establish causation."
      ],
      "chunks": [
        {
          "id": "visual-points",
          "title": "Plot size against service time",
          "kind": "example",
          "code": "plot(orders$items, orders$service_minutes, pch = 19, col = \"#397c72\",\n     main = \"Larger orders and service time\", xlab = \"Items per order\", ylab = \"Service time (minutes)\")\nprint(orders[, c(\"order_id\", \"items\", \"service_minutes\")], row.names = FALSE)\nassociation <- cor(orders$items, orders$service_minutes)\nprint(association)",
          "explanation": "A positive association means larger orders tend to take longer in these records. The model generated such a relationship; this plot alone would not prove it in observed business data.",
          "checks": [
            "association > 0.7",
            "association < 1"
          ],
          "plotAlt": "Scatterplot of item count against service minutes. Every plotted coordinate and the linear correlation are printed."
        },
        {
          "id": "visual-correlation",
          "title": "Exercise: change units",
          "kind": "exercise",
          "code": "# TODO: calculate correlation between items and service_minutes / 60 as exercise_cor.",
          "explanation": "Changing minutes to hours multiplies all times by a positive constant. Correlation stays the same, although a regression slope would change units.",
          "checks": [
            "abs(exercise_cor - association) < 1e-12"
          ],
          "answer": "exercise_cor <- cor(orders$items, orders$service_minutes / 60)\nprint(exercise_cor)"
        }
      ]
    }
  ],
  "closing": [
    "Choose plots to match the question: histograms for one numeric distribution, boxplots for grouped distributions, and scatterplots for two numeric variables. Label units, inspect records, and resist treating visual patterns as proof of a mechanism."
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
