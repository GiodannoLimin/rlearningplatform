import type { Notebook } from './schema';
export const notebook: Notebook = {
  "id": "data-regression",
  "number": 11,
  "track": "practical",
  "title": "Fit and check linear regression",
  "question": "How does service time change with order size and priority?",
  "estimatedMinutes": "60–80",
  "prerequisites": [
    "Explore data with plots; compare groups with uncertainty."
  ],
  "introduction": [
    "The bundled orders.csv is original synthetic teaching data, not observations from a business. Each intended row represents one order. Its generator assigns priority independently of order size and generates service times; conclusions describe this teaching model, not evidence about a real service.",
    "Regression describes a conditional mean and can predict outcomes. We start with size alone, then add priority. A useful analysis interprets coefficients in units, checks residuals, and states where predictions apply."
  ],
  "sections": [
    {
      "id": "regression-line",
      "title": "Fit a line with a clear meaning",
      "paragraphs": [
        "The model is \\(Y_i=\\beta_0+\\beta_1 x_i+\\varepsilon_i\\). For order \\(i\\), \\(Y_i\\) is service minutes, \\(x_i\\) is item count, \\(\\beta_0\\) is the intercept, \\(\\beta_1\\) is the slope in minutes per item, and \\(\\varepsilon_i\\) is the deviation from the conditional mean.",
        "`lm(response ~ predictor, data = table)` fits coefficients by minimizing the sum of squared residuals. A residual is an observed time minus its fitted time. A straight line can be calculated even when its assumptions are poor."
      ],
      "chunks": [
        {
          "id": "regression-simple",
          "title": "Fit time against item count",
          "kind": "example",
          "code": "raw <- read.csv(\"data/orders.csv\", na.strings = c(\"\", \"NA\"), stringsAsFactors = FALSE)\norders <- raw[!duplicated(raw$order_id), ]\norders <- orders[!is.na(orders$service_minutes) & orders$service_minutes >= 0, ]\nsimple <- lm(service_minutes ~ items, data = orders)\nprint(coef(simple))\nprint(data.frame(items = 1:8, fitted_minutes = predict(simple, newdata = data.frame(items = 1:8))))",
          "explanation": "The slope estimates the change in mean time associated with one more item. The intercept predicts at zero items, outside this dataset’s observed range of 1–8, so avoid giving it an unsupported operational interpretation.",
          "checks": [
            "coef(simple)[\"items\"] > 2",
            "coef(simple)[\"items\"] < 3"
          ]
        },
        {
          "id": "regression-units",
          "title": "Exercise: express the slope in hours",
          "kind": "exercise",
          "code": "# TODO: fit service_minutes / 60 against items using lm().\n# TODO: save exercise_hours and print its coefficients.",
          "explanation": "Wrap arithmetic on the response in `I()` inside an R formula so it is treated as arithmetic. The slope’s numeric value depends on units.",
          "checks": [
            "abs(coef(exercise_hours)[\"items\"] - coef(simple)[\"items\"]/60) < 1e-10"
          ],
          "answer": "exercise_hours <- lm(I(service_minutes / 60) ~ items, data = orders)\nprint(coef(exercise_hours))"
        }
      ]
    },
    {
      "id": "regression-adjust",
      "title": "Compare rules at the same item count",
      "paragraphs": [
        "Add an indicator \\(I_i\\), equal to 1 for priority and 0 for standard: \\(E(Y_i\\mid x_i,I_i)=\\beta_0+\\beta_1 x_i+\\beta_2 I_i\\). Here \\(E\\) denotes expectation and \\(\\beta_2\\) is priority minus standard in minutes at the same size. This model assumes parallel lines, with no size-by-priority interaction.",
        "`factor()` defines categories; its `levels` argument puts standard first, making it the reference group. This explicit ordering prevents the coefficient’s direction from depending on alphabetical order."
      ],
      "chunks": [
        {
          "id": "regression-multiple",
          "title": "Add the service rule",
          "kind": "example",
          "code": "orders$priority <- factor(orders$priority, levels = c(\"standard\", \"priority\"))\nfit <- lm(service_minutes ~ items + priority, data = orders)\nprint(summary(fit)$coefficients)\nprint(confint(fit))",
          "explanation": "The coefficient named `prioritypriority` is the adjusted priority-minus-standard contrast. The coefficient table shows estimates, estimated standard errors, t statistics, and two-sided p-values for zero coefficients; `confint()` prints 95% intervals by default. Normal-error inference assumes independent errors with a linear conditional mean and constant variance; these match the synthetic generator apart from cent-level rounding. Real datasets need their own justification.",
          "checks": [
            "abs(coef(fit)[\"items\"] - 2.5) < 0.4",
            "abs(coef(fit)[\"prioritypriority\"] + 4) < 1.5"
          ]
        },
        {
          "id": "regression-contrast",
          "title": "Exercise: calculate an adjusted improvement",
          "kind": "exercise",
          "code": "# TODO: negate the prioritypriority coefficient and save exercise_improvement.",
          "explanation": "Negating expresses standard minus priority, matching the previous notebook’s direction. Adjustment changes the estimate; it does not by itself turn observational data into a randomized experiment.",
          "checks": [
            "abs(exercise_improvement + unname(coef(fit)[\"prioritypriority\"])) < 1e-10"
          ],
          "answer": "exercise_improvement <- -unname(coef(fit)[\"prioritypriority\"])\nprint(exercise_improvement)"
        }
      ]
    },
    {
      "id": "regression-residuals",
      "title": "Inspect what the model missed",
      "paragraphs": [
        "Residuals plotted against fitted values should not show a strong curve or systematic change in spread if this mean/variance model is adequate. A normal Q–Q comparison examines the error distribution; it cannot check independence, which depends on how observations were collected."
      ],
      "chunks": [
        {
          "id": "regression-diagnostics",
          "title": "Inspect residual patterns",
          "kind": "example",
          "code": "diagnostics <- data.frame(order_id = orders$order_id, fitted = fitted(fit), residual = residuals(fit))\npar(mfrow = c(1, 2))\nplot(diagnostics$fitted, diagnostics$residual, pch = 19, col = \"#397c72\",\n     xlab = \"Fitted time (minutes)\", ylab = \"Residual (minutes)\", main = \"Residuals versus fitted\")\nabline(h = 0, lty = 2)\nqq <- qqnorm(residuals(fit), main = \"Residual normal Q-Q\", ylab = \"Residual (minutes)\")\nqqline(residuals(fit))\npar(mfrow = c(1, 1))\nprint(diagnostics, row.names = FALSE)\nprint(data.frame(normal_quantile = qq$x, residual_minutes = qq$y))",
          "explanation": "Both plots have numerical alternatives. Roughly even scatter and a roughly straight Q–Q pattern are diagnostic evidence, not proof that assumptions hold. A large residual deserves investigation, not automatic deletion.",
          "checks": [
            "nrow(diagnostics) == 120",
            "abs(mean(diagnostics$residual)) < 1e-10"
          ],
          "plotAlt": "Two panels show residuals versus fitted service time and a normal Q-Q plot. Both coordinate tables are printed for a numerical alternative."
        },
        {
          "id": "regression-residual-ex",
          "title": "Exercise: inspect the largest residual",
          "kind": "exercise",
          "code": "# TODO: use which.max(abs(diagnostics$residual)) to select exercise_unusual from diagnostics.",
          "explanation": "`abs()` measures departure in either direction, and `which.max()` returns a row position. The selected point may be entirely plausible under the model.",
          "checks": [
            "nrow(exercise_unusual) == 1",
            "abs(exercise_unusual$residual) == max(abs(diagnostics$residual))"
          ],
          "answer": "exercise_unusual <- diagnostics[which.max(abs(diagnostics$residual)), ]\nprint(exercise_unusual)"
        }
      ]
    },
    {
      "id": "regression-predict",
      "title": "Distinguish a mean prediction from an individual prediction",
      "paragraphs": [
        "`newdata` must have predictor names and compatible category labels. A confidence interval describes uncertainty in the conditional mean; a prediction interval also allows an individual outcome to deviate from that mean, so it is wider. Both rely on the fitted model continuing to apply."
      ],
      "chunks": [
        {
          "id": "regression-intervals",
          "title": "Predict a four-item priority order",
          "kind": "example",
          "code": "new_order <- data.frame(items = 4, priority = \"priority\")\nmean_interval <- predict(fit, newdata = new_order, interval = \"confidence\")\nindividual_interval <- predict(fit, newdata = new_order, interval = \"prediction\")\nprint(mean_interval)\nprint(individual_interval)",
          "explanation": "These predictions stay inside the observed item-count range. They describe the synthetic process, not a promise to a customer. Extrapolating to 50 items would require assumptions not assessed with 1–8-item orders.",
          "checks": [
            "individual_interval[1,\"lwr\"] < mean_interval[1,\"lwr\"]",
            "individual_interval[1,\"upr\"] > mean_interval[1,\"upr\"]"
          ]
        },
        {
          "id": "regression-new",
          "title": "Exercise: compare rules for six items",
          "kind": "exercise",
          "code": "# TODO: make a two-row data frame with items = 6 and the two priority labels.\n# TODO: save predict(fit, newdata = ..., interval = \"prediction\") as exercise_predictions.",
          "explanation": "Order the rows standard then priority. Parallel lines imply the same fitted rule difference at each size, though interval widths can change.",
          "checks": [
            "nrow(exercise_predictions) == 2",
            "abs(exercise_predictions[2,\"fit\"] - exercise_predictions[1,\"fit\"] - coef(fit)[\"prioritypriority\"]) < 1e-10"
          ],
          "answer": "exercise_new <- data.frame(items = c(6, 6), priority = c(\"standard\", \"priority\"))\nexercise_predictions <- predict(fit, newdata = exercise_new, interval = \"prediction\")\nprint(exercise_predictions)"
        }
      ]
    },
    {
      "id": "regression-evaluate",
      "title": "Measure prediction error away from the fitting rows",
      "paragraphs": [
        "In-sample fit is optimistic as a measure of future prediction performance. Reserve a reproducible test subset, fit on the remaining rows, and compute test root mean squared error: the square root of the average squared prediction error, in minutes. A single split has variability and is not a substitute for external validation."
      ],
      "chunks": [
        {
          "id": "regression-holdout",
          "title": "Try a small holdout evaluation",
          "kind": "example",
          "code": "set.seed(410)\ntrain_rows <- sample(seq_len(nrow(orders)), size = 90)\ntraining <- orders[train_rows, ]\ntesting <- orders[-train_rows, ]\ntraining_fit <- lm(service_minutes ~ items + priority, data = training)\ntest_prediction <- predict(training_fit, newdata = testing)\ntest_rmse <- sqrt(mean((testing$service_minutes - test_prediction)^2))\nbaseline_rmse <- sqrt(mean((testing$service_minutes - mean(training$service_minutes))^2))\nprint(data.frame(test_orders = nrow(testing), model_rmse_minutes = test_rmse, baseline_rmse_minutes = baseline_rmse))",
          "explanation": "The baseline predicts the training mean for every test order. Keep test outcomes out of model fitting and model selection; repeatedly choosing a model from this test result would use up its role as an untouched assessment.",
          "checks": [
            "nrow(testing) == 30",
            "test_rmse < baseline_rmse",
            "test_rmse > 0"
          ]
        },
        {
          "id": "regression-mae",
          "title": "Exercise: measure typical absolute error",
          "kind": "exercise",
          "code": "# TODO: compute mean absolute test prediction error as exercise_mae.",
          "explanation": "Mean absolute error uses absolute differences instead of squared differences. It is less dominated by large errors and stays in minutes.",
          "checks": [
            "abs(exercise_mae - mean(abs(testing$service_minutes - test_prediction))) < 1e-10",
            "exercise_mae <= test_rmse"
          ],
          "answer": "exercise_mae <- mean(abs(testing$service_minutes - test_prediction))\nprint(exercise_mae)"
        }
      ]
    }
  ],
  "closing": [
    "A regression is a model of a relationship, not an automatic explanation of its cause. Interpret coefficients with their reference groups and units, inspect residuals, distinguish prediction from estimation, and evaluate predictions on data not used to fit the model."
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
