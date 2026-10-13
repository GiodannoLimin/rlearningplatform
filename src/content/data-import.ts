import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-import",
  "number": 6,
  "track": "practical",
  "title": "Import and inspect a CSV",
  "question": "What is actually inside this table?",
  "estimatedMinutes": "45–65",
  "prerequisites": [
    "R essentials: vectors, indexing, comparisons, and functions."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "The file is already available to R as data/orders.csv. Read it into an object in this notebook; other notebooks have separate objects. Download the CSV from the dataset link if you want to run the script in desktop R, keeping it inside a data folder."
  ],
  "sections": [
    {
      "id": "import-file",
      "title": "Read the file before analyzing it",
      "paragraphs": [
        "CSV means comma-separated values: a header names the columns and each later line records a row. `read.csv()` creates a data frame, a table whose columns can have different types. `na.strings` lists text that should become missing values; `stringsAsFactors = FALSE` keeps text columns as text."
      ],
      "chunks": [
        {
          "id": "import-read",
          "title": "Read the bundled CSV",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\nhead(raw)\ndim(raw)\nnames(raw)",
          "explanation": "`head()` shows the first six rows. `dim()` reports rows then columns: 122 and 6. There are 120 intended orders plus two deliberately added problem rows; importing successfully does not mean the data are ready for analysis.",
          "checks": [
            "nrow(raw) == 122",
            "ncol(raw) == 6"
          ]
        },
        {
          "id": "import-tail",
          "title": "Exercise: inspect the end of the file",
          "kind": "exercise",
          "code": "# TODO: use tail(raw, 3) and save its result as exercise_last.\n# TODO: print the result.",
          "explanation": "Look at the final three rows. Compare the repeated order ID and the negative service time with the column definitions.",
          "checks": [
            "nrow(exercise_last) == 3",
            "tail(exercise_last$service_minutes, 1) == -5"
          ],
          "answer": "exercise_last <- tail(raw, 3)\nprint(exercise_last)"
        }
      ]
    },
    {
      "id": "import-types",
      "title": "Separate labels from measurements",
      "paragraphs": [
        "`str()` reports column types and sample entries. An order ID is a label even if part of it looks numeric; items is a count, service time is in minutes, and rating is an ordinal scale from 1 to 5. Arithmetic on a label is meaningless, and a one-point rating difference need not have the same meaning everywhere on that scale."
      ],
      "chunks": [
        {
          "id": "import-structure",
          "title": "Inspect types and one column",
          "kind": "example",
          "code": "str(raw)\nclass(raw$order_id)\nclass(raw$service_minutes)\nhead(raw$items)",
          "explanation": "The dollar sign selects a named column as a vector. `class()` describes its type. R infers types from the file, so always check; a stray word in a numeric column can change the import.",
          "checks": [
            "is.character(raw$order_id)",
            "is.numeric(raw$service_minutes)"
          ]
        },
        {
          "id": "import-column",
          "title": "Exercise: extract the rating column",
          "kind": "exercise",
          "code": "# TODO: save raw$rating as exercise_rating and print its class.",
          "explanation": "Selecting a column preserves its missing entries. Missing does not mean zero or the lowest rating.",
          "checks": [
            "identical(exercise_rating, raw$rating)"
          ],
          "answer": "exercise_rating <- raw$rating\nclass(exercise_rating)"
        }
      ]
    },
    {
      "id": "import-select",
      "title": "Select rows and columns deliberately",
      "paragraphs": [
        "A data frame uses `table[rows, columns]`; leaving either position empty keeps all entries in that dimension. Column names in this bracket form are quoted strings. Unlike the dollar sign, this form can select several columns at once."
      ],
      "chunks": [
        {
          "id": "import-slice",
          "title": "Make a small view",
          "kind": "example",
          "code": "view <- raw[1:4, c(\"order_id\", \"items\", \"service_minutes\")]\nprint(view)\nprint(raw[raw$priority == \"priority\", c(\"order_id\", \"priority\")][1:4, ])",
          "explanation": "The first view has four rows and three columns. The second expression first selects priority orders, then the first four rows of that result. These are views for inspection, not changes to the source file.",
          "checks": [
            "nrow(view) == 4",
            "ncol(view) == 3"
          ]
        },
        {
          "id": "import-select-ex",
          "title": "Exercise: select five IDs and shifts",
          "kind": "exercise",
          "code": "# TODO: save rows 1:5 of order_id and shift as exercise_view.",
          "explanation": "Use a character vector of column names. Keep the comma between the row and column selections.",
          "checks": [
            "identical(dim(exercise_view), c(5L, 2L))",
            "identical(names(exercise_view), c(\"order_id\", \"shift\"))"
          ],
          "answer": "exercise_view <- raw[1:5, c(\"order_id\", \"shift\")]\nprint(exercise_view)"
        }
      ]
    },
    {
      "id": "import-audit",
      "title": "Count problems before making decisions",
      "paragraphs": [
        "`is.na()` identifies missing values; `sum()` counts TRUE entries. `duplicated()` flags later occurrences, not the first occurrence. Here IDs should be unique, and a service time cannot be negative."
      ],
      "chunks": [
        {
          "id": "import-audit-code",
          "title": "A first quality audit",
          "kind": "example",
          "code": "audit <- data.frame(rows = nrow(raw), repeated_ids = sum(duplicated(raw$order_id)),\n                    negative_times = sum(raw$service_minutes < 0, na.rm = TRUE),\n                    missing_ratings = sum(is.na(raw$rating)))\nprint(audit)",
          "explanation": "Expect one repeated ID, one negative time, and 12 missing ratings. Do not drop every row with any missing entry: a missing rating does not make its measured service time unusable.",
          "checks": [
            "audit$repeated_ids == 1",
            "audit$negative_times == 1",
            "audit$missing_ratings == 12"
          ]
        },
        {
          "id": "import-missing",
          "title": "Exercise: inspect missing ratings",
          "kind": "exercise",
          "code": "# TODO: select rows with is.na(raw$rating), save exercise_missing, and print their IDs.",
          "explanation": "Logical indexing makes the affected records visible. The next notebook will distinguish cleaning a measurement problem from discarding an otherwise usable row.",
          "checks": [
            "nrow(exercise_missing) == 12",
            "all(is.na(exercise_missing$rating))"
          ],
          "answer": "exercise_missing <- raw[is.na(raw$rating), ]\nprint(exercise_missing$order_id)"
        }
      ]
    }
  ],
  "closing": [
    "Importing is the start of analysis. Establish the row unit, column meanings, units, missing-value convention, and known quality rules before calculating a summary. The next notebook turns the audit into explicit, reproducible cleaning steps."
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
