import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-ggplot",
  "number": 9,
  "track": "practical",
  "packages": [
    "ggplot2"
  ],
  "title": "Build visualizations with ggplot2",
  "question": "How can layers reveal a pattern without hiding the data?",
  "estimatedMinutes": "60–90",
  "prerequisites": [
    "Import, prepare, and explore data with base-R plots (P1–P3). No advanced statistics required."
  ],
  "introduction": [
    "A useful chart answers a question about data. ggplot2 lets us describe that chart in layers: the table, variables mapped to visual properties, marks, scales, and labels. We will revisit the synthetic order data and compare distributions and groups rather than decorate unexplained numbers.",
    "The bundled CSV contains synthetic teaching records, not business observations. Its documented duplicate and impossible negative time are removed; missing ratings stay in the service-time analysis. Every worked chart has a numerical companion.",
    "This notebook uses ggplot2 4.0.3. The site loads its pinned packages on the first Run, then reuses them in this R session. In desktop R, install ggplot2 before running the exported script. We use the explicit package prefix ggplot2::, so each function’s origin is visible without changing the shared package search path."
  ],
  "sections": [
    {
      "id": "gg-data",
      "title": "Start with a table and a question",
      "paragraphs": [
        "An R package is a collection of functions. `ggplot2::ggplot()` calls the function named ggplot in that package; `::` is the package separator. First prepare the same 120 valid orders used in the other practical notebooks."
      ],
      "chunks": [
        {
          "id": "gg-load",
          "title": "Prepare the plotting data",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\norders$priority <- factor(orders$priority, levels = c(\"standard\", \"priority\"))\nprint(packageVersion(\"ggplot2\"))\nprint(table(orders$priority))\nprint(range(orders$service_minutes))",
          "explanation": "The category order will also control axis and legend order. This setup creates objects only in this notebook. It does not change the CSV or require earlier notebook objects.",
          "checks": [
            "nrow(orders) == 120",
            "identical(levels(orders$priority), c(\"standard\", \"priority\"))",
            "as.character(packageVersion(\"ggplot2\")) == \"4.0.3\""
          ]
        },
        {
          "id": "gg-subset",
          "title": "Exercise: inspect large orders",
          "kind": "exercise",
          "code": "# TODO: select orders with items >= 6 as exercise_large.\n# TODO: print their count and mean service time.",
          "explanation": "This is a descriptive subset. Filtering changes the population of rows summarized, so later worked examples continue using the full orders table.",
          "checks": [
            "nrow(exercise_large) == sum(orders$items >= 6)",
            "all(exercise_large$items >= 6)"
          ],
          "answer": "exercise_large <- orders[orders$items >= 6, ]\nprint(data.frame(orders = nrow(exercise_large), mean_minutes = mean(exercise_large$service_minutes)))"
        }
      ]
    },
    {
      "id": "gg-grammar",
      "title": "Build a chart one layer at a time",
      "paragraphs": [
        "`ggplot(data, aes(...))` declares a table and mappings. An aesthetic is a visual property such as horizontal position, vertical position, color, or shape; `aes(x = items, y = service_minutes)` uses unquoted column names from the table.",
        "`geom_point()` draws points. The `+` operator adds plot layers, and `labs()` gives readable titles and axis labels. Store the assembled plot in an object, then `print()` it to draw it explicitly. Put `+` at the end of a line when continuing the expression."
      ],
      "chunks": [
        {
          "id": "gg-scatter",
          "title": "Map size to x and time to y",
          "kind": "example",
          "code": "scatter <- ggplot2::ggplot(orders, ggplot2::aes(x = items, y = service_minutes)) +\n  ggplot2::geom_point(color = \"#26796f\", alpha = 0.65) +\n  ggplot2::labs(title = \"Larger orders tend to take longer\", x = \"Items per order\", y = \"Service time (minutes)\")\nprint(scatter)\nprint(orders[, c(\"order_id\", \"items\", \"service_minutes\")], row.names = FALSE)",
          "explanation": "Each point is one order; alpha controls opacity from zero (invisible) to one (opaque). Overlapping points can hide observations, so inspect the coordinate table as well. An upward pattern is association, not by itself a causal claim.",
          "checks": [
            "nrow(ggplot2::ggplot_build(scatter)$data[[1]]) == 120",
            "isTRUE(all.equal(ggplot2::ggplot_build(scatter)$data[[1]]$y, orders$service_minutes))"
          ],
          "plotAlt": "Scatterplot of item count against service minutes for 120 synthetic orders. The printed coordinate table contains every order."
        },
        {
          "id": "gg-labels",
          "title": "Exercise: make the title explicit",
          "kind": "exercise",
          "code": "# TODO: add labs(title = \"Synthetic order service times\") to scatter.\n# TODO: store exercise_title and print it.",
          "explanation": "Changing a label does not change the observations. A title should describe the scope and avoid presenting synthetic data as a real study.",
          "checks": [
            "exercise_title$labels$title == \"Synthetic order service times\"",
            "nrow(ggplot2::ggplot_build(exercise_title)$data[[1]]) == 120"
          ],
          "answer": "exercise_title <- scatter + ggplot2::labs(title = \"Synthetic order service times\")\nprint(exercise_title)"
        }
      ]
    },
    {
      "id": "gg-map",
      "title": "Map a variable or set a constant",
      "paragraphs": [
        "Inside `aes()`, `color = priority` maps group membership to color and creates a legend. Outside `aes()`, `color = \"#26796f\"` sets the same color for every point. A color name placed inside aes is treated as a data label, not as a request for that literal color.",
        "Map shape as well as color so the groups can be distinguished without color alone. Manual scales assign specific colors and shapes to category names; neither changes the underlying time values."
      ],
      "chunks": [
        {
          "id": "gg-groups",
          "title": "Show two service rules",
          "kind": "example",
          "code": "grouped <- ggplot2::ggplot(orders, ggplot2::aes(items, service_minutes, color = priority, shape = priority)) +\n  ggplot2::geom_point(size = 2, alpha = 0.75) +\n  ggplot2::scale_color_manual(values = c(standard = \"#26796f\", priority = \"#9a5616\")) +\n  ggplot2::scale_shape_manual(values = c(standard = 16, priority = 17)) +\n  ggplot2::labs(title = \"Order size and service rule\", x = \"Items per order\", y = \"Service time (minutes)\", color = \"Rule\", shape = \"Rule\")\nprint(grouped)\nprint(orders[, c(\"items\", \"service_minutes\", \"priority\")], row.names = FALSE)",
          "explanation": "Circles represent standard orders and triangles priority orders. Several points can still overlap at the same item count. Group differences may reflect more than one variable, so the later regression notebook compares rules at a fixed size.",
          "checks": [
            "length(unique(ggplot2::ggplot_build(grouped)$data[[1]]$shape)) == 2",
            "length(unique(ggplot2::ggplot_build(grouped)$data[[1]]$colour)) == 2"
          ],
          "plotAlt": "Scatterplot uses teal circles for standard and brown triangles for priority orders. Every coordinate and group label is printed."
        },
        {
          "id": "gg-theme",
          "title": "Exercise: reduce visual clutter",
          "kind": "exercise",
          "code": "# TODO: add theme_minimal(base_size = 12) to grouped, save exercise_minimal, and print.",
          "explanation": "A theme controls presentation such as fonts and background grids. It should improve legibility without changing the statistical content.",
          "checks": [
            "inherits(exercise_minimal$theme, \"theme\")",
            "nrow(ggplot2::ggplot_build(exercise_minimal)$data[[1]]) == 120"
          ],
          "answer": "exercise_minimal <- grouped + ggplot2::theme_minimal(base_size = 12)\nprint(exercise_minimal)"
        }
      ]
    },
    {
      "id": "gg-distribution",
      "title": "Choose a distribution display",
      "paragraphs": [
        "A histogram bins a numeric variable; its count heights depend on both bin width and boundary. Set these deliberately rather than accepting an unexplained default. Here five-minute bins have boundaries at multiples of five.",
        "For a numerical alternative, `ggplot_build(plot)$data[[1]]` exposes the calculated data for the first layer. The double brackets select that layer from a list. We use its bin counts or box summaries to show the values actually drawn."
      ],
      "chunks": [
        {
          "id": "gg-histogram",
          "title": "Make the binning decision visible",
          "kind": "example",
          "code": "histogram <- ggplot2::ggplot(orders, ggplot2::aes(service_minutes)) +\n  ggplot2::geom_histogram(binwidth = 5, boundary = 0, closed = \"right\", fill = \"#26796f\", color = \"white\") +\n  ggplot2::labs(title = \"Five-minute bins\", x = \"Service time (minutes)\", y = \"Orders\")\nprint(histogram)\nbin_table <- ggplot2::ggplot_build(histogram)$data[[1]][, c(\"xmin\", \"xmax\", \"count\")]\nprint(bin_table)",
          "explanation": "These heights count orders; they are not density heights or probabilities. Except at extreme boundary handling, each bin is open on the left and closed on the right. The sum of all bin counts is 120.",
          "checks": [
            "sum(bin_table$count) == 120",
            "all(abs(bin_table$xmax - bin_table$xmin - 5) < 1e-10)"
          ],
          "plotAlt": "Histogram with five-minute bins of service time. The accompanying table lists each lower boundary, upper boundary, and count."
        },
        {
          "id": "gg-bins",
          "title": "Exercise: use two-minute bins",
          "kind": "exercise",
          "code": "# TODO: make a new histogram from orders with binwidth = 2 and boundary = 0.\n# TODO: save exercise_histogram, label the axes, and print it.",
          "explanation": "Use a fresh plot so the old histogram is not retained as an extra layer. Smaller bins show finer variation; they do not create more data or establish a new population pattern.",
          "checks": [
            "sum(ggplot2::ggplot_build(exercise_histogram)$data[[1]]$count) == 120",
            "all(abs(with(ggplot2::ggplot_build(exercise_histogram)$data[[1]], xmax-xmin) - 2) < 1e-10)"
          ],
          "answer": "exercise_histogram <- ggplot2::ggplot(orders, ggplot2::aes(service_minutes)) +\n  ggplot2::geom_histogram(binwidth = 2, boundary = 0, fill = \"#26796f\", color = \"white\") +\n  ggplot2::labs(x = \"Service time (minutes)\", y = \"Orders\", title = \"Two-minute bins\")\nprint(exercise_histogram)"
        },
        {
          "id": "gg-boxplot",
          "title": "Compare spread and center by rule",
          "kind": "example",
          "code": "boxes <- ggplot2::ggplot(orders, ggplot2::aes(priority, service_minutes)) +\n  ggplot2::geom_boxplot(fill = \"#c7ded6\") +\n  ggplot2::labs(title = \"Time distributions by rule\", x = \"Service rule\", y = \"Service time (minutes)\")\nprint(boxes)\nbox_table <- ggplot2::ggplot_build(boxes)$data[[1]][, c(\"x\", \"ymin\", \"lower\", \"middle\", \"upper\", \"ymax\")]\nprint(box_table)\nprint(table(orders$priority))\nprint(orders[, c(\"priority\", \"service_minutes\")], row.names = FALSE)",
          "explanation": "In the summary table, x = 1 is standard and x = 2 is priority. The box spans the first to third quartiles with a median line; whiskers reach the most distant observations within 1.5 interquartile ranges of those quartiles. Separately marked points deserve inspection but are not automatically errors.",
          "checks": [
            "nrow(box_table) == 2",
            "all(box_table$lower <= box_table$middle)",
            "all(box_table$middle <= box_table$upper)"
          ],
          "plotAlt": "Two boxplots compare service times by rule. The table supplies whiskers and quartiles, with group counts and all individual times."
        },
        {
          "id": "gg-points",
          "title": "Exercise: show the observations on the boxes",
          "kind": "exercise",
          "code": "# TODO: add geom_point(alpha = 0.25, size = 1) to boxes as exercise_points.\n# TODO: print the result.",
          "explanation": "This adds a second layer on the same mappings. The points do not move, so overlapping observations remain possible; the printed data preserve exact values.",
          "checks": [
            "length(exercise_points$layers) == 2",
            "nrow(ggplot2::ggplot_build(exercise_points)$data[[2]]) == 120"
          ],
          "answer": "exercise_points <- boxes + ggplot2::geom_point(alpha = 0.25, size = 1)\nprint(exercise_points)"
        }
      ]
    },
    {
      "id": "gg-bars",
      "title": "Distinguish counts from calculated values",
      "paragraphs": [
        "`geom_bar()` counts rows in each category. `geom_col()` instead uses the y values supplied by a summary table. Do not use counts of summary rows as though they were group averages. Bar lengths are compared from a baseline, so keep a zero baseline for these displays."
      ],
      "chunks": [
        {
          "id": "gg-counts",
          "title": "Count orders by rule",
          "kind": "example",
          "code": "counts_plot <- ggplot2::ggplot(orders, ggplot2::aes(priority)) +\n  ggplot2::geom_bar(fill = \"#26796f\") +\n  ggplot2::labs(title = \"How many orders are in each group?\", x = \"Service rule\", y = \"Orders\")\nprint(counts_plot)\nprint(table(orders$priority))",
          "explanation": "Each source row contributes one count. Unequal group counts affect comparisons of raw frequencies; for a question about proportions, specify a denominator instead.",
          "checks": [
            "sum(ggplot2::ggplot_build(counts_plot)$data[[1]]$count) == 120"
          ],
          "plotAlt": "Bar chart of standard and priority order counts, accompanied by the exact frequency table."
        },
        {
          "id": "gg-counts-ex",
          "title": "Exercise: count shifts",
          "kind": "exercise",
          "code": "# TODO: make a geom_bar plot mapping shift to x, save exercise_shifts, and print.\n# TODO: print table(orders$shift) as a numerical alternative.",
          "explanation": "Only change the variable being counted. Shift is a categorical label here, not a continuous time measurement.",
          "checks": [
            "sum(ggplot2::ggplot_build(exercise_shifts)$data[[1]]$count) == 120",
            "length(ggplot2::ggplot_build(exercise_shifts)$data[[1]]$count) == 2"
          ],
          "answer": "exercise_shifts <- ggplot2::ggplot(orders, ggplot2::aes(shift)) +\n  ggplot2::geom_bar(fill = \"#26796f\") +\n  ggplot2::labs(x = \"Shift\", y = \"Orders\", title = \"Orders by shift\")\nprint(exercise_shifts)\nprint(table(orders$shift))"
        },
        {
          "id": "gg-means",
          "title": "Plot values you have already summarized",
          "kind": "example",
          "code": "means <- aggregate(service_minutes ~ priority, data = orders, FUN = mean)\nmeans_plot <- ggplot2::ggplot(means, ggplot2::aes(priority, service_minutes)) +\n  ggplot2::geom_col(fill = \"#26796f\") +\n  ggplot2::labs(title = \"Group averages hide individual variation\", x = \"Service rule\", y = \"Mean service time (minutes)\")\nprint(means_plot)\nprint(means)",
          "explanation": "These bars show descriptive means, not uncertainty intervals. Return to the boxplots and original observations to see spread; a difference in bar heights alone is not a test of a population difference.",
          "checks": [
            "isTRUE(all.equal(ggplot2::ggplot_build(means_plot)$data[[1]]$y, means$service_minutes))"
          ],
          "plotAlt": "Bars show mean service time for each rule with a zero baseline. The exact group means are printed; these are not confidence intervals."
        },
        {
          "id": "gg-medians",
          "title": "Exercise: plot group medians",
          "kind": "exercise",
          "code": "# TODO: calculate median service time by priority as exercise_medians.\n# TODO: plot those values with geom_col as exercise_median_plot, and print both.",
          "explanation": "A median answers a different center question from a mean. Label the y axis with both the summary and its units.",
          "checks": [
            "isTRUE(all.equal(exercise_medians$service_minutes, aggregate(service_minutes ~ priority, orders, median)$service_minutes))",
            "isTRUE(all.equal(ggplot2::ggplot_build(exercise_median_plot)$data[[1]]$y, exercise_medians$service_minutes))"
          ],
          "answer": "exercise_medians <- aggregate(service_minutes ~ priority, data = orders, FUN = median)\nexercise_median_plot <- ggplot2::ggplot(exercise_medians, ggplot2::aes(priority, service_minutes)) +\n  ggplot2::geom_col(fill = \"#26796f\") +\n  ggplot2::labs(x = \"Service rule\", y = \"Median service time (minutes)\")\nprint(exercise_median_plot)\nprint(exercise_medians)"
        }
      ]
    },
    {
      "id": "gg-facets",
      "title": "Use panels to separate groups",
      "paragraphs": [
        "`facet_wrap(~ priority)` makes one panel for each rule. The tilde introduces the grouping formula. Fixed scales, the default, make positions comparable across panels; free scales can make similarly shaped panels conceal very different ranges."
      ],
      "chunks": [
        {
          "id": "gg-panels",
          "title": "Compare relationships on common scales",
          "kind": "example",
          "code": "panels <- scatter + ggplot2::facet_wrap(~ priority, nrow = 1) +\n  ggplot2::labs(title = \"Same axes, separate service rules\")\nprint(panels)\nprint(orders[, c(\"priority\", \"items\", \"service_minutes\")], row.names = FALSE)",
          "explanation": "Each panel contains only that rule’s observations, but both use the same x and y scales. Smaller groups have fewer points, so do not confuse a sparser panel with a smaller spread.",
          "checks": [
            "length(unique(ggplot2::ggplot_build(panels)$data[[1]]$PANEL)) == 2",
            "nrow(ggplot2::ggplot_build(panels)$data[[1]]) == 120"
          ],
          "plotAlt": "Two scatterplot panels, one per service rule, share item-count and minute scales. Every coordinate and panel label is printed."
        },
        {
          "id": "gg-facets-ex",
          "title": "Exercise: separate shifts",
          "kind": "exercise",
          "code": "# TODO: add facet_wrap(~ shift, ncol = 1) to scatter as exercise_panels.\n# TODO: print it and the counts by shift.",
          "explanation": "Two vertically stacked panels can be easier to read on a narrow screen. Keep common scales so the comparison remains fair.",
          "checks": [
            "length(unique(ggplot2::ggplot_build(exercise_panels)$data[[1]]$PANEL)) == 2",
            "exercise_panels$facet$params$ncol == 1"
          ],
          "answer": "exercise_panels <- scatter + ggplot2::facet_wrap(~ shift, ncol = 1) +\n  ggplot2::labs(title = \"Service time by shift\")\nprint(exercise_panels)\nprint(table(orders$shift))"
        }
      ]
    },
    {
      "id": "gg-communicate",
      "title": "Make a chart that stands on its own",
      "paragraphs": [
        "Use a title that states scope, axis labels with units, and a caption that identifies the data source. A theme changes presentation, not evidence. Keep the numerical alternative with your chart, and do not choose axis limits or bins simply to exaggerate a desired difference."
      ],
      "chunks": [
        {
          "id": "gg-final",
          "title": "Finish a readable comparison",
          "kind": "example",
          "code": "finished <- grouped + ggplot2::theme_minimal(base_size = 12) +\n  ggplot2::theme(legend.position = \"bottom\") +\n  ggplot2::labs(title = \"Synthetic order service times\", subtitle = \"120 valid orders; size and service rule shown\",\n                caption = \"Original synthetic teaching data. Not evidence about a business.\")\nprint(finished)\nprint(orders[, c(\"order_id\", \"items\", \"service_minutes\", \"priority\")], row.names = FALSE)",
          "explanation": "The explicit group shapes and labels remain useful without color. Use the Download plot PNG link below the image to save the displayed figure. In desktop R, ggplot2 also offers ggsave(); this site’s download link saves the actual browser-rendered PNG.",
          "checks": [
            "finished$labels$title == \"Synthetic order service times\"",
            "finished$theme$legend.position == \"bottom\"",
            "nrow(ggplot2::ggplot_build(finished)$data[[1]]) == 120"
          ],
          "plotAlt": "Finished labeled scatterplot of 120 synthetic orders, with color and shape indicating rule, units on both axes, and a source caption. The full plotted table is printed."
        },
        {
          "id": "gg-caption",
          "title": "Exercise: state the cleaning decision",
          "kind": "exercise",
          "code": "# TODO: replace the caption on finished with a note mentioning the duplicate and negative time.\n# TODO: save exercise_caption and print it.",
          "explanation": "A chart caption can make data decisions visible. Keep a reference to the synthetic source so the figure is not mistaken for real operational evidence.",
          "checks": [
            "grepl(\"duplicate\", exercise_caption$labels$caption)",
            "grepl(\"negative\", exercise_caption$labels$caption)"
          ],
          "answer": "exercise_caption <- finished + ggplot2::labs(caption = \"Synthetic data: removed one duplicate and one negative time.\")\nprint(exercise_caption)"
        }
      ]
    }
  ],
  "closing": [
    "A chart is a set of choices about variables, summaries, visual encodings, and comparisons. ggplot2 makes those choices explicit through mappings and layers. Counts, means, distributions, and uncertainty answer different questions; label the one you actually show.",
    "Use plots to inspect data and communicate patterns, with numerical alternatives and honest scope. The following practical notebooks add confidence intervals, tests, and regression; a visual contrast on its own is not a population inference or proof of causation."
  ],
  "references": [
    {
      "title": "ggplot2: plot construction and aesthetics",
      "url": "https://ggplot2.tidyverse.org/reference/ggplot.html"
    },
    {
      "title": "ggplot2: histograms",
      "url": "https://ggplot2.tidyverse.org/reference/geom_histogram.html"
    },
    {
      "title": "ggplot2: counts versus supplied bar heights",
      "url": "https://ggplot2.tidyverse.org/reference/geom_bar.html"
    },
    {
      "title": "ggplot2: faceting",
      "url": "https://ggplot2.tidyverse.org/reference/facet_wrap.html"
    }
  ]
};
