"""Original synthetic teaching data; Python standard library, seed 20261012."""
import csv, random
from pathlib import Path
rng = random.Random(20261012)
rows = []
for i in range(1, 121):
    items = rng.randint(1, 8)
    priority = rng.choice(['standard', 'priority'])
    shift = rng.choice(['morning', 'afternoon'])
    minutes = round(12 + 2.5 * items - 4 * (priority == 'priority') + rng.gauss(0, 2), 2)
    rating = '' if i % 10 == 0 else rng.randint(2, 5)
    rows.append([f'O{i:03}', items, minutes, priority, shift, rating])
# Exact duplicate and a separate, invalid record, deliberately added for cleaning.
rows += [rows[0].copy(), ['O121', 3, -5, 'standard', 'morning', 4]]
with Path('public/data/orders.csv').open('w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['order_id', 'items', 'service_minutes', 'priority', 'shift', 'rating'])
    writer.writerows(rows)
