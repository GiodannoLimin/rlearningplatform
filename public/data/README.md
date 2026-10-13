# Synthetic orders teaching dataset

Original data created for Statistics with R, October 2026. Not collected from
people or a business. Released under CC0 1.0 (public-domain dedication):
https://creativecommons.org/publicdomain/zero/1.0/

Source generator: scripts/generate-practical-data.py in the project source.
Python standard-library Random, seed 20261012. 120 independent intended orders.
Item count is uniform from 1–8; priority and shift are sampled independently
with equal category probabilities. Service minutes = 12 + 2.5 * items - 4 *
(priority rule) + independent normal noise with mean 0 and SD 2 minutes, rounded
to two decimals. No real operational mechanism is claimed. The generator is a
stipulated teaching model, not a fitted model from observed data.

Columns:
- order_id: unique order label, O001–O120 for valid orders; text, no units.
- items: integer count of items, 1–8.
- service_minutes: elapsed service time, minutes, two decimals.
- priority: standard or priority, randomly assigned in the generator.
- shift: morning or afternoon, independent label; no true effect in this model.
- rating: ordinal category 1–5; observed values generated uniformly from 2–5.
  Blank means missing, never zero. Every tenth intended row has missing rating
  (12 blanks). This missingness schedule is independent of generated responses.

File format: UTF-8, comma separator, header, decimal point. 122 rows:
120 intended orders, then an exact repeat of O001, then a deliberately invalid
O121 row with service_minutes = -5. These appended rows are documented errors
for cleaning exercises. Retain the first copy of each ID and exclude impossible
negative times to recover 120 rows. Keep missing-rating rows when analyzing time.
Do not generalize these cleaning rules to undocumented real duplicates.

Place orders.csv inside a data folder in your R working directory when running
exported scripts in desktop R. The browser app mounts it there automatically.
