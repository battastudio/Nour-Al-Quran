// Pin a far-east timezone (UTC+14) for deterministic prayer-schedule tests. adhan-js
// returns absolute instants; a midnight `from` in the runner TZ must precede every test
// city's day-0 Fajr for the "day 0 = all 5 future" premise to hold (Jakarta UTC+7 would
// otherwise fall before UTC-midnight in CI). Node re-reads TZ on this assignment.
process.env.TZ = 'Etc/GMT-14';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
